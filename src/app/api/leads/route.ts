import { NextResponse } from "next/server";
import { sendLeadEmail } from "@/game/server/sendLeadEmail";

/**
 * Lead intake for Ashen Reach "Start a Project".
 * Validates payload server-side. Email delivery uses server env only
 * (never expose API keys or provider errors to the browser).
 */

export const runtime = "nodejs";

/** Soft body size guard (~16 KiB JSON). */
const MAX_BODY_BYTES = 16_384;

interface LeadBody {
  name?: unknown;
  company?: unknown;
  email?: unknown;
  need?: unknown;
  description?: unknown;
  contact?: unknown;
  when?: unknown;
  /** Honeypot — must be empty. Bots that fill it get a silent fake success. */
  website?: unknown;
}

const NEEDS = new Set(["website", "webapp", "automation", "discuss"]);
const CONTACTS = new Set(["phone", "zoom", "teams", "email"]);

function asRequiredString(v: unknown, max: number): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  if (!t || t.length > max) return null;
  return t;
}

function asOptionalString(v: unknown, max: number): string | null {
  if (v === undefined || v === null) return "";
  if (typeof v !== "string") return null;
  const t = v.trim();
  if (t.length > max) return null;
  return t;
}

function clientError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") || "0");
  if (contentLength > MAX_BODY_BYTES) {
    return clientError("Request too large.", 413);
  }

  let raw: string;
  try {
    raw = await request.text();
  } catch {
    return clientError("Invalid request.");
  }
  if (raw.length > MAX_BODY_BYTES) {
    return clientError("Request too large.", 413);
  }

  let body: LeadBody;
  try {
    body = JSON.parse(raw) as LeadBody;
  } catch {
    return clientError("Invalid JSON.");
  }

  // Honeypot: pretend success so bots stop; do not email.
  if (typeof body.website === "string" && body.website.trim() !== "") {
    console.info("[lead] honeypot tripped — discarded");
    return NextResponse.json({ ok: true, delivered: true });
  }

  const name = asRequiredString(body.name, 120);
  const email = asRequiredString(body.email, 200);
  const description = asRequiredString(body.description, 4000);
  const company = asOptionalString(body.company, 160);
  const when = asOptionalString(body.when, 200);
  const need = typeof body.need === "string" ? body.need.trim() : "";
  const contact = typeof body.contact === "string" ? body.contact.trim() : "";

  if (!name || !email || !description) {
    return clientError("Name, email, and project description are required.");
  }
  if (company === null || when === null) {
    return clientError("Invalid field values.");
  }
  if (!NEEDS.has(need)) {
    return clientError("Please choose a valid service option.");
  }
  if (!CONTACTS.has(contact)) {
    return clientError("Please choose a valid contact method.");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return clientError("Please enter a valid email address.");
  }

  const lead = {
    name,
    company,
    email,
    need,
    description,
    contact,
    when,
  };

  console.info("[lead]", {
    name,
    company: company || null,
    email,
    need,
    contact,
    when: when || null,
    descriptionLength: description.length,
  });

  try {
    const { delivered } = await sendLeadEmail(lead);
    return NextResponse.json({ ok: true, delivered });
  } catch (err) {
    console.error("[lead] unexpected", err);
    // Accept the lead in logs; avoid leaking internals.
    return NextResponse.json({ ok: true, delivered: false });
  }
}

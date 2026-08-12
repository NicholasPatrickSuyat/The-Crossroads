/**
 * Server-only lead email delivery (Mordor → inquiry inbox).
 * Secrets stay in env — never import this into client components.
 */

import { PORTFOLIO } from "@/game/config/portfolio";

export interface LeadPayload {
  name: string;
  company: string;
  email: string;
  need: string;
  description: string;
  contact: string;
  when: string;
}

const NEED_LABELS: Record<string, string> = {
  website: "Website",
  webapp: "Web App / Software",
  automation: "Automation",
  discuss: "Not sure / want to discuss",
};

const CONTACT_LABELS: Record<string, string> = {
  phone: "Phone",
  zoom: "Zoom",
  teams: "Teams",
  email: "Email",
};

export function isLeadEmailConfigured(): boolean {
  return Boolean(
    process.env.RESEND_API_KEY?.trim() && process.env.LEAD_FROM_EMAIL?.trim(),
  );
}

export function leadInboxAddress(): string {
  return process.env.LEAD_TO_EMAIL?.trim() || PORTFOLIO.inquiryEmail;
}

function formatLeadText(lead: LeadPayload): string {
  const service =
    NEED_LABELS[lead.need] ?? lead.need;
  const method =
    CONTACT_LABELS[lead.contact] ?? lead.contact;

  return [
    "New Project Request",
    "",
    `Name: ${lead.name}`,
    `Business / Company: ${lead.company || "(not provided)"}`,
    `Contact Email: ${lead.email}`,
    `Requested Service: ${service}`,
    "",
    "Project Description:",
    lead.description,
    "",
    `Preferred Contact Method: ${method}`,
    `Preferred Day / Time: ${lead.when || "(not provided)"}`,
  ].join("\n");
}

/**
 * Send via Resend HTTP API when configured.
 * Returns delivered=false when provider credentials are missing (lead still logged).
 * Never throw provider details to callers for client exposure.
 */
export async function sendLeadEmail(
  lead: LeadPayload,
): Promise<{ delivered: boolean }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.LEAD_FROM_EMAIL?.trim();
  const to = leadInboxAddress();

  if (!apiKey || !from) {
    console.info("[lead] email not configured — logged only");
    return { delivered: false };
  }

  try {
    const inbox = to.toLowerCase();
    console.info("[lead] mail meta", {
      from,
      to: inbox,
      replyTo: lead.email,
    });

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [inbox],
        // Resend supports reply_to for prospect replies (not a client header).
        reply_to: lead.email,
        subject: `New Project Request — ${lead.name}`,
        text: formatLeadText(lead),
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error("[lead] Resend error", res.status, detail.slice(0, 500));
      return { delivered: false };
    }

    return { delivered: true };
  } catch (err) {
    console.error("[lead] send failed", err);
    return { delivered: false };
  }
}

"use client";

/**
 * Ashen Reach — Start a Project / Request a Service (lead generation).
 * Submits to /api/leads (server-side). No secrets in the client.
 */

import { useEffect, type FormEvent, useState } from "react";

interface MordorScreenProps {
  onClose: () => void;
}

type Need =
  | "website"
  | "webapp"
  | "automation"
  | "discuss";

type ContactMethod = "phone" | "zoom" | "teams" | "email";

type SubmitState = "idle" | "sending" | "ok" | "error";

export function MordorScreen({ onClose }: MordorScreenProps) {
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [need, setNeed] = useState<Need>("website");
  const [description, setDescription] = useState("");
  const [contact, setContact] = useState<ContactMethod>("email");
  const [when, setWhen] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [status, setStatus] = useState<SubmitState>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [delivered, setDelivered] = useState(true);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setErrorMsg("");
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          company,
          email,
          need,
          description,
          contact,
          when,
          website: honeypot,
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(data?.error ?? "Request failed");
      }
      const data = (await res.json().catch(() => null)) as {
        delivered?: boolean;
      } | null;
      setDelivered(data?.delivered !== false);
      setStatus("ok");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  return (
    <div
      className="dest dest--mordor"
      role="dialog"
      aria-labelledby="ashen-title"
    >
      <div className="dest__panel">
        <header className="dest__header">
          <p className="dest__eyebrow">Ashen Reach</p>
          <h2 id="ashen-title" className="dest__title">
            Start a Project
          </h2>
          <button type="button" className="dest__close" onClick={onClose}>
            Return to Crossroads
          </button>
        </header>

        <div className="dest__body">
          <p className="dest__lead">
            Request a website, web app, automation, or a call to discuss what
            you need. This is where we begin working together.
          </p>

          {status === "ok" ? (
            <div className="lead-success">
              <h3>Message received</h3>
              <p>
                {delivered
                  ? "Thanks — your request is in. I&apos;ll follow up using your preferred contact method."
                  : "Thanks — your request was received. Email delivery is being configured; your details were logged securely on the server."}
              </p>
              <button type="button" className="dest__close" onClick={onClose}>
                Back to the Crossroads
              </button>
            </div>
          ) : (
            <form className="lead-form" onSubmit={handleSubmit}>
              {/* Honeypot — hidden from humans; bots that fill it are discarded. */}
              <label className="lead-form__honeypot" aria-hidden="true">
                <span>Website</span>
                <input
                  type="text"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                />
              </label>

              <label className="lead-form__field">
                <span>Name</span>
                <input
                  required
                  name="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  enterKeyHint="next"
                />
              </label>

              <label className="lead-form__field">
                <span>Business / Company</span>
                <input
                  name="company"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  autoComplete="organization"
                  enterKeyHint="next"
                />
              </label>

              <label className="lead-form__field">
                <span>Email</span>
                <input
                  required
                  type="email"
                  name="email"
                  inputMode="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  enterKeyHint="next"
                />
              </label>

              <label className="lead-form__field">
                <span>What do you need?</span>
                <select
                  name="need"
                  value={need}
                  onChange={(e) => setNeed(e.target.value as Need)}
                >
                  <option value="website">Website</option>
                  <option value="webapp">Web App / Software</option>
                  <option value="automation">Automation</option>
                  <option value="discuss">Not sure / want to discuss</option>
                </select>
              </label>

              <label className="lead-form__field">
                <span>Short project description</span>
                <textarea
                  required
                  name="description"
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  enterKeyHint="next"
                />
              </label>

              <label className="lead-form__field">
                <span>Preferred contact method</span>
                <select
                  name="contact"
                  value={contact}
                  onChange={(e) => setContact(e.target.value as ContactMethod)}
                >
                  <option value="phone">Phone</option>
                  <option value="zoom">Zoom</option>
                  <option value="teams">Teams</option>
                  <option value="email">Email</option>
                </select>
              </label>

              <label className="lead-form__field">
                <span>Preferred day / time</span>
                <input
                  name="when"
                  value={when}
                  onChange={(e) => setWhen(e.target.value)}
                  placeholder="e.g. Tue afternoon, or flexible"
                  enterKeyHint="done"
                />
              </label>

              {status === "error" && (
                <p className="lead-form__error" role="alert">
                  {errorMsg}
                </p>
              )}

              <button
                type="submit"
                className="lead-form__submit"
                disabled={status === "sending"}
              >
                {status === "sending" ? "Sending…" : "Submit request"}
              </button>
            </form>
          )}
        </div>

        <p className="dest__hint">Esc — Return</p>
      </div>
    </div>
  );
}

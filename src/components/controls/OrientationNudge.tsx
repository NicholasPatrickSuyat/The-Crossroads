"use client";

/**
 * Portrait orientation nudge — never blocks play.
 * Landscape remains preferred; Continue dismisses for the session.
 */

import { useState, useSyncExternalStore } from "react";

const STORAGE_KEY = "px-portrait-continue";

interface OrientationNudgeProps {
  /** When true, hide (e.g. destination overlay open). */
  suppressed?: boolean;
}

function subscribePortrait(onChange: () => void): () => void {
  const mq = window.matchMedia("(orientation: portrait)");
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function readPortrait(): boolean {
  return window.matchMedia("(orientation: portrait)").matches;
}

function readStoredDismiss(): boolean {
  try {
    return sessionStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function dismissSession(): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function OrientationNudge({ suppressed = false }: OrientationNudgeProps) {
  const portrait = useSyncExternalStore(subscribePortrait, readPortrait, () => false);
  const storedDismiss = useSyncExternalStore(
    () => () => {},
    readStoredDismiss,
    () => false,
  );
  const [dismissed, setDismissed] = useState(false);

  if (suppressed || !portrait || dismissed || storedDismiss) return null;

  return (
    <div className="orient-nudge" role="status">
      <p className="orient-nudge__title">Best experienced in landscape</p>
      <p className="orient-nudge__hint">
        Rotate your device for a wider crossroads view — or continue in portrait.
      </p>
      <div className="orient-nudge__actions">
        <button
          type="button"
          className="orient-nudge__btn orient-nudge__btn--primary"
          onClick={() => {
            /* Cannot force OS rotation; dismiss so gameplay stays usable. */
            dismissSession();
            setDismissed(true);
          }}
        >
          Rotate Device
        </button>
        <button
          type="button"
          className="orient-nudge__btn"
          onClick={() => {
            dismissSession();
            setDismissed(true);
          }}
        >
          Continue in Portrait
        </button>
      </div>
    </div>
  );
}

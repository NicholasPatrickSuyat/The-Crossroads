"use client";

/**
 * Subtle mute + volume control. Session prefs live in AudioManager / localStorage.
 */

import { useCallback, useEffect, useState } from "react";
import { getAudioManager } from "@/game/audio/AudioManager";

export function AudioControl() {
  const audio = getAudioManager();
  const [, setTick] = useState(0);

  useEffect(() => {
    return audio.subscribe(() => setTick((n) => n + 1));
  }, [audio]);

  const muted = audio.isMuted();

  const toggle = useCallback(() => {
    void audio.unlock().then(() => audio.toggleMute());
  }, [audio]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== "KeyM") return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      e.preventDefault();
      toggle();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle]);

  return (
    <button
      type="button"
      className={`audio-ctl${muted ? " audio-ctl--muted" : ""}`}
      onClick={toggle}
      aria-pressed={muted}
      aria-label={muted ? "Unmute audio" : "Mute audio"}
      title={muted ? "Unmute (M)" : "Mute (M)"}
    >
      <span aria-hidden="true">{muted ? "🔇" : "🔊"}</span>
    </button>
  );
}

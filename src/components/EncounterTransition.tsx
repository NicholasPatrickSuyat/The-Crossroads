"use client";

/**
 * Fast RPG encounter-style wipe (~0.65s).
 * Shared band animation + subtle destination accent flash.
 */

import { useEffect } from "react";
import type { DestinationId } from "@/game/config/destinations";

const DURATION_MS = 650;

interface EncounterTransitionProps {
  active: boolean;
  theme?: DestinationId | null;
  onComplete: () => void;
}

export function EncounterTransition({
  active,
  theme = null,
  onComplete,
}: EncounterTransitionProps) {
  useEffect(() => {
    if (!active) return;
    const id = window.setTimeout(onComplete, DURATION_MS);
    return () => window.clearTimeout(id);
  }, [active, onComplete]);

  if (!active) return null;

  const themeClass = theme ? ` encounter--${theme}` : "";

  return (
    <div className={`encounter${themeClass}`} aria-hidden="true">
      <div className="encounter__accent" />
      <div className="encounter__band encounter__band--a" />
      <div className="encounter__band encounter__band--b" />
      <div className="encounter__band encounter__band--c" />
      <div className="encounter__flash" />
    </div>
  );
}

export const ENCOUNTER_MS = DURATION_MS;

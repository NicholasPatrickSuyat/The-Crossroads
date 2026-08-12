"use client";

/**
 * Detect when touch chrome (joystick / ENTER) should show.
 * Keyboard stays available; first touch can also reveal controls on hybrids.
 */

import { useEffect, useState, useSyncExternalStore } from "react";
import { prefersTouchUi } from "@/game/config/quality";

function subscribePointerPrefs(onChange: () => void): () => void {
  const coarse = window.matchMedia("(pointer: coarse)");
  const hover = window.matchMedia("(hover: none)");
  coarse.addEventListener("change", onChange);
  hover.addEventListener("change", onChange);
  return () => {
    coarse.removeEventListener("change", onChange);
    hover.removeEventListener("change", onChange);
  };
}

export function useTouchChrome(): boolean {
  const preferred = useSyncExternalStore(
    subscribePointerPrefs,
    prefersTouchUi,
    () => false,
  );
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (preferred) return;
    const reveal = (e: PointerEvent) => {
      if (e.pointerType === "touch") setTouched(true);
    };
    window.addEventListener("pointerdown", reveal);
    return () => window.removeEventListener("pointerdown", reveal);
  }, [preferred]);

  return preferred || touched;
}

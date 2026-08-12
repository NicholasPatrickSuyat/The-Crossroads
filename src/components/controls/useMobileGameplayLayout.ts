"use client";

/**
 * Subscribe to mobile gameplay layout breakpoint (full-bleed camera / chrome).
 */

import { useSyncExternalStore } from "react";
import {
  isMobileGameplayLayout,
  MOBILE_GAMEPLAY_MQ,
} from "@/game/config/quality";

function subscribe(onChange: () => void): () => void {
  const mq = window.matchMedia(MOBILE_GAMEPLAY_MQ);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

export function useMobileGameplayLayout(): boolean {
  return useSyncExternalStore(subscribe, isMobileGameplayLayout, () => false);
}

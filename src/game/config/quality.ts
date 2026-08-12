/**
 * Centralized render / input quality for desktop vs mobile-like devices.
 * Atmosphere stays on; mobile only gently reduces particle cadence + DPR.
 *
 * Desktop (≥ ~1100px wide, tall enough): locked cinematic letterbox framing.
 * Mobile/tablet viewports: full-bleed camera that matches screen aspect.
 */

export const QUALITY = {
  /** Cap devicePixelRatio used for the game buffer (avoids huge mobile GPUs). */
  MAX_DPR: 2,
  /** Desktop particle spawn interval (seconds). */
  PARTICLE_INTERVAL_DESKTOP: 0.08,
  /** Mobile / coarse-pointer particle spawn interval (seconds). */
  PARTICLE_INTERVAL_MOBILE: 0.14,
  /**
   * Mobile zoom: short screen axis shows ~VIEW_HEIGHT world pixels
   * (same vertical density as the approved desktop camera window).
   */
  MOBILE_SCALE_MIN: 1.2,
  MOBILE_SCALE_MAX: 2.75,
} as const;

/** Match media used for mobile gameplay layout (full-bleed camera + chrome). */
export const MOBILE_GAMEPLAY_MQ =
  "(max-width: 1100px), (max-height: 600px)";

/** True when we should prefer touch chrome (joystick / ENTER). */
export function prefersTouchUi(): boolean {
  if (typeof window === "undefined") return false;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const noHover = window.matchMedia("(hover: none)").matches;
  return coarse || noHover;
}

/**
 * Mobile/tablet gameplay presentation — NOT used on normal desktop widths.
 * Narrow or short viewports get full-bleed aspect camera.
 */
export function isMobileGameplayLayout(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia(MOBILE_GAMEPLAY_MQ).matches;
}

/** @deprecated use isMobileGameplayLayout — kept name for call-site clarity */
export function preferCanvasFill(): boolean {
  return isMobileGameplayLayout();
}

export function particleSpawnInterval(): number {
  return isMobileGameplayLayout() || prefersTouchUi()
    ? QUALITY.PARTICLE_INTERVAL_MOBILE
    : QUALITY.PARTICLE_INTERVAL_DESKTOP;
}

export function cappedDpr(): number {
  const raw = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
  const capped = Math.min(raw, QUALITY.MAX_DPR);
  // Keep the existing 1-or-2 snap for crisp integer deviceScale on most screens.
  return capped >= 1.5 ? 2 : 1;
}

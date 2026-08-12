/**
 * Centralized atmosphere / polish toggles for Milestone 6.
 * Keep all feature flags + fog strengths here — do not scatter magic values.
 */

export const ATMOSPHERE = {
  /** Soft radial warm glows (campfire, lanterns, landmarks). */
  ENABLE_LIGHT_GLOWS: true,
  /** Slow drifting mist / haze blobs. */
  ENABLE_FOG: true,
  /** Local embers, pollen, ash particles. */
  ENABLE_PARTICLES: true,
  /** Background forest darkening + cool wash. */
  ENABLE_DEPTH: true,
  /** Soft cinematic edge vignette (screen-space). */
  ENABLE_VIGNETTE: true,
  /** Tiny canopy/light motion (pulse / sway amplitude). */
  ENABLE_MOTION: true,

  /**
   * Peak per-lobe alphas (breathing multiplies ~0.88–1.0).
   * Mountains intentionally highest so mist is clearly readable in play.
   * Values are peak-at-core; mid-stops stay relatively strong so lobes read as mist bands.
   */
  MOUNTAINS_FOG_ALPHA: 0.34,
  FOREST_FOG_ALPHA: 0.1,
  SHIRE_FOG_ALPHA: 0.06,
  MORDOR_HAZE_ALPHA: 0.16,
} as const;

export type AtmosphereFlags = typeof ATMOSPHERE;

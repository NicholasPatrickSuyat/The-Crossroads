/**
 * Audio catalog — one place for ids, paths, and mix levels.
 * Exploration music uses the real file under public/audio/music/.
 * Ambience / SFX still use generated fallbacks until files exist.
 */

export type MusicId = "exploration";
export type AmbienceId = "hub" | "shire" | "mountains" | "mordor";
export type SfxId = "interact" | "encounter";

export const AUDIO_PATHS = {
  music: {
    /** Real medieval/fantasy exploration soundtrack (MP3). */
    exploration: "/audio/music/exploration-theme.mp3",
  },
  ambience: {
    hub: "/audio/ambience/campfire.ogg",
    shire: "/audio/ambience/shire.ogg",
    mountains: "/audio/ambience/mountains.ogg",
    mordor: "/audio/ambience/mordor.ogg",
  },
  sfx: {
    interact: "/audio/sfx/interact.ogg",
    encounter: "/audio/sfx/encounter-whoosh.ogg",
  },
} as const;

/**
 * When true, also fetch ambience/SFX files from AUDIO_PATHS.
 * Exploration music is always loaded from disk when present.
 */
export const AUDIO_USE_FILES = false;

/**
 * Generated (Web Audio noise/pad) regional ambience.
 * Off in presentation — exploration-theme.mp3 is the only continuous bed.
 * Keep ambience architecture; re-enable when real .ogg loops are supplied.
 */
export const ENABLE_GENERATED_AMBIENCE = false;

export const AUDIO_MIX = {
  /** Conservative music bus. */
  musicVolume: 0.28,
  /** Default SFX bus (0–1). */
  sfxVolume: 0.55,
  /** Destination overlay ducks exploration music to this fraction. */
  destinationDuck: 0.4,
  /** Peak ambience bus (kept audible under music). */
  ambienceVolume: 0.28,
  /** Crossfade seconds between ambience regions. */
  ambienceFade: 1.4,
  /** Fade-in when exploration music first starts. */
  musicFadeIn: 2.2,
} as const;

export const AUDIO_STORAGE_KEYS = {
  muted: "px-audio-muted",
  music: "px-audio-music",
  sfx: "px-audio-sfx",
} as const;

/**
 * Cinematic Crossroads — compact portfolio diorama (not an overworld).
 * Tuned to match public/sprites/references/cinematic-crossroads/ref-crossroads-primary.png
 */

/** Logical tile size (collision / authoring grid). Art may be larger. */
export const TILE_SIZE = 16;

/** Compact diorama world. */
export const MAP_WIDTH_TILES = 42;
export const MAP_HEIGHT_TILES = 28;
export const WORLD_WIDTH = MAP_WIDTH_TILES * TILE_SIZE; // 672
export const WORLD_HEIGHT = MAP_HEIGHT_TILES * TILE_SIZE; // 448

/**
 * Fixed local camera window (world pixels).
 * Slightly wider than 20×13 for a modest zoom-out while staying intimate.
 * Scale is an integer CSS multiple so pixels stay crisp across monitors.
 */
export const VIEW_WIDTH_TILES = 22;
export const VIEW_HEIGHT_TILES = 14;
export const VIEW_WIDTH = VIEW_WIDTH_TILES * TILE_SIZE; // 352
export const VIEW_HEIGHT = VIEW_HEIGHT_TILES * TILE_SIZE; // 224

/** Walking cadence for short 2–5s destination approaches. */
export const PLAYER_SPEED = 56;

/** Traveler frame size (Pack 1 sheet cells). */
export const PLAYER_WIDTH = 32;
export const PLAYER_HEIGHT = 48;

export const PLAYER_HITBOX_WIDTH = 12;
export const PLAYER_HITBOX_HEIGHT = 8;
export const PLAYER_HITBOX_OFFSET_X = 10;
export const PLAYER_HITBOX_OFFSET_Y = 38;

export const CAMERA_FOLLOW_SPEED = 9;

/** Player screen anchor — lower in frame so the world opens ahead. */
export const CAMERA_FOCUS_X = 0.5;
export const CAMERA_FOCUS_Y = 0.72;

export const CAMERA_LOOKAHEAD_FRAC_X = 0.05;
export const CAMERA_LOOKAHEAD_FRAC_Y = 0.025;
export const CAMERA_LOOKAHEAD_SPEED = 3;

export const MAX_DELTA_SECONDS = 1 / 20;

export const DEBUG_COLLISIONS = false;

/**
 * Dev HUD (position / camera readout) drawn on-canvas.
 * Presentation mode keeps only the subtle HTML controls hint.
 */
export const DEBUG_UI = false;

export const COLORS = {
  void: "#07070b",
  ground: "#12141c",
  grid: "#1a1d28",
  gridAccent: "#222633",
  player: "#c9a66b",
  playerOutline: "#2a2118",
  hudText: "#b8b4a8",
  debugHitbox: "rgba(80, 220, 120, 0.85)",
  debugSolid: "rgba(220, 80, 80, 0.75)",
  debugCamera: "rgba(80, 160, 255, 0.9)",
} as const;

/**
 * Tile-space anchors (feet / door thresholds).
 * Distances chosen for ~2–4s lateral walks and ~3–5s north walk at PLAYER_SPEED.
 */
export const MAP_ANCHORS = {
  /** Campfire / sign clearing */
  hub: { col: 21, row: 14 },
  /** South of fire — traveler starts low in frame facing the scene */
  spawn: { col: 21, row: 17 },
  /** Close left — readable in opening composition */
  shire: { col: 10, row: 13 },
  /** North gate threshold */
  mountains: { col: 21, row: 6 },
  /** Close right fortress approach */
  mordor: { col: 30, row: 13 },
} as const;

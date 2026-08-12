/**
 * Pack 1 Cinematic Crossroads sprite catalog.
 * Paths match public/sprites/PACK1_CINEMATIC_CROSSROADS.md Tier A.
 * Pack 0 leftovers under nature/*_tree_* and terrain/center/ are NOT listed.
 */

export const PACK1_SPRITES = {
  // Terrain (opaque 16×16)
  forest_floor_a: "/sprites/terrain/forest/forest_floor_a.png",
  forest_floor_b: "/sprites/terrain/forest/forest_floor_b.png",
  forest_floor_c: "/sprites/terrain/forest/forest_floor_c.png",
  dirt_path: "/sprites/terrain/forest/dirt_path.png",
  path_edge_n: "/sprites/terrain/forest/path_edge_n.png",
  path_edge_e: "/sprites/terrain/forest/path_edge_e.png",
  path_edge_s: "/sprites/terrain/forest/path_edge_s.png",
  path_edge_w: "/sprites/terrain/forest/path_edge_w.png",
  path_corner_ne: "/sprites/terrain/forest/path_corner_ne.png",
  path_corner_nw: "/sprites/terrain/forest/path_corner_nw.png",
  path_corner_se: "/sprites/terrain/forest/path_corner_se.png",
  path_corner_sw: "/sprites/terrain/forest/path_corner_sw.png",

  // Nature
  pine_s: "/sprites/nature/pine_s.png",
  pine_m: "/sprites/nature/pine_m.png",
  pine_l: "/sprites/nature/pine_l.png",
  deciduous_m: "/sprites/nature/deciduous_m.png",
  dead_tree: "/sprites/nature/dead_tree.png",
  bush_a: "/sprites/nature/bush_a.png",
  bush_b: "/sprites/nature/bush_b.png",
  rock_a: "/sprites/nature/rock_a.png",
  rock_cluster: "/sprites/nature/rock_cluster.png",
  flower_blue: "/sprites/nature/flower_blue.png",
  flower_orange: "/sprites/nature/flower_orange.png",

  // Hub
  campfire: "/sprites/hub/campfire.png",
  signpost_three_way: "/sprites/hub/signpost_three_way.png",
  lantern_post: "/sprites/hub/lantern_post.png",

  // Landmarks
  shire_hillside_home: "/sprites/landmarks/shire_hillside_home.png",
  mountain_gate: "/sprites/landmarks/mountain_gate.png",
  dark_fortress: "/sprites/landmarks/dark_fortress.png",

  // Player sheet
  traveler_walk: "/sprites/player/traveler_walk.png",
} as const;

export type SpriteKey = keyof typeof PACK1_SPRITES;

/** @deprecated Use PACK1_SPRITES — alias kept for gradual renames. */
export const PACK0_SPRITES = PACK1_SPRITES;

export const CAMPFIRE_FRAME_W = 48;
export const CAMPFIRE_FRAME_H = 48;
export const CAMPFIRE_FRAME_COUNT = 4;
export const CAMPFIRE_FPS = 8;

/** Traveler sheet: 8 cols × 4 rows of 32×48. Rows: down, up, left, right. */
export const TRAVELER_FRAME_W = 32;
export const TRAVELER_FRAME_H = 48;
export const TRAVELER_COLS = 8;
export const TRAVELER_ROWS = 4;
export const TRAVELER_WALK_FPS = 8;

/**
 * Shared types for the cinematic crossroads diorama.
 */

import type { AABB } from "@/game/collisions/AABB";

/** Soft region tags for organization (one forest scene, landmark pockets). */
export type RegionId = "center" | "shire" | "mountains" | "mordor";

export const GroundTile = {
  FOREST_A: 1,
  FOREST_B: 2,
  FOREST_C: 3,
  DIRT_PATH: 4,
} as const;

export type GroundTileId = (typeof GroundTile)[keyof typeof GroundTile];

export type PropType =
  | "tree"
  | "deadTree"
  | "bush"
  | "rock"
  | "house"
  | "lantern"
  | "campfire"
  | "sign"
  | "garden"
  | "gate"
  | "tower";

export interface WorldProp {
  id: string;
  region: RegionId;
  type: PropType;
  x: number;
  y: number;
  width: number;
  height: number;
  collision: AABB | null;
  sortY: number;
  label?: string;
  sublabel?: string;
  spriteKey?: string;
  animate?: "campfire";
  /** Soft warm glow center offset from sprite top-left (optional). */
  glow?: { ox: number; oy: number; radius: number; alpha: number };
}

export interface WorldMap {
  ground: Uint8Array;
  props: WorldProp[];
  spawnX: number;
  spawnY: number;
}

export const GROUND_COLORS: Record<GroundTileId, string> = {
  [GroundTile.FOREST_A]: "#1a2a1c",
  [GroundTile.FOREST_B]: "#162418",
  [GroundTile.FOREST_C]: "#121a14",
  [GroundTile.DIRT_PATH]: "#3a3024",
};

export const PROP_COLORS: Record<
  PropType,
  { fill: string; accent: string; detail?: string }
> = {
  tree: { fill: "#2f5d3a", accent: "#3d2a1a", detail: "#1e3a24" },
  deadTree: { fill: "#3a322c", accent: "#2a221c", detail: "#1a1612" },
  bush: { fill: "#3a6a3a", accent: "#2a4a2a" },
  rock: { fill: "#5a5e6a", accent: "#3d404a" },
  house: { fill: "#6b5040", accent: "#3a2a20", detail: "#8a6a4a" },
  lantern: { fill: "#4a4030", accent: "#c9a050", detail: "#2a2418" },
  campfire: { fill: "#3a2a1a", accent: "#c86828", detail: "#e09040" },
  sign: { fill: "#5a4834", accent: "#3a3024", detail: "#c9b896" },
  garden: { fill: "#4a6a3a", accent: "#6a8a4a", detail: "#8a5a6a" },
  gate: { fill: "#4a4e58", accent: "#2a2e38", detail: "#6a7080" },
  tower: { fill: "#1a1418", accent: "#0e0a0c", detail: "#3a2020" },
};

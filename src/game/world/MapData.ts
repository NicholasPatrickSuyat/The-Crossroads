/**
 * Assembles the cinematic crossroads diorama.
 */

import type { AABB } from "@/game/collisions/AABB";
import {
  MAP_ANCHORS,
  MAP_HEIGHT_TILES,
  MAP_WIDTH_TILES,
  PLAYER_HEIGHT,
  PLAYER_WIDTH,
  TILE_SIZE,
} from "@/game/config/constants";
import type { WorldMap, WorldProp } from "@/game/world/RegionTypes";
import {
  buildCrossroadsProps,
  paintCrossroadsGround,
} from "@/game/world/SceneCrossroads";

/** Build the Pack 1 cinematic crossroads map. */
export function createWorldMap(): WorldMap {
  const ground = new Uint8Array(MAP_WIDTH_TILES * MAP_HEIGHT_TILES);
  paintCrossroadsGround(ground);
  const props = buildCrossroadsProps(ground);

  // Spawn south of the fire, facing into the scene (traveler low in frame).
  const spawnX =
    MAP_ANCHORS.spawn.col * TILE_SIZE - Math.floor(PLAYER_WIDTH / 2);
  const spawnY =
    MAP_ANCHORS.spawn.row * TILE_SIZE - PLAYER_HEIGHT + 16;

  return { ground, props, spawnX, spawnY };
}

export function collectSolidAABBs(props: readonly WorldProp[]): AABB[] {
  const solids: AABB[] = [];
  for (let i = 0; i < props.length; i++) {
    const c = props[i].collision;
    if (!c) continue;
    solids.push({
      x: c.x,
      y: c.y,
      width: c.width,
      height: c.height,
    });
  }
  return solids;
}

export function isInsideWorld(x: number, y: number): boolean {
  return (
    x >= 0 &&
    y >= 0 &&
    x < MAP_WIDTH_TILES * TILE_SIZE &&
    y < MAP_HEIGHT_TILES * TILE_SIZE
  );
}

export type { WorldProp, WorldMap } from "@/game/world/RegionTypes";

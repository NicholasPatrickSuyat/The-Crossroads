/**
 * Destination interaction catalog — zones, prompts, and themed screens.
 * World layout stays locked; these are approach radii around existing anchors.
 */

import { MAP_ANCHORS, TILE_SIZE } from "@/game/config/constants";

export type DestinationId = "shire" | "mountains" | "mordor";

export interface DestinationDef {
  id: DestinationId;
  /** In-world path sign text. */
  signTitle: string;
  /** Proximity prompt action (after "E — "). */
  promptAction: string;
  /** Overlay screen heading. */
  screenTitle: string;
  /** Interaction circle center (world px, player feet). */
  zoneX: number;
  zoneY: number;
  /** Interaction radius in world px. */
  radius: number;
  /** Theme class for path-sign plaque. */
  signTheme: "shire" | "mountains" | "mordor";
}

const shire = MAP_ANCHORS.shire;
const mtn = MAP_ANCHORS.mountains;
const mordor = MAP_ANCHORS.mordor;

/**
 * Zones sit on the approach pockets (door / stairs / gate mouth),
 * not on landmark centers — player reaches them on the dirt path.
 */
export const DESTINATIONS: readonly DestinationDef[] = [
  {
    id: "shire",
    signTitle: "Hearth Hollow",
    promptAction: "About Me",
    screenTitle: "About Me",
    zoneX: (shire.col + 3) * TILE_SIZE + 8,
    zoneY: (shire.row + 1) * TILE_SIZE + 8,
    radius: 42,
    signTheme: "shire",
  },
  {
    id: "mountains",
    signTitle: "Mistveil Mountains",
    promptAction: "View Projects",
    screenTitle: "Projects",
    zoneX: mtn.col * TILE_SIZE + 8,
    zoneY: (mtn.row + 3) * TILE_SIZE + 8,
    radius: 44,
    signTheme: "mountains",
  },
  {
    id: "mordor",
    signTitle: "Ashen Reach",
    promptAction: "Start a Project",
    screenTitle: "Start a Project",
    zoneX: (mordor.col - 2) * TILE_SIZE + 8,
    zoneY: (mordor.row + 1) * TILE_SIZE + 8,
    radius: 44,
    signTheme: "mordor",
  },
] as const;

export function getDestination(id: DestinationId): DestinationDef {
  const found = DESTINATIONS.find((d) => d.id === id);
  if (!found) throw new Error(`Unknown destination: ${id}`);
  return found;
}

/** Nearest destination whose zone contains the point, or null. */
export function findDestinationAt(
  worldX: number,
  worldY: number,
): DestinationDef | null {
  let best: DestinationDef | null = null;
  let bestDist = Infinity;
  for (const d of DESTINATIONS) {
    const dx = worldX - d.zoneX;
    const dy = worldY - d.zoneY;
    const dist = Math.hypot(dx, dy);
    if (dist <= d.radius && dist < bestDist) {
      best = d;
      bestDist = dist;
    }
  }
  return best;
}

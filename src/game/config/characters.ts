/**
 * Playable traveler catalog.
 *
 * Adding a character: drop its sheet into `public/sprites/player/`, register
 * the path in `PACK1_SPRITES` (SpriteCatalog), then flip `sheetKey` /
 * `available` here. Player, Game, WorldScene and the select screen all read
 * from this catalog — nothing else needs to change.
 *
 * Sheet contract (must match the Wandering Mage layout exactly):
 *   256×192 RGBA — 8 cols × 4 rows of 32×48 frames.
 *   Rows: 0 down, 1 up, 2 left, 3 right. Col 0 = idle, cols 1–7 = walk cycle.
 *   Foot hitbox 12×8 at offset (10, 38) inside each frame.
 */

import type { SpriteKey } from "@/game/render/SpriteCatalog";

export type CharacterId = "wandering-mage" | "cloaked-adventurer";

export interface CharacterDef {
  id: CharacterId;
  /** Display name on the select screen. */
  name: string;
  /** One-line flavor under the name. */
  epithet: string;
  /**
   * Pack 1 sheet key, or null when the runtime asset has not landed yet.
   * Null sheets are never rendered — the select screen shows the character
   * as unavailable instead of faking art.
   */
  sheetKey: SpriteKey | null;
  /** Selectable in the UI / constructible in-game. */
  available: boolean;
  /** Optional warm glow under the sprite (world px offset from top-left). */
  glow?: { ox: number; oy: number; radius: number; alpha: number };
}

export const CHARACTERS: readonly CharacterDef[] = [
  {
    id: "wandering-mage",
    name: "Wandering Mage",
    epithet: "A staff, a road, and questions worth the walking.",
    sheetKey: "traveler_walk",
    available: true,
    glow: { ox: 22, oy: 18, radius: 18, alpha: 0.16 },
  },
  {
    id: "cloaked-adventurer",
    name: "Cloaked Adventurer",
    epithet: "Boots worn thin; eyes on the far ridge.",
    // Awaiting cloaked_adventurer.png — see the asset manifest in the
    // Milestone 4 report. No placeholder art is rendered meanwhile.
    sheetKey: null,
    available: false,
  },
] as const;

export const DEFAULT_CHARACTER_ID: CharacterId = "wandering-mage";

export function getCharacter(id: CharacterId): CharacterDef {
  const def = CHARACTERS.find((c) => c.id === id);
  if (!def || !def.available || !def.sheetKey) {
    // Unavailable selections fall back to the validated primary traveler.
    return CHARACTERS[0];
  }
  return def;
}

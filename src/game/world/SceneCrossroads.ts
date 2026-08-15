/**
 * Cinematic Crossroads diorama — composed to match
 * public/sprites/references/cinematic-crossroads/ref-crossroads-primary.png
 *
 * Opening frame must show traveler low + clearing + hints of all three landmarks.
 *
 * Forest clearance rules (trunk/base only):
 *   - Roads & destination pockets stay walkable — trunks never sit on path tiles
 *     or inside landmark / hub / approach corridors.
 *   - South spawn + west Hearth Hollow corridors stay visually open (don't-fill + path shoulder).
 *   - SE bottom rim is thinned so it isn't a solid pine wall.
 *   - Canopies MAY overhang elsewhere to form forest walls.
 *   - Dense overlapping pines fill every other eligible grass cell.
 */

import {
  MAP_ANCHORS,
  MAP_HEIGHT_TILES,
  MAP_WIDTH_TILES,
  TILE_SIZE,
} from "@/game/config/constants";
import {
  makeBush,
  makeCampfire,
  makeDarkFortress,
  makeDeciduous,
  makeFlower,
  makeFortressRightSolid,
  makeInvisibleSolid,
  makeLantern,
  makeMountainGate,
  makePathSign,
  makePine,
  makeRock,
  makeRockCluster,
  makeShireHome,
  makeSignpost,
} from "@/game/world/PropFactories";
import { GroundTile, type GroundTileId, type WorldProp } from "@/game/world/RegionTypes";

/**
 * Bump this when forest layout changes so GameCanvas remounts the scene
 * (WorldScene builds the map once in its constructor; HMR alone won't refresh it).
 */
export const FOREST_BUILD = 6;

/** Pine sprite sizes (must match PropFactories PINE). */
const PINE_SIZE = {
  s: { w: 48, h: 64, tw: 10, th: 8 },
  m: { w: 64, h: 96, tw: 14, th: 10 },
  l: { w: 80, h: 112, tw: 16, th: 12 },
} as const;

const DECIDUOUS = { w: 64, h: 80, tw: 14, th: 10, tox: 25 } as const;

function hash2(col: number, row: number): number {
  let n = (col * 374761393 + row * 668265263) | 0;
  n = (n ^ (n >>> 13)) * 1274126177;
  return (n ^ (n >>> 16)) >>> 0;
}

function setTile(
  ground: Uint8Array,
  col: number,
  row: number,
  tile: GroundTileId,
): void {
  if (col < 0 || row < 0 || col >= MAP_WIDTH_TILES || row >= MAP_HEIGHT_TILES) {
    return;
  }
  ground[row * MAP_WIDTH_TILES + col] = tile;
}

function getTile(ground: Uint8Array, col: number, row: number): number {
  if (col < 0 || row < 0 || col >= MAP_WIDTH_TILES || row >= MAP_HEIGHT_TILES) {
    return 0;
  }
  return ground[row * MAP_WIDTH_TILES + col];
}

function isPath(tile: number): boolean {
  return tile === GroundTile.DIRT_PATH;
}

function paintPath(
  ground: Uint8Array,
  col0: number,
  row0: number,
  col1: number,
  row1: number,
  thickness: number,
): void {
  let c0 = col0;
  let r0 = row0;
  const dc = Math.abs(col1 - col0);
  const dr = Math.abs(row1 - row0);
  const sc = col0 < col1 ? 1 : -1;
  const sr = row0 < row1 ? 1 : -1;
  let err = dc - dr;
  const rad = Math.max(1, Math.floor(thickness / 2));

  for (;;) {
    for (let dy = -rad; dy <= rad; dy++) {
      for (let dx = -rad; dx <= rad; dx++) {
        if (dx * dx + dy * dy <= rad * rad + 1) {
          setTile(ground, c0 + dx, r0 + dy, GroundTile.DIRT_PATH);
        }
      }
    }
    if (c0 === col1 && r0 === row1) break;
    const e2 = 2 * err;
    if (e2 > -dr) {
      err -= dr;
      c0 += sc;
    }
    if (e2 < dc) {
      err += dc;
      r0 += sr;
    }
  }
}

function paintDisk(
  ground: Uint8Array,
  col: number,
  row: number,
  radius: number,
  tile: GroundTileId,
): void {
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      if (dx * dx + dy * dy <= radius * radius + 1) {
        setTile(ground, col + dx, row + dy, tile);
      }
    }
  }
}

/** True if any tile under a world-space rect is dirt path. */
function rectOverlapsPath(
  ground: Uint8Array,
  px: number,
  py: number,
  w: number,
  h: number,
): boolean {
  const left = Math.floor(px / TILE_SIZE);
  const right = Math.floor((px + w - 1) / TILE_SIZE);
  const top = Math.floor(py / TILE_SIZE);
  const bottom = Math.floor((py + h - 1) / TILE_SIZE);
  for (let row = top; row <= bottom; row++) {
    for (let col = left; col <= right; col++) {
      if (isPath(getTile(ground, col, row))) return true;
    }
  }
  return false;
}

/** True if any tile under a world-space rect is inside a landmark pocket. */
function rectOverlapsLandmark(px: number, py: number, w: number, h: number): boolean {
  const left = Math.floor(px / TILE_SIZE);
  const right = Math.floor((px + w - 1) / TILE_SIZE);
  const top = Math.floor(py / TILE_SIZE);
  const bottom = Math.floor((py + h - 1) / TILE_SIZE);
  for (let row = top; row <= bottom; row++) {
    for (let col = left; col <= right; col++) {
      if (inLandmarkZone(col, row)) return true;
    }
  }
  return false;
}

/**
 * Open pockets + approach corridors carved through forest:
 *   - Hearth Hollow / Mistveil Mountains / Ashen Reach footprints + tiny approach
 *   - Hub campfire / sign clearing
 *   - West corridor (hub → Hearth Hollow) and south corridor (hub → spawn/bottom)
 *   - Dirt-path tiles plus a short shoulder so canopies don't seal the roads
 */
function inDontFillZone(
  ground: Uint8Array,
  col: number,
  row: number,
): boolean {
  // Hillside Burrow (Hearth Hollow) + tiny approach
  if (col >= 6 && col <= 14 && row >= 8 && row <= 15) return true;
  // Mistveil Mountains gate / stairs + tiny approach
  if (col >= 16 && col <= 25 && row >= 2 && row <= 10) return true;
  // Ashen Reach fortress + tiny approach
  if (col >= 27 && col <= 35 && row >= 8 && row <= 16) return true;
  // Central campfire / sign clearing
  if (col >= 18 && col <= 24 && row >= 11 && row <= 17) return true;
  // SW plaza corner — one pine encroaching on the south-path approach (not SW mass)
  if (col >= 16 && col <= 18 && row >= 17 && row <= 18) return true;
  // South spawn approach — vertical walkable strip to bottom edge
  if (col >= 19 && col <= 23 && row >= 15 && row < MAP_HEIGHT_TILES) return true;
  // West Hearth Hollow corridor — horizontal cut through the left tree wall
  if (col >= 10 && col <= 21 && row >= 12 && row <= 16) return true;
  // SE soft clear — thin the oversized bottom-right pine mass (not a solid wall)
  if (col >= 26 && row >= 20 && row < MAP_HEIGHT_TILES) return true;
  // Walkable dirt + 1-tile shoulder (readable corridors without wiping NW/NE forest)
  if (nearPath(ground, col, row, 1)) return true;
  return false;
}

/** Landmark / hub footprints for trunk rejection (same minimal pockets). */
function inLandmarkZone(col: number, row: number): boolean {
  if (col >= 6 && col <= 14 && row >= 8 && row <= 15) return true;
  if (col >= 16 && col <= 25 && row >= 2 && row <= 10) return true;
  if (col >= 27 && col <= 35 && row >= 8 && row <= 16) return true;
  if (col >= 18 && col <= 24 && row >= 11 && row <= 17) return true;
  return false;
}

/** True if (col,row) is dirt path or within `radius` tiles of one. */
function nearPath(
  ground: Uint8Array,
  col: number,
  row: number,
  radius: number,
): boolean {
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      if (isPath(getTile(ground, col + dx, row + dy))) return true;
    }
  }
  return false;
}

export function paintCrossroadsGround(ground: Uint8Array): void {
  for (let row = 0; row < MAP_HEIGHT_TILES; row++) {
    for (let col = 0; col < MAP_WIDTH_TILES; col++) {
      const h = hash2(col, row);
      let tile: GroundTileId = GroundTile.FOREST_A;
      if ((h & 7) === 0) tile = GroundTile.FOREST_C;
      else if ((h & 3) === 0) tile = GroundTile.FOREST_B;
      if (col >= 28 && (h & 1) === 0) tile = GroundTile.FOREST_C;
      setTile(ground, col, row, tile);
    }
  }

  const hub = MAP_ANCHORS.hub;
  const spawn = MAP_ANCHORS.spawn;
  const shire = MAP_ANCHORS.shire;
  const mtn = MAP_ANCHORS.mountains;
  const mordor = MAP_ANCHORS.mordor;

  paintDisk(ground, hub.col, hub.row, 3, GroundTile.DIRT_PATH);
  // South approach must reach the bottom rim (spawn sits mid-frame; forest below was sealing it)
  paintPath(ground, spawn.col, MAP_HEIGHT_TILES - 1, hub.col, hub.row, 3);
  paintPath(ground, hub.col, hub.row, shire.col + 3, shire.row + 1, 3);
  paintDisk(ground, shire.col + 3, shire.row + 1, 2, GroundTile.DIRT_PATH);
  paintPath(ground, hub.col, hub.row, mtn.col, mtn.row + 3, 2);
  paintDisk(ground, mtn.col, mtn.row + 3, 2, GroundTile.DIRT_PATH);
  paintPath(ground, hub.col, hub.row, mordor.col - 2, mordor.row + 1, 2);
  paintDisk(ground, mordor.col - 2, mordor.row + 1, 2, GroundTile.DIRT_PATH);
}

export function buildCrossroadsProps(ground: Uint8Array): WorldProp[] {
  const props: WorldProp[] = [];
  let n = 0;
  const id = (prefix: string) => `${prefix}-${n++}`;

  const hubX = MAP_ANCHORS.hub.col * TILE_SIZE;
  const hubY = MAP_ANCHORS.hub.row * TILE_SIZE;

  // Hub clearing — open plaza (inside DON'T FILL)
  props.push(makeSignpost(id("sign"), "center", hubX - 32, hubY - 68));
  props.push(makeCampfire(id("fire"), "center", hubX - 24, hubY - 4));
  props.push(makeLantern(id("lantern"), "center", hubX + 36, hubY - 36));
  props.push(makeLantern(id("lantern"), "center", hubX - 60, hubY + 4));
  props.push(makeFlower(id("fl"), "center", hubX - 48, hubY + 18, "orange"));
  props.push(makeFlower(id("fl"), "center", hubX + 28, hubY + 14, "blue"));
  props.push(makeRock(id("rk"), "center", hubX + 16, hubY + 28));

  // Hearth Hollow — landmark + path sign on the approach (not floating roof text)
  const shireX = 6 * TILE_SIZE;
  const shireY = 8 * TILE_SIZE;
  props.push(makeShireHome(id("shire"), "shire", shireX, shireY));
  props.push(makePathSign(id("sign"), "shire", shireX + 128, shireY + 68, "Hearth Hollow"));
  props.push(makeFlower(id("fl"), "shire", shireX + 24, shireY + 98, "orange"));
  props.push(makeFlower(id("fl"), "shire", shireX + 96, shireY + 94, "blue"));
  props.push(makeBush(id("bush"), "shire", shireX + 8, shireY + 100, "b"));
  props.push(makeRockCluster(id("rk"), "shire", shireX + 40, shireY + 102));

  // Mountain gate — landmark + path sign near stairs
  const gateX = hubX - 80;
  const gateY = 2 * TILE_SIZE;
  props.push(makeMountainGate(id("gate"), "mountains", gateX, gateY));
  props.push(
    makeInvisibleSolid(
      id("gate-r"),
      "mountains",
      { x: gateX + 160 - 56, y: gateY + 144 - 48, width: 48, height: 40 },
      gateY + 144 - 12,
    ),
  );
  props.push(
    makeInvisibleSolid(
      id("gate-cliff"),
      "mountains",
      { x: gateX + 8, y: gateY + 8, width: 144, height: 72 },
      gateY + 80,
    ),
  );
  props.push(makePathSign(id("sign"), "mountains", hubX + 40, hubY - 96, "Mistveil Mountains"));
  props.push(makeRockCluster(id("rk"), "mountains", hubX - 70, hubY - 88));
  props.push(makeRockCluster(id("rk"), "mountains", hubX + 36, hubY - 84));

  // Fortress — landmark + darker path sign on approach
  const fortX = 27 * TILE_SIZE;
  const fortY = 8 * TILE_SIZE;
  props.push(makeDarkFortress(id("fort"), "mordor", fortX, fortY));
  props.push(makeFortressRightSolid(id("fort-r"), "mordor", fortX, fortY));
  props.push(makePathSign(id("sign"), "mordor", fortX - 28, fortY + 96, "Ashen Reach"));
  props.push(makeRockCluster(id("rk"), "mordor", fortX + 24, fortY + 120));
  props.push(makeBush(id("bush"), "mordor", fortX + 100, fortY + 124, "a"));
  props.push(makeFlower(id("fl"), "mordor", fortX + 56, fortY + 128, "orange"));

  fillNatureOutsideDontFill(props, ground, id);
  purgeDontFillNature(props, ground);

  addRimBlockers(props, id);
  return props;
}

/**
 * Aggressive forest mass — roads/buildings carved out of overlapping canopy.
 * Trunks stay off paths; canopies form walls along the roads.
 */
function fillNatureOutsideDontFill(
  props: WorldProp[],
  ground: Uint8Array,
  id: (p: string) => string,
): void {
  // Pass 1: plant nearly every eligible tile — bias LARGE pines
  for (let row = 0; row < MAP_HEIGHT_TILES; row++) {
    for (let col = 0; col < MAP_WIDTH_TILES; col++) {
      if (inDontFillZone(ground, col, row)) continue;

      const h = hash2(col * 13, row * 17);
      // Skip ~1/32 only — leave tiny irregular gaps filled by understory
      if ((h & 31) === 0) {
        placeUnderstory(props, ground, id, col, row, h);
        continue;
      }

      const jx = ((h >> 3) & 7) - 3;
      const jy = ((h >> 6) & 7) - 3;
      const px = col * TILE_SIZE + jx;
      const py = row * TILE_SIZE + jy - 52;

      const sizeRoll = h % 10;
      let placed = false;
      if (sizeRoll < 6) {
        placed =
          tryPlacePine(props, ground, id, px - 20, py, "l") ||
          tryPlacePine(props, ground, id, px - 10, py + 4, "m");
      } else if (sizeRoll < 9) {
        placed =
          tryPlacePine(props, ground, id, px - 10, py + 4, "m") ||
          tryPlacePine(props, ground, id, px - 20, py, "l") ||
          tryPlacePine(props, ground, id, px - 4, py + 12, "s");
      } else {
        placed =
          tryPlaceDeciduous(props, ground, id, px - 8, py + 8) ||
          tryPlacePine(props, ground, id, px - 4, py + 12, "s");
      }
      placeUnderstory(props, ground, id, col, row, h ^ (placed ? 0 : 0xaa55));
    }
  }

  // Pass 2: half-tile offset — overlapping canopy walls
  for (let row = 0; row < MAP_HEIGHT_TILES; row++) {
    for (let col = 0; col < MAP_WIDTH_TILES; col++) {
      if (inDontFillZone(ground, col, row)) continue;
      const h = hash2(col + 91, row + 47);
      if ((h & 3) === 0) continue;

      const px = col * TILE_SIZE + 8 + ((h >> 2) & 5) - 10;
      const py = row * TILE_SIZE - 60 + ((h >> 5) & 5);
      tryPlacePine(props, ground, id, px, py, (h & 1) === 0 ? "l" : "m");
    }
  }

  // Pass 3: alternate stagger — fill residual gaps with large mass
  for (let row = 0; row < MAP_HEIGHT_TILES; row++) {
    for (let col = 0; col < MAP_WIDTH_TILES; col++) {
      if (inDontFillZone(ground, col, row)) continue;
      const h = hash2(col * 7 + 3, row * 11 + 5);
      if ((h & 1) === 0) continue;

      const px = col * TILE_SIZE - 12 + ((h >> 3) & 7);
      const py = row * TILE_SIZE - 72 + ((h >> 6) & 7);
      const placed = tryPlacePine(props, ground, id, px, py, "l");
      if (!placed || (h & 7) < 5) {
        placeUnderstory(props, ground, id, col, row, h ^ 0x33cc);
      }
    }
  }

  // Pass 4: dense understory carpet between trunks
  for (let row = 0; row < MAP_HEIGHT_TILES; row++) {
    for (let col = 0; col < MAP_WIDTH_TILES; col++) {
      if (inDontFillZone(ground, col, row)) continue;
      const h = hash2(col + 203, row + 117);
      if ((h & 3) === 0) continue;
      placeUnderstory(props, ground, id, col, row, h);
      if ((h & 7) === 1) {
        placeUnderstory(props, ground, id, col, row, h ^ 0xf00d);
      }
    }
  }

  // Edge framing — large pines on bottom / top / sides
  // Skip south spawn corridor; heavily thin SE rim so it isn't a solid pine wall.
  for (let col = 0; col < MAP_WIDTH_TILES; col++) {
    const inSouthCorridor = col >= 18 && col <= 24;
    const inSeRim = col >= 26;
    const hb = hash2(col, 99);

    if (!inSouthCorridor && !inSeRim) {
      tryPlacePine(
        props,
        ground,
        id,
        col * TILE_SIZE - 20,
        (MAP_HEIGHT_TILES - 2) * TILE_SIZE - 88 + ((hb & 7) - 3),
        "l",
      );
      tryPlacePine(
        props,
        ground,
        id,
        col * TILE_SIZE - 4,
        (MAP_HEIGHT_TILES - 1) * TILE_SIZE - 96 + ((hb >> 3) & 5),
        (hb & 1) === 0 ? "l" : "m",
      );
    } else if (inSeRim && (hb & 7) === 0) {
      // Sparse SE bottom accents only
      tryPlacePine(
        props,
        ground,
        id,
        col * TILE_SIZE - 4,
        (MAP_HEIGHT_TILES - 1) * TILE_SIZE - 96 + ((hb >> 3) & 5),
        "m",
      );
    }

    const ht = hash2(col, 3);
    tryPlacePine(
      props,
      ground,
      id,
      col * TILE_SIZE - 16,
      -48 + ((ht & 7) - 3),
      "l",
    );
  }
  for (let row = 0; row < MAP_HEIGHT_TILES; row++) {
    const hl = hash2(2, row);
    // Keep left rim, but don't seal the west Hearth Hollow corridor rows
    if (!(row >= 12 && row <= 16)) {
      tryPlacePine(
        props,
        ground,
        id,
        -28 + ((hl & 5) - 2),
        row * TILE_SIZE - 60,
        "l",
      );
    }
    const hr = hash2(MAP_WIDTH_TILES - 1, row);
    // Soften right rim in the lower half (feeds the SE mass)
    if (row < 18 || (hr & 3) === 0) {
      tryPlacePine(
        props,
        ground,
        id,
        (MAP_WIDTH_TILES - 3) * TILE_SIZE + ((hr & 5) - 2),
        row * TILE_SIZE - 60,
        row >= 18 ? "m" : "l",
      );
    }
  }
}

/**
 * Strip nature whose TRUNK/BASE sits on path or in don't-fill.
 * Canopy overhang over roads is allowed (forest walls).
 */
function purgeDontFillNature(
  props: WorldProp[],
  ground: Uint8Array,
): void {
  const keepTypes = new Set([
    "house",
    "gate",
    "tower",
    "sign",
    "campfire",
    "lantern",
  ]);
  for (let i = props.length - 1; i >= 0; i--) {
    const p = props[i];
    if (keepTypes.has(p.type)) continue;
    if (!p.spriteKey) continue;

    const isTree = p.type === "tree" || p.type === "deadTree";
    if (isTree) {
      const trunk = trunkBandForProp(p);
      if (
        rectOverlapsPath(ground, trunk.x, trunk.y, trunk.w, trunk.h) ||
        rectOverlapsLandmark(trunk.x, trunk.y, trunk.w, trunk.h) ||
        inDontFillZone(
          ground,
          Math.floor((trunk.x + trunk.w / 2) / TILE_SIZE),
          Math.floor((trunk.y + trunk.h / 2) / TILE_SIZE),
        )
      ) {
        props.splice(i, 1);
      }
      continue;
    }

    // Understory / rocks: keep base off path tiles only
    if (rectOverlapsPath(ground, p.x, p.y + p.height - 10, p.width, 10)) {
      props.splice(i, 1);
    }
  }
}

function trunkBandForProp(p: WorldProp): { x: number; y: number; w: number; h: number } {
  if (p.collision) {
    return {
      x: p.collision.x,
      y: p.collision.y,
      w: p.collision.width,
      h: p.collision.height,
    };
  }
  return {
    x: p.x + Math.floor(p.width / 2) - 6,
    y: p.y + p.height - 10,
    w: 12,
    h: 10,
  };
}

/**
 * Place pine at pixel origin. Canopy may overhang roads; trunk stays off
 * path / landmark / don't-fill cells.
 */
function tryPlacePine(
  props: WorldProp[],
  ground: Uint8Array,
  id: (p: string) => string,
  px: number,
  py: number,
  size: "s" | "m" | "l",
): boolean {
  const { w, h, tw, th } = PINE_SIZE[size];
  const trunkX = px + Math.floor((w - tw) / 2);
  const trunkY = py + h - th;
  const trunkCol = Math.floor((trunkX + tw / 2) / TILE_SIZE);
  const trunkRow = Math.floor((trunkY + th / 2) / TILE_SIZE);

  if (inDontFillZone(ground, trunkCol, trunkRow)) return false;
  if (rectOverlapsPath(ground, trunkX, trunkY, tw, th)) return false;
  if (rectOverlapsLandmark(trunkX, trunkY, tw, th)) return false;

  props.push(makePine(id("pine"), "center", px, py, size));
  return true;
}

function tryPlaceDeciduous(
  props: WorldProp[],
  ground: Uint8Array,
  id: (p: string) => string,
  px: number,
  py: number,
): boolean {
  const { h, tw, th, tox } = DECIDUOUS;
  const trunkX = px + tox;
  const trunkY = py + h - th;
  const trunkCol = Math.floor((trunkX + tw / 2) / TILE_SIZE);
  const trunkRow = Math.floor((trunkY + th / 2) / TILE_SIZE);

  if (inDontFillZone(ground, trunkCol, trunkRow)) return false;
  if (rectOverlapsPath(ground, trunkX, trunkY, tw, th)) return false;
  if (rectOverlapsLandmark(trunkX, trunkY, tw, th)) return false;

  props.push(makeDeciduous(id("oak"), "center", px, py));
  return true;
}

function placeUnderstory(
  props: WorldProp[],
  ground: Uint8Array,
  id: (p: string) => string,
  col: number,
  row: number,
  h: number,
): void {
  if (inDontFillZone(ground, col, row)) return;
  const px = col * TILE_SIZE + ((h >> 3) & 7) - 3;
  const py = row * TILE_SIZE + ((h >> 6) & 7) - 3;
  // Base-only path check so small props can sit at road edges
  if (rectOverlapsPath(ground, px, py + 22, 32, 10)) return;

  const roll = h % 5;
  if (roll === 0) {
    props.push(makeBush(id("bush"), "center", px, py, h & 1 ? "a" : "b"));
  } else if (roll === 1) {
    props.push(makeRock(id("rk"), "center", px + 4, py + 6));
  } else if (roll === 2) {
    props.push(
      makeFlower(
        id("fl"),
        "center",
        px,
        py + 4,
        (h & 1) === 0 ? "blue" : "orange",
      ),
    );
  } else if (roll === 3) {
    props.push(makeBush(id("bush"), "center", px - 4, py + 2, "b"));
    if ((h & 8) !== 0) {
      props.push(makeRock(id("rk"), "center", px + 10, py + 8));
    }
  } else {
    if (rectOverlapsPath(ground, px - 8, py + 18, 48, 12)) return;
    props.push(makeRockCluster(id("rk"), "center", px - 8, py - 4));
  }
}

function addRimBlockers(
  props: WorldProp[],
  id: (p: string) => string,
): void {
  const t = TILE_SIZE;
  const W = MAP_WIDTH_TILES * t;
  const H = MAP_HEIGHT_TILES * t;
  props.push(
    makeInvisibleSolid(id("rim"), "center", { x: 0, y: 0, width: W, height: 12 }, 12),
  );
  props.push(
    makeInvisibleSolid(id("rim"), "center", { x: 0, y: H - 12, width: W, height: 12 }, H),
  );
  props.push(
    makeInvisibleSolid(id("rim"), "center", { x: 0, y: 0, width: 12, height: H }, H),
  );
  props.push(
    makeInvisibleSolid(id("rim"), "center", { x: W - 12, y: 0, width: 12, height: H }, H),
  );
}

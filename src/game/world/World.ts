/**
 * Crossroads renderer — Pack 1 terrain + sprite props only.
 * Depth sorting is owned by WorldScene.
 * Path-sign plaques are Canvas-drawn (PathSignRenderer) with the world camera.
 */

import { ATMOSPHERE } from "@/game/config/atmosphere";
import {
  COLORS,
  MAP_HEIGHT_TILES,
  MAP_WIDTH_TILES,
  TILE_SIZE,
} from "@/game/config/constants";
import type { Atmosphere } from "@/game/fx/Atmosphere";
import type { SpriteKey } from "@/game/render/SpriteCatalog";
import { areSpritesReady } from "@/game/render/SpriteLoader";
import {
  drawCampfireSprite,
  drawSprite,
  drawWarmGlow,
} from "@/game/render/SpriteRenderer";
import {
  GROUND_COLORS,
  GroundTile,
  type GroundTileId,
  type WorldProp,
} from "@/game/world/RegionTypes";

function isDirtPath(tile: number): boolean {
  return tile === GroundTile.DIRT_PATH;
}

function isForest(tile: number): boolean {
  return (
    tile === GroundTile.FOREST_A ||
    tile === GroundTile.FOREST_B ||
    tile === GroundTile.FOREST_C
  );
}

export class World {
  private ground: Uint8Array | null = null;
  private animTime = 0;
  private atmosphere: Atmosphere | null = null;

  setGround(ground: Uint8Array): void {
    this.ground = ground;
  }

  setAnimTime(timeSeconds: number): void {
    this.animTime = timeSeconds;
  }

  setAtmosphere(atmosphere: Atmosphere | null): void {
    this.atmosphere = atmosphere;
  }

  drawGround(
    ctx: CanvasRenderingContext2D,
    cameraX: number,
    cameraY: number,
    viewW: number,
    viewH: number,
  ): void {
    ctx.fillStyle = GROUND_COLORS[GroundTile.FOREST_A];
    ctx.fillRect(0, 0, viewW, viewH);

    const startCol = Math.max(0, Math.floor(cameraX / TILE_SIZE));
    const endCol = Math.min(
      MAP_WIDTH_TILES - 1,
      Math.floor((cameraX + viewW) / TILE_SIZE),
    );
    const startRow = Math.max(0, Math.floor(cameraY / TILE_SIZE));
    const endRow = Math.min(
      MAP_HEIGHT_TILES - 1,
      Math.floor((cameraY + viewH) / TILE_SIZE),
    );

    const ground = this.ground;
    const spritesOk = areSpritesReady();

    for (let row = startRow; row <= endRow; row++) {
      for (let col = startCol; col <= endCol; col++) {
        const worldX = col * TILE_SIZE;
        const worldY = row * TILE_SIZE;
        const screenX = worldX - cameraX;
        const screenY = worldY - cameraY;

        let tile: GroundTileId = GroundTile.FOREST_A;
        if (ground) {
          tile = ground[row * MAP_WIDTH_TILES + col] as GroundTileId;
        }

        if (
          spritesOk &&
          this.drawTerrainSprite(ctx, ground, col, row, tile, screenX, screenY)
        ) {
          continue;
        }

        ctx.fillStyle = GROUND_COLORS[tile] ?? COLORS.ground;
        ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
      }
    }
  }

  private drawTerrainSprite(
    ctx: CanvasRenderingContext2D,
    ground: Uint8Array | null,
    col: number,
    row: number,
    tile: GroundTileId,
    screenX: number,
    screenY: number,
  ): boolean {
    if (isForest(tile)) {
      let key: SpriteKey = "forest_floor_a";
      if (tile === GroundTile.FOREST_B) key = "forest_floor_b";
      if (tile === GroundTile.FOREST_C) key = "forest_floor_c";
      return drawSprite(ctx, key, screenX, screenY);
    }

    if (isDirtPath(tile) && ground) {
      return drawSprite(ctx, this.resolvePathSprite(ground, col, row), screenX, screenY);
    }

    return false;
  }

  private resolvePathSprite(
    ground: Uint8Array,
    col: number,
    row: number,
  ): SpriteKey {
    const n = !this.neighborIsDirt(ground, col, row - 1);
    const e = !this.neighborIsDirt(ground, col + 1, row);
    const s = !this.neighborIsDirt(ground, col, row + 1);
    const w = !this.neighborIsDirt(ground, col - 1, row);

    if (n && e) return "path_corner_ne";
    if (n && w) return "path_corner_nw";
    if (s && e) return "path_corner_se";
    if (s && w) return "path_corner_sw";
    if (n) return "path_edge_n";
    if (e) return "path_edge_e";
    if (s) return "path_edge_s";
    if (w) return "path_edge_w";
    return "dirt_path";
  }

  private neighborIsDirt(ground: Uint8Array, col: number, row: number): boolean {
    if (col < 0 || row < 0 || col >= MAP_WIDTH_TILES || row >= MAP_HEIGHT_TILES) {
      return false;
    }
    return isDirtPath(ground[row * MAP_WIDTH_TILES + col]);
  }

  drawProp(
    ctx: CanvasRenderingContext2D,
    prop: WorldProp,
    cameraX: number,
    cameraY: number,
  ): void {
    if (!prop.spriteKey) return;

    const screenX = prop.x - cameraX;
    const screenY = prop.y - cameraY;

    if (!areSpritesReady()) return;

    if (prop.glow && ATMOSPHERE.ENABLE_LIGHT_GLOWS) {
      const base = prop.glow;
      const pulse = this.atmosphere?.glowPulse(base.alpha, 1) ?? {
        alpha: base.alpha,
        scale: 1,
      };
      if (pulse.alpha > 0) {
        drawWarmGlow(
          ctx,
          screenX + base.ox,
          screenY + base.oy,
          base.radius * pulse.scale,
          pulse.alpha,
        );
      }
    }

    if (prop.animate === "campfire") {
      drawCampfireSprite(ctx, screenX, screenY, this.animTime);
      return;
    }

    drawSprite(ctx, prop.spriteKey as SpriteKey, screenX, screenY);
  }
}

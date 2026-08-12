/**
 * Pack 1 traveler — walks the cinematic crossroads.
 * Sheet: 8×4 of 32×48 (rows: down, up, left, right; cols: idle + walk).
 */

import type { AABB } from "@/game/collisions/AABB";
import type { CollisionMap } from "@/game/collisions/CollisionMap";
import type { CharacterDef } from "@/game/config/characters";
import {
  PLAYER_HEIGHT,
  PLAYER_HITBOX_HEIGHT,
  PLAYER_HITBOX_OFFSET_X,
  PLAYER_HITBOX_OFFSET_Y,
  PLAYER_HITBOX_WIDTH,
  PLAYER_SPEED,
  PLAYER_WIDTH,
} from "@/game/config/constants";
import type { Input } from "@/game/core/Input";
import {
  TRAVELER_COLS,
  TRAVELER_FRAME_H,
  TRAVELER_FRAME_W,
  TRAVELER_WALK_FPS,
} from "@/game/render/SpriteCatalog";
import { areSpritesReady, getSprite } from "@/game/render/SpriteLoader";
import { drawWarmGlow } from "@/game/render/SpriteRenderer";

export class Player {
  x: number;
  y: number;

  readonly width = PLAYER_WIDTH;
  readonly height = PLAYER_HEIGHT;

  facingX = 0;
  facingY = -1;

  private readonly character: CharacterDef;
  private animTime = 0;
  private moving = false;
  /** When true, ignore movement input (destination overlay / transition). */
  private locked = false;

  private readonly hitbox: AABB = {
    x: 0,
    y: 0,
    width: PLAYER_HITBOX_WIDTH,
    height: PLAYER_HITBOX_HEIGHT,
  };

  constructor(startX: number, startY: number, character: CharacterDef) {
    this.x = startX;
    this.y = startY;
    this.character = character;
  }

  setLocked(locked: boolean): void {
    this.locked = locked;
    if (locked) this.moving = false;
  }

  isLocked(): boolean {
    return this.locked;
  }

  update(dt: number, input: Input, collisions: CollisionMap): void {
    if (this.locked) {
      this.moving = false;
      return;
    }

    const { x: dirX, y: dirY } = input.getMovementVector();

    const wantsMove = dirX !== 0 || dirY !== 0;
    if (wantsMove) {
      // Facing persists on release so the idle frame keeps its direction.
      this.facingX = dirX;
      this.facingY = dirY;
    }

    this.moving = false;
    if (!wantsMove) return;

    const dx = dirX * PLAYER_SPEED * dt;
    const dy = dirY * PLAYER_SPEED * dt;

    this.syncHitboxFromSprite();
    const beforeX = this.hitbox.x;
    const beforeY = this.hitbox.y;
    collisions.moveAABB(this.hitbox, dx, dy);
    this.syncSpriteFromHitbox();

    // Walk anim only on real displacement — pushing into a wall stays idle.
    this.moving =
      Math.abs(this.hitbox.x - beforeX) > 1e-6 ||
      Math.abs(this.hitbox.y - beforeY) > 1e-6;
    if (this.moving) {
      this.animTime += dt;
    }
  }

  getHitbox(out?: AABB): AABB {
    this.syncHitboxFromSprite();
    if (!out) return this.hitbox;
    out.x = this.hitbox.x;
    out.y = this.hitbox.y;
    out.width = this.hitbox.width;
    out.height = this.hitbox.height;
    return out;
  }

  getSortY(): number {
    return this.y + this.height - 2;
  }

  getCenterX(): number {
    return this.x + this.width / 2;
  }

  getCenterY(): number {
    return this.y + this.height / 2;
  }

  draw(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number): void {
    const screenX = this.x - cameraX;
    const screenY = this.y - cameraY;

    const glow = this.character.glow;
    if (glow) {
      // Soft warm glow under the sprite (e.g. the mage's staff).
      drawWarmGlow(ctx, screenX + glow.ox, screenY + glow.oy, glow.radius, glow.alpha);
    }

    if (areSpritesReady() && this.drawSheet(ctx, screenX, screenY)) {
      return;
    }

    // Fallback silhouette if sheet failed to load.
    ctx.fillStyle = "#2a3a58";
    ctx.fillRect(screenX + 8, screenY + 14, 16, 28);
  }

  private drawSheet(
    ctx: CanvasRenderingContext2D,
    screenX: number,
    screenY: number,
  ): boolean {
    if (!this.character.sheetKey) return false;
    const img = getSprite(this.character.sheetKey);
    if (!img) return false;

    const row = this.facingRow();
    const col = this.moving
      ? 1 + (Math.floor(this.animTime * TRAVELER_WALK_FPS) % (TRAVELER_COLS - 1))
      : 0;

    const sx = col * TRAVELER_FRAME_W;
    const sy = row * TRAVELER_FRAME_H;
    ctx.drawImage(
      img,
      sx,
      sy,
      TRAVELER_FRAME_W,
      TRAVELER_FRAME_H,
      screenX,
      screenY,
      TRAVELER_FRAME_W,
      TRAVELER_FRAME_H,
    );
    return true;
  }

  /** Sheet rows: 0 down, 1 up, 2 left, 3 right. */
  private facingRow(): number {
    if (Math.abs(this.facingX) > Math.abs(this.facingY)) {
      return this.facingX < 0 ? 2 : 3;
    }
    return this.facingY < 0 ? 1 : 0;
  }

  private syncHitboxFromSprite(): void {
    this.hitbox.x = this.x + PLAYER_HITBOX_OFFSET_X;
    this.hitbox.y = this.y + PLAYER_HITBOX_OFFSET_Y;
    this.hitbox.width = PLAYER_HITBOX_WIDTH;
    this.hitbox.height = PLAYER_HITBOX_HEIGHT;
  }

  private syncSpriteFromHitbox(): void {
    this.x = this.hitbox.x - PLAYER_HITBOX_OFFSET_X;
    this.y = this.hitbox.y - PLAYER_HITBOX_OFFSET_Y;
  }
}

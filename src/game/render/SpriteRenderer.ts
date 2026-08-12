/**
 * Canvas draw helpers for Pack 1 sprites.
 * Always assumes ctx.imageSmoothingEnabled = false for crisp pixels.
 *
 * Draw at fractional screen coords when the camera is smooth — do not
 * Math.round here. Rounding fought a snapped camera and caused jitter;
 * nearest-neighbor sampling + integer deviceScale keeps art acceptably crisp.
 */

import {
  CAMPFIRE_FRAME_COUNT,
  CAMPFIRE_FRAME_H,
  CAMPFIRE_FRAME_W,
  CAMPFIRE_FPS,
  type SpriteKey,
} from "@/game/render/SpriteCatalog";
import { getSprite } from "@/game/render/SpriteLoader";

export function drawSprite(
  ctx: CanvasRenderingContext2D,
  key: SpriteKey,
  screenX: number,
  screenY: number,
): boolean {
  const img = getSprite(key);
  if (!img) return false;
  ctx.drawImage(img, screenX, screenY);
  return true;
}

export function drawSpriteFrame(
  ctx: CanvasRenderingContext2D,
  key: SpriteKey,
  frameIndex: number,
  frameW: number,
  frameH: number,
  screenX: number,
  screenY: number,
): boolean {
  const img = getSprite(key);
  if (!img) return false;
  const sx = frameIndex * frameW;
  ctx.drawImage(
    img,
    sx,
    0,
    frameW,
    frameH,
    screenX,
    screenY,
    frameW,
    frameH,
  );
  return true;
}

export function campfireFrameAt(timeSeconds: number): number {
  return Math.floor(timeSeconds * CAMPFIRE_FPS) % CAMPFIRE_FRAME_COUNT;
}

export function drawCampfireSprite(
  ctx: CanvasRenderingContext2D,
  screenX: number,
  screenY: number,
  timeSeconds: number,
): boolean {
  const frame = campfireFrameAt(timeSeconds);
  return drawSpriteFrame(
    ctx,
    "campfire",
    frame,
    CAMPFIRE_FRAME_W,
    CAMPFIRE_FRAME_H,
    screenX,
    screenY,
  );
}

export function drawWarmGlow(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number,
  alpha = 0.22,
): void {
  drawColoredGlow(
    ctx,
    centerX,
    centerY,
    radius,
    `rgba(255, 170, 70, ${alpha})`,
    `rgba(220, 110, 30, ${alpha * 0.45})`,
  );
}

/** Soft radial glow with custom core / mid colors (edge fades to transparent). */
export function drawColoredGlow(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number,
  coreColor: string,
  midColor: string,
): void {
  if (radius <= 0) return;
  const gradient = ctx.createRadialGradient(
    centerX,
    centerY,
    0,
    centerX,
    centerY,
    radius,
  );
  gradient.addColorStop(0, coreColor);
  gradient.addColorStop(0.5, midColor);
  gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fill();
}

export { CAMPFIRE_FRAME_W, CAMPFIRE_FRAME_H };

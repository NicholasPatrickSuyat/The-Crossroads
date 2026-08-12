/**
 * Smooth follow camera for the top-down world — biased for pseudo-third-person feel.
 *
 * Camera world coordinates:
 *   `x` / `y` are the top-left of the visible viewport in *world* pixels.
 *
 * Composition (not dead-center):
 *   The player sits near (focusX, focusY) of the viewport — typically ~50% / ~66% —
 *   so more of the world is visible ahead/north than behind/south.
 *
 * Directional look-ahead:
 *   While traveling, the camera eases toward a viewport-fraction offset in the
 *   facing direction so the road ahead opens up. When idle, look-ahead eases to 0.
 */

import {
  CAMERA_FOCUS_X,
  CAMERA_FOCUS_Y,
  CAMERA_LOOKAHEAD_FRAC_X,
  CAMERA_LOOKAHEAD_FRAC_Y,
  CAMERA_LOOKAHEAD_SPEED,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from "@/game/config/constants";

export class Camera {
  /** World-space X of the viewport's top-left corner. */
  x = 0;

  /** World-space Y of the viewport's top-left corner. */
  y = 0;

  /** Visible world width (CSS pixels / worldScale). */
  width = 0;

  /** Visible world height (CSS pixels / worldScale). */
  height = 0;

  /** Smoothed look-ahead offset in world pixels. */
  private lookX = 0;
  private lookY = 0;

  private initialized = false;

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.x = this.clampX(this.x);
    this.y = this.clampY(this.y);
  }

  /**
   * Biased follow with directional anticipation.
   * @param playerX / playerY - World point to keep near the focus anchor
   * @param facingX / facingY - Facing (−1..1) while moving; pass 0,0 when idle
   * @param dt - Frame delta seconds
   * @param followSpeed - Position follow responsiveness
   */
  follow(
    playerX: number,
    playerY: number,
    facingX: number,
    facingY: number,
    dt: number,
    followSpeed: number,
  ): void {
    if (this.width <= 0 || this.height <= 0) return;

    // Viewport-fraction look-ahead — identical composition on every monitor.
    const targetLookX = facingX * this.width * CAMERA_LOOKAHEAD_FRAC_X;
    const targetLookY = facingY * this.height * CAMERA_LOOKAHEAD_FRAC_Y;

    const lookT = 1 - Math.exp(-CAMERA_LOOKAHEAD_SPEED * dt);
    this.lookX += (targetLookX - this.lookX) * lookT;
    this.lookY += (targetLookY - this.lookY) * lookT;

    // Player screen anchor: (focusX, focusY) of the viewport, plus look-ahead.
    const desiredX = this.clampX(
      playerX - this.width * CAMERA_FOCUS_X + this.lookX,
    );
    const desiredY = this.clampY(
      playerY - this.height * CAMERA_FOCUS_Y + this.lookY,
    );

    if (!this.initialized) {
      this.x = desiredX;
      this.y = desiredY;
      this.initialized = true;
      return;
    }

    const t = 1 - Math.exp(-followSpeed * dt);
    this.x += (desiredX - this.x) * t;
    this.y += (desiredY - this.y) * t;

    this.x = this.clampX(this.x);
    this.y = this.clampY(this.y);
  }

  /** Snap instantly (spawn / hard resize) using the same composition bias. */
  snapTo(playerX: number, playerY: number): void {
    if (this.width <= 0 || this.height <= 0) return;
    this.lookX = 0;
    this.lookY = 0;
    this.x = this.clampX(playerX - this.width * CAMERA_FOCUS_X);
    this.y = this.clampY(playerY - this.height * CAMERA_FOCUS_Y);
    this.initialized = true;
  }

  private clampX(value: number): number {
    const max = Math.max(0, WORLD_WIDTH - this.width);
    return Math.max(0, Math.min(max, value));
  }

  private clampY(value: number): number {
    const max = Math.max(0, WORLD_HEIGHT - this.height);
    return Math.max(0, Math.min(max, value));
  }
}

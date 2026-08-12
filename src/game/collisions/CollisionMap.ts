/**
 * Solid collision resolver for the playable world.
 *
 * Movement is resolved one axis at a time:
 *   1. Apply X delta → push out of any overlapping solids horizontally
 *   2. Apply Y delta → push out of any overlapping solids vertically
 *
 * Separating axes lets the player slide along walls during diagonal input
 * instead of sticking when both axes are blocked at once.
 *
 * Rendering data (sprite size/art) is intentionally separate — callers pass
 * a hitbox that may be smaller than the drawn sprite (e.g. feet-only).
 */

import {
  type AABB,
  aabbBottom,
  aabbIntersects,
  aabbRight,
} from "@/game/collisions/AABB";
import { WORLD_HEIGHT, WORLD_WIDTH } from "@/game/config/constants";

export class CollisionMap {
  /** Solid rectangles in world space. Set once from map data; not per-frame. */
  private solids: readonly AABB[] = [];

  /** Scratch box reused while testing moves — avoids per-frame allocations. */
  private readonly scratch: AABB = { x: 0, y: 0, width: 0, height: 0 };

  setSolids(solids: readonly AABB[]): void {
    this.solids = solids;
  }

  getSolids(): readonly AABB[] {
    return this.solids;
  }

  /**
   * Move `hitbox` by (dx, dy) with axis-separated collision + world bounds.
   * Mutates and returns the same hitbox object for chaining without allocation.
   */
  moveAABB(hitbox: AABB, dx: number, dy: number): AABB {
    if (dx !== 0) {
      hitbox.x += dx;
      this.resolveAxis(hitbox, "x", dx);
    }

    if (dy !== 0) {
      hitbox.y += dy;
      this.resolveAxis(hitbox, "y", dy);
    }

    this.clampToWorld(hitbox);
    return hitbox;
  }

  private resolveAxis(hitbox: AABB, axis: "x" | "y", delta: number): void {
    for (let i = 0; i < this.solids.length; i++) {
      const solid = this.solids[i];
      if (!aabbIntersects(hitbox, solid)) continue;

      if (axis === "x") {
        if (delta > 0) {
          // Moving right — sit flush against the solid's left edge.
          hitbox.x = solid.x - hitbox.width;
        } else if (delta < 0) {
          // Moving left — sit flush against the solid's right edge.
          hitbox.x = aabbRight(solid);
        }
      } else if (delta > 0) {
        // Moving down.
        hitbox.y = solid.y - hitbox.height;
      } else if (delta < 0) {
        // Moving up.
        hitbox.y = aabbBottom(solid);
      }
    }
  }

  private clampToWorld(hitbox: AABB): void {
    if (hitbox.x < 0) hitbox.x = 0;
    if (hitbox.y < 0) hitbox.y = 0;

    const maxX = WORLD_WIDTH - hitbox.width;
    const maxY = WORLD_HEIGHT - hitbox.height;

    if (hitbox.x > maxX) hitbox.x = maxX;
    if (hitbox.y > maxY) hitbox.y = maxY;
  }

  /** Convenience for debug drawing — copies solid i into `out`. */
  writeSolid(index: number, out: AABB): boolean {
    const solid = this.solids[index];
    if (!solid) return false;
    out.x = solid.x;
    out.y = solid.y;
    out.width = solid.width;
    out.height = solid.height;
    return true;
  }
}

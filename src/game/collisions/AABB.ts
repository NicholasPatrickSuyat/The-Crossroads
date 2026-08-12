/**
 * Axis-Aligned Bounding Box helpers.
 * Used for hitboxes that do not rotate — enough for a top-down RPG prototype.
 */

export interface AABB {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** True when two boxes overlap (edges touching counts as overlap). */
export function aabbIntersects(a: AABB, b: AABB): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

/** Copy `source` into `target` to avoid allocating in the game loop. */
export function aabbCopy(target: AABB, source: AABB): void {
  target.x = source.x;
  target.y = source.y;
  target.width = source.width;
  target.height = source.height;
}

export function aabbRight(box: AABB): number {
  return box.x + box.width;
}

export function aabbBottom(box: AABB): number {
  return box.y + box.height;
}

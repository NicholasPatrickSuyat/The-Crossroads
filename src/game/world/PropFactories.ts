/**
 * Pack 1 prop factories — visual size vs trunk/base collision.
 */

import type { AABB } from "@/game/collisions/AABB";
import type { RegionId, WorldProp, PropType } from "@/game/world/RegionTypes";

function base(
  id: string,
  region: RegionId,
  type: PropType,
  x: number,
  y: number,
  width: number,
  height: number,
  collision: AABB | null,
  extras?: Partial<
    Pick<
      WorldProp,
      "label" | "sublabel" | "sortY" | "spriteKey" | "animate" | "glow"
    >
  >,
): WorldProp {
  return {
    id,
    region,
    type,
    x,
    y,
    width,
    height,
    collision,
    sortY: extras?.sortY ?? y + height,
    label: extras?.label,
    sublabel: extras?.sublabel,
    spriteKey: extras?.spriteKey,
    animate: extras?.animate,
    glow: extras?.glow,
  };
}

type PineSize = "s" | "m" | "l";

const PINE = {
  s: { w: 48, h: 64, tw: 10, th: 8, key: "pine_s" as const },
  m: { w: 64, h: 96, tw: 14, th: 10, key: "pine_m" as const },
  l: { w: 80, h: 112, tw: 16, th: 12, key: "pine_l" as const },
};

export function makePine(
  id: string,
  region: RegionId,
  x: number,
  y: number,
  size: PineSize,
): WorldProp {
  const s = PINE[size];
  return base(
    id,
    region,
    "tree",
    x,
    y,
    s.w,
    s.h,
    {
      x: x + Math.floor((s.w - s.tw) / 2),
      y: y + s.h - s.th,
      width: s.tw,
      height: s.th,
    },
    { spriteKey: s.key, sortY: y + s.h - 2 },
  );
}

export function makeDeciduous(
  id: string,
  region: RegionId,
  x: number,
  y: number,
): WorldProp {
  const w = 64;
  const h = 80;
  return base(
    id,
    region,
    "tree",
    x,
    y,
    w,
    h,
    { x: x + 25, y: y + h - 10, width: 14, height: 10 },
    { spriteKey: "deciduous_m", sortY: y + h - 2 },
  );
}

export function makeDeadTree(
  id: string,
  region: RegionId,
  x: number,
  y: number,
): WorldProp {
  const w = 48;
  const h = 80;
  return base(
    id,
    region,
    "deadTree",
    x,
    y,
    w,
    h,
    { x: x + 18, y: y + h - 10, width: 12, height: 10 },
    { spriteKey: "dead_tree", sortY: y + h - 2 },
  );
}

export function makeBush(
  id: string,
  region: RegionId,
  x: number,
  y: number,
  variant: "a" | "b",
): WorldProp {
  return base(id, region, "bush", x, y, 32, 32, null, {
    spriteKey: variant === "a" ? "bush_a" : "bush_b",
  });
}

export function makeRock(
  id: string,
  region: RegionId,
  x: number,
  y: number,
): WorldProp {
  return base(
    id,
    region,
    "rock",
    x,
    y,
    16,
    16,
    { x: x + 2, y: y + 6, width: 12, height: 10 },
    { spriteKey: "rock_a" },
  );
}

export function makeRockCluster(
  id: string,
  region: RegionId,
  x: number,
  y: number,
): WorldProp {
  return base(
    id,
    region,
    "rock",
    x,
    y,
    48,
    32,
    { x: x + 4, y: y + 18, width: 40, height: 14 },
    { spriteKey: "rock_cluster" },
  );
}

export function makeFlower(
  id: string,
  region: RegionId,
  x: number,
  y: number,
  color: "blue" | "orange",
): WorldProp {
  return base(id, region, "garden", x, y, 24, 16, null, {
    spriteKey: color === "blue" ? "flower_blue" : "flower_orange",
  });
}

export function makeLantern(
  id: string,
  region: RegionId,
  x: number,
  y: number,
): WorldProp {
  const w = 24;
  const h = 48;
  return base(
    id,
    region,
    "lantern",
    x,
    y,
    w,
    h,
    { x: x + 8, y: y + h - 8, width: 8, height: 8 },
    {
      spriteKey: "lantern_post",
      glow: { ox: 12, oy: 10, radius: 40, alpha: 0.26 },
    },
  );
}

export function makeCampfire(
  id: string,
  region: RegionId,
  x: number,
  y: number,
): WorldProp {
  return base(id, region, "campfire", x, y, 48, 48, null, {
    spriteKey: "campfire",
    animate: "campfire",
    glow: { ox: 24, oy: 28, radius: 62, alpha: 0.34 },
  });
}

export function makeSignpost(
  id: string,
  region: RegionId,
  x: number,
  y: number,
): WorldProp {
  const w = 64;
  const h = 80;
  return base(
    id,
    region,
    "sign",
    x,
    y,
    w,
    h,
    { x: x + 26, y: y + h - 14, width: 12, height: 14 },
    // Blank hub boards — destination names live on path signs near landmarks.
    { spriteKey: "signpost_three_way" },
  );
}

/**
 * Physical path marker (lantern post) + destination name plaque (HTML overlay).
 * Reuses Pack 1 lantern_post — no new sign art required.
 */
export function makePathSign(
  id: string,
  region: RegionId,
  x: number,
  y: number,
  title: string,
): WorldProp {
  const w = 24;
  const h = 48;
  return base(
    id,
    region,
    "sign",
    x,
    y,
    w,
    h,
    { x: x + 8, y: y + h - 8, width: 8, height: 8 },
    {
      spriteKey: "lantern_post",
      sortY: y + h - 2,
      label: title,
      glow: { ox: 12, oy: 10, radius: 32, alpha: 0.2 },
    },
  );
}

export function makeShireHome(
  id: string,
  region: RegionId,
  x: number,
  y: number,
): WorldProp {
  const w = 144;
  const h = 112;
  return base(
    id,
    region,
    "house",
    x,
    y,
    w,
    h,
    // Lower mound / wall band; leave door approach soft (narrower solid).
    { x: x + 16, y: y + h - 36, width: w - 32, height: 28 },
    {
      spriteKey: "shire_hillside_home",
      sortY: y + h - 8,
      glow: { ox: 72, oy: 48, radius: 48, alpha: 0.22 },
    },
  );
}

export function makeMountainGate(
  id: string,
  region: RegionId,
  x: number,
  y: number,
): WorldProp {
  const w = 160;
  const h = 144;
  // Solid left pillar; right pillar is a companion invisible solid in the scene.
  const left: AABB = { x: x + 8, y: y + h - 48, width: 48, height: 40 };
  return base(id, region, "gate", x, y, w, h, left, {
    spriteKey: "mountain_gate",
    sortY: y + h - 12,
    glow: { ox: 80, oy: 90, radius: 48, alpha: 0.16 },
  });
}

/** Extra solid for mountain gate right pillar (same visual, collision only). */
export function makeInvisibleSolid(
  id: string,
  region: RegionId,
  box: AABB,
  sortY: number,
): WorldProp {
  return base(id, region, "gate", box.x, box.y, box.width, box.height, box, {
    sortY,
  });
}

export function makeDarkFortress(
  id: string,
  region: RegionId,
  x: number,
  y: number,
): WorldProp {
  const w = 144;
  const h = 144;
  return base(
    id,
    region,
    "tower",
    x,
    y,
    w,
    h,
    // Left mass; leave ~40px approach channel to the gate mouth.
    { x: x + 8, y: y + h - 44, width: 40, height: 36 },
    {
      spriteKey: "dark_fortress",
      sortY: y + h - 10,
      glow: { ox: 72, oy: 100, radius: 44, alpha: 0.2 },
    },
  );
}

export function makeFortressRightSolid(
  id: string,
  region: RegionId,
  fortressX: number,
  fortressY: number,
): WorldProp {
  const w = 144;
  const h = 144;
  const box: AABB = {
    x: fortressX + w - 52,
    y: fortressY + h - 44,
    width: 40,
    height: 36,
  };
  return makeInvisibleSolid(id, region, box, fortressY + h - 10);
}

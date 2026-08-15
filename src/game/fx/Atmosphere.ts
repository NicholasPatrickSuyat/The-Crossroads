/**
 * Lightweight cinematic atmosphere — lights, fog, particles, depth.
 * Runs entirely in the Canvas game loop (no React). Object-pooled particles.
 */

import { ATMOSPHERE } from "@/game/config/atmosphere";
import { MAP_ANCHORS, TILE_SIZE } from "@/game/config/constants";
import { particleSpawnInterval } from "@/game/config/quality";
import { drawColoredGlow } from "@/game/render/SpriteRenderer";
import type { WorldProp } from "@/game/world/RegionTypes";

type ParticleKind = "ember" | "pollen" | "ash" | "spark";

interface Particle {
  alive: boolean;
  kind: ParticleKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  phase: number;
}

interface FogBlob {
  x: number;
  y: number;
  r: number;
  /** World-space horizontal drift amplitude (px). */
  driftX: number;
  /** World-space vertical drift amplitude (px). */
  driftY: number;
  /** Radians/sec scale for horizontal motion. */
  speed: number;
  phase: number;
  /** Peak alpha before breathing (already region-scaled). */
  alpha: number;
  /** cool mist | warm light haze | dark smoke */
  tint: "cool" | "warm" | "smoke";
  /** back = under props; front = over props, under signs */
  layer: "back" | "front";
}

const MAX_PARTICLES = 96;

function hash01(n: number): number {
  const x = Math.sin(n * 127.1) * 43758.5453;
  return x - Math.floor(x);
}

export class Atmosphere {
  private readonly particles: Particle[] = [];
  private readonly fog: FogBlob[] = [];
  private spawnAcc = 0;
  private time = 0;

  constructor() {
    for (let i = 0; i < MAX_PARTICLES; i++) {
      this.particles.push({
        alive: false,
        kind: "ember",
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        life: 0,
        maxLife: 1,
        size: 1,
        phase: 0,
      });
    }
    this.seedFog();
  }

  private seedFog(): void {
    const hub = MAP_ANCHORS.hub;
    const shire = MAP_ANCHORS.shire;
    const mtn = MAP_ANCHORS.mountains;
    const mordor = MAP_ANCHORS.mordor;

    const M = ATMOSPHERE.MOUNTAINS_FOG_ALPHA;
    const F = ATMOSPHERE.FOREST_FOG_ALPHA;
    const S = ATMOSPHERE.SHIRE_FOG_ALPHA;
    const D = ATMOSPHERE.MORDOR_HAZE_ALPHA;

    type Spec = {
      x: number;
      y: number;
      r: number;
      a: number;
      tint: FogBlob["tint"];
      layer: FogBlob["layer"];
      driftX: number;
      driftY: number;
      speed: number;
    };

    const specs: Spec[] = [
      // —— Mistveil Mountains (most visible): cool bands around gate/stairs ——
      // Prefer FRONT layer so mist isn't buried under dense pines.
      {
        x: mtn.col * TILE_SIZE + 8,
        y: (mtn.row + 3) * TILE_SIZE,
        r: 78,
        a: M,
        tint: "cool",
        layer: "front",
        driftX: 36,
        driftY: 8,
        speed: 0.2,
      },
      {
        x: (mtn.col - 4) * TILE_SIZE,
        y: (mtn.row + 4) * TILE_SIZE,
        r: 70,
        a: M * 0.85,
        tint: "cool",
        layer: "front",
        driftX: 42,
        driftY: 6,
        speed: 0.15,
      },
      {
        x: (mtn.col + 5) * TILE_SIZE,
        y: (mtn.row + 3) * TILE_SIZE + 8,
        r: 64,
        a: M * 0.8,
        tint: "cool",
        layer: "front",
        driftX: 30,
        driftY: 9,
        speed: 0.24,
      },
      {
        x: mtn.col * TILE_SIZE - 12,
        y: (mtn.row + 2) * TILE_SIZE,
        r: 68,
        a: M * 0.75,
        tint: "cool",
        layer: "back",
        driftX: 28,
        driftY: 5,
        speed: 0.18,
      },
      {
        x: mtn.col * TILE_SIZE + 40,
        y: (mtn.row + 5) * TILE_SIZE + 4,
        r: 52,
        a: M * 0.55,
        tint: "cool",
        layer: "front",
        driftX: 34,
        driftY: 7,
        speed: 0.22,
      },
      // —— Forest edges (subtle background only) ——
      {
        x: 3 * TILE_SIZE,
        y: 19 * TILE_SIZE,
        r: 56,
        a: F,
        tint: "cool",
        layer: "back",
        driftX: 18,
        driftY: 4,
        speed: 0.12,
      },
      {
        x: 37 * TILE_SIZE,
        y: 21 * TILE_SIZE,
        r: 52,
        a: F * 0.9,
        tint: "cool",
        layer: "back",
        driftX: 16,
        driftY: 3,
        speed: 0.14,
      },
      {
        x: 7 * TILE_SIZE,
        y: 3 * TILE_SIZE,
        r: 48,
        a: F * 0.85,
        tint: "cool",
        layer: "back",
        driftX: 20,
        driftY: 3,
        speed: 0.11,
      },
      {
        x: (hub.col - 7) * TILE_SIZE,
        y: (hub.row + 4) * TILE_SIZE,
        r: 40,
        a: F * 0.7,
        tint: "cool",
        layer: "back",
        driftX: 14,
        driftY: 3,
        speed: 0.13,
      },
      // —— Hearth Hollow (very light warm haze) ——
      {
        x: (shire.col + 2) * TILE_SIZE,
        y: (shire.row - 1) * TILE_SIZE,
        r: 44,
        a: S,
        tint: "warm",
        layer: "back",
        driftX: 12,
        driftY: 3,
        speed: 0.1,
      },
      // —— Ashen Reach (darker smoke/haze) ——
      {
        x: (mordor.col - 1) * TILE_SIZE,
        y: mordor.row * TILE_SIZE + 8,
        r: 60,
        a: D,
        tint: "smoke",
        layer: "back",
        driftX: 18,
        driftY: 10,
        speed: 0.16,
      },
      {
        x: (mordor.col + 2) * TILE_SIZE,
        y: (mordor.row + 2) * TILE_SIZE,
        r: 50,
        a: D * 0.8,
        tint: "smoke",
        layer: "front",
        driftX: 16,
        driftY: 8,
        speed: 0.19,
      },
    ];

    for (let i = 0; i < specs.length; i++) {
      const s = specs[i];
      this.fog.push({
        x: s.x,
        y: s.y,
        r: s.r,
        driftX: s.driftX,
        driftY: s.driftY,
        speed: s.speed,
        phase: hash01(i * 11.3) * Math.PI * 2,
        alpha: s.a,
        tint: s.tint,
        layer: s.layer,
      });
    }
  }

  update(dt: number): void {
    this.time += dt;
    if (!ATMOSPHERE.ENABLE_PARTICLES && !ATMOSPHERE.ENABLE_FOG) return;

    if (ATMOSPHERE.ENABLE_PARTICLES) {
      const interval = particleSpawnInterval();
      this.spawnAcc += dt;
      while (this.spawnAcc >= interval) {
        this.spawnAcc -= interval;
        this.trySpawn();
      }
      this.stepParticles(dt);
    }
  }

  private trySpawn(): void {
    const roll = Math.random();
    if (roll < 0.45) this.spawnNearCampfire();
    else if (roll < 0.7) this.spawnNearShire();
    else if (roll < 0.9) this.spawnNearMordor();
    else this.spawnNearMountains();
  }

  private acquire(): Particle | null {
    for (let i = 0; i < this.particles.length; i++) {
      if (!this.particles[i].alive) return this.particles[i];
    }
    return null;
  }

  private spawnNearCampfire(): void {
    const p = this.acquire();
    if (!p) return;
    const hub = MAP_ANCHORS.hub;
    const cx = hub.col * TILE_SIZE;
    const cy = hub.row * TILE_SIZE + 8;
    p.alive = true;
    p.kind = Math.random() < 0.7 ? "ember" : "spark";
    p.x = cx + (Math.random() - 0.5) * 18;
    p.y = cy + (Math.random() - 0.5) * 10;
    p.vx = (Math.random() - 0.5) * 8;
    p.vy = -12 - Math.random() * 18;
    p.maxLife = 0.7 + Math.random() * 0.9;
    p.life = p.maxLife;
    p.size = 0.8 + Math.random() * 1.4;
    p.phase = Math.random() * Math.PI * 2;
  }

  private spawnNearShire(): void {
    const p = this.acquire();
    if (!p) return;
    const s = MAP_ANCHORS.shire;
    p.alive = true;
    p.kind = "pollen";
    p.x = (s.col + Math.random() * 6) * TILE_SIZE;
    p.y = (s.row - 1 + Math.random() * 5) * TILE_SIZE;
    p.vx = 2 + Math.random() * 6;
    p.vy = -1 + (Math.random() - 0.5) * 4;
    p.maxLife = 2.5 + Math.random() * 2;
    p.life = p.maxLife;
    p.size = 0.7 + Math.random() * 1.1;
    p.phase = Math.random() * Math.PI * 2;
  }

  private spawnNearMordor(): void {
    const p = this.acquire();
    if (!p) return;
    const m = MAP_ANCHORS.mordor;
    p.alive = true;
    p.kind = Math.random() < 0.55 ? "ash" : "ember";
    p.x = (m.col - 2 + Math.random() * 5) * TILE_SIZE;
    p.y = (m.row + Math.random() * 4) * TILE_SIZE;
    p.vx = -2 + (Math.random() - 0.5) * 6;
    p.vy = -4 - Math.random() * 10;
    p.maxLife = 1.2 + Math.random() * 1.4;
    p.life = p.maxLife;
    p.size = 0.6 + Math.random() * 1.2;
    p.phase = Math.random() * Math.PI * 2;
  }

  private spawnNearMountains(): void {
    const p = this.acquire();
    if (!p) return;
    const m = MAP_ANCHORS.mountains;
    p.alive = true;
    p.kind = "pollen";
    p.x = (m.col - 3 + Math.random() * 7) * TILE_SIZE;
    p.y = (m.row + 1 + Math.random() * 4) * TILE_SIZE;
    p.vx = (Math.random() - 0.5) * 5;
    p.vy = 1 + Math.random() * 3;
    p.maxLife = 2 + Math.random() * 2;
    p.life = p.maxLife;
    p.size = 0.5 + Math.random() * 0.9;
    p.phase = Math.random() * Math.PI * 2;
  }

  private stepParticles(dt: number): void {
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      if (!p.alive) continue;
      p.life -= dt;
      if (p.life <= 0) {
        p.alive = false;
        continue;
      }
      p.phase += dt * 2;
      p.x += (p.vx + Math.sin(p.phase) * (p.kind === "pollen" ? 4 : 2)) * dt;
      p.y += p.vy * dt;
      if (p.kind === "ember" || p.kind === "spark") {
        p.vy -= 6 * dt;
        p.vx *= 1 - 0.4 * dt;
      } else if (p.kind === "ash") {
        p.vy += 2 * dt;
      }
    }
  }

  /** Cool wash + deeper forest shade — drawn after ground, before props. */
  drawDepthPass(
    ctx: CanvasRenderingContext2D,
    camX: number,
    camY: number,
    viewW: number,
    viewH: number,
  ): void {
    if (!ATMOSPHERE.ENABLE_DEPTH) return;

    ctx.save();
    // Cool teal/blue ambient wash
    const wash = ctx.createLinearGradient(0, 0, 0, viewH);
    wash.addColorStop(0, "rgba(18, 36, 52, 0.14)");
    wash.addColorStop(0.45, "rgba(12, 24, 34, 0.06)");
    wash.addColorStop(1, "rgba(8, 14, 22, 0.16)");
    ctx.fillStyle = wash;
    ctx.fillRect(0, 0, viewW, viewH);

    // Darken upper / outer forest bands (background mass)
    const topShade = ctx.createLinearGradient(0, 0, 0, viewH * 0.35);
    topShade.addColorStop(0, "rgba(4, 8, 14, 0.22)");
    topShade.addColorStop(1, "rgba(4, 8, 14, 0)");
    ctx.fillStyle = topShade;
    ctx.fillRect(0, 0, viewW, viewH * 0.4);

    // Side forest depth (world-aware soft columns near map edges when visible)
    this.drawEdgeShade(ctx, camX, camY, viewW, viewH, true);
    this.drawEdgeShade(ctx, camX, camY, viewW, viewH, false);
    ctx.restore();
  }

  private drawEdgeShade(
    ctx: CanvasRenderingContext2D,
    camX: number,
    camY: number,
    viewW: number,
    viewH: number,
    left: boolean,
  ): void {
    const worldEdge = left ? 0 : 42 * TILE_SIZE;
    const screenX = worldEdge - camX;
    if (left && screenX > viewW * 0.4) return;
    if (!left && screenX < viewW * 0.6) return;

    const grad = left
      ? ctx.createLinearGradient(0, 0, viewW * 0.28, 0)
      : ctx.createLinearGradient(viewW, 0, viewW * 0.72, 0);
    grad.addColorStop(0, "rgba(4, 10, 14, 0.18)");
    grad.addColorStop(1, "rgba(4, 10, 14, 0)");
    ctx.fillStyle = grad;
    if (left) ctx.fillRect(0, 0, viewW * 0.3, viewH);
    else ctx.fillRect(viewW * 0.7, 0, viewW * 0.3, viewH);
  }

  /**
   * Pulsed prop glows — called from World.drawProp when ENABLE_LIGHT_GLOWS.
   * Returns multiplied alpha / radius for the base glow.
   */
  glowPulse(baseAlpha: number, strength = 1): { alpha: number; scale: number } {
    if (!ATMOSPHERE.ENABLE_LIGHT_GLOWS) {
      return { alpha: 0, scale: 1 };
    }
    if (!ATMOSPHERE.ENABLE_MOTION) {
      return { alpha: baseAlpha, scale: 1 };
    }
    const flicker =
      0.92 +
      0.08 * Math.sin(this.time * 5.1) +
      0.04 * Math.sin(this.time * 11.3 + 1.7);
    return {
      alpha: baseAlpha * (0.85 + 0.15 * flicker) * strength,
      scale: 0.97 + 0.05 * flicker,
    };
  }

  drawAmbientLights(
    ctx: CanvasRenderingContext2D,
    props: readonly WorldProp[],
    camX: number,
    camY: number,
    viewW: number,
    viewH: number,
  ): void {
    if (!ATMOSPHERE.ENABLE_LIGHT_GLOWS) return;

    // Extra soft pools that aren't tied 1:1 to prop.glow (Hearth Hollow cozy, Ashen Reach ember)
    const shire = MAP_ANCHORS.shire;
    const mordor = MAP_ANCHORS.mordor;
    const mtn = MAP_ANCHORS.mountains;
    const pulse = this.glowPulse(1);

    const shireX = (shire.col + 1) * TILE_SIZE - camX + 40;
    const shireY = (shire.row - 1) * TILE_SIZE - camY + 36;
    if (shireX > -80 && shireX < viewW + 80 && shireY > -80 && shireY < viewH + 80) {
      drawColoredGlow(
        ctx,
        shireX,
        shireY,
        58 * pulse.scale,
        `rgba(255, 190, 110, ${0.07 * pulse.alpha})`,
        `rgba(220, 140, 60, ${0.03 * pulse.alpha})`,
      );
    }

    const fortX = (mordor.col - 1) * TILE_SIZE - camX + 48;
    const fortY = mordor.row * TILE_SIZE - camY + 70;
    if (fortX > -80 && fortX < viewW + 80 && fortY > -80 && fortY < viewH + 80) {
      drawColoredGlow(
        ctx,
        fortX,
        fortY,
        50 * pulse.scale,
        `rgba(200, 70, 40, ${0.08 * pulse.alpha})`,
        `rgba(120, 30, 20, ${0.03 * pulse.alpha})`,
      );
    }

    // Cool torch shimmer near mountain gate mouth
    const gateX = mtn.col * TILE_SIZE - camX + 8;
    const gateY = (mtn.row + 2) * TILE_SIZE - camY + 20;
    if (gateX > -60 && gateX < viewW + 60) {
      drawColoredGlow(
        ctx,
        gateX - 28,
        gateY,
        22 * pulse.scale,
        `rgba(255, 170, 90, ${0.1 * pulse.alpha})`,
        `rgba(180, 100, 40, ${0.03 * pulse.alpha})`,
      );
      drawColoredGlow(
        ctx,
        gateX + 36,
        gateY,
        22 * pulse.scale,
        `rgba(255, 170, 90, ${0.1 * pulse.alpha})`,
        `rgba(180, 100, 40, ${0.03 * pulse.alpha})`,
      );
    }

    void props;
  }

  /**
   * @param layer - `back` under props; `front` over props, under path signs.
   */
  drawFog(
    ctx: CanvasRenderingContext2D,
    camX: number,
    camY: number,
    viewW: number,
    viewH: number,
    layer: "back" | "front" = "back",
  ): void {
    if (!ATMOSPHERE.ENABLE_FOG) return;

    ctx.save();
    // Fog needs soft gradients (unlike nearest-neighbor sprites).
    ctx.imageSmoothingEnabled = true;

    for (let i = 0; i < this.fog.length; i++) {
      const f = this.fog[i];
      if (f.layer !== layer) continue;

      // Slow readable drift — different speeds per lobe.
      const t = this.time * f.speed;
      const ox = f.x + Math.sin(t + f.phase) * f.driftX - camX;
      const oy =
        f.y + Math.cos(t * 0.65 + f.phase * 0.9) * f.driftY - camY;
      if (ox + f.r * 1.8 < -40 || ox - f.r * 1.8 > viewW + 40) continue;
      if (oy + f.r < -40 || oy - f.r > viewH + 40) continue;

      // Gentle breath (not flicker)
      const breath = 0.9 + 0.1 * Math.sin(this.time * 0.32 + f.phase);
      const a = f.alpha * breath;

      // Front mist stays a bit lighter so it doesn't veil the player.
      const layerScale = layer === "front" ? 0.85 : 1;
      const peak = a * layerScale;

      let r0: string;
      let r1: string;
      let r2: string;
      if (f.tint === "cool") {
        r0 = `rgba(225, 238, 248, ${peak})`;
        r1 = `rgba(185, 210, 230, ${peak * 0.7})`;
        r2 = `rgba(150, 180, 205, ${peak * 0.28})`;
      } else if (f.tint === "smoke") {
        r0 = `rgba(72, 48, 42, ${peak})`;
        r1 = `rgba(48, 30, 26, ${peak * 0.65})`;
        r2 = `rgba(28, 16, 14, ${peak * 0.25})`;
      } else {
        r0 = `rgba(235, 210, 165, ${peak})`;
        r1 = `rgba(210, 175, 125, ${peak * 0.55})`;
        r2 = `rgba(180, 140, 95, ${peak * 0.2})`;
      }

      // Horizontal mist band (ellipse) — reads as fog, not a light orb.
      this.drawMistBand(ctx, ox, oy, f.r, r0, r1, r2);
      this.drawMistBand(
        ctx,
        ox + f.r * 0.45,
        oy + f.r * 0.1,
        f.r * 0.7,
        r0,
        r1,
        r2,
      );
    }

    ctx.restore();
  }

  /** Soft elliptical mist mass with sustained mid opacity (not a tiny glow core). */
  private drawMistBand(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    core: string,
    mid: string,
    outer: string,
  ): void {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(1.75, 0.72);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
    g.addColorStop(0, core);
    g.addColorStop(0.4, mid);
    g.addColorStop(0.72, outer);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawParticles(
    ctx: CanvasRenderingContext2D,
    camX: number,
    camY: number,
    viewW: number,
    viewH: number,
  ): void {
    if (!ATMOSPHERE.ENABLE_PARTICLES) return;

    ctx.save();
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      if (!p.alive) continue;
      const sx = p.x - camX;
      const sy = p.y - camY;
      if (sx < -4 || sy < -4 || sx > viewW + 4 || sy > viewH + 4) continue;

      const t = p.life / p.maxLife;
      let fill = "rgba(255,200,120,0.7)";
      if (p.kind === "ember") {
        fill = `rgba(255, ${140 + Math.floor(60 * t)}, 60, ${0.15 + 0.55 * t})`;
      } else if (p.kind === "spark") {
        fill = `rgba(255, 230, 160, ${0.2 + 0.5 * t})`;
      } else if (p.kind === "pollen") {
        fill = `rgba(230, 210, 140, ${0.12 + 0.35 * t})`;
      } else if (p.kind === "ash") {
        fill = `rgba(90, 70, 60, ${0.15 + 0.35 * t})`;
      }

      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.arc(sx, sy, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  /** Screen-space vignette — call with CSS-pixel transform active. */
  drawVignette(
    ctx: CanvasRenderingContext2D,
    cssW: number,
    cssH: number,
  ): void {
    if (!ATMOSPHERE.ENABLE_VIGNETTE) return;

    ctx.save();
    const g = ctx.createRadialGradient(
      cssW * 0.5,
      cssH * 0.48,
      Math.min(cssW, cssH) * 0.28,
      cssW * 0.5,
      cssH * 0.5,
      Math.max(cssW, cssH) * 0.72,
    );
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(0.65, "rgba(0,0,0,0)");
    g.addColorStop(1, "rgba(4, 6, 10, 0.38)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, cssW, cssH);
    ctx.restore();
  }

  getTime(): number {
    return this.time;
  }
}

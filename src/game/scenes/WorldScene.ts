/**
 * Main playable scene.
 * Owns world data, collisions, camera, player, depth drawing, and destination
 * proximity / interact (E) — without involving React in the game loop.
 */

import type { AABB } from "@/game/collisions/AABB";
import { CollisionMap } from "@/game/collisions/CollisionMap";
import type { CharacterDef } from "@/game/config/characters";
import {
  CAMERA_FOLLOW_SPEED,
  COLORS,
  DEBUG_COLLISIONS,
  DEBUG_UI,
} from "@/game/config/constants";
import {
  findDestinationAt,
  type DestinationId,
} from "@/game/config/destinations";
import { Camera } from "@/game/core/Camera";
import type { Input } from "@/game/core/Input";
import { Player } from "@/game/entities/Player";
import { Atmosphere } from "@/game/fx/Atmosphere";
import { drawPathSigns } from "@/game/ui/PathSignRenderer";
import type { PathSignAnchor } from "@/game/ui/PathSignRenderer";
import {
  collectSolidAABBs,
  createWorldMap,
} from "@/game/world/MapData";
import type { WorldProp } from "@/game/world/RegionTypes";
import { World } from "@/game/world/World";

interface DepthEntry {
  sortY: number;
  kind: "player" | "prop";
  propIndex: number;
}

const CULL_PAD = 160;

/** Path-sign plaques sit just above the lantern-post top. */
const SIGN_PLAQUE_OFFSET_Y = 4;

export type ProximityHandler = (id: DestinationId | null) => void;
export type InteractHandler = (id: DestinationId) => void;

export class WorldScene {
  private readonly world = new World();
  private readonly camera = new Camera();
  private readonly collisions = new CollisionMap();
  private readonly atmosphere = new Atmosphere();
  private readonly props: WorldProp[];
  private readonly player: Player;

  private readonly depthList: DepthEntry[] = [];
  private readonly debugBox: AABB = { x: 0, y: 0, width: 0, height: 0 };
  private animTime = 0;

  private readonly signAnchors: PathSignAnchor[] = [];
  private nearDestination: DestinationId | null = null;
  private onProximity: ProximityHandler | null = null;
  private onInteract: InteractHandler | null = null;
  /** Blocks interact while transition / overlay is active. */
  private interactionEnabled = true;

  constructor(character: CharacterDef) {
    const map = createWorldMap();
    this.world.setGround(map.ground);
    this.world.setAtmosphere(this.atmosphere);
    this.props = map.props;
    this.collisions.setSolids(collectSolidAABBs(this.props));

    this.depthList.push({ sortY: 0, kind: "player", propIndex: -1 });
    this.player = new Player(map.spawnX, map.spawnY, character);
    this.signAnchors.push(...this.collectSignAnchors());
  }

  setProximityHandler(handler: ProximityHandler | null): void {
    this.onProximity = handler;
  }

  setInteractHandler(handler: InteractHandler | null): void {
    this.onInteract = handler;
  }

  setPlayerLocked(locked: boolean): void {
    this.player.setLocked(locked);
    this.interactionEnabled = !locked;
  }

  private collectSignAnchors(): PathSignAnchor[] {
    const anchors: PathSignAnchor[] = [];
    for (const prop of this.props) {
      if (prop.type !== "sign" || !prop.label) continue;
      if (prop.region === "center") continue;
      anchors.push({
        key: prop.region,
        title: prop.label,
        theme: prop.region,
        worldX: prop.x + prop.width / 2,
        worldY: prop.y + SIGN_PLAQUE_OFFSET_Y,
      });
    }
    return anchors;
  }

  update(dt: number, input: Input): void {
    this.animTime += dt;
    this.world.setAnimTime(this.animTime);
    this.atmosphere.update(dt);
    this.player.update(dt, input, this.collisions);

    const feetX = this.player.getCenterX();
    const feetY = this.player.y + this.player.height - 4;
    const near = this.interactionEnabled
      ? findDestinationAt(feetX, feetY)
      : null;
    const nearId = near?.id ?? null;

    if (nearId !== this.nearDestination) {
      this.nearDestination = nearId;
      this.onProximity?.(nearId);
    }

    if (
      this.interactionEnabled &&
      nearId &&
      input.consumeJustPressed("interact")
    ) {
      this.onInteract?.(nearId);
    }

    const move = input.getMovementVector();
    const moving =
      !this.player.isLocked() && (move.x !== 0 || move.y !== 0);
    this.camera.follow(
      this.player.getCenterX(),
      this.player.y + this.player.height - 4,
      moving ? this.player.facingX : 0,
      moving ? this.player.facingY : 0,
      dt,
      CAMERA_FOLLOW_SPEED,
    );
  }

  resize(width: number, height: number): void {
    this.camera.resize(width, height);
    this.camera.snapTo(
      this.player.getCenterX(),
      this.player.y + this.player.height - 4,
    );
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const { width: viewW, height: viewH } = this.camera;
    // Smooth camera — do NOT snap the full viewport each frame (that causes
    // 1-device-pixel world jumps). Sprites stay crisp via nearest-neighbor
    // draws with imageSmoothingEnabled=false under an integer deviceScale.
    const camX = this.camera.x;
    const camY = this.camera.y;

    this.world.drawGround(ctx, camX, camY, viewW, viewH);
    this.atmosphere.drawDepthPass(ctx, camX, camY, viewW, viewH);
    this.atmosphere.drawAmbientLights(ctx, this.props, camX, camY, viewW, viewH);
    // Background mist weaves under trees/landmarks (visible in mountain gap).
    this.atmosphere.drawFog(ctx, camX, camY, viewW, viewH, "back");
    this.drawDepthSorted(ctx, camX, camY, viewW, viewH);
    // Light foreground mist over environment, still under destination signs.
    this.atmosphere.drawFog(ctx, camX, camY, viewW, viewH, "front");
    drawPathSigns(ctx, this.signAnchors, camX, camY, viewW, viewH);
    this.atmosphere.drawParticles(ctx, camX, camY, viewW, viewH);

    if (DEBUG_COLLISIONS) {
      this.drawCollisionDebug(ctx, camX, camY);
    }
  }

  /**
   * Screen-space overlays (CSS pixel transform active in Game.render).
   * @param cssW / cssH — canvas CSS size (VIEW * worldScale).
   */
  drawScreenOverlay(
    ctx: CanvasRenderingContext2D,
    cssW = 0,
    cssH = 0,
  ): void {
    if (cssW > 0 && cssH > 0) {
      this.atmosphere.drawVignette(ctx, cssW, cssH);
    }

    if (!DEBUG_UI) return;

    const lines = DEBUG_COLLISIONS ? 4 : 3;
    ctx.save();
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
    ctx.fillRect(12, 12, 270, 16 + lines * 16);

    ctx.fillStyle = COLORS.hudText;
    ctx.font = "12px monospace";
    ctx.fillText("WASD / Arrows — Move · E — Interact", 24, 32);
    ctx.fillText(
      `Pos ${Math.round(this.player.x)}, ${Math.round(this.player.y)}`,
      24,
      48,
    );
    ctx.fillText(
      `Cam ${Math.round(this.camera.x)}, ${Math.round(this.camera.y)}`,
      24,
      64,
    );

    if (DEBUG_COLLISIONS) {
      ctx.fillText("DEBUG_COLLISIONS on", 24, 80);
    }
    ctx.restore();
  }

  private drawDepthSorted(
    ctx: CanvasRenderingContext2D,
    camX: number,
    camY: number,
    viewW: number,
    viewH: number,
  ): void {
    const left = camX - CULL_PAD;
    const top = camY - CULL_PAD;
    const right = camX + viewW + CULL_PAD;
    const bottom = camY + viewH + CULL_PAD;

    this.ensureDepthSlot(0);
    this.depthList[0].sortY = this.player.getSortY();
    this.depthList[0].kind = "player";
    this.depthList[0].propIndex = -1;
    let count = 1;

    for (let i = 0; i < this.props.length; i++) {
      const prop = this.props[i];
      if (
        prop.x + prop.width < left ||
        prop.x > right ||
        prop.y + prop.height < top ||
        prop.y > bottom
      ) {
        continue;
      }

      this.ensureDepthSlot(count);
      const entry = this.depthList[count];
      entry.sortY = prop.sortY;
      entry.kind = "prop";
      entry.propIndex = i;
      count += 1;
    }

    for (let i = 1; i < count; i++) {
      const current = this.depthList[i];
      let j = i - 1;
      while (j >= 0 && this.depthList[j].sortY > current.sortY) {
        this.depthList[j + 1] = this.depthList[j];
        j -= 1;
      }
      this.depthList[j + 1] = current;
    }

    for (let i = 0; i < count; i++) {
      const entry = this.depthList[i];
      if (entry.kind === "player") {
        this.player.draw(ctx, camX, camY);
      } else {
        this.world.drawProp(ctx, this.props[entry.propIndex], camX, camY);
      }
    }
  }

  private ensureDepthSlot(index: number): void {
    while (this.depthList.length <= index) {
      this.depthList.push({ sortY: 0, kind: "prop", propIndex: -1 });
    }
  }

  private drawCollisionDebug(
    ctx: CanvasRenderingContext2D,
    camX: number,
    camY: number,
  ): void {
    const solids = this.collisions.getSolids();
    ctx.lineWidth = 1;

    for (let i = 0; i < solids.length; i++) {
      const solid = solids[i];
      ctx.strokeStyle = COLORS.debugSolid;
      ctx.strokeRect(
        solid.x - camX + 0.5,
        solid.y - camY + 0.5,
        solid.width,
        solid.height,
      );
    }

    this.player.getHitbox(this.debugBox);
    ctx.strokeStyle = COLORS.debugHitbox;
    ctx.strokeRect(
      this.debugBox.x - camX + 0.5,
      this.debugBox.y - camY + 0.5,
      this.debugBox.width,
      this.debugBox.height,
    );

    ctx.strokeStyle = COLORS.debugCamera;
    ctx.strokeRect(0.5, 0.5, this.camera.width - 1, this.camera.height - 1);
  }
}

/**
 * Game — owns the requestAnimationFrame loop and wires systems together.
 *
 * Desktop:
 *   Fixed cinematic window (VIEW_WIDTH × VIEW_HEIGHT), integer CSS scale,
 *   letterboxed in the stage. LOCKED — do not change framing.
 *
 * Mobile / compact viewports:
 *   Canvas fills the stage. Camera viewport matches screen aspect at a
 *   readable world scale (short axis ≈ VIEW_HEIGHT world px). No stretch.
 */

import {
  COLORS,
  MAX_DELTA_SECONDS,
  VIEW_HEIGHT,
  VIEW_WIDTH,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from "@/game/config/constants";
import { getCharacter, type CharacterId } from "@/game/config/characters";
import {
  cappedDpr,
  isMobileGameplayLayout,
  QUALITY,
} from "@/game/config/quality";
import type { DestinationId } from "@/game/config/destinations";
import { Input } from "@/game/core/Input";
import { preloadPack1Sprites } from "@/game/render/SpriteLoader";
import {
  WorldScene,
  type InteractHandler,
  type ProximityHandler,
} from "@/game/scenes/WorldScene";

export interface GameOptions {
  characterId: CharacterId;
  onProximityChange?: ProximityHandler;
  onInteract?: InteractHandler;
}

/** Bridge so React touch chrome feeds the same Input the loop reads. */
export interface GameInputBridge {
  setVirtualMovement: (x: number, y: number, active?: boolean) => void;
  triggerInteract: () => void;
  clearVirtualMovement: () => void;
}

export class Game {
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly input = new Input();
  private readonly options: GameOptions;
  private scene: WorldScene | null = null;

  private rafId = 0;
  private lastTimestampMs = 0;
  private running = false;
  private resizeObserver: ResizeObserver | null = null;
  private cssWidth = 1;
  private cssHeight = 1;
  private dpr = 1;
  private worldScale = 1;
  private deviceScale = 1;
  /** Logical camera size in world pixels (equals VIEW_* on desktop). */
  private viewW = VIEW_WIDTH;
  private viewH = VIEW_HEIGHT;
  private mobileLayout = false;

  private pageVisible = true;
  private onVisibility: (() => void) | null = null;

  constructor(canvas: HTMLCanvasElement, options: GameOptions) {
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) {
      throw new Error("Unable to acquire 2D canvas context.");
    }

    this.canvas = canvas;
    this.ctx = ctx;
    this.ctx.imageSmoothingEnabled = false;
    this.options = options;
  }

  async start(): Promise<void> {
    if (this.running) return;

    await preloadPack1Sprites();
    this.scene = new WorldScene(getCharacter(this.options.characterId));
    this.scene.setProximityHandler(this.options.onProximityChange ?? null);
    this.scene.setInteractHandler(this.options.onInteract ?? null);

    this.running = true;
    this.input.attach();
    this.attachResizeObserver();
    this.attachVisibility();
    this.fitCanvasToParent();

    this.lastTimestampMs = 0;
    this.rafId = requestAnimationFrame(this.frame);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.rafId);
    this.input.detach();
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    window.removeEventListener("resize", this.fitCanvasToParent);
    this.detachVisibility();
  }

  /** Lock traveler + interact while overlays / encounter play. */
  setWorldLocked(locked: boolean): void {
    this.scene?.setPlayerLocked(locked);
    if (locked) this.input.clearVirtualMovement();
  }

  /** Touch / React chrome → shared Input (same path as WASD / E). */
  getInputBridge(): GameInputBridge {
    return {
      setVirtualMovement: (x, y, active = true) => {
        this.input.setVirtualMovement(x, y, active);
      },
      triggerInteract: () => {
        this.input.triggerJustPressed("interact");
      },
      clearVirtualMovement: () => {
        this.input.clearVirtualMovement();
      },
    };
  }

  private frame = (timestamp: number): void => {
    if (!this.running || !this.scene) return;

    this.rafId = requestAnimationFrame(this.frame);

    // Pause simulation/render when the tab is hidden — saves CPU/GPU.
    if (!this.pageVisible) {
      this.lastTimestampMs = timestamp;
      return;
    }

    if (this.lastTimestampMs === 0) {
      this.lastTimestampMs = timestamp;
    }

    let dt = (timestamp - this.lastTimestampMs) / 1000;
    this.lastTimestampMs = timestamp;

    if (dt > MAX_DELTA_SECONDS) {
      dt = MAX_DELTA_SECONDS;
    }

    this.scene.update(dt, this.input);
    this.render();
  };

  private render(): void {
    if (!this.scene) return;

    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.imageSmoothingEnabled = false;
    this.ctx.fillStyle = COLORS.void;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.setTransform(this.deviceScale, 0, 0, this.deviceScale, 0, 0);
    this.ctx.imageSmoothingEnabled = false;
    this.scene.draw(this.ctx);

    if (this.mobileLayout) {
      const overlayScale = this.deviceScale / Math.max(this.worldScale, 1e-6);
      this.ctx.setTransform(overlayScale, 0, 0, overlayScale, 0, 0);
    } else {
      // Desktop: CSS size is VIEW * integer scale; overlay uses dpr.
      this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    }
    this.ctx.imageSmoothingEnabled = false;
    this.scene.drawScreenOverlay(this.ctx, this.cssWidth, this.cssHeight);
  }

  private attachVisibility(): void {
    this.onVisibility = () => {
      this.pageVisible = document.visibilityState === "visible";
      if (this.pageVisible) {
        this.lastTimestampMs = 0;
      }
    };
    document.addEventListener("visibilitychange", this.onVisibility);
    this.pageVisible = document.visibilityState === "visible";
  }

  private detachVisibility(): void {
    if (this.onVisibility) {
      document.removeEventListener("visibilitychange", this.onVisibility);
      this.onVisibility = null;
    }
  }

  private attachResizeObserver(): void {
    const parent = this.canvas.parentElement;
    if (!parent || typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", this.fitCanvasToParent);
      return;
    }

    this.resizeObserver = new ResizeObserver(() => {
      this.fitCanvasToParent();
    });
    this.resizeObserver.observe(parent);
  }

  private fitCanvasToParent = (): void => {
    const parent = this.canvas.parentElement;
    if (!parent || !this.scene) return;

    const rect = parent.getBoundingClientRect();
    const parentW = Math.max(1, Math.floor(rect.width));
    const parentH = Math.max(1, Math.floor(rect.height));

    this.dpr = cappedDpr();
    this.mobileLayout = isMobileGameplayLayout();

    if (this.mobileLayout) {
      this.fitMobile(parentW, parentH);
    } else {
      this.fitDesktop(parentW, parentH);
    }

    this.canvas.style.touchAction = "none";
    this.scene.resize(this.viewW, this.viewH);
  };

  /**
   * APPROVED desktop framing — integer scale of fixed VIEW_WIDTH × VIEW_HEIGHT.
   * Letterbox lives outside the canvas (stage background). Do not alter.
   */
  private fitDesktop(parentW: number, parentH: number): void {
    const fit = Math.min(parentW / VIEW_WIDTH, parentH / VIEW_HEIGHT);
    this.worldScale = Math.max(1, Math.floor(fit));
    this.deviceScale = this.worldScale * this.dpr;
    this.viewW = VIEW_WIDTH;
    this.viewH = VIEW_HEIGHT;

    const bufferWidth = VIEW_WIDTH * this.deviceScale;
    const bufferHeight = VIEW_HEIGHT * this.deviceScale;
    this.cssWidth = VIEW_WIDTH * this.worldScale;
    this.cssHeight = VIEW_HEIGHT * this.worldScale;

    if (this.canvas.width !== bufferWidth || this.canvas.height !== bufferHeight) {
      this.canvas.width = bufferWidth;
      this.canvas.height = bufferHeight;
      this.ctx.imageSmoothingEnabled = false;
    }

    this.canvas.style.width = `${this.cssWidth}px`;
    this.canvas.style.height = `${this.cssHeight}px`;

    const left = Math.floor((parentW - this.cssWidth) / 2);
    const top = Math.floor((parentH - this.cssHeight) / 2);
    this.canvas.style.position = "absolute";
    this.canvas.style.left = `${left}px`;
    this.canvas.style.top = `${top}px`;
    this.canvas.style.right = "auto";
    this.canvas.style.bottom = "auto";
    this.canvas.style.transform = "none";
    this.canvas.classList.remove("game-canvas--mobile-fill");
  }

  /**
   * Mobile full-bleed: canvas fills stage; camera aspect = screen aspect.
   * Uniform worldScale — no vertical stretch. Short axis ≈ VIEW_HEIGHT world px.
   * Scale is raised if needed so the camera never exceeds the authored world
   * (avoids empty void padding / stretch from clamping).
   */
  private fitMobile(parentW: number, parentH: number): void {
    const short = Math.min(parentW, parentH);
    let scale = short / VIEW_HEIGHT;
    scale = Math.min(
      QUALITY.MOBILE_SCALE_MAX,
      Math.max(QUALITY.MOBILE_SCALE_MIN, scale),
    );
    // Raise zoom if needed so the camera window fits inside the authored world
    // (prevents void padding). May exceed MOBILE_SCALE_MAX on very tall phones.
    scale = Math.max(scale, parentW / WORLD_WIDTH, parentH / WORLD_HEIGHT);

    const viewW = Math.max(
      64,
      Math.min(WORLD_WIDTH, Math.round(parentW / scale)),
    );
    const viewH = Math.max(
      64,
      Math.min(WORLD_HEIGHT, Math.round(parentH / scale)),
    );

    this.worldScale = scale;
    this.deviceScale = Math.max(1, Math.round(scale * this.dpr));
    this.viewW = viewW;
    this.viewH = viewH;
    this.cssWidth = parentW;
    this.cssHeight = parentH;

    const bufferWidth = Math.max(1, Math.round(viewW * this.deviceScale));
    const bufferHeight = Math.max(1, Math.round(viewH * this.deviceScale));

    if (this.canvas.width !== bufferWidth || this.canvas.height !== bufferHeight) {
      this.canvas.width = bufferWidth;
      this.canvas.height = bufferHeight;
      this.ctx.imageSmoothingEnabled = false;
    }

    this.canvas.style.position = "absolute";
    this.canvas.style.left = "0";
    this.canvas.style.top = "0";
    this.canvas.style.right = "0";
    this.canvas.style.bottom = "0";
    this.canvas.style.width = "100%";
    this.canvas.style.height = "100%";
    this.canvas.style.transform = "none";
    this.canvas.classList.add("game-canvas--mobile-fill");
  }
}

export type { DestinationId };

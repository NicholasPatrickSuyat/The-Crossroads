/**
 * Unified game input — keyboard + virtual stick feed the same movement vector.
 * The game loop reads this each frame; React never owns simulation state.
 */

export type ActionKey = "up" | "down" | "left" | "right" | "interact" | "music";

const KEY_BINDINGS: Record<string, ActionKey> = {
  KeyW: "up",
  ArrowUp: "up",
  KeyS: "down",
  ArrowDown: "down",
  KeyA: "left",
  ArrowLeft: "left",
  KeyD: "right",
  ArrowRight: "right",
  KeyE: "interact",
  KeyM: "music",
};

/** Stick dead-zone applied in VirtualJoystick before values arrive here. */
export class Input {
  private readonly pressed = new Set<ActionKey>();
  private readonly justPressed = new Set<ActionKey>();
  /** Normalized virtual axis from touch joystick (−1…1). */
  private virtualX = 0;
  private virtualY = 0;
  private virtualActive = false;

  constructor() {
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);
  }

  attach(): void {
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
  }

  detach(): void {
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    this.pressed.clear();
    this.justPressed.clear();
    this.clearVirtualMovement();
  }

  isDown(action: ActionKey): boolean {
    return this.pressed.has(action);
  }

  /** True once per press edge; clears the edge for that action. */
  consumeJustPressed(action: ActionKey): boolean {
    if (!this.justPressed.has(action)) return false;
    this.justPressed.delete(action);
    return true;
  }

  /**
   * Fire a one-frame action (touch ENTER → same path as KeyE).
   * Does not hold the key down.
   */
  triggerJustPressed(action: ActionKey): void {
    this.justPressed.add(action);
  }

  /**
   * Virtual stick vector. Pass (0,0) + inactive on release.
   * Values should already be dead-zoned and length-clamped to ≤ 1.
   */
  setVirtualMovement(x: number, y: number, active = true): void {
    if (!active || (x === 0 && y === 0)) {
      this.virtualX = 0;
      this.virtualY = 0;
      this.virtualActive = false;
      return;
    }
    this.virtualX = x;
    this.virtualY = y;
    this.virtualActive = true;
  }

  clearVirtualMovement(): void {
    this.virtualX = 0;
    this.virtualY = 0;
    this.virtualActive = false;
  }

  /**
   * Normalized movement vector (−1…1).
   * Virtual stick wins while active; otherwise WASD / arrows (diagonals normalized).
   */
  getMovementVector(): { x: number; y: number } {
    if (this.virtualActive) {
      return { x: this.virtualX, y: this.virtualY };
    }

    let x = 0;
    let y = 0;

    if (this.isDown("left")) x -= 1;
    if (this.isDown("right")) x += 1;
    if (this.isDown("up")) y -= 1;
    if (this.isDown("down")) y += 1;

    if (x !== 0 && y !== 0) {
      const length = Math.hypot(x, y);
      x /= length;
      y /= length;
    }

    return { x, y };
  }

  private onKeyDown(event: KeyboardEvent): void {
    const action = KEY_BINDINGS[event.code];
    if (!action) return;

    // Don't steal typing inside destination forms / overlays.
    const tag = (event.target as HTMLElement | null)?.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

    event.preventDefault();
    if (!this.pressed.has(action)) {
      this.justPressed.add(action);
    }
    this.pressed.add(action);
  }

  private onKeyUp(event: KeyboardEvent): void {
    const action = KEY_BINDINGS[event.code];
    if (!action) return;
    this.pressed.delete(action);
  }
}

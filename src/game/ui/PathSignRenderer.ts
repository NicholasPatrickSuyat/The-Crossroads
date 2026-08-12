/**
 * Path-sign plaques drawn in the same Canvas pass as the world so they share
 * the exact interpolated camera (no DOM compositor lag / jitter).
 *
 * Text is rasterized under the integer deviceScale transform — readable at
 * typical zoom without an HTML overlay.
 */

export interface PathSignAnchor {
  key: string;
  title: string;
  theme: "shire" | "mountains" | "mordor" | string;
  worldX: number;
  worldY: number;
}

const THEME = {
  shire: {
    boardTop: "#6e5538",
    boardBot: "#4e3a24",
    border: "#3a2a18",
    ink: "#f0e2c4",
  },
  mountains: {
    boardTop: "#5a5e66",
    boardBot: "#3a3e48",
    border: "#2a2e36",
    ink: "#e4e0d4",
  },
  mordor: {
    boardTop: "#4a2a28",
    boardBot: "#2a1614",
    border: "#1a0e0c",
    ink: "#e8c4b0",
  },
} as const;

type ThemeKey = keyof typeof THEME;

function themeOf(name: string) {
  return THEME[(name in THEME ? name : "shire") as ThemeKey];
}

/** World-space half-width padding around the title. */
const PAD_X = 4;
const BOARD_H = 12;

/**
 * Draw all path signs in world/camera space (ctx already camera-translated
 * via draw-at (world - cam) convention used by props).
 */
export function drawPathSigns(
  ctx: CanvasRenderingContext2D,
  anchors: readonly PathSignAnchor[],
  camX: number,
  camY: number,
  viewW: number,
  viewH: number,
): void {
  if (anchors.length === 0) return;

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = 'bold 6px Georgia, "Palatino Linotype", Palatino, serif';

  for (const anchor of anchors) {
    const sx = anchor.worldX - camX;
    const sy = anchor.worldY - camY;

    // Skip when fully outside the view (cheap cull).
    if (sx < -40 || sx > viewW + 40 || sy < -20 || sy > viewH + 40) {
      continue;
    }

    const title = anchor.title.toUpperCase();
    const theme = themeOf(anchor.theme);
    const textW = Math.max(36, ctx.measureText(title).width);
    const boardW = textW + PAD_X * 2;
    const left = sx - boardW / 2;
    const top = sy - BOARD_H;

    const grad = ctx.createLinearGradient(left, top, left, top + BOARD_H);
    grad.addColorStop(0, theme.boardTop);
    grad.addColorStop(1, theme.boardBot);
    ctx.fillStyle = grad;
    ctx.fillRect(left, top, boardW, BOARD_H);

    ctx.strokeStyle = theme.border;
    ctx.lineWidth = 1;
    ctx.strokeRect(left + 0.5, top + 0.5, boardW - 1, BOARD_H - 1);

    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillText(title, sx + 0.5, top + BOARD_H / 2 + 0.5);
    ctx.fillStyle = theme.ink;
    ctx.fillText(title, sx, top + BOARD_H / 2);
  }

  ctx.restore();
}

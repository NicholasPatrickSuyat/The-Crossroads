/**
 * Image preload/cache for Pack 1 cinematic sprites.
 */

import { PACK1_SPRITES, type SpriteKey } from "@/game/render/SpriteCatalog";

const cache = new Map<string, HTMLImageElement>();
let loadPromise: Promise<void> | null = null;
let ready = false;

function loadOne(key: string, src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      cache.set(key, img);
      resolve();
    };
    img.onerror = () => {
      reject(new Error(`Failed to load sprite: ${src}`));
    };
    img.src = src;
  });
}

/** Preload every Pack 1 sprite. Safe to call multiple times. */
export function preloadPack1Sprites(): Promise<void> {
  if (ready) return Promise.resolve();
  if (loadPromise) return loadPromise;

  const entries = Object.entries(PACK1_SPRITES) as [SpriteKey, string][];
  loadPromise = Promise.all(entries.map(([key, src]) => loadOne(key, src)))
    .then(() => {
      ready = true;
    })
    .catch((err) => {
      loadPromise = null;
      throw err;
    });

  return loadPromise;
}

/** @deprecated Prefer preloadPack1Sprites */
export const preloadPack0Sprites = preloadPack1Sprites;

export function areSpritesReady(): boolean {
  return ready;
}

export function getSprite(key: SpriteKey): HTMLImageElement | null {
  return cache.get(key) ?? null;
}

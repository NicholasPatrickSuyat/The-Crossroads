"use client";

/**
 * React host for the canvas game.
 * React mounts/unmounts; Game owns the rAF loop and mutable world state.
 */

import { useEffect, useRef } from "react";
import type { CharacterId } from "@/game/config/characters";
import type { DestinationId } from "@/game/config/destinations";
import { Game, type GameInputBridge } from "@/game/core/Game";
import { FOREST_BUILD } from "@/game/world/SceneCrossroads";

interface GameCanvasProps {
  characterId: CharacterId;
  worldLocked: boolean;
  onReady?: () => void;
  onProximityChange?: (id: DestinationId | null) => void;
  onInteract?: (id: DestinationId) => void;
  onInputBridge?: (bridge: GameInputBridge | null) => void;
  /** Hide keyboard hint when touch chrome is active. */
  hideControlsHint?: boolean;
}

export function GameCanvas({
  characterId,
  worldLocked,
  onReady,
  onProximityChange,
  onInteract,
  onInputBridge,
  hideControlsHint = false,
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const gameRef = useRef<Game | null>(null);
  const onReadyRef = useRef(onReady);
  const proximityRef = useRef(onProximityChange);
  const interactRef = useRef(onInteract);
  const bridgeRef = useRef(onInputBridge);

  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);

  useEffect(() => {
    proximityRef.current = onProximityChange;
  }, [onProximityChange]);

  useEffect(() => {
    interactRef.current = onInteract;
  }, [onInteract]);

  useEffect(() => {
    bridgeRef.current = onInputBridge;
  }, [onInputBridge]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const game = new Game(canvas, {
      characterId,
      onProximityChange: (id) => proximityRef.current?.(id),
      onInteract: (id) => interactRef.current?.(id),
    });
    gameRef.current = game;
    let cancelled = false;

    void game
      .start()
      .then(() => {
        if (cancelled) return;
        bridgeRef.current?.(game.getInputBridge());
        onReadyRef.current?.();
      })
      .catch((err) => {
        if (!cancelled) {
          console.error("Failed to start game / load Pack 1 sprites:", err);
        }
      });

    return () => {
      cancelled = true;
      bridgeRef.current?.(null);
      game.stop();
      gameRef.current = null;
    };
  }, [FOREST_BUILD, characterId]);

  useEffect(() => {
    gameRef.current?.setWorldLocked(worldLocked);
  }, [worldLocked]);

  return (
    <>
      <canvas
        ref={canvasRef}
        className="game-canvas"
        aria-label="The Crossroads interactive portfolio game world"
      />
      {!hideControlsHint && (
        <p className="controls-hint">WASD — Move · E — Interact</p>
      )}
    </>
  );
}

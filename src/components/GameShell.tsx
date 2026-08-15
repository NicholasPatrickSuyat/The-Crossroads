"use client";

/**
 * Entry-flow + destination overlay state machine.
 * Game loop stays outside React; overlays mount/unmount on discrete events.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { AudioControl } from "@/components/AudioControl";
import { CharacterSelect } from "@/components/CharacterSelect";
import { DirectNav } from "@/components/controls/DirectNav";
import { OrientationNudge } from "@/components/controls/OrientationNudge";
import { useMobileGameplayLayout } from "@/components/controls/useMobileGameplayLayout";
import { useTouchChrome } from "@/components/controls/useTouchChrome";
import { VirtualJoystick } from "@/components/controls/VirtualJoystick";
import { EncounterTransition } from "@/components/EncounterTransition";
import { GameCanvas } from "@/components/GameCanvas";
import { InteractPrompt } from "@/components/InteractPrompt";
import { OpeningScreen } from "@/components/OpeningScreen";
import { MountainsScreen } from "@/components/destinations/MountainsScreen";
import { MordorScreen } from "@/components/destinations/MordorScreen";
import { ShireScreen } from "@/components/destinations/ShireScreen";
import { getAudioManager } from "@/game/audio/AudioManager";
import type { AmbienceId } from "@/game/audio/audioCatalog";
import type { CharacterId } from "@/game/config/characters";
import {
  getDestination,
  type DestinationId,
} from "@/game/config/destinations";
import type { GameInputBridge } from "@/game/core/Game";
import { preloadPack1Sprites } from "@/game/render/SpriteLoader";

type Phase = "opening" | "select" | "game";

const FADE_MS = 550;

function destAmbience(id: DestinationId | null): AmbienceId | null {
  return id;
}

export function GameShell() {
  const [phase, setPhase] = useState<Phase>("opening");
  const [veiled, setVeiled] = useState(false);
  const [characterId, setCharacterId] = useState<CharacterId>("wandering-mage");
  const [nearId, setNearId] = useState<DestinationId | null>(null);
  const [encounterFor, setEncounterFor] = useState<DestinationId | null>(null);
  const [openDestination, setOpenDestination] =
    useState<DestinationId | null>(null);
  const timerRef = useRef<number | null>(null);
  const bridgeRef = useRef<GameInputBridge | null>(null);
  const audio = getAudioManager();
  const touchChrome = useTouchChrome();
  const mobileGameplay = useMobileGameplayLayout();

  const worldLocked =
    encounterFor !== null || openDestination !== null || veiled;

  useEffect(() => {
    void preloadPack1Sprites().catch((err) => {
      console.error("Sprite preload failed:", err);
    });
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  // Discrete ambience / duck updates — never per frame.
  useEffect(() => {
    if (phase !== "game") {
      audio.setAmbience(null);
      audio.setDestinationOpen(false, null);
      return;
    }
    if (openDestination) {
      audio.setDestinationOpen(true, destAmbience(openDestination));
      return;
    }
    audio.setDestinationOpen(false, null);
    audio.setAmbience(destAmbience(nearId) ?? "hub");
  }, [audio, phase, nearId, openDestination]);

  const transitionTo = useCallback((next: Phase) => {
    setVeiled(true);
    timerRef.current = window.setTimeout(() => {
      setPhase(next);
      if (next !== "game") setVeiled(false);
    }, FADE_MS);
  }, []);

  const handleEnterWorld = useCallback(() => {
    void audio.unlock();
    transitionTo("select");
  }, [audio, transitionTo]);

  const handleSelect = useCallback(
    (id: CharacterId) => {
      setCharacterId(id);
      void audio.unlock();
      transitionTo("game");
    },
    [audio, transitionTo],
  );

  const handleGameReady = useCallback(() => {
    setVeiled(false);
    audio.startExplorationMusic();
    audio.setAmbience("hub");
  }, [audio]);

  const handleProximity = useCallback((id: DestinationId | null) => {
    setNearId(id);
  }, []);

  const handleInteract = useCallback(
    (id: DestinationId) => {
      audio.playSfx("interact");
      audio.playSfx("encounter", id);
      setNearId(null);
      setEncounterFor(id);
    },
    [audio],
  );

  const handleEncounterDone = useCallback(() => {
    setEncounterFor((current) => {
      if (current) setOpenDestination(current);
      return null;
    });
  }, []);

  const handleCloseDestination = useCallback(() => {
    setOpenDestination(null);
  }, []);

  const handleInputBridge = useCallback((bridge: GameInputBridge | null) => {
    bridgeRef.current = bridge;
  }, []);

  const handleVirtualMove = useCallback(
    (x: number, y: number, active: boolean) => {
      bridgeRef.current?.setVirtualMovement(x, y, active);
    },
    [],
  );

  /** Same path as KeyE — WorldScene consumes interact edge next frame. */
  const handleEnterAction = useCallback(() => {
    void audio.unlock();
    if (bridgeRef.current) {
      bridgeRef.current.triggerInteract();
      return;
    }
    if (nearId) handleInteract(nearId);
  }, [audio, handleInteract, nearId]);

  /** Recruiter shortcut — jump into a destination without playing first. */
  const handleDirectNav = useCallback(
    (id: DestinationId) => {
      void audio.unlock();
      setCharacterId("wandering-mage");
      setNearId(null);
      setEncounterFor(null);
      setOpenDestination(id);
      setPhase("game");
      setVeiled(false);
    },
    [audio],
  );

  const promptAction =
    nearId && !openDestination && !encounterFor
      ? getDestination(nearId).promptAction
      : null;

  const touchPlayUi = touchChrome || mobileGameplay;
  const showTouchPlay =
    phase === "game" && touchPlayUi && !worldLocked;

  useEffect(() => {
    if (!showTouchPlay) {
      bridgeRef.current?.clearVirtualMovement();
    }
  }, [showTouchPlay]);

  useEffect(() => {
    document.documentElement.classList.toggle(
      "px-mobile-gameplay",
      phase === "game" && mobileGameplay,
    );
    return () => {
      document.documentElement.classList.remove("px-mobile-gameplay");
    };
  }, [phase, mobileGameplay]);

  return (
    <>
      {phase === "game" && (
        <>
          <GameCanvas
            characterId={characterId}
            worldLocked={worldLocked}
            onReady={handleGameReady}
            onProximityChange={handleProximity}
            onInteract={handleInteract}
            onInputBridge={handleInputBridge}
            hideControlsHint={touchPlayUi}
          />
          <header
            className={`game-brand${mobileGameplay ? " game-brand--overlay" : ""}`}
          >
            <p className="game-brand__eyebrow">Project X</p>
            <p className="game-brand__title">The Crossroads</p>
            {!mobileGameplay && (
              <p className="game-brand__tagline">Build. Automate. Explore.</p>
            )}
          </header>
          <InteractPrompt
            action={promptAction}
            touchMode={touchPlayUi}
            onEnter={handleEnterAction}
          />
          <VirtualJoystick
            key={showTouchPlay ? "on" : "off"}
            enabled={showTouchPlay}
            onMove={handleVirtualMove}
          />
          {mobileGameplay ? (
            <DirectNav variant="game-menu" onNavigate={handleDirectNav} />
          ) : (
            <DirectNav variant="game" onNavigate={handleDirectNav} />
          )}
        </>
      )}

      {phase === "opening" && (
        <OpeningScreen onEnter={handleEnterWorld} onDirectNav={handleDirectNav} />
      )}
      {phase === "select" && <CharacterSelect onSelect={handleSelect} />}

      <OrientationNudge
        suppressed={
          phase !== "game" || openDestination !== null || encounterFor !== null
        }
      />

      <EncounterTransition
        active={encounterFor !== null}
        theme={encounterFor}
        onComplete={handleEncounterDone}
      />

      {openDestination === "shire" && (
        <ShireScreen onClose={handleCloseDestination} />
      )}
      {openDestination === "mountains" && (
        <MountainsScreen onClose={handleCloseDestination} />
      )}
      {openDestination === "mordor" && (
        <MordorScreen onClose={handleCloseDestination} />
      )}

      <AudioControl />

      <div
        className={`fade-veil${veiled ? " fade-veil--on" : ""}`}
        aria-hidden="true"
      />
    </>
  );
}

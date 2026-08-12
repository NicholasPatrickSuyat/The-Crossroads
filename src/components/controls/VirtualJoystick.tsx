"use client";

/**
 * Low-visibility virtual joystick — lower-left safe zone.
 * Invisible until touched; feeds normalized (−1…1) into the shared Input path.
 */

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";

const DEAD_ZONE = 0.14;
/** Max thumb travel (CSS px) before vector saturates at length 1. */
const MAX_RADIUS = 46;

interface VirtualJoystickProps {
  enabled: boolean;
  onMove: (x: number, y: number, active: boolean) => void;
}

export function VirtualJoystick({ enabled, onMove }: VirtualJoystickProps) {
  const zoneRef = useRef<HTMLDivElement | null>(null);
  const pointerIdRef = useRef<number | null>(null);
  const originRef = useRef({ x: 0, y: 0 });
  const onMoveRef = useRef(onMove);
  const [visible, setVisible] = useState(false);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const [base, setBase] = useState({ x: 66, y: 66 });

  useEffect(() => {
    onMoveRef.current = onMove;
  }, [onMove]);

  const applyFromClient = useCallback((clientX: number, clientY: number) => {
    const dx = clientX - originRef.current.x;
    const dy = clientY - originRef.current.y;
    const dist = Math.hypot(dx, dy);
    const clamped = Math.min(dist, MAX_RADIUS);
    const angle = dist > 0 ? Math.atan2(dy, dx) : 0;
    const kx = Math.cos(angle) * clamped;
    const ky = Math.sin(angle) * clamped;
    setKnob({ x: kx, y: ky });

    let nx = kx / MAX_RADIUS;
    let ny = ky / MAX_RADIUS;
    const mag = Math.hypot(nx, ny);
    if (mag < DEAD_ZONE) {
      onMoveRef.current(0, 0, true);
      return;
    }
    // Remap dead-zone → full range, then re-normalize so diagonals stay ≤ 1.
    const remapped = (mag - DEAD_ZONE) / (1 - DEAD_ZONE);
    const scale = remapped / mag;
    nx *= scale;
    ny *= scale;
    const len = Math.hypot(nx, ny);
    if (len > 1) {
      nx /= len;
      ny /= len;
    }
    onMoveRef.current(nx, ny, true);
  }, []);

  const endPointer = useCallback(() => {
    pointerIdRef.current = null;
    setVisible(false);
    setKnob({ x: 0, y: 0 });
    onMoveRef.current(0, 0, false);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const onMoveWin = (e: PointerEvent) => {
      if (pointerIdRef.current !== e.pointerId) return;
      e.preventDefault();
      applyFromClient(e.clientX, e.clientY);
    };
    const onUpWin = (e: PointerEvent) => {
      if (pointerIdRef.current !== e.pointerId) return;
      endPointer();
    };

    window.addEventListener("pointermove", onMoveWin, { passive: false });
    window.addEventListener("pointerup", onUpWin);
    window.addEventListener("pointercancel", onUpWin);
    return () => {
      window.removeEventListener("pointermove", onMoveWin);
      window.removeEventListener("pointerup", onUpWin);
      window.removeEventListener("pointercancel", onUpWin);
    };
  }, [enabled, applyFromClient, endPointer]);

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!enabled) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();

    const zone = zoneRef.current;
    if (!zone) return;
    const rect = zone.getBoundingClientRect();
    const localX = e.clientX - rect.left;
    const localY = e.clientY - rect.top;

    pointerIdRef.current = e.pointerId;
    originRef.current = { x: e.clientX, y: e.clientY };
    setBase({ x: localX, y: localY });
    setKnob({ x: 0, y: 0 });
    setVisible(true);
    onMoveRef.current(0, 0, true);

    try {
      zone.setPointerCapture(e.pointerId);
    } catch {
      /* capture optional */
    }
  };

  if (!enabled) return null;

  return (
    <div
      ref={zoneRef}
      className={`virt-stick${visible ? " virt-stick--active" : ""}`}
      onPointerDown={onPointerDown}
      role="presentation"
      aria-hidden="true"
    >
      <div
        className="virt-stick__base"
        style={{
          left: base.x,
          top: base.y,
          opacity: visible ? 1 : 0,
        }}
      >
        <div
          className="virt-stick__knob"
          style={{
            transform: `translate(${knob.x}px, ${knob.y}px)`,
          }}
        />
      </div>
    </div>
  );
}

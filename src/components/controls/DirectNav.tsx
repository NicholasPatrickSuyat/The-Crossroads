"use client";

/**
 * Unobtrusive recruiter / client content shortcuts.
 * Opening: text links. Desktop game: subtle top links.
 * Mobile game: compact menu button (does not reserve vertical layout).
 */

import { useEffect, useId, useRef, useState } from "react";
import type { DestinationId } from "@/game/config/destinations";

interface DirectNavProps {
  onNavigate: (id: DestinationId) => void;
  /** Compact corner variant while in-world. */
  variant?: "opening" | "game" | "game-menu";
}

const LINKS: { id: DestinationId; label: string }[] = [
  { id: "shire", label: "About" },
  { id: "mountains", label: "Projects" },
  { id: "mordor", label: "Start a Project" },
];

export function DirectNav({ onNavigate, variant = "opening" }: DirectNavProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLElement | null>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDoc);
    return () => document.removeEventListener("pointerdown", onDoc);
  }, [open]);

  if (variant === "game-menu") {
    return (
      <nav
        ref={rootRef}
        className="direct-nav direct-nav--menu"
        aria-label="Portfolio sections"
      >
        <button
          type="button"
          className="direct-nav__menu-btn"
          aria-expanded={open}
          aria-controls={menuId}
          onClick={() => setOpen((v) => !v)}
        >
          Menu
        </button>
        {open && (
          <ul id={menuId} className="direct-nav__menu-list">
            {LINKS.map((link) => (
              <li key={link.id}>
                <button
                  type="button"
                  className="direct-nav__menu-link"
                  onClick={() => {
                    setOpen(false);
                    onNavigate(link.id);
                  }}
                >
                  {link.label}
                </button>
              </li>
            ))}
          </ul>
        )}
      </nav>
    );
  }

  return (
    <nav
      className={`direct-nav direct-nav--${variant}`}
      aria-label="Portfolio sections"
    >
      {variant === "opening" && (
        <span className="direct-nav__label">Explore</span>
      )}
      <ul className="direct-nav__list">
        {LINKS.map((link) => (
          <li key={link.id}>
            <button
              type="button"
              className="direct-nav__link"
              onClick={() => onNavigate(link.id)}
            >
              {link.label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}

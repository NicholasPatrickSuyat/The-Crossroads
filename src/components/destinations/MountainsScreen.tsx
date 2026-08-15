"use client";

/**
 * Mistveil Mountains — Projects archive (stone / adventure themed).
 */

import { useEffect } from "react";
import { PORTFOLIO } from "@/game/config/portfolio";

interface MountainsScreenProps {
  onClose: () => void;
}

const featured = PORTFOLIO.projects.quoteGeneratorPro;

export function MountainsScreen({ onClose }: MountainsScreenProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="dest dest--mountains"
      role="dialog"
      aria-labelledby="mtn-title"
    >
      <div className="dest__panel">
        <header className="dest__header">
          <p className="dest__eyebrow">Mistveil Mountains</p>
          <h2 id="mtn-title" className="dest__title">
            Projects
          </h2>
          <button type="button" className="dest__close" onClick={onClose}>
            Return to Crossroads
          </button>
        </header>

        <div className="dest__body">
          <article className="project-card project-card--featured">
            <p className="project-card__status">{featured.status}</p>
            <h3 className="project-card__title">{featured.title}</h3>
            <p className="project-card__blurb">{featured.blurb}</p>
            <a
              className="project-card__link"
              href={featured.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              View Live Project
            </a>
          </article>
        </div>

        <p className="dest__hint">Esc — Return</p>
      </div>
    </div>
  );
}

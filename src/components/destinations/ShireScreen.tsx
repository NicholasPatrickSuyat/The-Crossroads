"use client";

/**
 * The Shire — About Me (warm / cozy themed overlay).
 * Real profile photo, education, skills, LinkedIn / GitHub.
 */

import Image from "next/image";
import { useEffect } from "react";
import { PORTFOLIO } from "@/game/config/portfolio";

interface ShireScreenProps {
  onClose: () => void;
}

export function ShireScreen({ onClose }: ShireScreenProps) {
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

  const education = PORTFOLIO.education;
  const skills = PORTFOLIO.skills;

  return (
    <div className="dest dest--shire" role="dialog" aria-labelledby="shire-title">
      <div className="dest__panel">
        <header className="dest__header">
          <p className="dest__eyebrow">The Shire</p>
          <h2 id="shire-title" className="dest__title">
            About Me
          </h2>
          <button type="button" className="dest__close" onClick={onClose}>
            Return to Crossroads
          </button>
        </header>

        <div className="dest__body shire-layout">
          <div className="shire-layout__portrait">
            <div className="shire-layout__portrait-frame">
              <Image
                className="shire-layout__photo"
                src={PORTFOLIO.profileImageSrc}
                alt={PORTFOLIO.profileImageAlt}
                fill
                sizes="(max-width: 640px) 42vw, 160px"
                priority
              />
            </div>
            <p className="shire-layout__name">{PORTFOLIO.displayName}</p>
          </div>

          <div className="shire-layout__main">
            <section className="dest__section">
              <h3>Hello, traveler</h3>
              <p>
                I build software, automate workflows, and explore ideas until they
                become reliable tools people can actually use. This portfolio is a
                small world for that journey.
              </p>
            </section>

            <section className="dest__section">
              <h3>What I build</h3>
              <ul className="dest__list">
                <li>Websites &amp; polished frontends</li>
                <li>Web apps &amp; product software</li>
                <li>Automation &amp; tooling</li>
                <li>APIs &amp; integrations</li>
              </ul>
            </section>

            <section className="dest__section">
              <h3>Background</h3>
              <p>
                Software engineer with a taste for clear systems, thoughtful UX,
                and fantasy atmospheres. Education and skills are listed below.
              </p>
            </section>
          </div>

          <aside className="shire-layout__meta">
            <section className="dest__section shire-layout__slot shire-layout__slot--education">
              <h3>Education</h3>
              {education.length > 0 ? (
                <ul className="shire-edu">
                  {education.map((entry) => (
                    <li
                      key={`${entry.school}-${entry.degree ?? ""}-${entry.year ?? ""}`}
                      className="shire-edu__item"
                    >
                      <span className="shire-edu__school">{entry.school}</span>
                      {entry.degree ? (
                        <span className="shire-edu__degree">{entry.degree}</span>
                      ) : null}
                      {entry.year ? (
                        <span className="shire-edu__year">{entry.year}</span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="shire-layout__soon">
                  Details coming soon — awaiting final Education copy.
                </p>
              )}
            </section>

            <section className="dest__section shire-layout__slot shire-layout__slot--skills">
              <h3>Skills</h3>
              {skills.length > 0 ? (
                <ul className="shire-skills">
                  {skills.map((skill) => (
                    <li key={skill} className="shire-skills__tag">
                      {skill}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="shire-layout__soon">
                  Details coming soon — awaiting final Skills list.
                </p>
              )}
            </section>

            <section className="dest__section shire-layout__slot">
              <h3>Connect</h3>
              <div className="shire-layout__links">
                <a
                  className="shire-layout__link"
                  href={PORTFOLIO.links.linkedIn}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  LinkedIn
                </a>
                <a
                  className="shire-layout__link"
                  href={PORTFOLIO.links.github}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  GitHub
                </a>
              </div>
            </section>
          </aside>
        </div>

        <p className="dest__hint">Esc — Return</p>
      </div>
    </div>
  );
}

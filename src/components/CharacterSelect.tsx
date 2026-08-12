"use client";

import { CHARACTERS, type CharacterId } from "@/game/config/characters";
import { PACK1_SPRITES } from "@/game/render/SpriteCatalog";

interface CharacterSelectProps {
  onSelect: (id: CharacterId) => void;
}

/**
 * Character select. Cards are driven entirely by the CHARACTERS catalog —
 * a character with no runtime sheet renders as unavailable (never fake art).
 */
export function CharacterSelect({ onSelect }: CharacterSelectProps) {
  return (
    <section className="screen screen--select">
      <div className="screen__inner">
        <h2 className="select__title">Choose Your Traveler</h2>
        <div className="select__grid">
          {CHARACTERS.map((character) => {
            const sheetSrc = character.sheetKey
              ? PACK1_SPRITES[character.sheetKey]
              : null;
            return (
              <button
                key={character.id}
                type="button"
                className={`traveler-card${
                  character.available ? "" : " traveler-card--disabled"
                }`}
                disabled={!character.available}
                aria-disabled={!character.available}
                onClick={() => onSelect(character.id)}
              >
                <span className="traveler-card__portrait" aria-hidden="true">
                  {sheetSrc ? (
                    // Down-idle frame (col 0, row 0) of the real sheet.
                    <span
                      className="traveler-card__sprite"
                      style={{ backgroundImage: `url(${sheetSrc})` }}
                    />
                  ) : (
                    <span className="traveler-card__unknown">?</span>
                  )}
                </span>
                <span className="traveler-card__name">{character.name}</span>
                <span className="traveler-card__epithet">
                  {character.epithet}
                </span>
                {!character.available && (
                  <span className="traveler-card__tag">Arriving soon</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

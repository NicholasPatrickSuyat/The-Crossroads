import { DirectNav } from "@/components/controls/DirectNav";
import type { DestinationId } from "@/game/config/destinations";

interface OpeningScreenProps {
  onEnter: () => void;
  onDirectNav: (id: DestinationId) => void;
}

export function OpeningScreen({ onEnter, onDirectNav }: OpeningScreenProps) {
  return (
    <section className="screen screen--opening">
      <div className="screen__inner">
        <h1 className="opening__title">Project X</h1>
        <div className="opening__rule" aria-hidden="true" />
        <p className="opening__tagline">Build. Automate. Explore.</p>
        <button
          type="button"
          className="btn-primary"
          onClick={onEnter}
          autoFocus
        >
          Enter the World
        </button>
        <DirectNav variant="opening" onNavigate={onDirectNav} />
      </div>
    </section>
  );
}

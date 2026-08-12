import { GameShell } from "@/components/GameShell";

export default function Home() {
  return (
    <main className="game-shell">
      <div className="game-stage">
        <GameShell />
      </div>
    </main>
  );
}

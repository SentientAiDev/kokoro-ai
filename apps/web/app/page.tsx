import { healthMessage } from "@kokoro/shared";

export default function HomePage() {
  return (
    <main>
      <h1>Kokoro Presence</h1>
      <p>{healthMessage("builder")}</p>
      <p>T0 bootstrap complete: monorepo, quality checks, and CI are wired.</p>
    </main>
  );
}

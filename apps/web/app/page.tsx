import { e1rmEpley } from "@bstrainer/engine";

export default function Home() {
  const demo = e1rmEpley(100, 5);
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-4xl font-bold tracking-tight">bstrainer</h1>
      <p className="text-zinc-400">
        Planejamento, execução e análise de treinamento de força.
      </p>
      <p className="text-sm text-zinc-500">
        Engine de teste: e1RM de 100kg x 5 reps = {demo.toFixed(1)}kg (Epley)
      </p>
    </main>
  );
}

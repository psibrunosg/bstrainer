export default function PlansPage() {
  return (
    <div className="mx-auto max-w-lg space-y-4 p-4">
      <h1 className="text-2xl font-bold">Fichas</h1>
      <p className="text-sm text-zinc-400">
        Planos de treino ativos e biblioteca de templates de periodização.
      </p>
      <a
        href="/plans/templates"
        className="block rounded-xl border border-zinc-800 bg-zinc-900 p-4 transition hover:border-zinc-600"
      >
        <h2 className="font-semibold">Biblioteca de templates</h2>
        <p className="mt-1 text-sm text-zinc-400">
          Periodizações prontas baseadas em literatura — linear, hipertrofia,
          minimalista.
        </p>
      </a>
    </div>
  );
}

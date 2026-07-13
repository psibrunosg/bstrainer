export default function PlansPage() {
  return (
    <div className="mx-auto max-w-lg space-y-4 p-4">
      <h1 className="font-display text-[28px] font-extrabold uppercase tracking-tight">
        Fichas
      </h1>
      <p className="text-sm leading-relaxed text-mute">
        Planos de treino ativos e biblioteca de templates de periodização.
      </p>
      <a
        href="/plans/templates"
        className="block rounded-lg border border-line bg-surface p-4 transition-colors duration-200 hover:bg-surface-2"
      >
        <h2 className="caps-label font-display font-semibold text-mute">
          Biblioteca de templates
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-text">
          Periodizações prontas baseadas em literatura — linear, hipertrofia,
          minimalista.
        </p>
      </a>
    </div>
  );
}

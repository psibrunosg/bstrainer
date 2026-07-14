import { createClient } from "@/lib/supabase/server";
import { InviteClientForm } from "@/components/InviteClientForm";

interface ClientLinkRow {
  id: string;
  status: string;
  invite_email: string | null;
  client_id: string | null;
  profiles: { name: string } | null;
}

const STATUS_LABEL: Record<string, string> = {
  invited: "Convidado",
  active: "Ativo",
  archived: "Arquivado",
};

export default async function ClientsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let links: ClientLinkRow[] = [];
  if (user) {
    const { data } = await supabase
      .from("client_links")
      .select("id, status, invite_email, client_id, profiles:client_id(name)")
      .eq("trainer_id", user.id)
      .order("status", { ascending: true });
    links = (data as unknown as ClientLinkRow[] | null) ?? [];
  }

  const active = links.filter((l) => l.status === "active");
  const pending = links.filter((l) => l.status === "invited");

  return (
    <div className="mx-auto max-w-lg space-y-6 p-4">
      <div>
        <h1 className="font-display text-[28px] font-extrabold uppercase tracking-tight">
          Alunos
        </h1>
        <p className="mt-1 text-sm text-mute">
          Convide por e-mail. Quando o aluno criar a conta, o vínculo é ativado
          automaticamente.
        </p>
      </div>

      <InviteClientForm />

      {links.length === 0 ? (
        <p className="rounded-lg border border-line bg-surface p-6 text-center text-sm text-mute">
          Nenhum aluno ainda. Envie o primeiro convite acima.
        </p>
      ) : (
        <div className="space-y-5">
          {active.length > 0 && (
            <section className="space-y-2">
              <h2 className="caps-label font-display font-semibold text-mute">
                Ativos · {active.length}
              </h2>
              <ul className="space-y-px">
                {active.map((l) => (
                  <li
                    key={l.id}
                    className="flex items-center justify-between border-b border-line px-1 py-3 last:border-b-0"
                  >
                    <span className="text-text">
                      {l.profiles?.name ?? "Aluno"}
                    </span>
                    <span className="caps-label text-ok">
                      {STATUS_LABEL[l.status]}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {pending.length > 0 && (
            <section className="space-y-2">
              <h2 className="caps-label font-display font-semibold text-mute">
                Convites pendentes · {pending.length}
              </h2>
              <ul className="space-y-px">
                {pending.map((l) => (
                  <li
                    key={l.id}
                    className="flex items-center justify-between border-b border-line px-1 py-3 last:border-b-0"
                  >
                    <span className="text-mute">{l.invite_email}</span>
                    <span className="caps-label text-mute">
                      {STATUS_LABEL[l.status]}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

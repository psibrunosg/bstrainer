"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Já logado (ou magic link recém-processado pelo client) -> vai pro app
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace("/dashboard");
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) router.replace("/dashboard");
    });
    return () => subscription.unsubscribe();
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}${BASE_PATH}/login/`,
      },
    });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-ink p-6 text-text">
      <div className="w-full max-w-sm space-y-8">
        <div className="space-y-2">
          <p className="caps-label font-display font-semibold text-signal">
            bstrainer
          </p>
          <h1 className="font-display text-[28px] font-extrabold uppercase tracking-tight">
            Entrar
          </h1>
          <p className="text-sm leading-relaxed text-mute">
            Digite seu e-mail para receber um link de acesso.
          </p>
        </div>

        {sent ? (
          <p className="rounded-lg border border-line bg-surface p-4 text-sm text-text">
            Link enviado para <strong>{email}</strong>. Confira sua caixa de
            entrada.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block space-y-1.5">
              <span className="caps-label block font-medium text-mute">
                E-mail
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="h-12 w-full rounded border border-line bg-surface px-4 text-base text-text outline-none transition-colors duration-200 placeholder:text-mute focus:border-signal"
              />
            </label>
            <button
              type="submit"
              disabled={loading}
              className="h-12 w-full rounded-lg bg-signal px-4 text-[15px] font-semibold text-ink transition active:scale-[0.98] active:bg-signal-press disabled:opacity-50"
            >
              {loading ? "Enviando…" : "Enviar link de acesso"}
            </button>
            {error && <p className="text-sm text-err">{error}</p>}
          </form>
        )}
      </div>
    </main>
  );
}

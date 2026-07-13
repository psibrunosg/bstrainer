"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-3xl font-bold tracking-tight">bstrainer</h1>
          <p className="text-sm text-zinc-400">
            Entre com seu e-mail para receber um link de acesso
          </p>
        </div>

        {sent ? (
          <p className="rounded-lg border border-emerald-800 bg-emerald-950 p-4 text-sm text-emerald-300">
            Link enviado para <strong>{email}</strong>. Confira sua caixa de
            entrada.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-base outline-none focus:border-zinc-400"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-zinc-100 px-4 py-3 font-medium text-zinc-900 transition hover:bg-white disabled:opacity-50"
            >
              {loading ? "Enviando…" : "Enviar link de acesso"}
            </button>
            {error && <p className="text-sm text-red-400">{error}</p>}
          </form>
        )}
      </div>
    </main>
  );
}

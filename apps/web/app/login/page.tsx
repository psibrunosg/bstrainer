"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace("/dashboard");
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) router.replace("/dashboard");
    });
    return () => subscription.unsubscribe();
  }, [router]);

  function changeMode() {
    setIsSignUp((value) => !value);
    setError(null);
    setMessage(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const supabase = createClient();
    const result = isSignUp
      ? await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}${BASE_PATH}/login/`,
          },
        })
      : await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);
    if (result.error) {
      setError(result.error.message);
    } else if (isSignUp && !result.data.session) {
      setMessage("Conta criada. Confirme seu e-mail para entrar.");
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-ink p-6 text-text">
      <div className="w-full max-w-sm space-y-8 rounded-lg border border-line bg-surface p-6 shadow-2xl shadow-black/20">
        <div className="space-y-2">
          <p className="caps-label font-display font-semibold text-signal">
            bstrainer
          </p>
          <h1 className="font-display text-[28px] font-extrabold uppercase tracking-tight">
            {isSignUp ? "Criar conta" : "Entrar"}
          </h1>
          <p className="text-sm leading-relaxed text-mute">
            {isSignUp
              ? "Crie seu acesso com e-mail e senha."
              : "Use seu e-mail e senha para acessar sua conta."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block space-y-1.5">
            <span className="caps-label block font-medium text-mute">E-mail</span>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="h-12 w-full rounded border border-line bg-surface px-4 text-base text-text outline-none transition-colors duration-200 placeholder:text-mute focus:border-signal"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="caps-label block font-medium text-mute">Senha</span>
            <input
              type="password"
              required
              minLength={8}
              autoComplete={isSignUp ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo de 8 caracteres"
              className="h-12 w-full rounded border border-line bg-surface px-4 text-base text-text outline-none transition-colors duration-200 placeholder:text-mute focus:border-signal"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="h-12 w-full rounded-lg bg-signal px-4 text-[15px] font-semibold text-ink transition active:scale-[0.98] active:bg-signal-press disabled:opacity-50"
          >
            {loading ? "Aguarde…" : isSignUp ? "Criar conta" : "Entrar"}
          </button>

          {error && <p className="text-sm text-err">{error}</p>}
          {message && <p className="text-sm text-text">{message}</p>}
        </form>

        <button
          type="button"
          onClick={changeMode}
          className="w-full text-sm text-mute transition hover:text-text"
        >
          {isSignUp ? "Já tenho conta" : "Ainda não tenho conta"}
        </button>
      </div>
    </main>
  );
}

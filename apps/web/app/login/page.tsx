"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
type AuthMode = "sign-in" | "sign-up" | "reset" | "update-password";

function authError(message: string) {
  if (message.includes("Invalid login credentials")) {
    return "E-mail ou senha inválidos.";
  }
  if (message.includes("Email not confirmed")) {
    return "Confirme seu e-mail antes de entrar.";
  }
  return message;
}

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    const isRecovery = () =>
      window.location.hash.includes("type=recovery") ||
      new URLSearchParams(window.location.search).get("type") === "recovery";

    supabase.auth.getSession().then(({ data }) => {
      if (data.session && !isRecovery()) router.replace("/dashboard");
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" && session) {
        setMode("update-password");
        setMessage("Defina uma nova senha para concluir a recuperação.");
      } else if (session) {
        router.replace("/dashboard");
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  function changeMode(nextMode: AuthMode) {
    setMode(nextMode);
    setError(null);
    setMessage(null);
    setPassword("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const supabase = createClient();
    const redirectTo = `${window.location.origin}${BASE_PATH}/login/`;
    const result =
      mode === "sign-up"
        ? await supabase.auth.signUp({
            email,
            password,
            options: { emailRedirectTo: redirectTo },
          })
        : mode === "reset"
          ? await supabase.auth.resetPasswordForEmail(email, { redirectTo })
          : mode === "update-password"
            ? await supabase.auth.updateUser({ password })
            : await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);
    if (result.error) {
      setError(authError(result.error.message));
    } else if (mode === "sign-up") {
      setMessage("Conta criada. Confirme seu e-mail para entrar.");
    } else if (mode === "reset") {
      setMessage("Se o e-mail estiver cadastrado, enviamos um link para redefinir sua senha.");
    } else if (mode === "update-password") {
      router.replace("/dashboard");
    }
  }

  const isPasswordMode = mode === "sign-in" || mode === "sign-up";
  const title =
    mode === "sign-up"
      ? "Criar conta"
      : mode === "reset"
        ? "Recuperar senha"
        : mode === "update-password"
          ? "Nova senha"
          : "Entrar";

  return (
    <main className="flex min-h-screen items-center justify-center bg-ink p-6 text-text">
      <div className="w-full max-w-sm space-y-8 rounded-lg border border-line bg-surface p-6 shadow-2xl shadow-black/20">
        <div className="space-y-2">
          <p className="caps-label font-display font-semibold text-signal">bstrainer</p>
          <h1 className="font-display text-4xl font-bold tracking-tight">{title}</h1>
          <p className="text-sm leading-relaxed text-mute">
            {mode === "sign-up"
              ? "Crie seu acesso com e-mail e senha."
              : mode === "reset"
                ? "Informe seu e-mail para receber o link de recuperação."
                : mode === "update-password"
                  ? "Escolha uma senha nova, com pelo menos 8 caracteres."
                  : "Use seu e-mail e senha para acessar sua conta."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode !== "update-password" && (
            <label className="block space-y-1.5">
              <span className="caps-label block font-medium text-mute">E-mail</span>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="h-12 w-full rounded border border-line bg-surface px-4 text-base text-text outline-none transition-colors placeholder:text-mute focus:border-signal"
              />
            </label>
          )}

          {mode !== "reset" && (
            <label className="block space-y-1.5">
              <span className="caps-label block font-medium text-mute">Senha</span>
              <input
                type="password"
                required
                minLength={8}
                autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo de 8 caracteres"
                className="h-12 w-full rounded border border-line bg-surface px-4 text-base text-text outline-none transition-colors placeholder:text-mute focus:border-signal"
              />
            </label>
          )}

          <button
            type="submit"
            disabled={loading}
            className="h-12 w-full rounded-full bg-signal px-4 text-[15px] font-semibold text-surface transition active:scale-[0.98] active:bg-signal-press disabled:opacity-50"
          >
            {loading
              ? "Aguarde…"
              : mode === "sign-up"
                ? "Criar conta"
                : mode === "reset"
                  ? "Enviar link de recuperação"
                  : mode === "update-password"
                    ? "Salvar nova senha"
                    : "Entrar"}
          </button>

          {error && <p className="text-sm text-err">{error}</p>}
          {message && <p className="text-sm text-text">{message}</p>}
        </form>

        {mode === "sign-in" && (
          <div className="space-y-3 text-center text-sm">
            <button type="button" onClick={() => changeMode("reset")} className="block w-full text-mute transition hover:text-text">
              Esqueci minha senha
            </button>
            <button type="button" onClick={() => changeMode("sign-up")} className="block w-full text-mute transition hover:text-text">
              Ainda não tenho conta
            </button>
          </div>
        )}

        {isPasswordMode && mode === "sign-up" && (
          <button type="button" onClick={() => changeMode("sign-in")} className="block w-full text-sm text-mute transition hover:text-text">
            Já tenho conta
          </button>
        )}

        {mode === "reset" && (
          <button type="button" onClick={() => changeMode("sign-in")} className="block w-full text-sm text-mute transition hover:text-text">
            Voltar para entrar
          </button>
        )}
      </div>
    </main>
  );
}

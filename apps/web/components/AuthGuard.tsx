"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Guarda de rota client-side (substitui o middleware server no build estático).
 * Sem sessão -> manda pro /login. Enquanto verifica, mostra placeholder.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [state, setState] = useState<"checking" | "authed">("checking");

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      if (data.session) {
        setState("authed");
      } else {
        router.replace("/login");
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      if (session) setState("authed");
      else router.replace("/login");
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [router]);

  if (state === "checking") {
    return (
      <div className="mx-auto max-w-lg space-y-4 p-4">
        <div className="h-8 w-40 animate-pulse rounded bg-surface-2" />
        <div className="h-52 animate-pulse rounded-lg bg-surface-2" />
      </div>
    );
  }

  return <>{children}</>;
}

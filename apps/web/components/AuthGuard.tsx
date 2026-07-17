"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getMyAthleteProfile } from "@/lib/data/athlete";

/**
 * Guarda de rota client-side (substitui o middleware server no build estático).
 * Sem sessão -> manda pro /login. Sem perfil de atleta -> manda pro /onboarding.
 * Enquanto verifica, mostra placeholder.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [state, setState] = useState<"checking" | "authed">("checking");

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    async function checkOnboarding() {
      if (pathname === "/onboarding") return;
      const profile = await getMyAthleteProfile();
      if (active && !profile) router.replace("/onboarding");
    }

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      if (data.session) {
        setState("authed");
        checkOnboarding();
      } else {
        router.replace("/login");
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      if (session) {
        setState("authed");
        checkOnboarding();
      } else {
        router.replace("/login");
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [router, pathname]);

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

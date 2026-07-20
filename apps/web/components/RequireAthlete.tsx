"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { canManageClients } from "@/lib/data/memberships";

/**
 * Bloqueia rotas de auto-treino (/personal, /train) pra quem já é personal —
 * personal gerencia alunos, não treina a si mesmo por aqui. Client-side,
 * mesmo padrão do AuthGuard/RequireTrainer.
 */
export function RequireAthlete({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [state, setState] = useState<"checking" | "allowed">("checking");

  useEffect(() => {
    let active = true;
    canManageClients().then((isTrainer) => {
      if (!active) return;
      if (isTrainer) router.replace("/clients");
      else setState("allowed");
    });
    return () => {
      active = false;
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

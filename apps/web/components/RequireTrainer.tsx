"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { canManageClients } from "@/lib/data/memberships";

/**
 * Guarda funções de personal (gestão de alunos, criar plano pra terceiros) do
 * lado do aluno. Client-side, mesmo padrão do AuthGuard — sem middleware
 * server no build estático.
 */
export function RequireTrainer({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [state, setState] = useState<"checking" | "allowed">("checking");

  useEffect(() => {
    let active = true;
    canManageClients().then((allowed) => {
      if (!active) return;
      if (allowed) setState("allowed");
      else router.replace("/dashboard");
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

# Polimento Geral de Interação + Modo Noturno — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tornar a interação do bstrainer mais fluida (nav, botões, estados vazios, seletor de PSE, loading) e introduzir modo noturno completo, sem trocar a identidade visual (creme + verde-petróleo + Cormorant Garamond/Inter) nem adicionar dependências de animação JS.

**Architecture:** Reestruturar `globals.css` pra tokens de cor semânticos duplicados claro/escuro (padrão `@media (prefers-color-scheme)` + `[data-theme]`, cascata pura CSS). Extrair dois componentes compartilhados novos (`Button`, `EmptyState`) e migrar as telas voltadas pro atleta pra usá-los, garantindo consistência de press/spring em vez de className repetido em cada arquivo. Tudo em CSS/Tailwind — zero dependência nova.

**Tech Stack:** Next.js 15 (App Router, `output: "export"`), Tailwind CSS v4 (`@theme` em `globals.css`), TypeScript, Vitest pra lógica pura.

## Global Constraints

- Não adicionar `framer-motion`/`motion` nem qualquer lib de animação JS — só CSS/Tailwind.
- Manter paleta e tipografia atuais (`docs/DESIGN.md` seções 1–2) — só as regras de "Não fazer" mudam, não a identidade.
- Nenhuma animação/transição **de interação pontual** (confirmação, PR, pulso do timer, press/spring de botão, indicador de nav) pode passar de 400ms (regra existente, seção 4 do `DESIGN.md`). **Anulada para animações de estado ambiente/em loop** (ex.: `.skeleton-shimmer`, que roda em 1.6s contínuo) — essas comunicam "processo em andamento", não uma reação a um toque, e um loop de até 400ms ficaria ilegível como brilho. Decisão registrada aqui em 04/08/2026 depois de revisão da Task 1; `DESIGN.md` seção 4 é atualizado na Task 13 pra refletir essa distinção.
- `prefers-reduced-motion: reduce` zera toda animação/transição — já existe em `globals.css:79-86`, qualquer nova animação deve continuar coberta por esse bloco (ele usa `*`, então já cobre automaticamente).
- Alvos de toque ≥ 44×44px em qualquer botão de ação primária/secundária com texto e em qualquer controle tipo toggle/segmented (ex.: `ThemeToggle`). **Exceções:** (1) botões de ícone compactos (`Button size="icon"`, `h-9 w-9` = 36px) seguem o padrão já em produção no app (ex.: `⇄`/`✕` em `ExerciseBlockCard.tsx`) — não é regressão, é convenção existente mantida deliberadamente; (2) grids densos de opções numéricas (sRPE 0-10 no overlay de finalizar treino, opções de PSE no picker inline da Task 8) usam células menores (`h-8 w-8`/`h-14`) porque o alvo real de precisão é escolher entre várias opções próximas, não um toque isolado — mesmo padrão já aceito pro grid de sRPE existente.
- Escopo desta fatia é **só as telas voltadas pro atleta** já auditadas nesta sessão: nav inferior, `train/session`, `ExerciseBlockCard`/`SetRow`/`BlockCards`/`SessionSummary`, `measurements`, `dashboard`, `personal`, `settings`. Landing (`app/page.tsx`), `login`, `onboarding`, `plans/new`, `plans/templates`, `clients` ficam fora — documentado na seção "Fora de escopo" no fim deste arquivo, não retrabalhados aqui.
- Toda mudança vai direto pra `main` com commits pequenos (decisão do usuário nesta sessão) — sem branch separada.
- Runtime de teste: `pnpm --filter @bstrainer/web test` (vitest). Não existe React Testing Library no projeto — componentes visuais são verificados por `pnpm --filter @bstrainer/web typecheck`, `pnpm --filter @bstrainer/web build`, e QA manual no navegador (claro E escuro), não por teste automatizado de render. Só lógica pura (função de resolução de tema) ganha teste vitest.

---

## Arquivos novos

- `apps/web/lib/theme/use-theme.ts` — hook + função pura de resolução de tema
- `apps/web/lib/theme/use-theme.test.ts` — teste da função pura
- `apps/web/components/ThemeToggle.tsx` — controle segmentado claro/escuro/sistema
- `apps/web/components/ui/Button.tsx` — botão compartilhado (variant + size)
- `apps/web/components/EmptyState.tsx` — estado vazio compartilhado (ícone + título + texto + ação opcional)

## Arquivos modificados (visão geral — detalhado por task)

- `apps/web/app/globals.css`
- `apps/web/app/layout.tsx`
- `apps/web/app/(app)/layout.tsx`
- `apps/web/app/(app)/settings/page.tsx`
- `apps/web/app/(app)/measurements/page.tsx`
- `apps/web/app/(app)/dashboard/page.tsx`
- `apps/web/app/(app)/personal/page.tsx`
- `apps/web/app/(app)/train/page.tsx`
- `apps/web/app/(app)/train/session/page.tsx`
- `apps/web/components/train/ExerciseBlockCard.tsx`
- `apps/web/components/train/SetRow.tsx`
- `apps/web/components/train/SessionSummary.tsx`
- `apps/web/components/train/BlockCards.tsx`
- `apps/web/components/PlateCalculator.tsx`
- `docs/DESIGN.md`

---

### Task 1: Tokens de cor semânticos + base do modo noturno

**Files:**
- Modify: `apps/web/app/globals.css`

**Interfaces:**
- Produces: todas as variáveis `--color-*` continuam com o mesmo nome (`ink`, `surface`, `surface-2`, `line`, `text`, `mute`, `signal`, `signal-press`, `gold`, `ok`, `err`) — nenhuma classe Tailwind existente (`bg-ink`, `text-signal`, etc.) precisa mudar em lugar nenhum do app. Produz também `.skeleton-shimmer` (classe nova) e o atributo `data-theme` no `<html>`, que as tasks seguintes vão setar.

- [ ] **Step 1: Reescrever `globals.css` com tokens claros/escuros**

Substituir o conteúdo inteiro do arquivo por:

```css
@import "tailwindcss";

@theme {
  /* bstrainer — docs/DESIGN.md. Valores padrão (claro); modo escuro
     redefine as mesmas custom properties abaixo, fora do @theme, pra
     cascatear em runtime sem duplicar utilitário nenhum. */
  --color-ink: #f8f4ed;
  --color-surface: #fffdf9;
  --color-surface-2: #e5ede9;
  --color-line: #c2d0c8;
  --color-text: #174b48;
  --color-mute: #63807a;
  --color-signal: #287b78;
  --color-signal-press: #1c625f;
  --color-gold: #a8c84d;
  --color-ok: #3f8d6d;
  --color-err: #c45a4b;

  --font-display: var(--font-cormorant), serif;
  --font-body: var(--font-inter), sans-serif;

  --ease-out-quart: cubic-bezier(0.25, 1, 0.5, 1);
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* Modo escuro — segue o SO por padrão, [data-theme] força uma escolha
   explícita do usuário (ver lib/theme/use-theme.ts) e sempre vence a
   media query, nos dois sentidos. */
@media (prefers-color-scheme: dark) {
  :root {
    --color-ink: #10201d;
    --color-surface: #16302b;
    --color-surface-2: #1c3a33;
    --color-line: #2b4a42;
    --color-text: #eef6f2;
    --color-mute: #8fada5;
    --color-signal: #4fd0c4;
    --color-signal-press: #38b3a8;
    --color-gold: #d8ea9c;
    --color-ok: #5cbf95;
    --color-err: #e17b6a;
  }
}
:root[data-theme="dark"] {
  --color-ink: #10201d;
  --color-surface: #16302b;
  --color-surface-2: #1c3a33;
  --color-line: #2b4a42;
  --color-text: #eef6f2;
  --color-mute: #8fada5;
  --color-signal: #4fd0c4;
  --color-signal-press: #38b3a8;
  --color-gold: #d8ea9c;
  --color-ok: #5cbf95;
  --color-err: #e17b6a;
}
:root[data-theme="light"] {
  --color-ink: #f8f4ed;
  --color-surface: #fffdf9;
  --color-surface-2: #e5ede9;
  --color-line: #c2d0c8;
  --color-text: #174b48;
  --color-mute: #63807a;
  --color-signal: #287b78;
  --color-signal-press: #1c625f;
  --color-gold: #a8c84d;
  --color-ok: #3f8d6d;
  --color-err: #c45a4b;
}

body {
  background: var(--color-ink);
  color: var(--color-text);
  font-family: var(--font-body);
}

.tnum {
  font-feature-settings: "tnum";
  font-variant-numeric: tabular-nums;
}

.caps-label {
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

/* Motion — docs/DESIGN.md seção 4 */
@keyframes pr-pop {
  0% {
    transform: scale(0.6);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}
@keyframes set-check {
  0% {
    transform: scale(0.8);
  }
  100% {
    transform: scale(1);
  }
}
@keyframes timer-pulse {
  0%,
  100% {
    background-color: var(--color-surface-2);
  }
  50% {
    background-color: color-mix(in srgb, var(--color-signal) 30%, transparent);
  }
}
/* Exceção pontual à regra "zero gradiente" do DESIGN.md — decorativo não,
   funcional: comunica "carregando" no lugar do bg-surface-2 chapado. */
@keyframes skeleton-shimmer {
  0% {
    background-position: -150% 0;
  }
  100% {
    background-position: 150% 0;
  }
}
.animate-pr-pop {
  animation: pr-pop 400ms var(--ease-spring);
}
.animate-set-check {
  animation: set-check 250ms var(--ease-spring);
}
.animate-timer-pulse {
  animation: timer-pulse 300ms ease-in-out 2;
}
.skeleton-shimmer {
  background-image: linear-gradient(
    100deg,
    var(--color-surface-2) 40%,
    color-mix(in srgb, var(--color-signal) 14%, var(--color-surface-2)) 50%,
    var(--color-surface-2) 60%
  );
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.6s ease-in-out infinite;
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

- [ ] **Step 2: Verificar build**

Run: `pnpm --filter @bstrainer/web build`
Expected: build passa sem erro (mesmo conjunto de classes Tailwind, só as custom properties por trás mudaram).

- [ ] **Step 3: Commit**

```bash
git add apps/web/app/globals.css
git commit -m "style: semantic dark-mode tokens + skeleton shimmer keyframe"
```

---

### Task 2: Hook de tema + script anti-flicker

**Files:**
- Create: `apps/web/lib/theme/use-theme.ts`
- Create: `apps/web/lib/theme/use-theme.test.ts`
- Modify: `apps/web/app/layout.tsx`

**Interfaces:**
- Consumes: nada de tasks anteriores.
- Produces: `resolveTheme(stored: string | null, prefersDark: boolean): "light" | "dark"` (função pura, exportada, usada na Task 3 e no teste). `useTheme(): { theme: "light" | "dark" | "system"; setTheme: (t: "light" | "dark" | "system") => void }` (hook, usado na Task 3).

- [ ] **Step 1: Escrever o teste da função pura**

```typescript
// apps/web/lib/theme/use-theme.test.ts
import { describe, expect, it } from "vitest";
import { resolveTheme } from "./use-theme";

describe("resolveTheme", () => {
  it("usa o valor salvo quando é light", () => {
    expect(resolveTheme("light", true)).toBe("light");
  });

  it("usa o valor salvo quando é dark", () => {
    expect(resolveTheme("dark", false)).toBe("dark");
  });

  it("segue a preferência do sistema quando salvo é system", () => {
    expect(resolveTheme("system", true)).toBe("dark");
    expect(resolveTheme("system", false)).toBe("light");
  });

  it("segue a preferência do sistema quando não há nada salvo", () => {
    expect(resolveTheme(null, true)).toBe("dark");
    expect(resolveTheme(null, false)).toBe("light");
  });

  it("ignora valor salvo inválido e cai pro sistema", () => {
    expect(resolveTheme("neon", true)).toBe("dark");
  });
});
```

- [ ] **Step 2: Rodar o teste e confirmar que falha**

Run: `pnpm --filter @bstrainer/web exec vitest run lib/theme/use-theme.test.ts`
Expected: FAIL — `Cannot find module './use-theme'` (o arquivo ainda não existe).

- [ ] **Step 3: Implementar o hook**

```typescript
// apps/web/lib/theme/use-theme.ts
"use client";

import { useCallback, useEffect, useState } from "react";

export type ThemePreference = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

const STORAGE_KEY = "bstrainer-theme";

export function resolveTheme(
  stored: string | null,
  prefersDark: boolean,
): ResolvedTheme {
  if (stored === "light" || stored === "dark") return stored;
  return prefersDark ? "dark" : "light";
}

function readStoredPreference(): ThemePreference {
  if (typeof window === "undefined") return "system";
  const raw = window.localStorage.getItem(STORAGE_KEY);
  return raw === "light" || raw === "dark" ? raw : "system";
}

export function useTheme() {
  const [preference, setPreference] = useState<ThemePreference>("system");

  useEffect(() => {
    setPreference(readStoredPreference());
  }, []);

  useEffect(() => {
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const stored =
        preference === "system" ? null : preference;
      const resolved = resolveTheme(stored, mql.matches);
      document.documentElement.setAttribute("data-theme", resolved);
    };
    apply();
    mql.addEventListener("change", apply);
    return () => mql.removeEventListener("change", apply);
  }, [preference]);

  const setTheme = useCallback((next: ThemePreference) => {
    setPreference(next);
    if (next === "system") {
      window.localStorage.removeItem(STORAGE_KEY);
    } else {
      window.localStorage.setItem(STORAGE_KEY, next);
    }
  }, []);

  return { theme: preference, setTheme };
}
```

- [ ] **Step 4: Rodar o teste e confirmar que passa**

Run: `pnpm --filter @bstrainer/web exec vitest run lib/theme/use-theme.test.ts`
Expected: PASS — 5 testes verdes.

- [ ] **Step 5: Script anti-flicker no layout raiz**

O hook só roda depois da hidratação — sem isso, a página pisca clara antes de aplicar o tema escuro salvo. Adicionar um script bloqueante inline que lê o `localStorage` e seta `data-theme` antes do primeiro paint.

Editar `apps/web/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import { RegisterServiceWorker } from "@/components/RegisterServiceWorker";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-cormorant",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "BS Trainer",
  description:
    "Registre cada série. Veja cada progresso. Prescrição e execução de treino de força para personal trainers e atletas.",
  manifest: "/manifest.json",
  icons: {
    icon: [{ url: "/icon.png", type: "image/png" }],
    shortcut: ["/icon.png"],
    apple: [{ url: "/icon.png", type: "image/png" }],
  },
};

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8f4ed" },
    { media: "(prefers-color-scheme: dark)", color: "#10201d" },
  ],
};

const THEME_INIT_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem("bstrainer-theme");
    var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    var resolved = stored === "light" || stored === "dark" ? stored : (prefersDark ? "dark" : "light");
    document.documentElement.setAttribute("data-theme", resolved);
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${cormorant.variable} ${inter.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-screen antialiased">
        <RegisterServiceWorker />
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 6: Verificar typecheck e build**

Run: `pnpm --filter @bstrainer/web typecheck && pnpm --filter @bstrainer/web build`
Expected: ambos passam sem erro.

- [ ] **Step 7: Commit**

```bash
git add apps/web/lib/theme/use-theme.ts apps/web/lib/theme/use-theme.test.ts apps/web/app/layout.tsx
git commit -m "feat: add theme resolution hook and anti-flicker boot script"
```

---

### Task 3: `ThemeToggle` + integração em Ajustes

**Files:**
- Create: `apps/web/components/ThemeToggle.tsx`
- Modify: `apps/web/app/(app)/settings/page.tsx`

**Interfaces:**
- Consumes: `useTheme` de `@/lib/theme/use-theme` (Task 2).
- Produces: `<ThemeToggle />` (sem props), renderizável em qualquer tela.

- [ ] **Step 1: Ler o arquivo de Ajustes atual pra saber onde encaixar**

Run: `cat "apps/web/app/(app)/settings/page.tsx"`
(Confirmar a estrutura exata antes de editar — o arquivo tem uma seção "PERFIL DE ALUNO" e um botão "Sair da conta"; o toggle entra como uma seção nova entre elas.)

- [ ] **Step 2: Criar o componente**

```tsx
// apps/web/components/ThemeToggle.tsx
"use client";

import { useTheme, type ThemePreference } from "@/lib/theme/use-theme";

const OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: "light", label: "Claro" },
  { value: "dark", label: "Escuro" },
  { value: "system", label: "Sistema" },
];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div
      role="radiogroup"
      aria-label="Tema"
      className="inline-flex h-11 items-center rounded-lg border border-line bg-surface p-1"
    >
      {OPTIONS.map((opt) => {
        const active = theme === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setTheme(opt.value)}
            className={`h-full min-w-[4.5rem] rounded-md px-3 text-sm font-semibold transition-colors duration-150 ease-out-quart ${
              active ? "bg-signal text-ink" : "text-mute active:bg-surface-2"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 3: Adicionar ao Ajustes**

Na seção principal de `apps/web/app/(app)/settings/page.tsx`, importar `ThemeToggle` de `@/components/ThemeToggle` e renderizar dentro de um bloco novo, logo abaixo do título "Ajustes"/antes da seção "PERFIL DE ALUNO":

```tsx
<div className="rounded-lg border border-line bg-surface p-5">
  <p className="caps-label font-display font-semibold text-mute">Aparência</p>
  <div className="mt-3">
    <ThemeToggle />
  </div>
</div>
```

- [ ] **Step 4: Typecheck e build**

Run: `pnpm --filter @bstrainer/web typecheck && pnpm --filter @bstrainer/web build`
Expected: passam sem erro.

- [ ] **Step 5: QA manual no navegador**

1. Abrir `/settings`, alternar Claro/Escuro/Sistema.
2. Confirmar que a tela inteira (fundo, texto, bordas) muda de imediato, sem reload.
3. Recarregar a página com "Escuro" selecionado — confirmar que não pisca claro antes de aplicar o escuro (efeito do script da Task 2).

- [ ] **Step 6: Commit**

```bash
git add apps/web/components/ThemeToggle.tsx "apps/web/app/(app)/settings/page.tsx"
git commit -m "feat: add theme toggle to settings"
```

---

### Task 4: Componente `Button` compartilhado

**Files:**
- Create: `apps/web/components/ui/Button.tsx`

**Interfaces:**
- Produces: `<Button variant="primary"|"secondary"|"ghost" size="md"|"sm"|"icon" ...restProps>` — estende `ButtonHTMLAttributes<HTMLButtonElement>`, `type` default `"button"`.

- [ ] **Step 1: Criar o componente**

```tsx
// apps/web/components/ui/Button.tsx
"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonSize = "md" | "sm" | "icon";

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "bg-signal text-ink active:bg-signal-press disabled:opacity-40",
  secondary:
    "border border-line bg-surface text-text active:bg-surface-2 disabled:opacity-40",
  ghost:
    "text-mute active:bg-surface-2 active:text-text disabled:opacity-40",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  md: "h-12 rounded-lg px-4 text-[15px] font-semibold",
  sm: "h-11 rounded-lg px-3 text-sm font-semibold",
  icon: "h-9 w-9 rounded-lg",
};

export function Button({
  variant = "secondary",
  size = "md",
  className = "",
  children,
  type = "button",
  ...rest
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children?: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-1.5 transition duration-150 ease-out-quart active:scale-[0.98] ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm --filter @bstrainer/web typecheck`
Expected: passa (componente ainda não é usado em lugar nenhum, só precisa compilar).

- [ ] **Step 3: Commit**

```bash
git add apps/web/components/ui/Button.tsx
git commit -m "feat: add shared Button component"
```

---

### Task 5: Nav inferior — indicador deslizante + `Button` no CTA central

**Files:**
- Modify: `apps/web/app/(app)/layout.tsx`

**Interfaces:**
- Consumes: nada de tasks anteriores (não usa `Button` — o CTA central "Treinar" é um círculo elevado, forma própria, não se encaixa nas `SIZE_CLASSES` do Button; mantém className própria).

- [ ] **Step 1: Adicionar o indicador deslizante**

Substituir o bloco do `<nav>` inteiro (linhas 144–174 do arquivo atual) por uma versão que calcula o índice do item ativo entre os itens planos (LEFT + RIGHT filtrado) e desenha uma pílula atrás dele, deslizando via `transform: translateX()` com transição CSS pura:

```tsx
export default function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const [showClients, setShowClients] = useState(false);
  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  useEffect(() => {
    canManageClients().then(setShowClients);
  }, []);

  const rightItems = RIGHT.filter((item) =>
    showClients ? item.href !== "/personal" : item.href !== "/clients",
  );
  const flatItems = [...LEFT, ...rightItems];
  const activeFlatIndex = flatItems.findIndex((item) => isActive(item.href));

  return (
    <div className="flex min-h-screen flex-col bg-ink text-text">
      <main className="flex-1 pb-24">
        <AuthGuard>{children}</AuthGuard>
      </main>
      {/* Nav inferior — logger é o coração do app */}
      <nav className="fixed inset-x-0 bottom-0 z-30 h-16 border-t border-line bg-ink/95 backdrop-blur-sm">
        <div className="mx-auto flex h-full max-w-5xl items-stretch px-2">
          <div className="relative flex flex-1 items-stretch">
            {activeFlatIndex >= 0 && activeFlatIndex < LEFT.length && (
              <span
                aria-hidden
                className="pointer-events-none absolute inset-y-2 rounded-lg bg-surface-2 transition-transform duration-300 ease-out-quart"
                style={{
                  width: `${100 / LEFT.length}%`,
                  transform: `translateX(${activeFlatIndex * 100}%)`,
                }}
              />
            )}
            {LEFT.map((item) => (
              <NavLink key={item.href} item={item} active={isActive(item.href)} />
            ))}
          </div>
          {!showClients && (
            <Link
              href="/train"
              aria-label="Treinar"
              aria-current={isActive("/train") ? "page" : undefined}
              className="flex flex-1 flex-col items-center justify-center gap-0.5"
            >
              <span className="flex h-12 w-12 -translate-y-3 items-center justify-center rounded-full bg-signal text-ink transition duration-150 ease-out-quart active:scale-[0.98] active:bg-signal-press">
                <IconTrain />
              </span>
              <span
                className={`-mt-2 text-[10px] font-medium uppercase tracking-[0.08em] ${
                  isActive("/train") ? "text-text" : "text-mute"
                }`}
              >
                Treinar
              </span>
            </Link>
          )}
          <div className="relative flex flex-1 items-stretch">
            {activeFlatIndex >= LEFT.length && (
              <span
                aria-hidden
                className="pointer-events-none absolute inset-y-2 rounded-lg bg-surface-2 transition-transform duration-300 ease-out-quart"
                style={{
                  width: `${100 / rightItems.length}%`,
                  transform: `translateX(${(activeFlatIndex - LEFT.length) * 100}%)`,
                }}
              />
            )}
            {rightItems.map((item) => (
              <NavLink key={item.href} item={item} active={isActive(item.href)} />
            ))}
          </div>
        </div>
      </nav>
    </div>
  );
}
```

`NavLink` fica igual — o texto/ícone já tem `z-index` implícito por vir depois da pílula no DOM, então não precisa de `z-10` extra. Se a pílula cobrir o texto visualmente na QA, adicionar `className="relative z-10 ..."` no `<Link>` de `NavLink`.

- [ ] **Step 2: Typecheck e build**

Run: `pnpm --filter @bstrainer/web typecheck && pnpm --filter @bstrainer/web build`
Expected: passam sem erro.

- [ ] **Step 3: QA manual**

1. Navegar entre Progresso / Medições / Fichas / Personal / Ajustes e confirmar que a pílula desliza suavemente (não pisca/troca instantâneo).
2. Confirmar que o botão central "Treinar" continua reagindo a toque (`active:scale-[0.98]`).
3. Testar como treinador (`showClients = true`) — confirmar que a pílula ainda acompanha corretamente com "Alunos" no lugar de "Personal".

- [ ] **Step 4: Commit**

```bash
git add "apps/web/app/(app)/layout.tsx"
git commit -m "feat: sliding active-tab indicator on bottom nav"
```

---

### Task 6: Componente `EmptyState` compartilhado

**Files:**
- Create: `apps/web/components/EmptyState.tsx`

**Interfaces:**
- Produces: `<EmptyState icon={ReactNode} title={string} description={string} action={{label: string; href?: string; onClick?: () => void}}>` — `action` é opcional.

- [ ] **Step 1: Criar o componente**

```tsx
// apps/web/components/EmptyState.tsx
import Link from "next/link";
import type { ReactNode } from "react";

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: { label: string; href?: string; onClick?: () => void };
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-line bg-surface p-8 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-2 text-mute">
        {icon}
      </div>
      <div className="space-y-1">
        <p className="font-display text-base font-semibold text-text">{title}</p>
        {description && <p className="text-sm text-mute">{description}</p>}
      </div>
      {action &&
        (action.href ? (
          <Link
            href={action.href}
            className="mt-1 inline-flex h-11 items-center justify-center rounded-lg bg-signal px-5 text-sm font-semibold text-ink transition duration-150 ease-out-quart active:scale-[0.98] active:bg-signal-press"
          >
            {action.label}
          </Link>
        ) : (
          <button
            type="button"
            onClick={action.onClick}
            className="mt-1 inline-flex h-11 items-center justify-center rounded-lg bg-signal px-5 text-sm font-semibold text-ink transition duration-150 ease-out-quart active:scale-[0.98] active:bg-signal-press"
          >
            {action.label}
          </button>
        ))}
    </div>
  );
}
```

Ícone é responsabilidade de quem chama (svg inline, 24×24, `stroke="currentColor"`, seguindo o padrão já usado em `(app)/layout.tsx`) — `EmptyState` não embute nenhum set de ícones novo.

- [ ] **Step 2: Typecheck**

Run: `pnpm --filter @bstrainer/web typecheck`
Expected: passa.

- [ ] **Step 3: Commit**

```bash
git add apps/web/components/EmptyState.tsx
git commit -m "feat: add shared EmptyState component"
```

---

### Task 7: Aplicar `EmptyState` nas telas do atleta

**Files:**
- Modify: `apps/web/app/(app)/measurements/page.tsx:248-251`
- Modify: `apps/web/app/(app)/dashboard/page.tsx:250-265` (sessões), `:415-425` (metas)
- Modify: `apps/web/app/(app)/personal/page.tsx:72-75`
- Modify: `apps/web/app/(app)/train/session/page.tsx:105-121` ("Nenhum treino em andamento")

**Interfaces:**
- Consumes: `EmptyState` de `@/components/EmptyState` (Task 6).

- [ ] **Step 1: Medições**

Em `apps/web/app/(app)/measurements/page.tsx`, importar `EmptyState` e substituir:

```tsx
{entries.length === 0 ? (
  <p className="rounded-lg border border-line bg-surface p-6 text-center text-sm text-mute">
    Nenhuma medição registrada.
  </p>
) : (
```

por:

```tsx
{entries.length === 0 ? (
  <EmptyState
    icon={
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
        <path d="M3 20h18" strokeLinecap="round" />
        <path d="M5 16l4-6 4 4 4-8 4 6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    }
    title="Nenhuma medição ainda"
    description="Registre peso, fotos ou circunferências pra acompanhar sua evolução ao longo do tempo."
    action={{ label: "Nova medição", onClick: () => setShowForm(true) }}
  />
) : (
```

(Usar o nome real do state que abre o formulário "+ Nova" — conferir no arquivo antes de editar; se o state tiver outro nome, ajustar `onClick` de acordo.)

- [ ] **Step 2: Dashboard — sem treinos**

Em `apps/web/app/(app)/dashboard/page.tsx`, substituir o bloco:

```tsx
<div className="rounded-lg border border-line bg-surface p-6 text-center">
  <p className="text-sm text-mute">Nenhum treino registrado ainda.</p>
  {!clientId && (
    <Link
      href="/train"
      className="mt-4 inline-flex h-12 items-center justify-center rounded-lg bg-signal px-6 text-[15px] font-semibold text-ink transition active:scale-[0.98] active:bg-signal-press"
    >
      Registrar primeiro treino
    </Link>
  )}
</div>
```

por:

```tsx
<EmptyState
  icon={
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M4 19V10" strokeLinecap="round" />
      <path d="M10 19V5" strokeLinecap="round" />
      <path d="M16 19v-7" strokeLinecap="round" />
      <path d="M22 19H2" strokeLinecap="round" />
    </svg>
  }
  title="Nenhum treino registrado ainda"
  description={clientId ? undefined : "Seu progresso aparece aqui assim que você registrar o primeiro treino."}
  action={!clientId ? { label: "Registrar primeiro treino", href: "/train" } : undefined}
/>
```

- [ ] **Step 3: Dashboard — sem metas**

Substituir:

```tsx
<p className="text-sm text-mute">Nenhuma meta definida ainda.</p>
```

por:

```tsx
<EmptyState
  icon={
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  }
  title="Nenhuma meta definida ainda"
  description="Defina uma meta de carga ou frequência pra acompanhar seu avanço."
/>
```

(Conferir se esse trecho já está dentro de um container com padding/borda — se sim, remover o wrapper duplicado ao colar o `EmptyState`, que já traz o próprio.)

- [ ] **Step 4: Personal**

Em `apps/web/app/(app)/personal/page.tsx`, substituir:

```tsx
<p className="rounded-lg border border-line bg-surface p-6 text-center text-sm text-mute">
  Ainda não há personais disponíveis. Peça para seu personal ativar o perfil profissional em Ajustes.
</p>
```

por:

```tsx
<EmptyState
  icon={
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
    </svg>
  }
  title="Ainda não há personais disponíveis"
  description="Peça pro seu personal ativar o perfil profissional em Ajustes."
/>
```

- [ ] **Step 5: Sessão — nenhum treino em andamento**

Em `apps/web/app/(app)/train/session/page.tsx`, substituir o bloco em torno da linha 108-121 (`<h1>Sessão</h1>` + `<p>Nenhum treino em andamento.</p>` + botão "Ir para Treinar") por:

```tsx
<div className="mx-auto max-w-6xl p-4 lg:p-6">
  <EmptyState
    icon={
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
        <path d="M2 12h2" strokeLinecap="round" />
        <path d="M20 12h2" strokeLinecap="round" />
        <rect x="4" y="8" width="3" height="8" rx="0.5" />
        <rect x="17" y="8" width="3" height="8" rx="0.5" />
        <path d="M7 12h10" strokeLinecap="round" />
      </svg>
    }
    title="Nenhum treino em andamento"
    action={{ label: "Ir para Treinar", href: "/train" }}
  />
</div>
```

- [ ] **Step 6: Typecheck e build**

Run: `pnpm --filter @bstrainer/web typecheck && pnpm --filter @bstrainer/web build`
Expected: passam sem erro.

- [ ] **Step 7: QA manual**

Visitar Medições (vazio), Progresso (conta nova, sem treino), Personal (sem vínculo), `/train/session/` sem sessão ativa — confirmar que os 5 estados mostram ícone + título + texto (+ ação onde aplicável) e que os botões de ação funcionam.

- [ ] **Step 8: Commit**

```bash
git add "apps/web/app/(app)/measurements/page.tsx" "apps/web/app/(app)/dashboard/page.tsx" "apps/web/app/(app)/personal/page.tsx" "apps/web/app/(app)/train/session/page.tsx"
git commit -m "refactor: use shared EmptyState across athlete-facing empty screens"
```

---

### Task 8: Seletor de PSE inline (substitui bottom sheet)

**Files:**
- Modify: `apps/web/components/train/SetRow.tsx`
- Modify: `apps/web/components/train/ExerciseBlockCard.tsx`

**Interfaces:**
- Consumes: `RPE_OPTIONS` de `@/lib/workout/exercise-utils` (já existe).
- Produces: `SetRowComponent` perde a prop `onOpenPse` (não existe mais) — o valor de PSE passa a ser escrito direto via a prop `onDraftChange` que o componente já recebia, através do `PseInlinePicker` interno. `ExerciseBlockCard` não precisa mais do state `pseRowIndex` nem do bottom sheet, e para de passar `onOpenPse` pro `SetRowComponent`.

- [ ] **Step 1: Trocar o botão "PSE" por um popover inline em `SetRow.tsx`**

No estado `"active"` de `SetRowComponent`, substituir:

```tsx
<button
  type="button"
  onClick={() => onOpenPse?.(row.index)}
  className="h-10 rounded border border-line bg-surface text-xs font-semibold text-mute transition active:bg-surface-2"
>
  {draft.rpe || "PSE"}
</button>
```

por um `<details>`/`<summary>` nativo (sem JS de posicionamento, sem dependência nova, fecha sozinho ao perder foco/clicar fora é comportamento padrão do `<details>` quando combinado com um listener de blur — usar `useState` local simples em vez de `<details>` pra manter controle total):

```tsx
<PseInlinePicker
  value={draft.rpe}
  onChange={(v) => onDraftChange?.(row.index, { rpe: v })}
/>
```

Adicionar acima da função `SetRowComponent`, no mesmo arquivo:

```tsx
import { useState } from "react";
import { RPE_OPTIONS } from "@/lib/workout/exercise-utils";

function PseInlinePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="h-10 w-full rounded border border-line bg-surface text-xs font-semibold text-mute transition duration-150 ease-out-quart active:bg-surface-2"
      >
        {value || "PSE"}
      </button>
      {open && (
        <div
          className="absolute bottom-full left-1/2 z-10 mb-1.5 w-max -translate-x-1/2 rounded-lg border border-line bg-surface p-1.5 shadow-[0_4px_16px_rgba(0,0,0,0.15)]"
          onMouseLeave={() => setOpen(false)}
        >
          <div className="grid grid-cols-5 gap-1">
            {RPE_OPTIONS.map((o) => (
              <button
                key={o}
                type="button"
                onClick={() => {
                  onChange(o);
                  setOpen(false);
                }}
                className={`h-8 w-8 rounded text-xs font-semibold transition duration-150 ease-out-quart active:scale-[0.95] ${
                  value === o ? "bg-signal text-ink" : "text-mute active:bg-surface-2"
                }`}
              >
                {o}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
              className="col-span-5 mt-1 h-7 rounded text-[11px] text-mute active:bg-surface-2"
            >
              Limpar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

A prop `onOpenPse` do componente principal deixa de ser necessária — remover da assinatura de `SetRowComponent` e do único ponto onde era usada.

- [ ] **Step 2: Atualizar `ExerciseBlockCard.tsx`**

Remover `pseRowIndex` (state), `RPE_OPTIONS` do import (não é mais usado aqui — só em `SetRow.tsx` agora), a prop `onOpenPse={setPseRowIndex}` passada pro `SetRowComponent`, e o bloco inteiro do bottom sheet (linhas 256-293 do arquivo atual, o `{pseRowIndex != null && (...)}`).

- [ ] **Step 3: Typecheck**

Run: `pnpm --filter @bstrainer/web typecheck`
Expected: passa — confirma que nenhuma prop órfã ficou pra trás.

- [ ] **Step 4: QA manual**

1. Abrir uma sessão de treino, tocar em "PSE" numa série ativa.
2. Confirmar que o popover abre colado no botão (não cobre a tela toda como o bottom sheet antigo).
3. Escolher um valor, confirmar que fecha e mostra o valor escolhido no botão.
4. Testar "Limpar".

- [ ] **Step 5: Commit**

```bash
git add apps/web/components/train/SetRow.tsx apps/web/components/train/ExerciseBlockCard.tsx
git commit -m "refactor: inline PSE picker instead of bottom sheet"
```

---

### Task 9: Migrar botões de `ExerciseBlockCard`, `SetRow`, `SessionSummary`, `BlockCards` pro `Button`

**Files:**
- Modify: `apps/web/components/train/ExerciseBlockCard.tsx`
- Modify: `apps/web/components/train/SetRow.tsx`
- Modify: `apps/web/components/train/SessionSummary.tsx`
- Modify: `apps/web/components/train/BlockCards.tsx`

**Interfaces:**
- Consumes: `Button` de `@/components/ui/Button` (Task 4).

- [ ] **Step 1: `ExerciseBlockCard.tsx`**

Trocar o botão "+ Adicionar Série":

```tsx
<button
  type="button"
  onClick={onAddRow}
  className="h-10 w-full rounded-lg border border-dashed border-line text-sm text-mute transition active:bg-surface-2"
>
  + Adicionar Série
</button>
```

por:

```tsx
<Button
  variant="ghost"
  onClick={onAddRow}
  className="h-10 w-full rounded-lg border border-dashed border-line"
>
  + Adicionar Série
</Button>
```

Importar `Button` de `@/components/ui/Button` no topo do arquivo. Os botões de ícone (`⇄`, `✕` no header, "Fechar troca") mantêm sua marcação atual — são específicos o bastante (posicionamento absoluto dentro de header flex) que forçar `Button size="icon"` neles não reduz duplicação real; deixar como estão.

- [ ] **Step 2: `SessionSummary.tsx`**

Trocar os dois botões finais ("Compartilhar treino" e "Voltar para Treinar") pra usar `Button`:

```tsx
<Button
  variant="secondary"
  disabled={sharing}
  onClick={handleShare}
  className="w-full disabled:opacity-50"
>
  {sharing ? "Gerando…" : "Compartilhar treino"}
</Button>
<Button variant="primary" onClick={onBack} className="w-full">
  Voltar para Treinar
</Button>
```

Importar `Button` de `@/components/ui/Button`.

- [ ] **Step 3: Typecheck**

Run: `pnpm --filter @bstrainer/web typecheck`
Expected: passa.

- [ ] **Step 4: QA manual**

Confirmar visualmente que os botões migrados têm a mesma aparência de antes (cor, tamanho, borda) — a troca é de implementação, não de design.

- [ ] **Step 5: Commit**

```bash
git add apps/web/components/train/ExerciseBlockCard.tsx apps/web/components/train/SessionSummary.tsx
git commit -m "refactor: migrate exercise card and summary buttons to shared Button"
```

---

### Task 10: Migrar botões de `train/session/page.tsx` pro `Button`

**Files:**
- Modify: `apps/web/app/(app)/train/session/page.tsx`

**Interfaces:**
- Consumes: `Button` de `@/components/ui/Button`.

- [ ] **Step 1: Botão "Finalizar treino"**

```tsx
<Button variant="secondary" onClick={() => setAskingSrpe(true)} className="w-full">
  Finalizar treino
</Button>
```

- [ ] **Step 2: Botão "+ Adicionar exercício"**

```tsx
<Button
  variant="ghost"
  onClick={() => setShowPicker(true)}
  className="h-12 w-full rounded-lg border border-dashed border-line"
>
  + Adicionar exercício
</Button>
```

- [ ] **Step 3: Botões de sRPE (grid 0-10) e overlay da calculadora de anilhas**

Manter como estão — são um grid denso de 11 botões numéricos com estado de seleção próprio (`active:border-signal`), não se encaixam nas 3 variantes do `Button` sem forçar `className` a ponto de anular o componente. Documentar essa exceção no `DESIGN.md` (Task 13) em vez de forçar aqui.

- [ ] **Step 4: Typecheck e build**

Run: `pnpm --filter @bstrainer/web typecheck && pnpm --filter @bstrainer/web build`
Expected: passam sem erro.

- [ ] **Step 5: Commit**

```bash
git add "apps/web/app/(app)/train/session/page.tsx"
git commit -m "refactor: migrate session page primary buttons to shared Button"
```

---

### Task 11: Migrar botões de Medições, Personal, Ajustes, Dashboard pro `Button`

**Files:**
- Modify: `apps/web/app/(app)/measurements/page.tsx`
- Modify: `apps/web/app/(app)/personal/page.tsx`
- Modify: `apps/web/app/(app)/settings/page.tsx`
- Modify: `apps/web/app/(app)/dashboard/page.tsx`

**Interfaces:**
- Consumes: `Button` de `@/components/ui/Button`.

- [ ] **Step 1: Medições**

Botão "+ Nova" (header) e "Salvar"/"Cancelar" do formulário de nova medição → `Button` (`variant="primary"` no "+ Nova" e "Salvar", `variant="ghost"` no "Cancelar").

- [ ] **Step 2: Personal**

Botão "Pedir acompanhamento" → `Button variant="primary" size="sm"`. Link "Conversar" continua `<Link>` (navegação, não ação — `Button` não cobre `<Link>`; manter como está, só ajustar className pra reusar `SIZE_CLASSES.sm` copiado manualmente se a aparência precisar bater).

- [ ] **Step 3: Ajustes**

Botão "Sair da conta" → `Button variant="secondary" className="w-full text-err"` (mantém a cor de destruição já usada).

- [ ] **Step 4: Dashboard**

Botão "+ Meta" → `Button variant="ghost" size="sm"`.

- [ ] **Step 5: Typecheck e build**

Run: `pnpm --filter @bstrainer/web typecheck && pnpm --filter @bstrainer/web build`
Expected: passam sem erro.

- [ ] **Step 6: QA manual em claro e escuro**

Percorrer as 4 telas nos dois temas (usar o `ThemeToggle` da Task 3), conferir contraste dos botões migrados — em especial `variant="secondary"` (borda `line` fina) no modo escuro, que é o mais fácil de ficar ilegível com paleta errada.

- [ ] **Step 7: Commit**

```bash
git add "apps/web/app/(app)/measurements/page.tsx" "apps/web/app/(app)/personal/page.tsx" "apps/web/app/(app)/settings/page.tsx" "apps/web/app/(app)/dashboard/page.tsx"
git commit -m "refactor: migrate remaining athlete-screen buttons to shared Button"
```

---

### Task 12: Shimmer nos skeletons de carregamento

**Files:**
- Modify: `apps/web/app/(app)/dashboard/page.tsx` (skeleton, linha ~245)
- Modify: `apps/web/app/(app)/train/session/page.tsx` (skeleton, linha ~59-61)
- Modify: `apps/web/app/(app)/measurements/page.tsx` (skeleton de loading, se existir — conferir no arquivo)

**Interfaces:**
- Consumes: `.skeleton-shimmer` de `globals.css` (Task 1).

- [ ] **Step 1: Trocar `animate-pulse` por `skeleton-shimmer` nos 3 pontos**

Padrão de troca (repetir por arquivo, mantendo altura/largura/`rounded-lg` de cada um):

```tsx
// antes
<div className="h-52 animate-pulse rounded-lg bg-surface-2" />
// depois
<div className="skeleton-shimmer h-52 rounded-lg" />
```

- [ ] **Step 2: Typecheck e build**

Run: `pnpm --filter @bstrainer/web typecheck && pnpm --filter @bstrainer/web build`
Expected: passam sem erro.

- [ ] **Step 3: QA manual**

Forçar um carregamento lento (throttle de rede no devtools ou recarregar rápido) em `/dashboard`, `/train/session`, `/measurements` — confirmar que o brilho varre da esquerda pra direita e para completamente com `prefers-reduced-motion: reduce` ativado no SO/navegador.

- [ ] **Step 4: Commit**

```bash
git add "apps/web/app/(app)/dashboard/page.tsx" "apps/web/app/(app)/train/session/page.tsx" "apps/web/app/(app)/measurements/page.tsx"
git commit -m "style: shimmer loading skeletons instead of flat pulse"
```

---

### Task 13: `DESIGN.md` vira documento vivo

**Files:**
- Modify: `docs/DESIGN.md`

**Interfaces:**
- Nenhuma — só documentação.

- [ ] **Step 1: Atualizar a seção de paleta com os tokens escuros**

Adicionar depois da tabela de paleta claro existente (seção 2, depois da linha "Regras: signal é o único accent..."):

```markdown
### Paleta — modo escuro

Ativado por `[data-theme="dark"]` no `<html>` (seguindo o sistema por padrão, com escolha manual em Ajustes → Aparência). Mesmos tokens, valores diferentes — nenhuma classe Tailwind muda, só a custom property por trás.

| Token | Hex | Uso |
|---|---|---|
| ink | #10201d | fundo base |
| surface | #16302b | cards, nav, inputs |
| surface-2 | #1c3a33 | hover, célula ativa, barra de progresso |
| line | #2b4a42 | bordas 1px |
| text | #eef6f2 | texto primário |
| mute | #8fada5 | labels, metadados |
| signal | #4fd0c4 | accent primário (mais claro que no tema claro, pra manter contraste ~4.5:1 sobre `ink`) |
| signal-press | #38b3a8 | pressed |
| gold | #d8ea9c | PR/recordes |
| ok | #5cbf95 | série concluída |
| err | #e17b6a | falha/deletar |
```

- [ ] **Step 2: Revisar a regra "Não fazer" #1 (gradiente)**

Substituir:

```markdown
1. Nenhum gradiente, glow, blur decorativo fora dos dois blobs `blur-3xl` do hero (decoração de fundo, não de componente).
```

por:

```markdown
1. Nenhum gradiente, glow, blur decorativo fora dos dois blobs `blur-3xl` do hero (decoração de fundo, não de componente) — **exceção: `.skeleton-shimmer` em `globals.css`**, um gradiente linear de baixo contraste que varre estados de carregamento. É funcional (comunica progresso), não decorativo, e desliga com `prefers-reduced-motion`. Qualquer novo pedido de gradiente fora desses dois casos precisa passar por decisão explícita registrada aqui, não presunção de precedente.
```

- [ ] **Step 2b: Revisar a regra de 400ms na seção 4 (Motion)**

Substituir a linha final da seção 4:

```markdown
Regra: nada >400ms; `prefers-reduced-motion` zera todas as durações de animação/transição (`globals.css`).
```

por:

```markdown
Regra: nada >400ms **em motion de interação pontual** — confirmação, PR, pulso do timer, press/spring de botão, indicador de nav. **Não se aplica** a animações de estado ambiente/em loop contínuo, que comunicam "processo em andamento" em vez de reagir a um toque (ex.: `.skeleton-shimmer`, 1.6s). `prefers-reduced-motion` zera todas as durações de animação/transição, dos dois tipos, sem exceção (`globals.css`).
```

- [ ] **Step 3: Revisar a regra "Não fazer" #9 (dark mode)**

Substituir:

```markdown
9. Claro é o único tema por ora — não reintroduzir o dark "Ferro" sem decisão de produto explícita.
```

por:

```markdown
9. Modo escuro existe desde 04/08/2026 (decisão de produto explícita, ver seção de paleta acima) — segue o SO por padrão, com escolha manual em Ajustes. **Não é** o antigo tema "Ferro" (laranja sobre preto, descontinuado) — é a mesma identidade "Matilha em Movimento", só com luminância invertida.
```

- [ ] **Step 4: Documentar o status de "documento vivo"**

Adicionar uma nota no topo do arquivo, logo abaixo do título, antes da linha "Documento normativo...":

```markdown
> **Documento vivo.** As regras abaixo (seção "Não fazer") são o ponto de partida, não lei imutável — se uma regra travar uma melhoria real de fluidez/uso, ela pode ser revista aqui, com a mudança registrada explicitamente (não removida em silêncio). Ver `docs/superpowers/plans/2026-08-04-polimento-geral-e-modo-noturno.md` pra decisão original de abrir essa flexibilidade.
```

- [ ] **Step 5: Documentar os componentes novos**

Adicionar uma seção nova, "## 7. Componentes compartilhados" (renumerando "Não fazer" pra seção 8 se necessário, ou inserindo antes dela):

```markdown
## 7. Componentes compartilhados

Desde 04/08/2026, botão e estado vazio não se escrevem mais soltos por tela — usar:

- **`components/ui/Button.tsx`** — `variant` (`primary`/`secondary`/`ghost`) + `size` (`md`/`sm`/`icon`). Cobre a maioria dos casos; grids densos com estado de seleção próprio (sRPE 0-10, calculadora de anilhas) ficam de fora deliberadamente — forçar `Button` neles anularia o componente via `className`.
- **`components/EmptyState.tsx`** — ícone (svg 20×20, `currentColor`) + título + descrição opcional + ação opcional (`href` ou `onClick`). Usar em qualquer lista/coleção vazia em vez de um `<p>` solto.
- **`components/ThemeToggle.tsx`** + **`lib/theme/use-theme.ts`** — 3 estados (claro/escuro/sistema), persistido em `localStorage["bstrainer-theme"]`.
```

- [ ] **Step 6: Commit**

```bash
git add docs/DESIGN.md
git commit -m "docs: make DESIGN.md a living document, add dark mode and shared components"
```

---

## Fora de escopo (documentado, não implementado nesta fatia)

- Landing (`apps/web/app/page.tsx`) — regras próprias na seção 5 do `DESIGN.md`, não tocada.
- `login`, `onboarding`, `plans/new`, `plans/templates`, `clients` — ainda usam botões/estados vazios com className solta; migrar numa fatia de varredura separada depois que `Button`/`EmptyState` provarem valor nas telas já migradas.
- Motor de sugestão/ajuste adaptativo (seção 6.3 do plano de redesign total) — fatia própria.
- Tela "Hoje" (reorganização de `/train`) — próxima fatia depois desta.
- Workspace desktop do treinador — fase futura do plano maior (`docs/superpowers/plans/2026-07-30-redesign-total-bstrainer.md`).

## Verificação final (depois da Task 13)

- [ ] `pnpm --filter @bstrainer/web typecheck`
- [ ] `pnpm --filter @bstrainer/web test`
- [ ] `pnpm --filter @bstrainer/web build`
- [ ] QA manual completo nos dois temas: nav, sessão de treino (log de série, PSE inline, troca de exercício, finalizar), Medições (vazio e com dados), Personal (vazio), Dashboard (vazio e com dados), Ajustes (toggle de tema, incluindo reload sem flicker).
- [ ] Capturas em 375px (mobile) e 1024px (tablet/desktop) de pelo menos: nav, sessão de treino, um estado vazio — nos dois temas.

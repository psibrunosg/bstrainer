# BSTRAINER — Direção de Design: "A Matilha em Movimento"

Documento normativo — reflete o que está implementado (`apps/web/app/globals.css`, `apps/web/app/page.tsx`), não um plano à parte. Editado por último em 2026-07 para corrigir o drift do documento original ("Ferro Editorial", tema escuro laranja) frente ao app real, que foi rebrandeado pro lobo/matilha em tema claro.

## 1. Conceito

Um lobo em movimento — força tranquila, constância, cuidado consigo. Fundo claro quente (creme, não branco puro), tipografia serifada grande (Cormorant Garamond) para headlines e números, corpo em Inter. Uma cor de assinatura — verde-petróleo — usada com disciplina: só aparece onde há ação, CTA ou conquista. Superfícies chapadas, bordas 1px, espaço negativo generoso. Cada série registrada é um fato. Personalidade: companheiro de treino sereno, não hype de academia.

## 2. Tokens

### Paleta (`apps/web/app/globals.css`)
| Token | Hex | Uso |
|---|---|---|
| ink | #f8f4ed | fundo base (creme quente) |
| surface | #fffdf9 | cards, nav, inputs |
| surface-2 | #e5ede9 | hover, célula ativa, barra de progresso |
| line | #c2d0c8 | bordas 1px (única separação) |
| text | #174b48 | texto primário (verde-petróleo escuro) |
| mute | #63807a | labels, metadados |
| signal | #287b78 | accent primário — CTA, série ativa, timer, XP |
| signal-press | #1c625f | pressed |
| gold | #a8c84d | exclusivo de PR e recordes |
| ok | #3f8d6d | série concluída, vínculo ativo |
| err | #c45a4b | falha/deletar |

Regras: signal é o único accent saturado por tela. gold só existe se houve PR.

### Tipografia
- Display: Cormorant Garamond (`--font-display`, via `next/font`) — headlines, números de carga, timer, hero.
- Corpo/UI: Inter (`--font-body`), `.tnum` (`font-feature-settings: "tnum"`) em todo número tabular (kg, reps, XP, streak).
- Escala px em uso: 11 pill/badge · 12 caps-label (`.caps-label`, +0.08em, uppercase) · 14 corpo · 15–16 botão/input · 18–20 título de card · 28 título de tela (`text-[28px] font-extrabold uppercase tracking-tight`) · 36–96 hero landing (`font-black italic` na seção final).

### Forma
- Raios: `rounded` (4px) em células/inputs pequenos, `rounded-lg` (8px) em cards/botões — padrão dominante do app. `rounded-full` só em pills (badge PR, chips de razão/equipamento, botão CTA da landing, círculo do nav central). Nunca `rounded-2xl+`.
- Sombras: nenhuma no app (`(app)/*`). Elevação = borda `line` + fundo `surface` sobre `ink`. Exceção: overlay de sRPE no fim do treino, `shadow-[0_-8px_32px_rgba(0,0,0,0.5)]`.
- Espaçamento: containers `mx-auto max-w-lg space-y-6 p-4` (mobile-first, a maioria das telas do app usa esse contêiner exato); landing usa `max-w-6xl` com padding vertical 12–32 (`py-12`…`py-32`).

## 3. Componentes (conferidos no código, não aspiracionais)

- **Botão primário:** `h-12 rounded-lg bg-signal text-ink font-semibold text-[15px] transition active:scale-[0.98] active:bg-signal-press`. Full-width no app; `rounded-full px-8` na landing.
- **Botão secundário:** `h-12 rounded-lg border border-line bg-surface text-text active:bg-surface-2`.
- **Ghost:** `text-mute` → `text-text` no hover/active, sem fundo. Cancelar/pular/fechar picker.
- **Card:** `rounded-lg border border-line bg-surface p-4`. Título `caps-label font-display font-semibold text-mute` + valor grande `font-display text-xl font-bold`.
- **Input:** `h-11`/`h-12 rounded border border-line bg-ink px-4 text-base outline-none focus:border-signal` (sem ring/glow). Placeholder `text-mute`.
- **Nav inferior** (`(app)/layout.tsx`): item central "Treinar" é um círculo `bg-signal`; demais itens texto+ícone, ativo `text-signal`/`text-text`, inativo `text-mute`. "Alunos" só aparece pra quem é personal.
- **Célula de série** (logger): grid `h-12 grid-cols-[28px_1fr_1fr_40px]` — número caps mute, kg/reps `tnum font-display font-semibold` centralizado, botão remover `✕` `h-9 w-9 rounded-lg text-mute active:bg-surface-2`.
- **Badge/chip:** pílula `rounded-full border px-2.5 py-1 text-[11px]`. PR usa `border-gold/30 bg-gold/10 text-gold`; razão de recomendação e equipamento usam `border-line bg-surface text-mute`; badge de conquista ganha `border-signal/30 bg-signal/10 text-signal` quando `earned`, `opacity-50` quando não.
- **Barra de progresso:** `h-1.5`/`h-2 overflow-hidden rounded-full bg-surface-2` com fill `h-full rounded-full bg-signal transition-all`. Usada em XP/nível, metas, mesociclo (mock da landing).

## 4. Motion

`ease-out-quart: cubic-bezier(0.25,1,0.5,1)` · `spring: cubic-bezier(0.34,1.56,0.64,1)` (`globals.css`)

1. Confirmar série / PR: `.animate-pr-pop` — scale 0.6→1 + fade, spring 400ms.
2. Série check: `.animate-set-check` — scale 0.8→1, spring 250ms. Vibrate 30ms em PR (`navigator.vibrate`).
3. Timer de descanso zerando: `.animate-timer-pulse` — pulsa `surface-2`↔`signal/30%` 2× 300ms + vibrate `[200,100,200]`. Últimos 10s: dígitos `text-signal`.
4. Loading: skeleton chapado `bg-surface-2 animate-pulse` (Tailwind padrão), sem shimmer customizado.

Regra: nada >400ms; `prefers-reduced-motion` zera todas as durações de animação/transição (`globals.css`).

## 5. Landing (`/`)

Copy real, não aspiracional — ver `apps/web/app/page.tsx` pra qualquer ajuste.

1. **Hero** — `caps-label` "bstrainer · a matilha em movimento" + `TREINAR É / CUIDAR DE SI.` (Cormorant 96px/6xl-8xl) + imagem do lobo (`lobo-movimento.png`) à direita. CTA "Começar grátis" (pill signal) + ghost "Sou personal →".
2. **Prova** — 3 números: 78 exercícios curados em pt-BR · 10 periodizações da literatura · 3s pra registrar uma série.
3. **Logger** — "Registrar em 3 toques." + mock da célula de série com PR badge e timer.
4. **Personal** — "Sua planilha, aposentada." + mock de mesociclo com barra de progresso e lista de alunos.
5. **Progresso** — "O gráfico que sobe junto com você." + sparkline SVG de e1RM.
6. **Pricing** — 3 cards `border-line`, meio com `border-signal` + "Mais escolhido": Solo R$0 · Atleta R$19/mês · Personal R$49/mês. Lista com travessão, não check.
7. **CTA final** — `font-black italic` "HOJE TEM TREINO." + botão + footer 1 linha (crédito wger CC-BY-SA).

## 6. Não fazer

1. Nenhum gradiente, glow, blur decorativo fora dos dois blobs `blur-3xl` do hero (decoração de fundo, não de componente).
2. Nenhum emoji em UI/copy. Celebração = tipografia + gold. (Exceção pontual já em produção: `⇄`/`✕` como glifo de ícone funcional, não emoji decorativo.)
3. Nenhum laranja/roxo/violeta — a paleta é verde-petróleo sobre creme, não mais "Ferro" laranja-sobre-preto.
4. Sem `rounded-2xl+`, sem `shadow-xl` empilhada.
5. Sem feature-icon em círculo pastel; features usam mock de UI real ou número.
6. Copy proibida: "eleve seu treino", "desbloqueie potencial", "revolucione", "sem esforço", "tudo em um só lugar".
7. Um accent saturado por tela — `signal` é o único.
8. Números sempre `font-display`/`.tnum`.
9. Claro é o único tema por ora — não reintroduzir o dark "Ferro" sem decisão de produto explícita.

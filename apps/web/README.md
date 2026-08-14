# BS Trainer — Redesign "Dark Premium"

Proposta de reformulação completa de UI/UX do BS Trainer, construída como app standalone (React 19 + TypeScript + Vite + Tailwind 3.4), pronta para servir de referência visual e de interação para migração gradual do `apps/web` (Next.js).

## Rodando

```bash
cd apps/web-redesign
npm install
npm run dev
```

## Mídia (GIFs e logo)

Este app referencia os assets que **já existem no repositório**:

- GIFs dos exercícios: `apps/web/public/exercise-media/bstrainer/NNNN.gif` — no redesign, copie para `apps/web-redesign/public/exercises/NNNN.gif` (apenas os ~30 IDs usados em `src/data/exercises.ts`) ou ajuste o campo `gif` para apontar ao caminho do Next.
- Logo: `apps/web/public/lobo-movimento.png` → `apps/web-redesign/public/lobo-movimento.png`.

## Design system

- Tema escuro esverdeado (`--background: 150 14% 3%`), acentos `--volt` (lima do logo) e `--aqua` (verde-água).
- Tipografia: Archivo (display, 800) + IBM Plex Mono (números/cargas).
- Tokens utilitários: `.card-surface`, `.grain`, `.font-display`, `.font-mono-num`, `.text-gradient-volt`, `.animate-rise`.

## Telas

Início (Dashboard), Treino (check-in de prontidão + cargas pré-preenchidas + timer de descanso), Planos, Biblioteca de exercícios (GIFs), Progresso (e1RM, volume, XP, badges, metas), Medidas & avaliação de força, Mensagens, Personal, Alunos (workspace do treinador, gestão por exceção), Ajustes e Onboarding.

## Regras de prescrição de carga

1. **Histórico do aluno primeiro** (dupla progressão: bateu o topo da faixa → sobe carga; senão +1 rep).
2. Sem histórico → **avaliação física** (teste 10RM) como base.
3. Sem nenhum dos dois → campos vazios, "registre sua 1ª vez".

O check-in (energia/sono/dor/estresse/tempo) gera um score de prontidão que ajusta carga, RIR, número de séries e remove acessórios quando o tempo é curto.

## Ciência nos planos

Volume 10–20 séries/músculo/semana, frequência ≥2x, RIR 1–3, faixas de 5–30 reps, dupla progressão, deload a cada 4–8 semanas, descanso 2–3 min em compostos.
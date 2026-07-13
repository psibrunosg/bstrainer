# BSTRAINER — Direção de Design: "FERRO EDITORIAL"

Autoria: Fable (gestor de design). Documento normativo — executores implementam sem inventar.

## 1. Conceito

Revista de performance impressa em tela: fundo quase-preto quente, tipografia condensada gigante em caixa alta para números e headlines (energia Nike), corpo sereno e espaçado (restraint Apple), uma única cor de assinatura — laranja-sinal — usada com disciplina de cardápio McDonald's: só aparece onde há ação ou conquista. Nada flutua, nada brilha, nada tem gradiente: superfícies chapadas, bordas 1px, espaço negativo generoso (Zara). Cada série registrada é um fato impresso. Personalidade: treinador exigente e elegante, fala pouco, comemora alto quando você merece.

## 2. Tokens

### Paleta
| Token | Hex | Uso |
|---|---|---|
| ink | #0C0A09 | fundo base (preto quente, nunca zinc frio) |
| surface | #171412 | cards, nav, inputs |
| surface-2 | #221E1B | hover, célula ativa, chips |
| line | #2E2924 | bordas 1px (única separação) |
| text | #F5F2EE | texto primário (branco-osso) |
| text-mute | #8A817A | labels, metadados |
| signal | #FF4D00 | accent primário — CTA, série ativa, timer |
| signal-press | #D94100 | pressed |
| gold | #E8B84B | exclusivo de PR e recordes |
| ok | #3FB950 | série concluída (check, nunca fundos grandes) |
| err | #F0453A | falha/deletar |

Regras: signal ≤ ~5% de qualquer tela. gold só existe se houve PR.

### Tipografia (Google Fonts)
- Display: Archivo (wght 500–900) — headlines caps tracking-tight, números de carga, timer.
- Corpo/UI: Inter (400–600), `font-feature-settings: "tnum"` em números tabulares.
- Escala px: 12 caps (+0.08em) · 14 corpo · 16 input · 20 título card · 28 título tela · 40 timer/kg · 64–96 hero (Archivo 900 itálico).

### Forma
- Raios: 4px inputs/células, 8px cards/botões, 9999px só badges. Nunca rounded-2xl+.
- Sombras: nenhuma. Elevação = borda line + fundo mais claro. Exceção: bottom-sheet `shadow-[0_-8px_32px_rgba(0,0,0,0.5)]`.
- Espaçamento: base 4; card 16; gutter 20; seções landing 96–128 vertical.

## 3. Componentes

- **Botão primário:** h-12 rounded-lg bg-signal text-#0C0A09 font-semibold 15px. Pressed: signal-press + scale-0.98. Full-width mobile.
- **Botão secundário:** h-12 rounded-lg border-line bg-surface text. Hover surface-2.
- **Ghost:** text-mute → text no hover, sem fundo. Cancelar/pular.
- **Card:** rounded-lg border-line bg-surface p-4. Título Archivo 600 caps 12px mute + valor grande. Sem ícone decorativo.
- **Input:** h-12 rounded bg-surface border-line px-4 text-base; focus border-signal (sem ring/glow). Label caps 12px acima.
- **Nav inferior:** h-16 bg-ink/95 backdrop-blur-sm border-t-line, 4 itens, ícone 24px stroke 1.5 + label 10px caps. Ativo text; inativo mute. Item central "Treinar": círculo 48px bg-signal ícone escuro.
- **Timer descanso:** barra fixa acima da nav, h-14 bg-surface-2 border-t-line; tempo Archivo 700 40→28px tnum esquerda; -15s/+15s/Pular ghost direita. Últimos 10s: dígitos signal.
- **Célula de série:** h-14 grid [32px_1fr_1fr_56px] gap-2 border-b-line. Nº caps mute; kg/reps caixas bg-surface rounded center Archivo 600 20px; check 44×44 border-line. Concluída: fundo surface, check ok/15 text-ok. Ativa: borda esquerda 2px signal.
- **Badge PR:** pílula h-6 px-2.5 gold/12 text-gold border-gold/30 11px semibold. "PR · 92,5 kg". Sem emoji/troféu.

## 4. Motion

`ease-out-quart: cubic-bezier(0.25,1,0.5,1)` · `spring: cubic-bezier(0.34,1.56,0.64,1)`

1. Confirmar série: check scale 0.8→1 spring 250ms; linha desliza fade 200ms. Vibrate 10ms.
2. PR: badge gold scale 0.6→1 spring 400ms + flash de borda gold 600ms. Sem confete.
3. Timer zerando: últimos 3s dígitos translateY 8px fade 150ms; ao zerar barra pulsa signal 2× 300ms + vibrate 30ms.
4. Transição de tela: slide 24px + fade 280ms ease-out-quart. Bottom-sheet translateY 320ms.
5. Loading: skeleton chapado surface-2 shimmer 1.4s; count-up 400ms só em dashboard.

Regra: nada >400ms; prefers-reduced-motion desativa tudo exceto opacity.

## 5. Landing (/)

1. **Hero** — ink, imagem b&w alto contraste de barra carregada sangrando à direita. Archivo 900 itálico 96px: "O TREINO NÃO MENTE." Sub Inter 18 mute: "Registre cada série. Veja cada progresso. bstrainer é o diário de força que seu treinador — ou você — sempre quis." CTA signal "Começar grátis" + ghost "Sou personal".
2. **Prova** — surface, 3 números Archivo 700 40px: séries registradas · PRs este mês · nota.
3. **Logger** — 50/50 editorial, screenshot em moldura chapada. "Registrar em 3 toques." / "Peso, reps, feito. O timer já começou."
4. **Personal** — invertido. "Sua planilha, aposentada." / "Monte a periodização, entregue no celular do aluno, acompanhe em tempo real."
5. **Progresso** — gráfico e1RM linha signal sobre ink. "O gráfico que sobe junto com você."
6. **Pricing** — 3 cards borda line, meio com borda signal + "Mais escolhido": Solo R$0 · Atleta R$19/mês · Personal R$49/mês. Lista com traços, não checks.
7. **CTA final** — ink, Archivo 900 "HOJE TEM TREINO." Botão "Criar conta grátis". Footer 1 linha.

## 6. Não fazer

1. Nenhum gradiente, glow, blur decorativo. Glassmorphism proibido (exceto blur funcional da nav).
2. Nenhum emoji em UI/copy. Celebração = tipografia + gold.
3. Nenhum roxo/violeta/índigo; emerald não é accent (ok verde é só estado).
4. Sem rounded-2xl+, sem shadow-xl empilhada.
5. Sem feature-icon em círculo pastel; features usam screenshot ou número.
6. Copy proibida: "eleve seu treino", "desbloqueie potencial", "revolucione", "sem esforço", "tudo em um só lugar".
7. Hero assimétrico editorial; proibido badge-pílula "Novo" centralizada.
8. Um accent por tela.
9. Números sempre Archivo/tnum.
10. Dark é o único tema por ora.

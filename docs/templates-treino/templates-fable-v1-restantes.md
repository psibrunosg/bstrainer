# Templates Fable v1 — restantes a incorporar em library.json

Já incorporados em `packages/engine/src/templates/library.json`: linear-beginner-fullbody-3x, fullbody-hypertrophy-3x, minimalist-health-2x.

Pendentes (JSON bruto do Fable, validar contra planTemplateSpecSchema ao incorporar; corrigir goal `general_fitness`→`health` se aparecer):

```json
[
  {
    "id": "upper-lower-4x",
    "name": "Upper/Lower 4x Hipertrofia-Força",
    "goal": "hypertrophy",
    "level": "intermediate",
    "daysPerWeek": 4,
    "rationale": "Divisão upper/lower 4x mantém frequência 2x/músculo (meta-análise Schoenfeld 2016 sobre frequência) e permite dia pesado + dia de volume por metade do corpo, esquema semi-ondulado típico das recomendações de Helms para intermediários.",
    "progressionRule": "Dias pesados: +2.5kg quando todas as séries atingirem o topo da faixa com RIR>=2. Dias de volume: dupla progressão 8->12 (ou 12->15 em isoladores) antes de subir 2.5-5% de carga. Repetir o bloco de 5 semanas; a cada novo bloco, +1 série nos 2 primeiros exercícios de cada dia de volume até o MRV individual.",
    "mesocycles": [
      {
        "weeks": 5, "emphasis": "hypertrophy", "progressionModel": "double_progression", "includesDeload": true,
        "deloadNote": "Semana 5: 50% das séries, cargas da semana 3, RIR 4.",
        "workouts": [
          { "name": "Upper Pesado", "suggestedWeekday": 1, "exercises": [
            { "slot": "push_h", "suggestedVariant": "supino reto", "priorityEquipment": "barbell", "setScheme": { "setCount": 4, "repsMin": 5, "repsMax": 6, "loadMethod": "rir", "targetRir": 2, "restSeconds": 180, "lastSetAmrap": false } },
            { "slot": "pull_h", "suggestedVariant": "remada curvada", "priorityEquipment": "barbell", "setScheme": { "setCount": 4, "repsMin": 6, "repsMax": 8, "loadMethod": "rir", "targetRir": 2, "restSeconds": 150, "lastSetAmrap": false } },
            { "slot": "push_v", "suggestedVariant": "desenvolvimento militar", "priorityEquipment": "barbell", "setScheme": { "setCount": 3, "repsMin": 6, "repsMax": 8, "loadMethod": "rir", "targetRir": 2, "restSeconds": 150, "lastSetAmrap": false } },
            { "slot": "pull_v", "suggestedVariant": "barra fixa com carga", "priorityEquipment": "bodyweight", "setScheme": { "setCount": 3, "repsMin": 6, "repsMax": 8, "loadMethod": "rir", "targetRir": 2, "restSeconds": 150, "lastSetAmrap": false } },
            { "slot": "isolation", "suggestedVariant": "rosca bíceps", "priorityEquipment": "dumbbell", "setScheme": { "setCount": 2, "repsMin": 8, "repsMax": 12, "loadMethod": "rir", "targetRir": 1, "restSeconds": 60, "lastSetAmrap": false } }
          ] },
          { "name": "Lower Pesado", "suggestedWeekday": 2, "exercises": [
            { "slot": "squat", "suggestedVariant": "back squat", "priorityEquipment": "barbell", "setScheme": { "setCount": 4, "repsMin": 5, "repsMax": 6, "loadMethod": "rir", "targetRir": 2, "restSeconds": 210, "lastSetAmrap": false } },
            { "slot": "hinge", "suggestedVariant": "levantamento terra romeno", "priorityEquipment": "barbell", "setScheme": { "setCount": 3, "repsMin": 6, "repsMax": 8, "loadMethod": "rir", "targetRir": 2, "restSeconds": 180, "lastSetAmrap": false } },
            { "slot": "lunge", "suggestedVariant": "búlgaro", "priorityEquipment": "dumbbell", "setScheme": { "setCount": 3, "repsMin": 8, "repsMax": 10, "loadMethod": "rir", "targetRir": 2, "restSeconds": 120, "lastSetAmrap": false } },
            { "slot": "isolation", "suggestedVariant": "panturrilha", "priorityEquipment": "machine", "setScheme": { "setCount": 3, "repsMin": 8, "repsMax": 12, "loadMethod": "rir", "targetRir": 1, "restSeconds": 60, "lastSetAmrap": false } },
            { "slot": "core", "suggestedVariant": "ab wheel", "priorityEquipment": "bodyweight", "setScheme": { "setCount": 3, "repsMin": 8, "repsMax": 12, "loadMethod": "bodyweight", "targetRir": 2, "restSeconds": 60, "lastSetAmrap": false } }
          ] },
          { "name": "Upper Volume", "suggestedWeekday": 4, "exercises": [
            { "slot": "push_h", "suggestedVariant": "supino inclinado halteres", "priorityEquipment": "dumbbell", "setScheme": { "setCount": 3, "repsMin": 8, "repsMax": 12, "loadMethod": "rir", "targetRir": 2, "restSeconds": 120, "lastSetAmrap": false } },
            { "slot": "pull_h", "suggestedVariant": "remada cavalinho ou máquina", "priorityEquipment": "machine", "setScheme": { "setCount": 3, "repsMin": 8, "repsMax": 12, "loadMethod": "rir", "targetRir": 2, "restSeconds": 120, "lastSetAmrap": false } },
            { "slot": "pull_v", "suggestedVariant": "puxada alta pegada neutra", "priorityEquipment": "cable", "setScheme": { "setCount": 3, "repsMin": 10, "repsMax": 12, "loadMethod": "rir", "targetRir": 2, "restSeconds": 120, "lastSetAmrap": false } },
            { "slot": "isolation", "suggestedVariant": "elevação lateral", "priorityEquipment": "dumbbell", "setScheme": { "setCount": 4, "repsMin": 12, "repsMax": 15, "loadMethod": "rir", "targetRir": 1, "restSeconds": 60, "lastSetAmrap": false } },
            { "slot": "isolation", "suggestedVariant": "tríceps francês", "priorityEquipment": "cable", "setScheme": { "setCount": 3, "repsMin": 10, "repsMax": 15, "loadMethod": "rir", "targetRir": 1, "restSeconds": 60, "lastSetAmrap": false } },
            { "slot": "isolation", "suggestedVariant": "rosca inclinada", "priorityEquipment": "dumbbell", "setScheme": { "setCount": 3, "repsMin": 10, "repsMax": 15, "loadMethod": "rir", "targetRir": 1, "restSeconds": 60, "lastSetAmrap": false } }
          ] },
          { "name": "Lower Volume", "suggestedWeekday": 5, "exercises": [
            { "slot": "squat", "suggestedVariant": "hack squat ou leg press", "priorityEquipment": "machine", "setScheme": { "setCount": 3, "repsMin": 8, "repsMax": 12, "loadMethod": "rir", "targetRir": 2, "restSeconds": 150, "lastSetAmrap": false } },
            { "slot": "hinge", "suggestedVariant": "hip thrust", "priorityEquipment": "barbell", "setScheme": { "setCount": 3, "repsMin": 8, "repsMax": 12, "loadMethod": "rir", "targetRir": 2, "restSeconds": 120, "lastSetAmrap": false } },
            { "slot": "isolation", "suggestedVariant": "flexora", "priorityEquipment": "machine", "setScheme": { "setCount": 3, "repsMin": 10, "repsMax": 15, "loadMethod": "rir", "targetRir": 1, "restSeconds": 90, "lastSetAmrap": false } },
            { "slot": "isolation", "suggestedVariant": "extensora", "priorityEquipment": "machine", "setScheme": { "setCount": 3, "repsMin": 12, "repsMax": 15, "loadMethod": "rir", "targetRir": 1, "restSeconds": 90, "lastSetAmrap": false } },
            { "slot": "isolation", "suggestedVariant": "panturrilha sentado", "priorityEquipment": "machine", "setScheme": { "setCount": 4, "repsMin": 10, "repsMax": 15, "loadMethod": "rir", "targetRir": 1, "restSeconds": 60, "lastSetAmrap": false } }
          ] }
        ]
      }
    ]
  },
  { "id": "ppl-6x", "_nota": "PPL 6x alto volume avançado — 6 sessões (Push/Pull/Legs A+B), meso 6 semanas double_progression com deload sem6 e onda RIR 3->1 + séries nas sem 3 e 5. Ver handoff bstrainer_planejamento para JSON completo no transcript do Fable." },
  { "id": "ppl-3x-rotativo", "_nota": "PPL 3x rotativo intermediário — 3 sessões rotativas, meso 6 semanas double_progression, deload sem6. Progressão avaliada por exposição do mesmo treino, não por semana-calendário." },
  { "id": "dup-4x-forca-hipertrofia", "_nota": "DUP 4x — Upper/Lower força (percent_1rm com onda 77.5->85%) + Upper/Lower hipertrofia (RIR), meso 5 semanas undulating, deload sem5, recalcular e1RM ao fim do bloco." },
  { "id": "block-atr-intermediate", "_nota": "Bloco ATR — 3 mesociclos: acumulação 4sem (65-75% volume alto), transmutação 4sem (step loading 80->87.5%), realização 3sem (90%+ singles/doubles, taper, teste e1RM)." },
  { "id": "texas-5x5-simplified", "_nota": "Texas Method simplificado 3x — Volume (5x5@78%), Recuperação (2x5@62% + acessórios), Intensidade (1x5 PR @87% AMRAP). Meso 8 semanas step_loading, deload sem8 ou após 2 falhas." },
  { "id": "hypertrophy-5x-specialization", "_nota": "Especialização superiores 5x avançado — peito/costas/ombros ~20-25 séries/sem freq 3x, pernas manutenção ~6 séries/sem. Meso 6 semanas double_progression, deload sem6, rotacionar grupo especializado por bloco." },
  { "id": "fullbody-linear-hypertrophy-strength-3x", "_nota": "Full-body 3x com transição — meso1 intro 2 semanas (técnica, RIR 4), meso2 linear 10 semanas (3x5 RIR 2, +2.5kg/sessão). Ao 2º reset no mesmo exercício, sinalizar migração pro texas-5x5." }
]
```

Notas de design do Fable (resumo):
1. Slots, não exercícios: `slot` + `suggestedVariant` + `priorityEquipment`; resolvedor troca por exerciseId conforme equipamento.
2. `setScheme` com `setCount` comprimido; instanciador expande em `PrescribedSet[]`; `lastSetAmrap` marca só a última série; warmups gerados pelo engine (ramp automático).
3. Métodos de carga por população: iniciantes RIR; força intermediário/avançado percent_1rm; hipertrofia RIR em todos os níveis (Helms, Schoenfeld).
4. Volume hipertrofia 10-20 séries/músculo/semana conforme nível (Schoenfeld 2017); deload 4-6 semanas em intermediário/avançado; dispensado em linear iniciante (Rippetoe).
5. `weeklyIntensityWave` descreve ajuste semana a semana aplicado sobre o setScheme base.
6. `suggestedWeekday`: 1=segunda…7=domingo. `progressionRule` é regra executável de sessão a sessão.

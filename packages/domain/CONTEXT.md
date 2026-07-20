# Domain

Core training vocabulary: athletes, plans, prescribed/performed work, and the catalog entities that back them.

## Language

**Exercise**:
A catalogued resistance-training movement, classified by movement pattern (squat, hinge, push, pull, lunge, carry, core, isolation) and primary muscles trained.
_Avoid_: Activity, "movement" (when meaning a cardio activity)

**Activity**:
A catalogued cardio/conditioning modality (running, cycling, swimming, rowing) with no movement pattern or primary muscle — tracked by duration, distance, or pace instead of sets and load.
_Avoid_: Exercise, cardio exercise

**Block**:
One item in a `WorkoutTemplate`'s ordered list — a `PrescribedExercise`, a `PrescribedActivity`, or a `PrescribedCircuit`. A workout is a sequence of blocks, not a single fixed type; blocks may mix freely within one workout (e.g. a leg day ending in a bike finisher).
_Avoid_: Exercise (when meaning any block), sessionType

**PrescribedActivity**:
A continuous-effort prescription for an `Activity` — target duration, distance, and/or pace. Used for steady-state cardio (e.g. "Corrida 30min Z2").
_Avoid_: PrescribedCircuit, PrescribedSet

**PrescribedCircuit**:
A rounds-based interval prescription — round count, work seconds, rest seconds, target RPE. Used for HIIT/circuit work.
_Avoid_: PrescribedActivity, PrescribedSet

**Mobility exercise**:
An `Exercise` with `movementPattern: "mobility"` — stretches, ROM drills, band distractions. Stays inside `Exercise` (not `Activity`): it's catalogued and prescribed the same way as resistance work, just a different movement pattern.
_Avoid_: Activity, stretch (as a separate entity)

**PerformedActivity**:
Recorded execution of a `PrescribedActivity` — `durationSeconds`, `distanceKm` (nullable), `avgPace` (nullable), `rpe` (nullable). No heart-rate field in v1 (no wearable integration yet).
_Avoid_: PerformedSet, PerformedCircuit

**PerformedCircuit**:
Recorded execution of a `PrescribedCircuit` — `roundsCompleted`, `rpe`.
_Avoid_: PerformedSet, PerformedActivity

**Deload**:
Not a training goal — a `Mesocycle.emphasis` value denoting a planned, short, reduced-volume/intensity block within a plan. A template can embed a deload-emphasis mesocycle, or itself be a short standalone deload block.
_Avoid_: "deload plan" as a `TrainingGoal`

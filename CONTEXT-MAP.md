# Context Map

## Contexts

- [Domain](./packages/domain/CONTEXT.md) — core training vocabulary: athletes, plans, prescribed/performed work, and the catalog entities that back them

## Relationships

- **Engine → Domain**: the engine instantiates domain types (`TrainingPlan`, `WorkoutTemplate`) from `PlanTemplateSpec`s
- **Web → Domain**: the UI reads/writes domain entities through a Supabase-backed data layer

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      ai_generations: {
        Row: {
          approved_at: string | null
          cost_usd: number | null
          created_at: string
          id: string
          input: Json
          model: string | null
          org_id: string
          output: Json | null
          plan_id: string | null
          requested_by: string
          review_diff: Json | null
          reviewed_by: string | null
        }
        Insert: {
          approved_at?: string | null
          cost_usd?: number | null
          created_at?: string
          id?: string
          input: Json
          model?: string | null
          org_id: string
          output?: Json | null
          plan_id?: string | null
          requested_by: string
          review_diff?: Json | null
          reviewed_by?: string | null
        }
        Update: {
          approved_at?: string | null
          cost_usd?: number | null
          created_at?: string
          id?: string
          input?: Json
          model?: string | null
          org_id?: string
          output?: Json | null
          plan_id?: string | null
          requested_by?: string
          review_diff?: Json | null
          reviewed_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_generations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_generations_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "training_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_generations_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_generations_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_measures: {
        Row: {
          assessment_id: string
          id: string
          measure_key: string
          unit: string | null
          value_numeric: number | null
          value_text: string | null
        }
        Insert: {
          assessment_id: string
          id?: string
          measure_key: string
          unit?: string | null
          value_numeric?: number | null
          value_text?: string | null
        }
        Update: {
          assessment_id?: string
          id?: string
          measure_key?: string
          unit?: string | null
          value_numeric?: number | null
          value_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assessment_measures_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      assessments: {
        Row: {
          assessed_at: string
          assessor_id: string | null
          client_id: string
          created_at: string
          id: string
          kind: string
          notes: string | null
          org_id: string
          protocol: string | null
        }
        Insert: {
          assessed_at?: string
          assessor_id?: string | null
          client_id: string
          created_at?: string
          id?: string
          kind: string
          notes?: string | null
          org_id: string
          protocol?: string | null
        }
        Update: {
          assessed_at?: string
          assessor_id?: string | null
          client_id?: string
          created_at?: string
          id?: string
          kind?: string
          notes?: string | null
          org_id?: string
          protocol?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assessments_assessor_id_fkey"
            columns: ["assessor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessments_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      athlete_profiles: {
        Row: {
          birth_date: string | null
          created_at: string
          days_per_week: number
          equipment: string[]
          goal: string
          height_cm: number | null
          level: string
          profile_id: string
          sex: string | null
          training_location: string
          updated_at: string
          weight_kg: number | null
        }
        Insert: {
          birth_date?: string | null
          created_at?: string
          days_per_week?: number
          equipment?: string[]
          goal: string
          height_cm?: number | null
          level?: string
          profile_id: string
          sex?: string | null
          training_location?: string
          updated_at?: string
          weight_kg?: number | null
        }
        Update: {
          birth_date?: string | null
          created_at?: string
          days_per_week?: number
          equipment?: string[]
          goal?: string
          height_cm?: number | null
          level?: string
          profile_id?: string
          sex?: string | null
          training_location?: string
          updated_at?: string
          weight_kg?: number | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          detail: Json | null
          entity: string
          entity_id: string | null
          id: string
          org_id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          detail?: Json | null
          entity: string
          entity_id?: string | null
          id?: string
          org_id: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          detail?: Json | null
          entity?: string
          entity_id?: string | null
          id?: string
          org_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      client_links: {
        Row: {
          client_id: string | null
          created_at: string
          id: string
          invite_email: string | null
          org_id: string
          status: string
          trainer_id: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          id?: string
          invite_email?: string | null
          org_id: string
          status?: string
          trainer_id: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          id?: string
          invite_email?: string | null
          org_id?: string
          status?: string
          trainer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_links_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_links_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_links_trainer_id_fkey"
            columns: ["trainer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      entitlements: {
        Row: {
          feature_key: string
          limit_value: number | null
          org_id: string
        }
        Insert: {
          feature_key: string
          limit_value?: number | null
          org_id: string
        }
        Update: {
          feature_key?: string
          limit_value?: number | null
          org_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "entitlements_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_aliases: {
        Row: {
          alias: string
          exercise_id: string
          id: string
        }
        Insert: {
          alias: string
          exercise_id: string
          id?: string
        }
        Update: {
          alias?: string
          exercise_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercise_aliases_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_substitutions: {
        Row: {
          exercise_id: string
          reason: string | null
          substitute_id: string
        }
        Insert: {
          exercise_id: string
          reason?: string | null
          substitute_id: string
        }
        Update: {
          exercise_id?: string
          reason?: string | null
          substitute_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercise_substitutions_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_substitutions_substitute_id_fkey"
            columns: ["substitute_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      exercises: {
        Row: {
          created_at: string
          external_id: string | null
          id: string
          instructions: string | null
          load_type: string
          media_url: string | null
          movement_pattern: string
          name: string
          org_id: string | null
          primary_muscles: string[]
          secondary_muscles: string[]
          source: string
          unilateral: boolean
        }
        Insert: {
          created_at?: string
          external_id?: string | null
          id?: string
          instructions?: string | null
          load_type: string
          media_url?: string | null
          movement_pattern: string
          name: string
          org_id?: string | null
          primary_muscles: string[]
          secondary_muscles?: string[]
          source?: string
          unilateral?: boolean
        }
        Update: {
          created_at?: string
          external_id?: string | null
          id?: string
          instructions?: string | null
          load_type?: string
          media_url?: string | null
          movement_pattern?: string
          name?: string
          org_id?: string | null
          primary_muscles?: string[]
          secondary_muscles?: string[]
          source?: string
          unilateral?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "exercises_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      injury_restrictions: {
        Row: {
          active_from: string
          active_until: string | null
          affected_pattern: string | null
          client_id: string
          created_at: string
          description: string
          id: string
          org_id: string
          origin: string
          region: string | null
        }
        Insert: {
          active_from?: string
          active_until?: string | null
          affected_pattern?: string | null
          client_id: string
          created_at?: string
          description: string
          id?: string
          org_id: string
          origin?: string
          region?: string | null
        }
        Update: {
          active_from?: string
          active_until?: string | null
          affected_pattern?: string | null
          client_id?: string
          created_at?: string
          description?: string
          id?: string
          org_id?: string
          origin?: string
          region?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "injury_restrictions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "injury_restrictions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      memberships: {
        Row: {
          created_at: string
          org_id: string
          profile_id: string
          role: string
        }
        Insert: {
          created_at?: string
          org_id: string
          profile_id: string
          role: string
        }
        Update: {
          created_at?: string
          org_id?: string
          profile_id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "memberships_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memberships_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      mesocycles: {
        Row: {
          emphasis: string
          id: string
          includes_deload: boolean
          notes: string | null
          plan_id: string
          position: number
          progression_model: string
          weeks: number
        }
        Insert: {
          emphasis: string
          id?: string
          includes_deload?: boolean
          notes?: string | null
          plan_id: string
          position: number
          progression_model: string
          weeks: number
        }
        Update: {
          emphasis?: string
          id?: string
          includes_deload?: boolean
          notes?: string | null
          plan_id?: string
          position?: number
          progression_model?: string
          weeks?: number
        }
        Relationships: [
          {
            foreignKeyName: "mesocycles_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "training_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          owner_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organizations_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      performed_exercises: {
        Row: {
          exercise_id: string
          id: string
          position: number
          prescribed_exercise_id: string | null
          session_id: string
          was_substituted: boolean
        }
        Insert: {
          exercise_id: string
          id?: string
          position: number
          prescribed_exercise_id?: string | null
          session_id: string
          was_substituted?: boolean
        }
        Update: {
          exercise_id?: string
          id?: string
          position?: number
          prescribed_exercise_id?: string | null
          session_id?: string
          was_substituted?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "performed_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performed_exercises_prescribed_exercise_id_fkey"
            columns: ["prescribed_exercise_id"]
            isOneToOne: false
            referencedRelation: "prescribed_exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performed_exercises_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "v_session_summary"
            referencedColumns: ["session_id"]
          },
          {
            foreignKeyName: "performed_exercises_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "workout_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      performed_sets: {
        Row: {
          id: string
          is_failure: boolean
          is_warmup: boolean
          load_kg: number | null
          logged_at: string
          notes: string | null
          performed_exercise_id: string
          position: number
          reps: number
          rir: number | null
          rpe: number | null
          time_seconds: number | null
        }
        Insert: {
          id?: string
          is_failure?: boolean
          is_warmup?: boolean
          load_kg?: number | null
          logged_at?: string
          notes?: string | null
          performed_exercise_id: string
          position: number
          reps: number
          rir?: number | null
          rpe?: number | null
          time_seconds?: number | null
        }
        Update: {
          id?: string
          is_failure?: boolean
          is_warmup?: boolean
          load_kg?: number | null
          logged_at?: string
          notes?: string | null
          performed_exercise_id?: string
          position?: number
          reps?: number
          rir?: number | null
          rpe?: number | null
          time_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "performed_sets_performed_exercise_id_fkey"
            columns: ["performed_exercise_id"]
            isOneToOne: false
            referencedRelation: "performed_exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_templates: {
        Row: {
          created_at: string
          days_per_week: number | null
          description: string | null
          goal: string
          id: string
          level: string | null
          min_tier: string
          name: string
          org_id: string | null
          structure: Json
          tags: string[]
        }
        Insert: {
          created_at?: string
          days_per_week?: number | null
          description?: string | null
          goal: string
          id?: string
          level?: string | null
          min_tier?: string
          name: string
          org_id?: string | null
          structure: Json
          tags?: string[]
        }
        Update: {
          created_at?: string
          days_per_week?: number | null
          description?: string | null
          goal?: string
          id?: string
          level?: string | null
          min_tier?: string
          name?: string
          org_id?: string | null
          structure?: Json
          tags?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "plan_templates_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      prescribed_exercises: {
        Row: {
          exercise_id: string
          id: string
          notes: string | null
          position: number
          superset_group: number | null
          technique: string
          workout_template_id: string
        }
        Insert: {
          exercise_id: string
          id?: string
          notes?: string | null
          position: number
          superset_group?: number | null
          technique?: string
          workout_template_id: string
        }
        Update: {
          exercise_id?: string
          id?: string
          notes?: string | null
          position?: number
          superset_group?: number | null
          technique?: string
          workout_template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prescribed_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescribed_exercises_workout_template_id_fkey"
            columns: ["workout_template_id"]
            isOneToOne: false
            referencedRelation: "workout_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      prescribed_sets: {
        Row: {
          id: string
          is_amrap: boolean
          is_warmup: boolean
          load_method: string
          load_value: number | null
          position: number
          prescribed_exercise_id: string
          reps_max: number
          reps_min: number
          rest_seconds: number
          target_rir: number | null
          target_rpe: number | null
        }
        Insert: {
          id?: string
          is_amrap?: boolean
          is_warmup?: boolean
          load_method: string
          load_value?: number | null
          position: number
          prescribed_exercise_id: string
          reps_max: number
          reps_min: number
          rest_seconds?: number
          target_rir?: number | null
          target_rpe?: number | null
        }
        Update: {
          id?: string
          is_amrap?: boolean
          is_warmup?: boolean
          load_method?: string
          load_value?: number | null
          position?: number
          prescribed_exercise_id?: string
          reps_max?: number
          reps_min?: number
          rest_seconds?: number
          target_rir?: number | null
          target_rpe?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "prescribed_sets_prescribed_exercise_id_fkey"
            columns: ["prescribed_exercise_id"]
            isOneToOne: false
            referencedRelation: "prescribed_exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          id: string
          locale: string
          name: string
          updated_at: string
          weight_unit: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          id: string
          locale?: string
          name: string
          updated_at?: string
          weight_unit?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          locale?: string
          name?: string
          updated_at?: string
          weight_unit?: string
        }
        Relationships: []
      }
      restriction_exercises: {
        Row: {
          exercise_id: string
          restriction_id: string
        }
        Insert: {
          exercise_id: string
          restriction_id: string
        }
        Update: {
          exercise_id?: string
          restriction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "restriction_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restriction_exercises_restriction_id_fkey"
            columns: ["restriction_id"]
            isOneToOne: false
            referencedRelation: "injury_restrictions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          id: string
          org_id: string
          provider: string | null
          provider_customer_id: string | null
          provider_subscription_id: string | null
          status: string
          tier: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          id?: string
          org_id: string
          provider?: string | null
          provider_customer_id?: string | null
          provider_subscription_id?: string | null
          status?: string
          tier?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          id?: string
          org_id?: string
          provider?: string | null
          provider_customer_id?: string | null
          provider_subscription_id?: string | null
          status?: string
          tier?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      trainer_profiles: {
        Row: {
          accepting_clients: boolean
          bio: string
          created_at: string
          name: string
          org_id: string
          profile_id: string
          updated_at: string
        }
        Insert: {
          accepting_clients?: boolean
          bio?: string
          created_at?: string
          name: string
          org_id: string
          profile_id: string
          updated_at?: string
        }
        Update: {
          accepting_clients?: boolean
          bio?: string
          created_at?: string
          name?: string
          org_id?: string
          profile_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trainer_profiles_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trainer_profiles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      training_plans: {
        Row: {
          client_id: string
          created_at: string
          created_by: string
          end_date: string | null
          engine: string
          goal: string
          id: string
          org_id: string
          source_template_id: string | null
          start_date: string
          status: string
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          created_by: string
          end_date?: string | null
          engine?: string
          goal: string
          id?: string
          org_id: string
          source_template_id?: string | null
          start_date: string
          status?: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          created_by?: string
          end_date?: string | null
          engine?: string
          goal?: string
          id?: string
          org_id?: string
          source_template_id?: string | null
          start_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_plans_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_plans_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_plans_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_sessions: {
        Row: {
          client_id: string
          created_at: string
          finished_at: string | null
          id: string
          notes: string | null
          org_id: string
          readiness_energy: number | null
          readiness_sleep: number | null
          readiness_soreness: number | null
          session_rpe: number | null
          started_at: string
          status: string
          workout_template_id: string | null
        }
        Insert: {
          client_id: string
          created_at?: string
          finished_at?: string | null
          id?: string
          notes?: string | null
          org_id: string
          readiness_energy?: number | null
          readiness_sleep?: number | null
          readiness_soreness?: number | null
          session_rpe?: number | null
          started_at?: string
          status?: string
          workout_template_id?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string
          finished_at?: string | null
          id?: string
          notes?: string | null
          org_id?: string
          readiness_energy?: number | null
          readiness_sleep?: number | null
          readiness_soreness?: number | null
          session_rpe?: number | null
          started_at?: string
          status?: string
          workout_template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_sessions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_sessions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_sessions_workout_template_id_fkey"
            columns: ["workout_template_id"]
            isOneToOne: false
            referencedRelation: "workout_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_templates: {
        Row: {
          id: string
          mesocycle_id: string
          name: string
          position: number
          suggested_weekday: number | null
        }
        Insert: {
          id?: string
          mesocycle_id: string
          name: string
          position: number
          suggested_weekday?: number | null
        }
        Update: {
          id?: string
          mesocycle_id?: string
          name?: string
          position?: number
          suggested_weekday?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_templates_mesocycle_id_fkey"
            columns: ["mesocycle_id"]
            isOneToOne: false
            referencedRelation: "mesocycles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_daily_best_e1rm: {
        Row: {
          best_e1rm_kg: number | null
          client_id: string | null
          exercise_id: string | null
          org_id: string | null
          session_date: string | null
        }
        Relationships: [
          {
            foreignKeyName: "performed_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_sessions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_sessions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      v_session_summary: {
        Row: {
          client_id: string | null
          duration_min: number | null
          org_id: string | null
          session_date: string | null
          session_id: string | null
          session_load: number | null
          session_rpe: number | null
          status: string | null
          tonnage_kg: number | null
          work_sets: number | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_sessions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_sessions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      v_set_e1rm: {
        Row: {
          client_id: string | null
          e1rm_kg: number | null
          exercise_id: string | null
          load_kg: number | null
          org_id: string | null
          performed_set_id: string | null
          reps: number | null
          rir: number | null
          rpe: number | null
          session_date: string | null
        }
        Relationships: [
          {
            foreignKeyName: "performed_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_sessions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_sessions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      v_weekly_muscle_volume: {
        Row: {
          client_id: string | null
          muscle: string | null
          org_id: string | null
          week_start: string | null
          weekly_sets: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      is_org_member: { Args: { check_org: string }; Returns: boolean }
      is_org_staff: { Args: { check_org: string }; Returns: boolean }
      request_trainer: { Args: { p_trainer_id: string }; Returns: undefined }
      respond_to_trainer_request: {
        Args: { p_accept: boolean; p_link_id: string }
        Returns: undefined
      }
      trains_client: { Args: { check_client: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      ai_generations: {
        Row: {
          approved_at: string | null
          cost_usd: number | null
          created_at: string
          id: string
          input: Json
          model: string | null
          org_id: string
          output: Json | null
          plan_id: string | null
          requested_by: string
          review_diff: Json | null
          reviewed_by: string | null
        }
        Insert: {
          approved_at?: string | null
          cost_usd?: number | null
          created_at?: string
          id?: string
          input: Json
          model?: string | null
          org_id: string
          output?: Json | null
          plan_id?: string | null
          requested_by: string
          review_diff?: Json | null
          reviewed_by?: string | null
        }
        Update: {
          approved_at?: string | null
          cost_usd?: number | null
          created_at?: string
          id?: string
          input?: Json
          model?: string | null
          org_id?: string
          output?: Json | null
          plan_id?: string | null
          requested_by?: string
          review_diff?: Json | null
          reviewed_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_generations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_generations_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "training_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_generations_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_generations_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_measures: {
        Row: {
          assessment_id: string
          id: string
          measure_key: string
          unit: string | null
          value_numeric: number | null
          value_text: string | null
        }
        Insert: {
          assessment_id: string
          id?: string
          measure_key: string
          unit?: string | null
          value_numeric?: number | null
          value_text?: string | null
        }
        Update: {
          assessment_id?: string
          id?: string
          measure_key?: string
          unit?: string | null
          value_numeric?: number | null
          value_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assessment_measures_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      assessments: {
        Row: {
          assessed_at: string
          assessor_id: string | null
          client_id: string
          created_at: string
          id: string
          kind: string
          notes: string | null
          org_id: string
          protocol: string | null
        }
        Insert: {
          assessed_at?: string
          assessor_id?: string | null
          client_id: string
          created_at?: string
          id?: string
          kind: string
          notes?: string | null
          org_id: string
          protocol?: string | null
        }
        Update: {
          assessed_at?: string
          assessor_id?: string | null
          client_id?: string
          created_at?: string
          id?: string
          kind?: string
          notes?: string | null
          org_id?: string
          protocol?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assessments_assessor_id_fkey"
            columns: ["assessor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessments_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          detail: Json | null
          entity: string
          entity_id: string | null
          id: string
          org_id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          detail?: Json | null
          entity: string
          entity_id?: string | null
          id?: string
          org_id: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          detail?: Json | null
          entity?: string
          entity_id?: string | null
          id?: string
          org_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      client_links: {
        Row: {
          client_id: string | null
          created_at: string
          id: string
          invite_email: string | null
          org_id: string
          status: string
          trainer_id: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          id?: string
          invite_email?: string | null
          org_id: string
          status?: string
          trainer_id: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          id?: string
          invite_email?: string | null
          org_id?: string
          status?: string
          trainer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_links_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_links_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_links_trainer_id_fkey"
            columns: ["trainer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      entitlements: {
        Row: {
          feature_key: string
          limit_value: number | null
          org_id: string
        }
        Insert: {
          feature_key: string
          limit_value?: number | null
          org_id: string
        }
        Update: {
          feature_key?: string
          limit_value?: number | null
          org_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "entitlements_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_aliases: {
        Row: {
          alias: string
          exercise_id: string
          id: string
        }
        Insert: {
          alias: string
          exercise_id: string
          id?: string
        }
        Update: {
          alias?: string
          exercise_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercise_aliases_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_substitutions: {
        Row: {
          exercise_id: string
          reason: string | null
          substitute_id: string
        }
        Insert: {
          exercise_id: string
          reason?: string | null
          substitute_id: string
        }
        Update: {
          exercise_id?: string
          reason?: string | null
          substitute_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercise_substitutions_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_substitutions_substitute_id_fkey"
            columns: ["substitute_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      exercises: {
        Row: {
          created_at: string
          external_id: string | null
          id: string
          instructions: string | null
          load_type: string
          media_url: string | null
          movement_pattern: string
          name: string
          org_id: string | null
          primary_muscles: string[]
          secondary_muscles: string[]
          source: string
          unilateral: boolean
        }
        Insert: {
          created_at?: string
          external_id?: string | null
          id?: string
          instructions?: string | null
          load_type: string
          media_url?: string | null
          movement_pattern: string
          name: string
          org_id?: string | null
          primary_muscles: string[]
          secondary_muscles?: string[]
          source?: string
          unilateral?: boolean
        }
        Update: {
          created_at?: string
          external_id?: string | null
          id?: string
          instructions?: string | null
          load_type?: string
          media_url?: string | null
          movement_pattern?: string
          name?: string
          org_id?: string | null
          primary_muscles?: string[]
          secondary_muscles?: string[]
          source?: string
          unilateral?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "exercises_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      injury_restrictions: {
        Row: {
          active_from: string
          active_until: string | null
          affected_pattern: string | null
          client_id: string
          created_at: string
          description: string
          id: string
          org_id: string
          origin: string
          region: string | null
        }
        Insert: {
          active_from?: string
          active_until?: string | null
          affected_pattern?: string | null
          client_id: string
          created_at?: string
          description: string
          id?: string
          org_id: string
          origin?: string
          region?: string | null
        }
        Update: {
          active_from?: string
          active_until?: string | null
          affected_pattern?: string | null
          client_id?: string
          created_at?: string
          description?: string
          id?: string
          org_id?: string
          origin?: string
          region?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "injury_restrictions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "injury_restrictions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      memberships: {
        Row: {
          created_at: string
          org_id: string
          profile_id: string
          role: string
        }
        Insert: {
          created_at?: string
          org_id: string
          profile_id: string
          role: string
        }
        Update: {
          created_at?: string
          org_id?: string
          profile_id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "memberships_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memberships_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      mesocycles: {
        Row: {
          emphasis: string
          id: string
          includes_deload: boolean
          notes: string | null
          plan_id: string
          position: number
          progression_model: string
          weeks: number
        }
        Insert: {
          emphasis: string
          id?: string
          includes_deload?: boolean
          notes?: string | null
          plan_id: string
          position: number
          progression_model: string
          weeks: number
        }
        Update: {
          emphasis?: string
          id?: string
          includes_deload?: boolean
          notes?: string | null
          plan_id?: string
          position?: number
          progression_model?: string
          weeks?: number
        }
        Relationships: [
          {
            foreignKeyName: "mesocycles_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "training_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          owner_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organizations_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      performed_exercises: {
        Row: {
          exercise_id: string
          id: string
          position: number
          prescribed_exercise_id: string | null
          session_id: string
          was_substituted: boolean
        }
        Insert: {
          exercise_id: string
          id?: string
          position: number
          prescribed_exercise_id?: string | null
          session_id: string
          was_substituted?: boolean
        }
        Update: {
          exercise_id?: string
          id?: string
          position?: number
          prescribed_exercise_id?: string | null
          session_id?: string
          was_substituted?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "performed_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performed_exercises_prescribed_exercise_id_fkey"
            columns: ["prescribed_exercise_id"]
            isOneToOne: false
            referencedRelation: "prescribed_exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performed_exercises_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "v_session_summary"
            referencedColumns: ["session_id"]
          },
          {
            foreignKeyName: "performed_exercises_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "workout_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      performed_sets: {
        Row: {
          id: string
          is_failure: boolean
          is_warmup: boolean
          load_kg: number | null
          logged_at: string
          notes: string | null
          performed_exercise_id: string
          position: number
          reps: number
          rir: number | null
          rpe: number | null
          time_seconds: number | null
        }
        Insert: {
          id?: string
          is_failure?: boolean
          is_warmup?: boolean
          load_kg?: number | null
          logged_at?: string
          notes?: string | null
          performed_exercise_id: string
          position: number
          reps: number
          rir?: number | null
          rpe?: number | null
          time_seconds?: number | null
        }
        Update: {
          id?: string
          is_failure?: boolean
          is_warmup?: boolean
          load_kg?: number | null
          logged_at?: string
          notes?: string | null
          performed_exercise_id?: string
          position?: number
          reps?: number
          rir?: number | null
          rpe?: number | null
          time_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "performed_sets_performed_exercise_id_fkey"
            columns: ["performed_exercise_id"]
            isOneToOne: false
            referencedRelation: "performed_exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_templates: {
        Row: {
          created_at: string
          days_per_week: number | null
          description: string | null
          goal: string
          id: string
          level: string | null
          min_tier: string
          name: string
          org_id: string | null
          structure: Json
          tags: string[]
        }
        Insert: {
          created_at?: string
          days_per_week?: number | null
          description?: string | null
          goal: string
          id?: string
          level?: string | null
          min_tier?: string
          name: string
          org_id?: string | null
          structure: Json
          tags?: string[]
        }
        Update: {
          created_at?: string
          days_per_week?: number | null
          description?: string | null
          goal?: string
          id?: string
          level?: string | null
          min_tier?: string
          name?: string
          org_id?: string | null
          structure?: Json
          tags?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "plan_templates_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      prescribed_exercises: {
        Row: {
          exercise_id: string
          id: string
          notes: string | null
          position: number
          superset_group: number | null
          technique: string
          workout_template_id: string
        }
        Insert: {
          exercise_id: string
          id?: string
          notes?: string | null
          position: number
          superset_group?: number | null
          technique?: string
          workout_template_id: string
        }
        Update: {
          exercise_id?: string
          id?: string
          notes?: string | null
          position?: number
          superset_group?: number | null
          technique?: string
          workout_template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prescribed_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescribed_exercises_workout_template_id_fkey"
            columns: ["workout_template_id"]
            isOneToOne: false
            referencedRelation: "workout_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      prescribed_sets: {
        Row: {
          id: string
          is_amrap: boolean
          is_warmup: boolean
          load_method: string
          load_value: number | null
          position: number
          prescribed_exercise_id: string
          reps_max: number
          reps_min: number
          rest_seconds: number
          target_rir: number | null
          target_rpe: number | null
        }
        Insert: {
          id?: string
          is_amrap?: boolean
          is_warmup?: boolean
          load_method: string
          load_value?: number | null
          position: number
          prescribed_exercise_id: string
          reps_max: number
          reps_min: number
          rest_seconds?: number
          target_rir?: number | null
          target_rpe?: number | null
        }
        Update: {
          id?: string
          is_amrap?: boolean
          is_warmup?: boolean
          load_method?: string
          load_value?: number | null
          position?: number
          prescribed_exercise_id?: string
          reps_max?: number
          reps_min?: number
          rest_seconds?: number
          target_rir?: number | null
          target_rpe?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "prescribed_sets_prescribed_exercise_id_fkey"
            columns: ["prescribed_exercise_id"]
            isOneToOne: false
            referencedRelation: "prescribed_exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          id: string
          locale: string
          name: string
          updated_at: string
          weight_unit: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          id: string
          locale?: string
          name: string
          updated_at?: string
          weight_unit?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          locale?: string
          name?: string
          updated_at?: string
          weight_unit?: string
        }
        Relationships: []
      }
      restriction_exercises: {
        Row: {
          exercise_id: string
          restriction_id: string
        }
        Insert: {
          exercise_id: string
          restriction_id: string
        }
        Update: {
          exercise_id?: string
          restriction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "restriction_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restriction_exercises_restriction_id_fkey"
            columns: ["restriction_id"]
            isOneToOne: false
            referencedRelation: "injury_restrictions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          id: string
          org_id: string
          provider: string | null
          provider_customer_id: string | null
          provider_subscription_id: string | null
          status: string
          tier: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          id?: string
          org_id: string
          provider?: string | null
          provider_customer_id?: string | null
          provider_subscription_id?: string | null
          status?: string
          tier?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          id?: string
          org_id?: string
          provider?: string | null
          provider_customer_id?: string | null
          provider_subscription_id?: string | null
          status?: string
          tier?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      training_plans: {
        Row: {
          client_id: string
          created_at: string
          created_by: string
          end_date: string | null
          engine: string
          goal: string
          id: string
          org_id: string
          source_template_id: string | null
          start_date: string
          status: string
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          created_by: string
          end_date?: string | null
          engine?: string
          goal: string
          id?: string
          org_id: string
          source_template_id?: string | null
          start_date: string
          status?: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          created_by?: string
          end_date?: string | null
          engine?: string
          goal?: string
          id?: string
          org_id?: string
          source_template_id?: string | null
          start_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_plans_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_plans_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_plans_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_sessions: {
        Row: {
          client_id: string
          created_at: string
          finished_at: string | null
          id: string
          notes: string | null
          org_id: string
          readiness_energy: number | null
          readiness_sleep: number | null
          readiness_soreness: number | null
          session_rpe: number | null
          started_at: string
          status: string
          workout_template_id: string | null
        }
        Insert: {
          client_id: string
          created_at?: string
          finished_at?: string | null
          id?: string
          notes?: string | null
          org_id: string
          readiness_energy?: number | null
          readiness_sleep?: number | null
          readiness_soreness?: number | null
          session_rpe?: number | null
          started_at?: string
          status?: string
          workout_template_id?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string
          finished_at?: string | null
          id?: string
          notes?: string | null
          org_id?: string
          readiness_energy?: number | null
          readiness_sleep?: number | null
          readiness_soreness?: number | null
          session_rpe?: number | null
          started_at?: string
          status?: string
          workout_template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_sessions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_sessions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_sessions_workout_template_id_fkey"
            columns: ["workout_template_id"]
            isOneToOne: false
            referencedRelation: "workout_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_templates: {
        Row: {
          id: string
          mesocycle_id: string
          name: string
          position: number
          suggested_weekday: number | null
        }
        Insert: {
          id?: string
          mesocycle_id: string
          name: string
          position: number
          suggested_weekday?: number | null
        }
        Update: {
          id?: string
          mesocycle_id?: string
          name?: string
          position?: number
          suggested_weekday?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_templates_mesocycle_id_fkey"
            columns: ["mesocycle_id"]
            isOneToOne: false
            referencedRelation: "mesocycles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_daily_best_e1rm: {
        Row: {
          best_e1rm_kg: number | null
          client_id: string | null
          exercise_id: string | null
          org_id: string | null
          session_date: string | null
        }
        Relationships: [
          {
            foreignKeyName: "performed_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_sessions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_sessions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      v_session_summary: {
        Row: {
          client_id: string | null
          duration_min: number | null
          org_id: string | null
          session_date: string | null
          session_id: string | null
          session_load: number | null
          session_rpe: number | null
          status: string | null
          tonnage_kg: number | null
          work_sets: number | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_sessions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_sessions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      v_set_e1rm: {
        Row: {
          client_id: string | null
          e1rm_kg: number | null
          exercise_id: string | null
          load_kg: number | null
          org_id: string | null
          performed_set_id: string | null
          reps: number | null
          rir: number | null
          rpe: number | null
          session_date: string | null
        }
        Relationships: [
          {
            foreignKeyName: "performed_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_sessions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_sessions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      v_weekly_muscle_volume: {
        Row: {
          client_id: string | null
          muscle: string | null
          org_id: string | null
          week_start: string | null
          weekly_sets: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      is_org_member: { Args: { check_org: string }; Returns: boolean }
      is_org_staff: { Args: { check_org: string }; Returns: boolean }
      trains_client: { Args: { check_client: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

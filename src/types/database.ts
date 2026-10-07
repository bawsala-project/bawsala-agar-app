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
    PostgrestVersion: "14.18"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      analysis_runs: {
        Row: {
          analysis_runtime_version: string | null
          base_state_version: number
          case_id: string
          created_at: string
          finished_at: string | null
          id: string
          model: string | null
          outcome_code: string | null
          prompt_version: string | null
          status: string
        }
        Insert: {
          analysis_runtime_version?: string | null
          base_state_version: number
          case_id: string
          created_at?: string
          finished_at?: string | null
          id?: string
          model?: string | null
          outcome_code?: string | null
          prompt_version?: string | null
          status: string
        }
        Update: {
          analysis_runtime_version?: string | null
          base_state_version?: number
          case_id?: string
          created_at?: string
          finished_at?: string | null
          id?: string
          model?: string | null
          outcome_code?: string | null
          prompt_version?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "analysis_runs_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "decision_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      case_operations: {
        Row: {
          actual_effect: Json | null
          case_id: string
          completed_at: string | null
          created_at: string
          effect_status: string
          expected_effect: Json
          id: string
          idempotency_key: string
          operation_type: string
        }
        Insert: {
          actual_effect?: Json | null
          case_id: string
          completed_at?: string | null
          created_at?: string
          effect_status?: string
          expected_effect: Json
          id?: string
          idempotency_key: string
          operation_type: string
        }
        Update: {
          actual_effect?: Json | null
          case_id?: string
          completed_at?: string | null
          created_at?: string
          effect_status?: string
          expected_effect?: Json
          id?: string
          idempotency_key?: string
          operation_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "case_operations_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "decision_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      decision_cases: {
        Row: {
          city: string
          created_at: string
          deleted_at: string | null
          id: string
          owner_id: string
          state_version: number
          status: string
          updated_at: string
        }
        Insert: {
          city: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          owner_id?: string
          state_version?: number
          status?: string
          updated_at?: string
        }
        Update: {
          city?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          owner_id?: string
          state_version?: number
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      extraction_runs: {
        Row: {
          error_code: string | null
          finished_at: string | null
          id: string
          model: string | null
          prompt_version: string | null
          property_id: string
          source_snapshot: string | null
          started_at: string
          status: string
        }
        Insert: {
          error_code?: string | null
          finished_at?: string | null
          id?: string
          model?: string | null
          prompt_version?: string | null
          property_id: string
          source_snapshot?: string | null
          started_at?: string
          status: string
        }
        Update: {
          error_code?: string | null
          finished_at?: string | null
          id?: string
          model?: string | null
          prompt_version?: string | null
          property_id?: string
          source_snapshot?: string | null
          started_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "extraction_runs_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      inspection_findings: {
        Row: {
          created_at: string
          id: string
          inspection_item_id: string
          note: string | null
          property_id: string
          result: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          inspection_item_id: string
          note?: string | null
          property_id: string
          result: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          inspection_item_id?: string
          note?: string | null
          property_id?: string
          result?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inspection_findings_inspection_item_id_fkey"
            columns: ["inspection_item_id"]
            isOneToOne: true
            referencedRelation: "inspection_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspection_findings_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      inspection_items: {
        Row: {
          affected_assessment_types: string[]
          category: string
          created_at: string
          how_to_check_ar: string
          id: string
          priority: string
          property_id: string
          question_ar: string
          trigger_reason: string
          why_it_matters_ar: string
        }
        Insert: {
          affected_assessment_types: string[]
          category: string
          created_at?: string
          how_to_check_ar: string
          id?: string
          priority: string
          property_id: string
          question_ar: string
          trigger_reason: string
          why_it_matters_ar: string
        }
        Update: {
          affected_assessment_types?: string[]
          category?: string
          created_at?: string
          how_to_check_ar?: string
          id?: string
          priority?: string
          property_id?: string
          question_ar?: string
          trigger_reason?: string
          why_it_matters_ar?: string
        }
        Relationships: [
          {
            foreignKeyName: "inspection_items_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_sar: number
          case_id: string
          created_at: string
          currency: string
          external_ref: string | null
          id: string
          idempotency_key: string
          provider: string
          provider_event_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount_sar: number
          case_id: string
          created_at?: string
          currency?: string
          external_ref?: string | null
          id?: string
          idempotency_key: string
          provider: string
          provider_event_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount_sar?: number
          case_id?: string
          created_at?: string
          currency?: string
          external_ref?: string | null
          id?: string
          idempotency_key?: string
          provider?: string
          provider_event_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "decision_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      properties: {
        Row: {
          area_sqm: number | null
          bedrooms: number | null
          case_id: string
          created_at: string
          district: string | null
          floor_no: number | null
          id: string
          image_paths: string[]
          input_mode: string
          listing_price_sar: number | null
          notes: string | null
          source_url: string | null
          title: string | null
        }
        Insert: {
          area_sqm?: number | null
          bedrooms?: number | null
          case_id: string
          created_at?: string
          district?: string | null
          floor_no?: number | null
          id?: string
          image_paths?: string[]
          input_mode: string
          listing_price_sar?: number | null
          notes?: string | null
          source_url?: string | null
          title?: string | null
        }
        Update: {
          area_sqm?: number | null
          bedrooms?: number | null
          case_id?: string
          created_at?: string
          district?: string | null
          floor_no?: number | null
          id?: string
          image_paths?: string[]
          input_mode?: string
          listing_price_sar?: number | null
          notes?: string | null
          source_url?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "properties_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "decision_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      property_assessments: {
        Row: {
          constraint_results: Json
          created_at: string
          evidence_fields: string[]
          fit_rating: string
          fit_summary: string
          id: string
          key_unknowns: Json
          price_per_sqm: number | null
          property_id: string
          risks: Json
          run_id: string
          strengths: Json
          visit_priority: string
          visit_priority_reason: string
        }
        Insert: {
          constraint_results: Json
          created_at?: string
          evidence_fields: string[]
          fit_rating: string
          fit_summary: string
          id?: string
          key_unknowns: Json
          price_per_sqm?: number | null
          property_id: string
          risks: Json
          run_id: string
          strengths: Json
          visit_priority: string
          visit_priority_reason: string
        }
        Update: {
          constraint_results?: Json
          created_at?: string
          evidence_fields?: string[]
          fit_rating?: string
          fit_summary?: string
          id?: string
          key_unknowns?: Json
          price_per_sqm?: number | null
          property_id?: string
          risks?: Json
          run_id?: string
          strengths?: Json
          visit_priority?: string
          visit_priority_reason?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_assessments_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_assessments_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "analysis_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      property_facts: {
        Row: {
          created_at: string
          evidence_text: string | null
          evidence_verified: boolean
          extraction_run_id: string | null
          field: string
          id: string
          property_id: string
          raw_text: string | null
          scope: string
          source: string
          value: Json
        }
        Insert: {
          created_at?: string
          evidence_text?: string | null
          evidence_verified?: boolean
          extraction_run_id?: string | null
          field: string
          id?: string
          property_id: string
          raw_text?: string | null
          scope: string
          source: string
          value: Json
        }
        Update: {
          created_at?: string
          evidence_text?: string | null
          evidence_verified?: boolean
          extraction_run_id?: string | null
          field?: string
          id?: string
          property_id?: string
          raw_text?: string | null
          scope?: string
          source?: string
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "property_facts_extraction_run_id_fkey"
            columns: ["extraction_run_id"]
            isOneToOne: false
            referencedRelation: "extraction_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_facts_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      reassessment_logs: {
        Row: {
          analysis_runtime_version: string | null
          assessment_id: string | null
          base_state_version: number
          case_id: string
          created_at: string
          diff: Json
          id: string
          new_fit_rating: string
          new_visit_priority: string
          previous_fit_rating: string
          previous_visit_priority: string
          property_id: string
        }
        Insert: {
          analysis_runtime_version?: string | null
          assessment_id?: string | null
          base_state_version: number
          case_id: string
          created_at?: string
          diff: Json
          id?: string
          new_fit_rating: string
          new_visit_priority: string
          previous_fit_rating: string
          previous_visit_priority: string
          property_id: string
        }
        Update: {
          analysis_runtime_version?: string | null
          assessment_id?: string | null
          base_state_version?: number
          case_id?: string
          created_at?: string
          diff?: Json
          id?: string
          new_fit_rating?: string
          new_visit_priority?: string
          previous_fit_rating?: string
          previous_visit_priority?: string
          property_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reassessment_logs_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "property_assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reassessment_logs_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "decision_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reassessment_logs_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      requirements: {
        Row: {
          case_id: string
          hard_constraints: Json
          household_size: number
          important_locations: Json
          max_budget_sar: number
          min_area_sqm: number | null
          min_bedrooms: number
          preferences: Json
          purchase_method: string
          updated_at: string
        }
        Insert: {
          case_id: string
          hard_constraints?: Json
          household_size: number
          important_locations?: Json
          max_budget_sar: number
          min_area_sqm?: number | null
          min_bedrooms: number
          preferences?: Json
          purchase_method: string
          updated_at?: string
        }
        Update: {
          case_id?: string
          hard_constraints?: Json
          household_size?: number
          important_locations?: Json
          max_budget_sar?: number
          min_area_sqm?: number | null
          min_bedrooms?: number
          preferences?: Json
          purchase_method?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "requirements_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: true
            referencedRelation: "decision_cases"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      commit_analysis: {
        Args: { p_assessments: Json; p_run_id: string }
        Returns: string
      }
      commit_reassessment: {
        Args: {
          p_base_state_version: number
          p_case_id: string
          p_diff: Json
          p_new_assessment: Json
          p_property_id: string
          p_runtime_version?: string
        }
        Returns: string
      }
      delete_case: { Args: { case_id: string }; Returns: undefined }
      link_guest_cases_to_user: {
        Args: { target_user_id: string }
        Returns: number
      }
      replace_extracted_facts: {
        Args: { p_facts: Json; p_run_id: string }
        Returns: undefined
      }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

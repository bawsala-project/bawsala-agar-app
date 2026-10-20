/**
 * Bawsala (بوصلة العقار) - Product Configuration & Single Source of Truth
 *
 * Defines the core business invariants, pricing, scope, property typologies,
 * and strategic purchase goals for the MVP.
 */

import { ALLOWED_CITIES, type AllowedCity } from "@/lib/constants/cities";

// Property Candidate Capacity
export const MAX_PROPERTIES = 5 as const;
export const MIN_PROPERTIES = 1 as const;

// Pricing & Commercial Model
export const PRICE_PER_CONSULTATION_SAR = 10 as const;
export const PRICING_UNIT = "case" as const;
export const PRICE_UNIT = PRICING_UNIT;

// Supported Jurisdiction & Geography (Saudi Arabia Only)
export const SUPPORTED_COUNTRY = "SA" as const;
export const SUPPORTED_CITIES = ALLOWED_CITIES;
export type SupportedCity = AllowedCity;

// Property Typologies
export const SUPPORTED_PROPERTY_TYPES = ["apartment"] as const;
export type SupportedPropertyType = (typeof SUPPORTED_PROPERTY_TYPES)[number];

// Feature Flag: Later expansions (villas, townhouses, duplexes, commercial/investment)
export const EXPANSION_TYPES = false;

// Expansion Types reserved for future versions
export const EXPANSION_PROPERTY_TYPES = [
  "apartment",
  "villa",
  "townhouse",
] as const;
export type ExpansionPropertyType = (typeof EXPANSION_PROPERTY_TYPES)[number];

// Funnel Workflow Steps
export const FREE_STEP = "readiness_check" as const;

// Strategic Purchase Goals
export interface StrategicGoal {
  id: string;
  label: string;
  sublabel: string;
}

// Relevant home-buying goals for a resident buyer in MVP
export const RESIDENT_STRATEGIC_GOALS: readonly StrategicGoal[] = [
  {
    id: "family",
    label: "سكن عائلي أول",
    sublabel: "أولوية الخصوصية والراحة والاستقرار",
  },
  {
    id: "upgrade",
    label: "ترقية مسكن",
    sublabel: "تحسين الموقع وجودة البناء والمساحة",
  },
  {
    id: "closer",
    label: "الاقتراب من العمل أو المدارس",
    sublabel: "تقليص أوقات المشاوير والازدحام اليومي",
  },
] as const;

// Future Expansion Goals (includes investment)
export const EXPANSION_STRATEGIC_GOALS: readonly StrategicGoal[] = [
  ...RESIDENT_STRATEGIC_GOALS,
  {
    id: "invest",
    label: "استثمار عقاري",
    sublabel: "عائد الإيجار ونمو رأس المال",
  },
] as const;

export const ACTIVE_STRATEGIC_GOALS: readonly StrategicGoal[] = EXPANSION_TYPES
  ? EXPANSION_STRATEGIC_GOALS
  : RESIDENT_STRATEGIC_GOALS;

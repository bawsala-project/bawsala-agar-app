import type { Database } from "@/types/database";
import { FIELD_REGISTRY, ResolvableFieldKey } from "@/lib/evidence/fields";
import type { ResolveFactsResult } from "@/lib/evidence/resolve";

export type BlockerCode =
  | "NO_REQUIREMENTS"
  | "NO_PROPERTIES"
  | "EXTRACTION_RUNNING"
  | "EXTRACTION_FAILED_NO_DATA"
  | "CRITICAL_CONFLICT"
  | "NOTHING_TO_ANALYZE";

export type WarningCode =
  | "PRICE_UNKNOWN"
  | "AREA_UNKNOWN"
  | "BEDROOMS_UNKNOWN"
  | "NON_CRITICAL_CONFLICT"
  | "CONSTRAINT_UNVERIFIABLE";

export type IssueCode = BlockerCode | WarningCode;

export interface Issue {
  code: IssueCode;
  propertyId?: string;
  field?: string;
  messageAr: string;
}

export type RequirementsRow = Database["public"]["Tables"]["requirements"]["Row"];

export interface PreflightPropertyInput {
  id: string;
  label: string;
  latestRun?: { status: string; error_code?: string | null } | null;
  resolved: ResolveFactsResult;
}

export interface PreflightInput {
  requirements: RequirementsRow | null;
  properties: PreflightPropertyInput[];
}

export interface PreflightResult {
  ready: boolean;
  blockers: Issue[];
  warnings: Issue[];
}

const CONSTRAINT_FIELD_MAPPING: Record<string, ResolvableFieldKey> = {
  elevator_required: "elevator",
  private_parking: "private_parking",
  max_floor: "floor_no",
  new_building_only: "property_age_years",
};

const NON_CRITICAL_KEYS: ResolvableFieldKey[] = [
  "bedrooms",
  "bathrooms",
  "floor_no",
  "building_floors",
  "property_age_years",
  "elevator",
  "private_parking",
  "district",
];

export function evaluatePreflight(input: PreflightInput): PreflightResult {
  const blockers: Issue[] = [];
  const warnings: Issue[] = [];

  // 1. Requirements check
  if (!input.requirements) {
    blockers.push({
      code: "NO_REQUIREMENTS",
      messageAr: "لم يتم تحديد احتياجات الشراء والميزانية بعد",
    });
  }

  // 2. Properties check
  if (!input.properties || input.properties.length === 0) {
    blockers.push({
      code: "NO_PROPERTIES",
      messageAr: "لم تتم إضافة أي عقارات للمقارنة بعد",
    });
  }

  // 3. Per-property checks
  for (const prop of input.properties || []) {
    // 3a. Extraction running blocker
    if (prop.latestRun?.status === "running") {
      blockers.push({
        code: "EXTRACTION_RUNNING",
        propertyId: prop.id,
        messageAr: `تحليل بيانات العقار (${prop.label}) لا يزال جاريًا`,
      });
    }

    // 3b. Extraction failed with zero known facts
    const totalKnownCount = Object.values(prop.resolved.fields).filter(
      (f) => f.status === "known"
    ).length;

    if (prop.latestRun?.status === "failed" && totalKnownCount === 0) {
      blockers.push({
        code: "EXTRACTION_FAILED_NO_DATA",
        propertyId: prop.id,
        messageAr: `فشلت محاولة استخراج بيانات العقار (${prop.label}) ولا توجد أي معلومات مسجلة له`,
      });
    }

    // 3c. Critical conflicts (listing_price_sar or area_sqm)
    if (prop.resolved.fields.listing_price_sar.status === "conflicting") {
      blockers.push({
        code: "CRITICAL_CONFLICT",
        propertyId: prop.id,
        field: "listing_price_sar",
        messageAr: `يوجد تعارض في سعر العرض للعقار (${prop.label}) يتطلب الاختيار أو التصحيح`,
      });
    }

    if (prop.resolved.fields.area_sqm.status === "conflicting") {
      blockers.push({
        code: "CRITICAL_CONFLICT",
        propertyId: prop.id,
        field: "area_sqm",
        messageAr: `يوجد تعارض في مساحة العقار (${prop.label}) يتطلب الاختيار أو التصحيح`,
      });
    }

    // 3d. Nothing to analyze (none of the critical fields known)
    const hasAnyCriticalKnown =
      prop.resolved.fields.listing_price_sar.status === "known" ||
      prop.resolved.fields.area_sqm.status === "known" ||
      prop.resolved.fields.bedrooms.status === "known";

    if (!hasAnyCriticalKnown) {
      blockers.push({
        code: "NOTHING_TO_ANALYZE",
        propertyId: prop.id,
        messageAr: `لا تتوفر أي معلومة أساسية (السعر، المساحة، أو غرف النوم) للعقار (${prop.label}) للمقارنة والتحليل`,
      });
    }

    // 3e. Unknown critical fields warnings
    if (prop.resolved.fields.listing_price_sar.status === "unknown") {
      warnings.push({
        code: "PRICE_UNKNOWN",
        propertyId: prop.id,
        field: "listing_price_sar",
        messageAr: `سعر العرض غير معروف للعقار (${prop.label})`,
      });
    }

    if (prop.resolved.fields.area_sqm.status === "unknown") {
      warnings.push({
        code: "AREA_UNKNOWN",
        propertyId: prop.id,
        field: "area_sqm",
        messageAr: `المساحة غير معروفة للعقار (${prop.label})`,
      });
    }

    if (prop.resolved.fields.bedrooms.status === "unknown") {
      warnings.push({
        code: "BEDROOMS_UNKNOWN",
        propertyId: prop.id,
        field: "bedrooms",
        messageAr: `عدد غرف النوم غير معروف للعقار (${prop.label})`,
      });
    }

    // 3f. Non-critical conflicts warning
    for (const key of NON_CRITICAL_KEYS) {
      if (prop.resolved.fields[key].status === "conflicting") {
        warnings.push({
          code: "NON_CRITICAL_CONFLICT",
          propertyId: prop.id,
          field: key,
          messageAr: `يوجد تعارض في (${FIELD_REGISTRY[key].label}) للعقار (${prop.label})`,
        });
      }
    }

    // 3g. Constraint unverifiable warning
    if (input.requirements && Array.isArray(input.requirements.hard_constraints)) {
      const constraints = input.requirements.hard_constraints as Array<{
        key?: string;
        label?: string;
      }>;

      for (const constraint of constraints) {
        if (!constraint || !constraint.key) continue;
        const targetField = CONSTRAINT_FIELD_MAPPING[constraint.key];
        if (targetField && prop.resolved.fields[targetField].status === "unknown") {
          const constraintLabel = constraint.label || FIELD_REGISTRY[targetField].label;
          warnings.push({
            code: "CONSTRAINT_UNVERIFIABLE",
            propertyId: prop.id,
            field: targetField,
            messageAr: `الشرط الأساسي (${constraintLabel}) غير قابل للتحقق للعقار (${prop.label}) لعدم توفر معلومة (${FIELD_REGISTRY[targetField].label})`,
          });
        }
      }
    }
  }

  return {
    ready: blockers.length === 0,
    blockers,
    warnings,
  };
}

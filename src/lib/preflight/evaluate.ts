import type { Database } from "@/types/database";
import { FIELD_REGISTRY, ResolvableFieldKey } from "@/lib/evidence/fields";
import type { ResolveFactsResult } from "@/lib/evidence/resolve";

import { MIN_PROPERTIES, MAX_PROPERTIES } from "@/config/product";

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
  district?: string | null;
  listingPriceSar?: number | null;
  areaSqm?: number | null;
  floorNo?: number | null;
  buildingAgeYears?: number | null;
  latestRun?: { status: string; error_code?: string | null } | null;
  resolved: ResolveFactsResult;
}

export interface PreflightInput {
  requirements: RequirementsRow | null;
  properties: PreflightPropertyInput[];
}

export interface PropertyReadiness {
  propertyId: string;
  label: string;
  isComplete: boolean;
  status: "complete" | "missing_items";
  missingItems: string[];
  fields: {
    price: boolean;
    area: boolean;
    district: boolean;
    floor: boolean;
    buildingAge: boolean;
  };
}

export interface CaseReadiness {
  isReady: boolean;
  status: "complete" | "missing_items";
  buyerProfileComplete: boolean;
  buyerProfileMissing: string[];
  propertyCountValid: boolean;
  propertyCount: number;
  properties: PropertyReadiness[];
  allMissingItems: string[];
}

export interface PreflightResult {
  ready: boolean;
  blockers: Issue[];
  warnings: Issue[];
  readiness: CaseReadiness;
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

  // 4. Commercial Flow: Free Readiness Check Evaluation
  // 4a. Buyer Profile completeness
  let buyerProfileComplete = false;
  const buyerProfileMissing: string[] = [];

  if (!input.requirements) {
    buyerProfileMissing.push("ملف وتفضيلات المشتري والميزانية غير مسجلة");
  } else {
    const budget = Number(input.requirements.max_budget_sar);
    if (!budget || isNaN(budget) || budget <= 0) {
      buyerProfileMissing.push("الميزانية القصوى للشراء");
    }

    const household = Number(input.requirements.household_size);
    if (!household || isNaN(household) || household < 1) {
      buyerProfileMissing.push("عدد أفراد الأسرة");
    }

    const bedrooms = Number(input.requirements.min_bedrooms);
    if (!bedrooms || isNaN(bedrooms) || bedrooms < 1) {
      buyerProfileMissing.push("الحد الأدنى لغرف النوم");
    }

    // If mortgage, check monthly installment ceiling if profile present
    const rawPreferences =
      input.requirements.preferences && typeof input.requirements.preferences === "object"
        ? (input.requirements.preferences as Record<string, unknown>)
        : null;
    const embeddedProfile = (rawPreferences?.buyer_profile || rawPreferences) as Record<string, unknown> | null;
    const paymentMethod =
      embeddedProfile?.payment_method ??
      (input.requirements.purchase_method === "finance" ? "mortgage" : "cash");

    if (paymentMethod === "mortgage") {
      const ceiling = Number(embeddedProfile?.monthly_installment_ceiling_sar);
      if (
        embeddedProfile?.monthly_installment_ceiling_sar !== undefined &&
        embeddedProfile?.monthly_installment_ceiling_sar !== null &&
        (!ceiling || isNaN(ceiling) || ceiling <= 0)
      ) {
        buyerProfileMissing.push("سقف القسط الشهري للتمويل العقاري");
      }
    }

    buyerProfileComplete = buyerProfileMissing.length === 0;
  }

  // 4b. Properties count check (1 to 5 properties)
  const propList = input.properties || [];
  const propertyCount = propList.length;
  const propertyCountValid = propertyCount >= MIN_PROPERTIES && propertyCount <= MAX_PROPERTIES;
  const propertyCountMissing: string[] = [];

  if (propertyCount === 0) {
    propertyCountMissing.push(`يلزم إدخال شقة واحدة على الأقل للمقارنة (المسموح من ${MIN_PROPERTIES} إلى ${MAX_PROPERTIES} شقق)`);
  } else if (propertyCount > MAX_PROPERTIES) {
    propertyCountMissing.push(`تجاوز الحد الأقصى المسموح للشقق (${propertyCount} شقق مضافة، والحد الأقصى ${MAX_PROPERTIES})`);
  }

  // 4c. Per-property minimum required fields check (price, area, district, floor, building age)
  const propertiesReadiness: PropertyReadiness[] = propList.map((prop) => {
    // Price
    const hasPrice =
      (prop.resolved.fields.listing_price_sar.status === "known" &&
        Number(prop.resolved.fields.listing_price_sar.value) > 0) ||
      (prop.listingPriceSar !== null && prop.listingPriceSar !== undefined && prop.listingPriceSar > 0);

    // Area
    const hasArea =
      (prop.resolved.fields.area_sqm.status === "known" &&
        Number(prop.resolved.fields.area_sqm.value) > 0) ||
      (prop.areaSqm !== null && prop.areaSqm !== undefined && prop.areaSqm > 0);

    // District
    const districtField = prop.resolved.fields.district;
    const hasDistrict =
      (districtField.status === "known" &&
        typeof districtField.value === "string" &&
        districtField.value.trim().length > 0) ||
      (typeof prop.district === "string" && prop.district.trim().length > 0) ||
      (typeof prop.label === "string" &&
        prop.label.trim().length > 0 &&
        prop.label !== "عقار بدون عنوان" &&
        !prop.label.startsWith("صور العقار"));

    // Floor
    const floorField = prop.resolved.fields.floor_no;
    const hasFloor =
      (floorField.status === "known" &&
        floorField.value !== null &&
        floorField.value !== undefined &&
        !isNaN(Number(floorField.value))) ||
      (prop.floorNo !== null && prop.floorNo !== undefined && !isNaN(Number(prop.floorNo)));

    // Age of building
    const ageField = prop.resolved.fields.property_age_years;
    const hasBuildingAge =
      (ageField.status === "known" &&
        ageField.value !== null &&
        ageField.value !== undefined &&
        !isNaN(Number(ageField.value))) ||
      (prop.buildingAgeYears !== null &&
        prop.buildingAgeYears !== undefined &&
        !isNaN(Number(prop.buildingAgeYears)));

    const missingItems: string[] = [];
    if (!hasPrice) missingItems.push("سعر العرض");
    if (!hasArea) missingItems.push("المساحة (م²)");
    if (!hasDistrict) missingItems.push("الحي");
    if (!hasFloor) missingItems.push("رقم الدور");
    if (!hasBuildingAge) missingItems.push("عمر المبنى");

    const isComplete = missingItems.length === 0;

    return {
      propertyId: prop.id,
      label: prop.label,
      isComplete,
      status: isComplete ? "complete" : "missing_items",
      missingItems,
      fields: {
        price: hasPrice,
        area: hasArea,
        district: hasDistrict,
        floor: hasFloor,
        buildingAge: hasBuildingAge,
      },
    };
  });

  // 4d. Overall Case Readiness
  const allPropertiesComplete =
    propertyCountValid &&
    propertiesReadiness.length > 0 &&
    propertiesReadiness.every((p) => p.isComplete);

  const isCaseReady =
    buyerProfileComplete &&
    propertyCountValid &&
    allPropertiesComplete &&
    blockers.length === 0;

  const allMissingItems: string[] = [
    ...buyerProfileMissing,
    ...propertyCountMissing,
    ...propertiesReadiness
      .filter((p) => !p.isComplete)
      .map((p) => `العقار (${p.label}): ينقص [${p.missingItems.join("، ")}]`),
  ];

  const readiness: CaseReadiness = {
    isReady: isCaseReady,
    status: isCaseReady ? "complete" : "missing_items",
    buyerProfileComplete,
    buyerProfileMissing,
    propertyCountValid,
    propertyCount,
    properties: propertiesReadiness,
    allMissingItems,
  };

  return {
    ready: blockers.length === 0,
    blockers,
    warnings,
    readiness,
  };
}

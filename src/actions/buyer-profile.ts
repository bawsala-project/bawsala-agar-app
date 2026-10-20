"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireCase } from "@/lib/auth";
import {
  buyerProfileSchema,
  budgetStepSchema,
  householdStepSchema,
  dailyLifeStepSchema,
  needsStepSchema,
  prioritiesStepSchema,
  constraintsStepSchema,
  type BuyerProfile,
  DEFAULT_BUYER_PROFILE,
} from "@/lib/schemas/buyer-profile";

export interface BuyerProfileActionState {
  success?: boolean;
  errors?: Record<string, string[] | undefined>;
  message?: string;
  savedStep?: number;
}

/**
 * Loads the existing BuyerProfile for a consultation case.
 * Restores from `requirements.preferences.buyer_profile` or extracts from requirements fields.
 */
export async function loadBuyerProfile(caseId: string): Promise<BuyerProfile | null> {
  try {
    const supabase = createClient();
    const query = supabase.from("requirements");
    if (!query || typeof query.select !== "function") {
      return null;
    }

    const { data: req } = await query
      .select("*")
      .eq("case_id", caseId)
      .maybeSingle();

    if (!req) return null;

  // 1. Check if structured buyer_profile was saved in preferences JSON
  const rawPreferences = (req.preferences && typeof req.preferences === "object")
    ? (req.preferences as Record<string, unknown>)
    : null;

  const embeddedProfile = rawPreferences?.buyer_profile || rawPreferences;
  if (embeddedProfile && typeof embeddedProfile === "object") {
    const parsed = buyerProfileSchema.safeParse(embeddedProfile);
    if (parsed.success) {
      return parsed.data;
    }
  }

  // 2. Fallback: reconstruct from traditional requirements columns
  const hardConstraints = Array.isArray(req.hard_constraints)
    ? (req.hard_constraints as Array<{ key: string; label?: string; value?: unknown }>)
    : [];

  const hasElevator = hardConstraints.some((c) => c.key === "elevator_required");
  const hasParking = hardConstraints.some((c) => c.key === "private_parking");
  const maxFloor = hardConstraints.find((c) => c.key === "max_floor");

  const dealBreakers = hardConstraints
    .filter((c) => c.key === "custom" && typeof c.label === "string")
    .map((c) => c.label as string);

  const locs = Array.isArray(req.important_locations)
    ? (req.important_locations as Array<{ label?: string; address_text?: string }>)
    : [];

  const workLoc = locs.find((l) => l.label?.includes("عمل"))?.address_text || "";
  const schoolLoc = locs.find((l) => l.label?.includes("مدرس"))?.address_text || "";

  return {
    ...DEFAULT_BUYER_PROFILE,
    max_budget_sar: Number(req.max_budget_sar) || DEFAULT_BUYER_PROFILE.max_budget_sar,
    payment_method: req.purchase_method === "finance" ? "mortgage" : "cash",
    family_members_count: Number(req.household_size) || DEFAULT_BUYER_PROFILE.family_members_count,
    min_bedrooms: Number(req.min_bedrooms) || DEFAULT_BUYER_PROFILE.min_bedrooms,
    min_area_sqm: req.min_area_sqm !== null ? Number(req.min_area_sqm) : DEFAULT_BUYER_PROFILE.min_area_sqm,
    elevator_required: hasElevator,
    parking_required: hasParking,
    floor_preference: maxFloor ? "ground" : "any",
    work_location: workLoc,
    school_location: schoolLoc,
    deal_breakers: dealBreakers.length > 0 ? dealBreakers : DEFAULT_BUYER_PROFILE.deal_breakers,
  };
  } catch {
    return null;
  }
}

/**
 * Saves a single step's progress for the Buyer Profile.
 * Enables saving draft progress step-by-step.
 */
export async function saveBuyerProfileStep(
  caseId: string,
  stepNumber: number,
  stepData: Record<string, unknown>
): Promise<BuyerProfileActionState> {
  const supabase = createClient();
  await requireCase(caseId, supabase);

  // Validate the specific step
  let stepError: Record<string, string[] | undefined> | undefined;

  switch (stepNumber) {
    case 1: {
      const parsed = budgetStepSchema.safeParse(stepData);
      if (!parsed.success) stepError = parsed.error.flatten().fieldErrors;
      break;
    }
    case 2: {
      const parsed = householdStepSchema.safeParse(stepData);
      if (!parsed.success) stepError = parsed.error.flatten().fieldErrors;
      break;
    }
    case 3: {
      const parsed = dailyLifeStepSchema.safeParse(stepData);
      if (!parsed.success) stepError = parsed.error.flatten().fieldErrors;
      break;
    }
    case 4: {
      const parsed = needsStepSchema.safeParse(stepData);
      if (!parsed.success) stepError = parsed.error.flatten().fieldErrors;
      break;
    }
    case 5: {
      const parsed = prioritiesStepSchema.safeParse(stepData);
      if (!parsed.success) stepError = parsed.error.flatten().fieldErrors;
      break;
    }
    case 6: {
      const parsed = constraintsStepSchema.safeParse(stepData);
      if (!parsed.success) stepError = parsed.error.flatten().fieldErrors;
      break;
    }
    default:
      break;
  }

  if (stepError && Object.keys(stepError).length > 0) {
    return { success: false, errors: stepError };
  }

  // Load current profile to merge
  const existing = (await loadBuyerProfile(caseId)) || DEFAULT_BUYER_PROFILE;
  const merged: BuyerProfile = {
    ...existing,
    ...stepData,
  } as BuyerProfile;

  // Save the updated profile to the database
  return saveBuyerProfile(caseId, merged, false);
}

/**
 * Validates and commits the complete BuyerProfile to the database linked to the consultation case.
 * Serializes into `requirements` so all downstream systems (matching, preflight, compare) stay 100% in sync.
 */
export async function saveBuyerProfile(
  caseId: string,
  profileData: unknown,
  shouldRedirect = true
): Promise<BuyerProfileActionState> {
  const supabase = createClient();
  await requireCase(caseId, supabase);

  const parsed = buyerProfileSchema.safeParse(profileData);
  if (!parsed.success) {
    return {
      success: false,
      errors: parsed.error.flatten().fieldErrors,
      message: "يرجى مراجعة الحقول المطلوبة والتأكد من صحتها",
    };
  }

  const profile = parsed.data;

  // Synthesize hard constraints for downstream rules and SQL checks
  const hardConstraints = [];
  if (profile.elevator_required) {
    hardConstraints.push({ key: "elevator_required", label: "وجود مصعد في المبنى" });
  }
  if (profile.parking_required) {
    hardConstraints.push({ key: "private_parking", label: "موقف سيارة خاص" });
  }
  if (profile.floor_preference === "ground") {
    hardConstraints.push({ key: "max_floor", label: "دور أرضي", value: 0 });
  } else if (profile.floor_preference === "middle") {
    hardConstraints.push({ key: "max_floor", label: "دور متوسط", value: 4 });
  }
  for (const db of profile.deal_breakers) {
    hardConstraints.push({ key: "custom", label: db });
  }

  // Synthesize important locations for downstream commute analysis
  const importantLocations = [];
  if (profile.work_location) {
    importantLocations.push({
      label: "مقر العمل",
      address_text: profile.work_location,
      frequency: "daily",
    });
  }
  if (profile.school_location) {
    importantLocations.push({
      label: "مقر المدارس",
      address_text: profile.school_location,
      frequency: "daily",
    });
  }

  // Synthesize weighted preferences based on ranked priorities
  const preferences = profile.ranked_priorities.map((pId, idx) => {
    const weight = idx === 0 ? "high" : idx < 3 ? "medium" : "low";
    return {
      id: pId,
      label: pId,
      weight,
    };
  });

  // Persist into requirements table
  const { error: upsertError } = await supabase.from("requirements").upsert({
    case_id: caseId,
    max_budget_sar: profile.max_budget_sar,
    purchase_method: profile.payment_method === "mortgage" ? "finance" : "cash",
    household_size: profile.family_members_count,
    min_bedrooms: profile.min_bedrooms,
    min_area_sqm: profile.min_area_sqm ?? null,
    hard_constraints: hardConstraints,
    important_locations: importantLocations,
    preferences: {
      buyer_profile: profile,
      items: preferences,
    },
    updated_at: new Date().toISOString(),
  });

  if (upsertError) {
    return {
      success: false,
      errors: {
        form: [upsertError.message || "حدث خطأ أثناء حفظ ملف المشتري"],
      },
    };
  }

  // Update case status to 'needs_complete' if currently draft
  await supabase
    .from("decision_cases")
    .update({ status: "needs_complete" })
    .eq("id", caseId)
    .eq("status", "draft");

  revalidatePath(`/case/${caseId}/profile`);
  revalidatePath(`/case/${caseId}/needs`);
  revalidatePath(`/case/${caseId}/properties`);
  revalidatePath(`/case/${caseId}/preflight`);
  revalidatePath(`/case/${caseId}/results`);
  revalidatePath(`/dashboard`);

  if (shouldRedirect) {
    redirect(`/case/${caseId}/properties`);
  }

  return {
    success: true,
    message: "تم حفظ بيانات ملف المشتري بنجاح",
  };
}

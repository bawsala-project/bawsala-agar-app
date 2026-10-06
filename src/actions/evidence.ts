"use server";

import { revalidatePath } from "next/cache";
import { requireCase } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { adminSupabase } from "@/lib/supabase/admin";
import { FIELD_REGISTRY, FieldKey } from "@/lib/evidence/fields";
import { normalizeField } from "@/lib/evidence/normalize";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database";

export interface EvidenceActionState {
  errors?: Record<string, string[] | undefined>;
  success?: boolean;
}

export async function submitCorrection(
  caseId: string,
  propertyId: string,
  prevStateOrPayload?: EvidenceActionState | FormData | Record<string, unknown>,
  maybePayload?: FormData | Record<string, unknown> | SupabaseClient<Database>,
  clientOverride?: SupabaseClient<Database>
): Promise<EvidenceActionState> {
  let payload: unknown;
  let client: SupabaseClient<Database> | undefined;

  if (maybePayload && typeof (maybePayload as Record<string, unknown>).from === "function") {
    payload = prevStateOrPayload;
    client = maybePayload as SupabaseClient<Database>;
  } else if (clientOverride) {
    payload = maybePayload !== undefined ? maybePayload : prevStateOrPayload;
    client = clientOverride;
  } else {
    payload = maybePayload !== undefined ? maybePayload : prevStateOrPayload;
    client = undefined;
  }

  // 1. Enforce user access to the case (RLS check; throws notFound if not theirs)
  await requireCase(caseId, client);

  // 2. Verify property belongs to this case
  const supabase = client ?? createClient();
  const { data: property, error: propErr } = await supabase
    .from("properties")
    .select("id")
    .eq("id", propertyId)
    .eq("case_id", caseId)
    .maybeSingle();

  if (propErr || !property) {
    return {
      errors: {
        form: ["العقار غير موجود أو لا تملك صلاحية الوصول إليه"],
      },
    };
  }

  // 3. Extract field & value
  let field = "";
  let rawValue = "";

  if (payload instanceof FormData) {
    field = String(payload.get("field") || "").trim();
    rawValue = String(payload.get("value") || "").trim();
  } else if (typeof payload === "object" && payload !== null) {
    const obj = payload as Record<string, unknown>;
    field = String(obj.field || "").trim();
    rawValue = String(obj.value || "").trim();
  }

  // 4. Validate field key against registry (must be known and not listing_claim)
  if (!field || !(field in FIELD_REGISTRY) || field === "listing_claim") {
    return {
      errors: {
        field: ["حقل غير صالح أو غير معتمد"],
      },
    };
  }

  const fieldKey = field as FieldKey;
  const fieldDef = FIELD_REGISTRY[fieldKey];

  // 5. Normalize and validate value
  const normalized = normalizeField(fieldKey, rawValue);

  if (normalized === null) {
    let msg = `القيمة المدخلة لـ "${fieldDef.label}" غير صالحة`;
    if ("min" in fieldDef && "max" in fieldDef && fieldDef.min !== undefined && fieldDef.max !== undefined) {
      msg = `${fieldDef.label} يجب أن تكون بين ${fieldDef.min} و ${fieldDef.max}`;
    } else if (fieldDef.valueType === "boolean") {
      msg = `يرجى تحديد قيمة صالحة لـ "${fieldDef.label}" (نعم / لا)`;
    }
    return {
      errors: {
        [field]: [msg],
      },
    };
  }

  // 6. Insert user_correction fact via admin client
  const scope = ("scope" in fieldDef ? fieldDef.scope : undefined) ?? "unit";

  const { error: insertErr } = await adminSupabase.from("property_facts").insert({
    property_id: propertyId,
    field: fieldKey,
    value: normalized as unknown as Json,
    raw_text: rawValue,
    scope,
    source: "user_correction",
    evidence_text: null,
    evidence_verified: false,
  });

  if (insertErr) {
    return {
      errors: {
        form: [insertErr.message || "حدث خطأ أثناء حفظ التصحيح"],
      },
    };
  }

  try {
    revalidatePath(`/case/${caseId}/properties/${propertyId}`);
    revalidatePath(`/case/${caseId}/properties`);
  } catch {
    // Ignore error when called outside Next.js request context (e.g. in tests)
  }

  return {
    success: true,
  };
}

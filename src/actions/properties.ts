"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { propertySchema } from "@/lib/schemas/property";
import { deletePropertyImages } from "@/lib/storage";
import { runExtraction } from "@/lib/extraction/run-extraction";
import { enforceRateLimit } from "@/lib/security/rate-limit";

export interface PropertyActionState {
  errors?: Record<string, string[] | undefined>;
  success?: boolean;
}

export async function addProperty(
  caseId: string,
  prevStateOrPayload?: PropertyActionState | FormData | Record<string, unknown>,
  maybePayload?: FormData | Record<string, unknown>
): Promise<PropertyActionState> {
  const payload =
    maybePayload !== undefined ? maybePayload : prevStateOrPayload;

  if (!payload) {
    return {
      errors: {
        form: ["بيانات العقار غير صالحة"],
      },
    };
  }

  let rawValues: Record<string, unknown> = {};

  if (payload instanceof FormData) {
    const inputMode = payload.get("input_mode");
    const rawImagePaths = payload.get("image_paths");
    let imagePaths: string[] = [];
    if (typeof rawImagePaths === "string" && rawImagePaths) {
      try {
        const parsed = JSON.parse(rawImagePaths);
        if (Array.isArray(parsed)) imagePaths = parsed;
      } catch {
        imagePaths = [rawImagePaths];
      }
    }

    rawValues = {
      input_mode: inputMode,
      source_url: payload.get("source_url") || undefined,
      image_paths: imagePaths,
      title: payload.get("title") || undefined,
      district: payload.get("district") || undefined,
      listing_price_sar: payload.get("listing_price_sar") || undefined,
      area_sqm: payload.get("area_sqm") || undefined,
      bedrooms: payload.get("bedrooms") || undefined,
      floor_no: payload.get("floor_no") || undefined,
      notes: payload.get("notes") || undefined,
    };
  } else if (typeof payload === "object" && payload !== null) {
    rawValues = payload as Record<string, unknown>;
  }

  const parsed = propertySchema.safeParse(rawValues);

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    return {
      errors: fieldErrors,
    };
  }

  const limit = await enforceRateLimit("extract");
  if (!limit.allowed) {
    return { errors: { form: [limit.message] } };
  }

  const supabase = createClient();

  const insertPayload = {
    case_id: caseId,
    input_mode: parsed.data.input_mode,
    source_url: parsed.data.input_mode === "url" ? parsed.data.source_url : null,
    image_paths: parsed.data.input_mode === "image" ? parsed.data.image_paths : [],
    title: parsed.data.input_mode === "manual" ? parsed.data.title || null : null,
    district: parsed.data.input_mode === "manual" ? parsed.data.district || null : null,
    listing_price_sar:
      parsed.data.input_mode === "manual" ? parsed.data.listing_price_sar ?? null : null,
    area_sqm: parsed.data.input_mode === "manual" ? parsed.data.area_sqm ?? null : null,
    bedrooms: parsed.data.input_mode === "manual" ? parsed.data.bedrooms ?? null : null,
    floor_no: parsed.data.input_mode === "manual" ? parsed.data.floor_no ?? null : null,
    notes: parsed.data.notes || null,
  };

  const { data: insertedProp, error: insertError } = await supabase
    .from("properties")
    .insert(insertPayload)
    .select("id")
    .single();

  if (insertError || !insertedProp) {
    if (
      insertError?.code === "23505" ||
      insertError?.message.includes("unique") ||
      insertError?.message.includes("properties_case_id_source_url_key")
    ) {
      return {
        errors: {
          source_url: ["هذا الرابط مضاف مسبقًا"],
        },
      };
    }

    if (
      insertError?.message.includes("Cannot add more than 5 properties to a case") ||
      insertError?.code === "P0001"
    ) {
      return {
        errors: {
          form: ["الحد الأقصى 5 عقارات"],
        },
      };
    }

    return {
      errors: {
        form: [insertError?.message || "حدث خطأ أثناء حفظ العقار"],
      },
    };
  }

  // After the first property is added, set status to 'properties_complete'
  await supabase
    .from("decision_cases")
    .update({ status: "properties_complete" })
    .eq("id", caseId);

  // Run extraction pipeline immediately and await it
  await runExtraction(insertedProp.id);

  revalidatePath(`/case/${caseId}/properties`);

  return {
    success: true,
  };
}

export async function retryExtraction(
  caseId: string,
  propertyId: string
): Promise<{ success: boolean; error?: string }> {
  const limit = await enforceRateLimit("extract");
  if (!limit.allowed) {
    return { success: false, error: limit.message };
  }

  const result = await runExtraction(propertyId);
  revalidatePath(`/case/${caseId}/properties`);

  if (!result.ok) {
    return { success: false, error: result.errorCode };
  }
  return { success: true };
}

export async function removeProperty(
  caseId: string,
  propertyId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  // Find image paths if any to delete from storage bucket
  const { data: prop } = await supabase
    .from("properties")
    .select("image_paths")
    .eq("id", propertyId)
    .eq("case_id", caseId)
    .maybeSingle();

  const { error: deleteError } = await supabase
    .from("properties")
    .delete()
    .eq("id", propertyId)
    .eq("case_id", caseId);

  if (deleteError) {
    return { success: false, error: deleteError.message };
  }

  // Delete its storage objects if any
  if (prop?.image_paths && prop.image_paths.length > 0) {
    await deletePropertyImages(supabase, prop.image_paths);
  }

  // If 0 properties remain, set status back to 'needs_complete'
  const { count } = await supabase
    .from("properties")
    .select("*", { count: "exact", head: true })
    .eq("case_id", caseId);

  if (count === 0) {
    await supabase
      .from("decision_cases")
      .update({ status: "needs_complete" })
      .eq("id", caseId);
  }

  revalidatePath(`/case/${caseId}/properties`);

  return { success: true };
}

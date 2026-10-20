import "server-only";

import { createClient } from "@/lib/supabase/server";
import { resolveFacts, PropertyFact } from "@/lib/evidence/resolve";
import type { PreflightInput, PreflightPropertyInput } from "./evaluate";
import type { Database } from "@/types/database";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function loadPreflightData(
  caseId: string,
  clientOverride?: SupabaseClient<Database>
): Promise<PreflightInput> {
  const supabase = clientOverride ?? createClient();

  // 1. Fetch requirements for this case
  const { data: requirements } = await supabase
    .from("requirements")
    .select("*")
    .eq("case_id", caseId)
    .maybeSingle();

  // 2. Fetch properties with their extraction runs and facts
  const { data: properties } = await supabase
    .from("properties")
    .select(`
      *,
      extraction_runs (*),
      property_facts (*)
    `)
    .eq("case_id", caseId)
    .order("created_at", { ascending: true });

  const formattedProperties: PreflightPropertyInput[] = (properties || []).map((p) => {
    // Generate human-friendly label
    let label = p.title || p.district || "";
    if (!label) {
      if (p.input_mode === "url" && p.source_url) {
        try {
          label = new URL(p.source_url).hostname;
        } catch {
          label = "رابط إلكتروني";
        }
      } else if (p.input_mode === "image") {
        label = `صور العقار (${p.image_paths?.length || 0})`;
      } else {
        label = "عقار بدون عنوان";
      }
    }

    // Sort extraction runs descending by started_at
    const runs = [...(p.extraction_runs || [])].sort(
      (a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
    );
    const latestRun = runs[0]
      ? { status: runs[0].status, error_code: runs[0].error_code }
      : null;

    // Resolve facts
    const resolved = resolveFacts((p.property_facts as PropertyFact[]) || []);

    // Extract age of building if present in resolved facts or notes tag
    let buildingAgeYears: number | null = null;
    if (
      resolved.fields.property_age_years?.status === "known" &&
      resolved.fields.property_age_years.value !== null &&
      !isNaN(Number(resolved.fields.property_age_years.value))
    ) {
      buildingAgeYears = Number(resolved.fields.property_age_years.value);
    } else if (p.notes) {
      const match = p.notes.match(/عمر المبنى:\s*(\d+)/);
      if (match) {
        buildingAgeYears = Number(match[1]);
      }
    }

    return {
      id: p.id,
      label,
      district: p.district || null,
      listingPriceSar:
        p.listing_price_sar !== null && p.listing_price_sar !== undefined
          ? Number(p.listing_price_sar)
          : null,
      areaSqm:
        p.area_sqm !== null && p.area_sqm !== undefined ? Number(p.area_sqm) : null,
      floorNo:
        p.floor_no !== null && p.floor_no !== undefined ? Number(p.floor_no) : null,
      buildingAgeYears,
      latestRun,
      resolved,
    };
  });

  return {
    requirements: requirements || null,
    properties: formattedProperties,
  };
}

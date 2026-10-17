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

  const formattedProperties: PreflightPropertyInput[] = (properties || []).map((p, idx) => {
    // Resolve facts first so we can use extracted district if column is empty
    const resolved = resolveFacts((p.property_facts as PropertyFact[]) || []);
    const resolvedDistrict =
      resolved.fields.district.status === "known" &&
      typeof resolved.fields.district.value === "string"
        ? resolved.fields.district.value.trim()
        : "";

    // Generate human-friendly, unambiguous label per property
    let label = p.title || p.district || (resolvedDistrict ? `حي ${resolvedDistrict}` : "");
    if (!label) {
      if (p.input_mode === "url" && p.source_url) {
        try {
          const host = new URL(p.source_url).hostname.replace(/^www\./, "");
          label = `عقار #${idx + 1} (${host})`;
        } catch {
          label = `عقار #${idx + 1} (رابط إلكتروني)`;
        }
      } else if (p.input_mode === "image") {
        label = `عقار #${idx + 1} (صور العقار: ${p.image_paths?.length || 0})`;
      } else {
        label = `عقار #${idx + 1}`;
      }
    }

    // Sort extraction runs descending by started_at
    const runs = [...(p.extraction_runs || [])].sort(
      (a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
    );
    const latestRun = runs[0]
      ? { status: runs[0].status, error_code: runs[0].error_code }
      : null;

    return {
      id: p.id,
      label,
      latestRun,
      resolved,
    };
  });

  return {
    requirements: requirements || null,
    properties: formattedProperties,
  };
}

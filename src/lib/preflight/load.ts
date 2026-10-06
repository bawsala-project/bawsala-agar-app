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
        label = p.notes || `صور العقار (${p.image_paths?.length || 0})`;
      } else {
        label = p.notes || "عقار بدون عنوان";
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

import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type DashboardCaseStatus = "draft" | "ready" | "analyzed" | "inspected";

export interface DashboardCase {
  id: string;
  city: string;
  createdAt: string;
  propertiesCount: number;
  status: DashboardCaseStatus;
  href: string;
}

export const DASHBOARD_STATUS_LABELS: Record<DashboardCaseStatus, string> = {
  draft: "مسودة",
  ready: "جاهز للتحليل",
  analyzed: "تم التحليل",
  inspected: "معاينة مكتملة",
};

export function deriveCaseStatus(input: {
  caseStatus: string;
  analyzed: boolean;
  inspectionComplete: boolean;
}): DashboardCaseStatus {
  if (input.analyzed && input.inspectionComplete) return "inspected";
  if (input.analyzed) return "analyzed";
  if (input.caseStatus === "properties_complete") return "ready";
  return "draft";
}

/** Results for analyzed cases, otherwise the latest step the buyer still has to complete. */
export function caseOpenPath(caseId: string, status: DashboardCaseStatus, caseStatus: string): string {
  if (status === "analyzed" || status === "inspected") return `/case/${caseId}/results`;
  if (status === "ready") return `/case/${caseId}/preflight`;
  return caseStatus === "needs_complete" ? `/case/${caseId}/properties` : `/case/${caseId}/needs`;
}

/** Lists the caller's own active cases; ownership is enforced by RLS. */
export async function loadDashboardCases(
  client?: SupabaseClient<Database>
): Promise<DashboardCase[]> {
  const supabase = client ?? createClient();

  const { data: cases } = await supabase
    .from("decision_cases")
    .select("id, city, status, created_at, properties(id)")
    .order("created_at", { ascending: false });

  if (!cases || cases.length === 0) return [];

  const caseIds = cases.map((c) => c.id);
  const propertyIds = cases.flatMap((c) => c.properties.map((p) => p.id));

  const [{ data: runs }, { data: items }, { data: findings }] = await Promise.all([
    supabase
      .from("analysis_runs")
      .select("case_id")
      .in("case_id", caseIds)
      .eq("status", "committed"),
    propertyIds.length
      ? supabase.from("inspection_items").select("id, property_id").in("property_id", propertyIds)
      : Promise.resolve({ data: [] as { id: string; property_id: string }[] }),
    propertyIds.length
      ? supabase.from("inspection_findings").select("inspection_item_id").in("property_id", propertyIds)
      : Promise.resolve({ data: [] as { inspection_item_id: string }[] }),
  ]);

  const analyzedCaseIds = new Set((runs ?? []).map((r) => r.case_id));
  const findingItemIds = new Set((findings ?? []).map((f) => f.inspection_item_id));
  const itemsByProperty = new Map<string, string[]>();
  for (const item of items ?? []) {
    itemsByProperty.set(item.property_id, [...(itemsByProperty.get(item.property_id) ?? []), item.id]);
  }

  return cases.map((c) => {
    const caseItemIds = c.properties.flatMap((p) => itemsByProperty.get(p.id) ?? []);
    const inspectionComplete =
      caseItemIds.length > 0 && caseItemIds.every((id) => findingItemIds.has(id));
    const status = deriveCaseStatus({
      caseStatus: c.status,
      analyzed: analyzedCaseIds.has(c.id),
      inspectionComplete,
    });

    return {
      id: c.id,
      city: c.city,
      createdAt: c.created_at,
      propertiesCount: c.properties.length,
      status,
      href: caseOpenPath(c.id, status, c.status),
    };
  });
}

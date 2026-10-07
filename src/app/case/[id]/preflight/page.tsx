import { requireCase } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { loadPreflightData } from "@/lib/preflight/load";
import { evaluatePreflight } from "@/lib/preflight/evaluate";
import { PreflightView } from "./preflight-view";

export const maxDuration = 120;

interface PreflightPageProps {
  params: { id: string };
}

export default async function PreflightPage({ params }: PreflightPageProps) {
  // 1. Ensure user has access to case
  await requireCase(params.id);

  // 2. Load preflight inputs through RLS client
  const preflightData = await loadPreflightData(params.id);

  // 3. Evaluate dynamically
  const evaluation = evaluatePreflight(preflightData);

  // 4. Paid state decides whether the primary action leads to checkout or results
  const { data: paidPayments } = await createClient()
    .from("payments")
    .select("id")
    .eq("case_id", params.id)
    .eq("status", "paid")
    .limit(1);
  const isPaid = !!paidPayments && paidPayments.length > 0;

  return <PreflightView caseId={params.id} evaluation={evaluation} isPaid={isPaid} />;
}

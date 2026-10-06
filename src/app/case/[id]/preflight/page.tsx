import { requireCase } from "@/lib/auth";
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

  return <PreflightView caseId={params.id} evaluation={evaluation} />;
}

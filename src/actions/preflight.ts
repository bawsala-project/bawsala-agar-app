"use server";

import { requireCase } from "@/lib/auth";
import { loadPreflightData } from "@/lib/preflight/load";
import { evaluatePreflight } from "@/lib/preflight/evaluate";
import type { Database } from "@/types/database";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface PreflightActionState {
  ready?: boolean;
  errors?: Record<string, string[]>;
  message?: string;
}

export async function checkAndStartAnalysis(
  caseId: string,
  prevStateOrPayload?: PreflightActionState | FormData,
  maybePayload?: FormData | SupabaseClient<Database>,
  clientOverride?: SupabaseClient<Database>
): Promise<PreflightActionState> {
  let client: SupabaseClient<Database> | undefined;

  if (maybePayload && typeof (maybePayload as unknown as Record<string, unknown>).from === "function") {
    client = maybePayload as unknown as SupabaseClient<Database>;
  } else if (clientOverride) {
    client = clientOverride;
  }

  // 1. RLS check: throws notFound if user does not own case
  await requireCase(caseId, client);

  // 2. Load data and evaluate
  const data = await loadPreflightData(caseId, client);
  const result = evaluatePreflight(data);

  // 3. Reject if not ready (e.g. forced post while blocked)
  if (!result.ready) {
    return {
      ready: false,
      errors: {
        form: [
          result.blockers[0]?.messageAr ||
            "لا يمكن بدء التحليل؛ توجد متطلبات أو تعارضات لم يتم حلها بعد",
        ],
      },
    };
  }

  // Phase 5 will wire this up to full AI analysis
  return {
    ready: true,
    message: "الحالة مكتملة وجاهزة للتحليل",
  };
}

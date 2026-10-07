import "server-only";

import { generateObject, LanguageModel } from "ai";
import { analysisModel } from "./client";
import { buildAIAnalysisPayload } from "@/lib/security/allowlists";
import { sanitizeModelOutput } from "@/lib/security/authority-firewall";
import {
  buildAnalysisPrompt,
  propertyAssessmentSchema,
  ModelPropertyAssessment,
  PropertyAnalysisPromptInput,
} from "./prompts/analysis";

const TIMEOUT_MS = 60_000; // 60s timeout

export async function analyzeProperty(
  input: PropertyAnalysisPromptInput,
  modelOverride?: LanguageModel
): Promise<ModelPropertyAssessment> {
  // Outbound allowlist: only clean requirements, facts, label, city, and claims reach the prompt
  const payload = buildAIAnalysisPayload(input.requirements, input.knownFacts, {
    propertyLabel: input.propertyLabel,
    city: input.city,
    listingClaims: input.listingClaims,
  });
  const { system, prompt } = buildAnalysisPrompt({
    ...input,
    propertyLabel: payload.propertyLabel ?? input.propertyLabel,
    city: payload.city ?? input.city,
    listingClaims: payload.listingClaims ?? input.listingClaims,
    requirements: payload.requirements,
    knownFacts: payload.facts,
  });

  let rawText: string | undefined;

  const result = await generateObject({
    model: modelOverride ?? analysisModel,
    schema: propertyAssessmentSchema,
    system,
    prompt,
    onStepEnd: (event) => {
      rawText = event.objectText;
    },
    abortSignal: AbortSignal.timeout(TIMEOUT_MS),
  });

  return sanitizeModelOutput(result.object, rawText);
}

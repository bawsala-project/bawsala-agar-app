import "server-only";

import { generateObject, LanguageModel } from "ai";
import { analysisModel } from "./client";
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
  const { system, prompt } = buildAnalysisPrompt(input);

  const result = await generateObject({
    model: modelOverride ?? analysisModel,
    schema: propertyAssessmentSchema,
    system,
    prompt,
    abortSignal: AbortSignal.timeout(TIMEOUT_MS),
  });

  return result.object;
}

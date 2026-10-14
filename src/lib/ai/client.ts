import "server-only";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

const apiKey = process.env.AI_GATEWAY_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || "placeholder-build-key";
const extractionModelName = process.env.AI_EXTRACTION_MODEL || "gemini-flash-lite-latest";
const analysisModelName = process.env.AI_ANALYSIS_MODEL || "gemini-flash-lite-latest";

export const google = createGoogleGenerativeAI({
  apiKey,
});

export const extractionModel = google(extractionModelName);
export const analysisModel = google(analysisModelName);

export type { LanguageModel } from "ai";

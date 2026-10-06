import "server-only";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
const extractionModelName = process.env.AI_EXTRACTION_MODEL;
const analysisModelName = process.env.AI_ANALYSIS_MODEL;

if (!apiKey) {
  throw new Error("Missing required environment variable: GOOGLE_GENERATIVE_AI_API_KEY");
}
if (!extractionModelName) {
  throw new Error("Missing required environment variable: AI_EXTRACTION_MODEL");
}
if (!analysisModelName) {
  throw new Error("Missing required environment variable: AI_ANALYSIS_MODEL");
}

export const google = createGoogleGenerativeAI({
  apiKey,
});

export const extractionModel = google(extractionModelName);
export const analysisModel = google(analysisModelName);

export type { LanguageModel } from "ai";

import "server-only";
import { generateObject, LanguageModel } from "ai";
import { extractionModel } from "./client";
import {
  buildExtractionPrompt,
  buildImageExtractionPrompt,
  extractionOutputSchema,
  ExtractionOutput,
} from "./prompts/extraction";

const TIMEOUT_MS = 60_000; // 60s

export interface ImageAttachment {
  data: Buffer | Uint8Array;
  mimeType: string;
}

export async function extractFactsFromText(
  text: string,
  modelOverride?: LanguageModel
): Promise<ExtractionOutput> {
  const { system, prompt } = buildExtractionPrompt(text);

  const result = await generateObject({
    model: modelOverride ?? extractionModel,
    schema: extractionOutputSchema,
    system,
    prompt,
    abortSignal: AbortSignal.timeout(TIMEOUT_MS),
  });

  return result.object;
}

export async function extractFactsFromImages(
  images: ImageAttachment[],
  modelOverride?: LanguageModel
): Promise<ExtractionOutput> {
  const { system, prompt: promptText } = buildImageExtractionPrompt();

  const userContent: Array<
    | { type: "text"; text: string }
    | { type: "file"; data: Buffer | Uint8Array; mediaType: string }
  > = [
    { type: "text", text: promptText },
    ...images.map((img) => ({
      type: "file" as const,
      data: img.data,
      mediaType: img.mimeType,
    })),
  ];

  const result = await generateObject({
    model: modelOverride ?? extractionModel,
    schema: extractionOutputSchema,
    system,
    messages: [
      {
        role: "user",
        content: userContent,
      },
    ],
    abortSignal: AbortSignal.timeout(TIMEOUT_MS),
  });

  return result.object;
}

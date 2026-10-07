import "server-only";
import { generateObject, LanguageModel } from "ai";
import { extractionModel } from "./client";
import { buildAIExtractionPayload } from "@/lib/security/allowlists";
import { sanitizeExtractionOutput } from "@/lib/security/authority-firewall";
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
  // Outbound allowlist: only the listing text reaches the model prompt.
  const payload = buildAIExtractionPayload(text);
  const { system, prompt } = buildExtractionPrompt(payload.text);

  let rawText: string | undefined;

  const result = await generateObject({
    model: modelOverride ?? extractionModel,
    schema: extractionOutputSchema,
    system,
    prompt,
    onStepEnd: (event) => {
      rawText = event.objectText;
    },
    abortSignal: AbortSignal.timeout(TIMEOUT_MS),
  });

  return sanitizeExtractionOutput(result.object, rawText);
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

  let rawText: string | undefined;

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
    onStepEnd: (event) => {
      rawText = event.objectText;
    },
    abortSignal: AbortSignal.timeout(TIMEOUT_MS),
  });

  return sanitizeExtractionOutput(result.object, rawText);
}

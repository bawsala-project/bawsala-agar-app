import "server-only";
import { adminSupabase } from "@/lib/supabase/admin";
import { fetchListing, type FetchListingResult } from "./fetch-listing";
import { extractFactsFromText, extractFactsFromImages, ImageAttachment } from "@/lib/ai/extract";
import { PROMPT_VERSION, ExtractionFact } from "@/lib/ai/prompts/extraction";
import { normalizeDigits, normalizeField } from "@/lib/evidence/normalize";
import { FIELD_REGISTRY, FieldKey } from "@/lib/evidence/fields";
import { createManualFacts } from "@/lib/evidence/manual";
import type { LanguageModel } from "@/lib/ai/client";
import type { Json } from "@/types/database";

export type RunExtractionResult =
  | { ok: true; factsCount: number }
  | { ok: false; errorCode: string };

const MAX_RUNS_PER_PROPERTY = 5;
const STALE_RUN_TIMEOUT_MS = 3 * 60 * 1000; // 3 minutes

export async function runExtraction(
  propertyId: string,
  options?: {
    modelOverride?: LanguageModel;
    initialSourceText?: string;
  }
): Promise<RunExtractionResult> {
  // 1. Check attempt limit: at most 5 extraction runs per property
  const { count, error: countErr } = await adminSupabase
    .from("extraction_runs")
    .select("*", { count: "exact", head: true })
    .eq("property_id", propertyId);

  if (countErr) {
    return { ok: false, errorCode: "db_error" };
  }

  if ((count ?? 0) >= MAX_RUNS_PER_PROPERTY) {
    return { ok: false, errorCode: "attempt_limit" };
  }

  // 2. Check if one is already running
  const { data: runningRuns } = await adminSupabase
    .from("extraction_runs")
    .select("id, started_at")
    .eq("property_id", propertyId)
    .eq("status", "running");

  if (runningRuns && runningRuns.length > 0) {
    const runningRun = runningRuns[0];
    const startedAt = new Date(runningRun.started_at).getTime();
    const ageMs = Date.now() - startedAt;

    if (ageMs < STALE_RUN_TIMEOUT_MS) {
      // Still running and fresh (< 3 mins), return without doing anything
      return { ok: false, errorCode: "already_running" };
    } else {
      // Stale run: mark failed
      await adminSupabase
        .from("extraction_runs")
        .update({
          status: "failed",
          error_code: "stale",
          finished_at: new Date().toISOString(),
        })
        .eq("id", runningRun.id);
    }
  }

  // 3. Insert an extraction_runs row with status 'running'
  const modelName = process.env.AI_EXTRACTION_MODEL || "gemini-flash-lite-latest";
  const { data: run, error: insertRunErr } = await adminSupabase
    .from("extraction_runs")
    .insert({
      property_id: propertyId,
      status: "running",
      model: modelName,
      prompt_version: PROMPT_VERSION,
    })
    .select()
    .single();

  if (insertRunErr || !run) {
    return { ok: false, errorCode: "insert_run_failed" };
  }

  const runId = run.id;

  // Helper to mark run failed on error
  async function markRunFailed(code: string): Promise<RunExtractionResult> {
    await adminSupabase
      .from("extraction_runs")
      .update({
        status: "failed",
        error_code: code.slice(0, 50),
        finished_at: new Date().toISOString(),
      })
      .eq("id", runId);
    return { ok: false, errorCode: code };
  }

  try {
    // 4. Retrieve property details
    const { data: property, error: propErr } = await adminSupabase
      .from("properties")
      .select("*")
      .eq("id", propertyId)
      .single();

    if (propErr || !property) {
      return await markRunFailed("property_not_found");
    }

    // Branch based on input_mode
    if (property.input_mode === "manual") {
      // Manual mode: no model call; use manual.ts
      const manualFacts = createManualFacts(property);

      const { error: rpcErr } = await adminSupabase.rpc("replace_extracted_facts", {
        p_run_id: runId,
        p_facts: manualFacts as unknown as Json,
      });

      if (rpcErr) {
        return await markRunFailed("db_save_failed");
      }

      return { ok: true, factsCount: manualFacts.length };
    }

    let rawFacts: ExtractionFact[] = [];
    let sourceSnapshot: string | null = null;

    if (property.input_mode === "url") {
      if (!property.source_url) {
        return await markRunFailed("missing_url");
      }

      let fetchResult: FetchListingResult;
      const initialText = options?.initialSourceText?.trim();

      if (initialText) {
        fetchResult = { ok: true, text: initialText };
      } else {
        fetchResult = await fetchListing(property.source_url);
      }

      if (!fetchResult.ok) {
        return await markRunFailed(fetchResult.code);
      }

      sourceSnapshot = fetchResult.text.slice(0, 50_000);
      await adminSupabase
        .from("extraction_runs")
        .update({ source_snapshot: sourceSnapshot })
        .eq("id", runId);

      const aiOutput = await extractFactsFromText(fetchResult.text, options?.modelOverride);
      rawFacts = aiOutput.facts;

      // Filter and normalize facts
      const preparedFacts: Array<{
        field: string;
        value: string | number | boolean;
        raw_text: string;
        scope: string;
        source: string;
        evidence_text: string | null;
        evidence_verified: boolean;
      }> = [];

      const normSource = normalizeDigits(fetchResult.text).replace(/\s+/g, " ").trim();

      for (const f of rawFacts) {
        const normalized = normalizeField(f.field as FieldKey, f.raw);
        if (normalized === null) continue;

        // Evidence verification for URL
        const normEvidence = normalizeDigits(f.evidence).replace(/\s+/g, " ").trim();
        const verified = normEvidence.length > 0 && normSource.includes(normEvidence);

        // For URL mode: drop the fact if evidence does not appear
        if (!verified) continue;

        const fieldDef = FIELD_REGISTRY[f.field as FieldKey];
        const defaultScope = ("scope" in fieldDef ? fieldDef.scope : undefined) ?? "unit";
        const scope = f.scope ?? defaultScope;

        preparedFacts.push({
          field: f.field,
          value: normalized,
          raw_text: f.raw,
          scope,
          source: "url",
          evidence_text: f.evidence.slice(0, 300),
          evidence_verified: true,
        });
      }

      const { error: rpcErr } = await adminSupabase.rpc("replace_extracted_facts", {
        p_run_id: runId,
        p_facts: preparedFacts as unknown as Json,
      });

      if (rpcErr) {
        return await markRunFailed("db_save_failed");
      }

      return { ok: true, factsCount: preparedFacts.length };
    }

    if (property.input_mode === "image") {
      const paths = property.image_paths || [];
      if (paths.length === 0) {
        return await markRunFailed("no_images");
      }

      const imageAttachments: ImageAttachment[] = [];
      for (const p of paths) {
        const { data, error } = await adminSupabase.storage
          .from("property-images")
          .download(p);

        if (error || !data) {
          continue;
        }

        const arrayBuffer = await data.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const mimeType =
          data.type ||
          (p.endsWith(".png")
            ? "image/png"
            : p.endsWith(".webp")
            ? "image/webp"
            : "image/jpeg");

        imageAttachments.push({ data: buffer, mimeType });
      }

      if (imageAttachments.length === 0) {
        return await markRunFailed("image_download_failed");
      }

      const aiOutput = await extractFactsFromImages(
        imageAttachments,
        options?.modelOverride
      );
      rawFacts = aiOutput.facts;

      const preparedFacts: Array<{
        field: string;
        value: string | number | boolean;
        raw_text: string;
        scope: string;
        source: string;
        evidence_text: string | null;
        evidence_verified: boolean;
      }> = [];

      for (const f of rawFacts) {
        const normalized = normalizeField(f.field as FieldKey, f.raw);
        if (normalized === null) continue;

        const fieldDef = FIELD_REGISTRY[f.field as FieldKey];
        const defaultScope = ("scope" in fieldDef ? fieldDef.scope : undefined) ?? "unit";
        const scope = f.scope ?? defaultScope;

        preparedFacts.push({
          field: f.field,
          value: normalized,
          raw_text: f.raw,
          scope,
          source: "image",
          evidence_text: f.evidence.slice(0, 300),
          evidence_verified: false, // Image facts keep evidence_verified = false
        });
      }

      const { error: rpcErr } = await adminSupabase.rpc("replace_extracted_facts", {
        p_run_id: runId,
        p_facts: preparedFacts as unknown as Json,
      });

      if (rpcErr) {
        return await markRunFailed("db_save_failed");
      }

      return { ok: true, factsCount: preparedFacts.length };
    }

    return await markRunFailed("unknown_input_mode");
  } catch (err: unknown) {
    let code = "extraction_error";
    if (err instanceof Error) {
      code = err.name === "TimeoutError" ? "timeout" : err.message;
    }
    return await markRunFailed(code);
  }
}

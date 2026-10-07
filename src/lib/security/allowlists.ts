import { z } from "zod";
import { FIELD_REGISTRY } from "@/lib/evidence/fields";
import { HARD_CONSTRAINT_KEYS, PREFERENCE_WEIGHTS } from "@/lib/schemas/requirements";
import { ALLOWED_CITIES } from "@/lib/constants/cities";

/**
 * Outbound allowlists: every payload that leaves the server for an external
 * service (AI models, payment gateways) is rebuilt from these schemas.
 * Zod objects strip unknown keys, so anything not listed here (user ids,
 * emails, raw database rows, tokens, timestamps) cannot be forwarded.
 * Inputs are typed `unknown` on purpose: callers hand over wide objects such
 * as database rows, and the schema decides what survives.
 */

// --- AI extraction ---------------------------------------------------------

const extractionPayloadSchema = z.object({
  text: z.string(),
});

export type AIExtractionPayload = z.infer<typeof extractionPayloadSchema>;

export function buildAIExtractionPayload(rawText: string): AIExtractionPayload {
  return extractionPayloadSchema.parse({ text: rawText });
}

// --- AI analysis -----------------------------------------------------------

const cleanRequirementsSchema = z.object({
  max_budget_sar: z.number().positive(),
  min_bedrooms: z.number().int().min(0).max(20),
  min_area_sqm: z.number().positive().nullish(),
  hard_constraints: z
    .array(
      z.object({
        key: z.enum(HARD_CONSTRAINT_KEYS),
        label: z.string().max(120),
        value: z.union([z.string().max(120), z.number()]).optional(),
      })
    )
    .max(10),
  preferences: z
    .array(
      z.object({
        label: z.string().max(80),
        weight: z.enum(PREFERENCE_WEIGHTS),
      })
    )
    .max(10),
});

// Resolved facts only: listing_claim is free marketing text and travels separately as an unverified claim.
const PERMITTED_FACT_FIELDS = Object.keys(FIELD_REGISTRY).filter((key) => key !== "listing_claim");

const cleanFactSchema = z.object({
  field: z.string().refine((field) => PERMITTED_FACT_FIELDS.includes(field), {
    message: "Fact field is not allowlisted",
  }),
  label: z.string().max(100),
  value: z.union([z.string().max(300), z.number(), z.boolean()]),
  certainty: z.enum(["reported", "user_stated"]),
});

const cleanPropertyLabelSchema = z
  .string()
  .transform((s) => s.slice(0, 60).trim())
  .pipe(z.string().max(60));

const cleanListingClaimSchema = z.object({
  scope: z.string().max(40),
  claim: z
    .string()
    .transform((s) => s.slice(0, 120).trim())
    .pipe(z.string().max(120)),
});

const cleanListingClaimsSchema = z
  .array(cleanListingClaimSchema)
  .transform((arr) => arr.slice(0, 10))
  .pipe(z.array(cleanListingClaimSchema).max(10));

const aiAnalysisPayloadSchema = z.object({
  requirements: cleanRequirementsSchema,
  facts: z.array(cleanFactSchema).max(50),
  propertyLabel: cleanPropertyLabelSchema.optional(),
  city: z.enum(ALLOWED_CITIES).nullish(),
  listingClaims: cleanListingClaimsSchema.optional(),
});

export type CleanRequirements = z.infer<typeof cleanRequirementsSchema>;
export type CleanFact = z.infer<typeof cleanFactSchema>;
export type CleanListingClaim = z.infer<typeof cleanListingClaimSchema>;
export type AIAnalysisPayload = z.infer<typeof aiAnalysisPayloadSchema>;

export interface AIAnalysisExtraInput {
  propertyLabel?: unknown;
  city?: unknown;
  listingClaims?: unknown;
}

export function buildAIAnalysisPayload(
  requirementsOrInput: unknown,
  facts?: unknown,
  extra?: AIAnalysisExtraInput
): AIAnalysisPayload {
  let target: Record<string, unknown>;

  if (facts !== undefined) {
    target = {
      requirements: requirementsOrInput,
      facts,
    };
    if (extra?.propertyLabel !== undefined) {
      target.propertyLabel = extra.propertyLabel;
    }
    if (extra?.city !== undefined) {
      target.city = extra.city;
    }
    if (extra?.listingClaims !== undefined) {
      target.listingClaims = extra.listingClaims;
    }
  } else if (typeof requirementsOrInput === "object" && requirementsOrInput !== null) {
    target = requirementsOrInput as Record<string, unknown>;
  } else {
    throw new Error("Invalid input to buildAIAnalysisPayload");
  }

  return aiAnalysisPayloadSchema.parse(target);
}

// --- Payment gateway -------------------------------------------------------

const CHECKOUT_AMOUNT_SAR = 10.0;

const paymentPayloadSchema = z.object({
  case_id: z.string().min(1).max(64),
  amount: z.literal(CHECKOUT_AMOUNT_SAR),
  currency: z.literal("SAR"),
  return_url: z.string().refine(
    (value) => (value.startsWith("/") && !value.startsWith("//")) || /^https?:\/\//.test(value),
    { message: "return_url must be a relative path or an http(s) URL" }
  ),
});

export type PaymentPayload = z.infer<typeof paymentPayloadSchema>;

export function buildPaymentPayload(
  caseId: string,
  amount: number,
  returnUrl: string
): PaymentPayload {
  return paymentPayloadSchema.parse({
    case_id: caseId,
    amount,
    currency: "SAR",
    return_url: returnUrl,
  });
}

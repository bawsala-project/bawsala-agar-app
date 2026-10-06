import type { Database } from "@/types/database";
import type { ResolvableFieldKey } from "./fields";

export type PropertyFact = Database["public"]["Tables"]["property_facts"]["Row"];
export type FactSource = "url" | "image" | "manual" | "user_correction";

export interface ConflictingCandidate {
  value: unknown;
  factIds: string[];
  sources: FactSource[];
}

export type ResolvedField =
  | { status: "unknown" }
  | {
      status: "known";
      value: unknown;
      certainty: "reported" | "user_stated";
      factIds: string[];
    }
  | {
      status: "conflicting";
      candidates: ConflictingCandidate[];
    };

export interface GroupedClaims {
  unit: PropertyFact[];
  building: PropertyFact[];
  neighborhood: PropertyFact[];
}

export type ResolvedFieldsMap = Record<ResolvableFieldKey, ResolvedField>;

export interface ResolveFactsResult extends ResolvedFieldsMap {
  fields: ResolvedFieldsMap;
  claims: GroupedClaims;
}

const RESOLVABLE_KEYS: ResolvableFieldKey[] = [
  "listing_price_sar",
  "area_sqm",
  "bedrooms",
  "bathrooms",
  "floor_no",
  "building_floors",
  "property_age_years",
  "elevator",
  "private_parking",
  "district",
];

function resolveSingleField(
  field: ResolvableFieldKey,
  facts: PropertyFact[]
): ResolvedField {
  const fieldFacts = facts.filter((f) => f.field === field);

  if (fieldFacts.length === 0) {
    return { status: "unknown" };
  }

  // Rule 1: If any user_correction exists for the field, the most recent one wins -> known / user_stated
  const userCorrections = fieldFacts.filter((f) => f.source === "user_correction");
  if (userCorrections.length > 0) {
    userCorrections.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    const winner = userCorrections[0];
    return {
      status: "known",
      value: winner.value,
      certainty: "user_stated",
      factIds: [winner.id],
    };
  }

  // Rule 2: Collect distinct normalized values from url/image/manual facts
  const observationFacts = fieldFacts.filter(
    (f) => f.source === "url" || f.source === "image" || f.source === "manual"
  );

  const valueMap = new Map<string, ConflictingCandidate>();

  for (const fact of observationFacts) {
    const key = JSON.stringify(fact.value);
    if (!valueMap.has(key)) {
      valueMap.set(key, {
        value: fact.value,
        factIds: [fact.id],
        sources: [fact.source as FactSource],
      });
    } else {
      const entry = valueMap.get(key)!;
      entry.factIds.push(fact.id);
      if (!entry.sources.includes(fact.source as FactSource)) {
        entry.sources.push(fact.source as FactSource);
      }
    }
  }

  if (valueMap.size === 0) {
    return { status: "unknown" };
  }

  if (valueMap.size === 1) {
    const single = Array.from(valueMap.values())[0];
    const hasManual = single.sources.includes("manual");

    // Rule 3: Repeated identical values never raise certainty (no corroboration scoring)
    return {
      status: "known",
      value: single.value,
      certainty: hasManual ? "user_stated" : "reported",
      factIds: single.factIds,
    };
  }

  // 2+ distinct values -> conflicting
  return {
    status: "conflicting",
    candidates: Array.from(valueMap.values()),
  };
}

export function resolveFacts(facts: PropertyFact[]): ResolveFactsResult {
  const fields = {} as ResolvedFieldsMap;

  for (const key of RESOLVABLE_KEYS) {
    fields[key] = resolveSingleField(key, facts);
  }

  const claimFacts = facts.filter((f) => f.field === "listing_claim");
  const claims: GroupedClaims = {
    unit: claimFacts.filter((f) => f.scope === "unit"),
    building: claimFacts.filter((f) => f.scope === "building"),
    neighborhood: claimFacts.filter((f) => f.scope === "neighborhood"),
  };

  const result: ResolveFactsResult = {
    ...fields,
    fields,
    claims,
  };

  return result;
}

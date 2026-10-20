import type { PriorityId } from "@/lib/schemas/buyer-profile";

export type FitDimensionKey =
  | "suitability"
  | "priceAffordability"
  | "locationDailyLife"
  | "propertyQuality"
  | "risks";

export interface DimensionWeights {
  suitability: number;
  priceAffordability: number;
  locationDailyLife: number;
  propertyQuality: number;
  risks: number;
}

/**
 * Baseline floor weight for each dimension (total floor = 0.50).
 * Guarantees every critical aspect maintains visibility and buyer protection (especially risks).
 */
const BASELINE_FLOOR_WEIGHTS: Record<FitDimensionKey, number> = {
  suitability: 0.10,
  priceAffordability: 0.10,
  locationDailyLife: 0.10,
  propertyQuality: 0.10,
  risks: 0.10,
};

/**
 * Mapping of each BuyerProfile priority to the core dimensions it contributes to.
 */
const PRIORITY_DIMENSION_MAP: Record<
  PriorityId,
  Partial<Record<FitDimensionKey, number>>
> = {
  space: { suitability: 1.0 },
  price: { priceAffordability: 1.0 },
  resale_value: { priceAffordability: 0.5, risks: 0.5 },
  location: { locationDailyLife: 1.0 },
  services_nearby: { locationDailyLife: 1.0 },
  quiet_privacy: { locationDailyLife: 0.6, propertyQuality: 0.4 },
  quality: { propertyQuality: 0.8, risks: 0.2 },
};

/**
 * Base importance points by rank position (1st to 5th).
 */
const RANK_POINTS = [40, 26, 18, 11, 5];

/**
 * Computes normalized dimension weights (summing to 1.0) based on the buyer's ranked priorities.
 *
 * @param rankedPriorities - List of priority IDs in descending order of importance (rank 1 first).
 * @returns DimensionWeights where all 5 weights sum to 1.0.
 */
export function computeDimensionWeights(
  rankedPriorities?: string[] | null
): DimensionWeights {
  const priorities =
    Array.isArray(rankedPriorities) && rankedPriorities.length > 0
      ? (rankedPriorities as PriorityId[])
      : (["price", "location", "quality", "space", "quiet_privacy"] as PriorityId[]);

  // Start with baseline floor weights
  const weights: Record<FitDimensionKey, number> = {
    ...BASELINE_FLOOR_WEIGHTS,
  };

  const dynamicPoints: Record<FitDimensionKey, number> = {
    suitability: 0,
    priceAffordability: 0,
    locationDailyLife: 0,
    propertyQuality: 0,
    risks: 0,
  };

  // Distribute points based on rank
  priorities.slice(0, 5).forEach((pId, idx) => {
    const points = RANK_POINTS[idx] ?? 5;
    const mapping = PRIORITY_DIMENSION_MAP[pId];
    if (mapping) {
      for (const [dim, ratio] of Object.entries(mapping) as [FitDimensionKey, number][]) {
        dynamicPoints[dim] += points * ratio;
      }
    } else {
      // Default fallback if custom tag
      dynamicPoints.suitability += points * 0.25;
      dynamicPoints.priceAffordability += points * 0.25;
      dynamicPoints.locationDailyLife += points * 0.25;
      dynamicPoints.propertyQuality += points * 0.25;
    }
  });

  const totalDynamicPoints =
    dynamicPoints.suitability +
    dynamicPoints.priceAffordability +
    dynamicPoints.locationDailyLife +
    dynamicPoints.propertyQuality +
    dynamicPoints.risks;

  const POOL_FOR_DYNAMIC = 0.50; // 50% distributed according to user priorities

  if (totalDynamicPoints > 0) {
    weights.suitability += (dynamicPoints.suitability / totalDynamicPoints) * POOL_FOR_DYNAMIC;
    weights.priceAffordability +=
      (dynamicPoints.priceAffordability / totalDynamicPoints) * POOL_FOR_DYNAMIC;
    weights.locationDailyLife +=
      (dynamicPoints.locationDailyLife / totalDynamicPoints) * POOL_FOR_DYNAMIC;
    weights.propertyQuality +=
      (dynamicPoints.propertyQuality / totalDynamicPoints) * POOL_FOR_DYNAMIC;
    weights.risks += (dynamicPoints.risks / totalDynamicPoints) * POOL_FOR_DYNAMIC;
  } else {
    // Equal distribution if no points
    weights.suitability += 0.10;
    weights.priceAffordability += 0.10;
    weights.locationDailyLife += 0.10;
    weights.propertyQuality += 0.10;
    weights.risks += 0.10;
  }

  // Normalize to guarantee strict sum of 1.0 (with 3 decimal precision)
  const sum =
    weights.suitability +
    weights.priceAffordability +
    weights.locationDailyLife +
    weights.propertyQuality +
    weights.risks;

  return {
    suitability: Number((weights.suitability / sum).toFixed(3)),
    priceAffordability: Number((weights.priceAffordability / sum).toFixed(3)),
    locationDailyLife: Number((weights.locationDailyLife / sum).toFixed(3)),
    propertyQuality: Number((weights.propertyQuality / sum).toFixed(3)),
    risks: Number((weights.risks / sum).toFixed(3)),
  };
}

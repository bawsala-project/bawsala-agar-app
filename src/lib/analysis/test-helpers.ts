import { ResolveFactsResult, ResolvedFieldsMap } from "@/lib/evidence/resolve";
import { ResolvableFieldKey } from "@/lib/evidence/fields";

export function makeEmptyResolved(): ResolveFactsResult {
  const allKeys: ResolvableFieldKey[] = [
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

  const fields = {} as ResolvedFieldsMap;
  for (const k of allKeys) {
    fields[k] = { status: "unknown" };
  }

  return {
    ...fields,
    fields,
    claims: { unit: [], building: [], neighborhood: [] },
  };
}

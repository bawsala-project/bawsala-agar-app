import type { Database } from "@/types/database";

export type PropertyFactInsert = Database["public"]["Tables"]["property_facts"]["Insert"];
export type PropertyRow = Database["public"]["Tables"]["properties"]["Row"];

export interface ManualPropertyInput {
  id: string;
  title?: string | null;
  district?: string | null;
  listing_price_sar?: number | null;
  area_sqm?: number | null;
  bedrooms?: number | null;
  floor_no?: number | null;
}

export function createManualFacts(property: ManualPropertyInput): PropertyFactInsert[] {
  const facts: PropertyFactInsert[] = [];
  const propertyId = property.id;

  if (
    property.listing_price_sar !== null &&
    property.listing_price_sar !== undefined
  ) {
    facts.push({
      property_id: propertyId,
      field: "listing_price_sar",
      value: Number(property.listing_price_sar),
      raw_text: String(property.listing_price_sar),
      scope: "unit",
      source: "manual",
      evidence_text: null,
      evidence_verified: false,
    });
  }

  if (property.area_sqm !== null && property.area_sqm !== undefined) {
    facts.push({
      property_id: propertyId,
      field: "area_sqm",
      value: Number(property.area_sqm),
      raw_text: String(property.area_sqm),
      scope: "unit",
      source: "manual",
      evidence_text: null,
      evidence_verified: false,
    });
  }

  if (property.bedrooms !== null && property.bedrooms !== undefined) {
    facts.push({
      property_id: propertyId,
      field: "bedrooms",
      value: Number(property.bedrooms),
      raw_text: String(property.bedrooms),
      scope: "unit",
      source: "manual",
      evidence_text: null,
      evidence_verified: false,
    });
  }

  if (property.floor_no !== null && property.floor_no !== undefined) {
    facts.push({
      property_id: propertyId,
      field: "floor_no",
      value: Number(property.floor_no),
      raw_text: String(property.floor_no),
      scope: "unit",
      source: "manual",
      evidence_text: null,
      evidence_verified: false,
    });
  }

  if (property.district && property.district.trim().length > 0) {
    facts.push({
      property_id: propertyId,
      field: "district",
      value: property.district.trim(),
      raw_text: property.district,
      scope: "neighborhood",
      source: "manual",
      evidence_text: null,
      evidence_verified: false,
    });
  }

  if (property.title && property.title.trim().length > 0) {
    facts.push({
      property_id: propertyId,
      field: "listing_claim",
      value: property.title.trim(),
      raw_text: property.title,
      scope: "unit",
      source: "manual",
      evidence_text: null,
      evidence_verified: false,
    });
  }

  return facts;
}

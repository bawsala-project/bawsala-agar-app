export type FactScope = "unit" | "building" | "neighborhood";
export type FieldValueType = "number" | "boolean" | "string";

export interface FieldDefinition {
  key: string;
  label: string;
  valueType: FieldValueType;
  scope?: FactScope;
  min?: number;
  max?: number;
  isCritical: boolean;
}

export const FIELD_REGISTRY = {
  listing_price_sar: {
    key: "listing_price_sar",
    label: "سعر العرض (ريال)",
    valueType: "number",
    scope: "unit",
    min: 50_000,
    max: 50_000_000,
    isCritical: true,
  },
  area_sqm: {
    key: "area_sqm",
    label: "المساحة (م²)",
    valueType: "number",
    scope: "unit",
    min: 20,
    max: 2_000,
    isCritical: true,
  },
  bedrooms: {
    key: "bedrooms",
    label: "غرف النوم",
    valueType: "number",
    scope: "unit",
    min: 0,
    max: 15,
    isCritical: true,
  },
  bathrooms: {
    key: "bathrooms",
    label: "دورات المياه",
    valueType: "number",
    scope: "unit",
    min: 0,
    max: 15,
    isCritical: false,
  },
  floor_no: {
    key: "floor_no",
    label: "رقم الدور",
    valueType: "number",
    scope: "unit",
    min: -2,
    max: 60,
    isCritical: false,
  },
  building_floors: {
    key: "building_floors",
    label: "عدد أدوار المبنى",
    valueType: "number",
    scope: "building",
    min: 1,
    max: 80,
    isCritical: false,
  },
  property_age_years: {
    key: "property_age_years",
    label: "عمر العقار (سنوات)",
    valueType: "number",
    scope: "building",
    min: 0,
    max: 100,
    isCritical: false,
  },
  elevator: {
    key: "elevator",
    label: "مصعد",
    valueType: "boolean",
    scope: "building",
    isCritical: false,
  },
  private_parking: {
    key: "private_parking",
    label: "موقف خاص",
    valueType: "boolean",
    scope: "building",
    isCritical: false,
  },
  district: {
    key: "district",
    label: "الحي",
    valueType: "string",
    scope: "neighborhood",
    isCritical: false,
  },
  listing_claim: {
    key: "listing_claim",
    label: "ادعاء تسويقي / وصف",
    valueType: "string",
    isCritical: false,
  },
} as const satisfies Record<string, FieldDefinition>;

export const FIELDS = FIELD_REGISTRY;
export type FieldKey = keyof typeof FIELD_REGISTRY;
export type RegistryFieldKey = FieldKey;
export type ResolvableFieldKey = Exclude<FieldKey, "listing_claim">;

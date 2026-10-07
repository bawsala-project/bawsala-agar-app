export const ALLOWED_CITIES = [
  "الرياض",
  "جدة",
  "الدمام",
  "الخبر",
  "مكة المكرمة",
  "المدينة المنورة",
] as const;

export type AllowedCity = (typeof ALLOWED_CITIES)[number];

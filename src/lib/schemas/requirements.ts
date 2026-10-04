import { z } from "zod";

export const PURCHASE_METHODS = ["cash", "finance", "undecided"] as const;
export type PurchaseMethod = (typeof PURCHASE_METHODS)[number];

export const HARD_CONSTRAINT_KEYS = [
  "elevator_required",
  "private_parking",
  "max_floor",
  "new_building_only",
  "custom",
] as const;
export type HardConstraintKey = (typeof HARD_CONSTRAINT_KEYS)[number];

export const PREFERENCE_WEIGHTS = ["high", "medium", "low"] as const;
export type PreferenceWeight = (typeof PREFERENCE_WEIGHTS)[number];

export const LOCATION_FREQUENCIES = ["daily", "weekly"] as const;
export type LocationFrequency = (typeof LOCATION_FREQUENCIES)[number];

export const hardConstraintItemSchema = z.discriminatedUnion("key", [
  z.object({
    key: z.literal("elevator_required"),
    label: z.string().min(1, "يرجى تحديد وصف الشرط"),
  }),
  z.object({
    key: z.literal("private_parking"),
    label: z.string().min(1, "يرجى تحديد وصف الشرط"),
  }),
  z.object({
    key: z.literal("new_building_only"),
    label: z.string().min(1, "يرجى تحديد وصف الشرط"),
  }),
  z.object({
    key: z.literal("max_floor"),
    label: z.string().min(1, "يرجى تحديد وصف الشرط"),
    value: z.coerce
      .number({ message: "يرجى إدخال رقم الدور كعدد صحيح" })
      .int("يجب أن يكون رقم الدور عدداً صحيحاً")
      .min(0, "رقم الدور يجب أن يكون 0 أو أكثر"),
  }),
  z.object({
    key: z.literal("custom"),
    label: z
      .string()
      .trim()
      .min(1, "يرجى كتابة نص الشرط المخصص")
      .max(120, "الحد الأقصى للشرط المخصص 120 حرفاً"),
    value: z
      .string()
      .trim()
      .max(120, "الحد الأقصى للشرط المخصص 120 حرفاً")
      .optional(),
  }),
]);

export type HardConstraint = z.infer<typeof hardConstraintItemSchema>;

export const preferenceItemSchema = z.object({
  label: z
    .string()
    .trim()
    .min(1, "يرجى كتابة وصف التفضيل")
    .max(80, "الحد الأقصى للتفضيل 80 حرفاً"),
  weight: z.enum(PREFERENCE_WEIGHTS, {
    message: "يرجى تحديد درجة الأهمية",
  }),
});

export type Preference = z.infer<typeof preferenceItemSchema>;

export const importantLocationItemSchema = z.object({
  label: z
    .string()
    .trim()
    .min(1, "يرجى إدخال اسم الموقع (مثل: مقر العمل)")
    .max(60, "الحد الأقصى لاسم الموقع 60 حرفاً"),
  address_text: z
    .string()
    .trim()
    .min(1, "يرجى إدخال العنوان أو اسم الحي")
    .max(200, "الحد الأقصى للعنوان 200 حرف"),
  frequency: z.enum(LOCATION_FREQUENCIES, {
    message: "يرجى تحديد وتيرة الزيارة",
  }),
});

export type ImportantLocation = z.infer<typeof importantLocationItemSchema>;

export const requirementsSchema = z.object({
  max_budget_sar: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : val),
    z.coerce
      .number({ message: "الميزانية يجب أن تكون رقماً" })
      .gt(0, "الميزانية يجب أن تكون أكبر من صفر")
  ),
  purchase_method: z.enum(PURCHASE_METHODS, {
    message: "يرجى اختيار طريقة الشراء",
  }),
  household_size: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : val),
    z.coerce
      .number({ message: "عدد أفراد الأسرة مطلوب" })
      .int("يجب أن يكون عدداً صحيحاً")
      .min(1, "عدد أفراد الأسرة يجب أن يكون بين 1 و 20")
      .max(20, "عدد أفراد الأسرة يجب أن يكون بين 1 و 20")
  ),
  min_bedrooms: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : val),
    z.coerce
      .number({ message: "عدد غرف النوم مطلوب" })
      .int("يجب أن يكون عدداً صحيحاً")
      .min(1, "عدد الغرف يجب أن يكون بين 1 و 10")
      .max(10, "عدد الغرف يجب أن يكون بين 1 و 10")
  ),
  min_area_sqm: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : val),
    z.coerce
      .number({ message: "المساحة يجب أن تكون رقماً" })
      .gt(0, "المساحة يجب أن تكون أكبر من صفر")
      .optional()
  ),
  hard_constraints: z
    .array(hardConstraintItemSchema)
    .max(10, "الحد الأقصى للشروط هو 10 شروط")
    .default([]),
  preferences: z
    .array(preferenceItemSchema)
    .max(10, "الحد الأقصى للتفضيلات هو 10 تفضيلات")
    .default([]),
  important_locations: z
    .array(importantLocationItemSchema)
    .max(5, "الحد الأقصى للمواقع المهمة هو 5 مواقع")
    .default([]),
});

export type RequirementsInput = z.infer<typeof requirementsSchema>;

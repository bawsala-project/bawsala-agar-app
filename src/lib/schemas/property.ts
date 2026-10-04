import { z } from "zod";

export const INPUT_MODES = ["url", "image", "manual"] as const;
export type InputMode = (typeof INPUT_MODES)[number];

export const urlPropertySchema = z.object({
  input_mode: z.literal("url"),
  source_url: z
    .string()
    .trim()
    .min(1, "يرجى إدخال رابط العقار")
    .max(2048, "الحد الأقصى لطول الرابط 2048 حرفاً")
    .refine(
      (url) => {
        try {
          const u = new URL(url);
          return u.protocol === "https:";
        } catch {
          return false;
        }
      },
      { message: "يجب أن يكون الرابط صالحاً ويبدأ بـ https://" }
    ),
  notes: z
    .string()
    .trim()
    .max(1000, "الحد الأقصى للملاحظات 1000 حرف")
    .optional()
    .nullable(),
});

export const imagePropertySchema = z.object({
  input_mode: z.literal("image"),
  image_paths: z
    .array(z.string().min(1, "مسار الصورة غير صالح"))
    .min(1, "يرجى رفع صورة واحدة على الأقل")
    .max(4, "الحد الأقصى 4 صور"),
  notes: z
    .string()
    .trim()
    .max(1000, "الحد الأقصى للملاحظات 1000 حرف")
    .optional()
    .nullable(),
});

export const manualPropertySchema = z
  .object({
    input_mode: z.literal("manual"),
    title: z
      .string()
      .trim()
      .max(120, "الحد الأقصى للعنوان 120 حرفاً")
      .optional()
      .nullable(),
    district: z
      .string()
      .trim()
      .max(100, "الحد الأقصى لاسم الحي 100 حرف")
      .optional()
      .nullable(),
    listing_price_sar: z.preprocess(
      (val) => (val === "" || val === null || val === undefined ? undefined : val),
      z.coerce
        .number({ message: "السعر يجب أن يكون رقماً" })
        .gt(0, "السعر يجب أن يكون أكبر من صفر")
        .optional()
    ),
    area_sqm: z.preprocess(
      (val) => (val === "" || val === null || val === undefined ? undefined : val),
      z.coerce
        .number({ message: "المساحة يجب أن تكون رقماً" })
        .gt(0, "المساحة يجب أن تكون أكبر من صفر")
        .optional()
    ),
    bedrooms: z.preprocess(
      (val) => (val === "" || val === null || val === undefined ? undefined : val),
      z.coerce
        .number({ message: "عدد غرف النوم يجب أن يكون رقماً" })
        .int("يجب أن يكون عدد الغرف عدداً صحيحاً")
        .min(0, "عدد الغرف لا يمكن أن يكون سالباً")
        .max(50, "الحد الأقصى لعدد الغرف 50")
        .optional()
    ),
    floor_no: z.preprocess(
      (val) => (val === "" || val === null || val === undefined ? undefined : val),
      z.coerce
        .number({ message: "رقم الدور يجب أن يكون رقماً" })
        .int("يجب أن يكون رقم الدور عدداً صحيحاً")
        .optional()
    ),
    notes: z
      .string()
      .trim()
      .max(1000, "الحد الأقصى للملاحظات 1000 حرف")
      .optional()
      .nullable(),
  })
  .refine(
    (data) =>
      Boolean(
        (data.title && data.title.trim().length > 0) ||
          (data.district && data.district.trim().length > 0)
      ),
    {
      message: "يرجى إدخال عنوان العقار أو الحي على الأقل",
      path: ["title"],
    }
  );

export const propertySchema = z.discriminatedUnion("input_mode", [
  urlPropertySchema,
  imagePropertySchema,
  manualPropertySchema,
]);

export type PropertyInput = z.infer<typeof propertySchema>;

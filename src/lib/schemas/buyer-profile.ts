import { z } from "zod";

export const PAYMENT_METHODS = ["cash", "mortgage"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const FLOOR_PREFERENCES = [
  "any",
  "ground",
  "middle",
  "top",
] as const;
export type FloorPreference = (typeof FLOOR_PREFERENCES)[number];

export const FLOOR_PREFERENCE_LABELS: Record<FloorPreference, string> = {
  any: "لا تفضيل محدد",
  ground: "دور أرضي (أفضلية لكبار السن أو حوش)",
  middle: "أدوار متوسطة (أول إلى رابع)",
  top: "دور علوي / أخير (أو روف)",
};

export const NEIGHBORHOOD_TYPES = [
  "quiet_family",
  "vibrant_services",
  "modern_planned",
  "close_to_highways",
] as const;
export type NeighborhoodType = (typeof NEIGHBORHOOD_TYPES)[number];

export const NEIGHBORHOOD_TYPE_LABELS: Record<NeighborhoodType, string> = {
  quiet_family: "حي هادئ وسكني عائلي",
  vibrant_services: "حي حيوي قريب من المشي والخدمات",
  modern_planned: "مخطط حديث مكتمل البنية التحتية",
  close_to_highways: "موقع استراتيجي قريب من المحاور والطرق السريعة",
};

export const PURCHASE_TIMELINES = [
  "immediate_1m",
  "short_3m",
  "medium_6m",
  "flexible_1y",
] as const;
export type PurchaseTimeline = (typeof PURCHASE_TIMELINES)[number];

export const PURCHASE_TIMELINE_LABELS: Record<PurchaseTimeline, string> = {
  immediate_1m: "شراء عاجل (خلال شهر)",
  short_3m: "خلال 1 إلى 3 أشهر",
  medium_6m: "خلال 3 إلى 6 أشهر",
  flexible_1y: "مرحلة استكشاف مرنة (خلال سنة)",
};

export const PRIORITY_ITEMS = [
  { id: "price", label: "السعر والقيمة المالية", description: "أفضل صفقة ضمن الميزانية المحددة" },
  { id: "location", label: "الموقع وسهولة الوصول", description: "قرب المحاور وسهولة التنقل اليومي" },
  { id: "quality", label: "جودة البناء والتشطيب", description: "متانة المواد وموثوقية الضمانات" },
  { id: "space", label: "المساحة والاتساع الداخلي", description: "رحابة الغرف واستغلال المخطط" },
  { id: "quiet_privacy", label: "الهدوء والخصوصية", description: "عزل صوتي وبعد عن الإزعاج التجاري" },
  { id: "resale_value", label: "القيمة الاستثمارية وإعادة البيع", description: "سهولة التصريف والنمو الرأسمالي" },
  { id: "services_nearby", label: "قرب الخدمات والمدارس", description: "مساجد، بقالات، ومدارس أطفال" },
] as const;

export type PriorityId = (typeof PRIORITY_ITEMS)[number]["id"];

export const DEFAULT_DEAL_BREAKER_PRESETS = [
  "مبنى بدون مصعد",
  "عدم وجود موقف سيارة خاص",
  "مطلة مباشرة على شارع تجاري مزعج",
  "عمر المبنى أكثر من 5 سنوات",
  "مساحة صافية أقل من 120 م²",
  "عدم وجود صك إلكتروني مستقل",
  "رسوم اتحاد ملاك مبالغ فيها",
  "واجهة غربية غير معزولة",
] as const;

// Sub-schemas for step-by-step validation
export const budgetStepSchema = z.object({
  max_budget_sar: z.coerce
    .number({ message: "يرجى تحديد الحد الأقصى للميزانية" })
    .min(100_000, "الحد الأدنى للميزانية 100,000 ر.س")
    .max(50_000_000, "الميزانية تتجاوز الحد الأقصى"),
  payment_method: z.enum(PAYMENT_METHODS, {
    message: "يرجى اختيار طريقة السداد المفضلة",
  }),
  monthly_installment_ceiling_sar: z.coerce
    .number()
    .nullable()
    .optional(),
}).refine(
  (data) => {
    if (data.payment_method === "mortgage") {
      return (
        data.monthly_installment_ceiling_sar !== undefined &&
        data.monthly_installment_ceiling_sar !== null &&
        data.monthly_installment_ceiling_sar > 0
      );
    }
    return true;
  },
  {
    message: "يرجى تحديد سقف القسط الشهري للتمويل العقاري",
    path: ["monthly_installment_ceiling_sar"],
  }
);

export const householdStepSchema = z.object({
  family_members_count: z.coerce
    .number({ message: "يرجى إدخال عدد أفراد الأسرة" })
    .int("يجب أن يكون عدد الأفراد عدداً صحيحاً")
    .min(1, "الحد الأدنى فرد واحد")
    .max(25, "الحد الأقصى 25 فرداً"),
  children_count: z.coerce
    .number()
    .int()
    .min(0, "عدد الأطفال لا يمكن أن يكون سالباً")
    .max(20)
    .default(0),
  children_ages_range: z.string().trim().max(100).default(""),
  has_elderly: z.coerce.boolean().default(false),
  car_count: z.coerce
    .number()
    .int()
    .min(0, "عدد السيارات لا يمكن أن يكون سالباً")
    .max(10)
    .default(1),
});

export const dailyLifeStepSchema = z.object({
  work_location: z
    .string()
    .trim()
    .max(120, "اسم الموقع لا يتجاوز 120 حرفاً")
    .default(""),
  school_location: z
    .string()
    .trim()
    .max(120, "اسم الموقع لا يتجاوز 120 حرفاً")
    .default(""),
  commute_tolerance_minutes: z.coerce
    .number()
    .min(5, "الحد الأدنى 5 دقائق")
    .max(120, "الحد الأقصى 120 دقيقة")
    .default(35),
  preferred_neighborhood_type: z
    .enum(NEIGHBORHOOD_TYPES)
    .default("quiet_family"),
});

export const needsStepSchema = z.object({
  min_bedrooms: z.coerce
    .number({ message: "يرجى تحديد عدد غرف النوم" })
    .int()
    .min(1, "الحد الأدنى غرفة واحدة")
    .max(10, "الحد الأقصى 10 غرف"),
  min_bathrooms: z.coerce
    .number()
    .int()
    .min(1, "الحد الأدنى دورة مياه واحدة")
    .max(10)
    .default(2),
  min_area_sqm: z.coerce
    .number()
    .min(40, "الحد الأدنى للمساحة 40 م²")
    .max(2000, "المساحة تتجاوز الحد الأقصى")
    .nullable()
    .optional(),
  floor_preference: z.enum(FLOOR_PREFERENCES).default("any"),
  elevator_required: z.coerce.boolean().default(true),
  parking_required: z.coerce.boolean().default(true),
  maid_room_required: z.coerce.boolean().default(false),
  outdoor_space_required: z.coerce.boolean().default(false),
});

export const prioritiesStepSchema = z.object({
  ranked_priorities: z
    .array(z.string())
    .min(3, "يرجى تحديد 3 أولويات على الأقل")
    .max(5, "يمكنك تحديد حتى 5 أولويات مرتبة"),
});

export const constraintsStepSchema = z.object({
  deal_breakers: z
    .array(z.string().trim().min(1).max(120))
    .max(15, "الحد الأقصى 15 مانعاً")
    .default([]),
  purchase_timeline: z.enum(PURCHASE_TIMELINES).default("short_3m"),
});

// Full combined Buyer Profile Schema
export const buyerProfileSchema = z.object({
  // Budget
  max_budget_sar: z.coerce
    .number({ message: "يرجى تحديد الميزانية القصوى" })
    .min(100_000, "الحد الأدنى 100,000 ر.س"),
  payment_method: z.enum(PAYMENT_METHODS).default("cash"),
  monthly_installment_ceiling_sar: z.coerce.number().nullable().optional(),

  // Household
  family_members_count: z.coerce.number().int().min(1).max(25).default(3),
  children_count: z.coerce.number().int().min(0).max(20).default(0),
  children_ages_range: z.string().trim().max(100).default(""),
  has_elderly: z.coerce.boolean().default(false),
  car_count: z.coerce.number().int().min(0).max(10).default(1),

  // Daily life
  work_location: z.string().trim().max(120).default(""),
  school_location: z.string().trim().max(120).default(""),
  commute_tolerance_minutes: z.coerce.number().min(5).max(120).default(35),
  preferred_neighborhood_type: z.enum(NEIGHBORHOOD_TYPES).default("quiet_family"),

  // Needs
  min_bedrooms: z.coerce.number().int().min(1).max(10).default(3),
  min_bathrooms: z.coerce.number().int().min(1).max(10).default(2),
  min_area_sqm: z.coerce.number().nullable().optional(),
  floor_preference: z.enum(FLOOR_PREFERENCES).default("any"),
  elevator_required: z.coerce.boolean().default(true),
  parking_required: z.coerce.boolean().default(true),
  maid_room_required: z.coerce.boolean().default(false),
  outdoor_space_required: z.coerce.boolean().default(false),

  // Priorities
  ranked_priorities: z
    .array(z.string())
    .min(1, "يرجى تحديد أولوياتك")
    .max(5)
    .default(["price", "location", "quality", "space", "quiet_privacy"]),

  // Constraints
  deal_breakers: z.array(z.string()).default([]),
  purchase_timeline: z.enum(PURCHASE_TIMELINES).default("short_3m"),
});

export type BuyerProfile = z.infer<typeof buyerProfileSchema>;

export const DEFAULT_BUYER_PROFILE: BuyerProfile = {
  max_budget_sar: 1_000_000,
  payment_method: "cash",
  monthly_installment_ceiling_sar: null,
  family_members_count: 4,
  children_count: 2,
  children_ages_range: "سن المدرسة (6-14)",
  has_elderly: false,
  car_count: 1,
  work_location: "",
  school_location: "",
  commute_tolerance_minutes: 35,
  preferred_neighborhood_type: "quiet_family",
  min_bedrooms: 3,
  min_bathrooms: 2,
  min_area_sqm: 130,
  floor_preference: "any",
  elevator_required: true,
  parking_required: true,
  maid_room_required: false,
  outdoor_space_required: false,
  ranked_priorities: ["price", "location", "quality", "space", "quiet_privacy"],
  deal_breakers: ["مبنى بدون مصعد", "عدم وجود موقف سيارة خاص"],
  purchase_timeline: "short_3m",
};

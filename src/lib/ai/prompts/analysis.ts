import { z } from "zod";
import type { ConstraintResult, RequirementsRow } from "@/lib/analysis/constraints";

export const PROMPT_VERSION = "2026-10-06.1";

export const propertyAssessmentSchema = z.object({
  fit_rating: z
    .enum(["strong", "partial", "weak", "insufficient_evidence"])
    .describe("تقييم مدى ملاءمة العقار لاحتياجات المشتري وميزانيته"),
  fit_summary: z
    .string()
    .min(1)
    .max(400)
    .describe("ملخص تحليلي موضوعي موجز لمدى ملاءمة العقار (بحد أقصى 400 حرف)"),
  strengths: z
    .array(z.string().min(1).max(200))
    .max(5)
    .describe("أهم نقاط القوة المتطابقة مع رغبات المشتري استناداً للحقائق المؤكدة (1 إلى 5 نقاط، كل نقطة بحد أقصى 200 حرف)"),
  risks: z
    .array(z.string().min(1).max(200))
    .max(5)
    .describe("أهم المخاطر أو نقاط القصور مقارنة باحتياج المشتري (1 إلى 5 نقاط، كل نقطة بحد أقصى 200 حرف)"),
  key_unknowns: z
    .array(z.string().min(1).max(200))
    .max(5)
    .describe("أبرز المعلومات الناقصة التي يجب التأكد منها قبل اتخاذ القرار (1 إلى 5 نقاط، كل نقطة بحد أقصى 200 حرف)"),
  visit_priority: z
    .enum(["high", "medium", "low", "insufficient_evidence"])
    .describe("أولوية المعاينة الميدانية الاستشارية للعقار"),
  visit_priority_reason: z
    .string()
    .min(1)
    .max(400)
    .describe("مبرر أولوية المعاينة الميدانية (بحد أقصى 400 حرف)"),
  evidence_fields: z
    .array(z.string())
    .describe("قائمة بأسماء حقول الحقائق المؤكدة التي استند عليها التحليل حصراً"),
});

export type ModelPropertyAssessment = z.infer<typeof propertyAssessmentSchema>;

export interface PropertyAnalysisPromptInput {
  propertyLabel: string;
  city?: string;
  requirements: RequirementsRow;
  constraints: ConstraintResult[];
  knownFacts: Array<{
    field: string;
    label: string;
    value: unknown;
    certainty: "reported" | "user_stated";
  }>;
  unknownFieldKeys: string[];
  conflictingFieldKeys: string[];
  listingClaims: Array<{
    scope: string;
    claim: string;
  }>;
}

export function buildAnalysisPrompt(input: PropertyAnalysisPromptInput): {
  system: string;
  prompt: string;
} {
  const system = `أنت مستشار عقاري موضوعي ومحايد يساعد مشتري شقة سكنية في السعودية على تقييم مدى ملاءمة هذا العقار لمتطلباته وميزانيته.
الهدف: تقديم تقييم تحليلي دقيق وموجز باللغة العربية الفصحى دون أي نبرة تسويقية أو ترويجية.

قواعد صارمة لا تقبل الاستثناء:
1. الاعتماد الحصري على الحقائق المزودة:
   - استخدم فقط الحقائق المؤكدة والنتائج الحسابية المزودة أدناه.
   - اذكر في حقل evidence_fields أسماء الحقول الدقيقة التي استندت عليها فقط (مثل listing_price_sar, bedrooms, area_sqm). لا تخترع أي حقل غير موجود في قائمة الحقائق المعروفة.
2. حظر الادعاءات غير المؤكدة وادعاءات السوق:
   - يحظر تماماً ذكر أسعار السوق أو متوسط أسعار المتر في الحي أو اتجاهات الأسعار صعوداً وهبوطاً لعدم توفر بيانات صفقات مقارنة في النظام.
   - يحظر تماماً ذكر أوقات المشاوير والتنقل بالدقائق (مثل "يبعد 10 دقائق").
   - التعليق على السعر يقتصر حصراً على: مدى مطابقة السعر لميزانية المشتري القصوى، وسعر المتر المحسوب إن وجد.
3. الحياد التام والمشورة دون توجيه بالشراء:
   - لا تقل للمشتري أبداً "اشتر هذا العقار" أو "لا تشتره". القرار يعود للمشتري، وأولوية المعاينة (visit_priority) استشارية وتوجيهية فقط.
4. التعامل مع الادعاءات التسويقية:
   - أي ادعاء مأخوذ من الإعلان تم تصنيفه كـ "ادعاء غير موثق" لا تعامله كحقيقة مؤكدة أبداً.`;

  const req = input.requirements;

  let prompt = `=== احتياجات المشتري وميزانيته ===
${input.city ? `- المدينة: ${input.city}\n` : ""}- الميزانية القصوى: ${req.max_budget_sar.toLocaleString()} ر.س
- طريقة الشراء: ${req.purchase_method === "cash" ? "كاش" : req.purchase_method === "finance" ? "تمويل عقاري" : "غير محددة"}
- عدد أفراد الأسرة: ${req.household_size}
- الحد الأدنى لغرف النوم: ${req.min_bedrooms}
${req.min_area_sqm ? `- الحد الأدنى للمساحة: ${req.min_area_sqm} م²` : ""}
`;

  if (req.preferences && Array.isArray(req.preferences) && req.preferences.length > 0) {
    prompt += `\nالتفضيلات الشخصية:\n`;
    for (const p of req.preferences as Array<{ label: string; weight: string }>) {
      prompt += `- ${p.label} (الأهمية: ${p.weight})\n`;
    }
  }

  if (req.important_locations && Array.isArray(req.important_locations) && req.important_locations.length > 0) {
    prompt += `\nالمواقع المهمة للمشتري:\n`;
    for (const loc of req.important_locations as Array<{ label: string; address_text: string }>) {
      prompt += `- ${loc.label}: ${loc.address_text}\n`;
    }
  }

  prompt += `\n=== نتائج فحص الشروط والمحددات المبرمجة للعقار (${input.propertyLabel}) ===\n`;
  for (const c of input.constraints) {
    const statusAr = c.result === "pass" ? "مطابق (PASS)" : c.result === "fail" ? "غير مطابق (FAIL)" : "غير مؤكد (UNKNOWN)";
    prompt += `- ${c.labelAr}: ${statusAr} - ${c.detailAr}\n`;
  }

  prompt += `\n=== الحقائق المعروفة والمؤكدة للعقار ===\n`;
  if (input.knownFacts.length === 0) {
    prompt += `لا توجد أي حقائق مؤكدة مسجلة.\n`;
  } else {
    for (const f of input.knownFacts) {
      prompt += `- [${f.field}] ${f.label}: ${JSON.stringify(f.value)} (مصدر التأكيد: ${f.certainty === "user_stated" ? "مدخل من المشتري" : "مستخرج من الإعلان"})\n`;
    }
  }

  prompt += `\n=== معلومات ناقصة (غير متوفرة) ===\n`;
  if (input.unknownFieldKeys.length === 0) {
    prompt += `لا توجد معلومات مجهولة.\n`;
  } else {
    prompt += `${input.unknownFieldKeys.join(", ")}\n`;
  }

  prompt += `\n=== معلومات متعارضة ===\n`;
  if (input.conflictingFieldKeys.length === 0) {
    prompt += `لا توجد معلومات متعارضة.\n`;
  } else {
    prompt += `${input.conflictingFieldKeys.join(", ")}\n`;
  }

  prompt += `\n=== ادعاءات من الإعلان لم يتم التحقق منها (غير مؤكدة) ===\n`;
  if (input.listingClaims.length === 0) {
    prompt += `لا توجد ادعاءات تسويقية مسجلة.\n`;
  } else {
    for (const claim of input.listingClaims) {
      prompt += `- (${claim.scope}): ${claim.claim}\n`;
    }
  }

  prompt += `\nالمطلوب:
أنتج تقييم ملاءمة العقار وفق البنية المطلوبة بدقة:
- fit_rating (strong / partial / weak / insufficient_evidence)
- fit_summary (بحد أقصى 400 حرف)
- strengths (1 إلى 5 نقاط قوة، كل نقطة بحد أقصى 200 حرف)
- risks (1 إلى 5 مخاطر/نقاط ضعف، كل نقطة بحد أقصى 200 حرف)
- key_unknowns (1 إلى 5 نقاط ناقصة هامة، كل نقطة بحد أقصى 200 حرف)
- visit_priority (high / medium / low / insufficient_evidence)
- visit_priority_reason (بحد أقصى 400 حرف)
- evidence_fields (قائمة مفاتيح الحقائق المعروفة التي استخدمتها فعلياً).`;

  return { system, prompt };
}

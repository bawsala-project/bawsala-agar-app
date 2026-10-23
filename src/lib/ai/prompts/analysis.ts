import { z } from "zod";
import type { ConstraintResult, RequirementsRow } from "@/lib/analysis/constraints";
import type { CleanFact, CleanRequirements } from "@/lib/security/allowlists";

export const PROMPT_VERSION = "2026-10-08.1";

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

/** Prompt content after the outbound allowlist: only clean requirements and facts remain. */
export type AnalysisPromptContent = Omit<PropertyAnalysisPromptInput, "requirements" | "knownFacts"> & {
  requirements: CleanRequirements;
  knownFacts: CleanFact[];
};

export function buildAnalysisPrompt(input: AnalysisPromptContent): {
  system: string;
  prompt: string;
} {
  const allowedEvidenceKeys = input.knownFacts.map((f) => f.field);
  const allowedEvidenceStr =
    allowedEvidenceKeys.length > 0 ? allowedEvidenceKeys.join(", ") : "لا يوجد";

  const system = `أنت مستشار ذكي ومستقل لاتخاذ قرار شراء شقة سكنية في السعودية ضمن منصة (بوصلة العقار).
الهدف: مساعدة المشتري على معرفة مدى ملاءمة هذه الشقة المرشحة لاحتياجاته الشخصية وحجم أسرته وميزانيته وطريقة شرائه وأولويات حياته اليومية، دون تقديم تقرير فني منفصل عن المشتري أو أي نبرة تسويقية.

قواعد صارمة لا تقبل الاستثناء:
1. الاعتماد الحصري على الحقائق المزودة وربط العقار بالمشتري:
   - استخدم فقط الحقائق المؤكدة والنتائج الحسابية المزودة أدناه، واربط كل ميزة أو مخاطرة بظروف المشتري (حجم الأسرة، عدد الغرف، طريقة الشراء كاش أو تمويل، الشروط الصارمة، والتفضيلات).
   - اذكر في حقل evidence_fields حصراً مفاتيح الحقول المؤكدة المسموحة لهذا العقار وهي: [${allowedEvidenceStr}]. لا تخترع أي حقل غير موجود في قائمة الحقائق المعروفة.
2. حظر الادعاءات غير المؤكدة وادعاءات السوق:
   - يحظر تماماً ذكر أسعار السوق أو متوسط أسعار المتر في الحي أو اتجاهات الأسعار صعوداً وهبوطاً لعدم توفر بيانات صفقات مقارنة في النظام.
   - يحظر تماماً ذكر أوقات المشاوير والتنقل بالدقائق (مثل "يبعد 10 دقائق"). إذا وُجد فحص للمواقع اليومية المهمة (القرب من المواقع المهمة) ضمن نتائج فحص الشروط، فاذكر تطابق الحي ضمن نقاط القوة (strengths) إن كان مطابقاً (PASS)، أو اذكر الحاجة للتحقق الميداني من المسار وقت الذروة ضمن النقاط الناقصة (key_unknowns) إن كان غير مؤكد (UNKNOWN).
   - التعليق على السعر يقتصر حصراً على: مدى مطابقة السعر لميزانية المشتري القصوى، وطريقة الشراء، وسعر المتر المحسوب إن وجد.
3. الحياد التام والمشورة دون توجيه بالشراء:
   - لا تقل للمشتري أبداً "اشتر هذا العقار" أو "لا تشتره". القرار يعود للمشتري، وأولوية المعاينة (visit_priority) استشارية وتوجيهية فقط.
4. التعامل مع الادعاءات التسويقية:
   - أي ادعاء مأخوذ من الإعلان تم تصنيفه كـ "ادعاء غير موثق" لا تعامله كحقيقة مؤكدة أبداً.`;

  const req = input.requirements;

  let prompt = `=== احتياجات المشتري وميزانيته وظروفه الشخصية ===
${input.city ? `- المدينة المستهدفة (شراء شقة سكنية): ${input.city}\n` : ""}- الميزانية القصوى: ${req.max_budget_sar.toLocaleString()} ر.س
- الحد الأدنى لغرف النوم: ${req.min_bedrooms}
${req.min_area_sqm ? `- الحد الأدنى للمساحة: ${req.min_area_sqm} م²` : ""}
`;

  if (req.hard_constraints.length > 0) {
    prompt += `\nالشروط الأساسية:\n`;
    for (const c of req.hard_constraints) {
      prompt += `- ${c.label}${c.value !== undefined ? ` (${c.value})` : ""}\n`;
    }
  }

  if (req.preferences.length > 0) {
    prompt += `\nالتفضيلات الشخصية:\n`;
    for (const p of req.preferences) {
      prompt += `- ${p.label} (الأهمية: ${p.weight})\n`;
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
- evidence_fields (اختر فقط من المفاتيح المؤكدة المتاحة: [${allowedEvidenceStr}]).`;

  return { system, prompt };
}

"use client";

import React from "react";
import Link from "next/link";
import {
  HelpCircle,
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
  Compass,
  Scale,
  Wallet,
  MapPin,
  ClipboardCheck,
} from "lucide-react";
import type { RankedItem, ComparisonMode } from "@/lib/analysis/compare";
import { formatSAR } from "@/lib/utils";
import { AskBawsala } from "./ask-bawsala";

interface DecisionFollowupQAProps {
  caseId?: string;
  items: RankedItem[];
  mode: ComparisonMode;
  closeOptions?: boolean;
  isStandalone?: boolean;
  maxBudgetSar?: number | null;
  purchaseMethod?: string | null;
  householdSize?: number | null;
}

export function DecisionFollowupQA({
  caseId,
  items,
  mode,
  closeOptions = false,
  isStandalone: isStandaloneProp,
  maxBudgetSar,
  purchaseMethod,
  householdSize,
}: DecisionFollowupQAProps) {
  if (!items || items.length === 0) return null;

  const isStandalone = isStandaloneProp ?? items.length === 1;
  const top = items[0];
  const second = items[1];

  const fitLabelAr = (rating: string) => {
    switch (rating) {
      case "strong":
        return "ملاءمة قوية لاحتياجك";
      case "partial":
        return "ملاءمة جزئية (مع مقايضات)";
      case "weak":
        return "ملاءمة ضعيفة (تعارض مع شروطك)";
      default:
        return "بيانات غير كافية للجزم";
    }
  };

  return (
    <section
      dir="rtl"
      aria-labelledby="decision-qa-heading"
      className="bg-[var(--paper)] rounded-[24px] border border-[var(--mist)] p-5 sm:p-7 space-y-5 shadow-[0_14px_40px_rgba(15,26,43,0.04)]"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[var(--mist)]">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[var(--cream)] border border-[var(--mist)] flex items-center justify-center text-[var(--navy)] shrink-0">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2
                id="decision-qa-heading"
                className="text-base sm:text-lg font-display font-bold text-[var(--navy)]"
              >
                أسئلة المتابعة
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-[#E9F4EE] text-[#1E6B43] border border-[#C5E4D4] text-[11px] font-bold">
                مجاناً
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Native mutually-exclusive <details> disclosures for Find-in-Page & ARIA accessibility */}
      <div className="space-y-3">
        {/* Question 1: Why #1 / Why this recommendation? */}
        <details
          name="decision-followup-qa"
          open
          className="group rounded-2xl bg-[var(--cream)]/70 border border-[var(--mist)] open:bg-[var(--cream)] open:border-[var(--navy)]/40 transition-colors"
        >
          <summary className="list-none cursor-pointer p-4 sm:p-5 flex items-center justify-between gap-3 select-none">
            <div className="flex items-center gap-2.5 text-right">
              <Compass className="w-4 h-4 text-[var(--navy)] shrink-0" />
              <span className="text-xs sm:text-sm font-body font-bold text-[var(--navy)]">
                {isStandalone
                  ? `لماذا هذا التقييم لـ (${top.title})؟`
                  : `لماذا (${top.title}) أولاً؟`}
              </span>
            </div>
            <ChevronDown className="w-4 h-4 text-[var(--dusty-blue)] transition-transform duration-200 group-open:rotate-180 shrink-0" />
          </summary>

          <div className="px-4 sm:px-5 pb-5 pt-1 space-y-3 text-sm text-[var(--navy)] leading-relaxed border-t border-[var(--mist)]/60">
            {isStandalone ? (
              <>
                <p className="text-[var(--navy)]">
                  تقييم منفرد لـ <strong>{top.title}</strong> مقابل احتياجك
                  {householdSize ? ` (أسرة من ${householdSize} أفراد)` : ""}:
                </p>
                <ul className="space-y-1.5 pr-4 list-disc text-sm text-[var(--navy)]">
                  <li>
                    <strong>مطابقة الشروط الصارمة:</strong> اجتازت الشقة{" "}
                    <span className="font-bold text-[#1B6B45]">{top.constraint_summary.pass}</span> شروط، وظهر تعارض في{" "}
                    <span className="font-bold text-[#A82828]">{top.constraint_summary.fail}</span>، بينما بقي{" "}
                    <span className="font-bold text-[#9A6200]">{top.constraint_summary.unknown}</span> بحاجة لتحقق ميداني.
                  </li>
                  <li>
                    <strong>أبرز سبب إيجابي:</strong> {top.main_advantage_ar}
                  </li>
                  <li>
                    <strong>مستوى الثقة ({top.confidence_label_ar}):</strong> {top.confidence_reason_ar}
                  </li>
                </ul>
              </>
            ) : (
              <>
                <p>
                  تصدّر <strong>{top.title}</strong> الترتيب{" "}
                  {mode === "provisional" ? "(مبدئياً)" : ""} للأسباب التالية:
                </p>
                <ul className="space-y-1.5 pr-4 list-disc text-sm text-[var(--navy)]">
                  <li>
                    <strong>الشروط الأساسية:</strong> حقق{" "}
                    <span className="font-bold text-[#1B6B45]">{top.constraint_summary.pass} شروط مطابقة</span> مقابل{" "}
                    <span className="font-bold text-[#A82828]">{top.constraint_summary.fail} مخالفات</span>، بتقدير ملاءمة{" "}
                    <strong>({fitLabelAr(top.fit_rating)})</strong> ومستوى <strong>({top.confidence_label_ar})</strong>.
                  </li>
                  <li>
                    <strong>الميزة الفارقة:</strong> {top.main_advantage_ar}
                  </li>
                  {second && (
                    <li>
                      <strong>سبب تقدمه على المركز الثاني ({second.title}):</strong>{" "}
                      {top.constraint_summary.fail < second.constraint_summary.fail
                        ? `التزامه بشروطك الأساسية بينما خالف (${second.title}) ${second.constraint_summary.fail} من شروطك (${second.main_tradeoff_ar}).`
                        : closeOptions
                          ? "الخياران متقاربان جداً؛ تفوق الأول بفارق طفيف."
                          : `تفوق في درجة الملاءمة وكفاءة سعر المتر مقارنة بـ (${second.title}).`}
                    </li>
                  )}
                </ul>
              </>
            )}
          </div>
        </details>

        {/* Question 2: Trade-offs & Compromises */}
        <details
          name="decision-followup-qa"
          className="group rounded-2xl bg-[var(--cream)]/70 border border-[var(--mist)] open:bg-[var(--cream)] open:border-[var(--navy)]/40 transition-colors"
        >
          <summary className="list-none cursor-pointer p-4 sm:p-5 flex items-center justify-between gap-3 select-none">
            <div className="flex items-center gap-2.5 text-right">
              <Scale className="w-4 h-4 text-[var(--navy)] shrink-0" />
              <span className="text-xs sm:text-sm font-body font-bold text-[var(--navy)]">
                {isStandalone
                  ? "ما الذي أتنازل عنه هنا؟"
                  : "ما تنازلات كل شقة؟"}
              </span>
            </div>
            <ChevronDown className="w-4 h-4 text-[var(--dusty-blue)] transition-transform duration-200 group-open:rotate-180 shrink-0" />
          </summary>

          <div className="px-4 sm:px-5 pb-5 pt-2 space-y-2.5 text-sm text-[var(--navy)] border-t border-[var(--mist)]/60">
            {items.map((item, idx) => (
              <div
                key={item.property_id}
                className="p-3.5 rounded-xl bg-[var(--paper)] border border-[var(--mist)] space-y-1.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-bold text-[var(--navy)]">
                    {isStandalone ? item.title : `#${item.rank ?? idx + 1} · ${item.title}`}
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-[var(--cream)] border border-[var(--mist)] text-[var(--dusty-blue)] font-semibold">
                    {fitLabelAr(item.fit_rating)} · {item.confidence_label_ar}
                  </span>
                </div>
                <p className="text-[var(--navy)]">
                  <strong className="text-[#1B6B45]">ما تكسبه:</strong> {item.main_advantage_ar}
                </p>
                <p className="text-[var(--navy)]">
                  <strong className="text-[#9A6200]">ما تتنازل عنه:</strong>{" "}
                  {item.tradeoffs?.[0] || item.main_tradeoff_ar}
                </p>
              </div>
            ))}
          </div>
        </details>

        {/* Question 3: Daily Life, Fair Price & Affordability */}
        <details
          name="decision-followup-qa"
          className="group rounded-2xl bg-[var(--cream)]/70 border border-[var(--mist)] open:bg-[var(--cream)] open:border-[var(--navy)]/40 transition-colors"
        >
          <summary className="list-none cursor-pointer p-4 sm:p-5 flex items-center justify-between gap-3 select-none">
            <div className="flex items-center gap-2.5 text-right">
              <Wallet className="w-4 h-4 text-[var(--navy)] shrink-0" />
              <span className="text-xs sm:text-sm font-body font-bold text-[var(--navy)]">
                كيف يناسب السعر والموقع ظروفي؟
              </span>
            </div>
            <ChevronDown className="w-4 h-4 text-[var(--dusty-blue)] transition-transform duration-200 group-open:rotate-180 shrink-0" />
          </summary>

          <div className="px-4 sm:px-5 pb-5 pt-2 space-y-2.5 text-sm text-[var(--navy)] border-t border-[var(--mist)]/60">
            {maxBudgetSar && (
              <div className="text-[11px] text-[var(--dusty-blue)] pb-1">
                الميزانية المحددة: <strong className="text-[var(--navy)]">{formatSAR(maxBudgetSar)}</strong>
                {purchaseMethod && (
                  <>
                    {" "}· طريقة الشراء:{" "}
                    <strong className="text-[var(--navy)]">
                      {purchaseMethod === "mortgage" || purchaseMethod === "finance"
                        ? "تمويل عقاري"
                        : "شراء نقدي (كاش)"}
                    </strong>
                  </>
                )}
              </div>
            )}
            {items.map((item, idx) => (
              <div
                key={item.property_id}
                className="p-3.5 rounded-xl bg-[var(--paper)] border border-[var(--mist)] space-y-1.5"
              >
                <div className="font-bold text-[var(--navy)]">
                  {isStandalone ? item.title : `#${item.rank ?? idx + 1} · ${item.title}`}
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 text-[var(--dusty-blue)] shrink-0 mt-0.5" />
                  <span>
                    <strong>الحياة اليومية والموقع ({item.daily_life.status_label_ar}):</strong>{" "}
                    {item.daily_life.summary_ar}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#1B6B45] shrink-0 mt-0.5" />
                  <span>
                    <strong>الحكم على السعر ({item.price_axis.status_label_ar}):</strong>{" "}
                    {item.price_axis.explanation_ar}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <Wallet className="w-3.5 h-3.5 text-[var(--navy)] shrink-0 mt-0.5" />
                  <span>
                    <strong>القدرة المالية ({item.affordability_axis.status_label_ar}):</strong>{" "}
                    {item.affordability_axis.explanation_ar}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </details>

        {/* Question 4: Missing Info & What Could Change the Decision */}
        <details
          name="decision-followup-qa"
          className="group rounded-2xl bg-[var(--cream)]/70 border border-[var(--mist)] open:bg-[var(--cream)] open:border-[var(--navy)]/40 transition-colors"
        >
          <summary className="list-none cursor-pointer p-4 sm:p-5 flex items-center justify-between gap-3 select-none">
            <div className="flex items-center gap-2.5 text-right">
              <AlertTriangle className="w-4 h-4 text-[#9A6200] shrink-0" />
              <span className="text-xs sm:text-sm font-body font-bold text-[var(--navy)]">
                ما الذي قد يغيّر القرار؟
              </span>
            </div>
            <ChevronDown className="w-4 h-4 text-[var(--dusty-blue)] transition-transform duration-200 group-open:rotate-180 shrink-0" />
          </summary>

          <div className="px-4 sm:px-5 pb-5 pt-2 space-y-3 text-sm text-[var(--navy)] border-t border-[var(--mist)]/60">
            {items.map((item, idx) => (
              <div
                key={item.property_id}
                className="p-3.5 rounded-xl bg-[var(--paper)] border border-[var(--mist)] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="font-bold text-[var(--navy)]">
                    {isStandalone ? item.title : `#${item.rank ?? idx + 1} · ${item.title}`}
                  </div>
                  <p className="text-[var(--dusty-blue)]">{item.what_could_change_rank_ar}</p>
                  {item.key_unknowns.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {item.key_unknowns.map((u, uIdx) => (
                        <span
                          key={uIdx}
                          className="px-2 py-0.5 rounded-md bg-[#FDF5E6] text-[#9A6200] border border-[#9A6200]/20 text-[11px] font-medium"
                        >
                          {u}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {caseId && (
                  <Link
                    href={`/case/${caseId}/inspection?propertyId=${item.property_id}`}
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-full bg-[var(--navy)] text-[var(--cream)] text-[11px] font-bold hover:bg-[var(--midnight)] transition-colors shrink-0 no-underline"
                  >
                    <ClipboardCheck className="w-3.5 h-3.5" />
                    <span>قائمة التحقق الميداني ←</span>
                  </Link>
                )}
              </div>
            ))}
          </div>
        </details>
      </div>

      {caseId && <AskBawsala caseId={caseId} />}
    </section>
  );
}

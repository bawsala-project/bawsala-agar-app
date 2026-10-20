"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  User,
  Coins,
  Users,
  Briefcase,
  Sliders,
  AlertOctagon,
  Edit3,
  ChevronDown,
  ChevronUp,
  Clock,
  CheckCircle2,
  Building,
} from "lucide-react";
import { formatSAR } from "@/lib/utils";
import type { BuyerProfile } from "@/lib/schemas/buyer-profile";
import {
  PRIORITY_ITEMS,
  FLOOR_PREFERENCE_LABELS,
  NEIGHBORHOOD_TYPE_LABELS,
  PURCHASE_TIMELINE_LABELS,
} from "@/lib/schemas/buyer-profile";

interface BuyerProfileSummaryProps {
  caseId: string;
  profile: BuyerProfile | null;
  compact?: boolean;
  city?: string | null;
}

export function BuyerProfileSummary({
  caseId,
  profile,
  compact = false,
  city,
}: BuyerProfileSummaryProps) {
  const [isExpanded, setIsExpanded] = useState(!compact);

  if (!profile) {
    return (
      <div className="bg-[var(--paper)] rounded-[24px] border border-[var(--mist)] p-5 text-center space-y-3">
        <p className="text-xs text-[var(--dusty-blue)]">
          لم يتم استكمال ملف المشتري بعد. يرجى إدخال تفضيلاتك وميزانيتك.
        </p>
        <Link
          href={`/case/${caseId}/profile`}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[var(--navy)] text-[var(--cream)] text-xs font-bold"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>تعبئة ملف المشتري</span>
        </Link>
      </div>
    );
  }

  // Map priority IDs to full labels
  const priorityLabels = profile.ranked_priorities.map((id, index) => {
    const item = PRIORITY_ITEMS.find((p) => p.id === id);
    return {
      rank: index + 1,
      label: item?.label || id,
    };
  });

  return (
    <section
      aria-label="ملخص ملف المشتري ومعايير القرار"
      className="bg-[var(--paper)] rounded-[28px] border border-[var(--mist)] p-6 sm:p-7 shadow-[0_20px_60px_rgba(15,26,43,0.04)] space-y-5 text-right select-none"
      dir="rtl"
    >
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[var(--mist)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[var(--cream)] text-[var(--navy)] border border-[var(--mist)] flex items-center justify-center shrink-0">
            <User className="w-5 h-5 text-[var(--navy)]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-display font-bold text-[var(--navy)]">
                ملخص ملف المشتري ومعايير القرار
              </h3>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#E9F4EE] text-[#1E6B43] border border-[#C5E4D4]">
                مكتمل وموثق
              </span>
            </div>
            <p className="text-xs text-[var(--dusty-blue)] mt-0.5">
              الإطار المالي والسكني الحاكم لمطابقة العقارات وتقييم الملاءمة
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {compact && (
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--cream)] hover:bg-[var(--mist)]/40 text-[var(--navy)] text-xs font-medium border border-[var(--mist)] transition-colors cursor-pointer"
            >
              {isExpanded ? (
                <>
                  <span>إخفاء التفاصيل</span>
                  <ChevronUp className="w-3.5 h-3.5" />
                </>
              ) : (
                <>
                  <span>عرض التفاصيل الكاملة</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          )}

          <Link
            href={`/case/${caseId}/profile`}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[var(--cream)] hover:bg-[var(--paper)] text-[var(--navy)] hover:border-[var(--navy)] text-xs font-bold border border-[var(--mist)] transition-all shadow-xs cursor-pointer no-underline"
          >
            <Edit3 className="w-3.5 h-3.5 text-[var(--navy)]" />
            <span>تعديل الملف</span>
          </Link>
        </div>
      </div>

      {/* Primary Highlights Grid (Always Visible) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Budget */}
        <div className="bg-[var(--cream)] rounded-2xl p-4 border border-[var(--mist)] space-y-1">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-[var(--dusty-blue)]">
            <Coins className="w-3.5 h-3.5 text-[var(--navy)]" />
            <span>سقف الميزانية</span>
          </div>
          <div className="font-display font-bold text-base sm:text-lg text-[var(--navy)] tabular-nums">
            {formatSAR(profile.max_budget_sar)}
          </div>
          <div className="text-[11px] text-[var(--dusty-blue)]">
            {profile.payment_method === "mortgage"
              ? `تمويل عقاري ${profile.monthly_installment_ceiling_sar ? `(قسط: ${formatSAR(profile.monthly_installment_ceiling_sar)})` : ""}`
              : "سداد نقدي مباشر"}
          </div>
        </div>

        {/* Household */}
        <div className="bg-[var(--cream)] rounded-2xl p-4 border border-[var(--mist)] space-y-1">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-[var(--dusty-blue)]">
            <Users className="w-3.5 h-3.5 text-[var(--navy)]" />
            <span>الأسرة والمقيمون</span>
          </div>
          <div className="font-display font-bold text-base sm:text-lg text-[var(--navy)]">
            {profile.family_members_count} أفراد
          </div>
          <div className="text-[11px] text-[var(--dusty-blue)]">
            {profile.children_count > 0 ? `${profile.children_count} أطفال` : "بدون أطفال"}
            {profile.has_elderly ? " · كبار سن" : ""}
          </div>
        </div>

        {/* Needs Spec */}
        <div className="bg-[var(--cream)] rounded-2xl p-4 border border-[var(--mist)] space-y-1">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-[var(--dusty-blue)]">
            <Building className="w-3.5 h-3.5 text-[var(--navy)]" />
            <span>المواصفات الصافية</span>
          </div>
          <div className="font-display font-bold text-base sm:text-lg text-[var(--navy)]">
            {profile.min_bedrooms} غرف نوم
          </div>
          <div className="text-[11px] text-[var(--dusty-blue)]">
            {profile.min_area_sqm ? `من ${profile.min_area_sqm} م²` : "مساحة مرنة"} · {profile.min_bathrooms} دورات مياه
          </div>
        </div>

        {/* Purchase Timeline */}
        <div className="bg-[var(--cream)] rounded-2xl p-4 border border-[var(--mist)] space-y-1">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-[var(--dusty-blue)]">
            <Clock className="w-3.5 h-3.5 text-[var(--navy)]" />
            <span>الجدول الزمني للشراء</span>
          </div>
          <div className="font-display font-bold text-sm sm:text-base text-[var(--navy)]">
            {PURCHASE_TIMELINE_LABELS[profile.purchase_timeline] || "خلال 3 أشهر"}
          </div>
          <div className="text-[11px] text-[var(--dusty-blue)]">
            {city ? `في نطاق ${city}` : "المدينة المعتمدة"}
          </div>
        </div>
      </div>

      {/* Detailed Expanded View */}
      {isExpanded && (
        <div className="space-y-4 pt-3 border-t border-[var(--mist)] text-xs text-[var(--navy)]">
          {/* Daily Life & Commutes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[var(--cream)]/60 rounded-2xl p-4 border border-[var(--mist)] space-y-2">
              <span className="font-bold flex items-center gap-1.5 text-[var(--navy)]">
                <Briefcase className="w-3.5 h-3.5 text-[var(--navy)]" />
                <span>الحياة اليومية ومحاور الحركة</span>
              </span>
              <div className="space-y-1 text-[var(--dusty-blue)] leading-relaxed">
                <div>
                  <strong className="text-[var(--navy)]">مقر العمل:</strong>{" "}
                  {profile.work_location || "غير محدد"}
                </div>
                <div>
                  <strong className="text-[var(--navy)]">مقر المدارس:</strong>{" "}
                  {profile.school_location || "غير محدد"}
                </div>
                <div>
                  <strong className="text-[var(--navy)]">تحمل الازدحام اليومي:</strong>{" "}
                  حتى {profile.commute_tolerance_minutes} دقيقة
                </div>
                <div>
                  <strong className="text-[var(--navy)]">نمط الحي المفضل:</strong>{" "}
                  {NEIGHBORHOOD_TYPE_LABELS[profile.preferred_neighborhood_type]}
                </div>
              </div>
            </div>

            {/* Needs & Amenities */}
            <div className="bg-[var(--cream)]/60 rounded-2xl p-4 border border-[var(--mist)] space-y-2">
              <span className="font-bold flex items-center gap-1.5 text-[var(--navy)]">
                <Sliders className="w-3.5 h-3.5 text-[var(--navy)]" />
                <span>الشروط والمتطلبات السكنية</span>
              </span>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {profile.elevator_required && (
                  <span className="px-2.5 py-1 rounded-full bg-[var(--paper)] text-[var(--navy)] border border-[var(--mist)] text-[11px] font-medium">
                    ✓ مصعد إلزامي
                  </span>
                )}
                {profile.parking_required && (
                  <span className="px-2.5 py-1 rounded-full bg-[var(--paper)] text-[var(--navy)] border border-[var(--mist)] text-[11px] font-medium">
                    ✓ موقف خاص ({profile.car_count} سيارة)
                  </span>
                )}
                {profile.maid_room_required && (
                  <span className="px-2.5 py-1 rounded-full bg-[var(--paper)] text-[var(--navy)] border border-[var(--mist)] text-[11px] font-medium">
                    ✓ غرفة عاملة
                  </span>
                )}
                {profile.outdoor_space_required && (
                  <span className="px-2.5 py-1 rounded-full bg-[var(--paper)] text-[var(--navy)] border border-[var(--mist)] text-[11px] font-medium">
                    ✓ مساحة خارجية / بلكونة
                  </span>
                )}
                <span className="px-2.5 py-1 rounded-full bg-[var(--paper)] text-[var(--navy)] border border-[var(--mist)] text-[11px] font-medium">
                  الدور: {FLOOR_PREFERENCE_LABELS[profile.floor_preference]}
                </span>
              </div>
            </div>
          </div>

          {/* Ranked Priorities */}
          <div className="space-y-2">
            <span className="font-bold flex items-center gap-1.5 text-[var(--navy)]">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#1E6B43]" />
              <span>الأولويات الخمس المرتبة للمفاضلة:</span>
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {priorityLabels.map((p) => (
                <div
                  key={p.rank}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--cream)] border border-[var(--mist)] text-xs"
                >
                  <span className="w-4 h-4 rounded-full bg-[var(--navy)] text-[var(--cream)] text-[10px] font-bold flex items-center justify-center">
                    {p.rank}
                  </span>
                  <span className="font-medium text-[var(--navy)]">{p.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Deal Breakers */}
          {profile.deal_breakers.length > 0 && (
            <div className="space-y-2 pt-2">
              <span className="font-bold flex items-center gap-1.5 text-[#A62626]">
                <AlertOctagon className="w-3.5 h-3.5 text-[#A62626]" />
                <span>الموانع الحاسمة (Deal-Breakers):</span>
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {profile.deal_breakers.map((db, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#FDF1F0] text-[#A62626] border border-[#F6CBC8] text-xs font-medium"
                  >
                    ✕ {db}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

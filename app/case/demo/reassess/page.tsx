"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ArrowDownUp,
  AlertTriangle,
  CheckCircle2,
  Bookmark,
} from "lucide-react";
import { CircleButton } from "@/components/ui/CircleButton";
import { PhotoCard } from "@/components/ui/PhotoCard";
import { WideCard } from "@/components/ui/WideCard";
import { GlassPill } from "@/components/ui/GlassPill";
import { GlassSheet } from "@/components/ui/GlassSheet";
import { useAppStore } from "@/lib/store";

export default function ReassessPage() {
  const router = useRouter();
  const {
    properties,
    applyReassessment,
    isReassessed,
  } = useAppStore();

  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  useEffect(() => {
    if (!isReassessed) {
      applyReassessment();
    }
  }, [isReassessed, applyReassessment]);

  const p1 = properties.find((p) => p.id === "p1") || properties[0];
  const p3 = properties.find((p) => p.id === "p3") || properties[2] || properties[0];

  return (
    <div
      className="relative w-full min-h-screen bg-espresso text-sandstone flex flex-col justify-between select-none bg-radial-lift"
      dir="rtl"
    >
      {/* Main Content Area */}
      <div className="w-full max-w-[420px] mx-auto px-5 pt-[calc(20px+var(--safe-top))] pb-[calc(24px+var(--safe-bottom))] flex-1 flex flex-col justify-between">
        <div className="space-y-4">
          {/* Header Row: CircleButton back + Step counter */}
          <div className="flex items-center justify-between">
            <CircleButton
              icon={<ArrowRight className="w-5 h-5 text-sandstone" />}
              ariaLabel="الرجوع للخلف"
              onClick={() => router.back()}
              variant="glass"
            />
            <span className="text-[13px] font-medium text-muted">
              تحديث الترتيب وفق الزيارة الميدانية
            </span>
          </div>

          {/* Huge Title: "أثر المعاينة" */}
          <h1 className="text-[40px] md:text-[48px] font-light text-ink leading-[1.15] tracking-normal">
            أثر المعاينة
          </h1>

          {/* Section 1: Before/After PhotoCards with a rank-change arrow */}
          <div className="space-y-2.5">
            {/* New #1: Al-Narjis (Rose to #1) */}
            <div className="space-y-1">
              <span className="text-[12px] font-medium text-sandstone px-1 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-sandstone" />
                المركز الأول بعد الفحص: النرجس
              </span>
              <PhotoCard
                imageSrc="/images/p3-exterior.jpg"
                imageAlt={p3.title}
                title={p3.title}
                subtitle={p3.district}
                topChipLabel="الأنسب الآن (#1)"
                chips={[p3.formattedPrice, `${p3.areaM2} م²`, "فحص سليم"]}
                height={210}
              />
            </div>

            {/* Rank-Change Arrow Indicator */}
            <div className="flex items-center justify-center -my-1 relative z-20">
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bawsala-glass text-sandstone text-[12px] font-medium shadow-md">
                <ArrowDownUp className="w-3.5 h-3.5 text-sandstone" />
                <span>تبدّل الترتيب بناءً على الملاحظات</span>
              </div>
            </div>

            {/* Dropped #2: Al-Yasmin (Dropped due to leak) */}
            <div className="space-y-1">
              <span className="text-[12px] font-medium text-copper px-1 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-copper" />
                المركز الثاني: الياسمين (ملاحظة رطوبة)
              </span>
              <PhotoCard
                imageSrc="/images/p1-exterior.jpg"
                imageAlt={p1.title}
                title={p1.title}
                subtitle={p1.district}
                topChipLabel="تراجع للمركز الثاني (#2)"
                chips={[p1.formattedPrice, `${p1.areaM2} م²`, "ملاحظة سقف"]}
                height={190}
              />
            </div>
          </div>

          {/* Section 2: One WideCard reason */}
          <div className="pt-1">
            <WideCard
              title="لماذا تغيّر هذا الترتيب؟"
              subtitle="لوحظت آثار رطوبة وتقشر طلاء في سقف الياسمين، مما خفض الاطمئنان ورشح النرجس لسلامته ووفر 80 ألف ر.س."
              icon={<AlertTriangle className="w-5 h-5 text-copper" />}
              value={<span className="text-[12px] text-muted">تفاصيل</span>}
              onClick={() => setIsDetailsOpen(true)}
            />
          </div>
        </div>

        {/* Primary Action Button */}
        <div className="pt-6">
          <GlassPill
            label="حفظ في دراساتي"
            icon={<Bookmark className="w-5 h-5" />}
            size="56"
            variant="sandstone"
            showArrow
            fullWidth
            onClick={() => router.push("/dashboard")}
          />
        </div>
      </div>

      {/* Details in a GlassSheet */}
      <GlassSheet
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        title="تفاصيل إعادة التقييم الميداني"
        subtitle="الأثر الهندسي والمالي لملاحظات الفحص"
        initialSnap="half"
        variant="dark"
      >
        <div className="space-y-4 pt-2">
          <div className="p-4 rounded-[20px] bg-surface-2 border border-copper/30 space-y-2">
            <span className="text-[14px] font-semibold text-sandstone block">
              1. ملاحظة السباكة في شقة الياسمين:
            </span>
            <p className="text-[13px] text-muted leading-relaxed">
              تسرب مياه علوي في ممر حمام الضيوف قد يتطلب عزل وتكسير بلاط بتكلفة تقديرية تتجاوز 25,000 إلى 35,000 ر.س.
            </p>
          </div>

          <div className="p-4 rounded-[20px] bg-surface-2 border border-stroke space-y-2">
            <span className="text-[14px] font-semibold text-sandstone block">
              2. الميزة المادية لشقة النرجس:
            </span>
            <p className="text-[13px] text-muted leading-relaxed">
              توفر فارق 80,000 ر.س عن سقف الميزانية، مع سلامة العوازل والأسقف، مما يجعلها الصفقة الأكثر أماناً وجدوى.
            </p>
          </div>
        </div>
      </GlassSheet>
    </div>
  );
}

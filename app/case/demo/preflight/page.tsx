"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ArrowLeft,
  Bookmark,
  CheckCircle2,
} from "lucide-react";
import { CircleButton } from "@/components/ui/CircleButton";
import { PhotoCard } from "@/components/ui/PhotoCard";
import { StatCard } from "@/components/ui/StatCard";
import { WideCard } from "@/components/ui/WideCard";
import { ActionBar } from "@/components/ui/ActionBar";
import { GlassSheet } from "@/components/ui/GlassSheet";
import { useAppStore } from "@/lib/store";
import { COPY } from "@/lib/copy";

const PROPERTY_IMAGES: Record<string, string> = {
  p1: "/images/p1-exterior.jpg",
  p2: "/images/p2-exterior.jpg",
  p3: "/images/p3-exterior.jpg",
};

export default function PreflightPage() {
  const router = useRouter();
  const {
    properties,
    p1SelectedArea,
    resolveP1Area,
    p3BuildingAge,
    resolveP3Age,
  } = useAppStore();

  const [activeIndex, setActiveIndex] = useState(0);
  const [isDetailSheetOpen, setIsDetailSheetOpen] = useState(false);

  const activeProperty = properties[activeIndex] || properties[0];

  // Certainty dots per DESIGN_RULES: confirmed = sandstone filled, unknown = hollow ring in --muted, conflicting = copper
  const renderCertaintyDot = (certainty: string) => {
    if (certainty === "confirmed" || certainty === "user_observed" || certainty === "derived") {
      return (
        <span
          className="w-3 h-3 rounded-full bg-sandstone shadow-xs shrink-0"
          title="مؤكد"
          aria-label="مؤكد"
        />
      );
    }
    if (certainty === "conflicting") {
      return (
        <span
          className="w-3 h-3 rounded-full bg-copper shadow-xs shrink-0"
          title="تعارض مصادر"
          aria-label="تعارض مصادر"
        />
      );
    }
    return (
      <span
        className="w-3 h-3 rounded-full border border-muted bg-transparent shrink-0"
        title="غير معروف"
        aria-label="غير معروف"
      />
    );
  };

  return (
    <div
      className="relative w-full min-h-screen bg-espresso text-sandstone flex flex-col justify-between select-none bg-radial-lift"
      dir="rtl"
    >
      {/* Main Content Area */}
      <div className="w-full max-w-[420px] mx-auto px-5 pt-[calc(20px+var(--safe-top))] pb-[calc(100px+var(--safe-bottom))] flex-1 flex flex-col justify-between">
        <div className="space-y-6">
          {/* Header: CircleButton back + Step counter */}
          <div className="flex items-center justify-between">
            <CircleButton
              icon={<ArrowRight className="w-5 h-5 text-sandstone" />}
              ariaLabel="الرجوع للخلف"
              onClick={() => router.back()}
              variant="glass"
            />
            <span className="text-[13px] font-medium text-muted">
              خطوة <bdi dir="ltr">3</bdi> من <bdi dir="ltr">5</bdi> • تدقيق المعطيات
            </span>
          </div>

          {/* Huge Title: "قبل أن نبدأ" */}
          <h1 className="text-[40px] md:text-[48px] font-light text-ink leading-[1.15] tracking-normal">
            قبل أن نبدأ
          </h1>

          {/* Section 1: PhotoCard Carousel per property with peeking sides */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-[13px] font-medium text-muted">
                اختر العقار لتدقيق معطياته
              </span>
              <span className="text-[12px] text-muted">
                <bdi dir="ltr">{activeIndex + 1}</bdi> / <bdi dir="ltr">{properties.length}</bdi>
              </span>
            </div>

            <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-none -mx-5 px-5 py-1">
              {properties.map((property, idx) => {
                const imageSrc = PROPERTY_IMAGES[property.id] || "/images/hero-home.jpg";
                const isSelected = idx === activeIndex;

                return (
                  <div
                    key={property.id}
                    onClick={() => setActiveIndex(idx)}
                    className={`w-[84vw] max-w-[340px] shrink-0 snap-center cursor-pointer transition-opacity ${
                      isSelected ? "opacity-100" : "opacity-60"
                    }`}
                  >
                    <PhotoCard
                      imageSrc={imageSrc}
                      imageAlt={property.title}
                      title={property.title}
                      subtitle={property.district}
                      topChipLabel={property.sourceLabel}
                      topChipIcon={<CheckCircle2 className="w-3.5 h-3.5 text-sandstone" />}
                      chips={[
                        property.formattedPrice,
                        `${property.areaM2} م²`,
                        `${property.rooms} غرف`,
                      ]}
                      pillLabel="سجل البيانات"
                      onPillAction={() => {
                        setActiveIndex(idx);
                        setIsDetailSheetOpen(true);
                      }}
                      height={360}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: Two StatCards of what we know + The most important missing item */}
          <div className="space-y-3.5">
            {/* Legend & What we know */}
            <div className="flex items-center justify-between px-1">
              <span className="text-[13px] font-medium text-muted">
                المعطيات المؤكدة
              </span>
              <div className="flex items-center gap-3 text-[11px] text-muted">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-sandstone" />
                  مؤكد
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full border border-muted" />
                  مجهول
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-copper" />
                  تعارض
                </span>
              </div>
            </div>

            {/* Two StatCards of what we know with certainty dots */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                label="سعر المتر التقديري"
                value={activeProperty.id === "p1" ? "5,870" : activeProperty.id === "p2" ? "5,870" : "5,390"}
                unit="ر.س / م²"
                icon={renderCertaintyDot("confirmed")}
                iconAriaLabel="مؤكد"
              />

              <StatCard
                label="زمن الوصول للعمل"
                value={activeProperty.travelTimeWorkMin}
                unit="دقيقة"
                icon={renderCertaintyDot("derived")}
                iconAriaLabel="مستنتج"
              />
            </div>

            {/* Most Important Missing Item as WideCard with an Input */}
            {activeProperty.id === "p1" && (
              <WideCard
                title="تعارض قياس المساحة"
                subtitle="فرق 12 م² بين الصك (148 م²) والإعلان (160 م²)"
                icon={renderCertaintyDot("conflicting")}
              >
                <div className="space-y-2 pt-1">
                  <span className="text-[12px] text-muted block">
                    اختر المساحة التي ترغب باعتمادها في الحساب:
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => resolveP1Area("148")}
                      className={`h-11 px-3 rounded-full text-[13px] font-medium transition-all flex items-center justify-center cursor-pointer ${
                        p1SelectedArea === "148"
                          ? "bg-sandstone text-espresso font-semibold"
                          : "bg-surface-2 text-muted border border-stroke hover:text-sandstone"
                      }`}
                    >
                      <bdi dir="ltr">148 م²</bdi> (المعاينة الفعلية)
                    </button>
                    <button
                      type="button"
                      onClick={() => resolveP1Area("160")}
                      className={`h-11 px-3 rounded-full text-[13px] font-medium transition-all flex items-center justify-center cursor-pointer ${
                        p1SelectedArea === "160"
                          ? "bg-sandstone text-espresso font-semibold"
                          : "bg-surface-2 text-muted border border-stroke hover:text-sandstone"
                      }`}
                    >
                      <bdi dir="ltr">160 م²</bdi> (حسب الإعلان)
                    </button>
                  </div>
                </div>
              </WideCard>
            )}

            {activeProperty.id === "p3" && (
              <WideCard
                title="عمر العقار غير محدد بدقة"
                subtitle="معرفة العمر تساعد في تقدير تكاليف الصيانة الدورية"
                icon={renderCertaintyDot("unknown")}
              >
                <div className="space-y-2 pt-1">
                  <span className="text-[12px] text-muted block">
                    أدخل أو اختر العمر التقريبي للمبنى:
                  </span>
                  <div className="flex gap-2">
                    {["سنة واحدة", "3 سنوات", "5 سنوات"].map((ageOption) => (
                      <button
                        key={ageOption}
                        type="button"
                        onClick={() => resolveP3Age(ageOption)}
                        className={`flex-1 h-11 px-2 rounded-full text-[13px] font-medium transition-all flex items-center justify-center cursor-pointer ${
                          p3BuildingAge === ageOption
                            ? "bg-sandstone text-espresso font-semibold"
                            : "bg-surface-2 text-muted border border-stroke hover:text-sandstone"
                        }`}
                      >
                        {ageOption}
                      </button>
                    ))}
                  </div>
                </div>
              </WideCard>
            )}

            {activeProperty.id === "p2" && (
              <WideCard
                title="شح الصفقات المماثلة في الحي"
                subtitle="قلة الصفقات المماثلة تزيد هامش تقدير القيمة العادلة"
                icon={renderCertaintyDot("unknown")}
                value={<span className="text-[13px] text-muted">مقبول للمقارنة</span>}
              />
            )}
          </div>
        </div>
      </div>

      {/* Pinned Bottom ActionBar */}
      <ActionBar
        primaryLabel={COPY.preflight.ctaReady || "متابعة إلى الدفع"}
        onPrimaryAction={() => router.push("/case/demo/checkout")}
        startIcon={<Bookmark className="w-5 h-5 text-sandstone" />}
        startAriaLabel="حفظ"
        endIcon={<ArrowLeft className="w-5 h-5 text-sandstone" />}
        endAriaLabel="متابعة"
        primaryVariant="sandstone"
        pinned={true}
      />

      {/* Details in a GlassSheet */}
      <GlassSheet
        isOpen={isDetailSheetOpen}
        onClose={() => setIsDetailSheetOpen(false)}
        title={`معطيات ${activeProperty.title}`}
        subtitle="تفاصيل ما نعرفه وما نجهله عن هذا العقار"
        initialSnap="half"
        variant="dark"
      >
        <div className="space-y-3 pt-2">
          {activeProperty.facts.map((fact) => (
            <div
              key={fact.id}
              className="p-4 rounded-[20px] bg-surface-2 border border-stroke space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-[14px] font-semibold text-sandstone">
                  {fact.label}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[12px] text-muted">
                    {fact.certainty === "confirmed"
                      ? "مؤكد"
                      : fact.certainty === "conflicting"
                      ? "تعارض مصادر"
                      : "غير معروف"}
                  </span>
                  {renderCertaintyDot(fact.certainty)}
                </div>
              </div>

              <p className="text-[13px] text-sandstone/90 leading-relaxed">
                {fact.value}
              </p>

              {fact.impactExplanation && (
                <p className="text-[12px] text-copper leading-relaxed pt-1 border-t border-stroke">
                  الأثر: {fact.impactExplanation}
                </p>
              )}
            </div>
          ))}
        </div>
      </GlassSheet>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Sparkles,
  Info,
  ChevronLeft,
  CheckCircle2,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { PropertyImage } from "@/components/ui/PropertyImage";
import { TickRing } from "@/components/ui/TickRing";
import { GlassSheet } from "@/components/ui/GlassSheet";
import { useAppStore } from "@/lib/store";
import { COPY } from "@/lib/copy";
import { formatNumber } from "@/lib/format";
import { PropertyItem } from "@/lib/seed";
import { getCoverImageForProperty } from "@/lib/images";

export default function PreflightPage() {
  const router = useRouter();
  const {
    properties,
    p1AreaResolved,
    p1SelectedArea,
    resolveP1Area,
    p3AgeResolved,
    p3BuildingAge,
    resolveP3Age,
  } = useAppStore();

  const [activePropertyForSheet, setActivePropertyForSheet] = useState<PropertyItem | null>(null);

  // Readiness Calculation
  const totalTasks = 2;
  const completedTasks = (p1AreaResolved ? 1 : 0) + (p3AgeResolved ? 1 : 0);
  const readinessPercent = Math.round((completedTasks / totalTasks) * 100);
  const isReady = readinessPercent === 100;

  return (
    <AppShell hideTopBar>
      {/* Header: Back Arrow, Headline, 5-Segment Progress Bar */}
      <header className="sticky top-0 z-40 w-full bg-[#FAF6EF]/92 backdrop-blur-md border-b border-[#E9DFD0]/70 px-4 sm:px-5 pt-3 pb-2.5 space-y-2" dir="rtl">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full glass-light border border-[#130F08]/10 text-[#130F08] hover:bg-[#E9DFD0]/60 flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-xs"
            aria-label="الرجوع للخلف"
          >
            <ArrowRight className="w-5 h-5 text-[#130F08]" />
          </button>

          {/* 1 Headline */}
          <h1 className="text-base font-semibold text-[#130F08]">
            {COPY.preflight.title}
          </h1>

          <div className="w-10 h-10" />
        </div>

        {/* 1 Supporting Line: 5-Segment Progress Bar */}
        <div className="flex items-center justify-between text-xs text-[#130F08]/75 font-medium">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 w-20" dir="rtl">
              {[1, 2, 3, 4, 5].map((step) => (
                <div
                  key={step}
                  className={`h-1 flex-1 rounded-full ${
                    step <= 3 ? "bg-[#130F08]" : "bg-[#E9DFD0]"
                  }`}
                />
              ))}
            </div>
            <span>
              <bdi dir="ltr">3 من 5</bdi>
            </span>
          </div>

          <span className="text-[11px] text-[#130F08]/75">
            {COPY.preflight.subtitle}
          </span>
        </div>
      </header>

      {/* Main Body (Strictly Max 3 Content Blocks) */}
      <div className="px-4 sm:px-5 pt-4 pb-32 flex-1 flex flex-col justify-between max-w-md mx-auto w-full" dir="rtl">
        <div className="space-y-4">
          {/* Content Block 1: Tick Ring Readiness Card at Top */}
          <div className="p-4 rounded-3xl glass-light border border-[#E9DFD0] shadow-xs relative overflow-hidden flex items-center gap-4 text-right">
            <div className="shrink-0">
              <TickRing progress={readinessPercent} size={80}>
                <div className="flex flex-col items-center justify-center">
                  <span className="text-sm font-bold text-[#130F08] tabular-nums">
                    <bdi dir="ltr">{readinessPercent}%</bdi>
                  </span>
                  <span className="text-[10px] text-[#130F08]/75">جاهزية</span>
                </div>
              </TickRing>
            </div>

            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#14756E]">
                  جاهزية البيانات
                </span>
                {isReady && (
                  <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-[#14756E] text-[#FAF6EF] font-semibold">
                    <Sparkles className="w-3 h-3" />
                    <span>مكتمل</span>
                  </span>
                )}
              </div>
              <h2 className="text-sm font-semibold text-[#130F08] leading-tight">
                {isReady ? COPY.preflight.readyText : COPY.preflight.incompleteText}
              </h2>
              <p className="text-[11px] text-[#130F08]/80 leading-relaxed">
                {isReady
                  ? "اكتملت المؤشرات المطلوبة، يمكنك الآن الانتقال للترتيب النهائي."
                  : `احسم النقطة الرئيسية لكل عقار بالأسفل لضمان مقارنة عادلة.`}
              </p>
            </div>
          </div>

          {/* Content Block 2: One Card Per Property with Photo Header & Single Most Important Missing Item */}
          <div className="space-y-3">
            {properties.map((property) => {
              const coverImage = property.images?.[0] || getCoverImageForProperty(property.id);

              // Single most important missing item per property
              let primaryMissing = {
                title: "بيانات الإعلان الأساسية",
                desc: "المواصفات مكتملة وجاهزة للمقارنة.",
                isResolved: true,
                component: null as React.ReactNode,
              };

              if (property.id === "p1") {
                primaryMissing = {
                  title: "تعارض في المساحة",
                  desc: "حدد المساحة المعتمدة بناءً على رغبتك أو الصك الإلكتروني:",
                  isResolved: p1AreaResolved,
                  component: (
                    <div className="flex items-center gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => resolveP1Area("148")}
                        className={`flex-1 min-h-[44px] px-3 py-2 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                          p1SelectedArea === "148"
                            ? "bg-[#130F08] text-[#FAF6EF] border-[#130F08]"
                            : "bg-white text-[#130F08] border-[#E9DFD0] hover:bg-[#FAF6EF]"
                        }`}
                      >
                        <bdi dir="ltr">148 م²</bdi> (صافي المعاينة)
                      </button>
                      <button
                        type="button"
                        onClick={() => resolveP1Area("160")}
                        className={`flex-1 min-h-[44px] px-3 py-2 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                          p1SelectedArea === "160"
                            ? "bg-[#130F08] text-[#FAF6EF] border-[#130F08]"
                            : "bg-white text-[#130F08] border-[#E9DFD0] hover:bg-[#FAF6EF]"
                        }`}
                      >
                        <bdi dir="ltr">160 م²</bdi> (حسب الصك)
                      </button>
                    </div>
                  ),
                };
              } else if (property.id === "p3") {
                primaryMissing = {
                  title: "عمر المبنى غير محدد بدقة",
                  desc: "تقدير عمر المبنى يساعد في حساب تكاليف الصيانة المستقبلية:",
                  isResolved: p3AgeResolved,
                  component: (
                    <div className="flex items-center gap-2 pt-2">
                      {[
                        { key: "جديد (سنة)", label: "جديد (سنة)" },
                        { key: "3 سنوات", label: <><bdi dir="ltr">3</bdi> سنوات</> },
                        { key: "5 سنوات", label: <><bdi dir="ltr">5</bdi> سنوات</> },
                      ].map((item) => (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => resolveP3Age(item.key)}
                          className={`flex-1 min-h-[44px] px-2 py-2 rounded-full text-xs font-semibold border transition-all cursor-pointer truncate ${
                            p3BuildingAge === item.key
                              ? "bg-[#130F08] text-[#FAF6EF] border-[#130F08]"
                              : "bg-white text-[#130F08] border-[#E9DFD0] hover:bg-[#FAF6EF]"
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  ),
                };
              } else {
                primaryMissing = {
                  title: "عزل الصوت الخارجي",
                  desc: "قريب من محاور رئيسية، يحتاج فحص الهدوء أثناء المعاينة.",
                  isResolved: true,
                  component: null,
                };
              }

              return (
                <div
                  key={property.id}
                  className="rounded-3xl glass-light border border-[#E9DFD0] overflow-hidden shadow-2xs text-right"
                >
                  {/* Photo Header */}
                  <div className="relative w-full h-28 overflow-hidden">
                    <PropertyImage
                      image={coverImage}
                      tone={property.colorTone || "sandstone"}
                      alt={property.title}
                      containerClassName="w-full h-full"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

                    <div className="absolute bottom-2.5 inset-x-3 flex items-center justify-between text-[#FAF6EF]">
                      <div>
                        <h3 className="text-xs sm:text-sm font-semibold truncate">
                          {property.title}
                        </h3>
                        <span className="text-[11px] text-[#FAF6EF]/80 font-normal">
                          {property.district}
                        </span>
                      </div>
                      <span className="text-xs font-bold tabular-nums">
                        <bdi dir="ltr">{formatNumber(property.price)} ر.س</bdi>
                      </span>
                    </div>
                  </div>

                  {/* Single Most Important Missing Item */}
                  <div className="p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#130F08] flex items-center gap-1.5">
                        {primaryMissing.isResolved ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#14756E]" />
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-[#C2643A]" />
                        )}
                        <span>{primaryMissing.title}</span>
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          primaryMissing.isResolved
                            ? "bg-[#14756E]/10 text-[#14756E]"
                            : "bg-[#C2643A]/10 text-[#C2643A]"
                        }`}
                      >
                        {primaryMissing.isResolved ? "تم الحسم" : "نقطة حرجة"}
                      </span>
                    </div>

                    <p className="text-[11px] text-[#130F08]/75 leading-relaxed">
                      {primaryMissing.desc}
                    </p>

                    {primaryMissing.component}

                    {/* Button opening sheet for the rest */}
                    <div className="pt-2 border-t border-[#130F08]/8 flex justify-end">
                      <button
                        type="button"
                        onClick={() => setActivePropertyForSheet(property)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#14756E] hover:underline cursor-pointer min-h-[36px]"
                      >
                        <span>باقي التفاصيل والنواقص (<bdi dir="ltr">{property.facts.length - 1}</bdi>)</span>
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 1 Primary Brass CTA (min 48px height) */}
        <div className="pt-6">
          <PrimaryButton
            label={COPY.preflight.ctaReady}
            onClick={() => router.push("/case/demo/checkout")}
            size="56"
            className="w-full shadow-lg"
          />
        </div>
      </div>

      {/* Details Sheet for Rest of Facts */}
      {activePropertyForSheet && (
        <GlassSheet
          isOpen={Boolean(activePropertyForSheet)}
          onClose={() => setActivePropertyForSheet(null)}
          title={`تفاصيل ونواقص ${activePropertyForSheet.title}`}
          subtitle="سجل المؤشرات والبيانات المعتمدة"
          variant="light"
          initialSnap="half"
        >
          <div className="space-y-3 text-right" dir="rtl">
            {activePropertyForSheet.facts.map((fact) => (
              <div
                key={fact.id}
                className="p-3 rounded-2xl bg-white border border-[#E9DFD0] space-y-1 shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#130F08]">
                    {fact.label}
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      fact.certainty === "confirmed"
                        ? "bg-[#14756E]/10 text-[#14756E]"
                        : fact.certainty === "conflicting"
                        ? "bg-[#C2643A]/10 text-[#C2643A]"
                        : "bg-[#130F08]/8 text-[#130F08]/75"
                    }`}
                  >
                    {fact.certainty === "confirmed" ? "مؤكد" : fact.certainty === "conflicting" ? "تعارض مصادر" : "غير معروف"}
                  </span>
                </div>
                <p className="text-xs text-[#130F08]/80 leading-relaxed">
                  {fact.value}
                </p>
              </div>
            ))}
          </div>
        </GlassSheet>
      )}
    </AppShell>
  );
}

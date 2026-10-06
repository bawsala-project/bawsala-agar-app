"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Link2,
  Image as ImageIcon,
  PenLine,
  Plus,
  Trash2,
  CheckCircle2,
  Compass,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PropertyImage } from "@/components/ui/PropertyImage";
import { SurveyBrackets } from "@/components/ui/SurveyBrackets";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { useAppStore } from "@/lib/store";
import { COPY } from "@/lib/copy";
import { BdiNumber, formatNumber } from "@/lib/format";

export default function PropertiesPage() {
  const router = useRouter();
  const {
    properties,
    setAddSheetOpen,
    removeProperty,
  } = useAppStore();

  const [extractedMap] = useState<Record<string, boolean>>({
    p1: true,
    p2: true,
    p3: true,
  });

  const maxSlots = 5;
  const emptySlotsCount = Math.max(0, maxSlots - properties.length);

  return (
    <AppShell
      showStepper
      activeStep="properties"
      backHref="/case/demo/needs"
      pageTitle={COPY.properties.title}
    >
      <div className="relative z-10 flex-1 flex flex-col justify-between px-5 pt-6 pb-32 max-w-lg mx-auto w-full">
        <div className="space-y-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-1.5 text-right"
          >
            <div className="flex items-center justify-between">
              <span className="eyebrow-caption text-[#130F08]/65 block font-medium">
                الخطوة 02 // إدخال الخيارات
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#FAF6EF] border border-[#E9DFD0] text-[#130F08] font-semibold">
                {COPY.properties.slotsCounter(properties.length)}
              </span>
            </div>

            <h1 className="text-2xl md:text-[28px] font-semibold text-[#130F08]">
              {COPY.properties.title}
            </h1>
            <p className="text-xs text-[#130F08]/70 leading-relaxed font-normal">
              {COPY.properties.subtitle}
            </p>
          </motion.div>

          {/* Three Entry Tiles with SurveyBrackets */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
            className="grid grid-cols-3 gap-3"
          >
            {/* Tile 1: Link */}
            <SurveyBrackets active={true} size={8} color="#14756E">
              <button
                type="button"
                onClick={() => setAddSheetOpen(true)}
                className="w-full p-3.5 rounded-2xl glass-light border border-[#130F08]/10 hover:border-[#130F08]/25 transition-all flex flex-col items-center justify-center gap-2 cursor-pointer active:scale-95 group shadow-xs"
              >
                {/* 48px glass circle */}
                <div className="w-12 h-12 rounded-full glass-light border border-[#130F08]/12 flex items-center justify-center text-[#14756E] group-hover:scale-105 transition-all shadow-xs">
                  <Link2 className="w-5 h-5" />
                </div>
                <span className="text-xs font-semibold text-[#130F08]">
                  رابط إعلان
                </span>
              </button>
            </SurveyBrackets>

            {/* Tile 2: Screenshot */}
            <SurveyBrackets active={true} size={8} color="#14756E">
              <button
                type="button"
                onClick={() => setAddSheetOpen(true)}
                className="w-full p-3.5 rounded-2xl glass-light border border-[#130F08]/10 hover:border-[#130F08]/25 transition-all flex flex-col items-center justify-center gap-2 cursor-pointer active:scale-95 group shadow-xs"
              >
                {/* 48px glass circle */}
                <div className="w-12 h-12 rounded-full glass-light border border-[#130F08]/12 flex items-center justify-center text-[#14756E] group-hover:scale-105 transition-all shadow-xs">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <span className="text-xs font-semibold text-[#130F08]">
                  صورة / لقطة
                </span>
              </button>
            </SurveyBrackets>

            {/* Tile 3: Manual Entry */}
            <SurveyBrackets active={true} size={8} color="#14756E">
              <button
                type="button"
                onClick={() => setAddSheetOpen(true)}
                className="w-full p-3.5 rounded-2xl glass-light border border-[#130F08]/10 hover:border-[#130F08]/25 transition-all flex flex-col items-center justify-center gap-2 cursor-pointer active:scale-95 group shadow-xs"
              >
                {/* 48px glass circle */}
                <div className="w-12 h-12 rounded-full glass-light border border-[#130F08]/12 flex items-center justify-center text-[#14756E] group-hover:scale-105 transition-all shadow-xs">
                  <PenLine className="w-5 h-5" />
                </div>
                <span className="text-xs font-semibold text-[#130F08]">
                  إدخال يدوي
                </span>
              </button>
            </SurveyBrackets>
          </motion.div>

          {/* Properties Stack List */}
          <div className="space-y-3 pt-2">
            <AnimatePresence mode="popLayout">
              {properties.map((property, idx) => {
                const isExtracted = extractedMap[property.id] ?? true;

                return (
                  <motion.div
                    key={property.id}
                    layout
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.35, delay: idx * 0.05 }}
                    className="relative overflow-hidden rounded-3xl glass-light border border-[#130F08]/10 p-3.5 group hover:border-[#130F08]/25 transition-all shadow-xs"
                  >
                    <div className="flex items-center gap-3.5">
                      {/* PropertyImage Capsule Thumbnail */}
                      <div className="w-16 h-22 shrink-0">
                        <PropertyImage
                          image={property.images?.[0]}
                          shape="capsule"
                          tone={property.colorTone || "sandstone"}
                          alt={property.title}
                          priority={idx === 0}
                          containerClassName="w-16 h-22 shadow-xs"
                        />
                      </div>

                      {/* Info & Extraction Status */}
                      <div className="flex-1 min-w-0 space-y-1.5 text-right">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-sm font-semibold text-[#130F08] truncate">
                            {property.title}
                          </h3>
                          <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#FAF6EF] border border-[#E9DFD0] text-[#130F08] shrink-0 font-medium">
                            {property.sourceLabel}
                          </span>
                        </div>

                        <div className="flex items-baseline gap-2">
                          <BdiNumber
                            value={formatNumber(property.price)}
                            unit="ر.س"
                            className="text-base font-semibold text-[#130F08]"
                          />
                          <span className="text-xs text-[#130F08]/65">
                            • <BdiNumber value={property.areaM2} unit="م²" /> • {property.district}
                          </span>
                        </div>

                        {/* Extraction Status Line */}
                        <div className="flex items-center justify-between pt-1">
                          <div className="flex items-center gap-1.5">
                            {isExtracted ? (
                              <div className="flex items-center gap-1.5 text-xs text-[#14756E] font-medium">
                                <CheckCircle2 className="w-3.5 h-3.5 text-[#14756E]" />
                                <span>تم استخراج البيانات بنجاح</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 text-xs text-[#130F08]/70">
                                <motion.div
                                  animate={{ rotate: 360 }}
                                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                >
                                  <Compass className="w-3.5 h-3.5 text-[#130F08]/65" />
                                </motion.div>
                                <span>جارٍ قراءة وفحص المصدر...</span>
                              </div>
                            )}
                          </div>

                          {/* Delete action */}
                          <button
                            type="button"
                            onClick={() => removeProperty(property.id)}
                            className="p-1.5 rounded-full text-[#130F08]/50 hover:text-[#C2643A] hover:bg-[#C2643A]/10 transition-colors cursor-pointer"
                            title="حذف العقار"
                            aria-label={`حذف ${property.title}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* Dashed Capsule Placeholders */}
            {Array.from({ length: emptySlotsCount }).map((_, idx) => (
              <button
                key={`empty-slot-${idx}`}
                type="button"
                onClick={() => setAddSheetOpen(true)}
                className="w-full h-16 rounded-full border-2 border-dashed border-[#E9DFD0] hover:border-[#14756E] bg-white/40 flex items-center justify-center gap-2 text-xs text-[#130F08]/65 hover:text-[#130F08] transition-all cursor-pointer group shadow-2xs"
              >
                <Plus className="w-4 h-4 text-[#130F08]/50 group-hover:text-[#14756E] transition-colors" />
                <span className="font-semibold text-xs">
                  إضافة عقار آخر ({properties.length + idx + 1} من {maxSlots})
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Sticky Action Footer */}
        <div className="fixed bottom-0 inset-x-0 mx-auto max-w-[430px] p-6 bg-gradient-to-t from-[#FAF6EF] via-[#FAF6EF]/95 to-transparent pt-10 z-30 pointer-events-none">
          <div className="pointer-events-auto">
            <PrimaryButton
              label={COPY.properties.cta}
              onClick={() => router.push("/case/demo/preflight")}
              disabled={properties.length === 0}
              className="w-full shadow-xl"
              size="56"
            />
          </div>
        </div>
      </div>
    </AppShell>
  );
}

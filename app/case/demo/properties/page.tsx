"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Link2,
  Image as ImageIcon,
  PenLine,
  Trash2,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PropertyImage } from "@/components/ui/PropertyImage";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { MapView } from "@/components/ui/MapView";
import { useAppStore } from "@/lib/store";
import { COPY } from "@/lib/copy";
import { formatNumber } from "@/lib/format";
import { getCoverImageForProperty } from "@/lib/images";

export default function PropertiesPage() {
  const router = useRouter();
  const {
    properties,
    setAddSheetOpen,
    removeProperty,
  } = useAppStore();

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

          {/* 1 Headline: "أضف العقارات" */}
          <h1 className="text-base font-semibold text-[#130F08]">
            {COPY.properties.title}
          </h1>

          <div className="w-10 h-10" />
        </div>

        {/* 1 Supporting Line: 5-Segment Progress Bar */}
        <div className="flex items-center justify-between text-xs text-[#130F08]/65 font-medium">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 w-20" dir="rtl">
              {[1, 2, 3, 4, 5].map((step) => (
                <div
                  key={step}
                  className={`h-1 flex-1 rounded-full ${
                    step <= 2 ? "bg-[#130F08]" : "bg-[#E9DFD0]"
                  }`}
                />
              ))}
            </div>
            <span>
              <bdi dir="ltr">2 من 5</bdi>
            </span>
          </div>

          <span className="text-[11px] text-[#130F08]/60">
            {COPY.properties.slotsCounter(properties.length)}
          </span>
        </div>
      </header>

      {/* Main Body (Strictly Max 3 Content Blocks) */}
      <div className="px-4 sm:px-5 pt-4 pb-32 flex-1 flex flex-col justify-between max-w-md mx-auto w-full" dir="rtl">
        <div className="space-y-4">
          {/* Content Block 1: Add Options as Three Glass Tiles */}
          <div className="grid grid-cols-3 gap-2.5">
            <button
              type="button"
              onClick={() => setAddSheetOpen(true)}
              className="p-3 rounded-2xl glass-light border border-[#130F08]/10 hover:border-[#130F08]/25 transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer active:scale-95 shadow-2xs min-h-[84px]"
            >
              <div className="w-10 h-10 rounded-full glass-light border border-[#130F08]/10 flex items-center justify-center text-[#14756E] shadow-2xs">
                <Link2 className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-[#130F08]">
                رابط إعلان
              </span>
            </button>

            <button
              type="button"
              onClick={() => setAddSheetOpen(true)}
              className="p-3 rounded-2xl glass-light border border-[#130F08]/10 hover:border-[#130F08]/25 transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer active:scale-95 shadow-2xs min-h-[84px]"
            >
              <div className="w-10 h-10 rounded-full glass-light border border-[#130F08]/10 flex items-center justify-center text-[#14756E] shadow-2xs">
                <ImageIcon className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-[#130F08]">
                صورة / لقطة
              </span>
            </button>

            <button
              type="button"
              onClick={() => setAddSheetOpen(true)}
              className="p-3 rounded-2xl glass-light border border-[#130F08]/10 hover:border-[#130F08]/25 transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer active:scale-95 shadow-2xs min-h-[84px]"
            >
              <div className="w-10 h-10 rounded-full glass-light border border-[#130F08]/10 flex items-center justify-center text-[#14756E] shadow-2xs">
                <PenLine className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-[#130F08]">
                إدخال يدوي
              </span>
            </button>
          </div>

          {/* Content Block 2: Property Cards as Photo Cards (PropertyImage) with small glass status chip */}
          <div className="space-y-3">
            <AnimatePresence mode="popLayout" initial={false}>
              {properties.map((property) => {
                const coverImage = property.images?.[0] || getCoverImageForProperty(property.id);

                return (
                  <motion.div
                    key={property.id}
                    layout
                    initial={false}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="p-3 rounded-2xl glass-light border border-[#E9DFD0] flex items-center gap-3 shadow-2xs relative"
                  >
                    {/* Thumbnail using PropertyImage */}
                    <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 border border-[#E9DFD0] relative">
                      <PropertyImage
                        image={coverImage}
                        tone={property.colorTone || "sandstone"}
                        alt={property.title}
                        containerClassName="w-full h-full"
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Details with max 3 chips */}
                    <div className="flex-1 min-w-0 space-y-1 text-right">
                      {/* Small glass status chip */}
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-full glass-dark text-[10px] font-semibold text-[#FAF6EF] shadow-2xs flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-[#14756E]" />
                          <span>تمت القراءة</span>
                        </span>
                        <span className="text-[11px] text-[#130F08]/65 font-medium truncate">
                          {property.sourceLabel}
                        </span>
                      </div>

                      <h2 className="text-xs sm:text-sm font-semibold text-[#130F08] truncate">
                        {property.title}
                      </h2>

                      {/* Max 3 Chips: Price, Area, District */}
                      <div className="flex items-center gap-1.5 text-[11px] text-[#130F08]/75">
                        <span className="font-bold text-[#130F08]">
                          <bdi dir="ltr">{formatNumber(property.price)} ر.س</bdi>
                        </span>
                        <span>•</span>
                        <span>
                          <bdi dir="ltr">{property.areaM2} م²</bdi>
                        </span>
                        <span>•</span>
                        <span className="truncate">{property.district}</span>
                      </div>
                    </div>

                    {/* Delete button (at least 48px tap target) */}
                    {properties.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeProperty(property.id)}
                        className="w-12 h-12 rounded-full flex items-center justify-center text-[#130F08]/40 hover:text-[#C2643A] active:scale-95 transition-all cursor-pointer shrink-0"
                        title="حذف هذا العقار"
                        aria-label="حذف هذا العقار"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Content Block 3: Map Pins Mini Card */}
          <div className="rounded-2xl border border-[#E9DFD0] overflow-hidden shadow-2xs bg-[#FAF6EF]">
            <MapView
              variant="mini"
              properties={properties}
              className="w-full h-36"
            />
          </div>
        </div>

        {/* 1 Primary Brass CTA (min 48px height) */}
        <div className="pt-6">
          <PrimaryButton
            label={COPY.properties.cta}
            onClick={() => router.push("/case/demo/preflight")}
            size="56"
            className="w-full shadow-lg"
          />
        </div>
      </div>
    </AppShell>
  );
}

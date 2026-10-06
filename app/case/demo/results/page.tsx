"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import {
  ArrowRight,
  ArrowLeft,
  Bookmark,
  Sparkles,
  Columns,
  Clock,
  ChevronLeft,
  HelpCircle,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PropertyImage } from "@/components/ui/PropertyImage";
import { NeedleBadge } from "@/components/ui/NeedleBadge";
import { StatusPill } from "@/components/ui/StatusPill";
import { GlassSheet } from "@/components/ui/GlassSheet";
import { MapView } from "@/components/ui/MapView";
import { useAppStore } from "@/lib/store";
import { COPY } from "@/lib/copy";
import { PropertyItem } from "@/lib/seed";
import { getCoverImageForProperty } from "@/lib/images";
import { formatNumber } from "@/lib/format";

export default function ResultsPage() {
  const router = useRouter();
  const {
    properties,
    rankingMode,
    setRankingMode,
    isReassessed,
    bookmarkedIds,
    toggleBookmark,
    setLoginSheetOpen,
  } = useAppStore();

  const [isWhyOrderOpen, setIsWhyOrderOpen] = useState(false);
  const [isMissingSheetOpen, setIsMissingSheetOpen] = useState(false);
  const [dragDirection, setDragDirection] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // Cycle ranking mode for demo toggle
  const handleToggleStatusMode = () => {
    if (rankingMode === "ranked") setRankingMode("provisional");
    else if (rankingMode === "provisional") setRankingMode("insufficient");
    else setRankingMode("ranked");
  };

  // Sort properties by current active rank
  const sortedProperties = [...properties].sort((a, b) => {
    const rankA = isReassessed ? a.postRank : a.preRank;
    const rankB = isReassessed ? b.postRank : b.preRank;
    return rankA - rankB;
  });

  // Local card deck queue for swipe gestures
  const [deckProperties, setDeckProperties] = useState<PropertyItem[]>(sortedProperties);

  // Synchronize when store properties or assessment changes
  useEffect(() => {
    setDeckProperties(sortedProperties);
  }, [properties, isReassessed]);

  const displayProperties = deckProperties.length > 0 ? deckProperties : sortedProperties;
  const activeTopProperty = displayProperties[0] || sortedProperties[0];

  // Send top card to back of deck
  const sendToBack = (direction: number = 1) => {
    setDragDirection(direction);
    setDeckProperties((prev) => {
      const source = prev.length > 0 ? prev : sortedProperties;
      if (source.length <= 1) return source;
      const [top, ...rest] = source;
      return [...rest, top];
    });
  };

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    const threshold = 60;
    const velocityThreshold = 250;
    if (Math.abs(info.offset.x) > threshold || Math.abs(info.velocity.x) > velocityThreshold) {
      sendToBack(info.offset.x > 0 ? 1 : -1);
    }
    setTimeout(() => {
      setIsDragging(false);
    }, 60);
  };

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/case/demo/preflight");
    }
  };

  // Unconfirmed / missing facts for the current top property
  const activeMissingFacts = activeTopProperty?.facts.filter(
    (f) => f.certainty === "unknown" || f.certainty === "conflicting"
  ) || [];

  return (
    <AppShell hideTopBar>
      {/* 1. Header: Back Arrow, Small Title "الأنسب لك", Bookmark Circle */}
      <header className="sticky top-0 z-40 w-full bg-[#FAF6EF]/92 backdrop-blur-md border-b border-[#E9DFD0]/70 px-4 sm:px-5 pt-3 pb-2.5 space-y-2" dir="rtl">
        <div className="flex items-center justify-between">
          {/* Back arrow (RTL points right) */}
          <button
            type="button"
            onClick={handleBack}
            className="w-10 h-10 rounded-full glass-light border border-[#130F08]/10 text-[#130F08] hover:bg-[#E9DFD0]/60 flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-xs"
            aria-label="الرجوع للخلف"
          >
            <ArrowRight className="w-5 h-5 text-[#130F08]" />
          </button>

          {/* 1 Headline: "الأنسب لك" */}
          <h1 className="text-base font-semibold text-[#130F08]">
            الأنسب لك
          </h1>

          {/* Bookmark circle */}
          <button
            type="button"
            onClick={() => setLoginSheetOpen(true)}
            className="w-10 h-10 rounded-full glass-light border border-[#130F08]/10 text-[#130F08] hover:bg-[#E9DFD0]/60 flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-xs"
            title="حفظ الحالة"
            aria-label="حفظ الحالة"
          >
            <Bookmark className="w-4 h-4 text-[#130F08]" />
          </button>
        </div>

        {/* 1 Supporting Line: Thin 5-Segment Progress Bar, "3 من 5", and "لماذا هذا الترتيب؟" trigger */}
        <div className="flex items-center justify-between text-xs text-[#130F08]/65 font-medium">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 w-20" dir="rtl">
              {[1, 2, 3, 4, 5].map((step) => {
                const isFilled = step <= 3;
                return (
                  <div
                    key={step}
                    className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                      isFilled ? "bg-[#130F08]" : "bg-[#E9DFD0]"
                    }`}
                  />
                );
              })}
            </div>
            <span className="select-none">
              <bdi dir="ltr">3 من 5</bdi>
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsWhyOrderOpen(true)}
            className="inline-flex items-center gap-1 text-[11px] text-[#14756E] hover:underline cursor-pointer font-medium"
          >
            <Sparkles className="w-3 h-3 text-[#14756E]" />
            <span>لماذا هذا الترتيب؟</span>
          </button>
        </div>
      </header>

      {/* Main Body (Strictly Max 3 Content Blocks, with Reserved Bottom Padding) */}
      <div className="px-4 sm:px-5 pt-3 pb-36 flex-1 flex flex-col space-y-3.5 max-w-md mx-auto w-full" dir="rtl">
        {/* Content Block 1: Hero Full-Bleed Photo Card Deck (~62vh) + Pagination Dots */}
        <div className="space-y-2">
          <div className="relative w-full h-[62vh] min-h-[420px] max-h-[560px] overflow-visible select-none">
            <AnimatePresence mode="popLayout" initial={false}>
              {displayProperties.slice(0, 3).map((property, idx) => {
                const isTop = idx === 0;
                const currentRank = isReassessed ? property.postRank : property.preRank;
                const isBookmarked = bookmarkedIds.includes(property.id);
                const coverImage = property.images?.[0] || getCoverImageForProperty(property.id);

                const scale = isTop ? 1 : idx === 1 ? 0.94 : 0.88;
                const yOffset = isTop ? 0 : idx === 1 ? 14 : 28;
                const opacity = isTop ? 1 : idx === 1 ? 0.85 : 0.65;
                const zIndex = 30 - idx * 10;

                return (
                  <motion.div
                    key={property.id}
                    layout
                    drag={isTop ? "x" : false}
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.65}
                    onDragStart={isTop ? () => setIsDragging(true) : undefined}
                    onDragEnd={isTop ? handleDragEnd : undefined}
                    initial={false}
                    animate={{
                      scale,
                      y: yOffset,
                      opacity,
                      zIndex,
                    }}
                    exit={{
                      x: dragDirection > 0 ? 320 : -320,
                      opacity: 0,
                      rotate: dragDirection > 0 ? 9 : -9,
                      transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 240,
                      damping: 24,
                    }}
                    style={{ zIndex }}
                    onClick={() => {
                      if (isTop && !isDragging) {
                        router.push(`/case/demo/property/${property.id}`);
                      }
                    }}
                    className={`absolute inset-0 w-full h-full origin-top rounded-[28px] overflow-hidden shadow-xl ${
                      isTop ? "cursor-grab active:cursor-grabbing" : "pointer-events-none"
                    }`}
                  >
                    {/* Full-bleed Photo Cover */}
                    <div className="relative w-full h-full">
                      <PropertyImage
                        image={coverImage}
                        tone={property.colorTone || "sandstone"}
                        alt={property.title}
                        priority={isTop}
                        containerClassName="w-full h-full rounded-[28px] overflow-hidden"
                        className="w-full h-full object-cover"
                      />

                      {/* Gradient Scrim Overlays */}
                      <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/60 via-black/20 to-transparent pointer-events-none z-10" />
                      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/85 via-black/40 to-transparent pointer-events-none z-10" />

                      {/* Top-Start Glass-Dark Chip: Visit Priority with NeedleBadge */}
                      <div className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 z-20 pointer-events-auto">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full glass-dark border border-white/20 shadow-md">
                          <NeedleBadge rank={currentRank as 1 | 2 | 3} size="sm" variant="dark" />
                          <span className="text-xs font-semibold text-[#FAF6EF]">
                            {property.visitPriority === "high"
                              ? "أولوية مرتفعة"
                              : property.visitPriority === "medium"
                              ? "أولوية متوسطة"
                              : property.visitPriority === "low"
                              ? "أولوية منخفضة"
                              : "غير كافٍ"}
                          </span>
                        </div>
                      </div>

                      {/* Top-End Glass Circle: Save / Bookmark */}
                      <div className="absolute top-3.5 left-3.5 sm:top-4 sm:left-4 z-20 pointer-events-auto">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleBookmark(property.id);
                          }}
                          className="w-10 h-10 rounded-full glass-dark border border-white/20 flex items-center justify-center text-[#FAF6EF] shadow-md hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
                          title="حفظ هذا العقار"
                          aria-label="حفظ هذا العقار"
                        >
                          <Bookmark
                            className={`w-4 h-4 transition-colors ${
                              isBookmarked ? "fill-[#E3A83A] text-[#E3A83A]" : "text-[#FAF6EF]"
                            }`}
                          />
                        </button>
                      </div>

                      {/* Bottom Area: Glass-Dark Panel & Under-Panel Mini-Chips */}
                      <div className="absolute bottom-3.5 inset-x-3.5 sm:bottom-4 sm:inset-x-4 z-20 space-y-2 pointer-events-auto">
                        {/* Glass-Dark Bottom Panel */}
                        <div className="p-3.5 sm:p-4 rounded-2xl glass-dark border border-white/20 backdrop-blur-xl shadow-lg space-y-1.5">
                          <div className="space-y-0.5">
                            <h2 className="text-base sm:text-lg md:text-xl font-semibold text-[#FAF6EF] leading-tight truncate">
                              {property.title}
                            </h2>
                            <p className="text-xs text-[#FAF6EF]/75 font-normal truncate">
                              {property.district}
                            </p>
                          </div>
                          <div className="pt-0.5">
                            <bdi dir="ltr" className="text-xl sm:text-2xl md:text-[26px] font-bold text-[#FAF6EF] tabular-nums block">
                              {formatNumber(property.price)} <span className="text-xs font-medium text-[#FAF6EF]/80">ر.س</span>
                            </bdi>
                          </div>
                        </div>

                        {/* Under the panel, max three glass mini-chips: area, rooms, travel time to work */}
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <div className="px-2.5 sm:px-3 py-1 rounded-full glass-dark border border-white/20 text-[11px] sm:text-xs font-medium text-[#FAF6EF] backdrop-blur-md shadow-xs shrink-0">
                            <bdi dir="ltr">{property.areaM2} م²</bdi>
                          </div>
                          <div className="px-2.5 sm:px-3 py-1 rounded-full glass-dark border border-white/20 text-[11px] sm:text-xs font-medium text-[#FAF6EF] backdrop-blur-md shadow-xs shrink-0">
                            <bdi dir="ltr">{property.rooms} غرف</bdi>
                          </div>
                          <div className="px-2.5 sm:px-3 py-1 rounded-full glass-dark border border-white/20 text-[11px] sm:text-xs font-medium text-[#FAF6EF] backdrop-blur-md shadow-xs flex items-center gap-1 shrink-0">
                            <Clock className="w-3 h-3 text-[#E3A83A]" />
                            <bdi dir="ltr">{property.travelTimeWorkMin} د للعمل</bdi>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Below the Deck: Pagination Dots */}
          <div className="flex items-center justify-center gap-2 pt-1 pb-0.5">
            {sortedProperties.map((p, idx) => {
              const isCurrent = activeTopProperty?.id === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    const indexInDeck = displayProperties.findIndex((item) => item.id === p.id);
                    if (indexInDeck > 0) {
                      setDeckProperties((prev) => {
                        const rest = [...prev];
                        const [selected] = rest.splice(indexInDeck, 1);
                        return [selected, ...rest];
                      });
                    }
                  }}
                  className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                    isCurrent ? "w-6 bg-[#130F08]" : "w-2 bg-[#E9DFD0] hover:bg-[#130F08]/40"
                  }`}
                  aria-label={`عقار ${idx + 1}`}
                />
              );
            })}
          </div>
        </div>

        {/* Content Block 2: Mini <MapView> Card (Three property pins + work pin) */}
        <div className="rounded-2xl border border-[#E9DFD0] overflow-hidden shadow-2xs bg-[#FAF6EF]">
          <MapView
            variant="mini"
            selectedPropertyId={activeTopProperty?.id}
            className="w-full h-36 sm:h-40"
          />
        </div>

        {/* Content Block 3: One Collapsed Row "ما ينقص؟" */}
        <button
          type="button"
          onClick={() => setIsMissingSheetOpen(true)}
          className="w-full p-3 sm:p-3.5 rounded-2xl glass-light border border-[#130F08]/10 flex items-center justify-between hover:bg-white/80 active:scale-[0.99] transition-all cursor-pointer shadow-2xs text-right"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#FAF6EF] border border-[#E9DFD0] flex items-center justify-center text-[#14756E] shrink-0 shadow-2xs">
              <HelpCircle className="w-4 h-4 text-[#14756E]" />
            </div>
            <div className="text-right">
              <span className="text-xs font-semibold text-[#130F08] block leading-tight">
                ما ينقص؟
              </span>
              <span className="text-[11px] text-[#130F08]/65 font-normal">
                <bdi dir="ltr">{activeMissingFacts.length}</bdi> نقاط غير مؤكدة بانتظار المعاينة
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 text-xs text-[#14756E] font-medium">
            <span>عرض النواقص</span>
            <ChevronLeft className="w-4 h-4 text-[#14756E]" />
          </div>
        </button>
      </div>

      {/* Floating Glass Bar: 48px circle "مقارنة" button + ONE primary brass pill CTA "التفاصيل" */}
      <div className="fixed bottom-5 inset-x-3 sm:inset-x-4 mx-auto max-w-[390px] z-30 pointer-events-none" dir="rtl">
        <div className="pointer-events-auto p-1.5 rounded-full glass-light border border-white/80 shadow-[0_12px_36px_rgba(19,15,8,0.14)] backdrop-blur-2xl flex items-center gap-2.5 bg-[#FAF6EF]/90">
          {/* 48px Circle "مقارنة" Button */}
          <Link
            href="/case/demo/compare"
            className="w-12 h-12 rounded-full glass-light border border-[#130F08]/15 flex items-center justify-center text-[#130F08] hover:bg-[#E9DFD0]/60 active:scale-95 transition-all shadow-xs shrink-0 cursor-pointer group"
            title="مقارنة الخيارات"
            aria-label="مقارنة"
          >
            <Columns className="w-5 h-5 text-[#130F08] group-hover:scale-105 transition-transform" />
          </Link>

          {/* ONE Primary Brass Pill CTA "التفاصيل" */}
          <Link
            href={`/case/demo/property/${activeTopProperty.id}`}
            className="flex-1 h-12 px-6 rounded-full font-semibold text-sm text-[#130F08] shadow-[0_4px_16px_rgba(227,168,58,0.45)] hover:shadow-[0_6px_22px_rgba(227,168,58,0.6)] flex items-center justify-between active:scale-[0.98] transition-all cursor-pointer relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #E3A83A 0%, #F0C060 100%)",
            }}
          >
            <span className="absolute inset-x-4 top-0 h-[1px] bg-white/40 pointer-events-none" />
            <span className="text-sm font-semibold text-[#130F08]">
              التفاصيل
            </span>
            <span className="w-8 h-8 rounded-full bg-[#130F08] text-[#FAF6EF] flex items-center justify-center shrink-0 shadow-xs">
              <ArrowLeft className="w-4 h-4 text-[#FAF6EF]" />
            </span>
          </Link>
        </div>
      </div>

      {/* GlassSheet 1: Opened by "ما ينقص؟" */}
      <GlassSheet
        isOpen={isMissingSheetOpen}
        onClose={() => setIsMissingSheetOpen(false)}
        title="ما ينقص؟"
        subtitle={`بيانات غير مكتملة في ${activeTopProperty.title}`}
        variant="light"
        initialSnap="half"
      >
        <div className="space-y-4 text-right" dir="rtl">
          {/* Informational Callout */}
          <div className="p-3.5 rounded-2xl bg-[#FAF6EF] border border-[#E9DFD0] text-xs text-[#130F08]/80 leading-relaxed space-y-1">
            <span className="font-semibold text-[#14756E] block text-xs">
              أسباب النقص الموضوعية:
            </span>
            <p>
              هذه النقاط لم يفصح عنها المعلن بوثائق رسمية مؤكدة، أو تتطلب معاينة ميدانية مباشرة لحسمها قبل اتخاذ قرار الشراء.
            </p>
          </div>

          {/* Missing Facts List for Active Property */}
          <div className="space-y-2.5">
            {activeMissingFacts.length > 0 ? (
              activeMissingFacts.map((fact) => (
                <div
                  key={fact.id}
                  className="p-3 rounded-xl bg-white border border-[#E9DFD0] space-y-1 shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#130F08]">
                      {fact.label}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        fact.certainty === "conflicting"
                          ? "bg-[#C2643A]/10 text-[#C2643A] border border-[#C2643A]/25"
                          : "bg-[#130F08]/8 text-[#130F08]/75 border border-[#130F08]/15"
                      }`}
                    >
                      {fact.certainty === "conflicting" ? "تعارض مصادر" : "غير معروف"}
                    </span>
                  </div>
                  <p className="text-xs text-[#130F08]/75 leading-relaxed">
                    {fact.value}
                  </p>
                  {fact.impactExplanation && (
                    <p className="text-[11px] text-[#14756E] font-medium pt-0.5">
                      الأثر: {fact.impactExplanation}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <p className="text-xs text-[#130F08]/65 text-center py-4">
                لا توجد نواقص جوهرية مسجلة لهذا العقار حالياً.
              </p>
            )}
          </div>

          {/* Action button: Proceed to Field Inspection */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                setIsMissingSheetOpen(false);
                router.push("/case/demo/inspection");
              }}
              className="w-full h-12 rounded-full font-semibold text-xs text-[#FAF6EF] bg-[#130F08] hover:bg-[#3D271A] flex items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer shadow-md"
            >
              <span>إدراج هذه النقاط في قائمة المعاينة الميدانية</span>
              <ArrowLeft className="w-4 h-4 text-[#FAF6EF]" />
            </button>
          </div>
        </div>
      </GlassSheet>

      {/* GlassSheet 2: Opened by "لماذا هذا الترتيب؟" */}
      <GlassSheet
        isOpen={isWhyOrderOpen}
        onClose={() => setIsWhyOrderOpen(false)}
        title="لماذا هذا الترتيب؟"
        subtitle="معايير المفاضلة وتوزيع الأوزان بدون تحيز"
        variant="light"
        initialSnap="half"
      >
        <div className="space-y-4 text-right" dir="rtl">
          {/* Summary Card content */}
          <div className="p-4 rounded-2xl bg-[#FAF6EF] border border-[#E9DFD0] space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-medium text-[#130F08]/65 block mb-0.5">
                  الخطوة <bdi dir="ltr">04</bdi> // الترتيب والمفاضلة
                </span>
                <h2 className="text-lg font-semibold text-[#130F08]">
                  ما نراه <span className="font-semibold text-[#14756E]">بوضوح</span>
                </h2>
              </div>
              <div
                onClick={handleToggleStatusMode}
                className="cursor-pointer group relative"
                title="انقر لتبديل حالة الترتيب"
              >
                <StatusPill status={rankingMode} />
              </div>
            </div>

            <p className="text-xs text-[#130F08]/75 leading-relaxed font-normal">
              {isReassessed
                ? "تم تحديث الترتيب ومستويات الاطمئنان بعد تسجيل ملاحظات المعاينة الميدانية."
                : COPY.results.subtitle}
            </p>

            <div className="pt-2 flex items-center justify-between border-t border-[#130F08]/10 text-xs">
              <Link
                href="/case/demo/compare"
                onClick={() => setIsWhyOrderOpen(false)}
                className="font-semibold text-[#14756E] hover:underline flex items-center gap-1.5 transition-colors"
              >
                <Columns className="w-3.5 h-3.5 text-[#14756E]" />
                <span>مقارنة تفصيلية جنباً إلى جنب</span>
              </Link>
              <span className="text-[#130F08]/65 font-medium">
                <bdi dir="ltr">3</bdi> عقارات
              </span>
            </div>
          </div>

          {/* Notice Card content */}
          {!isReassessed && (
            <div className="p-3.5 rounded-2xl bg-[#FAF6EF] border border-[#E9DFD0] flex items-center gap-3 text-right shadow-xs">
              <div className="w-9 h-9 rounded-full glass-light border border-[#130F08]/10 flex items-center justify-center shrink-0 text-[#14756E]">
                <Sparkles className="w-4 h-4 text-[#14756E]" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-[#130F08]">
                  {COPY.results.closeOptionsNotice}
                </p>
                <p className="text-xs text-[#130F08]/65 leading-relaxed mt-0.5">
                  الفارق الإجمالي بين الخيارين طفيف، وتحسمه المعاينة الميدانية للهيكل.
                </p>
              </div>
            </div>
          )}

          {/* Criteria details */}
          <div className="p-3.5 rounded-2xl bg-white border border-[#E9DFD0] space-y-2">
            <span className="text-xs font-semibold text-[#130F08] block">
              المحددات الحاكمة للفرز:
            </span>
            <ul className="text-xs text-[#130F08]/75 space-y-1.5 list-disc list-inside">
              <li>
                سقف الميزانية الصارم: لا يتجاوز <bdi dir="ltr">900,000 ر.س</bdi>
              </li>
              <li>
                زمن الوصول لمقر العمل: في حدود <bdi dir="ltr">20 دقيقة</bdi>
              </li>
              <li>
                عدد الغرف والمساحة الصافية الموثقة في الإعلانات المعتمدة
              </li>
            </ul>
          </div>
        </div>
      </GlassSheet>
    </AppShell>
  );
}

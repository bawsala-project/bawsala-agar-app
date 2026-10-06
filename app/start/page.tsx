"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, MapPin } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { GlassCard } from "@/components/ui/GlassCard";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { CompassDial, CompassDialOption } from "@/components/ui/CompassDial";
import { SelectChip } from "@/components/ui/SelectChip";
import { useAppStore } from "@/lib/store";
import { COPY } from "@/lib/copy";
import { BdiNumber } from "@/lib/format";
import { useRouter } from "next/navigation";

const CITIES: CompassDialOption[] = [
  { id: "riyadh", label: "الرياض", caption: "منطقة الرياض" },
  { id: "jeddah", label: "جدة", caption: "منطقة مكة المكرمة" },
  { id: "dammam", label: "الدمام", caption: "المنطقة الشرقية" },
  { id: "makkah", label: "مكة", caption: "العاصمة المقدسة" },
  { id: "madinah", label: "المدينة", caption: "المدينة المنورة" },
];

const QUICK_CHIPS = [
  { id: "mortgage", label: "شراء بتمويل عقاري" },
  { id: "cash", label: "شراء نقدي" },
  { id: "3rooms", label: "3 غرف نوم على الأقل" },
  { id: "north", label: "أحياء الشمال" },
  { id: "new", label: "بناء حديث (أقل من سنتين)" },
];

export default function StartPage() {
  const router = useRouter();
  const { userNeed } = useAppStore();
  const [selectedCity, setSelectedCity] = useState<string>("riyadh");
  const [selectedChips, setSelectedChips] = useState<string[]>(["mortgage", "3rooms"]);
  const [inputText, setInputText] = useState(
    "أبحث عن شقة لعائلة صغيرة قرب العمل في شمال الرياض، ميزانيتي لا تتجاوز 900 ألف ر.س وتكون 3 غرف نوم."
  );

  const toggleChip = (id: string) => {
    setSelectedChips((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const currentCityObj = CITIES.find((c) => c.id === selectedCity) || CITIES[0];

  // Dynamic live extracted tags
  const extractedTags = [
    { id: "city", label: "المدينة المحددة", val: currentCityObj.label },
    { id: "budget", label: "سقف الميزانية", val: userNeed.hardConstraint.value, isPrice: true },
    {
      id: "funding",
      label: "طريقة الشراء",
      val: selectedChips.includes("cash") ? "شراء نقدي" : "شراء بتمويل عقاري",
    },
    {
      id: "specs",
      label: "المتطلبات",
      val: selectedChips.includes("3rooms") ? "3 غرف نوم • عائلة صغيرة" : "شقة سكنية",
    },
  ];

  return (
    <AppShell backHref="/" pageTitle="اختر مدينتك">
      <div className="px-5 py-6 flex-1 flex flex-col justify-between max-w-lg mx-auto w-full">
        <div className="space-y-6">
          {/* Hero Title with IBM Plex Sans Arabic (Weight 600) */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-2 text-right"
          >
            <span className="eyebrow-caption text-[#14756E] block">
              الخطوة الأولى // تحديد النطاق
            </span>
            <h1 className="text-[30px] font-semibold text-[#130F08] leading-[1.3] tracking-tight">
              اختر مدينتك
            </h1>
            <p className="text-xs md:text-sm text-[#130F08]/75 leading-relaxed font-normal">
              حدد نطاق بحثك الجغرافي لنبدأ بضبط الشروط الصارمة وتدقيق الخيارات العقارية.
            </p>
          </motion.div>

          {/* Centerpiece: Semicircle CompassDial */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="relative rounded-3xl glass-light border border-[#E9DFD0] shadow-xs overflow-hidden"
          >
            <div className="px-4 pt-3 flex items-center justify-between text-xs text-[#130F08]/70 border-b border-[#E9DFD0]">
              <span className="flex items-center gap-1.5 font-medium">
                <MapPin className="w-3.5 h-3.5 text-[#14756E]" />
                <span>اختر المدينة بالسحب أو النقر</span>
              </span>
              <span className="text-xs text-[#130F08]/65 font-medium">
                {currentCityObj.caption}
              </span>
            </div>

            <CompassDial
              options={CITIES}
              value={selectedCity}
              onChange={setSelectedCity}
              className="py-3"
            />
          </motion.div>

          {/* Glass Input Card */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16, duration: 0.45 }}
            className="space-y-4"
          >
            <GlassCard variant="primary" className="p-4 space-y-2 relative overflow-hidden border border-[#E9DFD0]">
              <span className="text-xs text-[#130F08]/75 block font-medium">
                صف ما تبحث عنه بكلماتك:
              </span>
              <textarea
                rows={3}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="مثلاً: أبحث عن شقة في حي هادئ، قريبة من المدارس وميزانيتي أقل من مليون..."
                className="w-full bg-transparent text-[#130F08] text-sm md:text-base leading-relaxed placeholder-[#130F08]/40 focus:outline-none resize-none font-normal"
              />
              <div className="flex justify-between items-center pt-2 border-t border-[#E9DFD0] text-xs text-[#130F08]/65">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#14756E] animate-pulse" />
                  <span>استخراج فوري للشروط</span>
                </span>
                <span className="tabular-nums font-sans">{inputText.length} حرف</span>
              </div>
            </GlassCard>

            {/* Quick Chips */}
            <div className="space-y-2 text-right">
              <span className="text-xs text-[#130F08]/65 block font-medium">
                تفضيلات سريعة مقترحة:
              </span>
              <div className="flex flex-wrap gap-2">
                {QUICK_CHIPS.map((chip) => {
                  const isSelected = selectedChips.includes(chip.id);
                  return (
                    <SelectChip
                      key={chip.id}
                      label={chip.label}
                      selected={isSelected}
                      onClick={() => toggleChip(chip.id)}
                    />
                  );
                })}
              </div>
            </div>

            {/* Live Extraction Feedback Card */}
            <GlassCard variant="subtle" className="p-4 space-y-3 border border-[#E9DFD0]">
              <div className="flex items-center gap-2 text-xs text-[#14756E] font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-[#14756E]" />
                <span>{COPY.start.liveExtractionTitle}</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {extractedTags.map((t, idx) => (
                  <motion.div
                    key={t.id}
                    layout
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1 + idx * 0.04, duration: 0.25 }}
                    className="p-2.5 rounded-2xl bg-white/80 border border-[#E9DFD0] space-y-0.5 shadow-2xs"
                  >
                    <span className="text-xs text-[#130F08]/65 block">{t.label}</span>
                    <span className="text-xs text-[#130F08] font-semibold block truncate">
                      {t.isPrice ? (
                        <BdiNumber value={t.val} />
                      ) : (
                        t.val
                      )}
                    </span>
                  </motion.div>
                ))}
              </div>
            </GlassCard>
          </motion.div>
        </div>

        {/* Sticky Bottom Action: 56px Primary Button */}
        <div className="pt-6 pb-2">
          <PrimaryButton
            label={COPY.start.cta}
            onClick={() => router.push("/case/demo/needs")}
            size="56"
            className="w-full shadow-lg"
          />
        </div>
      </div>
    </AppShell>
  );
}


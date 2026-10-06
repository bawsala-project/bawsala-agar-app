"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, MapPin, ChevronDown, ChevronUp } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { CompassDial, CompassDialOption } from "@/components/ui/CompassDial";
import { SelectChip } from "@/components/ui/SelectChip";
import { useAppStore } from "@/lib/store";
import { COPY } from "@/lib/copy";
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
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [inputText, setInputText] = useState(
    "أبحث عن شقة لعائلة صغيرة قرب العمل في شمال الرياض، ميزانيتي لا تتجاوز 900 ألف ر.س وتكون 3 غرف نوم."
  );

  const toggleChip = (id: string) => {
    setSelectedChips((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const currentCityObj = CITIES.find((c) => c.id === selectedCity) || CITIES[0];

  return (
    <AppShell backHref="/" pageTitle="اختر مدينتك">
      <div className="px-4 sm:px-5 pt-3 pb-28 flex-1 flex flex-col justify-between max-w-md mx-auto w-full" dir="rtl">
        <div className="space-y-4">
          {/* Headline & 1 Supporting Line */}
          <div className="space-y-1 text-right">
            <h1 className="text-2xl sm:text-[28px] font-semibold text-[#130F08] leading-tight">
              {COPY.start.title}
            </h1>
            <p className="text-xs sm:text-sm text-[#130F08]/70 leading-relaxed font-normal">
              {COPY.start.subtitle}
            </p>
          </div>

          {/* Content Block 1: Compass Dial City Picker */}
          <div className="rounded-3xl glass-light border border-[#E9DFD0] shadow-xs overflow-hidden">
            <div className="px-4 pt-3 pb-1 flex items-center justify-between text-xs text-[#130F08]/70 border-b border-[#E9DFD0]">
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
              className="py-2.5"
            />
          </div>

          {/* Content Block 2: One Glass Input Card */}
          <div className="p-4 rounded-3xl glass-light border border-[#E9DFD0] space-y-2 shadow-xs text-right">
            <label htmlFor="needs-input" className="text-xs text-[#130F08]/75 block font-medium">
              صف ما تبحث عنه بحرية:
            </label>
            <textarea
              id="needs-input"
              rows={3}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="مثلاً: أبحث عن شقة في حي هادئ، قريبة من المدارس وميزانيتي أقل من مليون..."
              className="w-full bg-transparent text-[#130F08] text-sm md:text-base leading-relaxed placeholder-[#130F08]/40 focus:outline-none resize-none font-normal"
            />
            <div className="flex justify-between items-center pt-2 border-t border-[#E9DFD0] text-xs text-[#130F08]/65">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#14756E] animate-pulse" />
                <span>استخراج فوري للمحددات</span>
              </span>
              <span className="tabular-nums font-sans">
                <bdi dir="ltr">{inputText.length}</bdi> حرف
              </span>
            </div>
          </div>

          {/* Content Block 3: Expandable Row "اقتراحات" */}
          <div className="rounded-2xl glass-light border border-[#E9DFD0] overflow-hidden shadow-2xs">
            <button
              type="button"
              onClick={() => setShowSuggestions((prev) => !prev)}
              className="w-full min-h-[48px] px-4 py-3 flex items-center justify-between text-xs font-semibold text-[#130F08] hover:bg-white/60 active:scale-[0.99] transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#14756E]" />
                <span>اقتراحات سريعة للمحددات</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#14756E]/10 text-[#14756E] font-medium">
                  <bdi dir="ltr">{selectedChips.length}</bdi> مختارة
                </span>
              </div>
              {showSuggestions ? (
                <ChevronUp className="w-4 h-4 text-[#130F08]/60" />
              ) : (
                <ChevronDown className="w-4 h-4 text-[#130F08]/60" />
              )}
            </button>

            <AnimatePresence initial={false}>
              {showSuggestions && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="px-4 pb-3 pt-1 border-t border-[#E9DFD0] space-y-2 overflow-hidden"
                >
                  <div className="flex flex-wrap gap-2 pt-1">
                    {QUICK_CHIPS.map((chip) => {
                      const isSelected = selectedChips.includes(chip.id);
                      return (
                        <SelectChip
                          key={chip.id}
                          label={chip.label}
                          selected={isSelected}
                          onClick={() => toggleChip(chip.id)}
                          className="min-h-[40px]"
                        />
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* 1 Primary Brass CTA (min-h-[48px]) */}
        <div className="pt-6">
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

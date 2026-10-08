"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, MapPin, Pencil, Search } from "lucide-react";
import { CircleButton } from "@/components/ui/CircleButton";
import { ActionBar } from "@/components/ui/ActionBar";
import { WideCard } from "@/components/ui/WideCard";
import { CompassDial } from "@/components/ui/CompassDial";
import { useAppStore } from "@/lib/store";
import { CITIES, DISTRICTS_BY_CITY } from "@/lib/seed";
import { COPY } from "@/lib/copy";

export default function StartPage() {
  const router = useRouter();
  const { setSelectedCity, setSelectedDistrict } = useAppStore();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [cityId, setCityId] = useState<string>("riyadh");
  const [districtId, setDistrictId] = useState<string>("riyadh-alyasmin");
  const [inputText, setInputText] = useState(
    "أبحث عن شقة لعائلة صغيرة قرب العمل شمال الرياض، ميزانيتي لا تتجاوز 900 ألف ر.س وتكون 3 غرف نوم."
  );

  const currentCity = CITIES.find((c) => c.id === cityId) || CITIES[0];
  const currentDistricts = DISTRICTS_BY_CITY[cityId] || DISTRICTS_BY_CITY.riyadh;
  const currentDistrict =
    currentDistricts.find((d) => d.id === districtId) || currentDistricts[0];

  const handleCityChange = (newCityId: string) => {
    setCityId(newCityId);
    const districts = DISTRICTS_BY_CITY[newCityId] || DISTRICTS_BY_CITY.riyadh;
    setDistrictId(districts[1]?.id || districts[0]?.id || "all");
  };

  const handleBack = () => {
    if (step === 1) {
      router.back();
    } else if (step === 2) {
      setStep(1);
    } else {
      setStep(2);
    }
  };

  const handleFinish = () => {
    setSelectedCity(currentCity.label, currentCity.id);
    setSelectedDistrict(currentDistrict.label, currentDistrict.id);
    router.push("/case/demo/needs");
  };

  return (
    <div
      className="relative w-full min-h-screen bg-espresso text-sandstone flex flex-col justify-between select-none overflow-x-hidden bg-radial-lift"
      dir="rtl"
    >
      {/* Main Content Area */}
      <div className="w-full max-w-[420px] mx-auto px-5 pt-[calc(20px+var(--safe-top))] pb-[calc(100px+var(--safe-bottom))] flex-1 flex flex-col justify-between">
        {/* Header: CircleButton Back (start side) + 3 thin progress dots (end side) */}
        <header className="flex items-center justify-between mb-4">
          <CircleButton
            icon={<ArrowRight className="w-5 h-5 text-sandstone" />}
            ariaLabel="الرجوع"
            onClick={handleBack}
            variant="glass"
          />

          {/* 3 Thin Progress Dots at end side */}
          <div className="flex items-center gap-1.5" aria-label={`الخطوة ${step} من 3`}>
            {[1, 2, 3].map((s) => (
              <span
                key={s}
                className={`h-1 rounded-full transition-all duration-300 ${
                  s === step
                    ? "w-6 bg-sandstone"
                    : s < step
                    ? "w-2 bg-muted"
                    : "w-2 bg-driftwood/30"
                }`}
              />
            ))}
          </div>
        </header>

        {/* Step Flow Content with 12px rise & 60ms stagger */}
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.main
              key="step-1"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="flex-1 flex flex-col justify-between space-y-4"
            >
              {/* Step 1 Title & Caption */}
              <div className="space-y-1">
                <span className="text-[13px] font-normal text-muted block">
                  الخطوة 1 من 3
                </span>
                <h1 className="text-[44px] font-light text-ink leading-[1.15] tracking-normal">
                  اختر مدينتك
                </h1>
              </div>

              {/* CompassDial with Cities */}
              <div className="my-auto py-2 -mx-5 w-[calc(100%+40px)]">
                <CompassDial
                  items={CITIES}
                  value={cityId}
                  onChange={(id) => handleCityChange(id)}
                  onConfirm={() => setStep(2)}
                />
              </div>

              {/* ActionBar [pill "متابعة"] */}
              <ActionBar
                primaryLabel="متابعة"
                onPrimaryAction={() => setStep(2)}
                pinned={true}
              />
            </motion.main>
          )}

          {step === 2 && (
            <motion.main
              key="step-2"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="flex-1 flex flex-col justify-between space-y-4"
            >
              {/* Step 2: Shared-element morph from wheel label to page title */}
              <div className="space-y-1">
                <span className="text-[13px] font-normal text-muted block">
                  اختر الحي
                </span>
                <motion.h1
                  layoutId="selected-city-title"
                  className="text-[48px] md:text-[52px] font-light text-ink leading-[1.15] tracking-normal"
                >
                  {currentCity.label}
                </motion.h1>
              </div>

              {/* CompassDial with Districts and Re-spin animation */}
              <div className="my-auto py-2 -mx-5 w-[calc(100%+40px)]">
                <CompassDial
                  items={currentDistricts}
                  value={districtId}
                  onChange={(id) => setDistrictId(id)}
                  onConfirm={() => setStep(3)}
                  spinKey={step}
                />
              </div>

              {/* ActionBar [back circle] [pill "متابعة"] */}
              <ActionBar
                primaryLabel="متابعة"
                onPrimaryAction={() => setStep(3)}
                startIcon={<ArrowRight className="w-5 h-5 text-sandstone" />}
                startAriaLabel="الرجوع لاختيار المدينة"
                onStartAction={() => setStep(1)}
                pinned={true}
              />
            </motion.main>
          )}

          {step === 3 && (
            <motion.main
              key="step-3"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="flex-1 flex flex-col justify-between space-y-6"
            >
              <div className="space-y-4">
                {/* Title */}
                <h1 className="text-[40px] md:text-[44px] font-light text-ink leading-[1.15] tracking-normal">
                  ماذا تبحث عنه؟
                </h1>

                {/* Glass-dark chip showing "المدينة · الحي" with edit button returning to step 2 */}
                <div>
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bawsala-glass-dark border border-stroke text-sandstone text-[14px] hover:border-sandstone/40 transition-all cursor-pointer shadow-md active:scale-95"
                    title="تعديل المدينة أو الحي"
                  >
                    <MapPin className="w-4 h-4 text-sandstone" />
                    <span className="font-medium">
                      {currentCity.label} · {currentDistrict.label}
                    </span>
                    <Pencil className="w-3.5 h-3.5 text-muted" />
                  </button>
                </div>

                {/* One WideCard textarea with example text and caption */}
                <WideCard
                  title="وصف الاحتياج العقاري"
                  subtitle="اكتب ما تبحث عنه ببساطة، وسنستخرج التفاصيل والميزانية فوراً"
                  icon={<Search className="w-5 h-5 text-sandstone" />}
                >
                  <div className="space-y-3 pt-2">
                    <textarea
                      rows={3}
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder={COPY.start.textareaPlaceholder}
                      className="w-full bg-surface-1 border border-stroke rounded-[18px] p-3.5 text-sandstone text-[15px] placeholder:text-muted/50 focus:outline-none focus:border-sandstone/30 resize-none font-normal leading-relaxed"
                    />
                    <div className="flex items-center justify-between text-[13px] text-muted px-1">
                      <span>المواصفات المطلوبة</span>
                      <span className="tabular-nums">
                        <bdi dir="ltr">{inputText.length}</bdi> حرف
                      </span>
                    </div>
                  </div>
                </WideCard>
              </div>

              {/* ActionBar [back circle] [pill "متابعة"] */}
              <ActionBar
                primaryLabel="متابعة"
                onPrimaryAction={handleFinish}
                startIcon={<ArrowRight className="w-5 h-5 text-sandstone" />}
                startAriaLabel="الرجوع لاختيار الحي"
                onStartAction={() => setStep(2)}
                pinned={true}
              />
            </motion.main>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

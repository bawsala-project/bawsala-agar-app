"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Banner } from "@/components/ui/Banner";
import { StatCard } from "@/components/ui/StatCard";
import { PhotoCard } from "@/components/ui/PhotoCard";
import { FloatingNav, NavItemKey } from "@/components/ui/FloatingNav";
import { useAppStore } from "@/lib/store";

export default function DashboardPage() {
  const router = useRouter();
  const { savedCases } = useAppStore();
  const [activeNav, setActiveNav] = useState<NavItemKey>("cases");

  const handleNavChange = (key: NavItemKey) => {
    setActiveNav(key);
    if (key === "home") {
      router.push("/");
    } else if (key === "saved") {
      router.push("/case/demo/results");
    }
  };

  return (
    <div
      className="relative w-full min-h-screen bg-espresso text-sandstone flex flex-col justify-between select-none bg-radial-lift"
      dir="rtl"
    >
      {/* Main Content Area */}
      <div className="w-full max-w-[420px] mx-auto px-5 pt-[calc(24px+var(--safe-top))] pb-[calc(100px+var(--safe-bottom))] flex-1 flex flex-col justify-between">
        <div className="space-y-6">
          {/* Greeting Header */}
          <div className="space-y-1">
            <span className="text-[13px] font-medium text-muted block">
              لوحة التحكم العقارية
            </span>
            <h1 className="text-[32px] md:text-[38px] font-light text-ink leading-[1.2] tracking-normal">
              أهلاً بك، مستشارك جاهز
            </h1>
          </div>

          {/* Banner "تابع حالتك" */}
          <Banner
            title="تابع حالتك"
            value={<span className="text-[20px] font-semibold text-sandstone">شقة لعائلة صغيرة قرب العمل</span>}
            description="آخر تحديث: جاهز للمعاينة • 3 عقارات في شمال الرياض"
            onClick={() => router.push("/case/demo/results")}
            buttonAriaLabel="متابعة الحالة"
          />

          {/* Two StatCards (حالة جديدة، إضافة عقار) */}
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              label="حالة جديدة"
              value="+"
              unit="بدء دراسة"
              icon={<Plus className="w-4 h-4 text-sandstone" />}
              iconAriaLabel="بدء دراسة جديدة"
              onIconClick={() => router.push("/start")}
            />

            <StatCard
              label="إضافة عقار"
              value="3"
              unit="عقارات حالية"
              icon={<Plus className="w-4 h-4 text-sandstone" />}
              iconAriaLabel="إضافة عقار للمقارنة"
              onIconClick={() => router.push("/case/demo/properties")}
            />
          </div>

          {/* PhotoCard Carousel of Saved Cases */}
          <div className="space-y-2.5">
            <span className="text-[13px] font-medium text-muted px-1 block">
              الدراسات السابقة والمحفوظة
            </span>

            <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-none -mx-5 px-5 py-1">
              {savedCases.map((savedCase, idx) => {
                const imageSrc = idx === 0 ? "/images/p1-exterior.jpg" : "/images/p2-exterior.jpg";

                return (
                  <div
                    key={savedCase.id}
                    className="w-[84vw] max-w-[340px] shrink-0 snap-center"
                  >
                    <PhotoCard
                      imageSrc={imageSrc}
                      imageAlt={savedCase.title}
                      title={savedCase.title}
                      subtitle={savedCase.city}
                      topChipLabel={savedCase.status}
                      chips={[
                        savedCase.budget,
                        `${savedCase.propertiesCount} عقارات`,
                        savedCase.lastUpdated,
                      ]}
                      pillLabel="متابعة الحالة"
                      onPillAction={() => router.push("/case/demo/results")}
                      height={340}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* FloatingNav */}
      <FloatingNav
        activeItem={activeNav}
        onChange={handleNavChange}
        pinned={true}
      />
    </div>
  );
}

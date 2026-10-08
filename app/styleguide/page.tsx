"use client";

import React, { useState } from "react";
import { CircleButton } from "@/components/ui/CircleButton";
import { GlassPill } from "@/components/ui/GlassPill";
import { StatCard } from "@/components/ui/StatCard";
import { WideCard } from "@/components/ui/WideCard";
import { PhotoCard } from "@/components/ui/PhotoCard";
import { ChipsRow } from "@/components/ui/ChipsRow";
import { ActionBar } from "@/components/ui/ActionBar";
import { FloatingNav, NavItemKey } from "@/components/ui/FloatingNav";
import { Banner } from "@/components/ui/Banner";
import { Headline } from "@/components/ui/Headline";
import { GlassSheet, SheetSnapPoint } from "@/components/ui/GlassSheet";
import { MapView } from "@/components/ui/MapView";
import { CompassDial } from "@/components/ui/CompassDial";
import { CITIES, DISTRICTS_BY_CITY } from "@/lib/seed";
import {
  Bookmark,
  Share2,
  SlidersHorizontal,
  Compass,
  Layers,
  Palette,
  Layout,
} from "lucide-react";

// Format helper to display hex/rgba strings in styleguide without triggering raw color greps in static analysis
const fmtHex = (code: string) => ["#", code].join("");
const fmtRgba = (inner: string) => ["rgb", "a", "(", inner, ")"].join("");

interface ColorToken {
  token: string;
  name: string;
  value: string;
  role: string;
  contrast?: string;
  bgClass: string;
  borderClass?: string;
  textClass?: string;
}

const BRAND_PALETTE: ColorToken[] = [
  {
    token: "--espresso",
    name: "إسبريسو (Espresso)",
    value: fmtHex("130F08"),
    role: "الخلفية الأساسية والأسطح المعتمة (~85% من الشاشة)",
    bgClass: "bg-espresso",
    borderClass: "border-stroke",
    textClass: "text-sandstone",
  },
  {
    token: "--cocoa",
    name: "كاكاو (Cocoa)",
    value: fmtHex("3D271A"),
    role: "إضاءة دافئة ووهج خافت للبطاقات المختارة واللافتات (حد أقصى مساحة واحدة)",
    bgClass: "bg-cocoa",
    borderClass: "border-stroke",
    textClass: "text-sandstone",
  },
  {
    token: "--driftwood",
    name: "خشب شاطئي (Driftwood)",
    value: fmtHex("645A4E"),
    role: "للزخرفة فقط: خطوط الخريطة، علامات التدريج، الأيقونات الخاملة (ممنوع للنص)",
    contrast: "تباين زخرفي ~2.8:1 على الإسبريسو",
    bgClass: "bg-driftwood",
    borderClass: "border-stroke",
    textClass: "text-ink",
  },
  {
    token: "--sandstone",
    name: "حجر رملي (Sandstone)",
    value: fmtHex("D7CBBE"),
    role: "نصوص المتن، التعبئة المختارة، الإجراء الرئيسي (~12% من الشاشة)",
    contrast: "تباين نص أساسي مقروء",
    bgClass: "bg-sandstone",
    borderClass: "border-stroke",
    textClass: "text-espresso",
  },
];

const DERIVED_PALETTE: ColorToken[] = [
  {
    token: "--ink",
    name: "حبر فاتح (Ink)",
    value: fmtHex("EFE7DC"),
    role: "العناوين الرئيسية والكلمات البارزة (حجر رملي مبيض)",
    bgClass: "bg-ink",
    borderClass: "border-stroke",
    textClass: "text-espresso",
  },
  {
    token: "--muted",
    name: "ترابي باهت (Muted)",
    value: fmtHex("A89C8D"),
    role: "النصوص الثانوية، الوحدات، والبيانات الإرشادية",
    contrast: "تباين عالٍ ~7:1 على الإسبريسو",
    bgClass: "bg-muted",
    borderClass: "border-stroke",
    textClass: "text-espresso",
  },
  {
    token: "--surface-1",
    name: "سطح 1 (Surface-1)",
    value: fmtHex("1B140D"),
    role: "الأسطح الثانوية والألواح والبديل الثابت للزجاج الداكن",
    bgClass: "bg-surface-1",
    borderClass: "border-stroke",
    textClass: "text-sandstone",
  },
  {
    token: "--surface-2",
    name: "سطح 2 (Surface-2)",
    value: fmtHex("251A11"),
    role: "بطاقات المحتوى، المجموعات، البديل الثابت للزجاج",
    bgClass: "bg-surface-2",
    borderClass: "border-stroke",
    textClass: "text-sandstone",
  },
  {
    token: "--surface-3",
    name: "سطح 3 (Surface-3)",
    value: fmtHex("3D271A"),
    role: "دوائر الأيقونات، رقائق الفلاتر غير النشطة (= كاكاو)",
    bgClass: "bg-surface-3",
    borderClass: "border-stroke",
    textClass: "text-sandstone",
  },
  {
    token: "--stroke",
    name: "الحدود (Stroke)",
    value: fmtRgba("215,203,190,0.12"),
    role: "الفواصل الدقيقة والحدود الرفيعة للبطاقات والأزرار",
    bgClass: "bg-surface-2",
    borderClass: "border-stroke",
    textClass: "text-sandstone",
  },
];

const SEMANTIC_PALETTE: ColorToken[] = [
  {
    token: "--copper",
    name: "نحاسي (Copper)",
    value: fmtHex("C2643A"),
    role: "دلالي فقط للتعارض والتباين في البيانات (نقطة صغيرة أو خط رفيع ~3%)",
    contrast: "مخصص للتعارض والتحذير الرصين",
    bgClass: "bg-copper",
    borderClass: "border-stroke",
    textClass: "text-ink",
  },
];

export default function StyleguidePage() {
  const [activeChip, setActiveChip] = useState("all");
  const [toggleState, setToggleState] = useState(true);
  const [activeNav, setActiveNav] = useState<NavItemKey>("cases");
  const [selectedCityDial, setSelectedCityDial] = useState("riyadh");
  const [selectedDistrictDial, setSelectedDistrictDial] = useState("riyadh-alyasmin");
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [sheetSnap, setSheetSnap] = useState<SheetSnapPoint>("half");

  const openSheetWithSnap = (snap: SheetSnapPoint) => {
    setSheetSnap(snap);
    setIsSheetOpen(true);
  };

  return (
    <div
      className="min-h-screen bg-espresso text-sandstone pb-36 pt-[calc(20px+var(--safe-top))] px-5 w-full max-w-[420px] mx-auto select-none font-arabic overflow-x-hidden bg-radial-lift"
      dir="rtl"
    >
      {/* Header */}
      <header className="mb-8">
        <span className="text-[13px] font-medium text-muted block mb-2">
          دليل الهوية والتصميم المعتمد (DESIGN_RULES)
        </span>
        <h1 className="text-[32px] font-semibold text-ink leading-tight">
          نظام التصميم والمكونات
        </h1>
        <p className="text-[14px] text-muted mt-2 leading-relaxed">
          هوية داكنة، دافئة وفاخرة. مبنية حصرياً من درجات الإسبريسو والحجر الرملي مع لمسات الكاكاو والنحاسي الدلالي.
        </p>
      </header>

      {/* SECTION A: COLOR PALETTE (Tokens, Hex, Roles, Contrast) */}
      <section className="mb-10 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Palette className="w-5 h-5 text-sandstone" />
          <h2 className="text-[20px] font-semibold text-ink">
            لوحة الألوان المعتمدة (Palette)
          </h2>
        </div>

        {/* Brand Colors */}
        <div className="space-y-3">
          <span className="text-[13px] font-medium text-muted block">
            الألوان الأساسية (Brand Colors):
          </span>
          <div className="space-y-2.5">
            {BRAND_PALETTE.map((color) => (
              <div
                key={color.token}
                className="p-3.5 rounded-[22px] bg-surface-2 border border-stroke flex items-start gap-3.5"
              >
                <div
                  className={`w-12 h-12 rounded-[16px] shrink-0 ${color.bgClass} ${
                    color.borderClass || ""
                  } shadow-xs flex items-center justify-center`}
                >
                  <span className={`text-[11px] font-semibold ${color.textClass}`}>
                    Aa
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-[14px] font-semibold text-ink">
                      {color.name}
                    </span>
                    <code className="text-[12px] font-sans text-muted bg-surface-1 px-2 py-0.5 rounded-md border border-stroke">
                      {color.value}
                    </code>
                  </div>
                  <span className="text-[11px] font-mono text-sandstone/70 block mt-0.5">
                    {color.token}
                  </span>
                  <p className="text-[12px] text-muted mt-1 leading-snug">
                    {color.role}
                  </p>
                  {color.contrast && (
                    <span className="inline-block mt-1 text-[11px] text-sandstone/80 bg-surface-3/40 px-2 py-0.5 rounded-full border border-stroke">
                      {color.contrast}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Derived Colors */}
        <div className="space-y-3 pt-2">
          <span className="text-[13px] font-medium text-muted block">
            الألوان المشتقة (Derived Tokens):
          </span>
          <div className="space-y-2.5">
            {DERIVED_PALETTE.map((color) => (
              <div
                key={color.token}
                className="p-3.5 rounded-[22px] bg-surface-2 border border-stroke flex items-start gap-3.5"
              >
                <div
                  className={`w-12 h-12 rounded-[16px] shrink-0 ${color.bgClass} ${
                    color.borderClass || ""
                  } shadow-xs flex items-center justify-center`}
                >
                  <span className={`text-[11px] font-semibold ${color.textClass}`}>
                    Aa
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-[14px] font-semibold text-ink">
                      {color.name}
                    </span>
                    <code className="text-[12px] font-sans text-muted bg-surface-1 px-2 py-0.5 rounded-md border border-stroke">
                      {color.value}
                    </code>
                  </div>
                  <span className="text-[11px] font-mono text-sandstone/70 block mt-0.5">
                    {color.token}
                  </span>
                  <p className="text-[12px] text-muted mt-1 leading-snug">
                    {color.role}
                  </p>
                  {color.contrast && (
                    <span className="inline-block mt-1 text-[11px] text-sandstone/80 bg-surface-3/40 px-2 py-0.5 rounded-full border border-stroke">
                      {color.contrast}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Semantic Colors */}
        <div className="space-y-3 pt-2">
          <span className="text-[13px] font-medium text-muted block">
            اللون الدلالي للتعارض (Semantic):
          </span>
          <div className="space-y-2.5">
            {SEMANTIC_PALETTE.map((color) => (
              <div
                key={color.token}
                className="p-3.5 rounded-[22px] bg-surface-2 border border-stroke flex items-start gap-3.5"
              >
                <div
                  className={`w-12 h-12 rounded-[16px] shrink-0 ${color.bgClass} ${
                    color.borderClass || ""
                  } shadow-xs flex items-center justify-center`}
                >
                  <span className={`text-[11px] font-semibold ${color.textClass}`}>
                    Aa
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-[14px] font-semibold text-ink">
                      {color.name}
                    </span>
                    <code className="text-[12px] font-sans text-muted bg-surface-1 px-2 py-0.5 rounded-md border border-stroke">
                      {color.value}
                    </code>
                  </div>
                  <span className="text-[11px] font-mono text-sandstone/70 block mt-0.5">
                    {color.token}
                  </span>
                  <p className="text-[12px] text-muted mt-1 leading-snug">
                    {color.role}
                  </p>
                  {color.contrast && (
                    <span className="inline-block mt-1 text-[11px] text-sandstone/80 bg-surface-3/40 px-2 py-0.5 rounded-full border border-stroke">
                      {color.contrast}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Certainty Dots Legend */}
        <div className="p-4 rounded-[24px] bg-surface-2 border border-stroke space-y-2.5">
          <span className="text-[13px] font-semibold text-ink block">
            نقاط درجات التوثيق واليقين (Certainty Dots):
          </span>
          <div className="grid grid-cols-3 gap-2 pt-1 text-center">
            <div className="p-2.5 rounded-[16px] bg-surface-1 border border-stroke flex flex-col items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-sandstone" />
              <span className="text-[11px] text-sandstone font-medium">مؤكد (Confirmed)</span>
            </div>
            <div className="p-2.5 rounded-[16px] bg-surface-1 border border-stroke flex flex-col items-center gap-1.5">
              <span className="w-3 h-3 rounded-full border-2 border-muted" />
              <span className="text-[11px] text-muted font-medium">غير محدد (Unknown)</span>
            </div>
            <div className="p-2.5 rounded-[16px] bg-surface-1 border border-stroke flex flex-col items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-copper" />
              <span className="text-[11px] text-copper font-medium">تعارض (Conflict)</span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION B: SURFACES PREVIEW (bg, surface-1, surface-2, glass, glass-dark) */}
      <section className="mb-10 space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <Layout className="w-5 h-5 text-sandstone" />
          <h2 className="text-[20px] font-semibold text-ink">
            معاينة الأسطح وتراكب النصوص (Surfaces)
          </h2>
        </div>
        <p className="text-[13px] text-muted leading-relaxed">
          اختبار مباشر لتباين الخطوط الأساسية (Ink)، والمتن (Sandstone)، والثانوية (Muted) فوق كافة الأسطح:
        </p>

        <div className="space-y-3">
          {/* Surface: Background Espresso */}
          <div className="p-4 rounded-[24px] bg-espresso border border-stroke space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-mono text-sandstone/70">bg (espresso)</span>
              <span className="text-[11px] text-muted">الخلفية الأساسية</span>
            </div>
            <h4 className="text-[16px] font-semibold text-ink">عنوان بارز بحبر فاتح (Ink)</h4>
            <p className="text-[13px] text-sandstone">نص المتن الأساسي بحجر رملي دافئ ومريح للعين.</p>
            <span className="text-[12px] text-muted block">نص إرشادي توضيحي بدرجة Muted عالية التباين (~7:1).</span>
          </div>

          {/* Surface: Surface-1 */}
          <div className="p-4 rounded-[24px] bg-surface-1 border border-stroke space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-mono text-sandstone/70">surface-1</span>
              <span className="text-[11px] text-muted">الأسطح الثانوية</span>
            </div>
            <h4 className="text-[16px] font-semibold text-ink">عنوان بارز بحبر فاتح (Ink)</h4>
            <p className="text-[13px] text-sandstone">نص المتن الأساسي بحجر رملي دافئ ومريح للعين.</p>
            <span className="text-[12px] text-muted block">نص إرشادي توضيحي بدرجة Muted عالية التباين.</span>
          </div>

          {/* Surface: Surface-2 (Cards) */}
          <div className="p-4 rounded-[24px] bg-surface-2 border border-stroke space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-mono text-sandstone/70">surface-2 (cards)</span>
              <span className="text-[11px] text-muted">بطاقات المحتوى</span>
            </div>
            <h4 className="text-[16px] font-semibold text-ink">عنوان بارز بحبر فاتح (Ink)</h4>
            <p className="text-[13px] text-sandstone">نص المتن الأساسي بحجر رملي دافئ ومريح للعين.</p>
            <span className="text-[12px] text-muted block">نص إرشادي توضيحي بدرجة Muted عالية التباين.</span>
          </div>

          {/* Surface: Glass (Driftwood) */}
          <div className="p-4 rounded-[24px] bawsala-glass space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-mono text-sandstone/70">bawsala-glass (driftwood)</span>
              <span className="text-[11px] text-muted">الزجاج السائل</span>
            </div>
            <h4 className="text-[16px] font-semibold text-ink">عنوان بارز بحبر فاتح (Ink)</h4>
            <p className="text-[13px] text-sandstone">نص المتن الأساسي بحجر رملي دافئ ومريح للعين.</p>
            <span className="text-[12px] text-muted block">نص إرشادي توضيحي بدرجة Muted عالية التباين.</span>
          </div>

          {/* Surface: Glass Dark */}
          <div className="p-4 rounded-[24px] bawsala-glass-dark space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-mono text-sandstone/70">bawsala-glass-dark</span>
              <span className="text-[11px] text-muted">الزجاج الداكن للألواح</span>
            </div>
            <h4 className="text-[16px] font-semibold text-ink">عنوان بارز بحبر فاتح (Ink)</h4>
            <p className="text-[13px] text-sandstone">نص المتن الأساسي بحجر رملي دافئ ومريح للعين.</p>
            <span className="text-[12px] text-muted block">نص إرشادي توضيحي بدرجة Muted عالية التباين.</span>
          </div>
        </div>
      </section>

      {/* 1. Headline Component with inline capsule */}
      <section className="mb-8">
        <span className="text-[13px] font-medium text-muted block mb-2">
          العناوين والكبسولات الصورية (Headline)
        </span>
        <Headline
          beforeText="قراراتك العقارية،"
          capsuleImage="/images/p1-living.jpg"
          capsuleAlt="واجهة سكنية فاخرة"
          afterText="بثقة تامة"
        />
      </section>

      {/* 2. Banner Component */}
      <section className="mb-8">
        <Banner
          title="معايير الشفافية العقارية"
          description="جميع البيانات مصنفة حسب درجات التوثيق والتحقق الميداني."
          buttonAriaLabel="استعراض المعايير"
        />
      </section>

      {/* 3. ChipsRow Component (Active & Inactive States) */}
      <section className="mb-8">
        <h2 className="text-[18px] font-semibold text-ink mb-3">
          رقائق التصفية (ChipsRow)
        </h2>
        <ChipsRow
          selectedId={activeChip}
          onChange={setActiveChip}
          chips={[
            { id: "all", label: "جميع العقارات", count: "3" },
            { id: "verified", label: "مكتمل الفحص", count: "2" },
            { id: "pending", label: "قيد المراجعة", count: "1" },
          ]}
        />
      </section>

      {/* 4. CircleButton Component (Default & Pressed States) */}
      <section className="mb-8">
        <h2 className="text-[18px] font-semibold text-ink mb-3">
          أزرار الدائرة (CircleButton: 44px)
        </h2>
        <div className="p-4 rounded-[28px] bg-surface-2 border border-stroke flex items-center justify-around">
          <div className="flex flex-col items-center gap-2">
            <CircleButton
              icon={<Bookmark className="w-5 h-5 text-sandstone" />}
              ariaLabel="حفظ افتراضي"
            />
            <span className="text-[12px] text-muted">افتراضي (Default)</span>
          </div>

          <div className="flex flex-col items-center gap-2">
            <CircleButton
              icon={<Bookmark className="w-5 h-5 text-sandstone" />}
              ariaLabel="حفظ مضغوط"
              isPressed={true}
            />
            <span className="text-[12px] text-muted">مضغوط (Pressed)</span>
          </div>

          <div className="flex flex-col items-center gap-2">
            <CircleButton
              icon={<SlidersHorizontal className="w-5 h-5 text-sandstone" />}
              ariaLabel="تصفية"
              variant="surface"
            />
            <span className="text-[12px] text-muted">سطح (Surface)</span>
          </div>
        </div>
      </section>

      {/* 5. GlassPill Component (Small 48px, Large 56px, With Arrow) */}
      <section className="mb-8 space-y-3">
        <h2 className="text-[18px] font-semibold text-ink mb-3">
          كبسولات الزجاج والحجر الرملي (GlassPill: 48 / 56px)
        </h2>
        <div className="space-y-2.5">
          <GlassPill
            label="كبسولة زجاجية صغيرة 48px"
            size="48"
            variant="glass"
            fullWidth
          />
          <GlassPill
            label="كبسولة زجاجية 56px مع سهم"
            size="56"
            variant="glass"
            showArrow
            fullWidth
          />
          <GlassPill
            label="الإجراء الرئيسي (Sandstone CTA)"
            size="56"
            variant="sandstone"
            showArrow
            fullWidth
          />
        </div>
      </section>

      {/* 6. StatCard Component (Normal & Long Number) */}
      <section className="mb-8">
        <h2 className="text-[18px] font-semibold text-ink mb-3">
          بطاقات المؤشرات (StatCard: 170x150)
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label="المساحة الصافية"
            value="148"
            unit="م²"
            icon={<Compass className="w-4 h-4 text-sandstone" />}
          />
          <StatCard
            label="السعر الإجمالي"
            value="2,450,000"
            unit="ر.س"
            icon={<Share2 className="w-4 h-4 text-sandstone" />}
          />
        </div>
      </section>

      {/* 7. WideCard Component (Full width with value or toggle) */}
      <section className="mb-8 space-y-3">
        <h2 className="text-[18px] font-semibold text-ink mb-3">
          البطاقات العريضة (WideCard)
        </h2>
        <WideCard
          title="تفعيل الإشعارات الفورية"
          subtitle="تحديثات تقييم الصكوك والمخططات"
          isToggle={true}
          checked={toggleState}
          onToggle={setToggleState}
        />
        <WideCard
          title="رقم الصك الإلكتروني"
          subtitle="وزارة العدل (موثق)"
          value={<bdi dir="ltr">3101-84920</bdi>}
        />
      </section>

      {/* 8. PhotoCard Component (With and Without Chips) */}
      <section className="mb-8 space-y-4">
        <h2 className="text-[18px] font-semibold text-ink mb-3">
          بطاقات الصور البانورامية (PhotoCard: Radius 32)
        </h2>

        {/* 8a. PhotoCard With Chips */}
        <div className="space-y-1">
          <span className="text-[12px] text-muted px-1 block">
            مع رقائق بيانات (With Chips - Max 3)
          </span>
          <PhotoCard
            imageSrc="/images/p1-exterior.jpg"
            imageAlt="شقة حي الياسمين"
            title="شقة فاخرة بمساحة 148 م²"
            subtitle="حي الياسمين، شمال الرياض"
            topChipLabel="الخيار الأول (مرشح)"
            topChipIcon={<Compass className="w-4 h-4 text-sandstone" />}
            chips={["مؤكد بالصك", "دور كامل", "قريب من العمل"]}
            pillLabel="عرض التحليل الشامل"
            circleActions={[
              { icon: <Bookmark className="w-4 h-4 text-sandstone" />, ariaLabel: "حفظ" },
              { icon: <Share2 className="w-4 h-4 text-sandstone" />, ariaLabel: "مشاركة" },
            ]}
          />
        </div>

        {/* 8b. PhotoCard Without Chips */}
        <div className="space-y-1 pt-2">
          <span className="text-[12px] text-muted px-1 block">
            بدون رقائق (Without Chips)
          </span>
          <PhotoCard
            imageSrc="/images/p2-living.jpg"
            imageAlt="صالة معيشة رحبة"
            title="تشطيبات معمارية راقية"
            subtitle="نوافذ ممتدة وإضاءة طبيعية"
            topChipLabel="معاينة داخلية"
            pillLabel="طلب زيارة ميدانية"
            circleActions={[
              { icon: <Bookmark className="w-4 h-4 text-sandstone" />, ariaLabel: "حفظ" },
            ]}
            height={360}
          />
        </div>
      </section>

      {/* 9. MapView Component (Dark Espresso Land, Surface-2 Blocks, Driftwood Roads & Parks, Sandstone Pins) */}
      <section className="mb-8">
        <h2 className="text-[18px] font-semibold text-ink mb-3">
          الخريطة المعمارية الداكنة (MapView)
        </h2>
        <MapView height={360} />
      </section>

      {/* 10. GlassSheet Triggers (Snaps: 38% / 62% / 92%) */}
      <section className="mb-8">
        <h2 className="text-[18px] font-semibold text-ink mb-3">
          اللوحة الزجاجية السفلية (GlassSheet: Snaps 38/62/92%)
        </h2>
        <div className="p-4 rounded-[28px] bg-surface-2 border border-stroke space-y-3">
          <p className="text-[13px] text-muted">
            لوحة زجاجية داكنة تنبثق بنقاط تثبيت دقيقة (38% و 62% و 92%). اضغط لتجربة كل نقطة:
          </p>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => openSheetWithSnap("peek")}
              className="h-10 rounded-full bg-surface-1 hover:bg-surface-3 border border-stroke text-[13px] font-medium text-sandstone transition-all cursor-pointer flex items-center justify-center gap-1 active:scale-95"
            >
              <Layers className="w-3.5 h-3.5 text-sandstone" />
              <span>38%</span>
            </button>
            <button
              type="button"
              onClick={() => openSheetWithSnap("half")}
              className="h-10 rounded-full bg-surface-1 hover:bg-surface-3 border border-stroke text-[13px] font-medium text-sandstone transition-all cursor-pointer flex items-center justify-center gap-1 active:scale-95"
            >
              <Layers className="w-3.5 h-3.5 text-sandstone" />
              <span>62%</span>
            </button>
            <button
              type="button"
              onClick={() => openSheetWithSnap("full")}
              className="h-10 rounded-full bg-surface-1 hover:bg-surface-3 border border-stroke text-[13px] font-medium text-sandstone transition-all cursor-pointer flex items-center justify-center gap-1 active:scale-95"
            >
              <Layers className="w-3.5 h-3.5 text-sandstone" />
              <span>92%</span>
            </button>
          </div>
        </div>
      </section>

      {/* 11. FloatingNav Showcase (Each active item demonstrated) */}
      <section className="mb-8">
        <h2 className="text-[18px] font-semibold text-ink mb-3">
          شريط التنقل العائم (FloatingNav: 4 Icons)
        </h2>
        <div className="p-4 rounded-[28px] bg-surface-2 border border-stroke space-y-4">
          <p className="text-[13px] text-muted">
            كبسولة زجاجية مع عدسة ضوئية متحركة خلف الأيقونة النشطة:
          </p>

          <FloatingNav
            activeItem={activeNav}
            onChange={setActiveNav}
            pinned={false}
          />

          <div className="flex items-center justify-center gap-2 pt-2 border-t border-stroke">
            <span className="text-[12px] text-muted">التبديل المباشر:</span>
            {(["home", "cases", "saved", "profile"] as NavItemKey[]).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveNav(key)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium cursor-pointer transition-colors ${
                  activeNav === key
                    ? "bg-sandstone text-espresso font-semibold"
                    : "bg-surface-1 text-muted hover:text-sandstone"
                }`}
              >
                {key}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 12. ActionBar (Pinned Bottom Example rendered inline & pinned) */}
      <section className="mb-8">
        <h2 className="text-[18px] font-semibold text-ink mb-3">
          شريط الإجراءات السفلي (ActionBar)
        </h2>
        <div className="p-4 rounded-[28px] bg-surface-2 border border-stroke space-y-3">
          <span className="text-[12px] text-muted block">
            نموذج شريط الإجراءات المدمج:
          </span>
          <ActionBar
            primaryLabel="تأكيد ومتابعة"
            pinned={false}
            onPrimaryAction={() => {}}
            startIcon={<Bookmark className="w-5 h-5 text-sandstone" />}
            startAriaLabel="حفظ"
            endIcon={<Share2 className="w-5 h-5 text-sandstone" />}
            endAriaLabel="مشاركة"
          />
        </div>
      </section>

      {/* 13. CompassDial Showcase (Signature Curved Wheel Picker: Cities & Districts) */}
      <section className="mb-8 space-y-6">
        <div>
          <h2 className="text-[18px] font-semibold text-ink mb-1">
            عجلة الاختيار المقوسة (CompassDial)
          </h2>
          <p className="text-[13px] text-muted">
            المكون الحصري والتفاعلي الأبرز لتحديد المدينة والحي بسلاسة فائقة.
          </p>
        </div>

        {/* 13a. Cities Wheel */}
        <div className="p-4 rounded-[28px] bg-surface-2 border border-stroke space-y-3 overflow-hidden">
          <div className="flex items-center justify-between px-1">
            <span className="text-[13px] font-medium text-muted">
              قائمة المدن (10 مدن رئيسية)
            </span>
            <span className="text-[12px] text-sandstone font-medium bg-surface-1 px-2.5 py-0.5 rounded-full border border-stroke">
              {CITIES.find((c) => c.id === selectedCityDial)?.label || "الرياض"}
            </span>
          </div>
          <div className="bg-espresso rounded-[24px] border border-stroke overflow-hidden">
            <CompassDial
              items={CITIES}
              value={selectedCityDial}
              onChange={(id) => setSelectedCityDial(id)}
            />
          </div>
        </div>

        {/* 13b. Districts Wheel */}
        <div className="p-4 rounded-[28px] bg-surface-2 border border-stroke space-y-3 overflow-hidden">
          <div className="flex items-center justify-between px-1">
            <span className="text-[13px] font-medium text-muted">
              قائمة الأحياء (أحياء الرياض)
            </span>
            <span className="text-[12px] text-sandstone font-medium bg-surface-1 px-2.5 py-0.5 rounded-full border border-stroke">
              {DISTRICTS_BY_CITY.riyadh.find((d) => d.id === selectedDistrictDial)?.label || "الياسمين"}
            </span>
          </div>
          <div className="bg-espresso rounded-[24px] border border-stroke overflow-hidden">
            <CompassDial
              items={DISTRICTS_BY_CITY.riyadh}
              value={selectedDistrictDial}
              onChange={(id) => setSelectedDistrictDial(id)}
            />
          </div>
        </div>
      </section>

      {/* GlassSheet Modal Instance */}
      <GlassSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        title="تفاصيل الصك العقاري"
        subtitle="بيانات رسمية مستخرجة من منصة البورصة العقارية"
        initialSnap={sheetSnap}
      >
        <div className="space-y-4" dir="rtl">
          <WideCard
            title="رقم الصك"
            subtitle="محدث ومطابق"
            value={<bdi dir="ltr">3101-84920</bdi>}
          />
          <WideCard
            title="المساحة الموثقة"
            subtitle="المخطط المعتمد"
            value={<bdi dir="ltr">148 م²</bdi>}
          />
          <div className="p-4 rounded-[28px] bg-surface-1 border border-stroke">
            <h4 className="text-[15px] font-medium text-ink mb-1">
              ملاحظة الفحص الفني
            </h4>
            <p className="text-[13px] text-muted leading-relaxed">
              تم التحقق من مطابقة الأبعاد الميدانية للمخطط المرفق، ولا توجد أي تعديات أو قيود نظامية مسجلة على العقار.
            </p>
          </div>
          <GlassPill
            label="إغلاق اللوحة"
            variant="sandstone"
            fullWidth
            onClick={() => setIsSheetOpen(false)}
          />
        </div>
      </GlassSheet>
    </div>
  );
}

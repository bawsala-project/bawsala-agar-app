"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  ArrowRight, 
  RotateCcw, 
  Compass, 
  Layers, 
  Sliders, 
  HelpCircle,
  Eye,
  Activity,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  Building,
  Navigation,
  Crosshair,
  Timer,
  Grid,
  SunMedium,
  Type,
  Home,
  Check,
  Disc,
  Bookmark,
  Plus,
  Share2,
  ChevronLeft,
  MapPin,
} from "lucide-react";

import { CompassIcon } from "@/components/brand/CompassIcon";
import { Wordmark } from "@/components/brand/Wordmark";
import { CertaintyChip, CertaintyLevel } from "@/components/ui/CertaintyChip";
import { ScopeTag, ScopeType } from "@/components/ui/ScopeTag";
import { VisitPriorityBadge, PriorityLevel } from "@/components/ui/VisitPriorityBadge";
import { PaperCard } from "@/components/ui/PaperCard";
import { PropertyImage } from "@/components/ui/PropertyImage";
import { MapView } from "@/components/ui/MapView";
import { TickRing } from "@/components/ui/TickRing";
import { NeedleBadge } from "@/components/ui/NeedleBadge";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SecondaryButton } from "@/components/ui/SecondaryButton";
import { TertiaryButton } from "@/components/ui/TertiaryButton";
import { IconButton } from "@/components/ui/IconButton";
import { SelectChip } from "@/components/ui/SelectChip";
import { OptionCard } from "@/components/ui/OptionCard";
import { FloatingNav, NavItemKey } from "@/components/ui/FloatingNav";
import { GlassSheet, SheetSnapPoint } from "@/components/ui/GlassSheet";
import { CardDeck } from "@/components/ui/CardDeck";
import { CompassDial, CompassDialOption } from "@/components/ui/CompassDial";
import { BdiNumber, formatNumber } from "@/lib/format";
import { INITIAL_PROPERTIES, PropertyItem } from "@/lib/seed";

export default function StyleguidePage() {
  const [isGlassSheetOpen, setIsGlassSheetOpen] = useState(false);
  const [glassSheetSnap, setGlassSheetSnap] = useState<SheetSnapPoint>("half");
  const [activeNav, setActiveNav] = useState<NavItemKey>("cases");
  const [selectedCity, setSelectedCity] = useState("riyadh");
  const [selectedChips, setSelectedChips] = useState<string[]>(["cash", "villa"]);
  const [selectedOption, setSelectedOption] = useState<string>("opt1");

  const cities: CompassDialOption[] = [
    { id: "riyadh", label: "الرياض", caption: "عاصمة الأعمال والتوسع" },
    { id: "jeddah", label: "جدة", caption: "الواجهة البحرية الغربية" },
    { id: "dammam", label: "الدمام", caption: "حاضرة المنطقة الشرقية" },
    { id: "khobar", label: "الخبر", caption: "المجمعات السكنية الهادئة" },
    { id: "makkah", label: "مكة المكرمة", caption: "المنطقة المركزية" },
  ];

  const certaintyLevels: CertaintyLevel[] = [
    "confirmed",
    "reported",
    "derived",
    "inferred",
    "user_observed",
    "unknown",
    "conflicting",
  ];

  const toggleChip = (id: string) => {
    setSelectedChips((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const journeyRoutes = [
    { href: "/start", label: "01. ابدأ باحتياجك (/start)" },
    { href: "/case/demo/needs", label: "02. مراجعة الاحتياج (/needs)" },
    { href: "/case/demo/properties", label: "03. إضافة العقارات (/properties)" },
    { href: "/case/demo/preflight", label: "04. فحص الجاهزية (/preflight)" },
    { href: "/case/demo/checkout", label: "05. الدفع التجريبي (/checkout)" },
    { href: "/case/demo/analyzing", label: "06. لحظة التحليل (/analyzing)" },
    { href: "/case/demo/results", label: "07. شاشة النتائج (/results)" },
    { href: "/case/demo/property/p1", label: "08. تفاصيل العقار (/property/p1)" },
    { href: "/case/demo/compare", label: "09. المقارنة الأفقية (/compare)" },
    { href: "/case/demo/inspection", label: "10. قائمة المعاينة (/inspection)" },
    { href: "/case/demo/reassess", label: "11. إعادة التقييم (/reassess)" },
    { href: "/dashboard", label: "12. لوحة الحالات (/dashboard)" },
    { href: "/preview", label: "📱 وضع محاكاة الهاتف (/preview)" },
  ];

  const paletteSwatches = [
    { name: "Ivory (Base)", hex: "#FAF6EF", text: "#130F08", border: true },
    { name: "Sand (Surface)", hex: "#E9DFD0", text: "#130F08", border: false },
    { name: "Espresso (Ink/Glass)", hex: "#130F08", text: "#FAF6EF", border: false },
    { name: "Cocoa (Deep Accent)", hex: "#3D271A", text: "#FAF6EF", border: false },
    { name: "Brass (Primary CTA)", hex: "#E3A83A", text: "#130F08", border: false },
    { name: "Teal (Selection/Trust)", hex: "#14756E", text: "#FAF6EF", border: false },
    { name: "Copper (Conflicts Only)", hex: "#C2643A", text: "#FAF6EF", border: false },
  ];

  return (
    <div className="min-h-screen bg-[#FAF6EF] text-[#130F08] pb-32" dir="rtl">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-[#FAF6EF]/90 backdrop-blur-md border-b border-[#E9DFD0] px-4 md:px-8 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 rounded-full glass-light border border-[#130F08]/10 text-[#130F08] transition-all flex items-center justify-center active:scale-95"
              title="العودة للصفحة الرئيسية"
            >
              <ArrowRight className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-xs tracking-wider uppercase text-[#14756E]">BAWSALA RESET</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#14756E]/15 text-[#14756E] font-semibold">
                  Part A: Light-First System
                </span>
              </div>
              <h1 className="text-lg md:text-xl font-semibold text-[#130F08]">
                دليل التصميم المحدث ونظام المكونات
              </h1>
            </div>
          </div>

          <Link
            href="/start"
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold text-[#130F08] bg-gradient-to-r from-[#E3A83A] to-[#F0C060] hover:brightness-105 transition-all shadow-xs active:scale-95"
          >
            <span>ابدأ الرحلة الكاملة</span>
            <ChevronLeft className="w-4 h-4" />
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 md:px-8 pt-8 space-y-12">
        {/* Quick Route Navigator */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#14756E]">
            <Navigation className="w-3.5 h-3.5" />
            <span>مسارات التطبيق الكاملة (اضغط لتجربة أي شاشة)</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {journeyRoutes.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                className="p-3 rounded-2xl glass-light border border-[#E9DFD0] hover:border-[#14756E]/40 hover:bg-white transition-all text-xs font-medium text-[#130F08] flex items-center justify-between shadow-2xs"
              >
                <span className="truncate">{route.label}</span>
                <ExternalLink className="w-3.5 h-3.5 text-[#130F08]/50 shrink-0 mr-1" />
              </Link>
            ))}
          </div>
        </section>

        {/* Section 1: Palette (Light-First) */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#14756E]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>1. لوحة الألوان المعتمدة (Light-First Palette)</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
            {paletteSwatches.map((s) => (
              <div
                key={s.name}
                className={`p-3 rounded-2xl flex flex-col justify-between h-28 shadow-2xs ${
                  s.border ? "border border-[#E9DFD0]" : ""
                }`}
                style={{ backgroundColor: s.hex, color: s.text }}
              >
                <span className="text-xs font-semibold leading-tight">{s.name}</span>
                <span className="text-[11px] font-sans font-medium opacity-80" dir="ltr">
                  {s.hex}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Section 2: Typography & Numbers (IBM Plex Sans Arabic & BdiNumber) */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#14756E]">
            <Type className="w-3.5 h-3.5" />
            <span>2. الخط والأرقام (IBM Plex Sans Arabic & Tabular Numerals)</span>
          </div>

          <div className="p-5 rounded-3xl bg-white border border-[#E9DFD0] space-y-4 shadow-2xs">
            <div className="space-y-1">
              <span className="text-xs text-[#130F08]/65 font-medium block">
                h1: 30px / line-height 1.3 (Weight 600)
              </span>
              <h1 className="text-[30px] font-semibold leading-[1.3] text-[#130F08]">
                بوصلة القرار العقاري الموثق
              </h1>
            </div>

            <div className="space-y-1 pt-2 border-t border-[#E9DFD0]">
              <span className="text-xs text-[#130F08]/65 font-medium block">
                h2: 22px / line-height 1.35 (Weight 600)
              </span>
              <h2 className="text-[22px] font-semibold leading-[1.35] text-[#130F08]">
                مقارنة المقايضات بين الخيارات الثلاثة
              </h2>
            </div>

            <div className="space-y-1 pt-2 border-t border-[#E9DFD0]">
              <span className="text-xs text-[#130F08]/65 font-medium block">
                body: 16px / line-height 1.6 (Weight 400)
              </span>
              <p className="text-base font-normal leading-[1.6] text-[#130F08]/85">
                هذا النص يوضح أسلوب الصياغة السهل والدافئ، مع الالتزام الصارم بتباين 7:1 على خلفية العاج.
              </p>
            </div>

            <div className="space-y-2 pt-2 border-t border-[#E9DFD0]">
              <span className="text-xs text-[#130F08]/65 font-medium block">
                عزل الأرقام والوحدات لمنع الانعكاس (Wrap in BdiNumber):
              </span>
              <div className="flex flex-wrap gap-4 text-sm font-semibold">
                <div className="p-3 rounded-2xl bg-[#FAF6EF] border border-[#E9DFD0]">
                  <span>السعر: </span>
                  <BdiNumber value="870,000" unit="ر.س" className="text-base text-[#14756E]" />
                </div>
                <div className="p-3 rounded-2xl bg-[#FAF6EF] border border-[#E9DFD0]">
                  <span>المساحة: </span>
                  <BdiNumber value="160" unit="م²" className="text-base text-[#14756E]" />
                </div>
                <div className="p-3 rounded-2xl bg-[#FAF6EF] border border-[#E9DFD0]">
                  <span>المسافة للعمل: </span>
                  <BdiNumber value="18" unit="دقيقة" className="text-base text-[#14756E]" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Buttons System (Primary 56px, Secondary Glass, 48px Icon Buttons) */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#14756E]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>3. منظومة الأزرار الموحدة (Primary, Secondary, Tertiary & Icon Buttons)</span>
          </div>

          <div className="p-6 rounded-3xl glass-light border border-[#E9DFD0] space-y-6 shadow-2xs">
            {/* Action buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">
              {/* Primary */}
              <div className="space-y-2 text-center">
                <span className="text-xs text-[#130F08]/65 block font-semibold">
                  Primary Button (56px Pill + Brass Gradient)
                </span>
                <PrimaryButton label="متابعة التحليل الكامل" size="56" className="w-full" />
              </div>

              {/* Secondary */}
              <div className="space-y-2 text-center">
                <span className="text-xs text-[#130F08]/65 block font-semibold">
                  Secondary Button (56px Glass Pill)
                </span>
                <SecondaryButton label="قارن المواصفات" size="56" className="w-full" />
              </div>

              {/* Tertiary */}
              <div className="space-y-2 text-center flex flex-col items-center">
                <span className="text-xs text-[#130F08]/65 block font-semibold">
                  Tertiary Button (Draw-in Underline)
                </span>
                <TertiaryButton label="عرض مسودة الشروط الكاملة" />
              </div>
            </div>

            {/* Icon Buttons (Canonical 48px Glass Circle) */}
            <div className="pt-4 border-t border-[#E9DFD0] space-y-2">
              <span className="text-xs text-[#130F08]/65 block font-semibold">
                Icon Buttons: canonical 48px glass circle (Heights 40, 48, 56)
              </span>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <IconButton size="40" label="حفظ">
                    <Bookmark className="w-4 h-4" />
                  </IconButton>
                  <span className="text-xs text-[#130F08]/65 font-medium">40px</span>
                </div>

                <div className="flex items-center gap-2">
                  <IconButton size="48" label="إضافة">
                    <Plus className="w-5 h-5" />
                  </IconButton>
                  <span className="text-xs text-[#14756E] font-semibold">48px (Standard)</span>
                </div>

                <div className="flex items-center gap-2">
                  <IconButton size="56" label="مشاركة">
                    <Share2 className="w-6 h-6" />
                  </IconButton>
                  <span className="text-xs text-[#130F08]/65 font-medium">56px</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Glass Levels Utilities */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#14756E]">
            <Layers className="w-3.5 h-3.5" />
            <span>4. مستويات الزجاج (Glass Utilities)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* glass-light */}
            <div className="p-5 rounded-3xl glass-light border border-white/80 space-y-2 shadow-xs">
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#14756E]/15 text-[#14756E] font-semibold">
                glass-light
              </span>
              <h4 className="text-base font-semibold text-[#130F08]">
                زجاج فاتح (Base Glass)
              </h4>
              <p className="text-xs text-[#130F08]/75 leading-relaxed">
                خلفية rgba(255,255,255,0.62)، ضبابية 24px، إشباع 160%، حدود 1px rgba(255,255,255,0.7)، وظلال ناعمة.
              </p>
            </div>

            {/* glass-dark */}
            <div className="p-5 rounded-3xl glass-dark border border-white/20 space-y-2 text-[#FAF6EF] shadow-md">
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/20 text-[#FAF6EF] font-semibold">
                glass-dark
              </span>
              <h4 className="text-base font-semibold text-[#FAF6EF]">
                زجاج داكن (Dark Tinted Glass)
              </h4>
              <p className="text-xs text-[#FAF6EF]/85 leading-relaxed">
                خلفية rgba(19,15,8,0.38)، ضبابية 28px، إشباع 140%، حدود 1px rgba(255,255,255,0.22)، ولمعان علوي داخلي.
              </p>
            </div>
          </div>
        </section>

        {/* Section 5: Signature CompassDial & CardDeck */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#14756E]">
              <Disc className="w-3.5 h-3.5" />
              <span>5. المكونات التفاعلية الرئيسية (CompassDial &amp; CardDeck)</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* CompassDial */}
            <div className="p-5 rounded-3xl glass-light border border-[#E9DFD0] space-y-3 shadow-xs">
              <span className="text-xs font-semibold text-[#130F08] block">
                محدد البوصلة الدائري: {cities.find((c) => c.id === selectedCity)?.label}
              </span>
              <div className="rounded-2xl bg-white border border-[#E9DFD0] overflow-hidden shadow-2xs">
                <CompassDial
                  options={cities}
                  value={selectedCity}
                  onChange={setSelectedCity}
                />
              </div>
            </div>

            {/* CardDeck */}
            <div className="p-5 rounded-3xl glass-light border border-[#E9DFD0] space-y-3 shadow-xs">
              <span className="text-xs font-semibold text-[#130F08] block">
                حزمة البطاقات الثلاثية المتراكبة (CardDeck):
              </span>
              <div className="max-w-xs mx-auto">
                <CardDeck
                  items={INITIAL_PROPERTIES}
                  renderCard={(property) => (
                    <PaperCard className="p-4 space-y-3 shadow-sm border border-[#E9DFD0]">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <NeedleBadge rank={property.preRank as 1 | 2 | 3} size="sm" />
                          <h4 className="text-sm font-semibold text-[#130F08]">{property.title}</h4>
                        </div>
                        <BdiNumber
                          value={property.formattedPrice}
                          className="text-xs font-bold text-[#130F08]"
                        />
                      </div>

                      <div className="h-24 rounded-2xl overflow-hidden border border-[#E9DFD0]">
                        <PropertyImage
                          image={property.images?.[0]}
                          tone={property.colorTone}
                          alt={property.title}
                          containerClassName="w-full h-full"
                        />
                      </div>

                      <p className="text-xs text-[#130F08]/80 line-clamp-2">
                        {property.keyAdvantage}
                      </p>
                    </PaperCard>
                  )}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Section 6: Chips & Options */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#14756E]">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>6. رقائق الاختيار وبطاقات الخيارات (SelectChip &amp; OptionCard)</span>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-[#E9DFD0] space-y-6 shadow-2xs">
            {/* Select Chips */}
            <div className="space-y-2">
              <span className="text-xs text-[#130F08]/65 block font-semibold">
                Selectable Pill Chips (40px Full Pill, Teal selection)
              </span>
              <div className="flex flex-wrap gap-2.5">
                <SelectChip
                  label="شراء بالكاش"
                  selected={selectedChips.includes("cash")}
                  onClick={() => toggleChip("cash")}
                />
                <SelectChip
                  label="تمويل عقاري"
                  selected={selectedChips.includes("mortgage")}
                  onClick={() => toggleChip("mortgage")}
                />
                <SelectChip
                  label="فيلا مستقلة"
                  selected={selectedChips.includes("villa")}
                  onClick={() => toggleChip("villa")}
                />
                <SelectChip
                  label="شقة دور كامل"
                  selected={selectedChips.includes("apt")}
                  onClick={() => toggleChip("apt")}
                />
              </div>
            </div>

            {/* Option Cards */}
            <div className="space-y-2 pt-2 border-t border-[#E9DFD0]">
              <span className="text-xs text-[#130F08]/65 block font-semibold">
                Option Cards (48px Glass Circle Icon, Teal selection check)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <OptionCard
                  title="استشارة عقار محدد"
                  subtitle="تحليل متكامل لعقار واحد تفكر بشرائه"
                  badge="شائع"
                  selected={selectedOption === "opt1"}
                  onClick={() => setSelectedOption("opt1")}
                />
                <OptionCard
                  title="مقارنة متعددة (حتى 3 عقارات)"
                  subtitle="مصفوفة تفاضلية تكشف المقايضات الخفية"
                  selected={selectedOption === "opt2"}
                  onClick={() => setSelectedOption("opt2")}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Section 7: FloatingNav Preview */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#14756E]">
            <Navigation className="w-3.5 h-3.5" />
            <span>7. شريط التنقل السفلي العائم (FloatingNav)</span>
          </div>

          <div className="p-6 rounded-3xl glass-light border border-[#E9DFD0] space-y-4 shadow-2xs">
            <p className="text-xs text-[#130F08]/75">
              كبسولة زجاجية تطفو 16px فوق قاع الشاشة مع مؤشر داكن متحرك بفيزياء زنبركية:
            </p>

            <div className="py-4 flex justify-center">
              <div className="relative w-full max-w-[380px]">
                <FloatingNav
                  activeItem={activeNav}
                  onChange={setActiveNav}
                  className="static w-full mx-auto"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Section 8: Cartography & MapView (<MapView> Mini & Full) */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#14756E]">
              <MapPin className="w-3.5 h-3.5" />
              <span>8. الخريطة المعمارية المتجهة (MapView: Mini &amp; Full)</span>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-[#E9DFD0] space-y-6 shadow-2xs">
            <p className="text-xs text-[#130F08]/75 leading-relaxed">
              خريطة متجهة نقية (SVG) مبنية من درجات الهوية البصرية: أرض عاجية (#FAF6EF)، مربعات رملية (#E9DFD0)، شوارع بيضاء، مسطحات مائية فيروزية، وحدائق بلون الميرمية الهادئ.
            </p>

            {/* Mini Map Variant (160px height) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#130F08]">
                  أ. النسخة المصغرة (Mini Variant - 160px غير تفاعلية):
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#E9DFD0] text-[#130F08] font-medium">
                  لشاشات النتائج والقوائم
                </span>
              </div>
              <div className="w-full max-w-md mx-auto">
                <MapView variant="mini" />
              </div>
            </div>

            {/* Full Map Variant (Interactive with Drag, Zoom, Inertia, Callouts) */}
            <div className="space-y-2 pt-4 border-t border-[#E9DFD0]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#130F08]">
                  ب. النسخة الكاملة (Full Variant - قابلة للسحب والتكبير مع بطاقة الاستدعاء الزجاجية):
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#14756E]/10 text-[#14756E] font-medium">
                  لتبويب الموقع في تفاصيل العقار
                </span>
              </div>
              <p className="text-xs text-[#130F08]/65">
                تتضمن دبابيس نحاسية متدرجة، هالة نبضية حول الخيار النشط، دبوس مقر العمل بلون الإسبريسو، وحلقة وقت الوصول (20 دقيقة). جرب سحب الخريطة أو التكبير أو النقر على أحد الدبابيس.
              </p>
              <div className="w-full">
                <MapView variant="full" />
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

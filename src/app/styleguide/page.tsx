"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  EASING_CSS,
  DURATION,
  DURATION_MS,
  TRANSITIONS,
  scrollRevealVariants,
  scrollReveal60fpsVariants,
  heroEntranceVariants,
  microInteractionVariants,
  staggerContainerVariants,
  getAccessibleVariant,
} from "@/lib/motion";
import { elongateWord } from "@/lib/typography";
import {
  BawsalaCompass,
  BawsalaWordmark,
  BawsalaLogo,
  CompassDivider,
  HeroCompassWatermark,
  BawsalaLoading,
  BawsalaEmptyState,
  IntroOverlay,
  CompassLoader,
  CompassLoaderState,
  AnalysisLoadingOverlay,
  CityCompassSelector,
} from "@/components/brand";
import { CityArcSelector, type CityData } from "@/components/city-wheel";
import { BawsalaNavbar } from "@/components/layout/bawsala-navbar";
import { HeroSection } from "@/components/home/hero-section";
import { MagneticButton } from "@/components/home/magnetic-button";
import { HeroConsultationWrapper } from "@/components/home/hero-consultation-wrapper";
import { ConsultationCard } from "@/components/home/consultation-card";
import { ALLOWED_CITIES, type AllowedCity } from "@/lib/constants/cities";
import {
  InstrumentButton,
  InstrumentCard,
  InstrumentChip,
  InstrumentInput,
  InstrumentSlider,
  InstrumentPhaseBadge,
  StackedSection,
  CompassPageTransition,
} from "@/components/ui";
import {
  Check,
  Copy,
  RotateCcw,
  Sparkles,
  Sliders,
  Compass,
  Palette,
  Type,
  Activity,
  ArrowRight,
  Layers,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Play,
} from "lucide-react";

// Color Palette Definitions
interface ColorToken {
  name: string;
  variable: string;
  hex: string;
  role: string;
  usage: string;
  contrastWithNavy: string;
  isDark: boolean;
}

const COLOR_TOKENS: ColorToken[] = [
  {
    name: "Cream (الورق العاجي الطبيعي)",
    variable: "--cream",
    hex: "#F3EFE7",
    role: "Page background, quiet editorial paper",
    usage: "خلفية الصفحات الأساسية، الإحساس الهادئ بالورق الفاخر",
    contrastWithNavy: "14.2:1 (AAA)",
    isDark: false,
  },
  {
    name: "Paper (الأسطح والبطاقات)",
    variable: "--paper",
    hex: "#FAF8F3",
    role: "Cards, surfaces, wells",
    usage: "أسطح البطاقات، الحاويات المرتفعة، النوافذ المنسدلة",
    contrastWithNavy: "15.8:1 (AAA)",
    isDark: false,
  },
  {
    name: "Navy (الحبر الكحلي الأساسي)",
    variable: "--navy",
    hex: "#0F1A2B",
    role: "All primary text, icons, primary buttons",
    usage: "العناوين الرئيسية، النصوص، الأيقونات، الأزرار الأساسية",
    contrastWithNavy: "1.00:1 (Ink)",
    isDark: true,
  },
  {
    name: "Midnight (أزرق منتصف الليل)",
    variable: "--midnight",
    hex: "#1C2E4A",
    role: "Headings accents, hover states",
    usage: "الكلمات المميزة في العناوين، حالات التفاعل والتحويم",
    contrastWithNavy: "1.45:1",
    isDark: true,
  },
  {
    name: "Dusty Blue (الأزرق المغبر)",
    variable: "--dusty-blue",
    hex: "#52677D",
    role: "Secondary text, labels",
    usage: "النصوص الثانوية، التصنيفات والشروحات",
    contrastWithNavy: "3.28:1",
    isDark: false,
  },
  {
    name: "Mist (الضباب الفضي)",
    variable: "--mist",
    hex: "#BDC4D4",
    role: "Hairlines, borders, inactive states",
    usage: "الخطوط الفاصلة، الحدود الدقيقة 1px، الحالات غير النشطة",
    contrastWithNavy: "9.20:1 (AAA)",
    isDark: false,
  },
];

export default function StyleguidePage() {
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [reduceMotionMock, setReduceMotionMock] = useState(false);
  const [replayKey, setReplayKey] = useState(0);
  const [tatweelCount, setTatweelCount] = useState(5);
  const [activeTab, setActiveTab] = useState<"instruments" | "city-wheel" | "hero-nav" | "loader" | "logo" | "palette" | "typography" | "motion" | "components">("instruments");
  const [playIntro, setPlayIntro] = useState(false);

  // City Arc Wheel state in styleguide
  const [selectedArcCity, setSelectedArcCity] = useState<AllowedCity>("الرياض");
  const [selectedArcData, setSelectedArcData] = useState<CityData | null>(null);

  // Distinctive precision instrument library states
  const [selectedChips, setSelectedChips] = useState<string[]>(["مطابق للكود", "صك إلكتروني"]);
  const [demoSliderVal, setDemoSliderVal] = useState(68);
  const [demoBadgeStep, setDemoBadgeStep] = useState(2);
  const [demoInputValue, setDemoInputValue] = useState("حي النرجس، الرياض");
  const [pageTransitionTrigger, setPageTransitionTrigger] = useState(0);

  // Compass interactive state controls in styleguide
  const [interactiveNeedleAngle, setInteractiveNeedleAngle] = useState(15);
  const [interactiveDialAngle, setInteractiveDialAngle] = useState(0);
  const [compassInteractiveSize, setCompassInteractiveSize] = useState(64);
  const [wordmarkTracking, setWordmarkTracking] = useState("0.35em");

  // CompassLoader interactive demo states
  const [loaderDemoState, setLoaderDemoState] = useState<CompassLoaderState>("searching");
  const [loaderDemoSize, setLoaderDemoSize] = useState(88);
  const [loaderDemoAngle, setLoaderDemoAngle] = useState(15);
  const [showAnalysisDemo, setShowAnalysisDemo] = useState(false);
  const [analysisIsLoading, setAnalysisIsLoading] = useState(true);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedToken(label);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const handleReplayMotion = () => {
    setReplayKey((prev) => prev + 1);
  };

  // Selected accessible variants based on reduced motion toggle
  const activeScrollVariant = getAccessibleVariant(scrollRevealVariants, reduceMotionMock);
  const active60fpsVariant = getAccessibleVariant(scrollReveal60fpsVariants, reduceMotionMock);
  const activeHeroVariant = getAccessibleVariant(heroEntranceVariants, reduceMotionMock);

  return (
    <div
      dir="rtl"
      lang="ar"
      className="min-h-screen bg-[var(--cream)] text-[var(--navy)] font-body relative overflow-x-hidden selection:bg-[var(--mist)] selection:text-[var(--navy)]"
    >
      {/* Top Header / Brand Bar */}
      <header className="sticky top-0 z-40 bg-[var(--paper)]/90 backdrop-blur-md border-b border-[var(--mist)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-2xl bg-[var(--cream)] border border-[var(--mist)] flex items-center justify-center text-[var(--navy)] shadow-xs">
              <Compass className="w-6 h-6 text-[var(--navy)]" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <span className="font-display font-bold text-xl text-[var(--navy)] tracking-tight">
                  بَوصَلَـ{'\u0640'.repeat(3)}ة العَقَار
                </span>
                <span className="wordmark-latin text-xs text-[var(--dusty-blue)] border-r border-[var(--mist)] pr-3 hidden sm:inline-block">
                  BAWSALA
                </span>
              </div>
              <p className="text-xs text-[var(--dusty-blue)] mt-0.5">
                دليل نظام التصميم المرئي التحريري • Light Editorial Paper & Navy Ink
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-xs text-[var(--dusty-blue)] hover:text-[var(--navy)] transition-colors flex items-center gap-1.5 px-4 py-2 rounded-full border border-[var(--mist)] hover:border-[var(--navy)] bg-[var(--paper)]"
            >
              <span>العودة للرئيسية</span>
              <ArrowRight className="w-3.5 h-3.5 rotate-180" />
            </Link>

            <button
              onClick={() => setReduceMotionMock((prev) => !prev)}
              className={`text-xs px-3 py-2 rounded-lg border flex items-center gap-1.5 transition-all ${
                reduceMotionMock
                  ? "bg-[rgba(204,160,84,0.15)] border-[rgba(204,160,84,0.4)] text-[#CCA054]"
                  : "bg-[var(--midnight)] border-[rgba(82,103,125,0.3)] text-[var(--mist)] hover:text-[var(--buttercream)]"
              }`}
              title="محاكاة تفضيل تقليل الحركة (prefers-reduced-motion)"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>
                {reduceMotionMock ? "تقليل الحركة: مفعل (Fade فقط)" : "تقليل الحركة: معطل"}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-16">
        {/* Hero Section of Style Guide */}
        <section className="relative rounded-3xl p-8 sm:p-12 border border-[rgba(82,103,125,0.3)] bg-gradient-to-b from-[#1C2E4A] via-[#142339] to-[#0F1A2B] overflow-hidden shadow-2xl">
          <div className="absolute top-0 left-0 right-0 h-40 bg-[radial-gradient(circle_at_50%_0%,rgba(82,103,125,0.18)_0%,transparent_70%)] pointer-events-none" />

          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-[rgba(82,103,125,0.2)] border border-[rgba(82,103,125,0.4)] text-[var(--mist)] mb-6">
              <Sparkles className="w-3.5 h-3.5 text-[var(--buttercream)]" />
              <span>نظام الهوية البصرية الشامل • بوصلة العقار 2.0</span>
            </div>

            <h1 className="font-display font-black text-3xl sm:text-5xl lg:text-6xl text-[var(--buttercream)] headline-tight mb-4">
              نظام التصميم{" "}
              <span className="stretch text-[var(--buttercream)] border-b-2 border-[var(--dusty-blue)] pb-1">
                {elongateWord("المستقل", tatweelCount)}
              </span>{" "}
              للقرار العقاري
            </h1>

            <p className="text-[var(--mist)] text-base sm:text-lg leading-relaxed mb-8 max-w-2xl">
              منظومة بصرية داكنة فاخرة لا تعتمد على الأسود الصرف ولا الأبيض الناصع. تدمج بين الأزرق الليلي العميق، والسطوح المدرجة، وكريم الزبدة الدافئ، مع خطوط عرض عربية هندسية تدعم مدّ الحروف (الكشيدة)، ونظام حركة متوازن بسرعة 60 إطاراً في الثانية.
            </p>

            {/* Quick Navigation Tabs */}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-[rgba(82,103,125,0.25)]">
              {[
                { id: "instruments", label: "مكتبة الآلات القياسية (Precision Library)", icon: Sliders },
                { id: "city-wheel", label: "عجلة اختيار المدينة (City Arc Wheel)", icon: Compass },
                { id: "hero-nav", label: "شريط التنقل وقسم البطل (Navbar & Hero)", icon: Compass },
                { id: "loader", label: "مؤشر التحميل الذكي (Compass Loader)", icon: RotateCcw },
                { id: "logo", label: "نظام الشعار وشاشة البداية (Logo & Intro)", icon: Compass },
                { id: "palette", label: "لوحة الألوان (Tokens)", icon: Palette },
                { id: "typography", label: "مقياس الخطوط والكشيدة", icon: Type },
                { id: "motion", label: "منظومة الحركة (Motion System)", icon: Activity },
                { id: "components", label: "مكونات الواجهة (Components)", icon: Layers },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                    className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs sm:text-sm font-medium transition-all ${
                      isActive
                        ? "bg-[var(--buttercream)] text-[var(--deep-navy)] shadow-md font-semibold"
                        : "bg-[var(--midnight)] text-[var(--mist)] border border-[rgba(82,103,125,0.3)] hover:text-[var(--buttercream)] hover:border-[rgba(82,103,125,0.6)]"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Live Intro Animation Overlay (Triggered on Demand) */}
        {playIntro && (
          <IntroOverlay
            forcePlay
            onIntroComplete={() => setPlayIntro(false)}
          />
        )}

        {/* SECTION: CITY ARC WHEEL SELECTION SCREEN */}
        {activeTab === "city-wheel" && (
          <section id="city-wheel" className="space-y-12">
            <div className="border-b border-[rgba(82,103,125,0.25)] pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[rgba(82,103,125,0.2)] border border-[rgba(82,103,125,0.35)] text-[var(--mist)] mb-3">
                  <Compass className="w-3.5 h-3.5 text-[var(--buttercream)]" />
                  <span>عجلة القوس الدوارة • Arc/Dial Scrolling Drum</span>
                </div>
                <h2 className="font-display font-black text-2xl sm:text-3xl text-[var(--buttercream)]">
                  شاشة اختيار المدينة (City Arc Wheel Selector)
                </h2>
                <p className="text-xs sm:text-sm text-[var(--mist)] mt-1.5 max-w-3xl leading-relaxed">
                  قائمة دوران أسطوانية منحنية مستوحاة من الآلات الملاحية. تقع المدينة المختارة في المنتصف الأيمن بحجم ضخم (--buttercream)، مع دوران وتلاشي المدن المجاورة حتى ±45° في لون الغسق (--dusty-blue) مع تزايد ضبابية المسافة، وتزامن كامل مع إبرة البوصلة واهتزازات التكات (Haptic Tick).
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  href="/city-selection"
                  className="btn-primary px-5 py-2.5 rounded-full bg-[var(--buttercream)] text-[var(--midnight)] text-xs font-bold flex items-center gap-2 shadow-md hover:bg-[#dedcd6] transition-all"
                >
                  <span>معاينة في وضع ملء الشاشة</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Interactive Arc Wheel Component */}
            <div className="rounded-3xl border border-[rgba(82,103,125,0.35)] bg-[rgba(15,26,43,0.85)] shadow-2xl overflow-hidden">
              <CityArcSelector
                initialCity={selectedArcCity}
                onSelectCity={(city, data) => {
                  setSelectedArcCity(city);
                  setSelectedArcData(data);
                }}
              />
            </div>

            {/* Live Telemetry Card if Selected */}
            {selectedArcData && (
              <div className="surface-card p-5 flex flex-wrap items-center justify-between gap-4 border border-[var(--buttercream)]/30">
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full bg-[var(--buttercream)] animate-pulse" />
                  <div>
                    <div className="text-xs font-bold text-[var(--buttercream)]">
                      الوجهة الجغرافية النشطة في المحاكي: {selectedArcData.name} ({selectedArcData.heading}° Azimuth)
                    </div>
                    <div className="text-[11px] text-[var(--mist)]">
                      {selectedArcData.coordinates} • {selectedArcData.elevation}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 font-mono text-xs text-[var(--dusty-blue)]">
                  <span>الكود: {selectedArcData.code}</span>
                  <span>•</span>
                  <span>المنطقة: {selectedArcData.region}</span>
                </div>
              </div>
            )}

            {/* Technical Specifications Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="surface-card p-6 space-y-3">
                <span className="text-[11px] font-mono text-[var(--dusty-blue)] block uppercase">
                  1. فيزياء الدوران والزنبرك (Spring Physics)
                </span>
                <h4 className="font-display font-bold text-sm text-[var(--buttercream)]">
                  Inertia + Snap with Spring
                </h4>
                <p className="text-xs text-[var(--mist)] leading-relaxed">
                  تعتمد الحركة على زنبرك <code className="text-[var(--buttercream)]">stiffness: 280, damping: 28</code> مع قفل التدوير عند زاوية ±45° وتناقص الحجم إلى 55% مع تشويش بصري تدريجي.
                </p>
              </div>

              <div className="surface-card p-6 space-y-3">
                <span className="text-[11px] font-mono text-[var(--dusty-blue)] block uppercase">
                  2. التغذية اللمسية والحركية (Haptics)
                </span>
                <h4 className="font-display font-bold text-sm text-[var(--buttercream)]">
                  Tactile Tick & Compass Needle Sync
                </h4>
                <p className="text-xs text-[var(--mist)] leading-relaxed">
                  تولد كل حركة اهتزازاً ميكانيكياً خفيفاً (15ms) على الأجهزة المحمولة مع صوت تكة ميكانيكية مصنعة، ودوران مباشر لإبرة <code className="text-[var(--buttercream)]">&lt;CompassLoader /&gt;</code> نحو السمت الجغرافي.
                </p>
              </div>

              <div className="surface-card p-6 space-y-3">
                <span className="text-[11px] font-mono text-[var(--dusty-blue)] block uppercase">
                  3. التوافق وسرعة الاستجابة (Responsiveness)
                </span>
                <h4 className="font-display font-bold text-sm text-[var(--buttercream)]">
                  390px Mobile Viewport Ready
                </h4>
                <p className="text-xs text-[var(--mist)] leading-relaxed">
                  يدعم السحب العمودي باللمس على الجوال، ويتكيف نصف قطر القوس بين 320px و520px لمنع أي تجاوز أفقي للشاشة.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* SECTION: DISTINCTIVE PRECISION INSTRUMENT COMPONENT LIBRARY */}
        {(activeTab === "instruments" || activeTab === "components") && (
          <section id="precision-library" className="space-y-16">
            <div className="border-b border-[rgba(82,103,125,0.25)] pb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[rgba(82,103,125,0.2)] border border-[rgba(82,103,125,0.35)] text-[var(--mist)] mb-3">
                <Sliders className="w-3.5 h-3.5 text-[var(--buttercream)]" />
                <span>فلسفة التصميم الفريدة: آلة قياس دقيقة (Precision Instrument)</span>
              </div>
              <h2 className="font-display font-black text-2xl sm:text-3xl text-[var(--buttercream)]">
                مكتبة المكونات القياسية المميزة (Distinctive Component Library)
              </h2>
              <p className="text-xs sm:text-sm text-[var(--mist)] mt-1.5 max-w-3xl leading-relaxed">
                مكونات فريدة مصممة لتجنيب بوصلة العقار المظهر القالبي النمطي. ترتكز على هوية الأجهزة الهندسية والملاحية (البوصلة، الأقراص المدرجة، تدريجات القياس، والإبر المغناطيسية) بأسلوب الزجاج الناعم الداكن.
              </p>
            </div>

            {/* 1. BUTTONS: Primary Circular Wipe & Ghost Self-Drawing Border */}
            <div className="surface-card p-6 sm:p-8 space-y-6">
              <div className="border-b border-[rgba(82,103,125,0.2)] pb-4">
                <span className="badge-pill text-[11px] mb-1">Pill Buttons with Dynamic Physics</span>
                <h3 className="font-display font-bold text-lg text-[var(--buttercream)]">
                  1. الأزرار البيضاوية (Buttons)
                </h3>
                <p className="text-xs text-[var(--mist)] mt-1 leading-relaxed">
                  <strong>الأساسي (Primary):</strong> تعبئة بلون كريم الزبدة، وعند التحويم تتوسع دائرة من لون الغسق (--mist) من نقطة دخول مؤشر الفأرة. <br />
                  <strong>الشبحي (Ghost):</strong> خط حدود شعري يرسم نفسه حول الزر بنظام (SVG Stroke Animation). مع أيقونة إبرة-سهم تدور في اتجاه التحويم.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Primary Button Showcase */}
                <div className="p-8 rounded-3xl bg-[rgba(15,26,43,0.7)] border border-[rgba(82,103,125,0.3)] flex flex-col items-center justify-center space-y-4 text-center">
                  <span className="text-[11px] font-mono text-[var(--dusty-blue)]">
                    Primary: Circular Wipe Effect + Rotating Needle
                  </span>
                  <div className="py-2">
                    <InstrumentButton variant="primary" size="lg">
                      بدء تدقيق القرار العقاري
                    </InstrumentButton>
                  </div>
                  <p className="text-[11px] text-[var(--mist)]">
                    مرر الفأرة من أي زاوية لمعاينة توسع دائرة المسح الضوئي ودوران إبرة التوجيه.
                  </p>
                </div>

                {/* Ghost Button Showcase */}
                <div className="p-8 rounded-3xl bg-[rgba(15,26,43,0.7)] border border-[rgba(82,103,125,0.3)] flex flex-col items-center justify-center space-y-4 text-center">
                  <span className="text-[11px] font-mono text-[var(--dusty-blue)]">
                    Ghost: Self-Drawing Border + Rotating Needle
                  </span>
                  <div className="py-2">
                    <InstrumentButton variant="ghost" size="lg">
                      استعراض الصكوك المعتمدة
                    </InstrumentButton>
                  </div>
                  <p className="text-[11px] text-[var(--mist)]">
                    عند التحويم، يرسم خط الإطار نفسه ذاتياً حول محيط الزر مع دوران الإبرة.
                  </p>
                </div>
              </div>

              {/* Size Scale Demo */}
              <div className="pt-4 border-t border-[rgba(82,103,125,0.2)] flex flex-wrap items-center justify-center gap-4">
                <InstrumentButton variant="primary" size="sm">
                  صغير (sm)
                </InstrumentButton>
                <InstrumentButton variant="primary" size="md">
                  متوسط (md)
                </InstrumentButton>
                <InstrumentButton variant="ghost" size="sm">
                  شبحي صغير (sm)
                </InstrumentButton>
                <InstrumentButton variant="ghost" size="md">
                  شبحي متوسط (md)
                </InstrumentButton>
              </div>
            </div>

            {/* 2. CARDS: Midnight Surfaces, Lift 6px, Spotlight & Corner Tick Marks */}
            <div className="surface-card p-6 sm:p-8 space-y-6">
              <div className="border-b border-[rgba(82,103,125,0.2)] pb-4">
                <span className="badge-pill text-[11px] mb-1">Measuring Frame & Spotlight Hover</span>
                <h3 className="font-display font-bold text-lg text-[var(--buttercream)]">
                  2. البطاقات الهندسية (Cards)
                </h3>
                <p className="text-xs text-[var(--mist)] mt-1">
                  أسطح من الأزرق الليلي (--midnight) بنصف قطر 28-32px، وحد شعري مع إضاءة علوية داخلية. عند التحويم: ترتفع البطاقة 6px، ويسطع الإطار، ويتبع كشاف ضوئي دائري خافت موضع الفأرة، مع علامات زوايا (Tick Marks) كإطار قياس هندسي.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <InstrumentCard interactive>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono text-[var(--dusty-blue)]">
                        METRIC #01
                      </span>
                      <span className="w-2 h-2 rounded-full bg-[var(--status-ok)] animate-pulse" />
                    </div>
                    <div>
                      <span className="text-xs text-[var(--mist)] block mb-1">مؤشر السلامة الهيكلية</span>
                      <span className="text-3xl font-display font-black text-[var(--buttercream)] block">96.8%</span>
                    </div>
                    <p className="text-xs text-[var(--mist)] leading-relaxed">
                      فحص هندسي مستقل لخرسانات الأساسات والعزل الإنشائي مطابق للكود السعودي.
                    </p>
                  </div>
                </InstrumentCard>

                <InstrumentCard interactive>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono text-[var(--dusty-blue)]">
                        FINANCIAL #02
                      </span>
                      <span className="w-2 h-2 rounded-full bg-[var(--buttercream)]" />
                    </div>
                    <div>
                      <span className="text-xs text-[var(--mist)] block mb-1">القيمة العادلة المقدرة</span>
                      <span className="text-3xl font-display font-black text-[var(--buttercream)] block">2,420,000</span>
                    </div>
                    <p className="text-xs text-[var(--mist)] leading-relaxed">
                      تحييد تضخيم المسوقين العقاريين وحساب سعر المتر الصافي الفعلي للصك.
                    </p>
                  </div>
                </InstrumentCard>

                <InstrumentCard interactive>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono text-[var(--dusty-blue)]">
                        LIFECYCLE #03
                      </span>
                      <span className="w-2 h-2 rounded-full bg-[var(--status-warn)]" />
                    </div>
                    <div>
                      <span className="text-xs text-[var(--mist)] block mb-1">تكاليف التشغيل (10 سنوات)</span>
                      <span className="text-3xl font-display font-black text-[var(--buttercream)] block">182,500</span>
                    </div>
                    <p className="text-xs text-[var(--mist)] leading-relaxed">
                      تقدير مصاريف الصيانة التنبؤية، استهلاك الطاقة، ورسوم اتحاد الملاك.
                    </p>
                  </div>
                </InstrumentCard>
              </div>
            </div>

            {/* 3. CHIPS / TAGS: Translucent Glass Pills with Buttercream Spring Flip */}
            <div className="surface-card p-6 sm:p-8 space-y-6">
              <div className="border-b border-[rgba(82,103,125,0.2)] pb-4">
                <span className="badge-pill text-[11px] mb-1">Springy Selection Flip</span>
                <h3 className="font-display font-bold text-lg text-[var(--buttercream)]">
                  3. الشرائح والوسوم الزجاجية (Chips / Tags)
                </h3>
                <p className="text-xs text-[var(--mist)] mt-1">
                  أقراص زجاجية شبه شفافة (أيقونة + تسمية) مع ضبابية خلفية وحد 1px. عند الاختيار: تمتلئ بلون كريم الزبدة وينقلب النص إلى الأزرق الليلي مع قفزة مقياس مرنة (Springy scale).
                </p>
              </div>

              <div className="p-8 rounded-3xl bg-[rgba(15,26,43,0.7)] border border-[rgba(82,103,125,0.3)] space-y-6">
                <div className="flex flex-wrap items-center gap-3">
                  {[
                    "مطابق لكود البناء السعودي",
                    "صك إلكتروني موثق",
                    "فحص ميكانيكي معتمد",
                    "ضمان هيكلي 10 سنوات",
                    "عزل حراري مزدوج",
                    "مواقف سيارات خاصة",
                  ].map((tag) => {
                    const isSelected = selectedChips.includes(tag);
                    return (
                      <InstrumentChip
                        key={tag}
                        label={tag}
                        selected={isSelected}
                        onSelect={() => {
                          setSelectedChips((prev) =>
                            isSelected ? prev.filter((t) => t !== tag) : [...prev, tag]
                          );
                        }}
                        icon={<ShieldCheck className="w-3.5 h-3.5" />}
                      />
                    );
                  })}
                </div>

                <div className="text-xs text-[var(--mist)] pt-2 border-t border-[rgba(82,103,125,0.2)]">
                  الوسوم النشطة حالياً:{" "}
                  <span className="text-[var(--buttercream)] font-bold">
                    {selectedChips.length > 0 ? selectedChips.join(" • ") : "لم يتم اختيار وسم"}
                  </span>
                </div>
              </div>
            </div>

            {/* 4. INPUTS & SLIDERS: Dark Wells with Compass-Tick Glow & Dial Thumb Sliders */}
            <div className="surface-card p-6 sm:p-8 space-y-6">
              <div className="border-b border-[rgba(82,103,125,0.2)] pb-4">
                <span className="badge-pill text-[11px] mb-1">Calibrated Instruments</span>
                <h3 className="font-display font-bold text-lg text-[var(--buttercream)]">
                  4. حقول الإدخال ومنزلقات التدريج (Inputs & Sliders)
                </h3>
                <p className="text-xs text-[var(--mist)] mt-1">
                  حقول إدخال بدون خط سفلي في تجاويف داكنة مدورة مع إشراق تدريجات البوصلة عند التركيز (Focus State). ومنزلقات بإبهام على شكل قرص بوصلة مدرج مع خطوط قياس تحت المسار.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Input Demonstration */}
                <div className="p-6 rounded-3xl bg-[rgba(15,26,43,0.7)] border border-[rgba(82,103,125,0.3)] space-y-4">
                  <span className="text-[11px] font-mono text-[var(--dusty-blue)] block">
                    Underline-less Well Input (Click to see Tick Ring Glow)
                  </span>
                  <InstrumentInput
                    label="الموقع أو الحي المستهدف"
                    value={demoInputValue}
                    onChange={(e) => setDemoInputValue(e.target.value)}
                    hint="انقر داخل الحقل لمعاينة ظهور حلقة تدريجات البوصلة المضيئة أعلى وأسفل الإطار."
                  />
                </div>

                {/* Slider Demonstration */}
                <div className="p-6 rounded-3xl bg-[rgba(15,26,43,0.7)] border border-[rgba(82,103,125,0.3)] space-y-4">
                  <span className="text-[11px] font-mono text-[var(--dusty-blue)] block">
                    Dial-Style Thumb Slider with Calibrated Ticks
                  </span>
                  <InstrumentSlider
                    label="ميزانية الشراء المستهدفة (ملايين ر.س)"
                    unit="م.ر"
                    min={1}
                    max={10}
                    step={0.5}
                    value={demoSliderVal / 10}
                    onChange={(val) => setDemoSliderVal(Math.round(val * 10))}
                  />
                  <p className="text-[11px] text-[var(--mist)]">
                    لاحظ إبهام البوصلة الدائري مع جوهرة الارتكاز وعلامات التدريج الدقيقة أسفل المسار.
                  </p>
                </div>
              </div>
            </div>

            {/* 5. STEPPERS / PHASE BADGES: Segmented Clockwise Dial Progress */}
            <div className="surface-card p-6 sm:p-8 space-y-6">
              <div className="border-b border-[rgba(82,103,125,0.2)] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="badge-pill text-[11px] mb-1">Clockwise Dial Progress</span>
                  <h3 className="font-display font-bold text-lg text-[var(--buttercream)]">
                    5. شارات المراحل وأقراص التقدم (Steppers / Phase Badges)
                  </h3>
                  <p className="text-xs text-[var(--mist)] mt-1">
                    شارة مراحل (مثل &quot;المرحلة الأولى مجانية&quot;) تتضمن قرصاً دائرياً صغيراً من تدريجات متباعدة تكتمل باتجاه عقارب الساعة مع تقدم الخطوات.
                  </p>
                </div>

                {/* Step Simulator Buttons */}
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4].map((step) => (
                    <button
                      key={step}
                      onClick={() => setDemoBadgeStep(step)}
                      className={`w-8 h-8 rounded-full text-xs font-mono font-bold transition-all ${
                        demoBadgeStep === step
                          ? "bg-[var(--buttercream)] text-[var(--midnight)] shadow-md"
                          : "bg-[var(--midnight)] text-[var(--mist)] border border-[rgba(82,103,125,0.3)]"
                      }`}
                    >
                      {step}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-8 rounded-3xl bg-[rgba(15,26,43,0.7)] border border-[rgba(82,103,125,0.3)] flex flex-wrap items-center justify-center gap-6">
                <InstrumentPhaseBadge
                  label="المرحلة الأولى مجانية"
                  sublabel="تحديد المدينة ونطاق العقارات"
                  currentStep={demoBadgeStep}
                  totalSteps={4}
                />

                <InstrumentPhaseBadge
                  label="التدقيق الهندسي ومطابقة الكود"
                  sublabel="فحص التصدعات والعزل المائي"
                  currentStep={demoBadgeStep}
                  totalSteps={4}
                  size="sm"
                />
              </div>
            </div>

            {/* 6. SECTION TRANSITIONS: Stacked-Sheet Feel */}
            <div className="surface-card p-6 sm:p-8 space-y-6">
              <div className="border-b border-[rgba(82,103,125,0.2)] pb-4">
                <span className="badge-pill text-[11px] mb-1">Stacked Sheets Transition</span>
                <h3 className="font-display font-bold text-lg text-[var(--buttercream)]">
                  6. انتقالات الأقسام المتراكبة (Section Transitions)
                </h3>
                <p className="text-xs text-[var(--mist)] mt-1">
                  تتداخل الأقسام بزوايا علوية دائرية كبيرة (36-48px)، حيث تنزلق كل ورقة فوق سابقتها أثناء التمرير بينما تتقلص السابقة قليلاً إلى 0.96 وتخفت إضاءتها لإعطاء إحساس الأوراق الهندسية المكدسة.
                </p>
              </div>

              {/* Stacked Sheet Demonstration Container */}
              <div className="p-4 sm:p-6 rounded-3xl bg-[rgba(15,26,43,0.85)] border border-[rgba(82,103,125,0.3)] space-y-4">
                <div className="relative pt-6">
                  {/* Sheet 1 */}
                  <StackedSection index={1} bgColor="bg-[#1C2E4A]">
                    <div className="p-6 text-center space-y-2">
                      <span className="badge-pill text-[10px]">Sheet 01</span>
                      <h4 className="font-display font-bold text-base text-[var(--buttercream)]">
                        الورقة الهندسية الأولى: فحص الصك والترخيص
                      </h4>
                      <p className="text-xs text-[var(--mist)] max-w-md mx-auto">
                        مراجعة الارتدادات النظامية وسلامة الإجراءات البلدية والقانونية.
                      </p>
                    </div>
                  </StackedSection>

                  {/* Sheet 2 */}
                  <StackedSection index={2} bgColor="bg-[#17273F]">
                    <div className="p-6 text-center space-y-2">
                      <span className="badge-pill text-[10px]">Sheet 02</span>
                      <h4 className="font-display font-bold text-base text-[var(--buttercream)]">
                        الورقة الهندسية الثانية: تدقيق العزل وكفاءة الطاقة
                      </h4>
                      <p className="text-xs text-[var(--mist)] max-w-md mx-auto">
                        تحليل الفاقد الحراري وجودة التمديدات وحماية الأسطح من التسريب.
                      </p>
                    </div>
                  </StackedSection>
                </div>
              </div>
            </div>

            {/* 7. PAGE TRANSITIONS: Midnight Curtain Sweep with Spinning Needle */}
            <div className="surface-card p-6 sm:p-8 space-y-6">
              <div className="border-b border-[rgba(82,103,125,0.2)] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="badge-pill text-[11px] mb-1">Vertical Curtain Sweep (600-800ms)</span>
                  <h3 className="font-display font-bold text-lg text-[var(--buttercream)]">
                    7. انتقال الصفحات بالستارة الملاحية (Page Transitions)
                  </h3>
                  <p className="text-xs text-[var(--mist)] mt-1">
                    عند تغيير المسار، تهبط ستارة عمودية بلون الأزرق الليلي (--midnight) تدور في مركزها إبرة البوصلة دورة كاملة 360°، ثم تنكشف الصفحة الجديدة في غضون 700ms.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setPageTransitionTrigger((prev) => prev + 1)}
                  className="btn-primary text-xs py-2 px-5 shadow-lg flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>محاكاة انتقال الصفحة الآن</span>
                </button>
              </div>

              {/* Page Transition Component Instance for Demo */}
              <CompassPageTransition triggerKey={pageTransitionTrigger} />

              <div className="p-6 rounded-2xl bg-[rgba(15,26,43,0.6)] border border-[rgba(82,103,125,0.25)] text-xs text-[var(--mist)] space-y-2">
                <div className="font-semibold text-[var(--buttercream)]">مواصفات انتقال الستارة:</div>
                <ul className="list-disc list-inside space-y-1 text-[11px] leading-relaxed">
                  <li>المدة الزمنية الإجمالية: 720ms مع منحنى حركة معمارية `cubic-bezier(0.65, 0, 0.35, 1)`.</li>
                  <li>دوران كامل لإبرة البوصلة في مركز الشاشة مع توهج هادئ بلون كريم الزبدة.</li>
                  <li>محايد بدون أي تقطيع بصري أو وميض أبيض (Zero Flash).</li>
                </ul>
              </div>
            </div>

            {/* 8. CUSTOM CURSOR: Precision Ring Turning Into Needle Over Interactive Elements */}
            <div className="surface-card p-6 sm:p-8 space-y-6">
              <div className="border-b border-[rgba(82,103,125,0.2)] pb-4">
                <span className="badge-pill text-[11px] mb-1">Desktop Precision Cursor</span>
                <h3 className="font-display font-bold text-lg text-[var(--buttercream)]">
                  8. المؤشر المكتبي المخصص (Custom Instrument Cursor)
                </h3>
                <p className="text-xs text-[var(--mist)] mt-1">
                  حلقة قياس خافتة على أجهزة الكمبيوتر تتبع الفأرة بنوابض فيزيائية رشيقة. عند التحويم فوق أي عنصر تفاعلي (أزرار، روابط، حقول إدخال)، تتقلص الحلقة وتتحول فورياً إلى إبرة بوصلة ماسية مائلة بزاوية 45° مع جوهرة ارتكاز نابضة.
                </p>
              </div>

              <div className="p-8 rounded-3xl bg-[rgba(15,26,43,0.7)] border border-[rgba(82,103,125,0.3)] flex flex-col sm:flex-row items-center justify-around gap-6 text-center">
                {/* Visual Cursor Illustration: Default State */}
                <div className="space-y-3 flex flex-col items-center">
                  <div className="w-14 h-14 rounded-full border border-[var(--buttercream)] border-opacity-50 flex items-center justify-center relative shadow-[0_0_12px_rgba(209,207,201,0.2)]">
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--buttercream)]" />
                    <div className="absolute top-0 w-[1.5px] h-1.5 bg-[var(--buttercream)]" />
                    <div className="absolute bottom-0 w-[1.5px] h-1.5 bg-[var(--buttercream)]" />
                    <div className="absolute left-0 h-[1.5px] w-1.5 bg-[var(--buttercream)]" />
                    <div className="absolute right-0 h-[1.5px] w-1.5 bg-[var(--buttercream)]" />
                  </div>
                  <span className="text-xs font-semibold text-[var(--buttercream)]">الحالة الطبيعية (Measuring Ring)</span>
                  <span className="text-[11px] text-[var(--mist)]">حلقة خافتة مع صليب تحديد</span>
                </div>

                {/* Arrow */}
                <ArrowRight className="w-6 h-6 text-[var(--dusty-blue)] hidden sm:block rotate-180" />

                {/* Visual Cursor Illustration: Interactive State */}
                <div className="space-y-3 flex flex-col items-center">
                  <div className="w-14 h-14 rounded-full bg-[rgba(28,46,74,0.6)] border border-[rgba(82,103,125,0.4)] flex items-center justify-center relative shadow-[0_0_20px_rgba(209,207,201,0.4)]">
                    <div className="w-8 h-8 text-[var(--buttercream)] rotate-45">
                      <svg viewBox="0 0 20 20" fill="none" className="w-full h-full">
                        <polygon points="10,1 13,10 10,19" fill="currentColor" opacity="0.95" />
                        <polygon points="10,1 7,10 10,19" fill="currentColor" opacity="0.45" />
                        <circle cx="10" cy="10" r="2.5" fill="#0F1A2B" stroke="currentColor" strokeWidth="0.8" />
                      </svg>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-[var(--buttercream)]">حالة التفاعل (Precision Needle)</span>
                  <span className="text-[11px] text-[var(--mist)]">إبرة بوصلة ماسية مع جوهرة ارتكاز</span>
                </div>
              </div>
            </div>
          </section>
        )}
        {(activeTab === "hero-nav" || activeTab === "components") && (
          <section id="navbar-hero" className="space-y-12">
            <div className="border-b border-[rgba(82,103,125,0.25)] pb-4">
              <h2 className="font-display font-black text-2xl text-[var(--buttercream)] flex items-center gap-3">
                <Compass className="w-6 h-6 text-[var(--dusty-blue)]" />
                <span>شريط التنقل وقسم البطل المعماري (Floating Island Navbar & Hero)</span>
              </h2>
              <p className="text-xs sm:text-sm text-[var(--mist)] mt-1">
                جزيرة تنقل طافية ودائرية في أعلى الصفحة مع مؤشر إبرة البوصلة الإنزلاقي، وقسم البطل الداكن مع كشف سطري للعنوان وكشيدة ممتدة، وصورة مائلة بفيزياء الانزلاق المنظوري وزر مغناطيسي جاذب.
              </p>
            </div>

            {/* 1. Navbar Interactive Showcase */}
            <div className="surface-card p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[rgba(82,103,125,0.2)] pb-4">
                <div>
                  <span className="badge-pill text-[11px] mb-1">Interactive Island Navbar</span>
                  <h3 className="font-display font-bold text-lg text-[var(--buttercream)]">
                    جزيرة التنقل الطافية (&lt;BawsalaNavbar /&gt;)
                  </h3>
                  <p className="text-xs text-[var(--mist)] mt-1">
                    شكل بيضاوي متكامل (rounded-full) بخلفية شبه شفافة (55%) وضبابية 20px مع إبرة البوصلة التي تنزلق بنابض فيزيائي بين الروابط النشطة.
                  </p>
                </div>
              </div>

              {/* In-Page Interactive Navbar Demonstration */}
              <div className="p-8 py-14 rounded-3xl bg-[rgba(15,26,43,0.7)] border border-[rgba(82,103,125,0.3)] relative overflow-hidden flex flex-col items-center justify-center min-h-[160px]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(82,103,125,0.15)_0%,transparent_70%)] pointer-events-none" />

                {/* Render BawsalaNavbar inside preview */}
                <div className="relative z-10 w-full max-w-4xl">
                  <BawsalaNavbar sessionCount={3} className="!relative !top-0 !p-0" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-[rgba(15,26,43,0.5)] border border-[rgba(82,103,125,0.2)] space-y-1">
                  <span className="text-xs font-bold text-[var(--buttercream)] block">إبرة البوصلة الانزلاقية</span>
                  <p className="text-[11px] text-[var(--mist)] leading-relaxed">
                    مؤشر ماسي دقيق يعتمد على Framer Motion layoutId مع إضاءة خافتة، ينتقل بفيزياء النابض دون استخدام خط سفلي تقليدي.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[rgba(15,26,43,0.5)] border border-[rgba(82,103,125,0.2)] space-y-1">
                  <span className="text-xs font-bold text-[var(--buttercream)] block">تفاعل التحويم (Hover Lift & Glow)</span>
                  <p className="text-[11px] text-[var(--mist)] leading-relaxed">
                    عند تمرير المؤشر فوق أي رابط، يرتفع النص بمقدار 2px مع إشراق ضوئي خافت بلون كريم الزبدة.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[rgba(15,26,43,0.5)] border border-[rgba(82,103,125,0.2)] space-y-1">
                  <span className="text-xs font-bold text-[var(--buttercream)] block">الاستجابة للتمرير (Scroll Physics)</span>
                  <p className="text-[11px] text-[var(--mist)] leading-relaxed">
                    تتقلص الجزيرة تلقائياً بنسبة خفيفة وتتقارب هوامش الروابط عند النزول، وتتمدد بسلاسة عند الصعود.
                  </p>
                </div>
              </div>
            </div>

            {/* 2. Magnetic CTA Button Showcase */}
            <div className="surface-card p-6 sm:p-8 space-y-6">
              <div className="border-b border-[rgba(82,103,125,0.2)] pb-4">
                <span className="badge-pill text-[11px] mb-1">Magnetic Physics Button</span>
                <h3 className="font-display font-bold text-lg text-[var(--buttercream)]">
                  الزر المغناطيسي التفاعلي (&lt;MagneticButton /&gt;)
                </h3>
                <p className="text-xs text-[var(--mist)] mt-1">
                  يتتبع الزر موضع مؤشر الفأرة وينجذب نحوه بقوة نوابض فيزيائية، مع سهم ينزلق بسلاسة للأمام.
                </p>
              </div>

              <div className="py-12 px-6 rounded-3xl bg-[rgba(15,26,43,0.7)] border border-[rgba(82,103,125,0.3)] flex flex-wrap items-center justify-center gap-8">
                {/* Primary Magnetic CTA */}
                <div className="text-center space-y-2">
                  <span className="text-[10px] font-mono text-[var(--dusty-blue)] block">Primary (Buttercream / Midnight)</span>
                  <MagneticButton variant="primary">
                    بدء دراسة قرار استشاري جديدة
                  </MagneticButton>
                </div>

                {/* Secondary Ghost CTA */}
                <div className="text-center space-y-2">
                  <span className="text-[10px] font-mono text-[var(--dusty-blue)] block">Ghost (Border / Mist)</span>
                  <MagneticButton variant="ghost" showArrow={false}>
                    استعراض جلسات التقييم
                  </MagneticButton>
                </div>
              </div>
            </div>

            {/* 3. Hero Section Live Preview */}
            <div className="surface-card p-6 sm:p-8 space-y-6">
              <div className="border-b border-[rgba(82,103,125,0.2)] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="badge-pill text-[11px] mb-1">Full Hero Experience</span>
                  <h3 className="font-display font-bold text-lg text-[var(--buttercream)]">
                    قسم البطل المعماري مع بطاقة البدء المتداخلة
                  </h3>
                  <p className="text-xs text-[var(--mist)] mt-1">
                    كشف تدريجي للعنوان، كشيدة ممتدة، صورة مائلة مع تلاشٍ سفلي داكن وبادج زجاجي، وبطاقة بدء التقييم الزجاجية المتداخلة.
                  </p>
                </div>

                <Link
                  href="/"
                  className="btn-primary text-xs py-2 px-4 shadow-md inline-flex items-center gap-2"
                >
                  <span>معاينة الصفحة الرئيسية مباشرة</span>
                  <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                </Link>
              </div>

              {/* Embedded Hero Preview Container */}
              <div className="rounded-3xl border border-[rgba(82,103,125,0.3)] overflow-hidden shadow-2xl relative">
                <HeroSection />

                {/* Overlapping Glass Consultation Card Demonstration */}
                <HeroConsultationWrapper>
                  <ConsultationCard allowedCities={ALLOWED_CITIES} />
                </HeroConsultationWrapper>
              </div>
            </div>
          </section>
        )}

        {/* SECTION 0: LOGO SYSTEM & INTRO ANIMATION */}
        {(activeTab === "logo" || activeTab === "components") && (
          <section id="logo-system" className="space-y-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[rgba(82,103,125,0.25)] pb-4">
              <div>
                <h2 className="font-display font-black text-2xl text-[var(--buttercream)] flex items-center gap-3">
                  <Compass className="w-6 h-6 text-[var(--dusty-blue)]" />
                  <span>نظام الشعار وشاشة البداية (Logo System & Intro Animation)</span>
                </h2>
                <p className="text-xs sm:text-sm text-[var(--mist)] mt-1">
                  بوصلة دقيقة من خطوط رقيقة، علامة BAWSALA اللاتينية، شاشة بداية تفاعلية بأقل من 4 ثوانٍ، وحضور متناغم للشعار في كافة أنحاء الموقع.
                </p>
              </div>

              <button
                onClick={() => setPlayIntro(true)}
                className="btn-primary text-xs py-2.5 px-5 shadow-lg flex items-center gap-2"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>تشغيل شاشة البداية (Play Intro)</span>
              </button>
            </div>

            {/* 1. Opening Intro Timeline Breakdown Card */}
            <div className="surface-card p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between border-b border-[rgba(82,103,125,0.2)] pb-3">
                <div>
                  <span className="badge-pill text-[11px] mb-1">Session-Based Intro Animation</span>
                  <h3 className="font-display font-bold text-lg text-[var(--buttercream)]">
                    مخطط المراحل الزمنية لشاشة البداية (أقل من 4 ثوانٍ)
                  </h3>
                </div>
                <button
                  onClick={() => setPlayIntro(true)}
                  className="btn-secondary text-xs py-1.5 px-3"
                >
                  <span>معاينة حيّة ملء الشاشة</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="p-4 rounded-2xl bg-[rgba(15,26,43,0.7)] border border-[rgba(82,103,125,0.3)] space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono text-[var(--dusty-blue)]">
                    <span>المرحلة الأولى</span>
                    <span className="text-[var(--buttercream)] font-bold">0.0s – 1.2s</span>
                  </div>
                  <h4 className="font-display font-bold text-sm text-[var(--buttercream)]">
                    انبثاق كلمة BAWSALA
                  </h4>
                  <p className="text-xs text-[var(--mist)] leading-relaxed">
                    تبدأ الكلمة خلف خط قناع غير مرئي، وتصعد الحروف منفردة بتتابع (60ms) مع زوال الضبابية من 12px إلى 0 وانكماش تباعد الأحرف من واسع إلى النهائي.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[rgba(15,26,43,0.7)] border border-[rgba(82,103,125,0.3)] space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono text-[var(--dusty-blue)]">
                    <span>المرحلة الثانية</span>
                    <span className="text-[var(--buttercream)] font-bold">1.2s – 2.8s</span>
                  </div>
                  <h4 className="font-display font-bold text-sm text-[var(--buttercream)]">
                    دوران البوصلة واستقرار الإبرة
                  </h4>
                  <p className="text-xs text-[var(--mist)] leading-relaxed">
                    تتلاشى البوصلة للظهور بجانب الاسم وتدور بسلاسة بتباطؤ ease-out، وتتأرجح إبرة الماس متجاوزة الشمال وتستقر بفيزياء النوابض (Spring) مع نبضة توهج ناعمة.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[rgba(15,26,43,0.7)] border border-[rgba(82,103,125,0.3)] space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono text-[var(--dusty-blue)]">
                    <span>المرحلة الثالثة</span>
                    <span className="text-[var(--buttercream)] font-bold">2.8s – 3.6s</span>
                  </div>
                  <h4 className="font-display font-bold text-sm text-[var(--buttercream)]">
                    انتقال الشعار وكشف الواجهة
                  </h4>
                  <p className="text-xs text-[var(--mist)] leading-relaxed">
                    ينتقل الشعار الكامل للأعلى وينكمش ليستقر في موضعه داخل شريط التنقل (FLIP transition) بينما تتلاشى الخلفية الداكنة كاشفة الصفحة الرئيسية.
                  </p>
                </div>
              </div>
            </div>

            {/* 2. Interactive Compass Component Playground */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Controls Column */}
              <div className="lg:col-span-6 surface-card p-6 sm:p-8 space-y-6">
                <div>
                  <span className="text-xs font-mono text-[var(--dusty-blue)] block mb-1">
                    &lt;BawsalaCompass /&gt; Component
                  </span>
                  <h3 className="font-display font-bold text-lg text-[var(--buttercream)]">
                    مختبر التحكم التفاعلي بالبوصلة
                  </h3>
                  <p className="text-xs text-[var(--mist)] mt-1">
                    ثلاث مجموعات SVG مستقلة: الإطار الخارجي (outer-ring)، وقرص الدرجات (tick-marks)، وإبرة الماس (needle).
                  </p>
                </div>

                <div className="space-y-4 pt-2">
                  {/* Needle Angle Slider */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-[var(--mist)]">زاوية الإبرة (Needle Rotation):</span>
                      <span className="font-mono text-[var(--buttercream)] font-bold">{interactiveNeedleAngle}°</span>
                    </div>
                    <input
                      type="range"
                      min="-180"
                      max="180"
                      value={interactiveNeedleAngle}
                      onChange={(e) => setInteractiveNeedleAngle(Number(e.target.value))}
                      className="w-full accent-[var(--buttercream)] cursor-pointer"
                    />
                  </div>

                  {/* Dial Angle Slider */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-[var(--mist)]">دوران القرص الخارجي (Dial Rotation):</span>
                      <span className="font-mono text-[var(--buttercream)] font-bold">{interactiveDialAngle}°</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="360"
                      value={interactiveDialAngle}
                      onChange={(e) => setInteractiveDialAngle(Number(e.target.value))}
                      className="w-full accent-[var(--buttercream)] cursor-pointer"
                    />
                  </div>

                  {/* Size Slider */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-[var(--mist)]">حجم البوصلة (Size):</span>
                      <span className="font-mono text-[var(--buttercream)] font-bold">{compassInteractiveSize}px</span>
                    </div>
                    <input
                      type="range"
                      min="32"
                      max="128"
                      value={compassInteractiveSize}
                      onChange={(e) => setCompassInteractiveSize(Number(e.target.value))}
                      className="w-full accent-[var(--buttercream)] cursor-pointer"
                    />
                  </div>

                  {/* Quick Action Presets */}
                  <div className="flex flex-wrap gap-2 pt-3 border-t border-[rgba(82,103,125,0.2)]">
                    <button
                      onClick={() => {
                        setInteractiveNeedleAngle(15);
                        setInteractiveDialAngle(0);
                      }}
                      className="btn-secondary text-[11px] py-1 px-3"
                    >
                      الوضع القياسي (15°)
                    </button>
                    <button
                      onClick={() => {
                        setInteractiveNeedleAngle(0);
                        setInteractiveDialAngle(0);
                      }}
                      className="btn-secondary text-[11px] py-1 px-3"
                    >
                      الشمال التام (0°)
                    </button>
                    <button
                      onClick={() => {
                        setInteractiveNeedleAngle(90);
                        setInteractiveDialAngle(180);
                      }}
                      className="btn-secondary text-[11px] py-1 px-3"
                    >
                      الشرق (90°)
                    </button>
                  </div>
                </div>
              </div>

              {/* Live Preview Display */}
              <div className="lg:col-span-6 surface-card p-8 flex flex-col items-center justify-center min-h-[360px] relative overflow-hidden text-center">
                <div className="absolute inset-0 hero-radial-glow pointer-events-none opacity-50" />

                <div className="relative p-6 rounded-3xl bg-[var(--midnight)] border border-[rgba(82,103,125,0.4)] shadow-2xl mb-4 text-[var(--buttercream)]">
                  <BawsalaCompass
                    size={compassInteractiveSize}
                    needleRotation={interactiveNeedleAngle}
                    dialRotation={interactiveDialAngle}
                    showGlow
                  />
                </div>

                <div className="space-y-1 relative z-10">
                  <span className="text-xs font-mono text-[var(--buttercream)] font-semibold block">
                    currentColor Rendering
                  </span>
                  <p className="text-[11px] text-[var(--mist)] max-w-xs">
                    تتكيف تلقائياً مع ألوان الحاويات وتدعم دوران القرص والإبرة بمعزل عن بعضهما.
                  </p>
                </div>
              </div>
            </div>

            {/* 3. The Wordmark & Full Logo Lockups */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Wordmark Variations */}
              <div className="surface-card p-6 sm:p-8 space-y-6">
                <div>
                  <span className="text-xs font-mono text-[var(--dusty-blue)] block mb-1">
                    &lt;BawsalaWordmark /&gt;
                  </span>
                  <h3 className="font-display font-bold text-lg text-[var(--buttercream)]">
                    العلامة اللاتينية المستقلة (Wordmark)
                  </h3>
                  <p className="text-xs text-[var(--mist)] mt-1">
                    حروف لاتينية رفيعة متباعدة بكثافة تناسب طابع العلامة الرفيع.
                  </p>
                </div>

                {/* Tracking Adjustment Slider */}
                <div className="flex items-center gap-3 bg-[rgba(15,26,43,0.6)] p-3 rounded-xl border border-[rgba(82,103,125,0.25)]">
                  <span className="text-xs text-[var(--mist)]">التباعد (Tracking):</span>
                  <input
                    type="range"
                    min="20"
                    max="60"
                    value={parseInt(wordmarkTracking.replace(/\D/g, "")) || 35}
                    onChange={(e) => setWordmarkTracking(`0.${e.target.value}em`)}
                    className="w-28 accent-[var(--buttercream)] cursor-pointer"
                  />
                  <span className="text-xs font-mono text-[var(--buttercream)] font-bold">{wordmarkTracking}</span>
                </div>

                <div className="space-y-4 py-4 text-center bg-[rgba(15,26,43,0.6)] rounded-2xl border border-[rgba(82,103,125,0.25)]">
                  <div>
                    <span className="text-[10px] text-[var(--dusty-blue)] font-mono block mb-1">Size: Large (lg)</span>
                    <BawsalaWordmark size="lg" tracking={wordmarkTracking} className="text-[var(--buttercream)]" />
                  </div>
                  <div className="pt-3 border-t border-[rgba(82,103,125,0.2)]">
                    <span className="text-[10px] text-[var(--dusty-blue)] font-mono block mb-1">Size: Medium With Subtitle (md)</span>
                    <BawsalaWordmark size="md" tracking={wordmarkTracking} withSubtitle className="text-[var(--buttercream)]" />
                  </div>
                </div>
              </div>

              {/* Full Logo Lockup with Hover Interaction */}
              <div className="surface-card p-6 sm:p-8 space-y-6 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-mono text-[var(--dusty-blue)] block mb-1">
                    &lt;BawsalaLogo /&gt; Lockup
                  </span>
                  <h3 className="font-display font-bold text-lg text-[var(--buttercream)]">
                    الشعار الكامل مع تفاعل التحويم (Hover Spin)
                  </h3>
                  <p className="text-xs text-[var(--mist)] mt-1">
                    عند تمرير المؤشر، يدور قرص البوصلة بلطف وتتحرك الإبرة بحساسية مغناطيسية.
                  </p>
                </div>

                <div className="py-6 px-4 bg-[rgba(15,26,43,0.6)] rounded-2xl border border-[rgba(82,103,125,0.25)] flex flex-col items-center justify-center space-y-6">
                  {/* Horizontal Lockup */}
                  <div className="p-3 rounded-2xl hover:bg-[rgba(28,46,74,0.4)] transition-colors">
                    <BawsalaLogo
                      compassSize={36}
                      wordmarkSize="md"
                      animateHover
                      badgeText="استشاري المشتري"
                    />
                  </div>

                  <span className="text-[11px] text-[var(--mist)] font-mono">
                    مرر الفأرة فوق الشعار لمعاينة دوران البوصلة الخفيف
                  </span>
                </div>

                <div className="text-xs text-[var(--mist)] pt-2 border-t border-[rgba(82,103,125,0.2)]">
                  يُستخدم كشعار رسمي في شريط التنقل (Navbar) وتذييل الصفحة (Footer).
                </div>
              </div>
            </div>

            {/* 4. Logo Presence Across the Site Showcase */}
            <div className="space-y-6">
              <div className="border-b border-[rgba(82,103,125,0.25)] pb-3">
                <h3 className="font-display font-bold text-lg text-[var(--buttercream)]">
                  حضور الشعار عبر أنحاء المنصة (Logo Presence Across the Site)
                </h3>
                <p className="text-xs text-[var(--mist)] mt-0.5">
                  تطبيقات دقيقة للشعار في الفواصل الهندسية، وحالات التحميل، والصفحات الفارغة، والعلامات المائية.
                </p>
              </div>

              {/* Compass Divider Showcase */}
              <div className="surface-card p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-display font-bold text-sm text-[var(--buttercream)]">
                    فاصل الأقسام الهيكلي (Compass Tick-Mark Divider)
                  </h4>
                  <span className="badge-pill text-[11px]">&lt;CompassDivider /&gt;</span>
                </div>
                <p className="text-xs text-[var(--mist)]">
                  فاصل أقسام يحاكي خطوط التدريج الدقيقة للبوصلة وأجهزة القياس الهندسية:
                </p>
                <div className="py-4">
                  <CompassDivider withEmblem />
                </div>
              </div>

              {/* Loading & Empty States Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Loading State */}
                <div className="surface-card p-6 flex flex-col justify-between">
                  <div className="border-b border-[rgba(82,103,125,0.2)] pb-2 mb-4 flex justify-between items-center">
                    <h4 className="font-display font-bold text-sm text-[var(--buttercream)]">
                      حالة التحميل التفاعلية (Loading State)
                    </h4>
                    <span className="badge-pill text-[11px]">&lt;BawsalaLoading /&gt;</span>
                  </div>
                  <div className="bg-[rgba(15,26,43,0.5)] rounded-2xl border border-[rgba(82,103,125,0.2)] p-2">
                    <BawsalaLoading size={56} />
                  </div>
                </div>

                {/* Empty State */}
                <div className="surface-card p-6 flex flex-col justify-between">
                  <div className="border-b border-[rgba(82,103,125,0.2)] pb-2 mb-4 flex justify-between items-center">
                    <h4 className="font-display font-bold text-sm text-[var(--buttercream)]">
                      حالة الفراغ الاسترشادية (Empty State)
                    </h4>
                    <span className="badge-pill text-[11px]">&lt;BawsalaEmptyState /&gt;</span>
                  </div>
                  <div className="bg-[rgba(15,26,43,0.5)] rounded-2xl border border-[rgba(82,103,125,0.2)] p-2">
                    <BawsalaEmptyState
                      iconSize={52}
                      title="لا توجد عقارات مضافة بعد"
                      description="أدخل رابط العقار من تطبيق عقار أو منصة سهم لبدء التدقيق الهندسي الشامل."
                      actionLabel="إضافة عقار مرشح"
                      onAction={() => alert("إضافة عقار")}
                    />
                  </div>
                </div>
              </div>

              {/* Giant Watermark & Footer Wordmark Showcase */}
              <div className="surface-card p-8 text-center relative overflow-hidden">
                <div className="relative z-10 space-y-4">
                  <span className="badge-pill text-[11px]">Footer & Hero Watermarks</span>
                  <h4 className="font-display font-bold text-base text-[var(--buttercream)]">
                    العلامة المائية الخلفية والاسم اللاتيني الكبير في التذييل
                  </h4>
                  <p className="text-xs text-[var(--mist)] max-w-md mx-auto">
                    بوصلة مائية عملاقة خلف منطقة البطل بنسبة شفافية 4% تدور ببطء مع التمرير، واسم &quot;BAWSALA&quot; عملاق خافت في أسفل الصفحة.
                  </p>
                </div>

                {/* Watermark Live Demonstration */}
                <div className="my-6 py-12 relative flex items-center justify-center bg-[rgba(15,26,43,0.7)] rounded-3xl border border-[rgba(82,103,125,0.25)] overflow-hidden">
                  <HeroCompassWatermark size={360} className="relative opacity-25" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none select-none">
                    <span className="wordmark-latin text-6xl sm:text-7xl font-light text-[var(--buttercream)] tracking-[0.45em]">
                      BAWSALA
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* SECTION: COMPASS LOADER (<CompassLoader />) */}
        {(activeTab === "loader" || activeTab === "components") && (
          <section id="compass-loader" className="space-y-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[rgba(82,103,125,0.25)] pb-4">
              <div>
                <h2 className="font-display font-black text-2xl text-[var(--buttercream)] flex items-center gap-3">
                  <RotateCcw className="w-6 h-6 text-[var(--dusty-blue)]" />
                  <span>مؤشر التحميل الذكي (&lt;CompassLoader /&gt;)</span>
                </h2>
                <p className="text-xs sm:text-sm text-[var(--mist)] mt-1">
                  مؤشر موضع في أعلى منتصف الشاشة (Top-Center) أثناء معالجة القرارات العقارية والتفكير البرمجي، بحجم 72–96px وألوان التوكنات الداكنة.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setShowAnalysisDemo(true);
                    setAnalysisIsLoading(true);
                  }}
                  className="btn-primary text-xs py-2.5 px-4 shadow-lg flex items-center gap-2"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>معاينة شاشة تحليل القرار (Place 1)</span>
                </button>
              </div>
            </div>

            {/* 1. Interactive Loader Playground */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Controls Column */}
              <div className="lg:col-span-6 surface-card p-6 sm:p-8 space-y-6">
                <div>
                  <span className="badge-pill text-[11px] mb-1">Interactive Component States</span>
                  <h3 className="font-display font-bold text-lg text-[var(--buttercream)]">
                    التحكم بحالات المؤشر المعتمدة
                  </h3>
                  <p className="text-xs text-[var(--mist)] mt-1">
                    بدّل بين حالات البحث (Searching) والقفل النبضي (Locking) والتوجيه (Pointing).
                  </p>
                </div>

                <div className="space-y-4 pt-2">
                  {/* State Toggle Buttons */}
                  <div className="space-y-1.5">
                    <span className="text-xs text-[var(--mist)] block">حالة المؤشر (State):</span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {(["searching", "locking", "pointing", "idle"] as CompassLoaderState[]).map((st) => (
                        <button
                          key={st}
                          onClick={() => setLoaderDemoState(st)}
                          className={`px-3 py-2 rounded-xl text-xs font-mono font-semibold transition-all ${
                            loaderDemoState === st
                              ? "bg-[var(--buttercream)] text-[var(--deep-navy)] shadow-md"
                              : "bg-[var(--midnight)] text-[var(--mist)] border border-[rgba(82,103,125,0.3)] hover:text-[var(--buttercream)]"
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Size Slider */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-[var(--mist)]">حجم البوصلة (Size):</span>
                      <span className="font-mono text-[var(--buttercream)] font-bold">{loaderDemoSize}px</span>
                    </div>
                    <input
                      type="range"
                      min="72"
                      max="96"
                      value={loaderDemoSize}
                      onChange={(e) => setLoaderDemoSize(Number(e.target.value))}
                      className="w-full accent-[var(--buttercream)] cursor-pointer"
                    />
                  </div>

                  {/* Target Angle Slider */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-[var(--mist)]">زاوية التوجيه (Target Angle):</span>
                      <span className="font-mono text-[var(--buttercream)] font-bold">{loaderDemoAngle}°</span>
                    </div>
                    <input
                      type="range"
                      min="-180"
                      max="180"
                      value={loaderDemoAngle}
                      onChange={(e) => setLoaderDemoAngle(Number(e.target.value))}
                      className="w-full accent-[var(--buttercream)] cursor-pointer"
                    />
                  </div>

                  <div className="p-3.5 rounded-xl bg-[rgba(15,26,43,0.7)] border border-[rgba(82,103,125,0.25)] text-xs text-[var(--mist)] space-y-1">
                    <div className="font-semibold text-[var(--buttercream)]">مواصفات الحركة:</div>
                    <ul className="list-disc list-inside space-y-0.5 text-[11px] leading-relaxed">
                      <li><strong>searching:</strong> دوران مستمر للإبرة بتباطؤ سلس ودوران عكسي للقرص مع نبض راداري.</li>
                      <li><strong>locking:</strong> تباطؤ وقفز نابض (Spring) نحو زاوية الهدف وإشراق التدريجات وموجة متموجة.</li>
                      <li>نصوص متناوبة باللغة العربية تتبدل بسلاسة كل 1.6 ثانية مع خط تقدم رفيع.</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Preview Display Column */}
              <div className="lg:col-span-6 surface-card p-8 flex flex-col items-center justify-center min-h-[380px] relative overflow-hidden bg-gradient-to-b from-[#1C2E4A] via-[#142339] to-[#0F1A2B]">
                <div className="absolute top-0 inset-x-0 h-32 bg-[radial-gradient(circle_at_50%_0%,rgba(82,103,125,0.18)_0%,transparent_70%)] pointer-events-none" />

                <div className="relative z-10 w-full flex flex-col items-center pt-4">
                  <CompassLoader
                    size={loaderDemoSize}
                    state={loaderDemoState}
                    targetAngle={loaderDemoAngle}
                    onComplete={() => alert("تم اكتمال التوجيه بنجاح (Lock Complete)!")}
                  />
                </div>
              </div>
            </div>

            {/* 2. Place 1 Demonstration: Real-Estate Decision Loading Overlay with Shimmer Skeletons */}
            <div className="surface-card p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[rgba(82,103,125,0.2)] pb-4">
                <div>
                  <span className="badge-pill text-[11px] mb-1">Place 1 • Analysis Loading Overlay</span>
                  <h3 className="font-display font-bold text-lg text-[var(--buttercream)]">
                    تطبيق 1: شاشة تدقيق وتحليل القرار العقاري
                  </h3>
                  <p className="text-xs text-[var(--mist)] mt-1">
                    غطاء داكن كامل العرض (--deep-navy بنسبة 92% + ضبابية خلفية) مع المؤشر في الثلث العلوي والبطاقات الهيكلية تلمع في الأسفل.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setShowAnalysisDemo(true);
                    setAnalysisIsLoading(true);
                  }}
                  className="btn-secondary text-xs py-2 px-4 shadow-sm"
                >
                  <span>فتح الشاشة الكاملة للمعاينة</span>
                </button>
              </div>

              {/* In-Page Interactive Analysis Overlay Demo Container */}
              <div className="p-6 rounded-3xl bg-[rgba(15,26,43,0.7)] border border-[rgba(82,103,125,0.3)] relative min-h-[320px] overflow-hidden">
                <AnalysisLoadingOverlay
                  isLoading={analysisIsLoading}
                  allowSimulateComplete
                  onFinished={() => setAnalysisIsLoading(false)}
                >
                  {/* Results Revealed on Lock Complete */}
                  <div className="space-y-4 pt-4">
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-[rgba(94,155,121,0.15)] border border-[rgba(94,155,121,0.35)] text-[var(--status-ok)]">
                      <div className="flex items-center gap-2 text-sm font-bold">
                        <CheckCircle2 className="w-5 h-5" />
                        <span>اكتمل الفحص الفني والهندسي بنجاح (94% درجة التوافق)</span>
                      </div>
                      <button
                        onClick={() => setAnalysisIsLoading(true)}
                        className="btn-secondary text-xs py-1 px-3"
                      >
                        إعادة تشغيل الفحص
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="surface-card p-5 space-y-2">
                        <span className="text-xs text-[var(--mist)] block">القيمة العادلة المقدرة</span>
                        <span className="text-2xl font-mono font-black text-[var(--buttercream)] block">2,450,000 ر.س</span>
                        <p className="text-[11px] text-[var(--mist)]">سعر المتر يتوافق مع متوسط حي النرجس</p>
                      </div>

                      <div className="surface-card p-5 space-y-2">
                        <span className="text-xs text-[var(--mist)] block">مؤشر السلامة الإنشائية</span>
                        <span className="text-2xl font-mono font-black text-[var(--status-ok)] block">96% ممتاز</span>
                        <p className="text-[11px] text-[var(--mist)]">مطابق لكود البناء السعودي بدون ملاحظات حرجة</p>
                      </div>

                      <div className="surface-card p-5 space-y-2">
                        <span className="text-xs text-[var(--mist)] block">تكاليف التملك المتوقعة (10 سنوات)</span>
                        <span className="text-2xl font-mono font-black text-[var(--buttercream)] block">185,000 ر.س</span>
                        <p className="text-[11px] text-[var(--mist)]">تشمل الصيانة التقديرية واتحاد الملاك</p>
                      </div>
                    </div>
                  </div>
                </AnalysisLoadingOverlay>
              </div>
            </div>

            {/* 3. Place 2 Demonstration: City Selection Compass (Part 5) */}
            <div className="surface-card p-6 sm:p-8 space-y-6">
              <div className="border-b border-[rgba(82,103,125,0.2)] pb-4">
                <span className="badge-pill text-[11px] mb-1">Place 2 • City Selection Compass (Part 5)</span>
                <h3 className="font-display font-bold text-lg text-[var(--buttercream)]">
                  تطبيق 2: بوصلة اختيار المدينة وتوجيه الإبرة الجغرافية
                </h3>
                <p className="text-xs text-[var(--mist)] mt-1">
                  نسخة مصغرة من المؤشر تعتلي أعلى الواجهة؛ وتتبع زاوية الإبرة وجهة المدينة المختارة بمرونة مغناطيسية حية.
                </p>
              </div>

              {/* City Compass Selector Live Interactive Component */}
              <div className="py-4">
                <CityCompassSelector selectedCity="الرياض" />
              </div>
            </div>
          </section>
        )}

        {/* Fullscreen Overlay Demonstration Modal (Place 1) */}
        {showAnalysisDemo && (
          <div className="fixed inset-0 z-50">
            <AnalysisLoadingOverlay
              isLoading={analysisIsLoading}
              allowSimulateComplete
              onFinished={() => {
                setAnalysisIsLoading(false);
                setTimeout(() => setShowAnalysisDemo(false), 2200);
              }}
            >
              <div className="max-w-4xl mx-auto p-6 space-y-6 text-center">
                <h3 className="font-display font-black text-2xl text-[var(--buttercream)]">
                  تم اعتماد قرار الشراء بنجاح!
                </h3>
                <p className="text-xs text-[var(--mist)]">
                  أغلقت الشاشة التحليلية بنجاح وظهرت النتائج بحركات صعود متتابعة.
                </p>
                <button
                  onClick={() => setShowAnalysisDemo(false)}
                  className="btn-primary text-xs py-2 px-6"
                >
                  إغلاق العرض
                </button>
              </div>
            </AnalysisLoadingOverlay>
          </div>
        )}

        {/* SECTION 1: COLOR PALETTE */}
        {(activeTab === "palette" || activeTab === "components") && (
          <section id="palette" className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[rgba(82,103,125,0.25)] pb-4">
              <div>
                <h2 className="font-display font-black text-2xl text-[var(--buttercream)] flex items-center gap-3">
                  <Palette className="w-6 h-6 text-[var(--dusty-blue)]" />
                  <span>لوحة الألوان المعتمدة (Color Tokens)</span>
                </h2>
                <p className="text-xs sm:text-sm text-[var(--mist)] mt-1">
                  خمسة متغيرات أساسية على <code className="text-[var(--buttercream)]">:root</code>. لا وجود للأسود الخالص ولا الأبيض الخالص.
                </p>
              </div>

              {copiedToken && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[rgba(94,155,121,0.2)] border border-[rgba(94,155,121,0.4)] text-[var(--status-ok)] text-xs">
                  <Check className="w-3.5 h-3.5" />
                  <span>تم نسخ {copiedToken} للحافظة!</span>
                </div>
              )}
            </div>

            {/* 5 Token Swatches Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {COLOR_TOKENS.map((token) => (
                <div
                  key={token.variable}
                  className="surface-card-interactive p-5 flex flex-col justify-between group cursor-pointer"
                  onClick={() => copyToClipboard(token.hex, token.name)}
                >
                  <div>
                    {/* Swatch Preview Block */}
                    <div
                      className="w-full h-28 rounded-xl border border-[rgba(82,103,125,0.35)] shadow-inner flex items-end justify-between p-3 relative overflow-hidden mb-4"
                      style={{ backgroundColor: token.hex }}
                    >
                      <span
                        className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                          token.isDark
                            ? "bg-[rgba(209,207,201,0.2)] text-[var(--buttercream)]"
                            : "bg-[rgba(15,26,43,0.7)] text-[var(--buttercream)]"
                        }`}
                      >
                        {token.hex}
                      </span>
                      <button
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md bg-[rgba(15,26,43,0.8)] text-[var(--buttercream)] hover:bg-[var(--midnight)]"
                        title="نسخ الرمز"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <h3 className="font-display font-bold text-sm text-[var(--buttercream)] mb-1">
                      {token.name}
                    </h3>
                    <code className="text-xs font-mono text-[var(--mist)] block mb-3 bg-[rgba(15,26,43,0.5)] px-2 py-1 rounded border border-[rgba(82,103,125,0.2)]">
                      {token.variable}
                    </code>

                    <p className="text-xs text-[var(--mist)] leading-relaxed mb-3">
                      {token.usage}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[rgba(82,103,125,0.2)] flex items-center justify-between text-[11px] text-[var(--mist)]">
                    <span>نسبة التباين:</span>
                    <span className="font-mono text-[var(--buttercream)] font-semibold">
                      {token.contrastWithNavy}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Gradients and Depth Surfaces Showcase */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
              <div className="surface-card p-6 relative overflow-hidden">
                <div className="h-28 rounded-xl bg-gradient-to-b from-[#0F1A2B] to-[#1C2E4A] border border-[rgba(82,103,125,0.3)] mb-4 flex items-center justify-center">
                  <span className="text-xs font-mono text-[var(--buttercream)]">
                    linear-gradient(180deg, #0F1A2B, #1C2E4A)
                  </span>
                </div>
                <h4 className="font-display font-bold text-sm text-[var(--buttercream)] mb-1">
                  تدرج الخلفية الرأسي (Vertical Gradient)
                </h4>
                <p className="text-xs text-[var(--mist)]">
                  ينتقل بسلاسة من --deep-navy إلى --midnight ليعطي عمقاً طبيعياً بدلاً من الخلفيات المسطحة.
                </p>
              </div>

              <div className="surface-card p-6 relative overflow-hidden">
                <div className="h-28 rounded-xl bg-[#0F1A2B] relative border border-[rgba(82,103,125,0.3)] mb-4 flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(82,103,125,0.12)_0%,transparent_70%)]" />
                  <span className="text-xs font-mono text-[var(--buttercream)] relative z-10">
                    radial-gradient(rgba(82,103,125, 0.12))
                  </span>
                </div>
                <h4 className="font-display font-bold text-sm text-[var(--buttercream)] mb-1">
                  التوهج الشعاعي الخافت (Radial Glow 8-12%)
                </h4>
                <p className="text-xs text-[var(--mist)]">
                  توهج ناعم خلف مناطق البطل (Hero Areas) يركز الانتباه على العناوين والمنتج بدون تشتيت.
                </p>
              </div>

              <div className="surface-card p-6 relative overflow-hidden">
                <div className="h-28 rounded-xl bg-[#1C2E4A] relative border border-[rgba(82,103,125,0.3)] mb-4 flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#BDC4D4_1px,transparent_1px)] [background-size:8px_8px]" />
                  <span className="text-xs font-mono text-[var(--buttercream)] relative z-10">
                    Film Grain / Noise (3% Opacity)
                  </span>
                </div>
                <h4 className="font-display font-bold text-sm text-[var(--buttercream)] mb-1">
                  طبقة الحبيبات الضوئية (Film-Grain Noise)
                </h4>
                <p className="text-xs text-[var(--mist)]">
                  تكسر البرودة الرقمية وتمنح السطوح الداكنة ملمساً تناظرياً فاخراً بدون التأثير على الأداء.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* SECTION 2: TYPOGRAPHY & KASHIDA */}
        {(activeTab === "typography" || activeTab === "components") && (
          <section id="typography" className="space-y-6">
            <div className="border-b border-[rgba(82,103,125,0.25)] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-display font-black text-2xl text-[var(--buttercream)] flex items-center gap-3">
                  <Type className="w-6 h-6 text-[var(--dusty-blue)]" />
                  <span>منظومة الخطوط والكشيدة (Typography System)</span>
                </h2>
                <p className="text-xs sm:text-sm text-[var(--mist)] mt-1">
                  عناوين هندسية عريضة (Alexandria 800-900)، نصوص مريحة (IBM Plex Sans / Tajawal)، وعلامة Bawsala اللاتينية الراقية.
                </p>
              </div>

              {/* Interactive Tatweel Slider */}
              <div className="flex items-center gap-3 bg-[var(--midnight)] px-4 py-2 rounded-xl border border-[rgba(82,103,125,0.3)]">
                <Sliders className="w-4 h-4 text-[var(--buttercream)]" />
                <span className="text-xs text-[var(--mist)]">طول الكشيدة (Tatweel):</span>
                <input
                  type="range"
                  min="1"
                  max="12"
                  value={tatweelCount}
                  onChange={(e) => setTatweelCount(Number(e.target.value))}
                  className="w-24 accent-[var(--buttercream)] cursor-pointer"
                />
                <span className="text-xs font-mono text-[var(--buttercream)] font-bold min-w-[24px]">
                  {tatweelCount}
                </span>
              </div>
            </div>

            {/* Typography Spec Showcase */}
            <div className="space-y-6">
              {/* Display Headlines */}
              <div className="surface-card p-6 sm:p-8 space-y-6">
                <div className="flex items-center justify-between border-b border-[rgba(82,103,125,0.2)] pb-3">
                  <div>
                    <span className="text-xs font-mono text-[var(--mist)]">--font-display: Alexandria (800-900)</span>
                    <h3 className="font-display font-bold text-lg text-[var(--buttercream)]">
                      عناوين العرض الهندسية الكثيفة (Display Headlines)
                    </h3>
                  </div>
                  <span className="text-xs bg-[var(--deep-navy)] px-2.5 py-1 rounded text-[var(--mist)] border border-[rgba(82,103,125,0.3)] font-mono">
                    line-height: 1.15
                  </span>
                </div>

                <div className="space-y-6">
                  {/* H1 */}
                  <div>
                    <span className="text-xs font-mono text-[var(--dusty-blue)] block mb-1">
                      H1 • Alexandria 900 • 52px / 1.15
                    </span>
                    <h1 className="font-display font-black text-3xl sm:text-5xl text-[var(--buttercream)] headline-tight">
                      اتخذ قرار شراء شقتك{" "}
                      <span className="stretch text-[var(--buttercream)] border-b-2 border-[var(--dusty-blue)]">
                        {elongateWord("بوضوح", tatweelCount)}
                      </span>{" "}
                      وثقة
                    </h1>
                  </div>

                  {/* H2 */}
                  <div>
                    <span className="text-xs font-mono text-[var(--dusty-blue)] block mb-1">
                      H2 • Alexandria 800 • 36px / 1.15
                    </span>
                    <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-[var(--buttercream)] headline-tight">
                      مطابقة الشقق لميزانيتك{" "}
                      <span className="stretch">
                        {elongateWord("وأولوياتك", tatweelCount)}
                      </span>{" "}
                      قبل الشراء
                    </h2>
                  </div>

                  {/* H3 */}
                  <div>
                    <span className="text-xs font-mono text-[var(--dusty-blue)] block mb-1">
                      H3 • Alexandria 800 • 24px / 1.15
                    </span>
                    <h3 className="font-display font-extrabold text-xl sm:text-2xl text-[var(--buttercream)] headline-tight">
                      تقرير التوافق الهيكلي و{" "}
                      <span className="stretch">
                        {elongateWord("السلامة", Math.max(1, tatweelCount - 2))}
                      </span>{" "}
                      الإنشائية
                    </h3>
                  </div>
                </div>
              </div>

              {/* Body Text & Latin Wordmark */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Body Text */}
                <div className="surface-card p-6 space-y-4">
                  <div className="border-b border-[rgba(82,103,125,0.2)] pb-2">
                    <span className="text-xs font-mono text-[var(--mist)]">--font-body: IBM Plex Sans Arabic / Tajawal (400/500)</span>
                    <h4 className="font-display font-bold text-base text-[var(--buttercream)] mt-0.5">
                      النصوص التفسيرية والمتن (Body Typography)
                    </h4>
                  </div>

                  <p className="text-[var(--buttercream)] text-base leading-relaxed">
                    <strong>النص الرئيسي (Buttercream):</strong> نقوم بمقارنة العقار المرشح مع أكثر من 14 معياراً عمرانياً وهندسياً لحساب تكاليف الإصلاح الخفية والقيمة العادلة الموثقة.
                  </p>

                  <p className="text-[var(--mist)] text-sm leading-relaxed">
                    <strong>النص الثانوي (Mist):</strong> يتم استخراج بيانات العقار تلقائياً عبر الإضافة البرمجية أو إدخال رابط الإعلان، وتوليد الفحص الفوري وفق كود البناء السعودي.
                  </p>

                  <div className="text-xs text-[var(--dusty-blue)] font-mono pt-2 border-t border-[rgba(82,103,125,0.15)] flex justify-between">
                    <span>ملاحظة: تباعد الحروف (letter-spacing) صفر دائماً في العربية</span>
                    <span>dir=&quot;rtl&quot;</span>
                  </div>
                </div>

                {/* Latin Wordmark */}
                <div className="surface-card p-6 space-y-4 flex flex-col justify-between">
                  <div>
                    <div className="border-b border-[rgba(82,103,125,0.2)] pb-2">
                      <span className="text-xs font-mono text-[var(--mist)]">--font-wordmark: Cinzel / Cormorant Garamond</span>
                      <h4 className="font-display font-bold text-base text-[var(--buttercream)] mt-0.5">
                        العلامة اللاتينية (Latin Wordmark)
                      </h4>
                    </div>

                    <div className="py-6 text-center space-y-3 bg-[rgba(15,26,43,0.6)] rounded-2xl border border-[rgba(82,103,125,0.25)] my-3">
                      <div className="wordmark-latin text-2xl sm:text-3xl text-[var(--buttercream)] tracking-[0.35em]">
                        BAWSALA
                      </div>
                      <div className="wordmark-latin text-xs text-[var(--mist)] tracking-[0.45em]">
                        INDEPENDENT PROPERTY ADVISORY
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-[var(--mist)] leading-relaxed">
                    خط لاتيني رفيع، أنيق، عالي التباين، متباعد الأحرف (wide letter-spacing 0.35em)، يطابق شعار العلامة ويتكامل مع الهوية العربية المعاصرة.
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* SECTION 3: MOTION SYSTEM */}
        {(activeTab === "motion" || activeTab === "components") && (
          <section id="motion" className="space-y-6">
            <div className="border-b border-[rgba(82,103,125,0.25)] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-display font-black text-2xl text-[var(--buttercream)] flex items-center gap-3">
                  <Activity className="w-6 h-6 text-[var(--dusty-blue)]" />
                  <span>منظومة الحركة التفاعلية (Motion System)</span>
                </h2>
                <p className="text-xs sm:text-sm text-[var(--mist)] mt-1">
                  منحنيات دخول دقيقة، فترات زمنية محددة (200ms / 600ms / 1200ms)، وتأثير ظهور تدريجي مع صعود 24px وانتقال من الضبابية للحدة.
                </p>
              </div>

              <button
                onClick={handleReplayMotion}
                className="btn-primary text-xs py-2 px-4 shadow-sm"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>إعادة تشغيل الحركة (Replay All)</span>
              </button>
            </div>

            {/* Timing & Curves Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Easing Specifications */}
              <div className="surface-card p-6 space-y-4">
                <h4 className="font-display font-bold text-base text-[var(--buttercream)] flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-[var(--dusty-blue)]" />
                  <span>منحنيات التباطؤ والتسارع (Easing Curves)</span>
                </h4>

                <div className="space-y-3 text-xs font-mono">
                  <div className="p-3 rounded-xl bg-[rgba(15,26,43,0.7)] border border-[rgba(82,103,125,0.25)]">
                    <div className="flex justify-between text-[var(--buttercream)] font-bold mb-1">
                      <span>منحنى الدخول (Entrances):</span>
                      <span className="text-[var(--mist)]">Ease-Out الحاسم</span>
                    </div>
                    <code className="text-[var(--mist)] block text-[11px]">
                      {EASING_CSS.entrance}
                    </code>
                  </div>

                  <div className="p-3 rounded-xl bg-[rgba(15,26,43,0.7)] border border-[rgba(82,103,125,0.25)]">
                    <div className="flex justify-between text-[var(--buttercream)] font-bold mb-1">
                      <span>منحنى الانتقال (Transitions):</span>
                      <span className="text-[var(--mist)]">Smooth Ease-In-Out</span>
                    </div>
                    <code className="text-[var(--mist)] block text-[11px]">
                      {EASING_CSS.transition}
                    </code>
                  </div>
                </div>
              </div>

              {/* Durations Specifications */}
              <div className="surface-card p-6 space-y-4">
                <h4 className="font-display font-bold text-base text-[var(--buttercream)] flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[var(--dusty-blue)]" />
                  <span>الفترات الزمنية المعتمدة (Durations)</span>
                </h4>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 rounded-xl bg-[rgba(15,26,43,0.7)] border border-[rgba(82,103,125,0.25)]">
                    <span className="text-xl font-mono font-bold text-[var(--buttercream)] block">
                      {DURATION_MS.micro}ms
                    </span>
                    <span className="text-[11px] text-[var(--mist)] block mt-1">Micro (Hover/Tap)</span>
                  </div>

                  <div className="p-3 rounded-xl bg-[rgba(15,26,43,0.7)] border border-[rgba(82,103,125,0.25)]">
                    <span className="text-xl font-mono font-bold text-[var(--buttercream)] block">
                      {DURATION_MS.standard}ms
                    </span>
                    <span className="text-[11px] text-[var(--mist)] block mt-1">Standard (Scroll)</span>
                  </div>

                  <div className="p-3 rounded-xl bg-[rgba(15,26,43,0.7)] border border-[rgba(82,103,125,0.25)]">
                    <span className="text-xl font-mono font-bold text-[var(--buttercream)] block">
                      {DURATION_MS.hero}ms
                    </span>
                    <span className="text-[11px] text-[var(--mist)] block mt-1">Hero (Entrance)</span>
                  </div>
                </div>

                <p className="text-xs text-[var(--mist)] leading-relaxed">
                  تقتصر الحركة حصرياً على <code className="text-[var(--buttercream)]">transform</code> و <code className="text-[var(--buttercream)]">opacity</code> لضمان استقرار معدل 60 إطاراً في الثانية في كافة الشاشات.
                </p>
              </div>
            </div>

            {/* Live Interactive Motion Demos */}
            <div className="space-y-4">
              <h3 className="font-display font-bold text-lg text-[var(--buttercream)]">
                تجارب حية لعناصر الحركة (Interactive Motion Playground)
              </h3>

              <div key={replayKey} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* 1. Micro Interaction Demo (200ms) */}
                <motion.div
                  initial="rest"
                  animate="rest"
                  whileHover="hover"
                  variants={microInteractionVariants}
                  className="surface-card p-6 space-y-4 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono text-[var(--dusty-blue)]">Duration: {DURATION.micro * 1000}ms</span>
                      <span className="badge-pill text-[11px]">Micro Tier</span>
                    </div>
                    <h4 className="font-display font-bold text-base text-[var(--buttercream)]">
                      تفاعل الأزرار الدقيق (Micro-Interactions)
                    </h4>
                    <p className="text-xs text-[var(--mist)] mt-1">
                      استجابة فورية بدون بطء، تمنح المستخدم إحساساً بلمس مادي ملموس.
                    </p>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-[rgba(82,103,125,0.2)]">
                    <motion.button
                      whileHover={reduceMotionMock ? {} : { y: -2 }}
                      whileTap={reduceMotionMock ? {} : { scale: 0.98 }}
                      transition={TRANSITIONS.micro}
                      className="btn-primary w-full text-xs"
                    >
                      <span>جرّب التمرير والضغط (200ms)</span>
                    </motion.button>

                    <motion.button
                      whileHover={reduceMotionMock ? {} : { y: -2 }}
                      whileTap={reduceMotionMock ? {} : { scale: 0.98 }}
                      transition={TRANSITIONS.micro}
                      className="btn-secondary w-full text-xs"
                    >
                      <span>زر ثانوي بتأثير هادئ</span>
                    </motion.button>
                  </div>
                </motion.div>

                {/* 2. Standard Scroll Reveal Demo (600ms, 24px rise + blur) */}
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={activeScrollVariant}
                  className="surface-card p-6 space-y-4 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono text-[var(--dusty-blue)]">Duration: {DURATION.standard * 1000}ms</span>
                      <span className="badge-pill text-[11px]">Standard Tier</span>
                    </div>
                    <h4 className="font-display font-bold text-base text-[var(--buttercream)]">
                      كشف التمرير القياسي (Scroll Reveal)
                    </h4>
                    <p className="text-xs text-[var(--mist)] mt-1">
                      صعود 24px مع تحول الضبابية الخفيفة إلى وضوح تام بزمن 600ms ومنحنى الدخول.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-[rgba(15,26,43,0.6)] border border-[rgba(82,103,125,0.25)] space-y-2">
                    <div className="flex items-center gap-2 text-xs text-[var(--buttercream)] font-semibold">
                      <ShieldCheck className="w-4 h-4 text-[var(--status-ok)]" />
                      <span>تدقيق السلامة الإنشائية</span>
                    </div>
                    <p className="text-[11px] text-[var(--mist)] leading-relaxed">
                      بطاقة فحص قياسية تظهر عند التمرير بوضوح هندسي قطعي.
                    </p>
                  </div>
                </motion.div>

                {/* 3. Hero Entrance Demo (1200ms) */}
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={activeHeroVariant}
                  className="surface-card p-6 space-y-4 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono text-[var(--dusty-blue)]">Duration: {DURATION.hero * 1000}ms</span>
                      <span className="badge-pill text-[11px]">Hero Tier</span>
                    </div>
                    <h4 className="font-display font-bold text-base text-[var(--buttercream)]">
                      دخول البطل المهيب (Hero Entrance)
                    </h4>
                    <p className="text-xs text-[var(--mist)] mt-1">
                      حركة افتتاحية متمهلة تليق بالوقار المؤسسي والقرار الاستثماري المصيري.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-gradient-to-b from-[#1C2E4A] to-[#0F1A2B] border border-[rgba(82,103,125,0.3)] text-center space-y-1">
                    <span className="text-xs font-display font-bold text-[var(--buttercream)]">
                      قرار تملك مدعوم بالبيانات
                    </span>
                    <span className="text-[11px] text-[var(--mist)] block">
                      دخول متدرج 1200ms
                    </span>
                  </div>
                </motion.div>
              </div>

              {/* Stagger Grid Animation Demonstration */}
              <div className="surface-card p-6 mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-display font-bold text-sm text-[var(--buttercream)]">
                    تتابع الحركات الشبكية (Staggered Animation 60fps)
                  </h4>
                  <span className="text-xs text-[var(--mist)] font-mono">staggerChildren: 0.08s</span>
                </div>

                <motion.div
                  key={`stagger-${replayKey}`}
                  initial="hidden"
                  animate="visible"
                  variants={staggerContainerVariants(0.08, 0.1)}
                  className="grid grid-cols-2 sm:grid-cols-4 gap-3"
                >
                  {[
                    "فحص التربة والأساسات",
                    "تدقيق العزل المائي",
                    "سلامة التمديدات الكهربائية",
                    "مؤشر التسعير العادل",
                  ].map((item, idx) => (
                    <motion.div
                      key={idx}
                      variants={active60fpsVariant}
                      className="p-3.5 rounded-xl bg-[rgba(15,26,43,0.7)] border border-[rgba(82,103,125,0.25)] text-center"
                    >
                      <span className="text-xs text-[var(--buttercream)] font-medium block">
                        {item}
                      </span>
                      <span className="text-[10px] text-[var(--dusty-blue)] font-mono block mt-1">
                        عنصر #{idx + 1}
                      </span>
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            </div>
          </section>
        )}

        {/* SECTION 4: COMPONENT UI KIT PREVIEW */}
        {(activeTab === "components" || activeTab === "palette") && (
          <section id="components" className="space-y-6">
            <div className="border-b border-[rgba(82,103,125,0.25)] pb-4">
              <h2 className="font-display font-black text-2xl text-[var(--buttercream)] flex items-center gap-3">
                <Layers className="w-6 h-6 text-[var(--dusty-blue)]" />
                <span>معاينة مكونات الواجهة بالهوية الجديدة (UI Kit Preview)</span>
              </h2>
              <p className="text-xs sm:text-sm text-[var(--mist)] mt-1">
                تطبيق مباشر للتوكنات الجديدة على الأزرار، والبطاقات، والشارات، وحقول الإدخال.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Buttons and Badges */}
              <div className="surface-card p-6 sm:p-8 space-y-6">
                <h4 className="font-display font-bold text-base text-[var(--buttercream)]">
                  الأزرار والشارات (Buttons & Badges)
                </h4>

                <div className="flex flex-wrap gap-3 items-center">
                  <button className="btn-primary text-sm">
                    <Sparkles className="w-4 h-4" />
                    <span>فحص عقار جديد</span>
                  </button>

                  <button className="btn-secondary text-sm">
                    <Compass className="w-4 h-4" />
                    <span>مقارنة الخيارات</span>
                  </button>

                  <button className="btn-ghost text-sm">
                    <span>تخطي الخطوة</span>
                  </button>
                </div>

                <div className="pt-4 border-t border-[rgba(82,103,125,0.2)] space-y-3">
                  <span className="text-xs text-[var(--mist)] block font-semibold">شارات الحالة والتقييم:</span>
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[rgba(94,155,121,0.15)] text-[var(--status-ok)] border border-[rgba(94,155,121,0.35)]">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>جاهز للتملك (مطابق 94%)</span>
                    </span>

                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[rgba(204,160,84,0.15)] text-[var(--status-warn)] border border-[rgba(204,160,84,0.35)]">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>تنبيه: تكلفة ترميم محتملة</span>
                    </span>

                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[rgba(200,92,92,0.15)] text-[var(--status-danger)] border border-[rgba(200,92,92,0.35)]">
                      <AlertOctagon className="w-3.5 h-3.5" />
                      <span>مخاطرة إنشائية حرجة</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Data & Form Preview */}
              <div className="surface-card p-6 sm:p-8 space-y-6">
                <h4 className="font-display font-bold text-base text-[var(--buttercream)]">
                  البطاقات وحقول الإدخال (Inputs & Metrics)
                </h4>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-[var(--mist)] block mb-1.5 font-medium">
                      رابط العقار المرشح (عقار، سهم، إلخ):
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="https://sa.aqar.fm/ad/..."
                        readOnly
                        value="https://sa.aqar.fm/ad/5928192-villa-alnarjis"
                        className="w-full bg-[rgba(15,26,43,0.8)] border border-[rgba(82,103,125,0.4)] text-[var(--buttercream)] text-xs rounded-xl px-4 py-3 outline-none focus:border-[var(--buttercream)] transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="p-3.5 rounded-xl bg-[rgba(15,26,43,0.6)] border border-[rgba(82,103,125,0.25)]">
                      <span className="text-[11px] text-[var(--mist)] block">القيمة العادلة المقدرة</span>
                      <span className="text-lg font-mono font-bold text-[var(--buttercream)] block mt-0.5">
                        2,450,000 ر.س
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[rgba(15,26,43,0.6)] border border-[rgba(82,103,125,0.25)]">
                      <span className="text-[11px] text-[var(--mist)] block">مؤشر المخاطر الإنشائية</span>
                      <span className="text-lg font-mono font-bold text-[var(--status-ok)] block mt-0.5">
                        منخفض (12%)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Footer / System Compliance Notice */}
        <footer className="pt-8 border-t border-[rgba(82,103,125,0.2)] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--mist)]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[var(--dusty-blue)]" />
            <span>نظام التصميم المرئي 2.0 • بوصلة العقار (Bawsala) • جاهز للاعتماد الهندسي</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span>dir=&quot;rtl&quot;</span>
            <span>lang=&quot;ar&quot;</span>
            <span>dark theme only</span>
            <span>60fps transform+opacity</span>
          </div>
        </footer>
      </main>
    </div>
  );
}

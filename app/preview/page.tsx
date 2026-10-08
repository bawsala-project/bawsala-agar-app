"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  Compass,
  ChevronLeft,
  Share2,
  Bookmark,
  Home,
  Layers,
  Search,
  Bell,
  User,
  MapPin,
} from "lucide-react";

export default function ExecutiveMockupPage() {
  const [activeTab, setActiveTab] = useState<"recommendation" | "matrix" | "inspection">("recommendation");
  const [activeNav, setActiveNav] = useState<string>("home");
  const [saved, setSaved] = useState(false);

  return (
    <div className="min-h-screen w-full bg-midnight-canvas text-pale-gray flex flex-col items-center justify-center p-3 sm:p-6 lg:p-10 font-tajawal select-none">
      {/* Editorial Luxury Header Above Phone */}
      <header className="mb-6 text-center max-w-xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full badge-champagne text-xs font-semibold tracking-wider mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>المساعد الذكي الأول للقرار العقاري بالمملكة</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-brand-serif tracking-wide text-pale-gray mb-1">
          BAWSALA <span className="font-tajawal text-warm-stone font-light text-xl">| بوصلة العقار</span>
        </h1>
        <p className="text-xs sm:text-sm text-warm-stone/80">
          نموذج التصميم التنفيذي الجديد (Ultra-Luxurious Executive Dark Edition)
        </p>
      </header>

      {/* Flagship iPhone Container with Dynamic Island & Ambient Edge Glow */}
      <div className="relative group">
        {/* Soft Ambient Gold/Midnight Glow Behind Device */}
        <div
          className="absolute -inset-4 bg-gradient-to-tr from-slate-blue/20 via-champagne-gold/10 to-midnight/40 rounded-[64px] blur-2xl opacity-70 pointer-events-none transition-opacity duration-700 group-hover:opacity-90"
          aria-hidden="true"
        />

        {/* Titanium Flagship Phone Outer Frame */}
        <div
          className="relative w-[393px] h-[852px] max-w-[92vw] max-h-[90vh] rounded-[54px] p-[10px] bg-gradient-to-b from-[#4A5568]/40 via-[#2D3748]/30 to-[#1A202C]/60 border border-pale-gray/15 shadow-[0_25px_60px_-15px_rgba(10,18,28,0.9)] flex flex-col overflow-hidden"
          style={{ aspectRatio: "393 / 852" }}
        >
          {/* Inner Phone Screen */}
          <div className="relative w-full h-full rounded-[44px] bg-[#1C2B3C] overflow-hidden flex flex-col border border-white/5">
            {/* Ambient canvas gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#243548]/40 via-[#1C2B3C] to-[#131E2B] pointer-events-none" />

            {/* Status Bar & Dynamic Island */}
            <div className="relative z-30 pt-3 px-7 pb-1 flex items-center justify-between text-xs text-pale-gray/90 shrink-0">
              <span className="font-semibold tracking-tight">9:41</span>

              {/* Dynamic Island */}
              <div className="w-[122px] h-[32px] bg-black/90 rounded-full flex items-center justify-between px-3 border border-white/10 shadow-inner">
                <div className="w-2.5 h-2.5 rounded-full bg-[#1C2B3C] border border-white/20 flex items-center justify-center">
                  <div className="w-1 h-1 rounded-full bg-slate-blue" />
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-champagne-gold animate-pulse" />
                  <span className="text-[10px] font-brand-serif text-champagne-gold">AI ACTIVE</span>
                </div>
              </div>

              {/* Icons (Signal, Wifi, Battery) */}
              <div className="flex items-center gap-1.5 opacity-80">
                <span className="text-[11px]">5G</span>
                <div className="w-4 h-2.5 border border-pale-gray/80 rounded-xs p-0.5 flex items-center">
                  <div className="w-full h-full bg-pale-gray/90 rounded-2xs" />
                </div>
              </div>
            </div>

            {/* App Executive Top Bar */}
            <div className="relative z-20 px-5 pt-2 pb-3 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full glass-executive flex items-center justify-center text-champagne-gold border border-champagne-gold/25 shadow-xs">
                  <Compass className="w-5 h-5 text-champagne-gold" />
                </div>
                <div className="text-right">
                  <div className="text-[11px] font-brand-serif uppercase tracking-widest text-champagne-gold leading-none">
                    BAWSALA
                  </div>
                  <div className="text-sm font-bold text-pale-gray leading-tight">
                    بوصلة العقار
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="w-9 h-9 rounded-full glass-executive flex items-center justify-center text-warm-stone hover:text-pale-gray transition-colors border border-pale-gray/10"
                  aria-label="إشعارات الذكاء الاصطناعي"
                >
                  <div className="relative">
                    <Bell className="w-4 h-4" />
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-champagne-gold shadow-xs" />
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setSaved(!saved)}
                  className={`w-9 h-9 rounded-full glass-executive flex items-center justify-center transition-colors border ${
                    saved ? "text-champagne-gold border-champagne-gold/40" : "text-warm-stone border-pale-gray/10"
                  }`}
                  aria-label="حفظ في المفضلة"
                >
                  <Bookmark className={`w-4 h-4 ${saved ? "fill-champagne-gold" : ""}`} />
                </button>
              </div>
            </div>

            {/* Navigation Tabs (Glass Pills) */}
            <div className="relative z-20 px-5 pb-2 shrink-0">
              <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl glass-executive border border-pale-gray/10 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveTab("recommendation")}
                  className={`py-2 px-2 rounded-xl text-center font-medium transition-all ${
                    activeTab === "recommendation"
                      ? "bg-slate-blue/40 text-pale-gray shadow-xs border border-pale-gray/20 font-semibold"
                      : "text-warm-stone hover:text-pale-gray"
                  }`}
                >
                  توصية النخبة
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("matrix")}
                  className={`py-2 px-2 rounded-xl text-center font-medium transition-all ${
                    activeTab === "matrix"
                      ? "bg-slate-blue/40 text-pale-gray shadow-xs border border-pale-gray/20 font-semibold"
                      : "text-warm-stone hover:text-pale-gray"
                  }`}
                >
                  مصفوفة القرار
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("inspection")}
                  className={`py-2 px-2 rounded-xl text-center font-medium transition-all ${
                    activeTab === "inspection"
                      ? "bg-slate-blue/40 text-pale-gray shadow-xs border border-pale-gray/20 font-semibold"
                      : "text-warm-stone hover:text-pale-gray"
                  }`}
                >
                  الفحص والمطابقة
                </button>
              </div>
            </div>

            {/* Scrollable Screen Content */}
            <div className="relative z-10 flex-1 overflow-y-auto px-5 pb-28 space-y-4 pt-1">
              {activeTab === "recommendation" && (
                <>
                  {/* Hero Property Card */}
                  <div className="relative rounded-3xl overflow-hidden glass-executive border border-pale-gray/15 shadow-xl transition-all duration-300">
                    {/* Architectural Photo with Dark Gradient Scrim */}
                    <div className="relative h-56 w-full">
                      <Image
                        src="/images/p1-exterior.jpg"
                        alt="فيلا حطين الفاخرة"
                        fill
                        className="object-cover"
                        priority
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#1C2B3C] via-[#1C2B3C]/30 to-black/20" />

                      {/* Top Badges */}
                      <div className="absolute top-3 inset-x-3 flex items-center justify-between">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-champagne-gold/40 text-champagne-gold text-xs font-semibold shadow-md">
                          <Sparkles className="w-3 h-3 text-champagne-gold" />
                          <span>توصية بوصلة الذكية</span>
                        </div>
                        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md border border-pale-gray/20 text-pale-gray text-xs">
                          <CheckCircle2 className="w-3.5 h-3.5 text-champagne-gold" />
                          <span className="text-[11px]">موثق رسمي</span>
                        </div>
                      </div>

                      {/* Bottom Info overlay on Image */}
                      <div className="absolute bottom-3 right-4 left-4 flex items-end justify-between">
                        <div>
                          <div className="inline-flex items-center gap-1 text-warm-stone text-xs mb-0.5">
                            <MapPin className="w-3.5 h-3.5 text-champagne-gold" />
                            <span>حي حطين النموذجي، الرياض</span>
                          </div>
                          <h2 className="text-lg font-bold text-pale-gray">
                            فيلا ريزيدنس الفاخرة
                          </h2>
                        </div>
                      </div>
                    </div>

                    {/* Card Content & Metrics */}
                    <div className="p-4 space-y-3.5">
                      {/* Price Section */}
                      <div className="flex items-baseline justify-between pb-3 border-b border-pale-gray/10">
                        <div>
                          <span className="text-xs text-warm-stone block">السعر الاسترشادي المعتمد</span>
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-2xl font-bold text-pale-gray tracking-tight">4,850,000</span>
                            <span className="text-sm font-semibold text-champagne-gold">ر.س</span>
                          </div>
                        </div>
                        <div className="text-left">
                          <span className="text-[11px] text-warm-stone block">المساحة الإجمالية</span>
                          <span className="text-sm font-semibold text-pale-gray">450 م²</span>
                        </div>
                      </div>

                      {/* Key Decision Metrics Grid */}
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="p-2.5 rounded-2xl bg-[#676A70]/15 border border-pale-gray/10">
                          <div className="text-[10px] text-warm-stone mb-0.5">درجة الملاءمة</div>
                          <div className="text-lg font-bold text-champagne-gold">96%</div>
                          <div className="text-[9px] text-pale-gray/70">تطابق استثنائي</div>
                        </div>

                        <div className="p-2.5 rounded-2xl bg-[#676A70]/15 border border-pale-gray/10">
                          <div className="text-[10px] text-warm-stone mb-0.5">العائد المتوقع</div>
                          <div className="text-lg font-bold text-pale-gray">+12.4%</div>
                          <div className="text-[9px] text-champagne-gold">نمو رأسمالي</div>
                        </div>

                        <div className="p-2.5 rounded-2xl bg-[#676A70]/15 border border-pale-gray/10">
                          <div className="text-[10px] text-warm-stone mb-0.5">مؤشر الحي</div>
                          <div className="text-lg font-bold text-pale-gray">9.8/10</div>
                          <div className="text-[9px] text-pale-gray/70">هدوء وخدمات</div>
                        </div>
                      </div>

                      {/* AI Executive Insight Callout */}
                      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-slate-blue/30 via-slate-blue/15 to-transparent border border-champagne-gold/25 relative overflow-hidden">
                        <div className="flex items-start gap-2.5">
                          <div className="w-6 h-6 rounded-full bg-champagne-gold/20 flex items-center justify-center shrink-0 mt-0.5">
                            <Sparkles className="w-3.5 h-3.5 text-champagne-gold" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-champagne-gold mb-1">
                              تحليل بوصلة للذكاء الاصطناعي
                            </div>
                            <p className="text-xs text-pale-gray/90 leading-relaxed font-normal">
                              العقار يحقق أعلى مؤشر خصوصية في المنطقة الشمالية، مع انخفاض مخاطر التذبذب السعري بنسبة 18% مقارنة بمتوسط السوق للعام الجاري.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* CTA Button */}
                      <button
                        type="button"
                        onClick={() => setActiveTab("matrix")}
                        className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-champagne-gold via-[#E5C158] to-champagne-gold text-[#131E2B] font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-champagne-gold/20 hover:brightness-110 active:scale-[0.98] transition-all"
                      >
                        <span>استعراض مصفوفة القرار المتكاملة</span>
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Secondary Micro-Card: Neighborhood Signals */}
                  <div className="p-4 rounded-3xl glass-executive border border-pale-gray/10 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-warm-stone">مؤشرات الموقع والبيئة المحيطة</span>
                      <span className="text-[11px] text-champagne-gold">بيانات فورية 2026</span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-pale-gray/80">القرب من الطرق الشريانية (طريق الملك سلمان)</span>
                        <span className="font-semibold text-pale-gray">4 دقائق</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <div className="h-full bg-champagne-gold rounded-full w-[92%]" />
                      </div>
                    </div>

                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-pale-gray/80">مؤشر جودة المرافق والمدارس الدولية</span>
                        <span className="font-semibold text-pale-gray">9.6 / 10</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <div className="h-full bg-slate-blue rounded-full w-[88%]" />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {activeTab === "matrix" && (
                <>
                  {/* Decision Matrix View */}
                  <div className="p-4 rounded-3xl glass-executive border border-pale-gray/15 space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-pale-gray/10">
                      <div>
                        <h2 className="text-base font-bold text-pale-gray">مصفوفة اتخاذ القرار العقاري</h2>
                        <p className="text-xs text-warm-stone">تحليل مقارن مع 380 صفقة موثقة في حطين</p>
                      </div>
                      <div className="w-10 h-10 rounded-2xl bg-champagne-gold/15 border border-champagne-gold/30 flex items-center justify-center text-champagne-gold font-bold text-sm">
                        96%
                      </div>
                    </div>

                    {/* Financial Benchmark Card */}
                    <div className="p-3.5 rounded-2xl bg-[#131E2B]/80 border border-pale-gray/10 space-y-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-warm-stone">السعر الحالي المعروض</span>
                        <span className="font-bold text-pale-gray">4,850,000 ر.س</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-warm-stone">التقييم الخوارزمي العادل (AI Fair Price)</span>
                        <span className="font-bold text-champagne-gold">4,790,000 ر.س</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-warm-stone">نطاق التفاوض المستهدف</span>
                        <span className="font-medium text-emerald-400">4,720,000 - 4,800,000 ر.س</span>
                      </div>
                    </div>

                    {/* Verification Checklist */}
                    <div className="space-y-2">
                      <span className="text-xs font-semibold text-warm-stone block">المطابقة النظامية والتراخيص</span>

                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-blue/20 border border-pale-gray/10">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-champagne-gold" />
                          <span className="text-xs text-pale-gray">صك ملكية إلكتروني محدث ومطابق</span>
                        </div>
                        <span className="text-[10px] text-warm-stone font-mono">REGA-SA</span>
                      </div>

                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-blue/20 border border-pale-gray/10">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-champagne-gold" />
                          <span className="text-xs text-pale-gray">شهادة إتمام البناء وكود البناء السعودي</span>
                        </div>
                        <span className="text-[10px] text-warm-stone font-mono">SBC-PASS</span>
                      </div>

                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-blue/20 border border-pale-gray/10">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-champagne-gold" />
                          <span className="text-xs text-pale-gray">تأمين ضد العيوب الخفية (ملاذ - 10 سنوات)</span>
                        </div>
                        <span className="text-[10px] text-champagne-gold font-mono">CERTIFIED</span>
                      </div>
                    </div>
                  </div>

                  {/* Action row */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      className="py-3 px-3 rounded-2xl glass-executive border border-pale-gray/20 text-xs font-semibold text-pale-gray flex items-center justify-center gap-1.5 hover:bg-slate-blue/30 transition-colors"
                    >
                      <Share2 className="w-3.5 h-3.5 text-warm-stone" />
                      <span>تصدير تقرير تنفيذي PDF</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("inspection")}
                      className="py-3 px-3 rounded-2xl bg-slate-blue/40 border border-champagne-gold/30 text-xs font-semibold text-champagne-gold flex items-center justify-center gap-1.5 hover:bg-slate-blue/60 transition-colors"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-champagne-gold" />
                      <span>حجز فحص هندسي</span>
                    </button>
                  </div>
                </>
              )}

              {activeTab === "inspection" && (
                <>
                  {/* Inspection View */}
                  <div className="p-4 rounded-3xl glass-executive border border-pale-gray/15 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-champagne-gold/20 flex items-center justify-center text-champagne-gold">
                        <ShieldCheck className="w-5 h-5 text-champagne-gold" />
                      </div>
                      <div>
                        <h2 className="text-base font-bold text-pale-gray">الفحص الفني المعتمد</h2>
                        <p className="text-xs text-warm-stone">فحص إنشائي وهندسي بواسطة خبراء معتمدين</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div className="p-3 rounded-2xl bg-white/5 border border-white/5 text-center">
                        <div className="text-[10px] text-warm-stone mb-1">جاهزية البنية التحتية</div>
                        <div className="text-base font-bold text-pale-gray">100%</div>
                        <div className="text-[9px] text-emerald-400">مكتملة بالكامل</div>
                      </div>
                      <div className="p-3 rounded-2xl bg-white/5 border border-white/5 text-center">
                        <div className="text-[10px] text-warm-stone mb-1">التقييم الإنشائي</div>
                        <div className="text-base font-bold text-champagne-gold">درجة A+</div>
                        <div className="text-[9px] text-champagne-gold">خالٍ من العيوب</div>
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-blue/20 border border-pale-gray/10 text-xs leading-relaxed text-pale-gray/80">
                      تم إجراء الفحص الحراري للعزل المائي والحراري، وفحص الأحمال الكهربائية، واختبار ضغط شبكة المياه وفقاً للمعايير الصارمة لبرنامج بوصلة.
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Floating Navigation Dock with Ambient Champagne Gold Glow */}
            <div className="absolute bottom-5 inset-x-5 z-40">
              <nav
                className="relative rounded-3xl glass-executive dock-champagne-glow border border-pale-gray/15 px-3 py-2 flex items-center justify-around"
                aria-label="التنقل الرئيسي"
              >
                <button
                  type="button"
                  onClick={() => {
                    setActiveNav("home");
                    setActiveTab("recommendation");
                  }}
                  className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-2xl transition-all ${
                    activeNav === "home"
                      ? "text-champagne-gold"
                      : "text-warm-stone hover:text-pale-gray"
                  }`}
                >
                  <Home className={`w-5 h-5 ${activeNav === "home" ? "stroke-[2.2px]" : "stroke-[1.5px]"}`} />
                  <span className="text-[10px] font-medium">الرئيسية</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveNav("search");
                  }}
                  className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-2xl transition-all ${
                    activeNav === "search"
                      ? "text-champagne-gold"
                      : "text-warm-stone hover:text-pale-gray"
                  }`}
                >
                  <Search className={`w-5 h-5 ${activeNav === "search" ? "stroke-[2.2px]" : "stroke-[1.5px]"}`} />
                  <span className="text-[10px] font-medium">استكشاف</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveNav("matrix");
                    setActiveTab("matrix");
                  }}
                  className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-2xl transition-all ${
                    activeNav === "matrix"
                      ? "text-champagne-gold"
                      : "text-warm-stone hover:text-pale-gray"
                  }`}
                >
                  <div className="relative">
                    <Layers className={`w-5 h-5 ${activeNav === "matrix" ? "stroke-[2.2px]" : "stroke-[1.5px]"}`} />
                    <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-champagne-gold" />
                  </div>
                  <span className="text-[10px] font-medium">مصفوفة AI</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveNav("profile");
                  }}
                  className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-2xl transition-all ${
                    activeNav === "profile"
                      ? "text-champagne-gold"
                      : "text-warm-stone hover:text-pale-gray"
                  }`}
                >
                  <User className={`w-5 h-5 ${activeNav === "profile" ? "stroke-[2.2px]" : "stroke-[1.5px]"}`} />
                  <span className="text-[10px] font-medium">حسابي</span>
                </button>
              </nav>
            </div>

            {/* Bottom Home Indicator */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-pale-gray/40 rounded-full z-50 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Footer Navigation Back to Shell */}
      <footer className="mt-6 flex items-center gap-4 text-xs text-warm-stone/70">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl glass-executive text-pale-gray hover:text-champagne-gold transition-colors border border-pale-gray/10"
        >
          <span>العودة إلى منصة العرض (Presentation Shell)</span>
          <ChevronLeft className="w-3.5 h-3.5" />
        </Link>
      </footer>
    </div>
  );
}

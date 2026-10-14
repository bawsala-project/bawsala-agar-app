import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ALLOWED_CITIES } from "@/lib/constants/cities";
import { ConsultationCard } from "@/components/home/consultation-card";
import { HeroSection } from "@/components/home/hero-section";
import { HeroConsultationWrapper } from "@/components/home/hero-consultation-wrapper";
import { BawsalaNavbar } from "@/components/layout/bawsala-navbar";
import {
  IntroOverlay,
  CompassDivider,
  BawsalaWordmark,
  BawsalaCompass,
} from "@/components/brand";
import {
  ShieldCheck,
  Calendar,
  Building2,
  SlidersHorizontal,
  ArrowLeft,
  Scale,
  TrendingUp,
  Inbox,
} from "lucide-react";

interface DecisionCaseWithProperties {
  id: string;
  city: string;
  created_at: string;
  status: string;
  properties?: { id: string }[];
}

export default async function HomePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let cases: DecisionCaseWithProperties[] = [];
  if (user) {
    const { data } = await supabase
      .from("decision_cases")
      .select("id, city, created_at, status, properties(id)")
      .is("deleted_at", null)
      .order("created_at", { ascending: false });
    cases = (data as unknown as DecisionCaseWithProperties[]) || [];
  }

  const latestCaseId = cases.length > 0 ? cases[0].id : null;

  return (
    <div
      dir="rtl"
      lang="ar"
      className="min-h-screen bg-[var(--cream)] text-[var(--navy)] font-body antialiased selection:bg-[var(--mist)] selection:text-[var(--navy)] relative overflow-x-hidden"
    >
      {/* Opening Intro Animation Overlay (plays once per session) */}
      <IntroOverlay />

      {/* Floating Centered Island Navbar */}
      <BawsalaNavbar
        latestCaseId={latestCaseId}
        sessionCount={cases.length}
        activeId="home"
      />

      {/* Hero Section with Line-by-Line Masked Rise, Kashida Accent, Arched Property Image & Two Buttons */}
      <HeroSection />

      {/* Overlapping "بدء دراسة قرار استشاري جديدة" Card on Paper Background */}
      <HeroConsultationWrapper>
        <ConsultationCard allowedCities={ALLOWED_CITIES} />
      </HeroConsultationWrapper>

      {/* Main Content Area */}
      <main className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-24 sm:pt-28 pb-20 space-y-24 relative z-10">

        {/* Active Consultations History Section */}
        <section className="max-w-4xl mx-auto space-y-6" id="active-sessions">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--mist)] pb-4">
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-display font-bold text-[var(--navy)]">
                  جلسات القرار النشطة
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-[var(--paper)] text-[var(--navy)] text-[11px] font-bold border border-[var(--mist)]">
                  {cases.length} {cases.length === 1 ? "جلسة" : "جلسات"}
                </span>
              </div>
              <p className="text-xs text-[var(--dusty-blue)] mt-1">
                تابع إدخال العقارات أو استخرج التقرير الهندسي الشامل
              </p>
            </div>

            {cases.length > 0 && (
              <button
                className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[var(--paper)] border border-[var(--mist)] text-xs font-semibold text-[var(--dusty-blue)] hover:text-[var(--navy)] hover:border-[var(--navy)] transition-all cursor-pointer shadow-xs"
                type="button"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-[var(--dusty-blue)]" />
                <span>تصفية الجلسات</span>
              </button>
            )}
          </div>

          {cases.length === 0 ? (
            <div className="bg-[var(--paper)] rounded-[28px] border border-[var(--mist)] p-10 sm:p-12 text-center space-y-4 shadow-[0_20px_60px_rgba(15,26,43,0.06)]">
              <div className="w-12 h-12 rounded-2xl bg-[var(--cream)] text-[var(--navy)] mx-auto flex items-center justify-center border border-[var(--mist)]">
                <Inbox className="w-6 h-6 text-[var(--dusty-blue)]" />
              </div>
              <h3 className="text-base font-display font-bold text-[var(--navy)]">
                لا توجد جلسات دراسة سابقة
              </h3>
              <p className="text-xs text-[var(--dusty-blue)] max-w-sm mx-auto leading-relaxed">
                ابدأ جلستك الاستشارية الأولى باختيار المدينة المستهدفة أعلاه، وسيتم حفظ مسار دراستك تلقائياً هنا.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {cases.map((c) => {
                const propCount = c.properties?.length || 0;
                let statusBadge = {
                  text: "مسودة أولية",
                  dotClass: "bg-[var(--dusty-blue)]",
                  bgClass: "bg-[var(--cream)] text-[var(--dusty-blue)] border-[var(--mist)]",
                };

                if (propCount >= 2) {
                  statusBadge = {
                    text: "جاهز للمطابقة والتحليل",
                    dotClass: "bg-[var(--status-ok)]",
                    bgClass: "bg-[var(--cream)] text-[var(--status-ok)] border-[var(--mist)]",
                  };
                } else if (propCount === 1) {
                  statusBadge = {
                    text: "بانتظار إضافة بقية العقارات",
                    dotClass: "bg-[var(--status-warn)]",
                    bgClass: "bg-[var(--cream)] text-[var(--status-warn)] border-[var(--mist)]",
                  };
                }

                const dateFormatted = new Date(c.created_at).toLocaleDateString("ar-SA", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                });

                return (
                  <div
                    key={c.id}
                    className="bg-[var(--paper)] rounded-[24px] border border-[var(--mist)] p-5 md:p-6 shadow-[0_20px_60px_rgba(15,26,43,0.06)] hover:border-[var(--navy)] transition-all flex flex-col md:flex-row md:items-center justify-between gap-5 group"
                  >
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-[var(--cream)] text-[var(--navy)] text-[11px] font-bold border border-[var(--mist)]">
                          {c.city}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-[var(--cream)] text-[var(--dusty-blue)] border border-[var(--mist)] text-[11px] font-medium">
                          عقار سكني
                        </span>
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${statusBadge.bgClass}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${statusBadge.dotClass}`} />
                          {statusBadge.text}
                        </span>
                      </div>

                      <h3 className="text-base font-display font-bold text-[var(--navy)]">
                        دراسة قرار شراء عقار في {c.city}
                      </h3>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--dusty-blue)] font-normal">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-[var(--dusty-blue)]" />
                          {dateFormatted}
                        </span>
                        <span className="flex items-center gap-1.5 text-[var(--navy)] font-semibold">
                          <Building2 className="w-3.5 h-3.5 text-[var(--dusty-blue)]" />
                          {propCount} {propCount === 1 ? "عقار مضاف" : "عقارات مرشحة"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-5 pt-3 md:pt-0 border-t md:border-t-0 border-[var(--mist)]">
                      <Link
                        href={`/case/${c.id}/${propCount > 0 ? "properties" : "needs"}`}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--navy)] text-[var(--cream)] text-xs font-bold hover:bg-[var(--midnight)] transition-all shadow-xs"
                      >
                        <span>متابعة القرار</span>
                        <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Compass Divider */}
        <CompassDivider withEmblem className="my-10 max-w-4xl mx-auto" />

        {/* Value Pillar Cards (Minimal, Quiet Luxury on Cream Paper) */}
        <section className="max-w-4xl mx-auto space-y-8 pt-4">
          <div className="text-center space-y-2">
            <h2 className="text-xl sm:text-2xl font-display font-bold text-[var(--navy)]">
              لماذا تختلف بوصلة العقار؟
            </h2>
            <p className="text-xs sm:text-sm text-[var(--dusty-blue)] max-w-lg mx-auto">
              معايير مكتب استشاري وهندسي مستقل مصممة لحماية أموالك، بعيداً عن أساليب التسويق العقاري
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Pillar 1 */}
            <div className="rounded-[28px] border border-[var(--mist)] bg-[var(--paper)] p-6 md:p-8 space-y-4 hover:border-[var(--navy)] transition-all shadow-[0_20px_60px_rgba(15,26,43,0.06)]">
              <div className="w-12 h-12 rounded-2xl bg-[var(--cream)] border border-[var(--mist)] text-[var(--navy)] flex items-center justify-center">
                <Scale className="w-6 h-6 text-[var(--navy)]" />
              </div>
              <h3 className="text-base font-display font-bold text-[var(--navy)]">
                حياد استشاري 100%
              </h3>
              <p className="text-xs text-[var(--dusty-blue)] leading-relaxed font-normal">
                لا نتقاضى عمولات تسويقية من أي مطور، ولا نروج لعقار على حساب آخر. مصلحتك كطرف مشترٍ هي غايتنا الوحيدة.
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="rounded-[28px] border border-[var(--mist)] bg-[var(--paper)] p-6 md:p-8 space-y-4 hover:border-[var(--navy)] transition-all shadow-[0_20px_60px_rgba(15,26,43,0.06)]">
              <div className="w-12 h-12 rounded-2xl bg-[var(--cream)] border border-[var(--mist)] text-[var(--navy)] flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-[var(--navy)]" />
              </div>
              <h3 className="text-base font-display font-bold text-[var(--navy)]">
                كشف تضارب المساحات والصكوك
              </h3>
              <p className="text-xs text-[var(--dusty-blue)] leading-relaxed font-normal">
                نكشف الهدر الإعلاني ونطابق المساحة الصافية القابلة للعيش، مع تدقيق ملكية المواقف والارتدادات والتراخيص الرسمية.
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="rounded-[28px] border border-[var(--mist)] bg-[var(--paper)] p-6 md:p-8 space-y-4 hover:border-[var(--navy)] transition-all shadow-[0_20px_60px_rgba(15,26,43,0.06)]">
              <div className="w-12 h-12 rounded-2xl bg-[var(--cream)] border border-[var(--mist)] text-[var(--navy)] flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-[var(--navy)]" />
              </div>
              <h3 className="text-base font-display font-bold text-[var(--navy)]">
                تحليل تكلفة الامتلاك (TCO)
              </h3>
              <p className="text-xs text-[var(--dusty-blue)] leading-relaxed font-normal">
                لا ننظر لسعر الشراء فقط، بل نحسب مصاريف اتحاد الملاك، كفاءة استهلاك الطاقة، والصيانة الدورية المتوقعة لـ 10 سنوات قادمة.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Clean Editorial Footer on Cream Paper with Large Faint Logo */}
      <footer className="mt-20 border-t border-[var(--mist)] bg-[var(--cream)] py-12 relative z-10 pb-28 md:pb-12">
        <div className="max-w-[1200px] mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--dusty-blue)]">
          <div className="flex items-center gap-3">
            <div className="text-[var(--navy)]">
              <BawsalaCompass size={22} animateHover />
            </div>
            <span className="font-display font-black text-sm text-[var(--navy)]">بوصلة العقار</span>
            <span>•</span>
            <span>منظومة استشارية وهندسية مستقلة</span>
          </div>
          <div className="text-[var(--dusty-blue)] font-normal">
            متوافق مع كود البناء السعودي ومعايير الصكوك المحدثة
          </div>
        </div>

        {/* Large Faint Footer Wordmark in Navy Ink */}
        <div className="w-full overflow-hidden select-none pointer-events-none text-center pt-8 pb-2 opacity-[0.05] text-[var(--navy)]">
          <BawsalaWordmark size="xl" tracking="0.45em" />
        </div>
      </footer>
    </div>
  );
}

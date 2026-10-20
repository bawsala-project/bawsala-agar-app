import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ALLOWED_CITIES } from "@/lib/constants/cities";
import { ConsultationCard } from "@/components/home/consultation-card";
import { HeroSection } from "@/components/home/hero-section";
import { HeroConsultationWrapper } from "@/components/home/hero-consultation-wrapper";
import { BawsalaNavbar } from "@/components/layout/bawsala-navbar";
import {
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
      {/* Floating Centered Island Navbar */}
      <BawsalaNavbar
        latestCaseId={latestCaseId}
        sessionCount={cases.length}
        activeId="home"
      />

      {/* Hero Section */}
      <HeroSection />

      {/* Overlapping Consultation Card on Paper Background */}
      <HeroConsultationWrapper>
        <ConsultationCard allowedCities={ALLOWED_CITIES} />
      </HeroConsultationWrapper>

      {/* Main Content Area */}
      <main className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-16 sm:pt-20 pb-20 space-y-20 relative z-10">
        {/* Active Consultations History Section */}
        <section className="max-w-4xl mx-auto space-y-6" id="active-sessions">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--mist)] pb-4">
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-display font-bold text-[var(--navy)]">
                  حالاتي
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-[var(--paper)] text-[var(--navy)] text-[11px] font-bold border border-[var(--mist)]">
                  {cases.length} {cases.length === 1 ? "حالة" : "حالات"}
                </span>
              </div>
            </div>

            {cases.length > 0 && (
              <button
                className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[var(--paper)] border border-[var(--mist)] text-xs font-semibold text-[var(--dusty-blue)] hover:text-[var(--navy)] hover:border-[var(--navy)] transition-all cursor-pointer shadow-xs"
                type="button"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-[var(--dusty-blue)]" />
                <span>تصفية الحالات</span>
              </button>
            )}
          </div>

          {cases.length === 0 ? (
            <div className="bg-[var(--paper)] rounded-[28px] border border-[var(--mist)] p-10 sm:p-12 text-center space-y-4 shadow-[0_20px_60px_rgba(15,26,43,0.06)]">
              <div className="w-12 h-12 rounded-2xl bg-[var(--cream)] text-[var(--navy)] mx-auto flex items-center justify-center border border-[var(--mist)]">
                <Inbox className="w-6 h-6 text-[var(--dusty-blue)]" />
              </div>
              <h3 className="text-base font-body font-bold text-[var(--navy)]">
                لا توجد حالات بعد
              </h3>
              <p className="text-sm text-[var(--dusty-blue)] max-w-sm mx-auto leading-relaxed">
                اختر مدينتك أعلاه لتبدأ.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {cases.map((c) => {
                const propCount = c.properties?.length || 0;
                let statusBadge = {
                  text: "مسودة",
                  dotClass: "bg-[var(--dusty-blue)]",
                  bgClass: "bg-[var(--cream)] text-[var(--dusty-blue)] border-[var(--mist)]",
                };

                if (c.status === "analyzed") {
                  statusBadge = {
                    text: "النتيجة جاهزة",
                    dotClass: "bg-[var(--status-ok)]",
                    bgClass: "bg-[var(--cream)] text-[var(--status-ok)] border-[var(--mist)]",
                  };
                } else if (propCount >= 2) {
                  statusBadge = {
                    text: "جاهز للمقارنة",
                    dotClass: "bg-[var(--status-ok)]",
                    bgClass: "bg-[var(--cream)] text-[var(--status-ok)] border-[var(--mist)]",
                  };
                } else if (propCount === 1) {
                  statusBadge = {
                    text: "جاهز للفحص المجاني",
                    dotClass: "bg-[var(--status-ok)]",
                    bgClass: "bg-[var(--cream)] text-[var(--status-ok)] border-[var(--mist)]",
                  };
                }

                const dateFormatted = new Date(c.created_at).toLocaleDateString("ar-SA", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                });

                const targetHref =
                  c.status === "analyzed"
                    ? `/case/${c.id}/results`
                    : propCount > 0
                      ? `/case/${c.id}/properties`
                      : `/case/${c.id}/needs`;

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
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${statusBadge.bgClass}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${statusBadge.dotClass}`} />
                          {statusBadge.text}
                        </span>
                      </div>

                      <h3 className="text-base font-body font-bold text-[var(--navy)]">
                        شقة سكنية في {c.city}
                      </h3>

                      <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--dusty-blue)] font-normal">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-[var(--dusty-blue)]" />
                          {dateFormatted}
                        </span>
                        <span className="flex items-center gap-1.5 text-[var(--navy)] font-semibold">
                          <Building2 className="w-3.5 h-3.5 text-[var(--dusty-blue)]" />
                          {propCount} {propCount === 1 ? "شقة مرشحة" : "شقق مرشحة"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-5 pt-3 md:pt-0 border-t md:border-t-0 border-[var(--mist)]">
                      <Link
                        href={targetHref}
                        className="w-full md:w-auto justify-center min-h-[44px] inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--navy)] text-[var(--cream)] text-sm font-bold hover:bg-[var(--midnight)] transition-all shadow-xs"
                      >
                        <span>{c.status === "analyzed" ? "عرض النتيجة" : "متابعة"}</span>
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

        {/* Value Pillar Cards (Aligned with v1.9 Decision Assistant Positioning) */}
        <section className="max-w-4xl mx-auto space-y-6 sm:space-y-8 pt-4">
          <div className="text-center space-y-2">
            <h2 className="text-xl sm:text-2xl font-display font-bold text-[var(--navy)]">
              كيف نساعدك؟
            </h2>
            <p className="text-sm text-[var(--dusty-blue)] max-w-xl mx-auto">
              قرار محايد مبني على ظروفك، لا على التسويق.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6">
            {/* Pillar 1 */}
            <div className="rounded-[22px] md:rounded-[28px] border border-[var(--mist)] bg-[var(--paper)] p-4 md:p-8 flex md:flex-col items-start gap-4 hover:border-[var(--navy)] transition-all shadow-[0_20px_60px_rgba(15,26,43,0.06)]">
              <div className="w-11 h-11 md:w-12 md:h-12 shrink-0 rounded-2xl bg-[var(--cream)] border border-[var(--mist)] text-[var(--navy)] flex items-center justify-center">
                <Scale className="w-6 h-6 text-[var(--navy)]" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-body font-bold text-[var(--navy)]">
                  ملاءمة لاحتياجك
                </h3>
                <p className="text-sm text-[var(--dusty-blue)] leading-relaxed font-normal">
                  أسرتك وشروطك وتنقلاتك اليومية.
                </p>
              </div>
            </div>

            {/* Pillar 2 */}
            <div className="rounded-[22px] md:rounded-[28px] border border-[var(--mist)] bg-[var(--paper)] p-4 md:p-8 flex md:flex-col items-start gap-4 hover:border-[var(--navy)] transition-all shadow-[0_20px_60px_rgba(15,26,43,0.06)]">
              <div className="w-11 h-11 md:w-12 md:h-12 shrink-0 rounded-2xl bg-[var(--cream)] border border-[var(--mist)] text-[var(--navy)] flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-[var(--navy)]" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-body font-bold text-[var(--navy)]">
                  سعر عادل وميزانية واضحة
                </h3>
                <p className="text-sm text-[var(--dusty-blue)] leading-relaxed font-normal">
                  سعر المتر، كاش أو تمويل، ومزايا كل خيار.
                </p>
              </div>
            </div>

            {/* Pillar 3 */}
            <div className="rounded-[22px] md:rounded-[28px] border border-[var(--mist)] bg-[var(--paper)] p-4 md:p-8 flex md:flex-col items-start gap-4 hover:border-[var(--navy)] transition-all shadow-[0_20px_60px_rgba(15,26,43,0.06)]">
              <div className="w-11 h-11 md:w-12 md:h-12 shrink-0 rounded-2xl bg-[var(--cream)] border border-[var(--mist)] text-[var(--navy)] flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-[var(--navy)]" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-body font-bold text-[var(--navy)]">
                  ثقة وخطة معاينة
                </h3>
                <p className="text-sm text-[var(--dusty-blue)] leading-relaxed font-normal">
                  النواقص، مستوى الثقة، وقائمة تحقق ميداني.
                </p>
              </div>
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
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline">مساعد مستقل لقرار شراء السكن</span>
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

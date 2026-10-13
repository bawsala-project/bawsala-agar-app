import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ALLOWED_CITIES } from "@/lib/auth";
import { ConsultationCard } from "@/components/home/consultation-card";
import {
  Compass,
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
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 antialiased selection:bg-blue-600 selection:text-white">
      {/* Header / Navigation */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-slate-100/80 transition-all">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3.5 group">
            <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-sm group-hover:bg-blue-600 transition-colors">
              <Compass className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-extrabold text-slate-900 tracking-tight">
                  بوصلة العقار
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200/50">
                  استشاري المشتري
                </span>
              </div>
              <p className="text-xs text-slate-400 font-light hidden sm:block">
                فحص فني وهندسي مستقل لقرار التملك
              </p>
            </div>
          </Link>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1.5 p-1.5 rounded-full bg-slate-100/70 border border-slate-200/40 text-xs font-semibold text-slate-600">
            <Link
              className="px-4 py-2 rounded-full bg-white text-slate-900 shadow-sm transition-all"
              href="#"
            >
              الرئيسية والبدء
            </Link>
            <Link
              className="px-4 py-2 rounded-full hover:text-slate-900 hover:bg-white/60 transition-all"
              href={latestCaseId ? `/case/${latestCaseId}/properties` : "#consultation-card"}
            >
              العقارات المرشحة
            </Link>
            <Link
              className="px-4 py-2 rounded-full hover:text-slate-900 hover:bg-white/60 transition-all"
              href={latestCaseId ? `/case/${latestCaseId}/inspection` : "#consultation-card"}
            >
              الفحص الهندسي
            </Link>
            <Link
              className="px-4 py-2 rounded-full hover:text-slate-900 hover:bg-white/60 transition-all"
              href={latestCaseId ? `/case/${latestCaseId}/compare` : "#consultation-card"}
            >
              مصفوفة المقارنة
            </Link>
          </nav>

          {/* Active Sessions Trigger */}
          <div className="flex items-center gap-3">
            <a
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-50 border border-slate-200/70 text-slate-700 text-xs font-bold hover:bg-white hover:border-slate-300 transition-all shadow-xs"
              href="#active-sessions"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>جلسات التقييم</span>
              <span className="px-2 py-0.5 rounded-full bg-slate-200/70 text-[11px] text-slate-800">
                {cases.length}
              </span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Content Wrap */}
      <main className="max-w-6xl mx-auto px-6 py-12 md:py-16 space-y-20">
        {/* Hero Section: Architectural Minimalism */}
        <section className="text-center max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-slate-200/80 text-slate-700 text-xs font-medium shadow-xs">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>حياد استشاري تام 100% • في صف المشتري بلا عمولات تسويقية</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.3] md:leading-[1.25]">
            اتخذ قرار شراء مسكنك <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-l from-slate-900 via-slate-800 to-blue-600">
              بأرقام قطعية وتدقيق هندسي محايد
            </span>
          </h1>
          <p className="text-sm md:text-base text-slate-500 font-normal leading-relaxed max-w-2xl mx-auto">
            نكشف الفوارق الخفية بين المساحات الترويجية والواقع الفعلي للصك ومخطط البناء، ونزن تكاليف التشغيل المخفية قبل دفع أي عربون أو توقيع تمويل عقاري.
          </p>
        </section>

        {/* Interactive Consultation Card */}
        <section id="consultation-card" className="max-w-4xl mx-auto">
          <ConsultationCard allowedCities={ALLOWED_CITIES} />
        </section>

        {/* Active Consultations History */}
        <section className="max-w-4xl mx-auto space-y-6" id="active-sessions">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900">جلسات القرار النشطة</h2>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-bold">
                  {cases.length} {cases.length === 1 ? "جلسة" : "جلسات"}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                تابع إدخال العقارات أو استخرج التقرير الهندسي الشامل
              </p>
            </div>
            {cases.length > 0 && (
              <button
                className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200/80 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
                type="button"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>تصفية الجلسات</span>
              </button>
            )}
          </div>

          {cases.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-10 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 mx-auto flex items-center justify-center">
                <Inbox className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">لا توجد جلسات دراسة سابقة</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                ابدأ جلستك الاستشارية الأولى باختيار المدينة المستهدفة أعلاه، وسيتم حفظ مسار دراستك تلقائياً هنا.
              </p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {cases.map((c) => {
                const propCount = c.properties?.length || 0;
                let statusBadge = {
                  text: "مسودة أولية",
                  dotClass: "bg-slate-400",
                  bgClass: "bg-slate-100 text-slate-600",
                };

                if (propCount >= 2) {
                  statusBadge = {
                    text: "جاهز للمطابقة والتحليل",
                    dotClass: "bg-emerald-500",
                    bgClass: "bg-emerald-50 text-emerald-700",
                  };
                } else if (propCount === 1) {
                  statusBadge = {
                    text: "بانتظار إضافة بقية العقارات",
                    dotClass: "bg-amber-500",
                    bgClass: "bg-amber-50 text-amber-700",
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
                    className="bg-white rounded-2xl border border-slate-200/70 p-5 md:p-6 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all flex flex-col md:flex-row md:items-center justify-between gap-5"
                  >
                    <div className="space-y-2.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[11px] font-bold">
                          {c.city}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-medium">
                          عقار سكني
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${statusBadge.bgClass}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${statusBadge.dotClass}`} />
                          {statusBadge.text}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900">
                        دراسة قرار شراء عقار في {c.city}
                      </h3>
                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 font-light">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {dateFormatted}
                        </span>
                        <span className="flex items-center gap-1 text-slate-700 font-semibold">
                          <Building2 className="w-4 h-4 text-blue-600" />
                          {propCount} {propCount === 1 ? "عقار مضاف" : "عقارات مرشحة"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-5 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                      <Link
                        href={`/case/${c.id}/${propCount > 0 ? "properties" : "needs"}`}
                        className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-blue-600 transition-colors"
                      >
                        <span>متابعة القرار</span>
                        <ArrowLeft className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Value Pillar Cards (Minimal, Quiet Luxury) */}
        <section className="max-w-4xl mx-auto space-y-8 pt-4">
          <div className="text-center space-y-2">
            <h2 className="text-xl font-bold text-slate-900">لماذا تختلف بوصلة العقار؟</h2>
            <p className="text-xs text-slate-400 max-w-lg mx-auto">
              معايير مكتب استشاري وهندسي مستقل مصممة لحماية أموالك، بعيداً عن أساليب التسويق العقاري
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Pillar 1 */}
            <div className="bg-white rounded-3xl border border-slate-200/70 p-6 md:p-8 space-y-4 hover:shadow-sm transition-all">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Scale className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-base font-bold text-slate-900">حياد استشاري 100%</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-light">
                لا نتقاضى عمولات تسويقية من أي مطور، ولا نروج لعقار على حساب آخر. مصلحتك كطرف مشترٍ هي غايتنا الوحيدة.
              </p>
            </div>
            {/* Pillar 2 */}
            <div className="bg-white rounded-3xl border border-slate-200/70 p-6 md:p-8 space-y-4 hover:shadow-sm transition-all">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-800 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-slate-800" />
              </div>
              <h3 className="text-base font-bold text-slate-900">كشف تضارب المساحات والصكوك</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-light">
                نكشف الهدر الإعلاني ونطابق المساحة الصافية القابلة للعيش، مع تدقيق ملكية المواقف والارتدادات والتراخيص الرسمية.
              </p>
            </div>
            {/* Pillar 3 */}
            <div className="bg-white rounded-3xl border border-slate-200/70 p-6 md:p-8 space-y-4 hover:shadow-sm transition-all">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="text-base font-bold text-slate-900">تحليل تكلفة الامتلاك (TCO)</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-light">
                لا ننظر لسعر الشراء فقط، بل نحسب مصاريف اتحاد الملاك، كفاءة استهلاك الطاقة، والصيانة الدورية المتوقعة لـ 10 سنوات قادمة.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Clean, Minimalist Footer */}
      <footer className="mt-20 border-t border-slate-200/60 bg-white/60 py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">بوصلة العقار</span>
            <span>•</span>
            <span>منظومة استشارية هندسية ومالية مستقلة</span>
          </div>
          <div>متوافق مع كود البناء السعودي ومعايير الصكوك المحدثة</div>
        </div>
      </footer>
    </div>
  );
}

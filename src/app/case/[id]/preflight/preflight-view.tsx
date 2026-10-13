import Link from "next/link";
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Lock,
  Building2,
  SlidersHorizontal,
  FileSearch,
  Sparkles,
  Scale,
  Shield,
  Layers,
} from "lucide-react";
import type { PreflightResult } from "@/lib/preflight/evaluate";

interface PreflightViewProps {
  caseId: string;
  evaluation: PreflightResult;
  isPaid: boolean;
  propertyCount?: number;
}

export function PreflightView({
  caseId,
  evaluation,
  isPaid,
  propertyCount = 0,
}: PreflightViewProps) {
  const blockersCount = evaluation.blockers.length;
  const warningsCount = evaluation.warnings.length;

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-8 md:py-12 space-y-10">
      {/* Hero & Ambient Header */}
      <div className="relative bg-white rounded-3xl border border-slate-200/70 shadow-sm p-6 sm:p-10 space-y-6 overflow-hidden">
        {/* Subtle Ambient Background Light */}
        <div
          className={`absolute -top-32 -left-32 w-80 h-80 rounded-full blur-3xl pointer-events-none ${
            evaluation.ready ? "bg-emerald-50/70" : "bg-rose-50/70"
          }`}
        />

        {/* Phase Pill */}
        <div className="flex flex-wrap items-center justify-between gap-3 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100/80 border border-slate-200/70 text-slate-700 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-blue-600" />
            <span>المرحلة 3 من 4 • بوابة التدقيق الفني المسبق</span>
          </div>

          <div>
            {evaluation.ready ? (
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                جاهز للتحليل
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-extrabold bg-rose-50 text-rose-700 border border-rose-200 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                يلزم إكمال {blockersCount} عنصر قبل التحليل
              </span>
            )}
          </div>
        </div>

        {/* Title and Explanation */}
        <div className="space-y-2 relative z-10">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            الفحص المبدئي للحالة
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
            التحقق التلقائي من اكتمال البيانات وجاهزيتها للتحليل والمقارنة.
            لا نسمح بتشغيل خوارزميات التقييم المالي على بيانات متضاربة أو غير موثقة صكاً تجنباً للتضليل في قرار الشراء.
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-100 relative z-10">
          <div className="bg-slate-50/80 rounded-2xl p-3.5 border border-slate-100">
            <span className="text-[11px] font-bold text-slate-500 block mb-1">
              العقارات المرشحة
            </span>
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-slate-600" />
              <span className="text-lg font-extrabold text-slate-900">
                {propertyCount > 0 ? propertyCount : "—"}
              </span>
            </div>
          </div>

          <div
            className={`rounded-2xl p-3.5 border ${
              blockersCount > 0
                ? "bg-rose-50/60 border-rose-200/80 text-rose-900"
                : "bg-emerald-50/60 border-emerald-200/80 text-emerald-900"
            }`}
          >
            <span className="text-[11px] font-bold block mb-1">
              الموانع الإلزامية
            </span>
            <div className="flex items-center gap-2">
              {blockersCount > 0 ? (
                <ShieldAlert className="w-4 h-4 text-rose-600" />
              ) : (
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
              )}
              <span className="text-lg font-extrabold">
                {blockersCount}
              </span>
            </div>
          </div>

          <div
            className={`rounded-2xl p-3.5 border ${
              warningsCount > 0
                ? "bg-amber-50/60 border-amber-200/80 text-amber-900"
                : "bg-slate-50/80 border-slate-100 text-slate-900"
            }`}
          >
            <span className="text-[11px] font-bold block mb-1">
              التنبيهات الاستشارية
            </span>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span className="text-lg font-extrabold">
                {warningsCount}
              </span>
            </div>
          </div>

          <div className="bg-slate-50/80 rounded-2xl p-3.5 border border-slate-100">
            <span className="text-[11px] font-bold text-slate-500 block mb-1">
              حالة الجاهزية
            </span>
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  evaluation.ready ? "bg-emerald-500" : "bg-rose-500"
                }`}
              />
              <span className="text-xs sm:text-sm font-bold text-slate-800">
                {evaluation.ready ? "مكتمل" : "مغلق بمانع"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Blockers Section */}
      {blockersCount > 0 && (
        <section className="bg-white rounded-3xl border border-rose-200 shadow-sm p-6 sm:p-8 space-y-6 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-rose-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 shadow-xs">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  متطلبات يجب إكمالها ({blockersCount})
                </h2>
                <p className="text-xs text-rose-700/80 mt-0.5">
                  هذه النقاط تعطل التحليل لضمان عدم بناء القرار على بيانات متناقضة أو ناقصة.
                </p>
              </div>
            </div>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-bold self-start sm:self-auto">
              إلزامي للبدء
            </span>
          </div>

          <div className="space-y-3.5">
            {evaluation.blockers.map((blocker, idx) => {
              let actionLink = "";
              let actionText = "";
              let ActionIcon = ArrowLeft;

              if (blocker.code === "NO_REQUIREMENTS") {
                actionLink = `/case/${caseId}/needs`;
                actionText = "تحديد الاحتياجات";
                ActionIcon = SlidersHorizontal;
              } else if (blocker.code === "NO_PROPERTIES") {
                actionLink = `/case/${caseId}/properties`;
                actionText = "إضافة عقارات";
                ActionIcon = Building2;
              } else if (blocker.propertyId) {
                actionLink = `/case/${caseId}/properties/${blocker.propertyId}`;
                actionText = "تدقيق العقار";
                ActionIcon = FileSearch;
              }

              return (
                <div
                  key={idx}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 bg-rose-50/40 rounded-2xl border border-rose-200/80 hover:bg-rose-50/70 hover:border-rose-300 transition-all shadow-xs"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-8 h-8 rounded-xl bg-white border border-rose-200 text-rose-600 flex items-center justify-center shrink-0 mt-0.5 shadow-xs font-bold text-xs">
                      {idx + 1}
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-slate-900">
                        {blocker.messageAr}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 border border-rose-200/60">
                          [{blocker.code}]
                        </span>
                        {blocker.field && (
                          <span className="text-[11px] text-slate-500 font-mono">
                            حقل: {blocker.field}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {actionLink && (
                    <Link
                      href={actionLink}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold text-rose-800 bg-white hover:bg-rose-600 hover:text-white border border-rose-200 shadow-xs hover:border-rose-600 transition-all self-start sm:self-center shrink-0"
                    >
                      <ActionIcon className="w-3.5 h-3.5" />
                      <span>{actionText} ←</span>
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Warnings Section */}
      {warningsCount > 0 && (
        <section className="bg-white rounded-3xl border border-amber-200/80 shadow-sm p-6 sm:p-8 space-y-6 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-amber-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 shadow-xs">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  تنبيهات وملاحظات ({warningsCount})
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  هذه الملاحظات لا تمنع بدء التحليل، ولكن معالجتها ترفع من دقة وموثوقية تقرير القرار:
                </p>
              </div>
            </div>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold self-start sm:self-auto">
              تحسين جودة التقرير
            </span>
          </div>

          <div className="space-y-3">
            {evaluation.warnings.map((warning, idx) => (
              <div
                key={idx}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-amber-50/30 rounded-2xl border border-amber-200/70 hover:bg-amber-50/60 hover:border-amber-300 transition-all shadow-xs"
              >
                <div className="flex items-start gap-3">
                  <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 mt-2" />
                  <div className="space-y-1">
                    <p className="text-xs sm:text-sm font-semibold text-slate-800">
                      {warning.messageAr}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-amber-100/70 text-amber-800 border border-amber-200/50">
                        [{warning.code}]
                      </span>
                      {warning.field && (
                        <span className="text-[10px] text-slate-400 font-mono">
                          حقل: {warning.field}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {warning.propertyId && (
                  <Link
                    href={`/case/${caseId}/properties/${warning.propertyId}`}
                    className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-amber-900 hover:text-white bg-white hover:bg-amber-600 border border-amber-300/80 px-3 py-1.5 rounded-xl transition-all self-start sm:self-center shrink-0 shadow-xs"
                  >
                    <span>تدقيق العقار ←</span>
                  </Link>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Ready Banner when no blockers and no warnings */}
      {evaluation.ready && warningsCount === 0 && (
        <div className="p-8 sm:p-10 bg-emerald-50/60 rounded-3xl border border-emerald-200 text-center space-y-4 shadow-sm relative overflow-hidden">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div className="space-y-1.5 max-w-lg mx-auto">
            <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">
              جميع متطلبات وعقارات المقارنة مكتملة وجاهزة
            </h3>
            <p className="text-xs sm:text-sm text-emerald-800 leading-relaxed">
              تم استخراج وتأكيد الحقائق الأساسية ومطابقتها مع ميزانيتك وشروطك بنجاح. يمكنك الآن الانتقال لمرحلة التحليل الشامل.
            </p>
          </div>
        </div>
      )}

      {/* Three Pillars: Neutrality Assurance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/70 p-5 space-y-2 shadow-xs">
          <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center font-bold">
            <Scale className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-bold text-slate-900">حياد استشاري قطعي 100%</h4>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            لا نأخذ عمولات من أي مطور أو وسيط عقاري؛ مستشارك يعمل لصالح قرارك المالي فقط.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/70 p-5 space-y-2 shadow-xs">
          <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center font-bold">
            <Layers className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-bold text-slate-900">منع دمج أو متوسطات الأسعار</h4>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            في حال وجود اختلاف بين الإعلان والصك الفعلي، نلزمك بالاختيار أو التحقق ولا ندمج الأرقام أبداً.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/70 p-5 space-y-2 shadow-xs">
          <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center font-bold">
            <Shield className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-bold text-slate-900">حماية الدفعة والتوريط البنكي</h4>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            نكشف تكاليف الصيانة الخفية وعيوب المخطط قبل دفع أي عربون أو توقيع عقد تمويل سكني.
          </p>
        </div>
      </div>

      {/* Actions and Start Analysis Footer Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-5 sm:p-7 flex flex-col sm:flex-row items-center justify-between gap-4">
        <Link
          href={`/case/${caseId}/properties`}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 px-4 py-3 rounded-2xl transition-all order-2 sm:order-1 w-full sm:w-auto justify-center"
        >
          <ArrowRight className="w-4 h-4" />
          <span>← العودة إلى قائمة العقارات</span>
        </Link>

        <div className="order-1 sm:order-2 w-full sm:w-auto">
          {evaluation.ready ? (
            <Link
              href={isPaid ? `/case/${caseId}/results` : `/case/${caseId}/checkout`}
              className={`w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-2xl text-sm font-extrabold text-white shadow-md transition-all ${
                isPaid
                  ? "bg-slate-900 hover:bg-blue-600 shadow-slate-900/10"
                  : "bg-blue-600 hover:bg-blue-700 shadow-blue-600/20"
              }`}
            >
              {isPaid ? (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>بدء التحليل ←</span>
                </>
              ) : (
                <>
                  <span>المتابعة إلى الدفع (10 ر.س) ←</span>
                </>
              )}
            </Link>
          ) : (
            <button
              type="button"
              disabled
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl text-sm font-bold text-slate-400 bg-slate-100 border border-slate-200 cursor-not-allowed shadow-none"
            >
              <Lock className="w-4 h-4 text-slate-400" />
              <span>المتابعة إلى الدفع (10 ر.س) ←</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

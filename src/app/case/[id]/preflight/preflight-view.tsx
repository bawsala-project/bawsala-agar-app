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
  Check,
  X,
} from "lucide-react";
import type { PreflightResult } from "@/lib/preflight/evaluate";
import type { BuyerProfile } from "@/lib/schemas/buyer-profile";
import { BuyerProfileSummary } from "@/components/case/buyer-profile-summary";
import { InstrumentPhaseBadge } from "@/components/ui/instrument-phase-badge";

interface PreflightViewProps {
  caseId: string;
  evaluation: PreflightResult;
  isPaid: boolean;
  propertyCount?: number;
  profile?: BuyerProfile | null;
}

export function PreflightView({
  caseId,
  evaluation,
  isPaid,
  propertyCount = 0,
  profile,
}: PreflightViewProps) {
  const blockersCount = evaluation.blockers.length;
  const warningsCount = evaluation.warnings.length;
  const isCaseReady = evaluation.ready && evaluation.readiness?.isReady;

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-8 md:py-12 space-y-8">
      {/* Hero & Status Card */}
      <div className="bg-[var(--paper)] rounded-[28px] border border-[var(--mist)] p-6 sm:p-10 space-y-6 shadow-[0_20px_60px_rgba(15,26,43,0.04)]">
        {/* Phase Pill: "المرحلة الأولى مجانية" badge now refers to this step */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <InstrumentPhaseBadge
            label="المرحلة الأولى مجانية"
            sublabel="فحص الجاهزية المبدئي"
            currentStep={1}
            totalSteps={2}
          />

          <div>
            {isCaseReady ? (
              <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold bg-[#E9F4EE] text-[#1E6B43] border border-[#C5E4D4]">
                <CheckCircle2 className="w-3.5 h-3.5" />
                جاهز للتحليل (مكتمل)
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold bg-[#FDF1F0] text-[#A62626] border border-[#F6CBC8]">
                <AlertTriangle className="w-3.5 h-3.5" />
                يلزم استكمال {evaluation.readiness?.allMissingItems.length || blockersCount} عناصر
              </span>
            )}
          </div>
        </div>

        {/* Title and Explanation */}
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-[var(--navy)] tracking-tight leading-snug">
            فحص الجاهزية المبدئي المجاني
          </h1>
          <p className="text-xs sm:text-sm text-[var(--dusty-blue)] max-w-2xl leading-relaxed">
            التحقق التلقائي المجاني من اكتمال ملف المشتري ووجود 1 إلى 5 شقق مع الحد الأدنى من البيانات الأساسية (السعر، المساحة، الحي، الدور، وعمر المبنى) قبل أي التزام مالي.
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-[var(--mist)]">
          <div className="bg-[var(--cream)] rounded-2xl p-3.5 border border-[var(--mist)]">
            <span className="text-[11px] font-medium text-[var(--dusty-blue)] block mb-1">
              الشقق المرشحة
            </span>
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[var(--navy)]" />
              <span className="text-lg font-display font-bold text-[var(--navy)] tabular-nums">
                {propertyCount > 0 ? `${propertyCount} من 5` : "0 من 5"}
              </span>
            </div>
          </div>

          <div
            className={`rounded-2xl p-3.5 border ${
              evaluation.readiness?.buyerProfileComplete
                ? "bg-[#E9F4EE] border-[#C5E4D4] text-[#1E6B43]"
                : "bg-[#FDF1F0] border-[#F6CBC8] text-[#A62626]"
            }`}
          >
            <span className="text-[11px] font-medium block mb-1 opacity-90">
              ملف المشتري
            </span>
            <div className="flex items-center gap-2">
              {evaluation.readiness?.buyerProfileComplete ? (
                <ShieldCheck className="w-4 h-4 text-[#1E6B43]" />
              ) : (
                <ShieldAlert className="w-4 h-4 text-[#A62626]" />
              )}
              <span className="text-sm font-display font-bold">
                {evaluation.readiness?.buyerProfileComplete ? "مكتمل" : "ناقص"}
              </span>
            </div>
          </div>

          <div
            className={`rounded-2xl p-3.5 border ${
              evaluation.readiness?.properties?.filter((p) => p.isComplete).length === propertyCount && propertyCount > 0
                ? "bg-[#E9F4EE] border-[#C5E4D4] text-[#1E6B43]"
                : "bg-[#FFF9EC] border-[#F9E2AF] text-[#9A6700]"
            }`}
          >
            <span className="text-[11px] font-medium block mb-1 opacity-90">
              شقق مكتملة البيانات
            </span>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#1E6B43]" />
              <span className="text-lg font-display font-bold tabular-nums text-[var(--navy)]">
                {evaluation.readiness?.properties?.filter((p) => p.isComplete).length || 0} من {propertyCount}
              </span>
            </div>
          </div>

          <div className="bg-[var(--cream)] rounded-2xl p-3.5 border border-[var(--mist)]">
            <span className="text-[11px] font-medium text-[var(--dusty-blue)] block mb-1">
              حالة الجاهزية
            </span>
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  isCaseReady ? "bg-[#1E6B43]" : "bg-[#A62626]"
                }`}
              />
              <span className="text-xs sm:text-sm font-display font-bold text-[var(--navy)]">
                {isCaseReady ? "جاهز للتحليل" : "غير مكتمل"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Free Readiness Check Section */}
      <section className="bg-[var(--paper)] rounded-[28px] border border-[var(--mist)] p-6 sm:p-8 space-y-6 shadow-[0_20px_60px_rgba(15,26,43,0.04)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[var(--mist)]">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                isCaseReady
                  ? "bg-[#E9F4EE] text-[#1E6B43] border-[#C5E4D4]"
                  : "bg-[#FFF9EC] text-[#9A6700] border-[#F9E2AF]"
              }`}
            >
              {isCaseReady ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <ShieldAlert className="w-4 h-4" />
              )}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-display font-bold text-[var(--navy)]">
                نتائج فحص الجاهزية المجاني
              </h2>
              <p className="text-xs text-[var(--dusty-blue)] mt-0.5">
                فحص مجاني تلقائي قبل أي التزام مالي للتأكد من اكتمال ملف المشتري وحصر الشقق والبيانات الإلزامية.
              </p>
            </div>
          </div>

          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold self-start sm:self-auto ${
              isCaseReady
                ? "bg-[#E9F4EE] text-[#1E6B43] border border-[#C5E4D4]"
                : "bg-[#FDF1F0] text-[#A62626] border border-[#F6CBC8]"
            }`}
          >
            {isCaseReady ? "مكتمل وجاهز للتحليل" : "غير مكتمل"}
          </span>
        </div>

        {/* Case-Level Readiness Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Buyer Profile Status */}
          <div
            className={`p-4 rounded-2xl border transition-all ${
              evaluation.readiness?.buyerProfileComplete
                ? "bg-[var(--cream)] border-[var(--mist)]"
                : "bg-[#FDF1F0]/60 border-[#F6CBC8]"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    evaluation.readiness?.buyerProfileComplete
                      ? "bg-[#E9F4EE] text-[#1E6B43]"
                      : "bg-[#FDF1F0] text-[#A62626]"
                  }`}
                >
                  {evaluation.readiness?.buyerProfileComplete ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <X className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <h4 className="text-xs font-display font-bold text-[var(--navy)]">
                    ملف وتفضيلات المشتري
                  </h4>
                  <p className="text-[11px] text-[var(--dusty-blue)]">
                    {evaluation.readiness?.buyerProfileComplete
                      ? "الميزانية والأسرة والاحتياجات مكتملة"
                      : `ينقص: ${evaluation.readiness?.buyerProfileMissing.join("، ")}`}
                  </p>
                </div>
              </div>

              {!evaluation.readiness?.buyerProfileComplete && (
                <Link
                  href={`/case/${caseId}/profile`}
                  className="px-3 py-1.5 rounded-full bg-[var(--paper)] border border-[var(--mist)] hover:border-[var(--navy)] text-xs font-medium text-[var(--navy)] shrink-0 transition-colors"
                >
                  إكمال الملف ←
                </Link>
              )}
            </div>
          </div>

          {/* Property Count Status */}
          <div
            className={`p-4 rounded-2xl border transition-all ${
              evaluation.readiness?.propertyCountValid
                ? "bg-[var(--cream)] border-[var(--mist)]"
                : "bg-[#FDF1F0]/60 border-[#F6CBC8]"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    evaluation.readiness?.propertyCountValid
                      ? "bg-[#E9F4EE] text-[#1E6B43]"
                      : "bg-[#FDF1F0] text-[#A62626]"
                  }`}
                >
                  {evaluation.readiness?.propertyCountValid ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <X className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <h4 className="text-xs font-display font-bold text-[var(--navy)]">
                    حصر الشقق المرشحة ({evaluation.readiness?.propertyCount || 0} من 5)
                  </h4>
                  <p className="text-[11px] text-[var(--dusty-blue)]">
                    {evaluation.readiness?.propertyCountValid
                      ? "العدد ضمن النطاق المعتمد (1 إلى 5 شقق)"
                      : (evaluation.readiness?.propertyCount || 0) === 0
                      ? "يلزم إضافة شقة واحدة على الأقل"
                      : "تجاوز الحد الأقصى (الحد الأقصى 5 شقق)"}
                  </p>
                </div>
              </div>

              {(!evaluation.readiness?.propertyCountValid ||
                (evaluation.readiness?.propertyCount || 0) < 5) && (
                <Link
                  href={`/case/${caseId}/properties`}
                  className="px-3 py-1.5 rounded-full bg-[var(--paper)] border border-[var(--mist)] hover:border-[var(--navy)] text-xs font-medium text-[var(--navy)] shrink-0 transition-colors"
                >
                  {(evaluation.readiness?.propertyCount || 0) === 0
                    ? "إضافة شقق ←"
                    : "إدارة الشقق ←"}
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Per-Apartment Readiness Checklist */}
        {evaluation.readiness?.properties && evaluation.readiness.properties.length > 0 && (
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold text-[var(--navy)] uppercase tracking-wider">
              جاهزية الشقق المرشحة والبيانات الأساسية (5 حقول إلزامية لكل شقة)
            </h3>

            <div className="space-y-3">
              {evaluation.readiness.properties.map((p, idx) => (
                <div
                  key={p.propertyId}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                    p.isComplete
                      ? "bg-[var(--cream)] border-[var(--mist)]"
                      : "bg-[#FDF1F0]/40 border-[#F6CBC8]"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--mist)]">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-lg bg-[var(--paper)] border border-[var(--mist)] text-[var(--navy)] text-xs font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <div>
                        <h4 className="text-sm font-display font-bold text-[var(--navy)]">
                          {p.label}
                        </h4>
                        <span className="text-[11px] text-[var(--dusty-blue)]">
                          شقة سكنية
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          p.isComplete
                            ? "bg-[#E9F4EE] text-[#1E6B43] border border-[#C5E4D4]"
                            : "bg-[#FDF1F0] text-[#A62626] border border-[#F6CBC8]"
                        }`}
                      >
                        {p.isComplete
                          ? "مكتمل البيانات"
                          : `ينقص (${p.missingItems.length}) حقول`}
                      </span>

                      <Link
                        href={`/case/${caseId}/properties/${p.propertyId}`}
                        className="px-3 py-1 rounded-full bg-[var(--paper)] border border-[var(--mist)] hover:border-[var(--navy)] text-xs text-[var(--navy)] font-medium transition-colors"
                      >
                        تعديل / تدقيق ←
                      </Link>
                    </div>
                  </div>

                  {/* 5 Minimum Fields Badges */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-3 text-xs">
                    <div
                      className={`p-2 rounded-xl border flex items-center gap-1.5 ${
                        p.fields.price
                          ? "bg-[var(--paper)] border-[var(--mist)] text-[var(--navy)]"
                          : "bg-[#FDF1F0] border-[#F6CBC8] text-[#A62626]"
                      }`}
                    >
                      {p.fields.price ? (
                        <Check className="w-3.5 h-3.5 text-[#1E6B43]" />
                      ) : (
                        <X className="w-3.5 h-3.5" />
                      )}
                      <span className="text-[11px] font-medium">السعر المطلوب</span>
                    </div>

                    <div
                      className={`p-2 rounded-xl border flex items-center gap-1.5 ${
                        p.fields.area
                          ? "bg-[var(--paper)] border-[var(--mist)] text-[var(--navy)]"
                          : "bg-[#FDF1F0] border-[#F6CBC8] text-[#A62626]"
                      }`}
                    >
                      {p.fields.area ? (
                        <Check className="w-3.5 h-3.5 text-[#1E6B43]" />
                      ) : (
                        <X className="w-3.5 h-3.5" />
                      )}
                      <span className="text-[11px] font-medium">المساحة (م²)</span>
                    </div>

                    <div
                      className={`p-2 rounded-xl border flex items-center gap-1.5 ${
                        p.fields.district
                          ? "bg-[var(--paper)] border-[var(--mist)] text-[var(--navy)]"
                          : "bg-[#FDF1F0] border-[#F6CBC8] text-[#A62626]"
                      }`}
                    >
                      {p.fields.district ? (
                        <Check className="w-3.5 h-3.5 text-[#1E6B43]" />
                      ) : (
                        <X className="w-3.5 h-3.5" />
                      )}
                      <span className="text-[11px] font-medium">الحي</span>
                    </div>

                    <div
                      className={`p-2 rounded-xl border flex items-center gap-1.5 ${
                        p.fields.floor
                          ? "bg-[var(--paper)] border-[var(--mist)] text-[var(--navy)]"
                          : "bg-[#FDF1F0] border-[#F6CBC8] text-[#A62626]"
                      }`}
                    >
                      {p.fields.floor ? (
                        <Check className="w-3.5 h-3.5 text-[#1E6B43]" />
                      ) : (
                        <X className="w-3.5 h-3.5" />
                      )}
                      <span className="text-[11px] font-medium">رقم الدور</span>
                    </div>

                    <div
                      className={`p-2 rounded-xl border flex items-center gap-1.5 ${
                        p.fields.buildingAge
                          ? "bg-[var(--paper)] border-[var(--mist)] text-[var(--navy)]"
                          : "bg-[#FDF1F0] border-[#F6CBC8] text-[#A62626]"
                      }`}
                    >
                      {p.fields.buildingAge ? (
                        <Check className="w-3.5 h-3.5 text-[#1E6B43]" />
                      ) : (
                        <X className="w-3.5 h-3.5" />
                      )}
                      <span className="text-[11px] font-medium">عمر المبنى</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Blockers Section */}
      {blockersCount > 0 && (
        <section className="bg-[var(--paper)] rounded-[28px] border border-[#F6CBC8] p-6 sm:p-8 space-y-5 shadow-[0_20px_60px_rgba(15,26,43,0.04)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[var(--mist)]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#FDF1F0] text-[#A62626] flex items-center justify-center shrink-0 border border-[#F6CBC8]">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-display font-bold text-[var(--navy)]">
                  متطلبات يجب إكمالها ({blockersCount})
                </h2>
                <p className="text-xs text-[var(--dusty-blue)] mt-0.5">
                  هذه النقاط تعطل التحليل لضمان عدم بناء القرار على بيانات متناقضة أو ناقصة.
                </p>
              </div>
            </div>

            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#FDF1F0] text-[#A62626] text-xs font-medium border border-[#F6CBC8] self-start sm:self-auto">
              إلزامي للبدء
            </span>
          </div>

          <div className="space-y-3">
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
                actionText = "استكمال بيانات الشقة";
                ActionIcon = FileSearch;
              }

              return (
                <div
                  key={idx}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-[var(--cream)] rounded-2xl border border-[var(--mist)] hover:border-[var(--navy)] transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-[var(--paper)] border border-[var(--mist)] text-[var(--navy)] flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                      {idx + 1}
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-[var(--navy)]">
                        {blocker.messageAr}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[var(--paper)] text-[var(--dusty-blue)] border border-[var(--mist)]">
                          [{blocker.code}]
                        </span>
                        {blocker.field && (
                          <span className="text-[11px] text-[var(--dusty-blue)] font-mono">
                            حقل: {blocker.field}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {actionLink && (
                    <Link
                      href={actionLink}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full text-xs font-display font-medium text-[var(--navy)] bg-[var(--paper)] border border-[var(--mist)] hover:border-[var(--navy)] transition-all self-start sm:self-center shrink-0"
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
        <section className="bg-[var(--paper)] rounded-[28px] border border-[var(--mist)] p-6 sm:p-8 space-y-5 shadow-[0_20px_60px_rgba(15,26,43,0.04)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[var(--mist)]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#FFF9EC] text-[#9A6700] flex items-center justify-center shrink-0 border border-[#F9E2AF]">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-display font-bold text-[var(--navy)]">
                  تنبيهات وملاحظات ({warningsCount})
                </h2>
                <p className="text-xs text-[var(--dusty-blue)] mt-0.5">
                  هذه الملاحظات لا تمنع بدء التحليل، ولكن معالجتها ترفع من دقة وموثوقية تقرير القرار:
                </p>
              </div>
            </div>

            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#FFF9EC] text-[#9A6700] border border-[#F9E2AF] text-xs font-medium self-start sm:self-auto">
              تحسين جودة التقرير
            </span>
          </div>

          <div className="space-y-3">
            {evaluation.warnings.map((warning, idx) => (
              <div
                key={idx}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-[var(--cream)] rounded-2xl border border-[var(--mist)]"
              >
                <div className="flex items-start gap-3">
                  <span className="w-2 h-2 rounded-full bg-[#9A6700] shrink-0 mt-2" />
                  <div className="space-y-1">
                    <p className="text-xs sm:text-sm font-medium text-[var(--navy)]">
                      {warning.messageAr}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--paper)] text-[var(--dusty-blue)] border border-[var(--mist)]">
                        [{warning.code}]
                      </span>
                      {warning.field && (
                        <span className="text-[10px] text-[var(--dusty-blue)] font-mono">
                          حقل: {warning.field}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {warning.propertyId && (
                  <Link
                    href={`/case/${caseId}/properties/${warning.propertyId}`}
                    className="inline-flex items-center justify-center gap-1.5 text-xs font-display font-medium text-[var(--navy)] bg-[var(--paper)] hover:border-[var(--navy)] border border-[var(--mist)] px-3 py-1.5 rounded-full transition-all self-start sm:self-center shrink-0"
                  >
                    <span>استكمال بيانات الشقة ←</span>
                  </Link>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Ready Banner when no blockers and no warnings */}
      {evaluation.ready && warningsCount === 0 && (
        <div className="p-8 sm:p-10 bg-[#E9F4EE] rounded-[28px] border border-[#C5E4D4] text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-[var(--paper)] text-[#1E6B43] border border-[#C5E4D4] flex items-center justify-center shadow-xs">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="space-y-1.5 max-w-lg mx-auto">
            <h3 className="text-base sm:text-lg font-display font-bold text-[var(--navy)]">
              جميع متطلبات والشقق المرشحة مكتملة وجاهزة
            </h3>
            <p className="text-xs sm:text-sm text-[var(--dusty-blue)] leading-relaxed">
              تم استخراج وتأكيد الحقائق الأساسية ومطابقتها مع ميزانيتك وشروطك بنجاح. يمكنك الآن الانتقال لمرحلة التحليل الشامل.
            </p>
          </div>
        </div>
      )}

      {/* Session Summary: Buyer Profile */}
      <BuyerProfileSummary caseId={caseId} profile={profile ?? null} />

      {/* Three Pillars: Neutrality Assurance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[var(--paper)] rounded-2xl border border-[var(--mist)] p-5 space-y-2">
          <div className="w-8 h-8 rounded-xl bg-[var(--cream)] text-[var(--navy)] border border-[var(--mist)] flex items-center justify-center">
            <Scale className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-display font-bold text-[var(--navy)]">حياد استشاري قطعي 100%</h4>
          <p className="text-[11px] text-[var(--dusty-blue)] leading-relaxed">
            لا نأخذ عمولات من أي مطور أو وسيط عقاري؛ مستشارك يعمل لصالح قرارك المالي فقط.
          </p>
        </div>

        <div className="bg-[var(--paper)] rounded-2xl border border-[var(--mist)] p-5 space-y-2">
          <div className="w-8 h-8 rounded-xl bg-[var(--cream)] text-[var(--navy)] border border-[var(--mist)] flex items-center justify-center">
            <Layers className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-display font-bold text-[var(--navy)]">منع دمج أو متوسطات الأسعار</h4>
          <p className="text-[11px] text-[var(--dusty-blue)] leading-relaxed">
            في حال وجود اختلاف بين الإعلان والصك الفعلي، نلزمك بالاختيار أو التحقق ولا ندمج الأرقام أبداً.
          </p>
        </div>

        <div className="bg-[var(--paper)] rounded-2xl border border-[var(--mist)] p-5 space-y-2">
          <div className="w-8 h-8 rounded-xl bg-[var(--cream)] text-[var(--navy)] border border-[var(--mist)] flex items-center justify-center">
            <Shield className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-display font-bold text-[var(--navy)]">حماية الدفعة والتوريط البنكي</h4>
          <p className="text-[11px] text-[var(--dusty-blue)] leading-relaxed">
            نكشف تكاليف الصيانة الخفية وعيوب المخطط قبل دفع أي عربون أو توقيع عقد تمويل سكني.
          </p>
        </div>
      </div>

      {/* Actions and Start Analysis Footer Card */}
      <div className="bg-[var(--paper)] rounded-[28px] border border-[var(--mist)] p-5 sm:p-7 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-[0_20px_60px_rgba(15,26,43,0.04)]">
        <Link
          href={`/case/${caseId}/properties`}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-display font-medium text-[var(--dusty-blue)] hover:text-[var(--navy)] border border-[var(--mist)] hover:border-[var(--navy)] px-5 py-3 rounded-full transition-all order-2 sm:order-1 w-full sm:w-auto justify-center"
        >
          <ArrowRight className="w-4 h-4" />
          <span>العودة إلى قائمة العقارات</span>
        </Link>

        <div className="order-1 sm:order-2 w-full sm:w-auto">
          {isCaseReady ? (
            <Link
              href={isPaid ? `/case/${caseId}/results` : `/case/${caseId}/checkout`}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full text-sm font-display font-bold text-[var(--cream)] bg-[var(--navy)] hover:bg-[var(--midnight)] transition-all shadow-sm active:scale-[0.98] no-underline"
            >
              {isPaid ? (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>بدء التحليل والاستشارة ←</span>
                </>
              ) : (
                <>
                  <span>المتابعة إلى بدء التحليل ←</span>
                </>
              )}
            </Link>
          ) : (
            <button
              type="button"
              disabled
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full text-sm font-display font-medium text-[var(--dusty-blue)] bg-[var(--cream)] border border-[var(--mist)] cursor-not-allowed opacity-60"
            >
              <Lock className="w-4 h-4 text-[var(--dusty-blue)]" />
              <span>المتابعة إلى سداد رسوم الاستشارة (يلزم استكمال الجاهزية) ←</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

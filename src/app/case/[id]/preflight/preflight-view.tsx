import Link from "next/link";
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Lock,
  Building2,
  SlidersHorizontal,
  FileSearch,
  Sparkles,
  Scale,
  Shield,
  Layers,
} from "lucide-react";
import type {
  Issue,
  PreflightPropertyInput,
  PreflightResult,
} from "@/lib/preflight/evaluate";

interface PreflightViewProps {
  caseId: string;
  evaluation: PreflightResult;
  isPaid: boolean;
  propertyCount?: number;
  properties?: PreflightPropertyInput[];
}

const HUMAN_FIELD_LABELS: Record<string, string> = {
  listing_price_sar: "سعر العرض",
  area_sqm: "المساحة",
  bedrooms: "غرف النوم",
  bathrooms: "دورات المياه",
  floor_no: "رقم الدور",
  building_floors: "أدوار المبنى",
  property_age_years: "عمر العقار",
  elevator: "المصعد",
  private_parking: "الموقف الخاص",
  district: "الحي",
};

function formatCompactWarningChip(warning: Issue): {
  title: string;
  subtitle?: string;
} {
  const fieldLabel = warning.field
    ? HUMAN_FIELD_LABELS[warning.field] || warning.field
    : "";

  if (warning.code === "CONSTRAINT_UNVERIFIABLE") {
    const constraintMatch = warning.messageAr.match(/الشرط الأساسي \((.+?)\) غير قابل/);
    const constraintText = constraintMatch?.[1];
    return {
      title: fieldLabel ? `${fieldLabel} غير مذكور` : "شرط غير قابل للتحقق",
      subtitle: constraintText ? `شرط: ${constraintText}` : undefined,
    };
  }

  if (warning.code === "NON_CRITICAL_CONFLICT") {
    return {
      title: fieldLabel ? `تعارض في ${fieldLabel}` : "تعارض في البيانات",
      subtitle: "يُنصح بتأكيد القيمة",
    };
  }

  if (warning.code === "PRICE_UNKNOWN") {
    return { title: "سعر العرض غير مذكور" };
  }
  if (warning.code === "AREA_UNKNOWN") {
    return { title: "المساحة غير مذكورة" };
  }
  if (warning.code === "BEDROOMS_UNKNOWN") {
    return { title: "غرف النوم غير مذكورة" };
  }

  return { title: warning.messageAr };
}

function formatCompactBlockerChip(blocker: Issue): string {
  const fieldLabel = blocker.field
    ? HUMAN_FIELD_LABELS[blocker.field] || blocker.field
    : "";

  if (blocker.code === "CRITICAL_CONFLICT") {
    return fieldLabel
      ? `تعارض جوهري في ${fieldLabel} (يتطلب الاختيار)`
      : blocker.messageAr;
  }
  if (blocker.code === "EXTRACTION_RUNNING") {
    return "جاري استخراج بيانات العقار...";
  }
  if (blocker.code === "EXTRACTION_FAILED_NO_DATA") {
    return "تعذر استخراج البيانات آلياً (يلزم الإدخال اليدوي)";
  }
  if (blocker.code === "NOTHING_TO_ANALYZE") {
    return "لا تتوفر بيانات أساسية (السعر أو المساحة أو الغرف)";
  }
  return blocker.messageAr;
}

interface PropertyGroup {
  id: string;
  index: number;
  displayLabel: string;
  keyFacts: string[];
  blockers: Issue[];
  warnings: Issue[];
}

function buildPropertyGroups(
  evaluation: PreflightResult,
  properties?: PreflightPropertyInput[]
): PropertyGroup[] {
  if (properties && properties.length > 0) {
    // Check if multiple properties share the exact same raw label
    const labelCounts = new Map<string, number>();
    for (const p of properties) {
      labelCounts.set(p.label, (labelCounts.get(p.label) || 0) + 1);
    }

    return properties.map((prop, idx) => {
      const isDuplicateLabel = (labelCounts.get(prop.label) || 0) > 1;
      const alreadyNumbered = prop.label.includes(`#${idx + 1}`);
      const displayLabel =
        isDuplicateLabel && !alreadyNumbered
          ? `عقار #${idx + 1} • ${prop.label}`
          : prop.label;

      const keyFacts: string[] = [];
      const fields = prop.resolved?.fields;
      if (fields) {
        if (
          fields.listing_price_sar?.status === "known" &&
          fields.listing_price_sar.value != null
        ) {
          const num = Number(fields.listing_price_sar.value);
          if (!Number.isNaN(num)) {
            keyFacts.push(`${num.toLocaleString("en-US")} ر.س`);
          }
        }
        if (
          fields.area_sqm?.status === "known" &&
          fields.area_sqm.value != null
        ) {
          keyFacts.push(`${fields.area_sqm.value} م²`);
        }
        if (
          fields.bedrooms?.status === "known" &&
          fields.bedrooms.value != null
        ) {
          keyFacts.push(`${fields.bedrooms.value} غرف`);
        }
        if (
          fields.district?.status === "known" &&
          typeof fields.district.value === "string" &&
          fields.district.value.trim() &&
          !displayLabel.includes(fields.district.value.trim())
        ) {
          keyFacts.push(`حي ${fields.district.value.trim()}`);
        }
      }

      return {
        id: prop.id,
        index: idx + 1,
        displayLabel,
        keyFacts,
        blockers: evaluation.blockers.filter((b) => b.propertyId === prop.id),
        warnings: evaluation.warnings.filter((w) => w.propertyId === prop.id),
      };
    });
  }

  // Fallback when `properties` array is not passed: group by distinct propertyId in issues
  const groupsMap = new Map<string, PropertyGroup>();
  let counter = 1;

  for (const issue of [...evaluation.blockers, ...evaluation.warnings]) {
    if (!issue.propertyId) continue;
    if (!groupsMap.has(issue.propertyId)) {
      const labelMatch = issue.messageAr.match(/للعقار \((.+?)\)/);
      const extractedLabel = labelMatch?.[1] || "";
      const idx = counter++;
      const displayLabel =
        extractedLabel && !extractedLabel.includes(`#${idx}`)
          ? `عقار #${idx} • ${extractedLabel}`
          : extractedLabel || `عقار #${idx}`;

      groupsMap.set(issue.propertyId, {
        id: issue.propertyId,
        index: idx,
        displayLabel,
        keyFacts: [],
        blockers: [],
        warnings: [],
      });
    }
  }

  for (const b of evaluation.blockers) {
    if (b.propertyId && groupsMap.has(b.propertyId)) {
      groupsMap.get(b.propertyId)!.blockers.push(b);
    }
  }
  for (const w of evaluation.warnings) {
    if (w.propertyId && groupsMap.has(w.propertyId)) {
      groupsMap.get(w.propertyId)!.warnings.push(w);
    }
  }

  return Array.from(groupsMap.values());
}

export function PreflightView({
  caseId,
  evaluation,
  isPaid,
  propertyCount = 0,
  properties,
}: PreflightViewProps) {
  const blockersCount = evaluation.blockers.length;
  const warningsCount = evaluation.warnings.length;
  const globalBlockers = evaluation.blockers.filter((b) => !b.propertyId);
  const propertyGroups = buildPropertyGroups(evaluation, properties);
  const effectivePropertyCount =
    propertyCount > 0 ? propertyCount : propertyGroups.length;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      {/* 1. Unified Command & Readiness Header Card (Above the Fold) */}
      <div className="bg-[var(--paper)] rounded-[24px] border border-[var(--mist)] p-5 sm:p-6 space-y-4 shadow-[0_14px_40px_rgba(15,26,43,0.04)]">
        {/* Top Meta Bar: Phase + Readiness Badge */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--cream)] border border-[var(--mist)] text-[var(--dusty-blue)] text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--navy)]" />
            <span>المرحلة 3 من 4 • بوابة التدقيق الفني المسبق</span>
          </div>

          {evaluation.ready ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#E9F4EE] text-[#1E6B43] border border-[#C5E4D4]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#1E6B43]" />
              جاهز للتحليل
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#FDF1F0] text-[#A62626] border border-[#F6CBC8]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#A62626]" />
              يلزم إكمال {blockersCount} متطلب قبل التحليل
            </span>
          )}
        </div>

        {/* Main Command Row: Title + Primary CTA right at the top */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-display font-bold text-[var(--navy)] tracking-tight">
              الفحص المبدئي للحالة
            </h1>
            <p className="text-xs sm:text-sm text-[var(--dusty-blue)] max-w-xl leading-relaxed">
              فحص اكتمال بيانات العقارات ومطابقتها لشروطك قبل تشغيل خوارزميات التقييم والمقارنة.
            </p>
          </div>

          {/* Primary & Secondary Actions — Immediately Reachable Above the Fold */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Link
              href={`/case/${caseId}/properties`}
              className="inline-flex items-center justify-center gap-1.5 text-xs font-body font-bold text-[var(--dusty-blue)] hover:text-[var(--navy)] bg-[var(--cream)] hover:bg-[var(--paper)] border border-[var(--mist)] hover:border-[var(--navy)] px-4 py-2.5 rounded-full transition-all no-underline"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              <span>العقارات</span>
            </Link>

            {evaluation.ready ? (
              <Link
                href={isPaid ? `/case/${caseId}/results` : `/case/${caseId}/checkout`}
                className="btn-primary inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full text-sm font-body font-bold text-[var(--cream)] bg-[var(--navy)] hover:bg-[var(--midnight)] transition-all shadow-sm active:scale-[0.98] no-underline"
              >
                {isPaid ? (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>بدء التحليل ←</span>
                  </>
                ) : (
                  <span>المتابعة إلى الدفع (10 ر.س) ←</span>
                )}
              </Link>
            ) : (
              <button
                type="button"
                disabled
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-body font-bold text-[var(--dusty-blue)] bg-[var(--cream)] border border-[var(--mist)] cursor-not-allowed opacity-70"
              >
                <Lock className="w-3.5 h-3.5 text-[var(--dusty-blue)]" />
                <span>أكمل المتطلبات الإلزامية للمتابعة</span>
              </button>
            )}
          </div>
        </div>

        {/* Compact Inline KPI Strip */}
        <div className="grid grid-cols-3 gap-2.5 pt-3 border-t border-[var(--mist)]">
          <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[var(--cream)] border border-[var(--mist)]">
            <span className="text-[11px] font-medium text-[var(--dusty-blue)]">
              العقارات المرشحة
            </span>
            <div className="flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-[var(--navy)]" />
              <span className="text-sm sm:text-base font-body font-extrabold text-[var(--navy)] tabular-nums">
                {effectivePropertyCount > 0 ? effectivePropertyCount : "—"}
              </span>
            </div>
          </div>

          <div
            className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border ${
              blockersCount > 0
                ? "bg-[#FDF1F0] border-[#F6CBC8] text-[#A62626]"
                : "bg-[#E9F4EE] border-[#C5E4D4] text-[#1E6B43]"
            }`}
          >
            <span className="text-[11px] font-medium opacity-90">
              الموانع الإلزامية
            </span>
            <div className="flex items-center gap-1.5">
              {blockersCount > 0 ? (
                <ShieldAlert className="w-3.5 h-3.5 text-[#A62626]" />
              ) : (
                <ShieldCheck className="w-3.5 h-3.5 text-[#1E6B43]" />
              )}
              <span className="text-sm sm:text-base font-body font-extrabold tabular-nums">
                {blockersCount}
              </span>
            </div>
          </div>

          <div
            className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border ${
              warningsCount > 0
                ? "bg-[#FFF9EC] border-[#F9E2AF] text-[#9A6700]"
                : "bg-[var(--cream)] border-[var(--mist)] text-[var(--dusty-blue)]"
            }`}
          >
            <span className="text-[11px] font-medium opacity-90">
              ملاحظات استشارية
            </span>
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-[#9A6700]" />
              <span className="text-sm sm:text-base font-body font-extrabold tabular-nums text-[var(--navy)]">
                {warningsCount}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Global Case-Level Blockers (e.g., Missing Requirements or Zero Properties) */}
      {globalBlockers.length > 0 && (
        <section className="bg-[#FDF1F0] rounded-[20px] border border-[#F6CBC8] p-4 sm:p-5 space-y-2.5">
          {globalBlockers.map((blocker, idx) => {
            const isNeeds = blocker.code === "NO_REQUIREMENTS";
            const actionLink = isNeeds
              ? `/case/${caseId}/needs`
              : `/case/${caseId}/properties`;
            const actionText = isNeeds ? "تحديد الاحتياجات" : "إضافة عقارات";
            const ActionIcon = isNeeds ? SlidersHorizontal : Building2;

            return (
              <div
                key={idx}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[var(--paper)] p-3.5 rounded-xl border border-[#F6CBC8]"
              >
                <div className="flex items-center gap-2.5">
                  <ShieldAlert className="w-4 h-4 text-[#A62626] shrink-0" />
                  <span className="text-xs sm:text-sm font-bold text-[var(--navy)]">
                    {blocker.messageAr}
                  </span>
                </div>
                <Link
                  href={actionLink}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-body font-bold text-[#A62626] bg-[#FDF1F0] hover:bg-[#FCE4E2] border border-[#F6CBC8] transition-all self-start sm:self-center shrink-0 no-underline"
                >
                  <ActionIcon className="w-3.5 h-3.5" />
                  <span>{actionText} ←</span>
                </Link>
              </div>
            );
          })}
        </section>
      )}

      {/* 3. Grouped Property Readiness Matrix (Replaces N×M Unrolled Cards) */}
      {propertyGroups.length > 0 && (blockersCount > 0 || warningsCount > 0) && (
        <section className="bg-[var(--paper)] rounded-[24px] border border-[var(--mist)] p-5 sm:p-6 space-y-3.5 shadow-[0_14px_40px_rgba(15,26,43,0.04)]">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[var(--mist)]">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                  blockersCount > 0
                    ? "bg-[#FDF1F0] text-[#A62626] border-[#F6CBC8]"
                    : "bg-[#FFF9EC] text-[#9A6700] border-[#F9E2AF]"
                }`}
              >
                {blockersCount > 0 ? (
                  <ShieldAlert className="w-4 h-4" />
                ) : (
                  <AlertTriangle className="w-4 h-4" />
                )}
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-display font-bold text-[var(--navy)]">
                  ملخص جاهزية العقارات{" "}
                  <span className="font-body font-bold tabular-nums">({propertyGroups.length})</span>
                </h2>
                <p className="text-[11px] sm:text-xs text-[var(--dusty-blue)]">
                  {blockersCount > 0
                    ? "يرجى معالجة الموانع الإلزامية باللون الأحمر لتفعيل التحليل."
                    : "الملاحظات التالية اختيارية ولا تمنع بدء التحليل، لكن استكمالها يرفع دقة المقارنة."}
                </p>
              </div>
            </div>

            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${
                blockersCount > 0
                  ? "bg-[#FDF1F0] text-[#A62626] border-[#F6CBC8]"
                  : "bg-[#FFF9EC] text-[#9A6700] border-[#F9E2AF]"
              }`}
            >
              {blockersCount > 0 ? "يتطلب تدقيقاً إلزامياً" : "تحسين اختياري للدقة"}
            </span>
          </div>

          {/* Compact Property Rows */}
          <div className="space-y-2.5">
            {propertyGroups.map((group) => {
              const hasBlockers = group.blockers.length > 0;
              const hasWarnings = group.warnings.length > 0;

              return (
                <div
                  key={group.id}
                  className={`rounded-2xl p-3.5 sm:p-4 border transition-colors ${
                    hasBlockers
                      ? "bg-[#FDF1F0]/45 border-[#F6CBC8]"
                      : "bg-[var(--cream)] border-[var(--mist)] hover:border-[var(--navy)]/40"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Property Identity + Key Extracted Facts */}
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-[var(--paper)] border border-[var(--mist)] text-[var(--navy)] inline-flex items-center justify-center font-body font-bold tabular-nums text-xs shrink-0">
                          {group.index}
                        </span>
                        <span className="text-xs sm:text-sm font-body font-bold text-[var(--navy)] truncate">
                          {group.displayLabel}
                        </span>

                        {/* Known facts pills so user can distinguish properties immediately */}
                        {group.keyFacts.map((fact, fIdx) => (
                          <span
                            key={fIdx}
                            className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-[var(--paper)] text-[var(--navy)] border border-[var(--mist)] tabular-nums"
                          >
                            {fact}
                          </span>
                        ))}

                        {!hasBlockers && !hasWarnings && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#E9F4EE] text-[#1E6B43] border border-[#C5E4D4]">
                            <CheckCircle2 className="w-3 h-3" />
                            مكتمل البيانات
                          </span>
                        )}
                      </div>

                      {/* Mandatory Blockers Chips */}
                      {hasBlockers && (
                        <div className="flex flex-wrap items-center gap-1.5 pr-8">
                          <span className="text-[11px] font-bold text-[#A62626] ml-1">
                            موانع إلزامية:
                          </span>
                          {group.blockers.map((blocker, bIdx) => (
                            <span
                              key={bIdx}
                              title={blocker.messageAr}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#FDF1F0] text-[#A62626] border border-[#F6CBC8] text-[11px] font-medium"
                            >
                              <ShieldAlert className="w-3 h-3 shrink-0" />
                              <span>{formatCompactBlockerChip(blocker)}</span>
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Advisory Warnings Chips (Horizontal instead of stacked cards!) */}
                      {hasWarnings && (
                        <div className="flex flex-wrap items-center gap-1.5 pr-8">
                          <span className="text-[11px] font-medium text-[var(--dusty-blue)] ml-1">
                            نواقص الإعلان:
                          </span>
                          {group.warnings.map((warning, wIdx) => {
                            const chip = formatCompactWarningChip(warning);
                            return (
                              <span
                                key={wIdx}
                                title={warning.messageAr}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--paper)] text-[var(--navy)] border border-[#F9E2AF] text-[11px]"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-[#9A6700] shrink-0" />
                                <span className="font-semibold">{chip.title}</span>
                                {chip.subtitle && (
                                  <span className="text-[10px] text-[var(--dusty-blue)] hidden md:inline">
                                    ({chip.subtitle})
                                  </span>
                                )}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Single Action Button per Property */}
                    <Link
                      href={`/case/${caseId}/properties/${group.id}`}
                      className="inline-flex items-center justify-center gap-1.5 text-xs font-body font-bold text-[var(--navy)] bg-[var(--paper)] hover:bg-[var(--navy)] hover:text-[var(--cream)] border border-[var(--mist)] hover:border-[var(--navy)] px-3.5 py-2 rounded-full transition-all self-start sm:self-center shrink-0 no-underline"
                    >
                      <FileSearch className="w-3.5 h-3.5" />
                      <span>تدقيق العقار ←</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 4. All-Clear Ready Banner (When zero blockers and zero warnings) */}
      {evaluation.ready && warningsCount === 0 && (
        <div className="p-6 bg-[#E9F4EE] rounded-[24px] border border-[#C5E4D4] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[var(--paper)] text-[#1E6B43] border border-[#C5E4D4] flex items-center justify-center shrink-0 shadow-xs">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-body font-bold text-[var(--navy)]">
                جميع متطلبات وعقارات المقارنة مكتملة وجاهزة 100%
              </h3>
              <p className="text-xs text-[var(--dusty-blue)]">
                تم استخراج وتأكيد الحقائق الأساسية ومطابقتها مع ميزانيتك وشروطك بنجاح.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 5. Sleek Single-Line Trust Strip (Replaces 3 tall marketing cards) */}
      <div className="bg-[var(--paper)] rounded-2xl border border-[var(--mist)] px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-[11px] text-[var(--dusty-blue)]">
        <div className="flex items-center gap-2">
          <Scale className="w-3.5 h-3.5 text-[var(--navy)] shrink-0" />
          <span>
            <strong className="text-[var(--navy)] font-body font-bold">حياد استشاري 100%:</strong> بدون عمولات من أي مطور أو وسيط
          </span>
        </div>
        <span className="hidden sm:inline text-[var(--mist)]">•</span>
        <div className="flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-[var(--navy)] shrink-0" />
          <span>
            <strong className="text-[var(--navy)] font-body font-bold">منع دمج الأسعار:</strong> لا نعتمد متوسطات مضللة عند التعارض
          </span>
        </div>
        <span className="hidden sm:inline text-[var(--mist)]">•</span>
        <div className="flex items-center gap-2">
          <Shield className="w-3.5 h-3.5 text-[var(--navy)] shrink-0" />
          <span>
            <strong className="text-[var(--navy)] font-body font-bold">حماية الدفعة:</strong> كشف العيوب الخفية قبل العربون
          </span>
        </div>
      </div>
    </div>
  );
}


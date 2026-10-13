import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight, ClipboardCheck, Scale } from "lucide-react";
import { requireCase } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  getOrGenerateInspectionItems,
  getInspectionFindings,
  type InspectionItemRow,
} from "@/actions/inspection";
import { InspectionView } from "./inspection-view";
import { cn } from "@/lib/utils";

interface InspectionPageProps {
  params: { id: string };
  searchParams?: { propertyId?: string };
}

export default async function InspectionPage({
  params,
  searchParams,
}: InspectionPageProps) {
  // 1. Guard with RLS & verify case ownership
  await requireCase(params.id);

  // 2. Fetch properties for this case
  const supabase = createClient();
  const { data: properties } = await supabase
    .from("properties")
    .select("id, title, district, listing_price_sar, input_mode, source_url, notes")
    .eq("case_id", params.id)
    .order("created_at", { ascending: true });

  if (!properties || properties.length === 0) {
    redirect(`/case/${params.id}/properties/new`);
  }

  // 3. Determine active property (defaults to property #1 if omitted or invalid)
  const activeProperty =
    properties.find((p) => p.id === searchParams?.propertyId) || properties[0];

  // 4. Retrieve or generate inspection items (5–12 targeted items)
  const items: InspectionItemRow[] = await getOrGenerateInspectionItems(
    params.id,
    activeProperty.id
  );

  // 5. Fetch existing inspection findings recorded by user
  const findings = await getInspectionFindings(params.id, activeProperty.id);

  const highPriorityCount = items.filter((i) => i.priority === "high").length;

  function getPropertyLabel(
    p: {
      title?: string | null;
      district?: string | null;
      input_mode?: string | null;
      source_url?: string | null;
      notes?: string | null;
    },
    idx: number
  ) {
    if (p.title) return p.title;
    if (p.district) return `عقار ${p.district}`;
    if (p.input_mode === "url" && p.source_url) {
      try {
        return new URL(p.source_url).hostname;
      } catch {
        return `رابط إلكتروني #${idx + 1}`;
      }
    }
    return `عقار #${idx + 1}`;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 md:py-12 space-y-8" dir="rtl">
      {/* Top Navigation & Breadcrumbs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={`/case/${params.id}/results`}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200/80 px-4 py-2 rounded-xl transition-all shadow-xs"
        >
          <ArrowRight className="w-3.5 h-3.5" />
          <span>العودة إلى تقرير النتائج</span>
        </Link>

        {properties.length >= 2 && (
          <Link
            href={`/case/${params.id}/compare`}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-700 hover:text-blue-600 bg-white hover:bg-slate-50 border border-slate-200/80 px-4 py-2 rounded-xl transition-all shadow-xs"
          >
            <Scale className="w-3.5 h-3.5" />
            <span>مقارنة الخيارات</span>
            <span aria-hidden="true">←</span>
          </Link>
        )}
      </div>

      {/* Header card with architectural minimalism */}
      <div className="relative bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-4 overflow-hidden">
        {/* Subtle Ambient Background Light */}
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-blue-50/60 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-wrap items-center justify-between gap-3 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200/70 text-xs font-bold">
            <ClipboardCheck className="w-4 h-4 text-blue-600" />
            <span>قائمة المعاينة الميدانية</span>
          </div>

          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold bg-blue-50 text-blue-700 border border-blue-200/80 shadow-xs">
            {items.length} بنود فحص موصى بها
          </span>
        </div>

        <div className="space-y-1 relative z-10">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            فحص {getPropertyLabel(activeProperty, 0)}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
            قائمة عملية مستهدفة لتسجيل شواهدك الميدانية لكل بند (سليم / مشكلة / لم أتحقق)، للمساعدة في حسم
            النقاط غير المؤكدة قبل المضي في قرار الشراء.
          </p>
        </div>

        {highPriorityCount > 0 && (
          <div className="pt-2 flex items-center gap-2 text-xs font-bold text-rose-700 bg-rose-50/70 border border-rose-200/70 px-3.5 py-2 rounded-xl relative z-10">
            <span className="flex h-2 w-2 rounded-full bg-rose-500 animate-pulse shrink-0" />
            <span>يتضمن {highPriorityCount} نقاط عالية الأولوية يلزم حسمها أثناء الزيارة</span>
          </div>
        )}
      </div>

      {/* Property Switcher Tabs (if 2+ properties exist) */}
      {properties.length > 1 && (
        <div className="space-y-2.5">
          <label className="text-xs font-bold text-slate-500 block">
            اختر العقار لاستعراض وتسجيل قائمته:
          </label>
          <div
            className="flex items-center gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 no-scrollbar"
            role="tablist"
            aria-label="قوائم فحص العقارات"
          >
            {properties.map((prop, idx) => {
              const isActive = prop.id === activeProperty.id;
              const label = getPropertyLabel(prop, idx);
              return (
                <Link
                  key={prop.id}
                  href={`/case/${params.id}/inspection?propertyId=${prop.id}`}
                  role="tab"
                  aria-selected={isActive}
                  className={cn(
                    "px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold whitespace-nowrap transition-all shrink-0 flex items-center gap-2 border shadow-xs",
                    isActive
                      ? "bg-slate-900 text-white border-slate-900 shadow-md"
                      : "bg-white text-slate-700 hover:bg-slate-50 border-slate-200/80"
                  )}
                >
                  <span
                    className={cn(
                      "w-2 h-2 rounded-full",
                      isActive ? "bg-blue-400" : "bg-slate-300"
                    )}
                  />
                  <span>{label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Interactive Inspection View (Checklist items + Finding recording + Sticky bottom bar) */}
      <InspectionView
        caseId={params.id}
        propertyId={activeProperty.id}
        items={items}
        initialFindings={findings}
      />
    </div>
  );
}

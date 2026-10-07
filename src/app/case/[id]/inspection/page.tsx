import { redirect } from "next/navigation";
import Link from "next/link";
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8" dir="rtl">
      {/* Top Navigation & Breadcrumbs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={`/case/${params.id}/results`}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors"
        >
          <span aria-hidden="true">→</span>
          <span>العودة إلى تقرير النتائج</span>
        </Link>

        {properties.length >= 2 && (
          <Link
            href={`/case/${params.id}/compare`}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors"
          >
            <span>مقارنة الخيارات</span>
            <span aria-hidden="true">←</span>
          </Link>
        )}
      </div>

      {/* Header section */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-5 sm:p-7 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-200 border border-blue-400/30">
            🔍 قائمة المعاينة الميدانية
          </span>
          <span className="text-xs text-slate-300 font-medium">
            {items.length} بنود فحص موصى بها
          </span>
        </div>

        <h1 className="text-xl sm:text-2xl font-black text-white leading-tight">
          فحص {getPropertyLabel(activeProperty, 0)}
        </h1>

        <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
          قائمة عملية مستهدفة لتسجيل شواهدك الميدانية لكل بند (سليم / مشكلة / لم أتحقق)، للمساعدة في حسم
          النقاط غير المؤكدة قبل المضي في قرار الشراء.
        </p>

        {highPriorityCount > 0 && (
          <div className="pt-2 flex items-center gap-2 text-xs font-semibold text-rose-300">
            <span className="flex h-2 w-2 rounded-full bg-rose-400 animate-pulse" />
            <span>يتضمن {highPriorityCount} نقاط عالية الأولوية يلزم حسمها أثناء الزيارة</span>
          </div>
        )}
      </div>

      {/* Property Switcher Tabs (if 2+ properties exist) */}
      {properties.length > 1 && (
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-500 block">
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
                    "px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all shrink-0 flex items-center gap-2 border",
                    isActive
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                      : "bg-white text-gray-700 hover:bg-gray-50 border-gray-200"
                  )}
                >
                  <span
                    className={cn(
                      "w-2 h-2 rounded-full",
                      isActive ? "bg-white" : "bg-gray-300"
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

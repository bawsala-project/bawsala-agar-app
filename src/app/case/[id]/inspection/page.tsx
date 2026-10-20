import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight, ClipboardCheck, Scale } from "lucide-react";
import { requireCase } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getOrGenerateInspectionItems, type InspectionItemRow } from "@/actions/inspection";
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
  // 1. Guard with RLS
  await requireCase(params.id);

  const supabase = createClient();

  // 2. Fetch properties for this case
  const { data: properties, error: propErr } = await supabase
    .from("properties")
    .select("id, title, district, source_url, input_mode")
    .eq("case_id", params.id)
    .order("created_at", { ascending: true });

  if (propErr || !properties || properties.length === 0) {
    redirect(`/case/${params.id}/properties`);
  }

  // 3. Determine active property (fallback to first)
  const activePropertyId = searchParams?.propertyId || properties[0].id;
  const activeProperty =
    properties.find((p) => p.id === activePropertyId) || properties[0];

  // 4. Load or generate items for active property
  const items: InspectionItemRow[] = await getOrGenerateInspectionItems(params.id, activeProperty.id);

  // 5. Fetch existing findings for this property
  const { data: findings = [] } = await supabase
    .from("inspection_findings")
    .select("*")
    .eq("property_id", activeProperty.id);

  const highPriorityCount = items.filter((i) => i.priority === "high").length;

  function getPropertyLabel(
    p: {
      title?: string | null;
      district?: string | null;
      source_url?: string | null;
      input_mode?: string | null;
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 md:py-12 space-y-8 font-body text-[var(--navy)]" dir="rtl">
      {/* Top Navigation & Breadcrumbs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={`/case/${params.id}/results`}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-[var(--dusty-blue)] hover:text-[var(--navy)] bg-[var(--paper)] hover:border-[var(--navy)] border border-[var(--mist)] px-4 py-2 rounded-full transition-all shadow-xs"
        >
          <ArrowRight className="w-3.5 h-3.5" />
          <span>العودة إلى تقرير النتائج</span>
        </Link>

        {properties.length >= 2 && (
          <Link
            href={`/case/${params.id}/compare`}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-[var(--dusty-blue)] hover:text-[var(--navy)] bg-[var(--paper)] hover:border-[var(--navy)] border border-[var(--mist)] px-4 py-2 rounded-full transition-all shadow-xs"
          >
            <Scale className="w-3.5 h-3.5 text-[var(--navy)]" />
            <span>مقارنة الخيارات</span>
            <span aria-hidden="true">←</span>
          </Link>
        )}
      </div>

      {/* Header card with architectural minimalism */}
      <div className="bg-[var(--paper)] rounded-[28px] border border-[var(--mist)] shadow-[0_20px_60px_rgba(15,26,43,0.04)] p-6 sm:p-8 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--cream)] text-[var(--dusty-blue)] border border-[var(--mist)] text-xs font-medium">
            <ClipboardCheck className="w-3.5 h-3.5 text-[var(--navy)]" />
            <span>قائمة المعاينة الميدانية</span>
          </div>

          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[var(--cream)] text-[var(--navy)] border border-[var(--mist)] shadow-xs">
            {items.length} بنود معاينة داعمة للقرار
          </span>
        </div>

        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-[var(--navy)] tracking-tight">
            معاينة {getPropertyLabel(activeProperty, 0)}
          </h1>
          <p className="text-xs sm:text-sm text-[var(--dusty-blue)] max-w-2xl leading-relaxed">
            قائمة عملية مستهدفة لتسجيل شواهدك الميدانية لكل بند (سليم / مشكلة / لم أتحقق)، للمساعدة في حسم
            النقاط غير المؤكدة قبل المضي في قرار الشراء.
          </p>
        </div>

        {highPriorityCount > 0 && (
          <div className="pt-2 flex items-center gap-2 text-xs font-medium text-[#A62626] bg-[#FDF1F0] border border-[#F6CBC8] px-3.5 py-2 rounded-2xl">
            <span className="flex h-2 w-2 rounded-full bg-[#A62626] animate-pulse shrink-0" />
            <span>يتضمن {highPriorityCount} نقاط عالية الأولوية يلزم حسمها أثناء الزيارة</span>
          </div>
        )}
      </div>

      {/* Property Switcher Tabs (if 2+ properties exist) */}
      {properties.length > 1 && (
        <div className="space-y-2.5">
          <label className="text-xs font-medium text-[var(--dusty-blue)] block">
            اختر الشقة لاستعراض وتسجيل عناصر المعاينة الداعمة:
          </label>
          <div
            className="flex items-center gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 no-scrollbar"
            role="tablist"
            aria-label="قوائم معاينة الشقق الداعمة"
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
                    "px-4 py-2 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-all shrink-0 flex items-center gap-2 border shadow-xs",
                    isActive
                      ? "bg-[var(--navy)] text-[var(--cream)] border-[var(--navy)] shadow-sm"
                      : "bg-[var(--paper)] text-[var(--navy)] hover:border-[var(--navy)] border-[var(--mist)]"
                  )}
                >
                  <span
                    className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      isActive ? "bg-[var(--cream)]" : "bg-[var(--dusty-blue)]"
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
        initialFindings={findings || []}
      />
    </div>
  );
}

import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { requireCase } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getOrGenerateInspectionItems, type InspectionItemRow } from "@/actions/inspection";
import { InspectionView } from "./inspection-view";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

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
  const activeIdx = Math.max(
    0,
    properties.findIndex((p) => p.id === activePropertyId)
  );
  const activeProperty = properties[activeIdx] || properties[0];

  // 4. Load or generate items for active property
  const items: InspectionItemRow[] = await getOrGenerateInspectionItems(
    params.id,
    activeProperty.id
  );

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
    const cleanTitle = p.title?.trim();
    if (cleanTitle && cleanTitle !== "عقار بدون عنوان") return cleanTitle;
    if (p.district) return `عقار ${p.district} #${idx + 1}`;
    if (p.input_mode === "url" && p.source_url) {
      try {
        return `${new URL(p.source_url).hostname} #${idx + 1}`;
      } catch {
        return `رابط إلكتروني #${idx + 1}`;
      }
    }
    return `عقار #${idx + 1}`;
  }

  return (
    <div className="w-full space-y-5 font-body text-[var(--navy)]" dir="rtl">
      {/* Compact Editorial Header + Property Switcher directly on cream canvas */}
      <header className="space-y-3.5 pb-4 border-b border-[var(--mist)]/70">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs font-medium text-[var(--dusty-blue)]">
              {[
                "قائمة المعاينة الميدانية",
                `${items.length} بنود فحص`,
                highPriorityCount > 0 ? `${highPriorityCount} عاجل` : null,
              ]
                .filter(Boolean)
                .join("  ·  ")}
            </p>
            <h1 className="text-xl sm:text-2xl font-bold font-display text-[var(--navy)]">
              فحص {getPropertyLabel(activeProperty, activeIdx)}
            </h1>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-end shrink-0">
            <Link
              href={`/case/${params.id}/results`}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--dusty-blue)] hover:text-[var(--navy)] bg-[var(--paper)] hover:border-[var(--navy)] border border-[var(--mist)] px-3.5 py-2 rounded-xl transition-all"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              <span>العودة للنتائج</span>
            </Link>

            {properties.length >= 2 && (
              <Link
                href={`/case/${params.id}/compare`}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--navy)] bg-[var(--paper)] hover:border-[var(--navy)] border border-[var(--mist)] px-3.5 py-2 rounded-xl transition-all"
              >
                <span>مقارنة الخيارات</span>
                <span aria-hidden="true">←</span>
              </Link>
            )}
          </div>
        </div>

        {/* Property Switcher Tabs (if 2+ properties exist) */}
        {properties.length > 1 && (
          <div
            className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1"
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
                    "px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 border",
                    isActive
                      ? "bg-[var(--navy)] text-[var(--cream)] border-[var(--navy)]"
                      : "bg-[var(--paper)] text-[var(--dusty-blue)] hover:text-[var(--navy)] border-[var(--mist)]/80"
                  )}
                >
                  {label}
                </Link>
              );
            })}
          </div>
        )}
      </header>

      {/* Interactive Inspection Checklist (Category Filter + 2-Column Grid) */}
      <InspectionView
        caseId={params.id}
        propertyId={activeProperty.id}
        items={items}
        initialFindings={findings || []}
      />
    </div>
  );
}

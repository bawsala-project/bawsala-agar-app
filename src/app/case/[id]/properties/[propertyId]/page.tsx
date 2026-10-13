import { notFound } from "next/navigation";
import { requireCase } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { resolveFacts, PropertyFact } from "@/lib/evidence/resolve";
import { PropertyDetailsView } from "./property-details-view";

export default async function PropertyDetailPage({
  params,
}: {
  params: { id: string; propertyId: string };
}) {
  // Check case ownership via RLS client (throws notFound if not accessible)
  await requireCase(params.id);

  const supabase = createClient();

  // Load case city, property, and its facts in parallel
  const [{ data: caseData }, { data: property, error: propErr }, { data: facts }] =
    await Promise.all([
      supabase
        .from("decision_cases")
        .select("city")
        .eq("id", params.id)
        .maybeSingle(),
      supabase
        .from("properties")
        .select("*")
        .eq("id", params.propertyId)
        .eq("case_id", params.id)
        .maybeSingle(),
      supabase
        .from("property_facts")
        .select("*")
        .eq("property_id", params.propertyId)
        .order("created_at", { ascending: true }),
    ]);

  if (propErr || !property) {
    notFound();
  }

  const resolved = resolveFacts((facts as PropertyFact[]) || []);

  return (
    <PropertyDetailsView
      caseId={params.id}
      property={property}
      city={caseData?.city ?? null}
      facts={(facts as PropertyFact[]) || []}
      resolved={resolved}
    />
  );
}

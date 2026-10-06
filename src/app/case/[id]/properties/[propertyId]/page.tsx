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

  // Load the property; 404 if not found or not in this case
  const { data: property, error: propErr } = await supabase
    .from("properties")
    .select("*")
    .eq("id", params.propertyId)
    .eq("case_id", params.id)
    .maybeSingle();

  if (propErr || !property) {
    notFound();
  }

  // Load its facts
  const { data: facts } = await supabase
    .from("property_facts")
    .select("*")
    .eq("property_id", params.propertyId)
    .order("created_at", { ascending: true });

  const resolved = resolveFacts((facts as PropertyFact[]) || []);

  return (
    <PropertyDetailsView
      caseId={params.id}
      property={property}
      facts={(facts as PropertyFact[]) || []}
      resolved={resolved}
    />
  );
}

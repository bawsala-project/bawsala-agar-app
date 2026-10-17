import { createClient } from "@/lib/supabase/server";
import { NeedsForm } from "./needs-form";

export default async function NeedsPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: { typology?: string; intent?: string; title?: string };
}) {
  const supabase = createClient();

  const [{ data: requirements }, { data: caseData }] = await Promise.all([
    supabase
      .from("requirements")
      .select("*")
      .eq("case_id", params.id)
      .maybeSingle(),
    supabase
      .from("decision_cases")
      .select("city")
      .eq("id", params.id)
      .maybeSingle(),
  ]);

  return (
    <NeedsForm
      caseId={params.id}
      initialData={requirements}
      city={caseData?.city ?? null}
      initialContext={{
        typology: searchParams?.typology,
        intent: searchParams?.intent,
        title: searchParams?.title,
      }}
    />
  );
}

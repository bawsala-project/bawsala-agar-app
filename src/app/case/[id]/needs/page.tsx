import { createClient } from "@/lib/supabase/server";
import { NeedsForm } from "./needs-form";

export default async function NeedsPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const { data: requirements } = await supabase
    .from("requirements")
    .select("*")
    .eq("case_id", params.id)
    .maybeSingle();

  return <NeedsForm caseId={params.id} initialData={requirements} />;
}

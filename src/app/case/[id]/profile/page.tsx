import { requireCase } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { loadBuyerProfile } from "@/actions/buyer-profile";
import { BuyerProfileForm } from "./buyer-profile-form";

export const maxDuration = 60;

export default async function ProfilePage({
  params,
}: {
  params: { id: string };
}) {
  await requireCase(params.id);

  const supabase = createClient();
  const [{ data: caseData }, initialProfile] = await Promise.all([
    supabase
      .from("decision_cases")
      .select("city")
      .eq("id", params.id)
      .maybeSingle(),
    loadBuyerProfile(params.id),
  ]);

  return (
    <BuyerProfileForm
      caseId={params.id}
      initialProfile={initialProfile}
      city={caseData?.city || null}
    />
  );
}

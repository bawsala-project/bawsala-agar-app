import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createSignedImageUrls } from "@/lib/storage";
import { loadBuyerProfile } from "@/actions/buyer-profile";
import { PropertiesView } from "./properties-view";

export const maxDuration = 60;

export default async function PropertiesPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  // Guard: if requirements do not exist for the case, redirect from /properties to /profile
  const { data: requirements } = await supabase
    .from("requirements")
    .select("case_id")
    .eq("case_id", params.id)
    .maybeSingle();

  if (!requirements) {
    redirect(`/case/${params.id}/profile`);
  }

  // Fetch case city, buyer profile, and properties with latest extraction runs and extracted facts
  const [{ data: caseData }, profile, { data: properties }] = await Promise.all([
    supabase
      .from("decision_cases")
      .select("city")
      .eq("id", params.id)
      .maybeSingle(),
    loadBuyerProfile(params.id),
    supabase
      .from("properties")
      .select(`
        *,
        extraction_runs (
          id,
          status,
          error_code,
          started_at,
          finished_at
        ),
        property_facts (*)
      `)
      .eq("case_id", params.id)
      .order("created_at", { ascending: true }),
  ]);

  // Get current user ID for direct client upload paths
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user?.id || "";

  // Generate signed URLs for image thumbnails
  const thumbnailPaths: string[] = [];
  properties?.forEach((p) => {
    if (p.image_paths && p.image_paths.length > 0) {
      thumbnailPaths.push(p.image_paths[0]);
    }
  });

  const signedThumbnails = await createSignedImageUrls(supabase, thumbnailPaths);

  return (
    <PropertiesView
      caseId={params.id}
      userId={userId}
      city={caseData?.city ?? null}
      properties={properties || []}
      signedThumbnails={signedThumbnails}
      profile={profile}
    />
  );
}

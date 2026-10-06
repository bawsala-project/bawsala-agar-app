import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createSignedImageUrls } from "@/lib/storage";
import { PropertiesView } from "./properties-view";

export const maxDuration = 60;

export default async function PropertiesPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  // Guard: if requirements do not exist for the case, redirect from /properties to /needs
  const { data: requirements } = await supabase
    .from("requirements")
    .select("case_id")
    .eq("case_id", params.id)
    .maybeSingle();

  if (!requirements) {
    redirect(`/case/${params.id}/needs`);
  }

  // Fetch properties with latest extraction runs and extracted facts
  const { data: properties } = await supabase
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
    .order("created_at", { ascending: true });

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
      properties={properties || []}
      signedThumbnails={signedThumbnails}
    />
  );
}

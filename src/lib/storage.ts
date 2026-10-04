import type { SupabaseClient } from "@supabase/supabase-js";

export const PROPERTY_IMAGES_BUCKET = "property-images";
export const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024; // 8 MB

export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

export function validateImageFile(file: File): { valid: true } | { valid: false; error: string } {
  const isAllowedType = ALLOWED_MIME_TYPES.includes(file.type as AllowedMimeType);
  const extension = file.name.split(".").pop()?.toLowerCase();
  const isAllowedExt =
    extension === "jpg" ||
    extension === "jpeg" ||
    extension === "png" ||
    extension === "webp";

  if (!isAllowedType || !isAllowedExt) {
    return {
      valid: false,
      error: "نوع الملف غير مدعوم، يرجى اختيار صورة بصيغة JPEG أو PNG أو WebP",
    };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: "حجم الصورة يتجاوز الحد الأقصى المسموح به (8 ميجابايت)",
    };
  }

  return { valid: true };
}

export async function uploadPropertyImage(
  supabase: SupabaseClient,
  userId: string,
  caseId: string,
  file: File
): Promise<{ path: string } | { error: string }> {
  const validation = validateImageFile(file);
  if (!validation.valid) {
    return { error: validation.error };
  }

  let ext = "jpg";
  if (file.type === "image/png") ext = "png";
  else if (file.type === "image/webp") ext = "webp";

  const fileId = crypto.randomUUID();
  const path = `${userId}/${caseId}/${fileId}.${ext}`;

  const { error } = await supabase.storage
    .from(PROPERTY_IMAGES_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });

  if (error) {
    return { error: error.message };
  }

  return { path };
}

export async function createSignedImageUrls(
  supabase: SupabaseClient,
  paths: string[],
  expiresInSeconds: number = 3600
): Promise<Record<string, string>> {
  if (!paths.length) return {};

  const { data, error } = await supabase.storage
    .from(PROPERTY_IMAGES_BUCKET)
    .createSignedUrls(paths, expiresInSeconds);

  if (error || !data) return {};

  const result: Record<string, string> = {};
  for (const item of data) {
    if (item.signedUrl && item.path) {
      result[item.path] = item.signedUrl;
    }
  }
  return result;
}

export async function deletePropertyImages(
  supabase: SupabaseClient,
  paths: string[]
): Promise<void> {
  if (!paths.length) return;
  await supabase.storage.from(PROPERTY_IMAGES_BUCKET).remove(paths);
}

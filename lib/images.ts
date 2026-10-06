/**
 * BAWSALA Property Images Manifest
 * Part B1 of 2
 *
 * An array of { file, kind, propertyId, alt } for every image saved so far.
 * Part B2 will append additional property images.
 */

export type ImageKind = 
  | "exterior" 
  | "living" 
  | "kitchen" 
  | "bedroom" 
  | "balcony" 
  | "map" 
  | "hero";

export interface PropertyImageManifestItem {
  file: string;
  kind: ImageKind;
  propertyId: string;
  alt: string;
}

export const PROPERTY_IMAGES_MANIFEST: PropertyImageManifestItem[] = [
  {
    file: "p1-exterior.jpg",
    kind: "exterior",
    propertyId: "p1",
    alt: "الواجهة المعمارية الخارجية لمبنى شقة حي الياسمين مع النخيل والمشربيات الخشبية",
  },
  {
    file: "p1-living.jpg",
    kind: "living",
    propertyId: "p1",
    alt: "صالة المعيشة الواسعة في شقة الياسمين بسقف مضاعف الارتفاع ونوافذ زجاجية ممتدة",
  },
  {
    file: "p1-kitchen.jpg",
    kind: "kitchen",
    propertyId: "p1",
    alt: "المطبخ المفتوح الفاخر في شقة الياسمين مع جزيرة وسطية وإطلالة على الفناء الخارجي",
  },
  {
    file: "p2-exterior.jpg",
    kind: "exterior",
    propertyId: "p2",
    alt: "الواجهة الخارجية الحديثة لبرج الملقا السكني الزجاجي مع الشرفات المضيئة والبهو المائي",
  },
  {
    file: "p2-living.jpg",
    kind: "living",
    propertyId: "p2",
    alt: "صالة شقة الملقا المرتفعة بنوافذ بانورامية مطلة على أفق مدينة الرياض",
  },
  {
    file: "p2-balcony.jpg",
    kind: "balcony",
    propertyId: "p2",
    alt: "شرفة شقة الملقا الفاخرة المطلة على غروب الرياض مع المشربيات الذهبية وجلسة مدمجة",
  },
  {
    file: "p3-exterior.jpg",
    kind: "exterior",
    propertyId: "p3",
    alt: "الواجهة المعمارية الحديثة لمبنى شقة حي النرجس مع المشربيات المنزلقة والحدائق الصحراوية",
  },
  {
    file: "p3-living.jpg",
    kind: "living",
    propertyId: "p3",
    alt: "صالة المعيشة الأنيقة في شقة النرجس بألوان رملية وأرفف خشبية مدمجة وشجرة زيتون",
  },
  {
    file: "p3-bedroom.jpg",
    kind: "bedroom",
    propertyId: "p3",
    alt: "غرفة النوم الرئيسية الدافئة في شقة النرجس مع خزانة عرض خشبية وإضاءة محيطية هادئة",
  },
];

/**
 * Returns the public URL path for a given image filename.
 */
export function getImageUrl(filename: string): string {
  if (!filename) return "";
  if (filename.startsWith("/") || filename.startsWith("http")) return filename;
  return `/images/${filename}`;
}

/**
 * Returns all manifest images belonging to a specific property.
 */
export function getImagesForProperty(propertyId: string): PropertyImageManifestItem[] {
  return PROPERTY_IMAGES_MANIFEST.filter((item) => item.propertyId === propertyId);
}

/**
 * Returns the primary cover image for a property (first image in the manifest list).
 */
export function getCoverImageForProperty(propertyId: string): PropertyImageManifestItem | undefined {
  const list = getImagesForProperty(propertyId);
  return list[0];
}

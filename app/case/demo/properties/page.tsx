"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Link2,
  Camera,
  PenLine,
  Trash2,
  Bookmark,
  Share2,
  CheckCircle2,
} from "lucide-react";
import { CircleButton } from "@/components/ui/CircleButton";
import { PhotoCard } from "@/components/ui/PhotoCard";
import { ChipsRow } from "@/components/ui/ChipsRow";
import { ActionBar } from "@/components/ui/ActionBar";
import { GlassSheet } from "@/components/ui/GlassSheet";
import { GlassPill } from "@/components/ui/GlassPill";
import { useAppStore } from "@/lib/store";
import { COPY } from "@/lib/copy";

const PROPERTY_IMAGES: Record<string, string> = {
  p1: "/images/p1-exterior.jpg",
  p2: "/images/p2-exterior.jpg",
  p3: "/images/p3-exterior.jpg",
};

export default function PropertiesPage() {
  const router = useRouter();
  const { properties, addProperty, removeProperty } = useAppStore();

  const [activeAddMethod, setActiveAddMethod] = useState<string | undefined>();
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [manualTitle, setManualTitle] = useState("");
  const [manualPrice, setManualPrice] = useState("850000");

  const ADD_CHIPS = [
    { id: "link", label: "رابط", icon: <Link2 className="w-4 h-4" /> },
    { id: "photo", label: "صورة", icon: <Camera className="w-4 h-4" /> },
    { id: "manual", label: "يدوي", icon: <PenLine className="w-4 h-4" /> },
  ];

  const handleSelectAddMethod = (id: string) => {
    setActiveAddMethod(id);
    setIsAddSheetOpen(true);
  };

  const handleAddSubmit = () => {
    addProperty({
      title: manualTitle || `شقة في حي المروج (${properties.length + 1})`,
      price: Number(manualPrice) || 850000,
      formattedPrice: `${Number(manualPrice || 850000).toLocaleString("ar-SA")} ر.س`,
      areaM2: 145,
      rooms: 3,
      district: "المروج، شمال الرياض",
      source: (activeAddMethod === "link" ? "link" : activeAddMethod === "photo" ? "screenshot" : "manual") as "link" | "screenshot" | "manual",
      sourceLabel: activeAddMethod === "link" ? "رابط معلن" : activeAddMethod === "photo" ? "لقطة شاشة" : "إدخال يدوي",
    });
    setIsAddSheetOpen(false);
    setManualTitle("");
  };

  return (
    <div
      className="relative w-full min-h-screen bg-espresso text-sandstone flex flex-col justify-between select-none bg-radial-lift"
      dir="rtl"
    >
      {/* Main Content Area (Max 1 title, 2 sections, 1 primary action) */}
      <div className="w-full max-w-[420px] mx-auto px-5 pt-[calc(20px+var(--safe-top))] pb-[calc(100px+var(--safe-bottom))] flex-1 flex flex-col justify-between">
        <div className="space-y-6">
          {/* Header Row: CircleButton back + Step counter */}
          <div className="flex items-center justify-between">
            <CircleButton
              icon={<ArrowRight className="w-5 h-5 text-sandstone" />}
              ariaLabel="الرجوع للخلف"
              onClick={() => router.back()}
              variant="glass"
            />
            <span className="text-[13px] font-medium text-muted">
              خطوة <bdi dir="ltr">2</bdi> من <bdi dir="ltr">5</bdi> • <bdi dir="ltr">{properties.length}</bdi> عقارات
            </span>
          </div>

          {/* Huge Title: "عقاراتك" */}
          <h1 className="text-[40px] md:text-[48px] font-light text-ink leading-[1.15] tracking-normal">
            عقاراتك
          </h1>

          {/* Section 1: PhotoCard carousel with peeking sides */}
          <div className="space-y-2">
            <span className="text-[13px] font-medium text-muted px-1 block">
              العقارات المضافة للمقارنة
            </span>

            {/* Horizontal Snap Carousel with Peeking Sides */}
            <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-none -mx-5 px-5 py-1">
              {properties.map((property) => {
                const imageSrc = PROPERTY_IMAGES[property.id] || "/images/hero-home.jpg";
                const chips = [
                  property.formattedPrice,
                  `${property.areaM2} م²`,
                  `${property.rooms} غرف`,
                ];

                return (
                  <div
                    key={property.id}
                    className="w-[84vw] max-w-[340px] shrink-0 snap-center"
                  >
                    <PhotoCard
                      imageSrc={imageSrc}
                      imageAlt={property.title}
                      title={property.title}
                      subtitle={property.district}
                      topChipLabel={property.sourceLabel}
                      topChipIcon={<CheckCircle2 className="w-3.5 h-3.5 text-sandstone" />}
                      chips={chips}
                      pillLabel="عرض التفاصيل"
                      onPillAction={() => router.push(`/case/demo/property/${property.id}`)}
                      circleActions={
                        properties.length > 1
                          ? [
                              {
                                icon: <Trash2 className="w-4 h-4 text-copper" />,
                                ariaLabel: "حذف العقار",
                                onClick: () => removeProperty(property.id),
                              },
                            ]
                          : []
                      }
                      height={400}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: ChipsRow to add (رابط، صورة، يدوي) */}
          <div className="space-y-2 pt-1">
            <span className="text-[13px] font-medium text-muted px-1 block">
              إضافة عقار جديد
            </span>
            <ChipsRow
              chips={ADD_CHIPS}
              selectedId={activeAddMethod}
              onChange={handleSelectAddMethod}
            />
          </div>
        </div>
      </div>

      {/* Pinned Bottom ActionBar */}
      <ActionBar
        primaryLabel={COPY.properties.cta || "فحص الجاهزية"}
        onPrimaryAction={() => router.push("/case/demo/preflight")}
        startIcon={<Bookmark className="w-5 h-5 text-sandstone" />}
        startAriaLabel="حفظ"
        endIcon={<Share2 className="w-5 h-5 text-sandstone" />}
        endAriaLabel="مشاركة"
        primaryVariant="sandstone"
        pinned={true}
      />

      {/* GlassSheet for Adding Property */}
      <GlassSheet
        isOpen={isAddSheetOpen}
        onClose={() => setIsAddSheetOpen(false)}
        title="إضافة عقار للمقارنة"
        subtitle={
          activeAddMethod === "link"
            ? "ألصق رابط الإعلان من تطبيق عقار أو غيره"
            : activeAddMethod === "photo"
            ? "ارفع لقطة شاشة لمواصفات العقار"
            : "اكتب مواصفات العقار يدوياً"
        }
        initialSnap="half"
        variant="dark"
      >
        <div className="space-y-4 pt-2">
          {activeAddMethod === "link" && (
            <div className="space-y-3">
              <label className="text-[13px] text-muted block">
                رابط العقار:
              </label>
              <input
                type="url"
                placeholder="https://sa.aqar.fm/ad/..."
                className="w-full h-12 px-4 rounded-[18px] bg-surface-2 border border-stroke text-sandstone text-[15px] placeholder:text-muted/40 focus:outline-none focus:border-sandstone/30"
              />
              <p className="text-[12px] text-muted">
                سيتم استخراج السعر والمساحة والحي وصور العقار تلقائياً.
              </p>
            </div>
          )}

          {activeAddMethod === "photo" && (
            <div className="space-y-3">
              <div className="border border-dashed border-stroke rounded-[20px] p-6 flex flex-col items-center justify-center gap-2 text-center bg-surface-2/50 hover:bg-surface-2 cursor-pointer transition-all">
                <Camera className="w-8 h-8 text-muted" />
                <span className="text-[14px] font-medium text-sandstone">
                  انقر لرفع لقطة الشاشة
                </span>
                <span className="text-[12px] text-muted">
                  يدعم صور JPG و PNG
                </span>
              </div>
            </div>
          )}

          {activeAddMethod === "manual" && (
            <div className="space-y-3">
              <div>
                <label className="text-[13px] text-muted block mb-1">
                  اسم العقار أو الوصف:
                </label>
                <input
                  type="text"
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  placeholder="مثال: شقة حي المروج"
                  className="w-full h-12 px-4 rounded-[18px] bg-surface-2 border border-stroke text-sandstone text-[15px] placeholder:text-muted/40 focus:outline-none focus:border-sandstone/30"
                />
              </div>

              <div>
                <label className="text-[13px] text-muted block mb-1">
                  السعر (ر.س):
                </label>
                <input
                  type="number"
                  value={manualPrice}
                  onChange={(e) => setManualPrice(e.target.value)}
                  className="w-full h-12 px-4 rounded-[18px] bg-surface-2 border border-stroke text-sandstone text-[15px] tabular-nums focus:outline-none focus:border-sandstone/30"
                />
              </div>
            </div>
          )}

          <div className="pt-2">
            <GlassPill
              label="تأكيد وإضافة العقار"
              size="48"
              variant="sandstone"
              fullWidth
              onClick={handleAddSubmit}
            />
          </div>
        </div>
      </GlassSheet>
    </div>
  );
}

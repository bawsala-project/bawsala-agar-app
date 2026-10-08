"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowRight,
  MapPin,
  Share2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
} from "lucide-react";
import { CircleButton } from "@/components/ui/CircleButton";
import { StatCard } from "@/components/ui/StatCard";
import { ChipsRow } from "@/components/ui/ChipsRow";
import { WideCard } from "@/components/ui/WideCard";
import { MapView } from "@/components/ui/MapView";
import { ActionBar } from "@/components/ui/ActionBar";
import { useAppStore } from "@/lib/store";
import { formatNumber } from "@/lib/format";

const PROPERTY_IMAGES: Record<string, string> = {
  p1: "/images/p1-exterior.jpg",
  p2: "/images/p2-exterior.jpg",
  p3: "/images/p3-exterior.jpg",
};

const DETAIL_CHIPS = [
  { id: "fit", label: "الملاءمة" },
  { id: "price", label: "السعر" },
  { id: "lifestyle", label: "الحياة" },
  { id: "risks", label: "المخاطر" },
  { id: "location", label: "الموقع" },
];

export default function PropertyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const propertyId = (params?.id as string) || "p1";

  const {
    properties,
    selectedForVisit,
    toggleSelectForVisit,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState("fit");

  const property = properties.find((p) => p.id === propertyId) || properties[0];
  const isSelected = selectedForVisit.includes(property.id);
  const heroImage = PROPERTY_IMAGES[property.id] || "/images/hero-home.jpg";

  // Map active tab to reason category
  const categoryMap: Record<string, string> = {
    fit: "الملاءمة",
    price: "السعر",
    lifestyle: "الحياة اليومية",
    risks: "المخاطر",
  };

  const matchedReason = property.whyReasons.find(
    (r) => r.category === categoryMap[activeTab]
  ) || property.whyReasons[0];

  return (
    <div
      className="relative w-full min-h-screen bg-espresso text-sandstone flex flex-col justify-between select-none"
      dir="rtl"
    >
      {/* 1. Full-Bleed Hero Photo with Huge Title Over It */}
      <div className="relative w-full h-[380px] shrink-0 overflow-hidden">
        <Image
          src={heroImage}
          alt={property.title}
          fill
          priority
          sizes="100vw"
          className="object-cover object-center photo-grade"
        />

        {/* Espresso Scrim Overlay */}
        <div className="absolute inset-0 scrim-warm" />

        {/* Back Button */}
        <div className="absolute top-[calc(20px+var(--safe-top))] inset-s-5 z-20">
          <CircleButton
            icon={<ArrowRight className="w-5 h-5 text-sandstone" />}
            ariaLabel="الرجوع للخلف"
            onClick={() => router.back()}
            variant="glass"
          />
        </div>

        {/* Huge Title over photo */}
        <div className="absolute bottom-6 inset-x-5 z-20 flex flex-col gap-1 max-w-[420px] mx-auto">
          <span className="text-[13px] font-medium text-muted px-0.5">
            {property.district}
          </span>
          <h1 className="text-[36px] md:text-[44px] font-light text-ink leading-[1.15] tracking-normal drop-shadow-md">
            {property.title}
          </h1>
        </div>
      </div>

      {/* 2. Dark Panel with 2x2 grid of StatCards & ChipsRow switching WideCard or MapView */}
      <div className="relative z-10 w-full max-w-[420px] mx-auto px-5 pb-[calc(100px+var(--safe-bottom))] -mt-3 flex-1 flex flex-col gap-5">
        <div className="p-5 rounded-[32px] bg-surface-1 border border-stroke space-y-4 shadow-xl">
          {/* 2x2 Grid of StatCards (السعر، المساحة، الغرف، الوقت للعمل) */}
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              label="السعر"
              value={formatNumber(Math.round(property.price / 1000))}
              unit="ألف ر.س"
            />
            <StatCard
              label="المساحة"
              value={property.areaM2}
              unit="م²"
            />
            <StatCard
              label="الغرف"
              value={property.rooms}
              unit="غرف نوم"
            />
            <StatCard
              label="الوقت للعمل"
              value={property.travelTimeWorkMin}
              unit="دقيقة"
            />
          </div>

          {/* ChipsRow (الملاءمة، السعر، الحياة، المخاطر، الموقع) */}
          <div className="pt-2 border-t border-stroke space-y-3">
            <ChipsRow
              chips={DETAIL_CHIPS}
              selectedId={activeTab}
              onChange={setActiveTab}
            />

            {/* When not "location": One WideCard section */}
            {activeTab !== "location" ? (
              <WideCard
                title={matchedReason.title}
                subtitle={matchedReason.description}
                icon={
                  activeTab === "risks" ? (
                    <AlertTriangle className="w-5 h-5 text-copper" />
                  ) : activeTab === "fit" ? (
                    <Sparkles className="w-5 h-5 text-sandstone" />
                  ) : activeTab === "price" ? (
                    <CheckCircle2 className="w-5 h-5 text-sandstone" />
                  ) : (
                    <Clock className="w-5 h-5 text-sandstone" />
                  )
                }
              />
            ) : (
              /* A "الموقع" chip shows the MapView */
              <div className="rounded-[28px] overflow-hidden border border-stroke">
                <MapView
                  variant="mini"
                  properties={[property]}
                  selectedPropertyId={property.id}
                  height={170}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pinned Bottom ActionBar [map circle] [pill "اختر للمعاينة"] */}
      <ActionBar
        primaryLabel={isSelected ? "مُحدد للمعاينة" : "اختر للمعاينة"}
        onPrimaryAction={() => toggleSelectForVisit(property.id)}
        startIcon={<MapPin className="w-5 h-5 text-sandstone" />}
        startAriaLabel="عرض الموقع"
        onStartAction={() => setActiveTab("location")}
        endIcon={<Share2 className="w-5 h-5 text-sandstone" />}
        endAriaLabel="مشاركة"
        primaryVariant={isSelected ? "glass" : "sandstone"}
        pinned={true}
      />
    </div>
  );
}

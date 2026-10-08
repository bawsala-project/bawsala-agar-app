"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Minus,
  RotateCcw,
  Briefcase,
  ExternalLink,
  X,
  Compass,
} from "lucide-react";
import { INITIAL_PROPERTIES, PropertyItem } from "@/lib/seed";
import Link from "next/link";

export interface MapViewProps {
  variant?: "mini" | "full";
  selectedPropertyId?: string | null;
  onSelectProperty?: (propertyId: string) => void;
  className?: string;
  properties?: PropertyItem[];
  height?: number | string;
}

interface PinCoord {
  id: string;
  x: number;
  y: number;
  label: string;
  district: string;
  commuteMin: number;
}

const PIN_COORDINATES: Record<string, PinCoord> = {
  p1: {
    id: "p1",
    x: 430,
    y: 190,
    label: "حي الياسمين",
    district: "شمال الرياض",
    commuteMin: 15,
  },
  p2: {
    id: "p2",
    x: 230,
    y: 220,
    label: "حي الملقا",
    district: "شمال الرياض",
    commuteMin: 18,
  },
  p3: {
    id: "p3",
    x: 590,
    y: 200,
    label: "حي النرجس",
    district: "شمال الرياض",
    commuteMin: 21,
  },
};

const WORK_COORDINATE = {
  x: 390,
  y: 440,
  label: "مقر العمل (مركز الملك عبد الله المالي)",
};

export function MapView({
  variant = "full",
  selectedPropertyId: controlledSelectedId,
  onSelectProperty,
  className = "",
  properties = INITIAL_PROPERTIES,
  height,
}: MapViewProps) {
  const isMini = variant === "mini";
  const [internalSelectedId, setInternalSelectedId] = useState<string | null>(
    controlledSelectedId || (isMini ? null : "p1")
  );

  const selectedId = controlledSelectedId !== undefined ? controlledSelectedId : internalSelectedId;
  const activeProperty = properties.find((p) => p.id === selectedId);

  const [zoom, setZoom] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  const handlePinClick = (propertyId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (isMini) return;
    setInternalSelectedId(propertyId);
    onSelectProperty?.(propertyId);
  };

  const handleZoomIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoom((prev) => Math.min(prev + 0.25, 2.2));
  };

  const handleZoomOut = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoom((prev) => Math.max(prev - 0.25, 0.75));
  };

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoom(1);
  };

  const defaultHeight = isMini ? 160 : 380;
  const containerHeight = height !== undefined ? height : defaultHeight;

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden select-none bg-espresso border border-stroke ${
        isMini ? "rounded-[24px]" : "rounded-[28px] shadow-lg"
      } ${className}`}
      style={{ height: typeof containerHeight === "number" ? `${containerHeight}px` : containerHeight }}
      dir="rtl"
    >
      {/* Interactive Drag & Zoom Canvas */}
      <motion.div
        className={`w-full h-full ${isMini ? "pointer-events-none" : "cursor-grab active:cursor-grabbing"}`}
        drag={!isMini}
        dragConstraints={containerRef}
        dragElastic={0.18}
        dragTransition={{ bounceStiffness: 300, bounceDamping: 24 }}
        animate={{ scale: zoom }}
        transition={{ type: "spring", stiffness: 280, damping: 26 }}
        style={{ transformOrigin: "center center" }}
        onClick={() => !isMini && setInternalSelectedId(null)}
      >
        <svg
          viewBox={isMini ? "100 80 600 420" : "0 0 800 580"}
          className="w-full h-full object-cover"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Soft Shadow Filter for Sandstone Pins */}
            <filter id="dark-pin-shadow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="var(--espresso)" floodOpacity="0.6" />
            </filter>
          </defs>

          {/* 1. Base Land: espresso */}
          <rect width="100%" height="100%" fill="var(--espresso)" />

          {/* 2. Urban Blocks: surface-2 with parks at driftwood 25% */}
          <g fill="var(--surface-2)" stroke="var(--stroke)" strokeWidth="1">
            {/* Northwest Blocks (Al Malqa) */}
            <rect x="80" y="80" width="110" height="90" rx="14" />
            <rect x="80" y="190" width="110" height="75" rx="14" />
            <rect x="80" y="285" width="110" height="85" rx="14" />
            <rect x="210" y="80" width="120" height="90" rx="14" fill="var(--driftwood)" fillOpacity="0.25" />
            <rect x="210" y="190" width="120" height="75" rx="14" />
            <rect x="210" y="285" width="120" height="85" rx="14" />

            {/* North-Central Blocks (Al Yasmin) */}
            <rect x="360" y="80" width="130" height="90" rx="14" />
            <rect x="360" y="190" width="130" height="75" rx="14" fill="var(--surface-3)" />
            <rect x="360" y="285" width="130" height="85" rx="14" />

            {/* Northeast Blocks (Al Narjis) */}
            <rect x="520" y="80" width="120" height="90" rx="14" fill="var(--driftwood)" fillOpacity="0.25" />
            <rect x="520" y="190" width="120" height="75" rx="14" />
            <rect x="520" y="285" width="120" height="85" rx="14" />
            <rect x="660" y="80" width="95" height="90" rx="14" />
            <rect x="660" y="190" width="95" height="75" rx="14" />
            <rect x="660" y="285" width="95" height="85" rx="14" />

            {/* South Blocks around KAFD / Business Hub */}
            <rect x="180" y="400" width="150" height="120" rx="18" />
            <rect x="350" y="400" width="150" height="120" rx="18" fill="var(--surface-3)" />
            <rect x="520" y="400" width="160" height="120" rx="18" fill="var(--driftwood)" fillOpacity="0.25" />
          </g>

          {/* 3. Roads Network: driftwood at 60% */}
          <g stroke="var(--driftwood)" strokeOpacity="0.6" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none">
            {/* Major Arterials */}
            <line x1="345" y1="40" x2="345" y2="540" strokeWidth="9" />
            <line x1="505" y1="40" x2="505" y2="540" strokeWidth="8" />
            <line x1="60" y1="180" x2="760" y2="180" strokeWidth="7" />
            <line x1="60" y1="275" x2="760" y2="275" strokeWidth="7" />
            <line x1="60" y1="385" x2="760" y2="385" strokeWidth="9" />
          </g>

          {/* Local Streets (Thin Roads): driftwood at 60% with thinner stroke */}
          <g stroke="var(--driftwood)" strokeOpacity="0.6" strokeWidth="2.5" fill="none">
            <line x1="80" y1="130" x2="190" y2="130" />
            <line x1="210" y1="130" x2="330" y2="130" />
            <line x1="360" y1="130" x2="490" y2="130" />
            <line x1="520" y1="130" x2="640" y2="130" />
            <line x1="80" y1="230" x2="190" y2="230" />
            <line x1="210" y1="230" x2="330" y2="230" />
            <line x1="520" y1="230" x2="640" y2="230" />
            <line x1="80" y1="330" x2="190" y2="330" />
            <line x1="210" y1="330" x2="330" y2="330" />
            <line x1="360" y1="330" x2="490" y2="330" />
            <line x1="520" y1="330" x2="640" y2="330" />
          </g>

          {/* 4. Travel Ring: dashed sandstone centered on Work Coordinate */}
          <g>
            <circle
              cx={WORK_COORDINATE.x}
              cy={WORK_COORDINATE.y}
              r="230"
              fill="var(--sandstone)"
              fillOpacity="0.02"
              stroke="var(--sandstone)"
              strokeWidth="1.5"
              strokeDasharray="6 6"
              strokeOpacity="0.4"
            />
            {/* Ring Label Badge */}
            <rect
              x={WORK_COORDINATE.x - 48}
              y={WORK_COORDINATE.y - 238}
              width="96"
              height="20"
              rx="10"
              fill="var(--surface-1)"
              stroke="var(--stroke)"
            />
            <text
              x={WORK_COORDINATE.x}
              y={WORK_COORDINATE.y - 224}
              textAnchor="middle"
              fill="var(--sandstone)"
              fontSize="10"
              fontWeight="500"
              fontFamily="var(--font-arabic)"
            >
              نطاق 20 دقيقة
            </text>
          </g>

          {/* 5. Work Hub Pin (surface-3 with Briefcase) */}
          <g transform={`translate(${WORK_COORDINATE.x}, ${WORK_COORDINATE.y})`}>
            <circle cx="0" cy="0" r="14" fill="var(--surface-3)" stroke="var(--stroke)" strokeWidth="1.5" filter="url(#dark-pin-shadow)" />
            <circle cx="0" cy="0" r="6" fill="var(--muted)" />
          </g>

          {/* 6. Sandstone Pins with Compass Glyph for Properties */}
          {Object.entries(PIN_COORDINATES).map(([propId, coord]) => {
            const isSelected = selectedId === propId;

            return (
              <g
                key={propId}
                transform={`translate(${coord.x}, ${coord.y})`}
                className="cursor-pointer transition-transform duration-200"
                onClick={(e) => handlePinClick(propId, e)}
              >
                {/* Active Pulsing Ring */}
                {isSelected && (
                  <circle
                    cx="0"
                    cy="-22"
                    r="28"
                    fill="none"
                    stroke="var(--sandstone)"
                    strokeWidth="1.5"
                    strokeOpacity="0.4"
                    className="animate-pulse"
                  />
                )}

                {/* Pin Drop Shape in Sandstone */}
                <path
                  d="M 0 0 C -12 -12, -18 -22, -18 -32 A 18 18 0 0 1 18 -32 C 18 -22, 12 -12, 0 0 Z"
                  fill="var(--sandstone)"
                  stroke="var(--espresso)"
                  strokeWidth="1.5"
                  filter="url(#dark-pin-shadow)"
                />

                {/* Inner Compass Glyph circle in Espresso */}
                <circle cx="0" cy="-32" r="10" fill="var(--espresso)" />

                {/* Compass Needle Glyph in Sandstone and Muted */}
                <polygon
                  points="0,-39 2.5,-32 0,-30 -2.5,-32"
                  fill="var(--sandstone)"
                />
                <polygon
                  points="0,-25 2.5,-32 0,-34 -2.5,-32"
                  fill="var(--muted)"
                />

                {/* Text Label Below Pin */}
                <rect
                  x="-36"
                  y="6"
                  width="72"
                  height="18"
                  rx="9"
                  fill="var(--surface-1)"
                  stroke="var(--stroke)"
                  filter="url(#dark-pin-shadow)"
                />
                <text
                  x="0"
                  y="18.5"
                  textAnchor="middle"
                  fill="var(--sandstone)"
                  fontSize="10"
                  fontWeight="600"
                  fontFamily="var(--font-arabic)"
                >
                  {coord.label}
                </text>
              </g>
            );
          })}
        </svg>
      </motion.div>

      {/* Map Control Buttons (Full variant only) */}
      {!isMini && (
        <div className="absolute top-4 start-4 z-20 flex flex-col gap-2">
          <button
            type="button"
            onClick={handleZoomIn}
            className="w-9 h-9 rounded-full bawsala-glass text-sandstone flex items-center justify-center hover:brightness-110 active:scale-95 cursor-pointer shadow-md"
            aria-label="تكبير الخريطة"
          >
            <Plus className="w-4 h-4 stroke-[1.5]" />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            className="w-9 h-9 rounded-full bawsala-glass text-sandstone flex items-center justify-center hover:brightness-110 active:scale-95 cursor-pointer shadow-md"
            aria-label="تصغير الخريطة"
          >
            <Minus className="w-4 h-4 stroke-[1.5]" />
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="w-9 h-9 rounded-full bawsala-glass text-sandstone flex items-center justify-center hover:brightness-110 active:scale-95 cursor-pointer shadow-md"
            aria-label="إعادة ضبط مركز الخريطة"
          >
            <RotateCcw className="w-3.5 h-3.5 stroke-[1.5]" />
          </button>
        </div>
      )}

      {/* Legend Pill */}
      <div className="absolute top-4 end-4 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full bawsala-glass-dark text-[11px] font-medium text-sandstone border border-stroke shadow-md">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-sandstone" />
          <span>عقار</span>
        </span>
        <span className="text-muted/40">|</span>
        <span className="flex items-center gap-1.5">
          <Briefcase className="w-3 h-3 text-muted" />
          <span>العمل</span>
        </span>
      </div>

      {/* Selected Property Callout Card */}
      <AnimatePresence>
        {!isMini && activeProperty && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-4 inset-x-4 max-w-[340px] mx-auto z-20 p-3.5 rounded-[24px] bawsala-glass-dark border border-stroke text-sandstone shadow-2xl flex items-center justify-between gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-surface-3 flex items-center justify-center shrink-0 border border-stroke text-sandstone">
                <Compass className="w-5 h-5 text-sandstone" />
              </div>

              <div className="flex flex-col min-w-0">
                <span className="text-[14px] font-semibold text-sandstone truncate leading-tight">
                  {activeProperty.title}
                </span>
                <span className="text-[12px] text-muted mt-0.5">
                  <bdi dir="ltr">{activeProperty.formattedPrice || "870,000 ر.س"}</bdi>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <Link
                href={`/case/demo/property/${activeProperty.id}`}
                className="w-8 h-8 rounded-full bawsala-glass flex items-center justify-center text-sandstone hover:brightness-110 active:scale-95"
                title="عرض تفاصيل العقار"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
              <button
                type="button"
                onClick={() => setInternalSelectedId(null)}
                className="w-8 h-8 rounded-full bg-surface-2 hover:bg-surface-3 flex items-center justify-center text-muted hover:text-sandstone cursor-pointer"
                title="إغلاق"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

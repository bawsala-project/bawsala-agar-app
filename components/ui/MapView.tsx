"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Minus,
  RotateCcw,
  Navigation,
  Briefcase,
  ExternalLink,
  X,
  Compass,
  Clock,
} from "lucide-react";
import { INITIAL_PROPERTIES, PropertyItem } from "@/lib/seed";
import { PropertyImage } from "@/components/ui/PropertyImage";
import { BdiNumber, formatNumber } from "@/lib/format";
import Link from "next/link";

export interface MapViewProps {
  variant?: "mini" | "full";
  selectedPropertyId?: string | null;
  onSelectProperty?: (propertyId: string) => void;
  className?: string;
  properties?: PropertyItem[];
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
}: MapViewProps) {
  const isMini = variant === "mini";
  const [internalSelectedId, setInternalSelectedId] = useState<string | null>(
    controlledSelectedId || (isMini ? null : "p1")
  );

  const selectedId = controlledSelectedId !== undefined ? controlledSelectedId : internalSelectedId;
  const activeProperty = properties.find((p) => p.id === selectedId);

  // Zoom & Pan state for full interactive variant
  const [zoom, setZoom] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  const handlePinClick = (propertyId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (isMini) return;
    setInternalSelectedId(propertyId);
    if (onSelectProperty) {
      onSelectProperty(propertyId);
    }
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

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden select-none bg-[#FAF6EF] border border-[#E9DFD0] ${
        isMini ? "h-40 rounded-2xl" : "h-[390px] md:h-[450px] rounded-3xl shadow-sm"
      } ${className}`}
    >
      {/* Interactive Drag & Zoom Canvas (or fixed for mini) */}
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
          viewBox={isMini ? "80 60 640 450" : "0 0 800 580"}
          className="w-full h-full object-cover"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Soft Shadow Filter for Pins */}
            <filter id="pin-shadow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#130F08" floodOpacity="0.25" />
            </filter>

            {/* Brass Gradient for Property Pins */}
            <linearGradient id="brass-pin" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F0C060" />
              <stop offset="50%" stopColor="#E3A83A" />
              <stop offset="100%" stopColor="#C88E28" />
            </linearGradient>

            {/* Espresso Gradient for Work Pin */}
            <linearGradient id="espresso-pin" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3D271A" />
              <stop offset="100%" stopColor="#130F08" />
            </linearGradient>

            {/* Subtle Parcel Hatching */}
            <pattern id="parcel-pattern" width="16" height="16" patternUnits="userSpaceOnUse">
              <path d="M 0 16 L 16 0 M 0 0 L 16 16" stroke="rgba(19, 15, 8, 0.02)" strokeWidth="0.5" />
            </pattern>
          </defs>

          {/* 1. Base Ivory Ground */}
          <rect width="100%" height="100%" fill="#FAF6EF" />

          {/* 2. Urban Blocks (Sand Parcels) */}
          <g fill="#E9DFD0" opacity="0.85">
            {/* Northwest District Blocks (Al Malqa) */}
            <rect x="80" y="80" width="110" height="90" rx="14" />
            <rect x="80" y="190" width="110" height="75" rx="14" />
            <rect x="80" y="285" width="110" height="85" rx="14" />
            <rect x="210" y="80" width="120" height="90" rx="14" />
            <rect x="210" y="190" width="120" height="75" rx="14" />
            <rect x="210" y="285" width="120" height="85" rx="14" />

            {/* North-Central District Blocks (Al Yasmin) */}
            <rect x="360" y="80" width="130" height="90" rx="14" />
            <rect x="360" y="190" width="130" height="75" rx="14" />
            <rect x="360" y="285" width="130" height="85" rx="14" />

            {/* Northeast District Blocks (Al Narjis) */}
            <rect x="520" y="80" width="120" height="90" rx="14" />
            <rect x="520" y="190" width="120" height="75" rx="14" />
            <rect x="520" y="285" width="120" height="85" rx="14" />
            <rect x="660" y="80" width="95" height="90" rx="14" />
            <rect x="660" y="190" width="95" height="75" rx="14" />
            <rect x="660" y="285" width="95" height="85" rx="14" />

            {/* South Blocks around KAFD / Business Hub */}
            <rect x="180" y="400" width="150" height="120" rx="18" />
            <rect x="350" y="400" width="150" height="120" rx="18" fill="#DFD2C0" />
            <rect x="520" y="400" width="160" height="120" rx="18" />
          </g>

          {/* 3. Muted Sage Parks & Green Corridors */}
          <g fill="#C5D4BA" opacity="0.85">
            {/* Linear Garden / Buffer along Anas Ibn Malik */}
            <rect x="100" y="174" width="220" height="10" rx="5" />
            <rect x="370" y="174" width="110" height="10" rx="5" />
            <rect x="530" y="174" width="210" height="10" rx="5" />

            {/* Yasmin Central Park */}
            <path d="M 450 100 Q 480 110 470 150 Q 440 160 430 130 Z" />

            {/* Malqa Community Garden */}
            <circle cx="150" cy="235" r="22" />

            {/* Narjis Linear Park */}
            <rect x="610" y="220" width="35" height="50" rx="10" />

            {/* KAFD Plaza Greenery */}
            <circle cx="365" cy="425" r="16" />
          </g>

          {/* 4. Teal Water Corridor (Wadi Hanifah Tributary on West) */}
          <path
            d="M 45 40 Q 60 140 35 240 Q 55 350 40 450 Q 25 520 30 560"
            fill="none"
            stroke="#14756E"
            strokeWidth="14"
            strokeOpacity="0.25"
            strokeLinecap="round"
          />
          <path
            d="M 45 40 Q 60 140 35 240 Q 55 350 40 450 Q 25 520 30 560"
            fill="none"
            stroke="#14756E"
            strokeWidth="6"
            strokeOpacity="0.45"
            strokeLinecap="round"
          />

          {/* 5. White Road Network with Subtle Borders */}
          {/* Main Ring Roads & Arterials (Thick) */}
          <g stroke="#E0D5C3" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" fill="none">
            {/* Vertical: King Fahd Road */}
            <line x1="340" y1="40" x2="340" y2="540" />
            {/* Vertical: Olaya / King Abdulaziz */}
            <line x1="505" y1="40" x2="505" y2="540" />
            {/* Horizontal: Anas Ibn Malik Road */}
            <line x1="60" y1="180" x2="760" y2="180" />
            {/* Horizontal: Northern Ring / Imam Saud */}
            <line x1="60" y1="385" x2="760" y2="385" />
          </g>

          <g stroke="#FFFFFF" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" fill="none">
            <line x1="340" y1="40" x2="340" y2="540" />
            <line x1="505" y1="40" x2="505" y2="540" />
            <line x1="60" y1="180" x2="760" y2="180" />
            <line x1="60" y1="385" x2="760" y2="385" />
          </g>

          {/* Secondary Connectors */}
          <g stroke="#FFFFFF" strokeWidth="8" strokeLinecap="round" fill="none">
            <line x1="60" y1="275" x2="760" y2="275" />
            <line x1="200" y1="40" x2="200" y2="385" />
            <line x1="650" y1="40" x2="650" y2="385" />
          </g>

          {/* 6. District Labels (Subtle Editorial Typography) */}
          <g fill="#130F08" opacity="0.42" fontFamily="IBM Plex Sans Arabic, sans-serif" fontSize="11" fontWeight="600" textAnchor="middle">
            <text x="250" y="115">حي الملقا</text>
            <text x="425" y="115">حي الياسمين</text>
            <text x="590" y="115">حي النرجس</text>
            <text x="425" y="540" fontSize="10">مركز الملك عبد الله المالي (KAFD)</text>
          </g>

          {/* Road Names in Arabic */}
          <g fill="#130F08" opacity="0.32" fontFamily="IBM Plex Sans Arabic, sans-serif" fontSize="8.5" fontWeight="500">
            <text x="345" y="320" transform="rotate(90 345 320)">طريق الملك فهد</text>
            <text x="510" y="320" transform="rotate(90 510 320)">طريق الملك عبد العزيز</text>
            <text x="120" y="176">طريق أنس بن مالك</text>
            <text x="120" y="381">الطريق الدائري الشمالي</text>
          </g>

          {/* 7. Dashed Teal Travel-Time Radius Ring ("20 د") */}
          <g>
            {/* Isochrone travel-time ellipse centered at Work Pin */}
            <ellipse
              cx={WORK_COORDINATE.x}
              cy={WORK_COORDINATE.y}
              rx="275"
              ry="250"
              fill="rgba(20, 117, 110, 0.04)"
              stroke="#14756E"
              strokeWidth="2"
              strokeDasharray="6 5"
              opacity="0.8"
            />

            {/* Travel Radius Label Chip on Perimeter */}
            <g transform={`translate(${WORK_COORDINATE.x - 170}, ${WORK_COORDINATE.y - 215})`}>
              <rect x="0" y="0" width="76" height="22" rx="11" fill="#14756E" />
              <text
                x="38"
                y="14"
                fill="#FAF6EF"
                fontFamily="IBM Plex Sans Arabic, sans-serif"
                fontSize="10"
                fontWeight="600"
                textAnchor="middle"
              >
                20 د للعمل
              </text>
            </g>
          </g>

          {/* 8. Commute Trajectory Dotted Lines from Properties to Work */}
          {!isMini && (
            <g stroke="#130F08" strokeWidth="1.25" strokeDasharray="3 3" opacity="0.25">
              <line x1={PIN_COORDINATES.p1.x} y1={PIN_COORDINATES.p1.y} x2={WORK_COORDINATE.x} y2={WORK_COORDINATE.y} />
              <line x1={PIN_COORDINATES.p2.x} y1={PIN_COORDINATES.p2.y} x2={WORK_COORDINATE.x} y2={WORK_COORDINATE.y} />
              <line x1={PIN_COORDINATES.p3.x} y1={PIN_COORDINATES.p3.y} x2={WORK_COORDINATE.x} y2={WORK_COORDINATE.y} />
            </g>
          )}

          {/* 9. Work Pin (Espresso) */}
          <g
            transform={`translate(${WORK_COORDINATE.x}, ${WORK_COORDINATE.y})`}
            filter="url(#pin-shadow)"
          >
            {/* Work Pin Anchor */}
            <circle cx="0" cy="0" r="16" fill="url(#espresso-pin)" stroke="#FAF6EF" strokeWidth="2" />
            <Briefcase className="w-3.5 h-3.5 text-[#FAF6EF]" x="-7" y="-7" />

            {/* Work Label Badge */}
            <g transform="translate(0, 24)">
              <rect x="-38" y="0" width="76" height="18" rx="9" fill="#130F08" fillOpacity="0.88" />
              <text
                x="0"
                y="12"
                fill="#FAF6EF"
                fontFamily="IBM Plex Sans Arabic, sans-serif"
                fontSize="9"
                fontWeight="600"
                textAnchor="middle"
              >
                مقر العمل
              </text>
            </g>
          </g>

          {/* 10. Property Pins (Brass Drop Pins with Numbers) */}
          {properties.map((prop, idx) => {
            const coord = PIN_COORDINATES[prop.id] || { x: 300 + idx * 100, y: 200 };
            const isSelected = selectedId === prop.id;
            const rank = prop.preRank || idx + 1;

            return (
              <g
                key={prop.id}
                transform={`translate(${coord.x}, ${coord.y})`}
                className={isMini ? "" : "cursor-pointer"}
                onClick={(e) => handlePinClick(prop.id, e as unknown as React.MouseEvent)}
              >
                {/* Pulsing Halo on Selected Pin */}
                {isSelected && (
                  <circle
                    cx="0"
                    cy="-14"
                    r="24"
                    fill="none"
                    stroke="#E3A83A"
                    strokeWidth="2.5"
                    opacity="0.85"
                    className="animate-ping"
                    style={{ transformOrigin: "0 -14px" }}
                  />
                )}

                {/* Drop Pin Shape (SVG Teardrop / Pin) */}
                <g filter="url(#pin-shadow)" transform={isSelected ? "scale(1.18)" : "scale(1)"} style={{ transition: "transform 0.25s ease" }}>
                  <path
                    d="M 0 0 C -12 -12 -16 -24 -16 -32 A 16 16 0 0 1 16 -32 C 16 -24 12 -12 0 0 Z"
                    fill="url(#brass-pin)"
                    stroke="#FAF6EF"
                    strokeWidth="2"
                  />
                  {/* Inner White Disc */}
                  <circle cx="0" cy="-32" r="10" fill="#FAF6EF" />

                  {/* Rank / Number Digit in Western Plex Tabular Numerals */}
                  <text
                    x="0"
                    y="-28"
                    fill="#130F08"
                    fontFamily="IBM Plex Sans Arabic, sans-serif"
                    fontSize="11"
                    fontWeight="700"
                    textAnchor="middle"
                  >
                    {rank}
                  </text>
                </g>

                {/* Mini Commute Chip below Pin */}
                <g transform="translate(0, 10)">
                  <rect
                    x="-24"
                    y="0"
                    width="48"
                    height="16"
                    rx="8"
                    fill={isSelected ? "#130F08" : "rgba(19, 15, 8, 0.72)"}
                  />
                  <text
                    x="0"
                    y="11"
                    fill="#FAF6EF"
                    fontFamily="IBM Plex Sans Arabic, sans-serif"
                    fontSize="8.5"
                    fontWeight="600"
                    textAnchor="middle"
                  >
                    {coord.commuteMin} د
                  </text>
                </g>
              </g>
            );
          })}
        </svg>
      </motion.div>

      {/* Mini Variant: Compact Overlay Banner */}
      {isMini && (
        <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between pointer-events-none z-10" dir="rtl">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full glass-dark text-[11px] font-semibold text-[#FAF6EF] shadow-sm">
            <Compass className="w-3.5 h-3.5 text-[#E3A83A]" />
            <span>نطاق العمل • 3 عقارات</span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full glass-dark text-[#FAF6EF]/90 shadow-sm font-medium">
            <bdi dir="ltr">20 دقيقة</bdi>
          </span>
        </div>
      )}

      {/* Full Variant: Interactive Map Controls (Zoom In, Zoom Out, Recenter) */}
      {!isMini && (
        <div className="absolute top-4 left-4 z-20 flex flex-col gap-1.5">
          <div className="flex flex-col rounded-full glass-dark border border-white/20 p-1 shadow-md items-center">
            <button
              type="button"
              onClick={handleZoomIn}
              title="تكبير"
              className="w-8 h-8 rounded-full flex items-center justify-center text-[#FAF6EF] hover:bg-white/20 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
            </button>
            <div className="w-4 h-px bg-white/15 my-0.5" />
            <button
              type="button"
              onClick={handleZoomOut}
              title="تصغير"
              className="w-8 h-8 rounded-full flex items-center justify-center text-[#FAF6EF] hover:bg-white/20 transition-colors cursor-pointer"
            >
              <Minus className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleReset}
            title="إعادة ضبط الموقع"
            className="w-10 h-10 rounded-full glass-dark border border-white/20 flex items-center justify-center text-[#FAF6EF] hover:bg-white/20 transition-colors shadow-md cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Full Variant: Interactive Glass Callout Card for Selected Property */}
      {!isMini && (
        <AnimatePresence>
          {activeProperty && (
            <motion.div
              key={activeProperty.id}
              initial={{ opacity: 0, y: 16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.95 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="absolute bottom-4 inset-x-4 max-w-sm mx-auto z-30 pointer-events-auto"
              dir="rtl"
            >
              <div className="p-3 rounded-2xl glass-dark border border-white/25 text-[#FAF6EF] shadow-xl backdrop-blur-md flex items-center gap-3 relative">
                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => setInternalSelectedId(null)}
                  className="absolute top-2 left-2 w-6 h-6 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white/80 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>

                {/* Property Thumbnail */}
                <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 border border-white/20">
                  <PropertyImage
                    image={activeProperty.images?.[0]}
                    tone={activeProperty.colorTone}
                    alt={activeProperty.title}
                    containerClassName="w-full h-full"
                  />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0 pr-1 space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] px-2 py-0.2 rounded-full bg-[#E3A83A] text-[#130F08] font-bold">
                      خيار #{activeProperty.preRank}
                    </span>
                    <span className="text-xs text-[#FAF6EF]/75 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#14756E]" />
                      {activeProperty.travelTimeWorkMin} دقيقة
                    </span>
                  </div>

                  <h4 className="text-xs font-semibold text-[#FAF6EF] truncate">
                    {activeProperty.title}
                  </h4>

                  <div className="text-xs font-semibold text-[#F0C060]">
                    <BdiNumber value={formatNumber(activeProperty.price)} unit="ر.س" />
                  </div>
                </div>

                {/* Link to detail page */}
                <Link
                  href={`/case/demo/property/${activeProperty.id}`}
                  className="px-3 py-1.5 rounded-full bg-gradient-to-r from-[#E3A83A] to-[#F0C060] text-[#130F08] font-semibold text-xs shrink-0 flex items-center gap-1 hover:brightness-105 active:scale-95 transition-all shadow-xs"
                >
                  <span>التفاصيل</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}

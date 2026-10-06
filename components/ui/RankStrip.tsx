"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";
import { PropertyItem } from "@/lib/seed";
import { PropertyImage } from "./PropertyImage";

interface RankStripProps {
  properties: PropertyItem[];
  isReassessed: boolean;
  className?: string;
}

export function RankStrip({
  properties,
  isReassessed,
  className = "",
}: RankStripProps) {
  // Sort properties according to current state: preRank vs postRank
  const sortedProperties = [...properties].sort((a, b) =>
    isReassessed ? a.postRank - b.postRank : a.preRank - b.preRank
  );

  return (
    <div className={`space-y-3 ${className}`} dir="rtl">
      {sortedProperties.map((prop) => {
        const currentRank = isReassessed ? prop.postRank : prop.preRank;
        const rankChange = isReassessed
          ? prop.preRank - prop.postRank // positive means moved up!
          : 0;

        const isImproved = rankChange > 0;
        const isDegraded = rankChange < 0;

        return (
          <motion.div
            key={prop.id}
            layout
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 24,
            }}
            className="p-3.5 rounded-2xl bg-[#EBE2D8] border border-[#D7CBBE] text-[#130F08] flex items-center justify-between shadow-sm relative overflow-hidden"
          >
            <div className="flex items-center gap-3">
              {/* Rank Position Pill */}
              <div className="w-8 h-8 rounded-full bg-[#130F08] text-[#F2EBE2] font-semibold text-sm flex items-center justify-center shrink-0">
                {currentRank}
              </div>

              {/* Tiny Thumbnail */}
              <div className="w-12 h-10 rounded-xl overflow-hidden shrink-0">
                <PropertyImage
                  image={prop.images?.[0]}
                  tone={prop.colorTone}
                  alt={prop.title}
                  containerClassName="w-full h-full"
                />
              </div>

              {/* Details */}
              <div>
                <h4 className="text-sm font-medium text-[#130F08] line-clamp-1">
                  {prop.title}
                </h4>
                <p className="text-xs text-[#645A4E]">
                  {prop.formattedPrice} • {prop.district}
                </p>
              </div>
            </div>

            {/* Change indicator badge */}
            <div className="flex items-center gap-1.5 shrink-0 pl-1">
              {isImproved && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#3D271A]/10 text-[#130F08] text-xs font-medium border border-[#645A4E]/30">
                  <ArrowUp className="w-3.5 h-3.5 text-[#130F08]" />
                  <span>تقدم للمركز {currentRank}</span>
                </span>
              )}

              {isDegraded && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#A8643C]/15 text-[#A8643C] text-xs font-medium border border-[#A8643C]/40">
                  <ArrowDown className="w-3.5 h-3.5" />
                  <span>تراجع للمركز {currentRank}</span>
                </span>
              )}

              {!isImproved && !isDegraded && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#130F08]/5 text-[#645A4E] text-[11px]">
                  <Minus className="w-3 h-3" />
                  <span>لم يتأثر</span>
                </span>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

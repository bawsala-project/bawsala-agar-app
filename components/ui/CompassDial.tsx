"use client";

import React, { useRef } from "react";
import { motion, PanInfo } from "framer-motion";

export interface CompassDialOption {
  id: string;
  label: string;
  caption?: string;
}

interface CompassDialProps {
  options: CompassDialOption[];
  value: string;
  onChange: (id: string) => void;
  className?: string;
}

export function CompassDial({
  options,
  value,
  onChange,
  className = "",
}: CompassDialProps) {
  const currentIndex = Math.max(0, options.findIndex((o) => o.id === value));
  const containerRef = useRef<HTMLDivElement>(null);

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    // Vertical drag or horizontal drag swipe
    const delta = info.offset.y || info.offset.x;
    const velocity = info.velocity.y || info.velocity.x;

    if (delta > 35 || velocity > 200) {
      if (currentIndex > 0) {
        onChange(options[currentIndex - 1].id);
      }
    } else if (delta < -35 || velocity < -200) {
      if (currentIndex < options.length - 1) {
        onChange(options[currentIndex + 1].id);
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden select-none py-6 px-4 flex items-center justify-between ${className}`}
      dir="rtl"
    >
      {/* Semicircle Curved Wheel Area */}
      <div className="relative flex-1 h-56 flex items-center justify-center">
        {/* Semicircle Fine Tick Arc Background (Echoing Logo) */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
          <svg
            className="w-72 h-72 opacity-60"
            viewBox="0 0 200 200"
            fill="none"
          >
            {/* Guide circle arc */}
            <circle
              cx="100"
              cy="100"
              r="85"
              stroke="#E9DFD0"
              strokeWidth="1.5"
              strokeDasharray="4 4"
            />

            {/* Radial Ticks along the arc */}
            {Array.from({ length: 36 }).map((_, i) => {
              const deg = i * 10;
              const rad = (deg * Math.PI) / 180;
              const r1 = i % 3 === 0 ? 76 : 80;
              const r2 = 88;
              const x1 = 100 + r1 * Math.cos(rad);
              const y1 = 100 + r1 * Math.sin(rad);
              const x2 = 100 + r2 * Math.cos(rad);
              const y2 = 100 + r2 * Math.sin(rad);

              return (
                <line
                  key={i}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={i % 3 === 0 ? "#130F08" : "#E9DFD0"}
                  strokeWidth={i % 3 === 0 ? 1.5 : 1}
                  strokeLinecap="round"
                />
              );
            })}
          </svg>

          {/* Central Compass Needle Pointer pointing at selected option */}
          <div className="absolute top-2 w-5 h-5 flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-[#E3A83A]" fill="none">
              <polygon points="12 4 15 15 12 13 9 15 12 4" fill="currentColor" />
              <polygon points="12 20 9 15 12 13 15 15 12 20" fill="#E9DFD0" />
            </svg>
          </div>
        </div>

        {/* Draggable Wheel Stack Container */}
        <motion.div
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={0.6}
          onDragEnd={handleDragEnd}
          className="relative z-10 w-full h-full flex flex-col items-center justify-center cursor-grab active:cursor-grabbing"
        >
          {options.map((opt, idx) => {
            const offset = idx - currentIndex;
            if (Math.abs(offset) > 2) return null;

            const isSelected = offset === 0;
            const yPos = offset * 54;
            const scale = isSelected ? 1 : Math.abs(offset) === 1 ? 0.8 : 0.65;
            const opacity = isSelected ? 1 : Math.abs(offset) === 1 ? 0.45 : 0.2;
            const rotateX = offset * 25;

            return (
              <motion.div
                key={opt.id}
                onClick={() => onChange(opt.id)}
                animate={{
                  y: yPos,
                  scale,
                  opacity,
                  rotateX,
                }}
                transition={{
                  type: "spring",
                  stiffness: 280,
                  damping: 26,
                }}
                className={`absolute cursor-pointer transition-colors text-center px-4 py-1.5 rounded-full ${
                  isSelected
                    ? "text-[#130F08]"
                    : "text-[#130F08]/50 hover:opacity-80"
                }`}
                style={{ transformStyle: "preserve-3d" }}
              >
                <span
                  className={`block transition-all font-sans ${
                    isSelected
                      ? "text-2xl md:text-3xl font-semibold text-[#130F08]"
                      : "text-base md:text-lg font-normal text-[#130F08]/40"
                  }`}
                >
                  {opt.label}
                </span>

                {isSelected && opt.caption && (
                  <motion.span
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="block text-xs font-medium text-[#130F08]/65 mt-1"
                  >
                    {opt.caption}
                  </motion.span>
                )}
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* Slim Vertical Scrub Bar on the Side */}
      <div className="w-2.5 h-36 rounded-full bg-[#E9DFD0] border border-[#130F08]/10 p-0.5 flex flex-col justify-between shrink-0 shadow-inner">
        {options.map((opt, i) => {
          const isActive = i === currentIndex;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChange(opt.id)}
              className={`w-full rounded-full transition-all cursor-pointer ${
                isActive
                  ? "h-4 bg-[#130F08] shadow-xs"
                  : "h-1 bg-[#130F08]/20 hover:bg-[#130F08]/40"
              }`}
              title={opt.label}
            />
          );
        })}
      </div>
    </div>
  );
}

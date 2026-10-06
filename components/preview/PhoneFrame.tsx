"use client";

import React from "react";
import { motion } from "framer-motion";

export interface DevicePreset {
  id: string;
  name: string;
  width: number;
  height: number;
  outerRadius: number;
  screenRadius: number;
  hasDynamicIsland: boolean;
}

export const DEVICE_PRESETS: DevicePreset[] = [
  {
    id: "iphone-14",
    name: "iPhone 14 / 15",
    width: 390,
    height: 844,
    outerRadius: 60,
    screenRadius: 48,
    hasDynamicIsland: true,
  },
  {
    id: "iphone-15-pro",
    name: "iPhone 15 Pro",
    width: 393,
    height: 852,
    outerRadius: 62,
    screenRadius: 50,
    hasDynamicIsland: true,
  },
  {
    id: "iphone-se",
    name: "iPhone SE",
    width: 375,
    height: 667,
    outerRadius: 48,
    screenRadius: 36,
    hasDynamicIsland: false,
  },
  {
    id: "pixel-8",
    name: "Pixel 8",
    width: 412,
    height: 915,
    outerRadius: 54,
    screenRadius: 42,
    hasDynamicIsland: false,
  },
];

interface PhoneFrameProps {
  device: DevicePreset;
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  iframeSrc?: string;
  className?: string;
}

export function PhoneFrame({
  device,
  iframeRef,
  iframeSrc = "/?embed=1",
  className = "",
}: PhoneFrameProps) {
  const bezel = 12;
  const outerWidth = device.width + bezel * 2;
  const outerHeight = device.height + bezel * 2;

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {/* Ground reflection glow beneath the phone */}
      <div 
        className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-4/5 h-12 bg-[#3D271A]/50 blur-3xl rounded-full pointer-events-none" 
      />

      {/* Titanium Frame Wrapper */}
      <motion.div
        layout
        transition={{
          type: "spring",
          stiffness: 260,
          damping: 26,
        }}
        className="relative select-none"
        style={{
          width: outerWidth,
          height: outerHeight,
          borderRadius: device.outerRadius,
          padding: bezel,
          // Modern titanium gradient from espresso to driftwood
          background: "linear-gradient(155deg, #130F08 0%, #2A1F17 35%, #42352B 70%, #645A4E 100%)",
          border: "1px solid rgba(215, 203, 190, 0.45)",
          boxShadow: `
            inset 0 0 4px rgba(19, 15, 8, 0.9),
            inset 0 1px 2px rgba(215, 203, 190, 0.35),
            0 30px 80px -15px rgba(19, 15, 8, 0.65),
            0 0 50px -10px rgba(61, 39, 26, 0.35)
          `,
        }}
      >
        {/* Hardware side buttons */}
        {/* Left Side: Mute / Action button */}
        <div 
          className="absolute -left-[3px] top-[105px] w-[3.5px] h-[26px] bg-gradient-to-r from-[#645A4E] to-[#3D271A] rounded-l-sm border-l border-y border-[#D7CBBE]/30 shadow-sm pointer-events-none" 
        />
        {/* Left Side: Volume Up */}
        <div 
          className="absolute -left-[3px] top-[148px] w-[3.5px] h-[48px] bg-gradient-to-r from-[#645A4E] to-[#3D271A] rounded-l-sm border-l border-y border-[#D7CBBE]/30 shadow-sm pointer-events-none" 
        />
        {/* Left Side: Volume Down */}
        <div 
          className="absolute -left-[3px] top-[208px] w-[3.5px] h-[48px] bg-gradient-to-r from-[#645A4E] to-[#3D271A] rounded-l-sm border-l border-y border-[#D7CBBE]/30 shadow-sm pointer-events-none" 
        />
        {/* Right Side: Power Button */}
        <div 
          className="absolute -right-[3px] top-[165px] w-[3.5px] h-[68px] bg-gradient-to-l from-[#645A4E] to-[#3D271A] rounded-r-sm border-r border-y border-[#D7CBBE]/30 shadow-sm pointer-events-none" 
        />

        {/* Inner Phone Screen Display */}
        <motion.div
          layout
          transition={{
            type: "spring",
            stiffness: 260,
            damping: 26,
          }}
          className="relative w-full h-full overflow-hidden bg-[#130F08] shadow-[inset_0_0_12px_rgba(0,0,0,0.8)]"
          style={{
            borderRadius: device.screenRadius,
          }}
        >
          {/* Dynamic Island Pill (iPhone modern models) */}
          {device.hasDynamicIsland && (
            <div 
              className="absolute top-[11px] left-1/2 -translate-x-1/2 w-[120px] h-[34px] bg-[#0c0906] rounded-full z-30 pointer-events-none flex items-center justify-between px-3 border border-[#130F08]/90 shadow-md"
              aria-hidden="true"
            >
              {/* Camera Lens with delicate optical glint */}
              <div className="w-3 h-3 rounded-full bg-[#18130E] border border-[#3D271A]/40 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-[#2A1F17]/80" />
              </div>

              {/* Sensor dot */}
              <div className="w-2.5 h-2.5 rounded-full bg-[#14100C] border border-[#3D271A]/30" />
            </div>
          )}

          {/* Punch-hole camera (Pixel 8) */}
          {!device.hasDynamicIsland && device.id === "pixel-8" && (
            <div
              className="absolute top-[14px] left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-[#0c0906] z-30 pointer-events-none border border-[#3D271A]/50 flex items-center justify-center"
              aria-hidden="true"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-[#2A1F17]" />
            </div>
          )}

          {/* Classic speaker receiver (iPhone SE) */}
          {!device.hasDynamicIsland && device.id === "iphone-se" && (
            <div
              className="absolute top-[10px] left-1/2 -translate-x-1/2 w-14 h-1.5 rounded-full bg-[#2A1F17] z-30 pointer-events-none border border-[#645A4E]/30"
              aria-hidden="true"
            />
          )}

          {/* Real Full Screen App Iframe */}
          <iframe
            ref={iframeRef}
            src={iframeSrc}
            title="Bawsala Mobile Prototype"
            className="w-full h-full border-0 select-none bg-[#130F08]"
            style={{
              width: "100%",
              height: "100%",
            }}
          />

          {/* Home Indicator Bar */}
          <div
            className="absolute bottom-[9px] left-1/2 -translate-x-1/2 w-[134px] h-[5px] bg-[#D7CBBE]/60 rounded-full z-30 pointer-events-none backdrop-blur-[2px] transition-opacity hover:opacity-20"
            aria-hidden="true"
          />
        </motion.div>
      </motion.div>
    </div>
  );
}

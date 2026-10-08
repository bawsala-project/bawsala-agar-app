"use client";

import React from "react";
import { PhoneStatusBar } from "./PhoneStatusBar";

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
    id: "android",
    name: "Android",
    width: 360,
    height: 800,
    outerRadius: 52,
    screenRadius: 40,
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
  iframeKey?: number;
  className?: string;
}

export function PhoneFrame({
  device,
  iframeRef,
  iframeSrc = "/welcome",
  iframeKey,
  className = "",
}: PhoneFrameProps) {
  const bezel = 12;
  const outerWidth = device.width + bezel * 2;
  const outerHeight = device.height + bezel * 2;

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {/* Soft grounded shadow in espresso */}
      <div
        className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-4/5 h-12 bg-espresso/80 blur-3xl rounded-full pointer-events-none"
        aria-hidden="true"
      />

      {/* Titanium Frame Wrapper: warm titanium gradient from driftwood to espresso, 1px sandstone-at-25% edge highlight */}
      <div
        className="relative select-none phone-frame-titanium"
        style={{
          width: outerWidth,
          height: outerHeight,
          borderRadius: device.outerRadius,
          padding: bezel,
        }}
      >
        {/* Thin side buttons */}
        {/* Left: Action / Mute button */}
        <div
          className="absolute -left-[3.5px] top-[105px] w-[3.5px] h-[26px] bg-gradient-to-r from-driftwood to-espresso rounded-l-xs border-l border-y border-stroke shadow-xs pointer-events-none"
          aria-hidden="true"
        />
        {/* Left: Volume Up */}
        <div
          className="absolute -left-[3.5px] top-[148px] w-[3.5px] h-[48px] bg-gradient-to-r from-driftwood to-espresso rounded-l-xs border-l border-y border-stroke shadow-xs pointer-events-none"
          aria-hidden="true"
        />
        {/* Left: Volume Down */}
        <div
          className="absolute -left-[3.5px] top-[208px] w-[3.5px] h-[48px] bg-gradient-to-r from-driftwood to-espresso rounded-l-xs border-l border-y border-stroke shadow-xs pointer-events-none"
          aria-hidden="true"
        />
        {/* Right: Power Button */}
        <div
          className="absolute -right-[3.5px] top-[165px] w-[3.5px] h-[68px] bg-gradient-to-l from-driftwood to-espresso rounded-r-xs border-r border-y border-stroke shadow-xs pointer-events-none"
          aria-hidden="true"
        />

        {/* Inner Phone Screen Display */}
        <div
          className="relative w-full h-full overflow-hidden bg-espresso"
          style={{
            borderRadius: device.screenRadius,
          }}
        >
          {/* Dynamic Island 120x34 at 11px from top */}
          {device.hasDynamicIsland && (
            <div
              className="absolute top-[11px] left-1/2 -translate-x-1/2 w-[120px] h-[34px] bg-espresso rounded-full z-40 pointer-events-none flex items-center justify-between px-3 border border-surface-1 shadow-xs"
              aria-hidden="true"
            >
              {/* Camera lens */}
              <div className="w-3 h-3 rounded-full bg-surface-1 border border-stroke flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-surface-2" />
              </div>
              {/* Sensor dot */}
              <div className="w-2.5 h-2.5 rounded-full bg-surface-1" />
            </div>
          )}

          {/* Status bar overlay above the iframe */}
          <PhoneStatusBar />

          {/* Real Full Screen App Iframe */}
          <iframe
            key={iframeKey}
            ref={iframeRef}
            src={iframeSrc}
            title="Bawsala Mobile Prototype"
            className="w-full h-full border-0 select-none bg-espresso"
            style={{
              width: `${device.width}px`,
              height: `${device.height}px`,
            }}
          />

          {/* Home indicator 134x5, sandstone at 60% */}
          <div
            className="absolute bottom-[9px] left-1/2 -translate-x-1/2 w-[134px] h-[5px] rounded-full z-40 pointer-events-none home-indicator"
            aria-hidden="true"
          />
        </div>
      </div>
    </div>
  );
}

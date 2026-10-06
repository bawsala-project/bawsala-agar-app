"use client";

import React from "react";

export function PhoneStatusBar() {
  return (
    <div
      className="absolute top-0 inset-x-0 h-11 px-7 flex items-center justify-between text-[#F2EBE2] z-40 pointer-events-none select-none"
      dir="ltr"
      aria-hidden="true"
    >
      {/* Time: 9:41 */}
      <span className="text-[14px] font-semibold tracking-tight text-[#F2EBE2] font-sans">
        9:41
      </span>

      {/* Cellular, WiFi, Battery Icons */}
      <div className="flex items-center gap-1.5 text-[#F2EBE2]">
        {/* Cellular Signal (4 bars) */}
        <svg viewBox="0 0 18 12" className="w-[17px] h-[11px] fill-current">
          <rect x="0" y="8" width="3" height="4" rx="0.5" />
          <rect x="4.5" y="5.5" width="3" height="6.5" rx="0.5" />
          <rect x="9" y="3" width="3" height="9" rx="0.5" />
          <rect x="13.5" y="0" width="3" height="12" rx="0.5" />
        </svg>

        {/* WiFi Icon */}
        <svg viewBox="0 0 16 12" className="w-[15px] h-[11px] fill-current">
          <path d="M8 11.2a1.3 1.3 0 1 1 0-2.6 1.3 1.3 0 0 1 0 2.6zm-3.5-3.5a5.5 5.5 0 0 1 7 0 .8.8 0 0 1-1 1.2 4 4 0 0 0-5 0 .8.8 0 0 1-1-1.2zm-2.8-2.8a9.4 9.4 0 0 1 12.6 0 .8.8 0 0 1-1 1.2 7.8 7.8 0 0 0-10.6 0 .8.8 0 0 1-1-1.2z" />
        </svg>

        {/* Battery Icon */}
        <div className="flex items-center">
          <div className="w-[22px] h-[11px] rounded-[3px] border border-[#F2EBE2] p-[1.5px] flex items-center">
            <div className="h-full w-[80%] bg-[#F2EBE2] rounded-[1.5px]" />
          </div>
          <div className="w-[1.5px] h-[4px] bg-[#F2EBE2] rounded-r-[1px] ml-[1px]" />
        </div>
      </div>
    </div>
  );
}

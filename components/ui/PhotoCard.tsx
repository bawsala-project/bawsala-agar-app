"use client";

import React from "react";
import Image from "next/image";
import { motion, HTMLMotionProps } from "framer-motion";
import { cardMotion } from "@/lib/motion";

interface PhotoCardProps extends HTMLMotionProps<"div"> {
  src?: string;
  alt?: string;
  tone?: "sandstone" | "cocoa" | "driftwood";
  children?: React.ReactNode;
  interactive?: boolean;
  className?: string;
  radius?: "24" | "28";
  floatingBadge?: React.ReactNode;
}

export function PhotoCard({
  src,
  alt = "بطاقة معمارية",
  tone = "sandstone",
  children,
  interactive = false,
  className = "",
  radius = "28",
  floatingBadge,
  ...props
}: PhotoCardProps) {
  const radiusClass = radius === "24" ? "rounded-[24px]" : "rounded-[28px]";

  const toneGradients = {
    sandstone: "from-[#3D271A] via-[#524436] to-[#8C7D6F]",
    cocoa: "from-[#130F08] via-[#2F1E14] to-[#4D382B]",
    driftwood: "from-[#1E1914] via-[#3C342C] to-[#645A4E]",
  }[tone];

  return (
    <motion.div
      {...(interactive ? cardMotion : {})}
      className={`relative overflow-hidden ${radiusClass} border border-[#F2EBE2]/20 shadow-[0_15px_35px_-8px_rgba(19,15,8,0.65)] select-none bg-gradient-to-br ${toneGradients} ${className}`}
      {...props}
    >
      {/* Background: Real Image or Architectural Lines */}
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(max-width: 480px) 100vw, 430px"
          className="object-cover object-center"
        />
      ) : (
        <svg
          className="absolute inset-0 w-full h-full opacity-35 pointer-events-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <line x1="0" y1="20%" x2="100%" y2="20%" stroke="rgba(242, 235, 226, 0.2)" strokeWidth="1" />
          <line x1="0" y1="75%" x2="100%" y2="75%" stroke="rgba(242, 235, 226, 0.15)" strokeWidth="1" />
          <line x1="30%" y1="0" x2="30%" y2="100%" stroke="rgba(242, 235, 226, 0.2)" strokeWidth="1" />
          <line x1="70%" y1="0" x2="70%" y2="100%" stroke="rgba(242, 235, 226, 0.15)" strokeWidth="1" />
          <circle cx="70%" cy="20%" r="35" fill="none" stroke="rgba(215, 203, 190, 0.25)" strokeWidth="1" strokeDasharray="3 3" />
        </svg>
      )}

      {/* Deep dark gradient overlay for text legibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#130F08]/95 via-[#130F08]/50 to-transparent" />

      {/* Top inner subtle highlight */}
      <span className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-[#F2EBE2]/40 to-transparent pointer-events-none" />

      {/* Optional Floating Badge on top */}
      {floatingBadge && (
        <div className="absolute top-4 right-4 z-10">
          {floatingBadge}
        </div>
      )}

      {/* Overlay Content */}
      <div className="relative z-10 p-5 flex flex-col justify-end min-h-[180px]">
        {children}
      </div>
    </motion.div>
  );
}

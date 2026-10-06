"use client";

import React from "react";
import { motion } from "framer-motion";
import { Compass, FolderOpen, Bookmark, User } from "lucide-react";

export type NavItemKey = "home" | "cases" | "saved" | "profile";

interface FloatingNavProps {
  activeItem?: NavItemKey;
  onChange?: (item: NavItemKey) => void;
  className?: string;
}

export function FloatingNav({
  activeItem = "cases",
  onChange,
  className = "",
}: FloatingNavProps) {
  const items: { id: NavItemKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "home", label: "الرئيسية", icon: Compass },
    { id: "cases", label: "الحالات", icon: FolderOpen },
    { id: "saved", label: "المحفوظة", icon: Bookmark },
    { id: "profile", label: "حسابي", icon: User },
  ];

  return (
    <div
      className={`fixed bottom-4 inset-x-0 mx-auto w-[calc(100%-32px)] max-w-[400px] z-40 select-none ${className}`}
      dir="rtl"
    >
      <div className="p-1.5 rounded-full glass-light border border-[#130F08]/12 shadow-[0_16px_36px_rgba(19,15,8,0.12)] flex items-center justify-between">
        {items.map((item) => {
          const isActive = item.id === activeItem;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChange?.(item.id)}
              className={`relative z-10 h-12 px-3.5 rounded-full flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                isActive
                  ? "text-[#FAF6EF] font-semibold"
                  : "text-[#130F08]/65 hover:text-[#130F08]"
              }`}
            >
              {/* Spring-animated Sliding Dark Pill Indicator */}
              {isActive && (
                <motion.div
                  layoutId="active-floating-nav-pill"
                  transition={{
                    type: "spring",
                    stiffness: 420,
                    damping: 34,
                  }}
                  className="absolute inset-0 rounded-full bg-[#130F08] shadow-sm -z-10"
                />
              )}

              <Icon className="w-4 h-4 shrink-0" />
              {isActive && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.15 }}
                  className="text-xs font-semibold whitespace-nowrap"
                >
                  {item.label}
                </motion.span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

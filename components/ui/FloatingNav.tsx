"use client";

import React from "react";
import { motion } from "framer-motion";
import { Compass, FolderOpen, Bookmark, User } from "lucide-react";

export type NavItemKey = "home" | "cases" | "saved" | "profile";

export interface FloatingNavProps {
  activeItem?: NavItemKey;
  onChange?: (item: NavItemKey) => void;
  pinned?: boolean;
  className?: string;
}

export function FloatingNav({
  activeItem = "cases",
  onChange,
  pinned = true,
  className = "",
}: FloatingNavProps) {
  const items: {
    id: NavItemKey;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { id: "home", label: "الرئيسية", icon: Compass },
    { id: "cases", label: "الحالات", icon: FolderOpen },
    { id: "saved", label: "المحفوظة", icon: Bookmark },
    { id: "profile", label: "حسابي", icon: User },
  ];

  return (
    <nav
      className={`select-none ${
        pinned
          ? "fixed bottom-[calc(16px+var(--safe-bottom))] inset-x-0 mx-auto w-[calc(100%-32px)] max-w-[360px] z-40"
          : "w-full max-w-[360px] mx-auto"
      } ${className}`}
      dir="rtl"
      aria-label="التنقل الرئيسي"
    >
      <div className="p-1.5 rounded-full bawsala-glass-dark border border-stroke shadow-2xl flex items-center justify-between">
        {items.map((item) => {
          const isActive = item.id === activeItem;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChange?.(item.id)}
              className={`relative z-10 h-11 px-3.5 rounded-full flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                isActive
                  ? "text-sandstone font-semibold"
                  : "text-muted hover:text-sandstone"
              }`}
            >
              {/* Sliding lens highlight */}
              {isActive && (
                <motion.div
                  layoutId="floating-nav-sliding-lens"
                  transition={{
                    type: "spring",
                    stiffness: 380,
                    damping: 30,
                  }}
                  className="absolute inset-0 rounded-full bg-sandstone/15 border border-stroke shadow-inner -z-10"
                />
              )}

              <Icon className="w-4 h-4 shrink-0 stroke-[1.5]" />
              {isActive && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.15 }}
                  className="text-[13px] font-medium whitespace-nowrap"
                >
                  {item.label}
                </motion.span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

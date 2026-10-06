"use client";

import React from "react";
import { motion } from "framer-motion";
import { 
  CheckCircle2, 
  FileText, 
  Cpu, 
  TrendingUp, 
  Eye, 
  HelpCircle, 
  AlertTriangle 
} from "lucide-react";

export type CertaintyLevel = 
  | "confirmed" 
  | "reported" 
  | "derived" 
  | "inferred" 
  | "user_observed" 
  | "unknown" 
  | "conflicting";

interface CertaintyChipProps {
  level: CertaintyLevel;
  label?: string;
  size?: "sm" | "md";
  className?: string;
  variant?: "dark" | "paper";
}

const DARK_CONFIG: Record<
  CertaintyLevel,
  {
    defaultLabel: string;
    icon: React.ComponentType<{ className?: string }>;
    containerClass: string;
    iconClass: string;
  }
> = {
  confirmed: {
    defaultLabel: "مؤكد",
    icon: CheckCircle2,
    containerClass: "bg-[#14756E]/30 text-[#FAF6EF] font-semibold border border-[#14756E] shadow-xs",
    iconClass: "text-[#FAF6EF]",
  },
  reported: {
    defaultLabel: "مُبلّغ رسمياً",
    icon: FileText,
    containerClass: "bg-white/10 text-[#FAF6EF] border border-white/25 backdrop-blur-sm",
    iconClass: "text-[#FAF6EF]/90",
  },
  derived: {
    defaultLabel: "مستنتج حسابياً",
    icon: Cpu,
    containerClass: "bg-[#3D271A]/40 text-[#FAF6EF] border border-white/20 backdrop-blur-sm",
    iconClass: "text-[#FAF6EF]/80",
  },
  inferred: {
    defaultLabel: "مستقرأ نمطياً",
    icon: TrendingUp,
    containerClass: "bg-white/5 text-[#FAF6EF]/90 border border-white/20 border-dotted",
    iconClass: "text-white/60",
  },
  user_observed: {
    defaultLabel: "معاينة ميدانية",
    icon: Eye,
    containerClass: "bg-[#14756E] text-[#FAF6EF] border border-[#14756E] font-medium shadow-xs",
    iconClass: "text-[#FAF6EF]",
  },
  unknown: {
    defaultLabel: "غير محدد",
    icon: HelpCircle,
    containerClass: "bg-black/30 text-white/60 border border-white/30 border-dashed",
    iconClass: "text-white/60",
  },
  conflicting: {
    defaultLabel: "بيانات متعارضة",
    icon: AlertTriangle,
    containerClass: "bg-[#C2643A]/20 text-[#C2643A] border border-[#C2643A]/70 shadow-[0_0_12px_rgba(194,100,58,0.2)] font-semibold",
    iconClass: "text-[#C2643A] animate-pulse",
  },
};

const PAPER_CONFIG: Record<
  CertaintyLevel,
  {
    defaultLabel: string;
    icon: React.ComponentType<{ className?: string }>;
    containerClass: string;
    iconClass: string;
  }
> = {
  confirmed: {
    defaultLabel: "مؤكد",
    icon: CheckCircle2,
    containerClass: "bg-[#14756E]/12 text-[#14756E] font-semibold border border-[#14756E]/40 shadow-xs",
    iconClass: "text-[#14756E]",
  },
  reported: {
    defaultLabel: "مُبلّغ رسمياً",
    icon: FileText,
    containerClass: "bg-[#E9DFD0]/70 text-[#130F08] border border-[#130F08]/15",
    iconClass: "text-[#130F08]",
  },
  derived: {
    defaultLabel: "مستنتج حسابياً",
    icon: Cpu,
    containerClass: "bg-[#E9DFD0]/70 text-[#130F08] border border-[#130F08]/15",
    iconClass: "text-[#130F08]",
  },
  inferred: {
    defaultLabel: "مستقرأ نمطياً",
    icon: TrendingUp,
    containerClass: "bg-[#E9DFD0]/40 text-[#130F08]/80 border border-[#130F08]/20 border-dotted",
    iconClass: "text-[#130F08]/70",
  },
  user_observed: {
    defaultLabel: "مُحقق ميدانياً",
    icon: Eye,
    containerClass: "bg-[#14756E] text-[#FAF6EF] border border-[#14756E] font-semibold shadow-xs",
    iconClass: "text-[#FAF6EF]",
  },
  unknown: {
    defaultLabel: "غير محدد",
    icon: HelpCircle,
    containerClass: "bg-transparent text-[#130F08]/65 border border-[#130F08]/30 border-dashed",
    iconClass: "text-[#130F08]/65",
  },
  conflicting: {
    defaultLabel: "بيانات متعارضة",
    icon: AlertTriangle,
    containerClass: "bg-[#C2643A]/12 text-[#C2643A] border border-[#C2643A]/60 font-semibold",
    iconClass: "text-[#C2643A]",
  },
};

export function CertaintyChip({
  level,
  label,
  size = "md",
  className = "",
  variant = "paper",
}: CertaintyChipProps) {
  const configMap = variant === "paper" ? PAPER_CONFIG : DARK_CONFIG;
  const config = configMap[level] || configMap.unknown;
  const Icon = config.icon;
  const displayLabel = label || config.defaultLabel;

  const sizeClasses = 
    size === "sm" 
      ? "text-xs px-2.5 py-1 gap-1.5 rounded-full" 
      : "text-xs md:text-sm px-3.5 py-1.5 gap-2 rounded-full";

  return (
    <motion.span
      layout
      key={level}
      initial={{ scale: 0.95, opacity: 0.8 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className={`inline-flex items-center select-none transition-all duration-300 ${sizeClasses} ${config.containerClass} ${className}`}
    >
      <Icon className={size === "sm" ? "w-3.5 h-3.5 shrink-0" : "w-4 h-4 shrink-0"} />
      <span className="leading-none">{displayLabel}</span>
    </motion.span>
  );
}

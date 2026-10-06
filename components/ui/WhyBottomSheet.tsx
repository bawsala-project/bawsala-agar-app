"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, HelpCircle, Compass, ArrowLeft } from "lucide-react";
import { bottomSheetVariants, backdropVariants } from "@/lib/motion";

interface WhyBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children?: React.ReactNode;
}

export function WhyBottomSheet({
  isOpen,
  onClose,
  title = "لماذا تم اقتراح هذه التوصية؟",
  subtitle = "تحليل الأسباب والمعايير المعيارية لقرارك العقاري",
  children,
}: WhyBottomSheetProps) {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" dir="rtl">
          {/* Backdrop with soft blur */}
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
            className="fixed inset-0 bg-[#130F08]/80 backdrop-blur-md cursor-pointer"
          />

          {/* Bottom Sheet Modal */}
          <motion.div
            variants={bottomSheetVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={{ top: 0.05, bottom: 0.6 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 100 || info.velocity.y > 300) {
                onClose();
              }
            }}
            className="relative w-full max-w-lg bg-[#1E1712] border-t border-x border-[#645A4E]/30 rounded-t-[32px] shadow-[0_-20px_50px_rgba(19,15,8,0.7)] overflow-hidden max-h-[85vh] flex flex-col z-10"
          >
            {/* Top Drag Handle */}
            <div className="pt-3 pb-2 flex justify-center cursor-grab active:cursor-grabbing w-full">
              <div className="w-12 h-1.5 rounded-full bg-[#645A4E]/60 hover:bg-[#D7CBBE]/50 transition-colors" />
            </div>

            {/* Header */}
            <div className="px-6 pt-2 pb-4 flex items-center justify-between border-b border-[#645A4E]/20">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#D7CBBE]/10 border border-[#D7CBBE]/25 flex items-center justify-center text-[#D7CBBE]">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base md:text-lg font-medium text-[#D7CBBE]">
                    {title}
                  </h3>
                  {subtitle && (
                    <p className="text-xs text-[#645A4E] mt-0.5">{subtitle}</p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-[#645A4E]/20 hover:bg-[#645A4E]/40 text-[#D7CBBE] flex items-center justify-center transition-colors cursor-pointer"
                aria-label="إغلاق النافذة"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Sheet Body Content */}
            <div className="p-6 overflow-y-auto space-y-4 text-sm text-[#D7CBBE]/90">
              {children || (
                <>
                  <div className="p-4 rounded-xl bg-[#3D271A]/40 border border-[#645A4E]/25 space-y-2">
                    <div className="flex items-center gap-2 text-[#D7CBBE] font-medium text-xs">
                      <Compass className="w-4 h-4 text-[#D7CBBE]" />
                      <span>معيار التقييم المنهجي</span>
                    </div>
                    <p className="text-xs md:text-sm text-[#D7CBBE]/80 leading-relaxed">
                      يعتمد نموذج بوصلة على تحليل ثلاث طبقات متوازية: القيمة السوقية العادلة مقارنة بصفقات الحي الأخيرة، ومعدل نمو البنية التحتية المحيطة، وتوافق المواصفات الهندسية مع أهدافك الاستثمارية.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-xs uppercase tracking-wider text-[#645A4E] font-medium">
                      المحاور المؤثرة في هذا القرار
                    </h4>
                    <ul className="space-y-2 text-xs md:text-sm">
                      <li className="flex items-start gap-2.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#D7CBBE] mt-2 shrink-0" />
                        <span>متوسط سعر المتر في النطاق الجغرافي المباشر يقل بنسبة 8% عن متوسط المخطط.</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#D7CBBE] mt-2 shrink-0" />
                        <span>توثيق رسمي لجاهزية شبكة الخدمات والمرافق الأساسية.</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#A8643C] mt-2 shrink-0" />
                        <span className="text-[#D7CBBE]">ملاحظة: البيانات التاريخية لعمر العقار ما زالت تتطلب تدقيقاً ميدانياً.</span>
                      </li>
                    </ul>
                  </div>
                </>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="p-6 pt-3 border-t border-[#645A4E]/20 bg-[#1E1712]">
              <button
                type="button"
                onClick={onClose}
                className="w-full h-12 rounded-xl bg-[#D7CBBE] text-[#130F08] font-medium text-sm flex items-center justify-center gap-2 hover:bg-[#D7CBBE]/90 transition-all cursor-pointer"
              >
                <span>فهمت، العودة للتحليل</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/**
 * Trigger Button for the "لماذا؟" Bottom Sheet
 */
interface WhySheetTriggerProps {
  onClick: () => void;
  label?: string;
  className?: string;
  size?: "sm" | "md";
}

export function WhySheetTrigger({
  onClick,
  label = "لماذا؟",
  className = "",
  size = "md",
}: WhySheetTriggerProps) {
  const isSm = size === "sm";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center justify-center font-medium transition-all cursor-pointer select-none rounded-full border border-[#D7CBBE]/30 bg-[#D7CBBE]/10 hover:bg-[#D7CBBE]/20 text-[#D7CBBE] active:scale-95 ${
        isSm ? "px-2.5 py-1 text-xs gap-1" : "px-3.5 py-1.5 text-xs md:text-sm gap-1.5"
      } ${className}`}
      aria-label="عرض توضيح لماذا تم اتخاذ هذا القرار"
    >
      <HelpCircle className={isSm ? "w-3 h-3" : "w-3.5 h-3.5"} />
      <span className="leading-none">{label}</span>
    </button>
  );
}

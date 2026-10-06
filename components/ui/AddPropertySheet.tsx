"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Link2, Image as ImageIcon, PenLine, Upload, Check } from "lucide-react";
import { bottomSheetVariants, backdropVariants } from "@/lib/motion";
import { useAppStore } from "@/lib/store";
import { COPY } from "@/lib/copy";
import { PrimaryButton } from "./PrimaryButton";

export function AddPropertySheet() {
  const { isAddSheetOpen, setAddSheetOpen, addProperty, properties } = useAppStore();

  const [activeTab, setActiveTab] = useState<"link" | "screenshot" | "manual">("link");
  const [url, setUrl] = useState("https://aqar.fm/ad/5928192");
  const [isUploading, setIsUploading] = useState(false);
  const [manualTitle, setManualTitle] = useState("شقة في حي حطين");
  const [manualPrice, setManualPrice] = useState("890,000");
  const [manualArea, setManualArea] = useState("145");

  const handleClose = () => setAddSheetOpen(false);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (properties.length >= 5) {
      handleClose();
      return;
    }

    if (activeTab === "link") {
      addProperty({
        title: "شقة في حي حطين",
        price: 890000,
        formattedPrice: "890,000 ر.س",
        areaM2: 145,
        rooms: 3,
        district: "حطين، شمال الرياض",
        source: "link",
        sourceLabel: "رابط معلن",
      });
    } else if (activeTab === "screenshot") {
      addProperty({
        title: "شقة في حي الصحافة",
        price: 860000,
        formattedPrice: "860,000 ر.س",
        areaM2: 150,
        rooms: 3,
        district: "الصحافة، شمال الرياض",
        source: "screenshot",
        sourceLabel: "لقطة شاشة",
      });
    } else {
      const priceNum = Number(manualPrice.replace(/[^0-9]/g, "")) || 850000;
      addProperty({
        title: manualTitle || "شقة مدخلة يدوياً",
        price: priceNum,
        formattedPrice: `${priceNum.toLocaleString("en-US")} ر.س`,
        areaM2: Number(manualArea) || 140,
        rooms: 3,
        district: "شمال الرياض",
        source: "manual",
        sourceLabel: "إدخال يدوي",
      });
    }

    handleClose();
  };

  return (
    <AnimatePresence>
      {isAddSheetOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" dir="rtl">
          {/* Backdrop */}
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={handleClose}
            className="fixed inset-0 bg-[#130F08]/40 backdrop-blur-md cursor-pointer"
          />

          {/* Modal */}
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
                handleClose();
              }
            }}
            className="relative w-full max-w-lg bg-[#FAF6EF] border-t border-x border-[#E9DFD0] rounded-t-[32px] shadow-[0_-20px_60px_rgba(19,15,8,0.15)] overflow-hidden max-h-[90vh] flex flex-col z-10 text-[#130F08]"
          >
            {/* Grabber */}
            <div className="pt-3 pb-2 flex justify-center cursor-grab active:cursor-grabbing w-full">
              <div className="w-12 h-1.5 rounded-full bg-[#E9DFD0] hover:bg-[#130F08]/30 transition-colors" />
            </div>

            {/* Header */}
            <div className="px-6 pt-2 pb-4 flex items-center justify-between border-b border-[#E9DFD0]">
              <div>
                <h3 className="text-base md:text-lg font-semibold text-[#130F08]">
                  {COPY.properties.sheetAddTitle}
                </h3>
                <p className="text-xs text-[#130F08]/80">
                  {COPY.properties.sheetAddSubtitle}
                </p>
              </div>

              <button
                type="button"
                onClick={handleClose}
                className="w-9 h-9 rounded-full glass-light border border-[#130F08]/10 text-[#130F08] flex items-center justify-center transition-colors cursor-pointer hover:bg-[#E9DFD0]/60"
                aria-label="إغلاق"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Method Tabs (Normalized 40px Pill buttons) */}
            <div className="px-6 pt-4">
              <div className="grid grid-cols-3 gap-2 p-1 rounded-full glass-light border border-[#130F08]/10">
                <button
                  type="button"
                  onClick={() => setActiveTab("link")}
                  className={`h-10 px-3 rounded-full text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                    activeTab === "link"
                      ? "bg-[#130F08] text-[#FAF6EF] shadow-xs"
                      : "text-[#130F08]/80 hover:text-[#130F08]"
                  }`}
                >
                  <Link2 className="w-3.5 h-3.5" />
                  <span>رابط</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("screenshot")}
                  className={`h-10 px-3 rounded-full text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                    activeTab === "screenshot"
                      ? "bg-[#130F08] text-[#FAF6EF] shadow-xs"
                      : "text-[#130F08]/80 hover:text-[#130F08]"
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>صورة / لقطة</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("manual")}
                  className={`h-10 px-3 rounded-full text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                    activeTab === "manual"
                      ? "bg-[#130F08] text-[#FAF6EF] shadow-xs"
                      : "text-[#130F08]/80 hover:text-[#130F08]"
                  }`}
                >
                  <PenLine className="w-3.5 h-3.5" />
                  <span>يدوي</span>
                </button>
              </div>
            </div>

            {/* Tab Forms */}
            <div className="p-6 space-y-5">
              {activeTab === "link" && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[#130F08]/80 block">رابط إعلان العقار</label>
                    <div className="flex gap-2" dir="ltr">
                      <input
                        type="url"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://..."
                        className="flex-1 h-14 px-4 rounded-2xl bg-white border border-[#E9DFD0] text-sm font-sans tabular-nums text-[#130F08] focus:border-[#14756E] focus:outline-none shadow-xs"
                      />
                      <button
                        type="button"
                        onClick={() => setUrl("https://aqar.fm/ad/682910")}
                        className="px-5 h-14 rounded-2xl glass-light border border-[#130F08]/15 text-xs font-semibold text-[#130F08] hover:bg-[#E9DFD0]/60 shrink-0 cursor-pointer shadow-xs"
                      >
                        لصق
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-[#130F08]/80 leading-relaxed">
                    ندعم استيراد الروابط من منصة عقار، زاهب، ديل، والمواقع العقارية المعتمدة.
                  </p>
                </div>
              )}

              {activeTab === "screenshot" && (
                <div className="space-y-4">
                  <div
                    onClick={() => setIsUploading(true)}
                    className="p-8 rounded-2xl border-2 border-dashed border-[#E9DFD0] bg-white/60 flex flex-col items-center justify-center gap-2.5 cursor-pointer hover:border-[#14756E] transition-colors text-center"
                  >
                    <div className="w-12 h-12 rounded-full glass-light border border-[#130F08]/10 flex items-center justify-center text-[#14756E]">
                      {isUploading ? <Check className="w-5 h-5 text-[#14756E]" /> : <Upload className="w-5 h-5" />}
                    </div>
                    <span className="text-xs text-[#130F08] font-semibold">
                      {isUploading ? "تم التعرف على لقطة الإعلان" : "اضغط لرفع لقطة الشاشة أو صورة العرض"}
                    </span>
                    <span className="text-xs text-[#130F08]/75">
                      JPG, PNG حتى 10 ميجابايت
                    </span>
                  </div>
                </div>
              )}

              {activeTab === "manual" && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-[#130F08]/75 block">عنوان الشقة / الموقع</label>
                    <input
                      type="text"
                      value={manualTitle}
                      onChange={(e) => setManualTitle(e.target.value)}
                      className="w-full h-12 px-4 rounded-xl bg-white border border-[#E9DFD0] text-sm text-[#130F08] focus:border-[#14756E] focus:outline-none shadow-xs"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-[#130F08]/75 block">السعر (ر.س)</label>
                      <input
                        type="text"
                        value={manualPrice}
                        onChange={(e) => setManualPrice(e.target.value)}
                        className="w-full h-12 px-4 rounded-xl bg-white border border-[#E9DFD0] text-sm font-sans tabular-nums text-[#130F08] focus:border-[#14756E] focus:outline-none shadow-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-[#130F08]/75 block">المساحة (م²)</label>
                      <input
                        type="text"
                        value={manualArea}
                        onChange={(e) => setManualArea(e.target.value)}
                        className="w-full h-12 px-4 rounded-xl bg-white border border-[#E9DFD0] text-sm font-sans tabular-nums text-[#130F08] focus:border-[#14756E] focus:outline-none shadow-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              <PrimaryButton
                onClick={() => handleSubmit()}
                fullWidth
                label="إضافة العقار للتحليل"
                className="mt-4"
              />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Building,
  Clock,
  Sparkles,
  ArrowLeft,
  Trash2,
  FolderOpen,
  MoreVertical,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PropertyImage } from "@/components/ui/PropertyImage";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { FloatingNav, NavItemKey } from "@/components/ui/FloatingNav";
import { BdiNumber } from "@/lib/format";
import { useAppStore } from "@/lib/store";
import { COPY } from "@/lib/copy";
import { getCoverImageForProperty } from "@/lib/images";

export default function DashboardPage() {
  const router = useRouter();
  const { savedCases, deleteCase, isReassessed, showToast } = useAppStore();

  const [activeNavItem, setActiveNavItem] = useState<NavItemKey>("cases");
  const [activeMenuCaseId, setActiveMenuCaseId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    deleteCase(id);
    setDeleteConfirmId(null);
    setActiveMenuCaseId(null);
    showToast("تم حذف الحالة بنجاح");
  };

  const handleNavChange = (key: NavItemKey) => {
    setActiveNavItem(key);
    if (key === "home") {
      router.push("/");
    } else if (key === "saved") {
      router.push("/case/demo/results");
    }
  };

  return (
    <AppShell backHref="/case/demo/results" pageTitle="لوحة الحالات">
      <div
        className="relative z-10 flex-1 flex flex-col justify-between px-4 pt-4 pb-36 max-w-lg mx-auto w-full text-right"
        dir="rtl"
      >
        <div className="space-y-4">
          {/* Greeting & Headline (Content Budget: 1 headline, 1 supporting line) */}
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-[#14756E] block">
                لوحة الحالات // مركز القرار
              </span>
              <h1 className="text-2xl font-bold text-[#130F08]">
                أهلاً بك، مصطفى
              </h1>
              <p className="text-xs text-[#130F08]/70">
                تابع تقدم قراراتك العقارية واستكمل المقارنات المحفوظة
              </p>
            </div>

            {/* Remaining Quota Glass Chip */}
            <div className="h-10 px-3.5 rounded-full glass-light border border-[#E9DFD0] text-xs text-[#130F08] font-semibold flex items-center gap-1.5 shrink-0 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-[#14756E]" />
              <span>{COPY.dashboard.remainingQuota}</span>
            </div>
          </div>

          {/* BLOCK 1: Hero Case Card with Photo & Single Primary CTA */}
          <div className="p-4 rounded-3xl bg-white border border-[#E9DFD0] shadow-sm space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#14756E]">
                الحالة النشطة الحالية
              </span>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#14756E]/15 text-[#14756E] font-semibold">
                {isReassessed ? "تمت المعاينة الميدانية" : "جاهز للقرار"}
              </span>
            </div>

            {/* Photo + Case Info */}
            <div className="flex items-center gap-3">
              <div className="relative w-24 h-24 rounded-2xl overflow-hidden shrink-0 border border-[#E9DFD0] bg-[#FAF6EF]">
                <PropertyImage
                  image={getCoverImageForProperty("p1")}
                  shape="rect"
                  tone="sandstone"
                  alt="شقة عائلية في شمال الرياض"
                  containerClassName="w-full h-full"
                />
              </div>

              <div className="space-y-1 flex-1 min-w-0">
                <h2 className="text-sm font-bold text-[#130F08] truncate">
                  شقة عائلية في شمال الرياض
                </h2>
                <div className="text-xs text-[#130F08]/80 font-medium">
                  الميزانية: <BdiNumber value="900,000" unit="ر.س" />
                </div>

                {/* Max 3 Chips */}
                <div className="flex items-center gap-1.5 pt-0.5 flex-wrap">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FAF6EF] border border-[#E9DFD0] text-[#130F08] font-medium">
                    الرياض
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FAF6EF] border border-[#E9DFD0] text-[#130F08] font-medium">
                    3 عقارات
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#14756E]/10 text-[#14756E] font-semibold flex items-center gap-0.5">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    <span>مكتمل 100%</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Primary CTA (at least 48px) */}
            <div className="pt-1">
              <PrimaryButton
                label="استكمال ومراجعة النتيجة"
                icon={ArrowLeft}
                onClick={() =>
                  router.push(isReassessed ? "/case/demo/reassess" : "/case/demo/results")
                }
                className="w-full h-12 rounded-full text-sm font-semibold shadow-md"
              />
            </div>
          </div>

          {/* BLOCK 2: Two Quick Actions (>= 48px tap targets) */}
          <div className="grid grid-cols-2 gap-2.5">
            {/* Action 1: New Case */}
            <Link
              href="/start"
              className="min-h-[64px] p-3.5 rounded-2xl glass-light border border-[#E9DFD0] hover:border-[#14756E]/40 transition-all flex items-center gap-3 cursor-pointer group shadow-2xs active:scale-98"
            >
              <div className="w-12 h-12 rounded-full glass-light border border-white/80 flex items-center justify-center text-[#14756E] group-hover:scale-105 transition-transform shrink-0 shadow-2xs">
                <Plus className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-[#130F08] block">
                  حالة جديدة
                </span>
                <span className="text-[11px] text-[#130F08]/65 block">
                  بدء قرار جديد
                </span>
              </div>
            </Link>

            {/* Action 2: Add Property */}
            <Link
              href="/case/demo/properties"
              className="min-h-[64px] p-3.5 rounded-2xl glass-light border border-[#E9DFD0] hover:border-[#14756E]/40 transition-all flex items-center gap-3 cursor-pointer group shadow-2xs active:scale-98"
            >
              <div className="w-12 h-12 rounded-full glass-light border border-white/80 flex items-center justify-center text-[#14756E] group-hover:scale-105 transition-transform shrink-0 shadow-2xs">
                <Building className="w-5 h-5 stroke-[2]" />
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-[#130F08] block">
                  إضافة عقار
                </span>
                <span className="text-[11px] text-[#130F08]/65 block">
                  تضمين بديل
                </span>
              </div>
            </Link>
          </div>

          {/* BLOCK 3: Recent Cases as Photo Cards (Max 3 Chips per Card) */}
          <div className="space-y-2.5">
            <span className="text-xs font-bold text-[#130F08]/75 block">
              سجل الحالات والمقارنات السابقة:
            </span>

            {savedCases.map((c, idx) => {
              const isDemo = c.id === "demo";
              const isMenuOpen = activeMenuCaseId === c.id;

              return (
                <div
                  key={c.id}
                  className="p-3.5 rounded-2xl bg-white border border-[#E9DFD0] shadow-xs relative"
                >
                  <div className="flex items-center gap-3">
                    {/* Photo Card Thumbnail */}
                    <div className="w-18 h-20 rounded-xl overflow-hidden shrink-0 border border-[#E9DFD0] bg-[#FAF6EF]">
                      <PropertyImage
                        image={c.id === "demo" ? getCoverImageForProperty("p1") : getCoverImageForProperty("p2")}
                        shape="rect"
                        tone={c.id === "demo" ? "sandstone" : "cocoa"}
                        alt={c.title}
                        priority={idx === 0}
                        containerClassName="w-full h-full"
                      />
                    </div>

                    {/* Content Details */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between">
                        {/* Max 3 Chips: City, Count, Status */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FAF6EF] border border-[#E9DFD0] text-[#130F08] font-semibold">
                            {c.city}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#14756E]/10 text-[#14756E] font-medium">
                            {c.status}
                          </span>
                        </div>

                        {/* Kebab Menu */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setActiveMenuCaseId(isMenuOpen ? null : c.id)}
                            className="w-10 h-10 rounded-full hover:bg-black/5 text-[#130F08] flex items-center justify-center cursor-pointer transition-colors"
                            aria-label="خيارات الحالة"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          <AnimatePresence>
                            {isMenuOpen && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="absolute left-0 mt-1 w-36 rounded-2xl bg-white border border-[#E9DFD0] shadow-lg py-1.5 z-30 text-right"
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuCaseId(null);
                                    router.push("/case/demo/results");
                                  }}
                                  className="w-full px-3.5 py-2.5 text-xs text-[#130F08] hover:bg-[#FAF6EF] flex items-center gap-2 cursor-pointer font-medium"
                                >
                                  <FolderOpen className="w-3.5 h-3.5 text-[#14756E]" />
                                  <span>فتح الحالة</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuCaseId(null);
                                    setDeleteConfirmId(c.id);
                                  }}
                                  className="w-full px-3.5 py-2.5 text-xs text-[#C2643A] hover:bg-[#FAF6EF] flex items-center gap-2 cursor-pointer font-medium"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-[#C2643A]" />
                                  <span>حذف الحالة</span>
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>

                      <h3 className="text-xs font-bold text-[#130F08] truncate">
                        {c.title}
                      </h3>

                      <p className="text-[11px] text-[#130F08]/70">
                        السقف: <BdiNumber value={c.budget} />
                      </p>

                      <div className="pt-0.5 flex items-center justify-between">
                        <span className="text-[10px] text-[#130F08]/50 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[#14756E]" />
                          <span>{c.lastUpdated}</span>
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            router.push(
                              isDemo
                                ? isReassessed
                                  ? "/case/demo/reassess"
                                  : "/case/demo/results"
                                : "/case/demo/results"
                            )
                          }
                          className="h-9 px-3 rounded-lg text-xs font-semibold text-[#14756E] hover:bg-[#14756E]/10 transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <span>عرض</span>
                          <ArrowLeft className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Floating Glass Navigation Bar */}
        <FloatingNav
          activeItem={activeNavItem}
          onChange={handleNavChange}
        />
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6" dir="rtl">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteConfirmId(null)}
              className="fixed inset-0 bg-[#130F08]/50 backdrop-blur-sm cursor-pointer"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm p-6 rounded-3xl bg-white border border-[#E9DFD0] shadow-2xl space-y-4 z-10 text-right"
            >
              <div className="flex items-center gap-2.5 text-[#C2643A]">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <h3 className="text-base font-semibold text-[#130F08]">
                  تأكيد حذف الحالة
                </h3>
              </div>
              <p className="text-xs text-[#130F08]/80 leading-relaxed font-normal">
                هل أنت متأكد من رغبتك في حذف هذه الحالة العقارية المحفوظة؟ لن تتمكن من استرجاع الملاحظات الميدانية.
              </p>
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleDelete(deleteConfirmId)}
                  className="flex-1 h-12 rounded-full bg-[#C2643A] text-white text-xs font-semibold hover:bg-[#C2643A]/90 transition-colors cursor-pointer"
                >
                  حذف الحالة
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteConfirmId(null)}
                  className="px-5 h-12 rounded-full bg-[#E9DFD0] text-[#130F08] text-xs font-semibold hover:bg-[#E9DFD0]/80 transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AppShell>
  );
}

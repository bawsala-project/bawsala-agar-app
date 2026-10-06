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
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PaperCard } from "@/components/ui/PaperCard";
import { PropertyImage } from "@/components/ui/PropertyImage";
import { TickRing } from "@/components/ui/TickRing";
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
      <div className="flex-1 flex flex-col justify-between px-5 pt-6 pb-36 max-w-lg mx-auto w-full text-right">
        <div className="space-y-6">
          {/* Header Greeting & Quota Badge */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-start justify-between gap-3"
          >
            <div className="space-y-1">
              <span className="eyebrow-caption text-[#14756E] block">
                لوحة الحالات // مركز القرار
              </span>
              <h1 className="text-[28px] font-semibold text-[#130F08] leading-[1.3] tracking-tight">
                أهلاً بك، مصطفى
              </h1>
              <p className="text-xs text-[#130F08]/75 font-normal">
                {COPY.dashboard.title}
              </p>
            </div>

            {/* Remaining Quota Glass Chip */}
            <div className="px-3.5 py-1.5 rounded-full glass-light border border-[#E9DFD0] text-xs text-[#130F08] font-semibold flex items-center gap-1.5 shrink-0 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-[#14756E]" />
              <span>{COPY.dashboard.remainingQuota}</span>
            </div>
          </motion.div>

          {/* "Continue Your Case" Hero Card with Mini TickRing */}
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="p-5 rounded-3xl bg-white border border-[#E9DFD0] shadow-sm relative overflow-hidden space-y-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#14756E] block">
                الحالة النشطة الحالية
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#14756E]/15 text-[#14756E] font-semibold">
                {isReassessed ? "تمت المعاينة الميدانية" : "جاهز لاتخاذ القرار"}
              </span>
            </div>

            <div className="flex items-center gap-4">
              {/* Mini TickRing */}
              <div className="shrink-0">
                <TickRing progress={100} size={64}>
                  <BdiNumber value="100%" className="text-xs font-bold text-[#130F08]" />
                </TickRing>
              </div>

              {/* Case Details */}
              <div className="flex-1 min-w-0 space-y-1">
                <h3 className="text-base font-semibold text-[#130F08] truncate">
                  شقة عائلية في شمال الرياض
                </h3>
                <p className="text-xs text-[#130F08]/75">
                  سقف الميزانية: <BdiNumber value="900,000" unit="ر.س" /> • 3 عقارات مفحوصة
                </p>
              </div>
            </div>

            {/* Quick Action Button: 40px Full Pill */}
            <div className="pt-2 border-t border-[#E9DFD0] flex items-center justify-between">
              <span className="text-xs text-[#130F08]/65 flex items-center gap-1 font-sans">
                <Clock className="w-3.5 h-3.5 text-[#14756E]" />
                <span>قبل 10 دقائق</span>
              </span>

              <button
                type="button"
                onClick={() =>
                  router.push(
                    isReassessed ? "/case/demo/reassess" : "/case/demo/results"
                  )
                }
                className="h-10 px-4 rounded-full bg-gradient-to-r from-[#E3A83A] to-[#F0C060] text-[#130F08] text-xs font-semibold hover:brightness-105 transition-all flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
              >
                <span>استكمال ومراجعة النتيجة</span>
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>

          {/* Two Quick Actions (حالة جديدة، إضافة عقار) with 48px Glass Circles */}
          <div className="grid grid-cols-2 gap-3">
            {/* Quick Action 1: حالة جديدة */}
            <Link
              href="/start"
              className="p-4 rounded-3xl glass-light border border-[#E9DFD0] hover:border-[#14756E]/40 transition-all flex items-center gap-3 cursor-pointer group shadow-2xs active:scale-98"
            >
              <div className="w-12 h-12 rounded-full glass-light border border-white/80 flex items-center justify-center text-[#14756E] group-hover:scale-105 transition-transform shrink-0 shadow-2xs">
                <Plus className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold text-[#130F08] block">
                  حالة جديدة
                </span>
                <span className="text-xs text-[#130F08]/65 block">
                  بدء قرار جديد
                </span>
              </div>
            </Link>

            {/* Quick Action 2: إضافة عقار */}
            <Link
              href="/case/demo/properties"
              className="p-4 rounded-3xl glass-light border border-[#E9DFD0] hover:border-[#14756E]/40 transition-all flex items-center gap-3 cursor-pointer group shadow-2xs active:scale-98"
            >
              <div className="w-12 h-12 rounded-full glass-light border border-white/80 flex items-center justify-center text-[#14756E] group-hover:scale-105 transition-transform shrink-0 shadow-2xs">
                <Building className="w-5 h-5 stroke-[2]" />
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold text-[#130F08] block">
                  إضافة عقار
                </span>
                <span className="text-xs text-[#130F08]/65 block">
                  تضمين بديل للمفاضلة
                </span>
              </div>
            </Link>
          </div>

          {/* Horizontal Capsule/Arch Case Cards */}
          <div className="space-y-3">
            <span className="text-xs text-[#130F08]/65 font-medium block">
              سجل الحالات والمقارنات المحفوظة:
            </span>

            {savedCases.map((c, idx) => {
              const isDemo = c.id === "demo";
              const isMenuOpen = activeMenuCaseId === c.id;

              return (
                <motion.div
                  key={c.id}
                  layout
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: idx * 0.06 }}
                >
                  <PaperCard className="p-4 space-y-3 shadow-xs border border-[#E9DFD0]">
                    <div className="flex items-center gap-3.5">
                      {/* Horizontal Arch/Capsule PropertyImage Thumbnail */}
                      <div className="w-16 h-20 shrink-0">
                        <PropertyImage
                          image={c.id === "demo" ? getCoverImageForProperty("p1") : undefined}
                          shape="arch"
                          tone="sandstone"
                          alt={c.title}
                          priority={idx === 0}
                          containerClassName="w-16 h-20 shadow-xs"
                        />
                      </div>

                      {/* Content Body */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#E9DFD0] text-[#130F08] font-semibold">
                            {c.city}
                          </span>

                          {/* Kebab Menu */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setActiveMenuCaseId(isMenuOpen ? null : c.id)}
                              className="w-8 h-8 rounded-full hover:bg-black/5 text-[#130F08] flex items-center justify-center cursor-pointer transition-colors"
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
                                    className="w-full px-3.5 py-2 text-xs text-[#130F08] hover:bg-[#FAF6EF] flex items-center gap-2 cursor-pointer font-medium"
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
                                    className="w-full px-3.5 py-2 text-xs text-[#C2643A] hover:bg-[#FAF6EF] flex items-center gap-2 cursor-pointer font-medium"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 text-[#C2643A]" />
                                    <span>حذف الحالة</span>
                                  </button>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>

                        <h3 className="text-sm font-semibold text-[#130F08] truncate">
                          {c.title}
                        </h3>

                        <p className="text-xs text-[#130F08]/75">
                          السقف: <BdiNumber value={c.budget} /> • 3 خيارات
                        </p>

                        <div className="pt-1 flex items-center justify-between">
                          <span className="text-xs text-[#130F08]/65 font-sans">
                            {c.lastUpdated}
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
                            className="text-xs font-semibold text-[#14756E] hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <span>فتح المراجعة</span>
                            <ArrowLeft className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </PaperCard>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Floating Bottom Navigation Bar */}
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


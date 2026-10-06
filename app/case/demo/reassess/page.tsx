"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PaperCard } from "@/components/ui/PaperCard";
import { CertaintyChip } from "@/components/ui/CertaintyChip";
import { ScopeTag } from "@/components/ui/ScopeTag";
import { CompassIcon } from "@/components/brand/CompassIcon";
import { NeedleBadge } from "@/components/ui/NeedleBadge";
import { WhyBottomSheet, WhySheetTrigger } from "@/components/ui/WhyBottomSheet";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { useAppStore } from "@/lib/store";
import { COPY } from "@/lib/copy";
import { BdiNumber, formatNumber } from "@/lib/format";

export default function ReassessPage() {
  const router = useRouter();
  const {
    properties,
    isReassessed,
    applyReassessment,
    setLoginSheetOpen,
  } = useAppStore();

  const [isAnalyzing, setIsAnalyzing] = useState(!isReassessed);
  const [isWhyOpen, setIsWhyOpen] = useState(false);

  useEffect(() => {
    if (!isReassessed) {
      const timer = setTimeout(() => {
        applyReassessment();
        setIsAnalyzing(false);
      }, 2200);
      return () => clearTimeout(timer);
    }
  }, [isReassessed, applyReassessment]);

  const displayedProperties = [...properties].sort((a, b) => {
    const rankA = isReassessed ? a.postRank : a.preRank;
    const rankB = isReassessed ? b.postRank : b.preRank;
    return rankA - rankB;
  });

  return (
    <AppShell backHref="/case/demo/inspection" pageTitle={COPY.reassess.title}>
      <div className="flex-1 flex flex-col justify-between px-5 pt-6 pb-32 max-w-lg mx-auto w-full">
        <AnimatePresence mode="wait">
          {isAnalyzing ? (
            /* Compact Analyzing Moment */
            <motion.div
              key="analyzing-moment"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center py-24 text-center space-y-6"
            >
              <div className="relative w-28 h-28 rounded-full glass-light border border-[#130F08]/10 flex items-center justify-center shadow-lg">
                <motion.div
                  animate={{ rotate: [-40, 50, -20, 30, 0] }}
                  transition={{ duration: 2.0, ease: "easeInOut" }}
                  className="text-[#14756E]"
                >
                  <CompassIcon size={52} />
                </motion.div>
                <div className="absolute inset-0 rounded-full border-2 border-[#E9DFD0] border-t-[#14756E] animate-spin" />
              </div>

              <div className="space-y-2 max-w-xs">
                <h3 className="text-lg font-semibold text-[#130F08]">
                  {COPY.reassess.analyzingMini}
                </h3>
                <p className="text-xs text-[#130F08]/70 leading-relaxed font-normal">
                  {COPY.reassess.subtitle}
                </p>
              </div>
            </motion.div>
          ) : (
            /* Reassessment Content */
            <motion.div
              key="reassess-content"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-6 text-right"
            >
              {/* Header */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#FAF6EF] border border-[#E9DFD0] text-[#130F08] font-medium">
                    تحديث بعد الفحص الميداني
                  </span>
                  <span className="text-xs text-[#130F08]/40">•</span>
                  <span className="text-xs text-[#130F08]/75">3 عقارات معاد ترتيبها</span>
                </div>
                <h1 className="text-2xl md:text-[28px] font-semibold text-[#130F08]">
                  {COPY.reassess.title}
                </h1>
                <p className="text-xs text-[#130F08]/70 leading-relaxed font-normal">
                  {COPY.reassess.subtitle}
                </p>
              </div>

              {/* Block 1: Findings Chips */}
              <PaperCard className="p-4 space-y-3 shadow-xs border border-[#E9DFD0]">
                <div className="flex items-center justify-between border-b border-[#E9DFD0] pb-2">
                  <span className="text-xs font-semibold text-[#130F08] flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#14756E]" />
                    <span>{COPY.reassess.sectionFindings}</span>
                  </span>
                  <span className="text-xs text-[#130F08]/60">نتائج الفحص</span>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {/* Finding 1: Copper Roof Leak Problem on P1 */}
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#C2643A]/12 border border-[#C2643A]/40 text-[#130F08] text-xs font-semibold">
                    <AlertTriangle className="w-3.5 h-3.5 text-[#C2643A] shrink-0" />
                    <span>شقة الياسمين: رصد تسرب ورطوبة في سقف الممر</span>
                  </div>

                  {/* Finding 2: Area confirmed */}
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[#E9DFD0] text-[#130F08] text-xs font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#14756E] shrink-0" />
                    <span>شقة الياسمين: تأكيد المساحة الصافية <BdiNumber value="148" unit="م²" /></span>
                  </div>

                  {/* Finding 3: Noise isolation good */}
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[#E9DFD0] text-[#130F08] text-xs font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#14756E] shrink-0" />
                    <span>العزل الصوتي وتدفق المياه بحالة ممتازة</span>
                  </div>
                </div>
              </PaperCard>

              {/* Block 2: Layout-Animated Rank Reorder */}
              <PaperCard className="p-4 space-y-4 shadow-xs border border-[#E9DFD0]">
                <div className="flex items-center justify-between border-b border-[#E9DFD0] pb-2">
                  <span className="text-xs font-semibold text-[#130F08] flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-[#14756E]" />
                    <span>{COPY.reassess.sectionRankChange}</span>
                  </span>
                  <span className="text-xs font-semibold text-[#C2643A]">
                    تغيّر في الترتيب ومستوى الاطمئنان
                  </span>
                </div>

                {/* Animated Reordering Cards */}
                <div className="space-y-2.5">
                  {displayedProperties.map((prop) => {
                    const currentRank = prop.postRank;
                    const isNewWinner = prop.id === "p3";
                    const isDemoted = prop.id === "p1";

                    return (
                      <motion.div
                        key={prop.id}
                        layout
                        transition={{
                          type: "spring",
                          stiffness: 140,
                          damping: 20,
                        }}
                        className={`p-3 rounded-2xl border flex items-center justify-between transition-colors ${
                          isNewWinner
                            ? "bg-[#130F08] text-[#FAF6EF] border-[#130F08] shadow-sm"
                            : isDemoted
                            ? "bg-[#C2643A]/10 border-[#C2643A]/40 text-[#130F08]"
                            : "bg-white border-[#E9DFD0] text-[#130F08]"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <NeedleBadge rank={currentRank as 1 | 2 | 3} size="sm" />
                          <div>
                            <span className="text-xs font-semibold block">
                              #{currentRank} • {prop.title}
                            </span>
                            <span
                              className={`text-xs block font-medium ${
                                isNewWinner ? "text-[#FAF6EF]/80" : "text-[#130F08]/65"
                              }`}
                            >
                              {prop.district} • <BdiNumber value={formatNumber(prop.price)} unit="ر.س" />
                            </span>
                          </div>
                        </div>

                        {/* Status Label */}
                        <div>
                          {isNewWinner && (
                            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#14756E] text-[#FAF6EF] font-semibold">
                              المركز الأول الجديد ↑
                            </span>
                          )}
                          {isDemoted && (
                            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#C2643A]/20 text-[#C2643A] font-semibold">
                              تراجع للمركز الثاني ↓
                            </span>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Shrinking Confidence Arc for P1 */}
                <div className="p-4 rounded-2xl bg-[#C2643A]/10 border border-[#C2643A]/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="w-4 h-4 text-[#C2643A]" />
                      <span className="text-xs font-semibold text-[#130F08]">
                        شقة حي الياسمين: تراجع مستوى الاطمئنان
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-[#C2643A]">
                      <BdiNumber value="80% ← 35%" />
                    </span>
                  </div>

                  {/* Shrinking Confidence Arc Component */}
                  <div className="space-y-1.5">
                    <div className="w-full h-2 rounded-full bg-[#E9DFD0] overflow-hidden">
                      <motion.div
                        initial={{ width: "80%" }}
                        animate={{ width: "35%" }}
                        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                        className="h-full bg-[#C2643A] rounded-full"
                      />
                    </div>
                    <p className="text-xs text-[#130F08]/75 leading-relaxed">
                      وجود تسرب فعلي في السقف يرجح تكاليف إصلاح غير معلنة، مما أسقط شقة الياسمين للمركز الثاني لصالح شقة النرجس.
                    </p>
                  </div>
                </div>
              </PaperCard>

              {/* Block 3: Plain Explanation + Certainty Chips */}
              <PaperCard className="p-4 space-y-3 shadow-xs border border-[#E9DFD0]">
                <div className="flex items-center justify-between border-b border-[#E9DFD0] pb-2">
                  <span className="text-xs font-semibold text-[#130F08] flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4 text-[#14756E]" />
                    <span>{COPY.reassess.sectionWhy}</span>
                  </span>
                  <WhySheetTrigger size="sm" onClick={() => setIsWhyOpen(true)} />
                </div>

                <div className="space-y-2 text-xs text-[#130F08]/85 leading-relaxed">
                  <p>
                    أظهرت الزيارة الميدانية خطراً ملموساً (تسرب في السقف) في شقة الياسمين، وهو ما يرجح تكلفة صيانة إضافية تفوق فارق المسافة مع شقة النرجس.
                  </p>
                  <p>
                    نتيجة لذلك، أصبحت <strong className="font-semibold text-[#14756E]">شقة حي النرجس</strong> هي الخيار الأول الأكثر أماناً لميزانيتك وراحة بالك.
                  </p>
                </div>

                <div className="pt-2 flex items-center gap-2 border-t border-[#E9DFD0]">
                  <span className="text-xs text-[#130F08]/65">مستوى التوثيق:</span>
                  <CertaintyChip level="user_observed" variant="paper" size="sm" />
                  <ScopeTag scope="property" />
                </div>
              </PaperCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sticky Action Footer */}
        {!isAnalyzing && (
          <div className="fixed bottom-0 inset-x-0 mx-auto max-w-[430px] p-6 bg-gradient-to-t from-[#FAF6EF] via-[#FAF6EF]/95 to-transparent pt-10 z-30 pointer-events-none">
            <div className="pointer-events-auto flex items-center gap-3">
              <PrimaryButton
                label={COPY.reassess.saveCaseCta}
                onClick={() => setLoginSheetOpen(true)}
                className="flex-1 shadow-xl"
                size="56"
              />
              <button
                type="button"
                onClick={() => router.push("/dashboard")}
                className="h-14 px-5 rounded-full glass-light border border-[#130F08]/15 text-xs font-semibold text-[#130F08] hover:bg-[#E9DFD0]/60 transition-colors shadow-xs cursor-pointer shrink-0"
              >
                لوحة الحالات
              </button>
            </div>
          </div>
        )}
      </div>

      {/* "Why?" Bottom Sheet */}
      <WhyBottomSheet
        isOpen={isWhyOpen}
        onClose={() => setIsWhyOpen(false)}
        title="أسباب إعادة الترتيب بعد المعاينة"
        subtitle="تأثير الملاحظات الميدانية المسجلة على توازن القرار"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-[#FAF6EF] border border-[#E9DFD0] space-y-1">
            <span className="text-xs text-[#14756E] font-semibold">
              المعادلة الحسابية للترتيب الجديد
            </span>
            <p className="text-xs text-[#130F08]/85 leading-relaxed">
              تزن بوصلة المخاطر الميدانية بوزن يفوق البيانات الإعلانية. تسببت تكلفة إصلاح التسرب في تفوق شقة النرجس مالياً وهندسياً.
            </p>
          </div>

          <div className="space-y-2.5">
            <div className="p-3.5 rounded-xl bg-white border border-[#E9DFD0] space-y-1 shadow-2xs">
              <span className="text-xs font-semibold text-[#14756E]">
                شقة حي النرجس (المركز الأول)
              </span>
              <p className="text-xs text-[#130F08]/80">
                خالية من المخاطر الإنشائية المرصودة، وتوفر 80 ألف ر.س تغطي فارق وقت التنقل بأريحية تامة.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-[#C2643A]/30 space-y-1 shadow-2xs">
              <span className="text-xs font-semibold text-[#C2643A]">
                شقة حي الياسمين (المركز الثاني)
              </span>
              <p className="text-xs text-[#130F08]/80">
                رغم قربها الممتاز من العمل، فإن وجود تسرب مائي في السقف يتطلب فحصاً هندسياً معمقاً وضمانات إصلاح رسمية من البائع قبل اتخاذ قرار الشراء.
              </p>
            </div>
          </div>
        </div>
      </WhyBottomSheet>
    </AppShell>
  );
}

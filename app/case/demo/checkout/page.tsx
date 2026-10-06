"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Lock, AlertTriangle, RotateCcw } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { useAppStore } from "@/lib/store";
import { COPY } from "@/lib/copy";
import { BdiNumber } from "@/lib/format";

export default function CheckoutPage() {
  const router = useRouter();
  const { checkoutStatus, setCheckoutStatus } = useAppStore();
  const [isLoading, setIsLoading] = useState(false);

  // Hidden key 'F' listener to toggle failed payment state
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === "f" || e.key === "F") && !e.metaKey && !e.ctrlKey) {
        const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
        if (tag !== "input" && tag !== "textarea") {
          e.preventDefault();
          setCheckoutStatus(checkoutStatus === "failed" ? "idle" : "failed");
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [checkoutStatus, setCheckoutStatus]);

  const handlePay = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setCheckoutStatus("success");
      setTimeout(() => {
        router.push("/case/demo/analyzing");
      }, 700);
    }, 1800);
  };

  return (
    <AppShell hideTopBar={false} showStepper={false}>
      {/* Blurred Interior Photo Background */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <Image
          src="/images/p1-living.jpg"
          alt="Interior backdrop"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center blur-[28px] opacity-25 scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#FAF6EF]/60 via-[#FAF6EF]/85 to-[#FAF6EF]" />
      </div>

      <div className="relative z-10 px-5 pt-4 pb-28 flex-1 flex flex-col justify-between max-w-md mx-auto w-full" dir="rtl">
        <div className="space-y-6">
          {/* Header */}
          <div className="space-y-1.5 text-right">
            <span className="eyebrow-caption text-[#130F08]/65 block font-medium">
              الخطوة 03 // تفعيل الاستشارة
            </span>
            <h1 className="text-2xl md:text-[28px] font-semibold text-[#130F08]">
              {COPY.checkout.title}
            </h1>
            <p className="text-xs text-[#130F08]/70 leading-relaxed">
              {COPY.checkout.subtitle}
            </p>
          </div>

          {/* Frosted Glass Summary Card */}
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="p-6 rounded-3xl glass-light border border-[#130F08]/10 shadow-[0_16px_40px_rgba(19,15,8,0.06)] space-y-5 text-right relative overflow-hidden"
          >
            {/* Top row: Small Status Pill */}
            <div className="flex items-center justify-between border-b border-[#130F08]/10 pb-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/70 text-[#130F08] border border-[#130F08]/10 text-xs font-medium shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-[#14756E] animate-pulse" />
                <span>دراسة شاملة • تدقيق فوري</span>
              </span>

              <span className="text-xs text-[#130F08]/65 font-medium">
                دفعة واحدة
              </span>
            </div>

            {/* Big Price with Tabular Numerals wrapped in BdiNumber */}
            <div className="py-2 flex items-baseline justify-between">
              <div>
                <span className="text-xs text-[#130F08]/70 block font-medium">
                  {COPY.checkout.priceLabel}
                </span>
                <span className="text-xs text-[#130F08]/55">
                  شامل كافة محاور الفحص
                </span>
              </div>

              <div className="flex items-baseline">
                <BdiNumber
                  value="10"
                  unit="ر.س"
                  className="text-5xl md:text-6xl font-semibold text-[#130F08] leading-none"
                />
              </div>
            </div>

            {/* Features Included */}
            <div className="pt-3 border-t border-[#130F08]/10 space-y-3">
              {COPY.checkout.features.map((feature, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 text-xs text-[#130F08]/85 leading-relaxed font-normal"
                >
                  <div className="w-5 h-5 rounded-full bg-[#14756E]/12 border border-[#14756E]/30 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#14756E]" />
                  </div>
                  <span>{feature}</span>
                </div>
              ))}
            </div>

            {/* Error Banner if failed state triggered */}
            <AnimatePresence>
              {checkoutStatus === "failed" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-3.5 rounded-2xl bg-[#C2643A]/15 border border-[#C2643A]/40 flex items-center gap-2.5 text-xs text-[#130F08]"
                >
                  <AlertTriangle className="w-4 h-4 text-[#C2643A] shrink-0" />
                  <div className="flex-1">
                    <p className="font-semibold text-[#130F08]">تعثرت عملية السداد التجريبية</p>
                    <p className="text-xs text-[#130F08]/70">
                      يمكنك إعادة المحاولة مجدداً دون أي رسوم إضافية.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCheckoutStatus("idle")}
                    className="p-1.5 rounded-lg hover:bg-[#C2643A]/20 text-[#130F08] transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Quiet Trust Note */}
            <div className="pt-4 border-t border-[#130F08]/10 flex items-center justify-center gap-1.5 text-xs text-[#130F08]/65 font-medium">
              <Lock className="w-3.5 h-3.5 text-[#14756E]" />
              <span>{COPY.checkout.guarantee}</span>
            </div>
          </motion.div>
        </div>

        {/* Sticky Action Footer: One Pill CTA (56px brass gradient fill, espresso label) */}
        <div className="fixed bottom-0 inset-x-0 mx-auto max-w-[430px] p-6 bg-gradient-to-t from-[#FAF6EF] via-[#FAF6EF]/95 to-transparent pt-10 z-30 pointer-events-none">
          <div className="pointer-events-auto">
            {checkoutStatus === "success" ? (
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-full h-14 rounded-full bg-[#14756E] text-[#FAF6EF] font-semibold flex items-center justify-center gap-2 shadow-lg"
              >
                <CheckCircle2 className="w-5 h-5 text-[#FAF6EF]" />
                <span className="text-sm">تم الدفع بنجاح • جاري التحليل</span>
              </motion.div>
            ) : (
              <PrimaryButton
                label={
                  isLoading
                    ? "جارٍ المعالجة..."
                    : checkoutStatus === "failed"
                    ? "إعادة محاولة الدفع (10 ر.س)"
                    : COPY.checkout.cta
                }
                onClick={handlePay}
                disabled={isLoading}
                fullWidth
                size="56"
              />
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

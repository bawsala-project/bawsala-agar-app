"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { useAppStore } from "@/lib/store";
import { COPY } from "@/lib/copy";

export default function CheckoutPage() {
  const router = useRouter();
  const { setCheckoutStatus } = useAppStore();
  const [isLoading, setIsLoading] = useState(false);

  const handlePay = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setCheckoutStatus("success");
      router.push("/case/demo/analyzing");
    }, 1200);
  };

  return (
    <AppShell hideTopBar>
      {/* Background Image: hero-home.jpg */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <Image
          src="/images/hero-home.jpg"
          alt="Architectural Backdrop"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center opacity-30 blur-[2px] scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#FAF6EF]/70 via-[#FAF6EF]/90 to-[#FAF6EF]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 w-full bg-[#FAF6EF]/92 backdrop-blur-md border-b border-[#E9DFD0]/70 px-4 sm:px-5 pt-3 pb-2.5 space-y-2" dir="rtl">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full glass-light border border-[#130F08]/10 text-[#130F08] hover:bg-[#E9DFD0]/60 flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-xs"
            aria-label="الرجوع للخلف"
          >
            <ArrowRight className="w-5 h-5 text-[#130F08]" />
          </button>

          {/* 1 Headline */}
          <h1 className="text-base font-semibold text-[#130F08]">
            {COPY.checkout.title}
          </h1>

          <div className="w-10 h-10" />
        </div>

        {/* 1 Supporting Line */}
        <p className="text-xs text-[#130F08]/65 font-medium text-right">
          {COPY.checkout.subtitle}
        </p>
      </header>

      {/* Main Body (Strictly Max 3 Content Blocks) */}
      <div className="relative z-10 px-4 sm:px-5 pt-5 pb-32 flex-1 flex flex-col justify-between max-w-md mx-auto w-full" dir="rtl">
        <div className="space-y-4">
          {/* Content Block 1: Glass Summary Card with Large Price over hero-home.jpg */}
          <div className="p-6 rounded-3xl glass-light border border-[#E9DFD0] shadow-sm space-y-4 text-right">
            <div className="flex items-center justify-between border-b border-[#130F08]/10 pb-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/80 text-[#130F08] border border-[#130F08]/10 text-xs font-semibold shadow-xs">
                <span className="w-2 h-2 rounded-full bg-[#14756E] animate-pulse" />
                <span>تحليل كامل وفوري</span>
              </span>
              <span className="text-xs text-[#130F08]/65 font-medium">
                دفعة واحدة
              </span>
            </div>

            {/* Price Large */}
            <div className="py-2 flex items-baseline justify-between">
              <div>
                <span className="text-xs text-[#130F08]/70 block font-medium">
                  {COPY.checkout.priceLabel}
                </span>
                <span className="text-xs text-[#130F08]/55">
                  شامل محاور المقارنة والمعاينة
                </span>
              </div>
              <bdi dir="ltr" className="text-5xl sm:text-6xl font-bold text-[#130F08] tabular-nums leading-none">
                10 <span className="text-lg font-medium text-[#130F08]/70">ر.س</span>
              </bdi>
            </div>
          </div>

          {/* Content Block 2: Key Features Checklist */}
          <div className="p-4 rounded-2xl glass-light border border-[#E9DFD0] space-y-3 shadow-2xs text-right">
            <span className="text-xs font-semibold text-[#130F08] block">
              {COPY.checkout.summaryTitle}
            </span>
            <div className="space-y-2.5">
              {COPY.checkout.features.map((feature, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs text-[#130F08]/85">
                  <div className="w-4 h-4 rounded-full bg-[#14756E]/12 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3 h-3 text-[#14756E]" />
                  </div>
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Content Block 3: Guarantee & Demo Notice */}
          <div className="p-3.5 rounded-2xl bg-white/80 border border-[#E9DFD0] text-xs text-[#130F08]/75 text-right space-y-1 shadow-2xs">
            <span className="font-semibold text-[#14756E] block">
              ضمان بوصلة:
            </span>
            <p className="leading-relaxed">
              {COPY.checkout.paymentNote} • {COPY.checkout.guarantee}
            </p>
          </div>
        </div>

        {/* 1 Primary Brass CTA (min 48px height) */}
        <div className="pt-6">
          <PrimaryButton
            label={isLoading ? "جارٍ تفعيل الاستشارة..." : COPY.checkout.cta}
            onClick={handlePay}
            disabled={isLoading}
            size="56"
            className="w-full shadow-lg"
          />
        </div>
      </div>
    </AppShell>
  );
}

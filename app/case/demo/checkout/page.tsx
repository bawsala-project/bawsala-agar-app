"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowRight, ArrowLeft, Lock, CreditCard } from "lucide-react";
import { CircleButton } from "@/components/ui/CircleButton";
import { Banner } from "@/components/ui/Banner";
import { WideCard } from "@/components/ui/WideCard";
import { ActionBar } from "@/components/ui/ActionBar";
import { useAppStore } from "@/lib/store";
import { COPY } from "@/lib/copy";

export default function CheckoutPage() {
  const router = useRouter();
  const { setCheckoutStatus } = useAppStore();
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePay = () => {
    setIsProcessing(true);
    setCheckoutStatus("success");
    setTimeout(() => {
      router.push("/case/demo/analyzing");
    }, 400);
  };

  return (
    <div
      className="relative w-full min-h-screen bg-espresso text-sandstone flex flex-col justify-between overflow-hidden select-none"
      dir="rtl"
    >
      {/* 1. Full-Bleed Photo Background with Espresso Scrim */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <Image
          src="/images/hero-home.jpg"
          alt="Architectural Backdrop"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center photo-grade"
        />

        {/* Espresso Scrim Overlay */}
        <div className="absolute inset-0 scrim-warm" />
      </div>

      {/* Main Content Area (Max 1 title, 2 sections, 1 primary action) */}
      <div className="relative z-10 w-full max-w-[420px] mx-auto px-5 pt-[calc(20px+var(--safe-top))] pb-[calc(100px+var(--safe-bottom))] flex-1 flex flex-col justify-between">
        <div className="space-y-6">
          {/* Header Row: CircleButton back + Step counter */}
          <div className="flex items-center justify-between">
            <CircleButton
              icon={<ArrowRight className="w-5 h-5 text-sandstone" />}
              ariaLabel="الرجوع للخلف"
              onClick={() => router.back()}
              variant="glass"
            />
            <span className="text-[13px] font-medium text-muted">
              خطوة <bdi dir="ltr">4</bdi> من <bdi dir="ltr">5</bdi> • تفعيل الاستشارة
            </span>
          </div>

          {/* Huge Title: "تأكيد الاستشارة" */}
          <h1 className="text-[40px] md:text-[48px] font-light text-ink leading-[1.15] tracking-normal">
            تأكيد الاستشارة
          </h1>

          {/* Section 1: One Banner with the price (big number + unit) */}
          <div className="space-y-2">
            <span className="text-[13px] font-medium text-muted px-1 block">
              القيمة والضمان
            </span>
            <Banner
              title={COPY.checkout.priceLabel || "قيمة الاستشارة"}
              value={
                <>
                  <bdi dir="ltr" className="text-[40px] font-medium text-ink leading-none tabular-nums">
                    10
                  </bdi>
                  <span className="text-[14px] font-normal text-muted leading-none">
                    ر.س
                  </span>
                </>
              }
              description={COPY.checkout.subtitle || "تحليل محايد ومستقل يجنبك قرارات الشراء المكلفة"}
              buttonAriaLabel="تفاصيل السعر"
            />
          </div>

          {/* Section 2: One WideCard payment row */}
          <div className="space-y-2">
            <span className="text-[13px] font-medium text-muted px-1 block">
              وسيلة الدفع
            </span>
            <WideCard
              title="الدفع الإلكتروني السريع"
              subtitle="Apple Pay / مدى / بطاقة بنكية (وضع تجريبي Demo)"
              icon={<CreditCard className="w-5 h-5 text-sandstone" />}
              value={<span className="text-[14px] font-medium text-sandstone">معتمد</span>}
            />
          </div>
        </div>
      </div>

      {/* ActionBar "ادفع وابدأ" */}
      <ActionBar
        primaryLabel={isProcessing ? "جارٍ التفعيل..." : "ادفع وابدأ"}
        onPrimaryAction={handlePay}
        startIcon={<Lock className="w-5 h-5 text-sandstone" />}
        startAriaLabel="دفع آمن"
        endIcon={<ArrowLeft className="w-5 h-5 text-sandstone" />}
        endAriaLabel="بدء التحليل"
        primaryVariant="sandstone"
        pinned={true}
      />
    </div>
  );
}

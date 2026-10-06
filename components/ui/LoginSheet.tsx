"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Lock, CheckCircle2, ArrowLeft } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { COPY } from "@/lib/copy";
import { bottomSheetVariants } from "@/lib/motion";
import { PrimaryButton } from "./PrimaryButton";
import { BdiNumber } from "@/lib/format";

export function LoginSheet() {
  const { isLoginSheetOpen, setLoginSheetOpen, setAuthenticated, showToast } = useAppStore();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [countdown, setCountdown] = useState(30);
  const [isSuccess, setIsSuccess] = useState(false);

  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Reset state on open
  useEffect(() => {
    if (isLoginSheetOpen) {
      setStep("phone");
      setOtp(["", "", "", ""]);
      setCountdown(30);
      setIsSuccess(false);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isLoginSheetOpen]);

  // Countdown timer for OTP
  useEffect(() => {
    if (!isLoginSheetOpen || step !== "otp" || countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isLoginSheetOpen, step, countdown]);

  const handleClose = () => {
    setLoginSheetOpen(false);
  };

  const handleSendCode = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (phoneNumber.trim().length >= 8) {
      setStep("otp");
      setCountdown(30);
      setTimeout(() => {
        otpInputsRef.current[0]?.focus();
      }, 150);
    }
  };

  const handleOtpChange = (index: number, val: string) => {
    const clean = val.replace(/[^0-9]/g, "");
    if (!clean) {
      const nextOtp = [...otp];
      nextOtp[index] = "";
      setOtp(nextOtp);
      return;
    }

    const nextOtp = [...otp];
    nextOtp[index] = clean.slice(-1);
    setOtp(nextOtp);

    // Auto-advance
    if (index < 3 && clean) {
      otpInputsRef.current[index + 1]?.focus();
    }

    // Auto-verify if all 4 digits entered
    if (index === 3 && clean) {
      const full = nextOtp.join("");
      if (full.length === 4) {
        triggerSuccess();
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  const triggerSuccess = () => {
    setIsSuccess(true);
    setAuthenticated(true, phoneNumber || "0501234567");
    setTimeout(() => {
      showToast(COPY.login.toastSaved);
      handleClose();
    }, 1000);
  };

  return (
    <AnimatePresence>
      {isLoginSheetOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" dir="rtl">
          {/* Backdrop with Soft Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-[#130F08]/40 backdrop-blur-md cursor-pointer"
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
                handleClose();
              }
            }}
            className="relative w-full max-w-lg bg-[#FAF6EF] border-t border-x border-[#E9DFD0] rounded-t-[32px] shadow-[0_-20px_60px_rgba(19,15,8,0.15)] overflow-hidden max-h-[90vh] flex flex-col z-10 text-[#130F08]"
          >
            {/* Grabber handle */}
            <div className="pt-3 pb-2 flex justify-center cursor-grab active:cursor-grabbing w-full">
              <div className="w-12 h-1.5 rounded-full bg-[#E9DFD0] hover:bg-[#130F08]/30 transition-colors" />
            </div>

            {/* Header */}
            <div className="px-6 pt-2 pb-4 flex items-center justify-between border-b border-[#E9DFD0]">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-full glass-light border border-[#130F08]/10 flex items-center justify-center text-[#130F08]">
                  <Lock className="w-4 h-4 text-[#14756E]" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[#130F08]">
                    {step === "phone" ? COPY.login.sheetTitle : COPY.login.enterOtpTitle}
                  </h3>
                  <p className="text-xs text-[#130F08]/80">
                    {step === "phone" ? COPY.login.sheetSubtitle : COPY.login.enterOtpSubtitle}
                  </p>
                </div>
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

            {/* Sheet Body */}
            <div className="p-6 space-y-6">
              {isSuccess ? (
                <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-14 h-14 rounded-full bg-[#14756E] text-[#FAF6EF] flex items-center justify-center shadow-lg"
                  >
                    <CheckCircle2 className="w-8 h-8" />
                  </motion.div>
                  <h4 className="text-lg font-semibold text-[#130F08]">تم التحقق بنجاح</h4>
                  <p className="text-xs text-[#130F08]/80">جاري نقلك إلى لوحة التحكم وحفظ الحالة...</p>
                </div>
              ) : step === "phone" ? (
                <form onSubmit={handleSendCode} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-[#130F08]/80 block">
                      {COPY.login.phoneLabel}
                    </label>

                    <div className="flex items-center gap-2" dir="ltr">
                      {/* Saudi prefix chip */}
                      <span className="h-14 px-3.5 rounded-2xl bg-white border border-[#E9DFD0] text-sm font-sans tabular-nums text-[#130F08] flex items-center gap-1.5 shrink-0 select-none shadow-xs">
                        <span>🇸🇦</span>
                        <BdiNumber value="+966" />
                      </span>

                      {/* Phone input */}
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9]/g, ""))}
                        placeholder={COPY.login.phonePlaceholder}
                        className="flex-1 h-14 px-4 rounded-2xl bg-white border border-[#E9DFD0] text-[#130F08] text-base font-sans tabular-nums focus:border-[#14756E] focus:outline-none transition-colors shadow-xs"
                        autoFocus
                      />
                    </div>
                  </div>

                  <p className="text-xs text-[#130F08]/80 leading-relaxed">
                    ملاحظة: هذا نموذج تجريبي (Demo). أي رقم مدخل سيتلقى رمزاً تجريبياً فورياً.
                  </p>

                  <PrimaryButton
                    type="submit"
                    fullWidth
                    label={COPY.login.sendCode}
                  />
                </form>
              ) : (
                <div className="space-y-6">
                  {/* 4 OTP Boxes with Auto-Advance */}
                  <div className="flex items-center justify-center gap-3 py-2" dir="ltr">
                    {otp.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => {
                          otpInputsRef.current[idx] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(idx, e)}
                        className="w-14 h-16 rounded-2xl bg-white border border-[#E9DFD0] text-center text-2xl font-sans tabular-nums text-[#130F08] focus:border-[#14756E] focus:outline-none transition-colors shadow-xs"
                      />
                    ))}
                  </div>

                  {/* Resend info */}
                  <div className="text-center text-xs">
                    {countdown > 0 ? (
                      <span className="text-[#130F08]/80">
                        {COPY.login.resendTimer(countdown)}
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setCountdown(30)}
                        className="text-[#14756E] font-medium hover:underline cursor-pointer"
                      >
                        {COPY.login.resendAction}
                      </button>
                    )}
                  </div>

                  <PrimaryButton
                    onClick={triggerSuccess}
                    fullWidth
                    label={COPY.login.verifyAction}
                  />
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

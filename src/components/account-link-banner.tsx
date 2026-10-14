"use client";

import { useState } from "react";
import { signInWithOtpAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";

interface AccountLinkBannerProps {
  nextPath: string;
}

export function AccountLinkBanner({ nextPath }: AccountLinkBannerProps) {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const result = await signInWithOtpAction(email, nextPath);
    setPending(false);
    if (result.success) {
      setSent(true);
    } else {
      setError(result.error ?? null);
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 pt-4">
      <div className="rounded-[28px] border border-[var(--mist)] bg-[var(--paper)] p-5 text-xs text-[var(--navy)] space-y-2.5 shadow-[0_20px_60px_rgba(15,26,43,0.04)]">
        {sent ? (
          <p role="status" className="font-bold text-[#1E6B43]">
            تم إرسال رابط الدخول إلى بريدك الإلكتروني. افتحه لحفظ تحليلك في حسابك.
          </p>
        ) : (
          <>
            <p className="font-semibold text-[var(--navy)]">احفظ تحليلك للرجوع إليه لاحقًا — أدخل بريدك الإلكتروني لإرسال رابط الدخول</p>
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                required
                dir="ltr"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@example.com"
                aria-label="البريد الإلكتروني"
                className="flex-1 px-4 py-2.5 rounded-full bg-[var(--cream)] border border-[var(--mist)] text-xs text-[var(--navy)] placeholder:text-[var(--dusty-blue)]/60 focus:bg-[var(--paper)] focus:outline-none focus:border-[var(--navy)] transition-all font-mono"
              />
              <Button type="submit" variant="primary" pending={pending} className="shrink-0">
                إرسال الرابط
              </Button>
            </form>
            {error && (
              <p role="alert" className="text-xs text-[#A62626] font-medium">
                {error}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

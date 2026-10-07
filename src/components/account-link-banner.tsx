"use client";

import { useState } from "react";
import { signInWithOtpAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
      <div className="rounded-lg border border-blue-100 bg-blue-50/60 p-3 text-xs text-blue-900 space-y-2">
        {sent ? (
          <p role="status" className="font-medium">
            تم إرسال رابط الدخول إلى بريدك الإلكتروني. افتحه لحفظ تحليلك في حسابك.
          </p>
        ) : (
          <>
            <p>احفظ تحليلك للرجوع إليه لاحقًا — أدخل بريدك الإلكتروني لإرسال رابط الدخول</p>
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
              <Input
                type="email"
                required
                dir="ltr"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@example.com"
                aria-label="البريد الإلكتروني"
                className="flex-1"
              />
              <Button type="submit" variant="primary" pending={pending} className="shrink-0">
                إرسال الرابط
              </Button>
            </form>
            {error && (
              <p role="alert" className="text-red-700">
                {error}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

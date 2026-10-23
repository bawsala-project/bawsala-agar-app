"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithOtpAction, verifyEmailOtpAction } from "@/actions/auth";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

interface AccountLinkBannerProps {
  nextPath: string;
}

const VERIFIED_SESSION_KEY = "bawsala_email_verified";
const SENT_SESSION_KEY = "bawsala_email_link_sent";

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function writeVerifiedSession(emailAddr: string) {
  try {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(VERIFIED_SESSION_KEY, emailAddr);
      window.sessionStorage.setItem(SENT_SESSION_KEY, emailAddr);
    }
    if (typeof document !== "undefined") {
      document.cookie = `bawsala_verified_email=${encodeURIComponent(
        emailAddr
      )}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
    }
  } catch {
    // Ignore storage access errors
  }
}

export function AccountLinkBanner({ nextPath }: AccountLinkBannerProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [pending, setPending] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [sent, setSent] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const cookieVerified = readCookie("bawsala_verified_email");
      const storageVerified =
        typeof window !== "undefined"
          ? window.sessionStorage.getItem(VERIFIED_SESSION_KEY)
          : null;
      if (cookieVerified || storageVerified) {
        setVerified(true);
        return;
      }

      const storageSent =
        typeof window !== "undefined"
          ? window.sessionStorage.getItem(SENT_SESSION_KEY)
          : null;
      if (storageSent) {
        setEmail(storageSent);
        setSent(true);
      }
    } catch {
      // Ignore sessionStorage errors
    }

    const checkSessionUser = async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user && !user.is_anonymous && user.email) {
          writeVerifiedSession(user.email);
          setVerified(true);
          router.refresh();
        }
      } catch {
        // Ignore client auth check errors
      }
    };

    void checkSessionUser();

    const onFocusOrVisible = () => {
      if (document.visibilityState === "visible") {
        if (readCookie("bawsala_verified_email")) {
          setVerified(true);
          router.refresh();
          return;
        }
        void checkSessionUser();
      }
    };

    window.addEventListener("focus", onFocusOrVisible);
    document.addEventListener("visibilitychange", onFocusOrVisible);
    return () => {
      window.removeEventListener("focus", onFocusOrVisible);
      document.removeEventListener("visibilitychange", onFocusOrVisible);
    };
  }, [router]);

  // Once verified in this session, hide the banner so the user is never asked again
  if (verified) {
    return null;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const result = await signInWithOtpAction(email, nextPath);
    setPending(false);
    if (result.success) {
      setSent(true);
      try {
        if (typeof window !== "undefined") {
          window.sessionStorage.setItem(SENT_SESSION_KEY, email.trim());
        }
      } catch {
        // Ignore storage errors
      }
    } else {
      setError(result.error ?? null);
    }
  }

  async function handleVerifyOtp(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!otpCode.trim()) return;
    setVerifyingOtp(true);
    setError(null);
    const result = await verifyEmailOtpAction(email, otpCode);
    setVerifyingOtp(false);
    if (result.success) {
      writeVerifiedSession(result.verifiedEmail || email.trim());
      setVerified(true);
      router.refresh();
    } else {
      setError(result.error ?? null);
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 pt-4">
      <div className="rounded-[28px] border border-[var(--mist)] bg-[var(--paper)] p-5 text-xs text-[var(--navy)] space-y-2.5 shadow-[0_20px_60px_rgba(15,26,43,0.04)]">
        {sent ? (
          <div className="space-y-2.5">
            <p role="status" className="font-bold text-[#1E6B43]">
              تم إرسال رابط الدخول إلى بريدك الإلكتروني. افتحه لحفظ تحليلك في حسابك.
            </p>
            <form onSubmit={handleVerifyOtp} className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                inputMode="numeric"
                dir="ltr"
                value={otpCode}
                onChange={(event) => setOtpCode(event.target.value)}
                placeholder="أو أدخل رمز التحقق المرسل لبريدك"
                aria-label="رمز التحقق"
                className="flex-1 px-4 py-2 rounded-full bg-[var(--cream)] border border-[var(--mist)] text-xs text-[var(--navy)] placeholder:text-[var(--dusty-blue)]/60 focus:bg-[var(--paper)] focus:outline-none focus:border-[var(--navy)] transition-all font-mono"
              />
              <Button type="submit" variant="primary" pending={verifyingOtp} className="shrink-0">
                تأكيد الرمز
              </Button>
            </form>
            {error && (
              <p role="alert" className="text-xs text-[#A62626] font-medium">
                {error}
              </p>
            )}
          </div>
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

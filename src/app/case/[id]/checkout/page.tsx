import crypto from "crypto";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  Building2,
} from "lucide-react";
import { getSessionUser, requireCase } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { loadPreflightData } from "@/lib/preflight/load";
import { evaluatePreflight } from "@/lib/preflight/evaluate";
import { initiateCheckoutAction } from "@/actions/payments";
import { MockPaymentProvider } from "@/lib/payments/mock";
import { settlePayment } from "@/lib/payments/settle";
import { AccountLinkBanner } from "@/components/account-link-banner";

export const dynamic = "force-dynamic";

interface CheckoutPageProps {
  params: { id: string };
}

export default async function CheckoutPage({ params }: CheckoutPageProps) {
  await requireCase(params.id);

  const preflightData = await loadPreflightData(params.id);
  const evaluation = evaluatePreflight(preflightData);
  if (!evaluation.ready) {
    redirect(`/case/${params.id}/preflight`);
  }

  const supabase = createClient();
  const [{ data: paidPayments }, { data: committedRuns }] = await Promise.all([
    supabase
      .from("payments")
      .select("id")
      .eq("case_id", params.id)
      .eq("status", "paid")
      .limit(1),
    supabase
      .from("analysis_runs")
      .select("id")
      .eq("case_id", params.id)
      .eq("status", "committed")
      .limit(1),
  ]);
  if ((paidPayments && paidPayments.length > 0) || (committedRuns && committedRuns.length > 0)) {
    redirect(`/case/${params.id}/results`);
  }

  async function startCheckout(): Promise<void> {
    "use server";
    let redirectUrl: string | null = null;
    try {
      const result = await initiateCheckoutAction(params.id);
      if (result) {
        redirect(`/case/${params.id}/preflight`);
      }
    } catch (err: unknown) {
      const digest = (err as { digest?: string })?.digest;
      if (typeof digest === "string" && digest.startsWith("NEXT_REDIRECT;")) {
        const parts = digest.split(";");
        redirectUrl = parts[2] || null;
      } else {
        throw err;
      }
    }

    if (redirectUrl) {
      // If initiateCheckoutAction redirected to the mock payment callback, settle the payment
      // directly on the server and redirect straight to /case/[id]/results so the user never
      // gets stuck on /api/payments/mock-callback or redirected back to /preflight.
      if (redirectUrl.startsWith("/api/payments/mock-callback")) {
        const parsedUrl = new URL(redirectUrl, "http://localhost");
        const key = parsedUrl.searchParams.get("key");
        if (key) {
          const adapter = new MockPaymentProvider();
          const payload = {
            eventId: `mock_evt_${key}`,
            caseId: params.id,
            amountSar: 10,
          };
          const secret = process.env.PAYMENT_WEBHOOK_SECRET;
          const signature = secret
            ? crypto.createHmac("sha256", secret).update(JSON.stringify(payload)).digest("hex")
            : undefined;
          const verified = await adapter.verifyWebhook(payload, signature);
          const settled = await settlePayment(key, verified);
          if (settled.outcome === "paid" || settled.outcome === "duplicate") {
            revalidatePath(`/case/${params.id}/preflight`);
            revalidatePath(`/case/${params.id}/checkout`);
            revalidatePath(`/case/${params.id}/results`);
            redirect(`/case/${params.id}/results`);
          }
        }
      }
      redirect(redirectUrl);
    }
  }

  const user = await getSessionUser();
  const verifiedCookieEmail = cookies().get("bawsala_verified_email")?.value;
  const showEmailBanner = Boolean(user?.is_anonymous && !verifiedCookieEmail);
  const propertyCount = preflightData.properties.length;

  return (
    <>
      {showEmailBanner && <AccountLinkBanner nextPath={`/case/${params.id}/checkout`} />}
      <div className="w-full max-w-xl mx-auto px-4 sm:px-6 py-8 md:py-12 space-y-6 font-body text-[var(--navy)]" dir="rtl">
        {/* Invoice Card */}
        <div className="bg-[var(--paper)] rounded-[28px] border border-[var(--mist)] shadow-[0_20px_60px_rgba(15,26,43,0.04)] p-6 sm:p-8 space-y-6">
          {/* Phase Badge */}
          <div className="flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[var(--cream)] text-[var(--dusty-blue)] border border-[var(--mist)]">
              <ShieldCheck className="w-3.5 h-3.5 text-[var(--navy)]" />
              <span>دفع آمن</span>
            </span>

            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#E9F4EE] text-[#1E6B43] border border-[#C5E4D4]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#1E6B43] animate-pulse" />
              <span>جاهز للتحليل</span>
            </span>
          </div>

          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-display font-bold text-[var(--navy)] tracking-tight">
              فعّل تحليل قرارك
            </h1>
            <p className="text-sm text-[var(--dusty-blue)] leading-relaxed">
              رسوم واحدة للحالة كاملة، لا لكل عقار.
            </p>
          </div>

          {/* Price Box */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[var(--cream)] border border-[var(--mist)] space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-[var(--dusty-blue)]">
                الرسوم
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[var(--paper)] border border-[var(--mist)] text-[11px] font-bold text-[var(--navy)]">
                <Building2 className="w-3 h-3 text-[var(--dusty-blue)]" />
                <span>
                  تشمل {propertyCount} {propertyCount === 1 ? "شقة مرشحة" : "شقق مرشحة"}
                </span>
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-body font-extrabold text-[var(--navy)] tabular-nums tracking-tight">10.00</span>
              <span className="text-sm font-medium text-[var(--dusty-blue)]">ر.س · مرة واحدة</span>
            </div>
          </div>

          {/* Feature Inclusions */}
          <div className="space-y-2.5 pt-2 border-t border-[var(--mist)] text-sm text-[var(--dusty-blue)]">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-[#1E6B43] shrink-0" />
              <span className="text-[var(--navy)]">
                ملاءمة كل شقة لأسرتك وشروطك
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-[#1E6B43] shrink-0" />
              <span className="text-[var(--navy)]">
                الموقع والحياة اليومية وعدالة السعر
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-[#1E6B43] shrink-0" />
              <span className="text-[var(--navy)]">
                توصية واضحة مع أسبابها ومستوى الثقة
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-[#1E6B43] shrink-0" />
              <span className="text-[var(--navy)]">
                أسئلة متابعة وإعادة تقييم بعد الزيارة مجاناً
              </span>
            </div>
          </div>

          {/* Checkout Submit Form */}
          <form action={startCheckout} className="pt-2">
            <button
              type="submit"
              className="btn-primary w-full inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-[var(--navy)] hover:bg-[var(--midnight)] text-[var(--cream)] font-semibold text-base shadow-sm transition-all active:scale-[0.98] cursor-pointer opacity-100"
            >
              <CreditCard className="w-4 h-4 text-[var(--cream)] opacity-100 shrink-0" />
              <span className="text-[var(--cream)] text-base font-semibold opacity-100">
                ادفع 10 ر.س وابدأ
              </span>
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

import { redirect } from "next/navigation";
import {
  CreditCard,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { getSessionUser, requireCase } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { loadPreflightData } from "@/lib/preflight/load";
import { evaluatePreflight } from "@/lib/preflight/evaluate";
import { initiateCheckoutAction } from "@/actions/payments";
import { AccountLinkBanner } from "@/components/account-link-banner";

interface CheckoutPageProps {
  params: { id: string };
}

export default async function CheckoutPage({ params }: CheckoutPageProps) {
  await requireCase(params.id);

  const evaluation = evaluatePreflight(await loadPreflightData(params.id));
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
    const result = await initiateCheckoutAction(params.id);
    if (result) {
      redirect(`/case/${params.id}/preflight`);
    }
  }

  const user = await getSessionUser();

  return (
    <>
      {user?.is_anonymous && <AccountLinkBanner nextPath={`/case/${params.id}/checkout`} />}
      <div className="w-full max-w-xl mx-auto px-4 sm:px-6 py-8 md:py-12 space-y-6 font-body text-[var(--navy)]" dir="rtl">
        {/* Invoice Card */}
        <div className="bg-[var(--paper)] rounded-[28px] border border-[var(--mist)] shadow-[0_20px_60px_rgba(15,26,43,0.04)] p-6 sm:p-8 space-y-6">
          {/* Phase Badge */}
          <div className="flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[var(--cream)] text-[var(--dusty-blue)] border border-[var(--mist)]">
              <ShieldCheck className="w-3.5 h-3.5 text-[var(--navy)]" />
              <span>بوابة الدفع الآمن والمستقل</span>
            </span>

            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#E9F4EE] text-[#1E6B43] border border-[#C5E4D4]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#1E6B43] animate-pulse" />
              <span>جاهز للتفعيل</span>
            </span>
          </div>

          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-display font-bold text-[var(--navy)] tracking-tight">
              تقرير تحليل واستشارة شراء الشقة
            </h1>
            <p className="text-xs text-[var(--dusty-blue)] leading-relaxed">
              دراسة قطعية شاملة لمطابقة العقارات، كشف التناقضات، وإرشادات المعاينة الميدانية.
            </p>
          </div>

          {/* Price Box */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[var(--cream)] border border-[var(--mist)] space-y-1">
            <span className="text-xs font-medium text-[var(--dusty-blue)] block">المبلغ الإجمالي المستحق:</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-display font-bold text-[var(--navy)] tabular-nums tracking-tight">10.00</span>
              <span className="text-sm font-medium text-[var(--dusty-blue)]">ر.س</span>
            </div>
            <p className="text-xs text-[var(--dusty-blue)] pt-1 tabular-nums">
              المبلغ المستحق: 10.00 ر.س (شامل كافة التحليلات وقائمة المعاينة الميدانية)
            </p>
          </div>

          {/* Feature Inclusions */}
          <div className="space-y-2.5 pt-2 border-t border-[var(--mist)] text-xs text-[var(--dusty-blue)]">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-[#1E6B43] shrink-0" />
              <span className="text-[var(--navy)]">تدقيق قطعي للصك والمخطط وتفادي متوسطات الأسعار المضللة</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-[#1E6B43] shrink-0" />
              <span className="text-[var(--navy)]">مصفوفة مقارنة الخيارات جنباً إلى جنب وترتيب الأفضلية</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-[#1E6B43] shrink-0" />
              <span className="text-[var(--navy)]">قائمة المعاينة الميدانية التفاعلية المخصصة لكل عقار</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-[#1E6B43] shrink-0" />
              <span className="text-[var(--navy)]">إعادة التقييم التلقائي بعد الزيارة مجاناً وبدون أي رسوم إضافية</span>
            </div>
          </div>

          {/* Checkout Submit Form */}
          <form action={startCheckout} className="pt-2">
            <button
              type="submit"
              className="btn-primary w-full inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-[var(--navy)] hover:bg-[var(--midnight)] text-[var(--cream)] font-semibold text-base shadow-sm transition-all active:scale-[0.98] cursor-pointer opacity-100"
            >
              <CreditCard className="w-4 h-4 text-[var(--cream)] opacity-100 shrink-0" />
              <span className="text-[var(--cream)] text-base font-semibold opacity-100">إتمام الدفع التجريبي (10 ر.س)</span>
            </button>
          </form>

          {/* Trust Guarantees */}
          <p className="text-center text-[11px] text-[var(--dusty-blue)] leading-relaxed">
            دفع آمن لمرة واحدة · لا توجد رسوم خفية · أسئلة المتابعة وإعادة التقييم مجانية
          </p>
        </div>
      </div>
    </>
  );
}

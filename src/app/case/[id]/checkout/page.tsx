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
      <div className="w-full max-w-xl mx-auto px-4 sm:px-6 py-8 md:py-12 space-y-6" dir="rtl">
        {/* Invoice Card */}
        <div className="relative bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6 overflow-hidden">
          {/* Ambient Glow */}
          <div className="absolute -top-32 -left-32 w-72 h-72 bg-blue-50/70 rounded-full blur-3xl pointer-events-none" />

          {/* Phase Badge */}
          <div className="flex items-center justify-between gap-3 relative z-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200/70">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>بوابة الدفع الآمن والمستقل</span>
            </span>

            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>جاهز للتفعيل</span>
            </span>
          </div>

          <div className="space-y-1 relative z-10">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              تقرير تحليل واستشارة شراء الشقة
            </h1>
            <p className="text-xs text-slate-500">
              دراسة قطعية شاملة لمطابقة العقارات، كشف التناقضات، وإرشادات المعاينة الميدانية.
            </p>
          </div>

          {/* Price Box */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/90 border border-slate-100 space-y-1 relative z-10">
            <span className="text-xs font-bold text-slate-500 block">المبلغ الإجمالي المستحق:</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 tracking-tight">10.00</span>
              <span className="text-sm font-bold text-slate-600">ر.س</span>
            </div>
            <p className="text-xs font-bold text-slate-700 pt-1">
              المبلغ المستحق: 10.00 ر.س (شامل كافة التحليلات وقائمة المعاينة الميدانية)
            </p>
          </div>

          {/* Feature Inclusions */}
          <div className="space-y-2.5 pt-2 border-t border-slate-100 relative z-10 text-xs text-slate-700 font-medium">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>تدقيق قطعي للصك والمخطط وتفادي متوسطات الأسعار المضللة</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>مصفوفة مقارنة الخيارات جنباً إلى جنب وترتيب الأفضلية</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>قائمة المعاينة الميدانية التفاعلية المخصصة لكل عقار</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>إعادة التقييم التلقائي بعد الزيارة مجاناً وبدون أي رسوم إضافية</span>
            </div>
          </div>

          {/* Checkout Submit Form */}
          <form action={startCheckout} className="pt-2 relative z-10">
            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl bg-slate-900 hover:bg-blue-600 text-white font-extrabold text-sm sm:text-base shadow-md shadow-slate-900/10 transition-all active:scale-[0.98]"
            >
              <CreditCard className="w-4 h-4" />
              <span>إتمام الدفع التجريبي (10 ر.س)</span>
            </button>
          </form>

          {/* Trust Guarantees */}
          <p className="text-center text-[11px] text-slate-400 font-normal leading-relaxed relative z-10">
            دفع آمن لمرة واحدة · لا توجد رسوم خفية · أسئلة المتابعة وإعادة التقييم مجانية
          </p>
        </div>
      </div>
    </>
  );
}

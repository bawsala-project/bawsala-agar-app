import { redirect } from "next/navigation";
import { getSessionUser, requireCase } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { loadPreflightData } from "@/lib/preflight/load";
import { evaluatePreflight } from "@/lib/preflight/evaluate";
import { initiateCheckoutAction } from "@/actions/payments";
import { Button } from "@/components/ui/button";
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
    <div className="w-full max-w-xl mx-auto px-4 py-8 space-y-6">
      <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
        <h1 className="text-xl font-bold text-gray-900">تقرير تحليل واستشارة شراء الشقة</h1>
        <p className="text-sm font-semibold text-gray-800">
          المبلغ المستحق: 10.00 ر.س (شامل كافة التحليلات وقائمة المعاينة الميدانية)
        </p>
        <p className="text-xs text-gray-500">
          دفع آمن لمرة واحدة · لا توجد رسوم خفية · أسئلة المتابعة وإعادة التقييم مجانية
        </p>
      </div>

      <form action={startCheckout}>
        <Button type="submit" variant="primary" className="w-full px-6 py-2.5 text-sm font-bold">
          إتمام الدفع التجريبي (10 ر.س)
        </Button>
      </form>
    </div>
    </>
  );
}

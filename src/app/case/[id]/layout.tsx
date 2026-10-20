import { requireCase } from "@/lib/auth";
import { StepIndicator } from "./step-indicator";
import Link from "next/link";
import { Home } from "lucide-react";
import { BawsalaCompass } from "@/components/brand/bawsala-compass";
import { BawsalaWordmark } from "@/components/brand/bawsala-wordmark";

export default async function CaseLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { id: string };
}) {
  await requireCase(params.id);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--cream)] text-[var(--navy)] antialiased font-body selection:bg-[var(--mist)] selection:text-[var(--navy)]">
      {/* Executive Header */}
      <header className="sticky top-0 z-50 bg-[var(--paper)] border-b border-[var(--mist)] shadow-xs transition-all">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-20 flex items-center justify-between gap-4">
          {/* Brand Logo Lockup */}
          <Link href="/" className="flex items-center gap-3 group shrink-0 no-underline focus:outline-hidden">
            <div className="text-[var(--navy)] flex items-center justify-center">
              <BawsalaCompass size={28} animateHover />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-black text-base sm:text-lg text-[var(--navy)] tracking-tight">
                  بوصلة العقار
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--cream)] text-[var(--dusty-blue)] border border-[var(--mist)]">
                  استشاري المشتري
                </span>
              </div>
              <p className="text-xs text-[var(--dusty-blue)] font-normal hidden sm:block">
                مستشارك الذكي لقرار شراء شقتك
              </p>
            </div>
          </Link>

          {/* Stepper Navigation */}
          <div className="hidden lg:flex items-center justify-center flex-1 max-w-xl">
            <StepIndicator caseId={params.id} />
          </div>

          {/* Return Action */}
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--cream)] border border-[var(--mist)] text-[var(--navy)] text-xs font-bold hover:bg-[var(--paper)] transition-all shadow-xs no-underline"
            >
              <Home className="w-3.5 h-3.5 text-[var(--dusty-blue)]" />
              <span className="hidden sm:inline">الرئيسية</span>
            </Link>
          </div>
        </div>

        {/* Mobile Stepper subheader */}
        <div className="lg:hidden border-t border-[var(--mist)] px-4 py-2.5 overflow-x-auto no-scrollbar flex justify-center bg-[var(--paper)]">
          <StepIndicator caseId={params.id} />
        </div>
      </header>

      {/* Main Page Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 md:py-12">
        {children}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-[var(--mist)] bg-[var(--cream)] py-10 pb-28 md:pb-10">
        <div className="max-w-[1200px] mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--dusty-blue)]">
          <div className="flex items-center gap-2.5">
            <div className="text-[var(--navy)] flex items-center justify-center">
              <BawsalaCompass size={18} animateHover />
            </div>
            <span className="font-display font-black text-sm text-[var(--navy)]">بوصلة العقار</span>
            <span>•</span>
            <span>مستشارك الذكي المستقل لقرار الشراء</span>
          </div>
          <div>مخصص للشقق السكنية في السعودية وفق أولويات المشتري وميزانيته</div>
        </div>

        {/* Large Faint Footer Wordmark in Navy Ink */}
        <div className="w-full overflow-hidden select-none pointer-events-none text-center pt-8 pb-2 opacity-[0.05] text-[var(--navy)]">
          <BawsalaWordmark size="xl" tracking="0.45em" />
        </div>
      </footer>
    </div>
  );
}

import { requireCase } from "@/lib/auth";
import { StepIndicator } from "./step-indicator";
import Link from "next/link";
import { Compass, Home } from "lucide-react";

export default async function CaseLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { id: string };
}) {
  await requireCase(params.id);

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-800 antialiased font-sans">
      {/* Executive Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-slate-100/80 transition-all">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between gap-4">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3.5 group shrink-0">
            <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-sm group-hover:bg-blue-600 transition-colors">
              <Compass className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                  بوصلة العقار
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200/50">
                  استشاري المشتري
                </span>
              </div>
              <p className="text-xs text-slate-400 font-light hidden sm:block">
                فحص فني وهندسي مستقل لقرار التملك
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
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-slate-50 border border-slate-200/70 text-slate-700 text-xs font-bold hover:bg-white hover:border-slate-300 transition-all shadow-xs"
            >
              <Home className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">الرئيسية</span>
            </Link>
          </div>
        </div>

        {/* Mobile Stepper subheader */}
        <div className="lg:hidden border-t border-slate-100/70 px-4 py-2.5 overflow-x-auto no-scrollbar flex justify-center bg-slate-50/60">
          <StepIndicator caseId={params.id} />
        </div>
      </header>

      {/* Main Page Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 md:py-12">
        {children}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200/60 bg-white/60 py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">بوصلة العقار</span>
            <span>•</span>
            <span>منظومة استشارية هندسية ومالية مستقلة</span>
          </div>
          <div>متوافق مع كود البناء السعودي ومعايير الصكوك المحدثة</div>
        </div>
      </footer>
    </div>
  );
}

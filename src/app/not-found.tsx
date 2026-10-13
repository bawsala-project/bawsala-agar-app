import Link from "next/link";
import { Compass, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center" dir="rtl">
      <div className="w-full max-w-md flex flex-col items-center gap-5 bg-white p-8 sm:p-10 rounded-3xl shadow-sm border border-slate-200/80 relative overflow-hidden">
        {/* Subtle Ambient Background Light */}
        <div className="absolute -top-32 -left-32 w-72 h-72 bg-blue-50/70 rounded-full blur-3xl pointer-events-none" />

        <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center text-xl font-bold shadow-md relative z-10">
          <Compass className="w-7 h-7 text-blue-400" />
        </div>

        <div className="space-y-1.5 relative z-10">
          <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
            خطأ 404
          </span>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
            الصفحة غير موجودة
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-xs mx-auto">
            لم نتمكن من العثور على القرار أو الصفحة المطلوبة. قد تكون الحالة قد حُذفت أو تتبع جلسة أخرى.
          </p>
        </div>

        <Link
          href="/"
          className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-slate-900 hover:bg-blue-600 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-slate-900/10 transition-all active:scale-[0.98] relative z-10"
        >
          <span>العودة للرئيسية</span>
          <ArrowLeft className="w-4 h-4" />
        </Link>
      </div>
    </main>
  );
}

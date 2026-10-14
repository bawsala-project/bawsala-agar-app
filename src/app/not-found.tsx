import Link from "next/link";
import { Home } from "lucide-react";
import { BawsalaCompass } from "@/components/brand/bawsala-compass";
import { BawsalaWordmark } from "@/components/brand/bawsala-wordmark";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[var(--cream)] flex flex-col items-center justify-center p-6 text-center font-body text-[var(--navy)] relative" dir="rtl">
      <div className="w-full max-w-md flex flex-col items-center gap-6 bg-[var(--paper)] p-8 sm:p-10 rounded-[28px] shadow-[0_20px_60px_rgba(15,26,43,0.06)] border border-[var(--mist)] relative overflow-hidden z-10">
        <div className="w-16 h-16 rounded-full bg-[var(--cream)] border border-[var(--mist)] text-[var(--navy)] flex items-center justify-center p-2.5 shadow-xs relative z-10">
          <BawsalaCompass size={36} animateHover />
        </div>

        <div className="space-y-2 relative z-10">
          <span className="text-[11px] font-mono font-bold text-[var(--navy)] bg-[var(--cream)] px-3 py-1 rounded-full border border-[var(--mist)] inline-block">
            خطأ 404 • الوجهة مفقودة
          </span>
          <h1 className="text-2xl sm:text-3xl font-display font-black text-[var(--navy)]">
            الصفحة غير موجودة
          </h1>
          <p className="text-xs sm:text-sm text-[var(--dusty-blue)] leading-relaxed max-w-xs mx-auto">
            لم نتمكن من العثور على دراسة القرار أو الصفحة المطلوبة. قد تكون الحالة قد حُذفت أو تتبع جلسة أخرى.
          </p>
        </div>

        <Link
          href="/"
          className="w-full inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-full bg-[var(--navy)] hover:bg-[var(--midnight)] text-[var(--cream)] font-display font-bold text-sm shadow-xs transition-all active:scale-[0.98] relative z-10 no-underline"
        >
          <Home className="w-4 h-4 text-[var(--cream)]" />
          <span>العودة للرئيسية</span>
        </Link>
      </div>

      <div className="mt-8 opacity-25 text-[var(--navy)]">
        <BawsalaWordmark size="sm" tracking="0.3em" />
      </div>
    </main>
  );
}

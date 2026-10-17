import Link from "next/link";
import { redirect } from "next/navigation";
import {
  MapPin,
  Calendar,
  Building2,
  Plus,
  ChevronLeft,
} from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { DASHBOARD_STATUS_LABELS, loadDashboardCases, type DashboardCaseStatus } from "@/lib/dashboard/cases";
import { DeleteCaseButton } from "./delete-case-button";
import { cn } from "@/lib/utils";
import { BawsalaCompass } from "@/components/brand/bawsala-compass";

const STATUS_BADGE_CONFIG: Record<DashboardCaseStatus, { badgeClasses: string; dotClass: string }> = {
  analyzed: {
    badgeClasses: "bg-[#E9F4EE] text-[#1E6B43] border border-[#C5E4D4] font-medium",
    dotClass: "bg-[#1E6B43]",
  },
  inspected: {
    badgeClasses: "bg-[#FFF9EC] text-[#9A6700] border border-[#F9E2AF] font-medium",
    dotClass: "bg-[#9A6700]",
  },
  ready: {
    badgeClasses: "bg-[var(--cream)] text-[var(--navy)] border border-[var(--mist)] font-medium",
    dotClass: "bg-[var(--navy)]",
  },
  draft: {
    badgeClasses: "bg-[var(--cream)] text-[var(--dusty-blue)] border border-[var(--mist)] font-medium",
    dotClass: "bg-[var(--dusty-blue)]",
  },
};

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user || user.is_anonymous) {
    redirect("/");
  }

  const cases = await loadDashboardCases();

  return (
    <main className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-8 md:py-12 space-y-8 font-body text-[var(--navy)]" dir="rtl">
      {/* Header Card */}
      <div className="bg-[var(--paper)] rounded-[28px] border border-[var(--mist)] shadow-[0_20px_60px_rgba(15,26,43,0.04)] p-6 sm:p-8 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--cream)] text-[var(--dusty-blue)] border border-[var(--mist)] text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--navy)]" />
              <span>لوحة التحكم والدراسات العقارية</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-[var(--navy)] tracking-tight">
              حالات القرار الخاصة بي ({cases.length})
            </h1>
            <p className="text-xs sm:text-sm text-[var(--dusty-blue)] max-w-xl leading-relaxed">
              متابعة دراسات التقييم الميداني والمالي، فحص الصكوك ومقارنة العقارات المرشحة لكل مسكن.
            </p>
          </div>

          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--navy)] hover:bg-[var(--midnight)] px-6 py-3 text-xs sm:text-sm font-body font-bold text-[var(--cream)] shadow-sm transition-all self-start sm:self-center shrink-0 active:scale-[0.98] no-underline"
          >
            <Plus className="w-4 h-4" />
            <span>إنشاء حالة جديدة +</span>
          </Link>
        </div>
      </div>

      {/* Cases List */}
      {cases.length === 0 ? (
        <div className="bg-[var(--paper)] rounded-[28px] border border-dashed border-[var(--mist)] p-8 sm:p-12 text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-[var(--cream)] border border-[var(--mist)] text-[var(--navy)] flex items-center justify-center mx-auto p-2.5">
            <BawsalaCompass size={36} animateHover />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h2 className="text-base sm:text-lg font-display font-bold text-[var(--navy)]">
              لا توجد دراسات قرار نشطة حتى الآن
            </h2>
            <p className="text-xs sm:text-sm text-[var(--dusty-blue)] leading-relaxed font-normal">
              ابدأ الآن بإنشاء دراسة استشارية جديدة لتحديد ميزانيتك، فحص عقاراتك المرشحة، والمفاضلة بينها بأرقام قطعية.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[var(--navy)] hover:bg-[var(--midnight)] text-[var(--cream)] font-body font-bold text-xs sm:text-sm shadow-sm transition-all no-underline"
            >
              <Plus className="w-4 h-4" />
              <span>بدء دراسة قرار جديدة</span>
            </Link>
          </div>
        </div>
      ) : (
        <ul className="space-y-4">
          {cases.map((c) => {
            const statusConfig = STATUS_BADGE_CONFIG[c.status] || STATUS_BADGE_CONFIG.draft;

            return (
              <li
                key={c.id}
                className="bg-[var(--paper)] rounded-[28px] border border-[var(--mist)] p-5 sm:p-6 shadow-[0_20px_60px_rgba(15,26,43,0.04)] hover:border-[var(--navy)] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="flex items-center gap-1.5 font-body font-bold text-base sm:text-lg text-[var(--navy)]">
                      <MapPin className="w-4 h-4 text-[var(--navy)] shrink-0" />
                      <span>{c.city}</span>
                    </span>

                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-3 py-0.5 text-xs",
                        statusConfig.badgeClasses
                      )}
                    >
                      <span className={cn("w-1.5 h-1.5 rounded-full", statusConfig.dotClass)} />
                      <span>{DASHBOARD_STATUS_LABELS[c.status]}</span>
                    </span>
                  </div>

                  <p className="text-xs text-[var(--dusty-blue)] flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-[var(--dusty-blue)]" />
                      <span>
                        {new Date(c.createdAt).toLocaleDateString("ar-SA", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </span>

                    <span>·</span>

                    <span className="flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-[var(--dusty-blue)]" />
                      <span className="font-medium text-[var(--navy)]">
                        {c.propertiesCount} {c.propertiesCount === 1 ? "عقار" : "عقارات"}
                      </span>
                    </span>
                  </p>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                  <Link
                    href={c.href}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--navy)] hover:bg-[var(--midnight)] text-[var(--cream)] font-body font-bold text-xs sm:text-sm shadow-sm transition-all active:scale-[0.98] no-underline"
                  >
                    <span>فتح الحالة</span>
                    <ChevronLeft className="w-4 h-4" />
                  </Link>
                  <DeleteCaseButton caseId={c.id} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";
import {
  FolderOpen,
  MapPin,
  Calendar,
  Building2,
  Plus,
} from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { DASHBOARD_STATUS_LABELS, loadDashboardCases, type DashboardCaseStatus } from "@/lib/dashboard/cases";
import { DeleteCaseButton } from "./delete-case-button";
import { cn } from "@/lib/utils";

const STATUS_BADGE_CONFIG: Record<DashboardCaseStatus, { badgeClasses: string; dotClass: string }> = {
  analyzed: {
    badgeClasses: "bg-emerald-50 text-emerald-800 border-emerald-200 shadow-xs",
    dotClass: "bg-emerald-500",
  },
  inspected: {
    badgeClasses: "bg-blue-50 text-blue-800 border-blue-200 shadow-xs",
    dotClass: "bg-blue-500",
  },
  ready: {
    badgeClasses: "bg-amber-50 text-amber-800 border-amber-200 shadow-xs",
    dotClass: "bg-amber-500",
  },
  draft: {
    badgeClasses: "bg-slate-100 text-slate-700 border-slate-200 shadow-xs",
    dotClass: "bg-slate-400",
  },
};

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user || user.is_anonymous) {
    redirect("/");
  }

  const cases = await loadDashboardCases();

  return (
    <main className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-8 md:py-12 space-y-8" dir="rtl">
      {/* Header Card */}
      <div className="relative bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-4 overflow-hidden">
        {/* Subtle Ambient Background Light */}
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-blue-50/60 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200/70 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-blue-600" />
              <span>لوحة التحكم والدراسات العقارية</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              حالات القرار الخاصة بي ({cases.length})
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-xl leading-relaxed">
              متابعة دراسات التقييم الميداني والمالي، فحص الصكوك ومقارنة العقارات المرشحة لكل مسكن.
            </p>
          </div>

          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 hover:bg-blue-600 px-6 py-3 text-xs sm:text-sm font-extrabold text-white shadow-md shadow-slate-900/10 transition-all self-start sm:self-center shrink-0 active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>إنشاء حالة جديدة +</span>
          </Link>
        </div>
      </div>

      {/* Cases List */}
      {cases.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-8 sm:p-12 text-center space-y-4 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
            <FolderOpen className="w-7 h-7" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
              لا توجد دراسات قرار نشطة حتى الآن
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-normal">
              ابدأ الآن بإنشاء دراسة استشارية جديدة لتحديد ميزانيتك، فحص عقاراتك المرشحة، والمفاضلة بينها بأرقام قطعية.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-blue-600/20 transition-all"
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
                className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-sm hover:border-slate-300 hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="flex items-center gap-1.5 font-extrabold text-base sm:text-lg text-slate-900">
                      <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>{c.city}</span>
                    </span>

                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-3 py-0.5 text-xs font-extrabold",
                        statusConfig.badgeClasses
                      )}
                    >
                      <span className={cn("w-1.5 h-1.5 rounded-full", statusConfig.dotClass)} />
                      <span>{DASHBOARD_STATUS_LABELS[c.status]}</span>
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        {new Date(c.createdAt).toLocaleDateString("ar-SA", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </span>

                    <span className="text-slate-300">·</span>

                    <span className="flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-semibold text-slate-700">
                        {c.propertiesCount} {c.propertiesCount === 1 ? "عقار" : "عقارات"}
                      </span>
                    </span>
                  </p>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                  <Link
                    href={c.href}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs sm:text-sm shadow-sm shadow-blue-600/20 transition-all active:scale-[0.98]"
                  >
                    <span>فتح الحالة ←</span>
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

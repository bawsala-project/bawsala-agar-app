import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { DASHBOARD_STATUS_LABELS, loadDashboardCases } from "@/lib/dashboard/cases";
import { DeleteCaseButton } from "./delete-case-button";

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user || user.is_anonymous) {
    redirect("/");
  }

  const cases = await loadDashboardCases();

  return (
    <main className="w-full max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200 pb-5">
        <h1 className="text-2xl font-bold text-gray-900">
          حالات القرار الخاصة بي ({cases.length})
        </h1>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 transition-colors"
        >
          إنشاء حالة جديدة +
        </Link>
      </div>

      <ul className="space-y-3">
        {cases.map((c) => (
          <li
            key={c.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white p-4"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-900">{c.city}</span>
                <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700">
                  {DASHBOARD_STATUS_LABELS[c.status]}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                {new Date(c.createdAt).toLocaleDateString("ar-SA", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}{" "}
                · {c.propertiesCount} {c.propertiesCount === 1 ? "عقار" : "عقارات"}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href={c.href}
                className="text-sm font-bold text-blue-700 hover:text-blue-900 transition-colors"
              >
                فتح الحالة ←
              </Link>
              <DeleteCaseButton caseId={c.id} />
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}

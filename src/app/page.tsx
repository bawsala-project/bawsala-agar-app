import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { startCase } from "@/actions/cases";
import { ALLOWED_CITIES } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export default async function HomePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let cases: { id: string; city: string; created_at: string }[] = [];
  if (user) {
    const { data } = await supabase
      .from("decision_cases")
      .select("id, city, created_at")
      .is("deleted_at", null)
      .order("created_at", { ascending: false });
    cases = data || [];
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 bg-gray-50">
      <div className="w-full max-w-md bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-200/70 flex flex-col gap-6">
        <header className="flex flex-col gap-2 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 mx-auto rounded-xl bg-blue-50 text-blue-600 mb-1">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">بوصلة العقار</h1>
          <p className="text-sm text-gray-600">
            قارن بين الشقق المرشحة لك واتخذ قرار الشراء بوضوح.
          </p>
        </header>

        <form action={startCase} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="city" className="text-sm font-medium text-gray-700">
              المدينة المستهدفة
            </label>
            <select
              id="city"
              name="city"
              required
              defaultValue={ALLOWED_CITIES[0]}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            >
              {ALLOWED_CITIES.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>

          <Button type="submit" variant="primary" className="w-full py-2.5 text-sm sm:text-base font-semibold">
            ابدأ استشارة جديدة
          </Button>
        </form>

        {cases.length > 0 && (
          <section className="flex flex-col gap-3 pt-6 border-t border-gray-200">
            <h2 className="text-sm font-semibold text-gray-700">قراراتك السابقة</h2>
            <ul className="flex flex-col gap-2">
              {cases.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/case/${c.id}/needs`}
                    className="flex items-center justify-between p-3 rounded-md border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors text-sm text-gray-900"
                  >
                    <span className="font-medium">{c.city}</span>
                    <span className="text-xs text-gray-500">
                      {new Date(c.created_at).toLocaleDateString("ar-SA", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </main>
  );
}

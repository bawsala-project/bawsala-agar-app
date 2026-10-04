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
    <main className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md flex flex-col gap-6">
        <header className="flex flex-col gap-2 text-center">
          <h1 className="text-3xl font-bold text-gray-900">بوصلة العقار</h1>
          <p className="text-gray-600">
            قارن بين الشقق المرشحة لك واتخذ قرار الشراء بوضوح.
          </p>
        </header>

        <form action={startCase} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="city" className="text-sm font-medium text-gray-700">
              المدينة
            </label>
            <select
              id="city"
              name="city"
              required
              defaultValue={ALLOWED_CITIES[0]}
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {ALLOWED_CITIES.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>

          <Button type="submit" variant="primary">
            ابدأ
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

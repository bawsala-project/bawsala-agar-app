import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <div className="w-full max-w-md flex flex-col items-center gap-4 bg-white p-8 rounded-xl shadow-sm border border-gray-100">
        <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center text-xl font-bold">
          404
        </div>
        <h1 className="text-xl font-bold text-gray-900">الصفحة غير موجودة</h1>
        <p className="text-sm text-gray-600">
          لم نتمكن من العثور على القرار أو الصفحة المطلوبة. قد تكون الحالة قد حُذفت أو تتبع جلسة أخرى.
        </p>
        <Link href="/" className="mt-2 w-full">
          <Button variant="primary" className="w-full">
            العودة للرئيسية
          </Button>
        </Link>
      </div>
    </main>
  );
}

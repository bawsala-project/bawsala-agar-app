import { NextResponse } from "next/server";
import { importClippedProperty } from "@/actions/properties";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { caseId, source_url, title, text, propertyId } = body || {};

    if (!caseId || !source_url || !text) {
      return NextResponse.json(
        { ok: false, error: "المعاملات المطلوبة: caseId, source_url, text" },
        { status: 400 }
      );
    }

    const res = await importClippedProperty(caseId, {
      source_url,
      title,
      text,
      propertyId,
    });

    if (!res.success) {
      return NextResponse.json(
        { ok: false, error: res.error || "فشل استخراج البيانات" },
        { status: 422 }
      );
    }

    return NextResponse.json({
      ok: true,
      propertyId: res.propertyId,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "خطأ غير متوقع" },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderToString } from "react-dom/server";
import React from "react";
import { InspectionView } from "./inspection-view";
import { FindingItem } from "./finding-item";
import type { InspectionItemRow } from "@/actions/inspection";

describe("Inspection Checklist Page - Acceptance 3 & 5", () => {
  const caseId = "case-inspect-test";
  const prop1Id = "prop-alpha";
  const prop2Id = "prop-beta";

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const sampleItems: InspectionItemRow[] = [
    {
      id: "item-1",
      property_id: prop1Id,
      category: "building_services",
      question_ar: "هل المصعد متوفر ويعمل بكفاءة وتوجد صيانة دورية معتمدة؟",
      why_it_matters_ar: "سهولة الوصول اليومي وسلامة العائلة، وتجنب مشقة استخدام الدرج.",
      how_to_check_ar: "معاينة عمل المصعد وتاريخ آخر صيانة",
      priority: "high",
      trigger_reason: "unknown_fact",
      affected_assessment_types: ["fit", "daily_life"],
      created_at: new Date().toISOString(),
    },
    {
      id: "item-2",
      property_id: prop1Id,
      category: "parking_access",
      question_ar: "هل يتوفر موقف سيارة خاص ومسجل رسميًا للوحدة؟",
      why_it_matters_ar: "ضمان توفر موقف محجوز للوحدة وتجنب النزاعات اليومية مع الجيران.",
      how_to_check_ar: "التأكد من رقم الموقف المسجل بالصك وتجربة الدخول بالسيارة",
      priority: "medium",
      trigger_reason: "constraint_verification",
      affected_assessment_types: ["fit", "daily_life"],
      created_at: new Date().toISOString(),
    },
    {
      id: "item-3",
      property_id: prop1Id,
      category: "unit_specs",
      question_ar: "ما هي المساحة الدقيقة للوحدة الصافية المثبتة في الصك؟",
      why_it_matters_ar: "وجود تعارض في بيانات المساحة؛ مطابقة الصك تحمي من دفع سعر أعلى.",
      how_to_check_ar: "طلب مسح الصك العقاري ومطابقة المخطط المعتمد",
      priority: "high",
      trigger_reason: "conflict",
      affected_assessment_types: ["fit", "price"],
      created_at: new Date().toISOString(),
    },
    {
      id: "item-4",
      property_id: prop1Id,
      category: "unit_specs",
      question_ar: "ما مدى قوة ضغط المياه وجودة العزل الصوتي للنوافذ ضد الضوضاء؟",
      why_it_matters_ar: "ضعف تدفق المياه والضجيج الخارجي من أكثر المنغصات اليومية شيوعاً.",
      how_to_check_ar: "فحص ضغط المياه وجودة العزل الصوتي للنوافذ",
      priority: "low",
      trigger_reason: "detected_risk",
      affected_assessment_types: ["daily_life"],
      created_at: new Date().toISOString(),
    },
    {
      id: "item-5",
      property_id: prop1Id,
      category: "neighborhood",
      question_ar: "هل موقع العقار والحي مخدوم بشبكات البنية التحتية والخدمات الأساسية؟",
      why_it_matters_ar: "توفر الصرف الصحي والمياه وشبكة الألياف يحدد استقرار وجودة السكن.",
      how_to_check_ar: "التأكد من أغطية الصرف الصحي وكبائن الاتصالات وسؤال سكان الحي",
      priority: "medium",
      trigger_reason: "unknown_fact",
      affected_assessment_types: ["daily_life"],
      created_at: new Date().toISOString(),
    },
  ];

  it("renders checklist grouped by category with priority badges and displays switcher tabs for multiple properties", async () => {
    const auth = await import("@/lib/auth");
    const serverSupabase = await import("@/lib/supabase/server");
    const inspectionAction = await import("@/actions/inspection");

    vi.spyOn(auth, "requireCase").mockResolvedValue({
      id: caseId,
      owner_id: "user-1",
      city: "الرياض",
      state_version: 1,
      status: "analyzed",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
    });

    vi.spyOn(serverSupabase, "createClient").mockReturnValue({
      from: (table: string) => {
        if (table === "properties") {
          return {
            select: () => ({
              eq: () => ({
                order: async () => ({
                  data: [
                    {
                      id: prop1Id,
                      title: "شقة الياسمين الفاخرة",
                      district: "الياسمين",
                      listing_price_sar: 750000,
                      input_mode: "manual",
                      source_url: null,
                      notes: null,
                    },
                    {
                      id: prop2Id,
                      title: "شقة الملقا المودرن",
                      district: "الملقا",
                      listing_price_sar: 820000,
                      input_mode: "manual",
                      source_url: null,
                      notes: null,
                    },
                  ],
                  error: null,
                }),
              }),
            }),
          };
        }
        return { select: () => ({ eq: async () => ({ data: [] }) }) };
      },
    } as any);

    vi.spyOn(inspectionAction, "getOrGenerateInspectionItems").mockResolvedValue(sampleItems);
    vi.spyOn(inspectionAction, "getInspectionFindings").mockResolvedValue([]);

    const { default: InspectionPage } = await import("./page");

    // 1. Render without propertyId param (defaults to property #1)
    const pageJSX = await InspectionPage({
      params: { id: caseId },
      searchParams: {},
    });

    const html = renderToString(pageJSX);

    // Header & Title
    expect(html).toContain("قائمة المعاينة الميدانية");
    expect(html).toContain("شقة الياسمين الفاخرة");

    // Property switcher tabs
    expect(html).toContain('role="tablist"');
    expect(html).toContain("شقة الملقا المودرن");
    expect(html).toContain(`propertyId=${prop2Id}`);

    // Category groupings
    expect(html).toContain("خدمات ومرافق المبنى");
    expect(html).toContain("مواصفات وتشطيب الوحدة");
    expect(html).toContain("المواقف وسهولة الوصول");
    expect(html).toContain("الحي والموقع العام");

    // Items details: Questions, Why it matters, How to check on site
    expect(html).toContain("هل المصعد متوفر ويعمل بكفاءة");
    expect(html).toContain("معاينة عمل المصعد وتاريخ آخر صيانة");
    expect(html).toContain("التأكد من رقم الموقف المسجل بالصك وتجربة الدخول بالسيارة");
    expect(html).toContain("طلب مسح الصك العقاري ومطابقة المخطط المعتمد");

    // Priority badges: high (عاجل), medium (مهم), low (إرشادي)
    expect(html).toContain("عاجل");
    expect(html).toContain("مهم");
    expect(html).toContain("إرشادي");

    // Interactive finding buttons: 3 segmented radios
    expect(html).toContain("سليم / مطابق");
    expect(html).toContain("مشكلة / مخالف");
    expect(html).toContain("لم أتحقق");

    // Bottom summary bar
    const cleanHtml1 = html.replace(/<!-- -->/g, "");
    expect(cleanHtml1).toContain("تم فحص 0 من 5 بنود (0 مشاكل مسجلة)");
  });

  it("Acceptance 5: bottom summary bar updates dynamically and displays CTA when findings exist", () => {
    // Render InspectionView with pre-populated findings
    const initialFindings = [
      {
        id: "f-1",
        inspection_item_id: "item-1",
        property_id: prop1Id,
        result: "problem",
        note: "المصعد يصدر صوتاً غريباً ومتوقف عن العمل",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "f-2",
        inspection_item_id: "item-2",
        property_id: prop1Id,
        result: "good",
        note: "الموقف واسع ومطابق لرقم الصك",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    const html = renderToString(
      React.createElement(InspectionView, {
        caseId,
        propertyId: prop1Id,
        items: sampleItems,
        initialFindings,
      })
    );

    const cleanHtml2 = html.replace(/<!-- -->/g, "");

    // Dynamic Summary Bar: 2 of 5 checked, 1 problem recorded
    expect(cleanHtml2).toContain("تم فحص 2 من 5 بنود (1 مشاكل مسجلة)");
    expect(cleanHtml2).toContain("1 مطابق");

    // Primary CTA displayed linking to /case/[id]/reassess?propertyId={propertyId}
    expect(cleanHtml2).toContain("تحديث التقييم بناءً على الزيارة");
    expect(cleanHtml2).toContain(`/case/${caseId}/reassess?propertyId=${prop1Id}`);

    // Auto-expanded notes
    expect(html).toContain("المصعد يصدر صوتاً غريباً ومتوقف عن العمل");
  });

  it("FindingItem renders 3 segmented radio buttons and auto-expands note when result is selected", () => {
    const item = sampleItems[0];

    const htmlWithProblem = renderToString(
      React.createElement(FindingItem, {
        caseId,
        propertyId: prop1Id,
        item,
        initialFinding: { result: "problem", note: "ملاحظة الفحص" },
      })
    );

    expect(htmlWithProblem).toContain('role="radiogroup"');
    expect(htmlWithProblem).toContain("سليم / مطابق");
    expect(htmlWithProblem).toContain("مشكلة / مخالف");
    expect(htmlWithProblem).toContain("لم أتحقق");
    // Notes area expanded
    expect(htmlWithProblem).toContain("ملاحظات إضافية (اختياري)");
    expect(htmlWithProblem).toContain("ملاحظة الفحص");
    expect(htmlWithProblem).toContain("/300");
  });

  it("selects property from ?propertyId= param correctly", async () => {
    const auth = await import("@/lib/auth");
    const serverSupabase = await import("@/lib/supabase/server");
    const inspectionAction = await import("@/actions/inspection");

    vi.spyOn(auth, "requireCase").mockResolvedValue({
      id: caseId,
      owner_id: "user-1",
      city: "الرياض",
      state_version: 1,
      status: "analyzed",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
    });

    vi.spyOn(serverSupabase, "createClient").mockReturnValue({
      from: () => ({
        select: () => ({
          eq: () => ({
            order: async () => ({
              data: [
                { id: prop1Id, title: "شقة 1", district: "الياسمين" },
                { id: prop2Id, title: "شقة 2", district: "الملقا" },
              ],
              error: null,
            }),
          }),
        }),
      }),
    } as any);

    const getItemsSpy = vi
      .spyOn(inspectionAction, "getOrGenerateInspectionItems")
      .mockResolvedValue([]);
    vi.spyOn(inspectionAction, "getInspectionFindings").mockResolvedValue([]);

    const { default: InspectionPage } = await import("./page");

    await InspectionPage({
      params: { id: caseId },
      searchParams: { propertyId: prop2Id },
    });

    expect(getItemsSpy).toHaveBeenCalledWith(caseId, prop2Id);
  });
});

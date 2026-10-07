/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockAdminFrom = vi.fn();

vi.mock("@/lib/supabase/admin", () => {
  return {
    adminSupabase: {
      from: (table: string) => mockAdminFrom(table),
    },
    getAdminClient: () => ({
      from: (table: string) => mockAdminFrom(table),
    }),
    createAdminClient: () => ({
      from: (table: string) => mockAdminFrom(table),
    }),
  };
});

describe("Inspection Server Action - getOrGenerateInspectionItems", () => {
  const caseId = "case-action-test";
  const propertyId = "prop-action-test";

  beforeEach(() => {
    vi.restoreAllMocks();
    mockAdminFrom.mockReset();
  });

  it("returns existing items if they already exist in the database without re-generating", async () => {
    const auth = await import("@/lib/auth");
    const serverSupabase = await import("@/lib/supabase/server");

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

    const existingMock = [
      {
        id: "existing-item-1",
        property_id: propertyId,
        category: "building_services",
        question_ar: "سؤال موجود مسبقاً؟",
        why_it_matters_ar: "أهمية",
        how_to_check_ar: "طريقة الفحص",
        priority: "high",
        trigger_reason: "unknown_fact",
        affected_assessment_types: ["fit"],
        created_at: new Date().toISOString(),
      },
    ];

    vi.spyOn(serverSupabase, "createClient").mockReturnValue({
      from: (table: string) => {
        if (table === "inspection_items") {
          return {
            select: () => ({
              eq: () => ({
                order: async () => ({
                  data: existingMock,
                  error: null,
                }),
              }),
            }),
          };
        }
        return { select: () => ({}) };
      },
    } as any);

    const { getOrGenerateInspectionItems } = await import("./inspection");

    const result = await getOrGenerateInspectionItems(caseId, propertyId);

    expect(result).toEqual(existingMock);
    // Should NOT have called admin insert because items already existed!
    expect(mockAdminFrom).not.toHaveBeenCalled();
  });

  it("loads property, facts, constraints, generates 5-12 items, and inserts via admin client when none exist", async () => {
    const auth = await import("@/lib/auth");
    const serverSupabase = await import("@/lib/supabase/server");

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
        if (table === "inspection_items") {
          return {
            select: () => ({
              eq: () => ({
                order: async () => ({
                  data: [], // No existing items!
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "properties") {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  single: async () => ({
                    data: {
                      id: propertyId,
                      case_id: caseId,
                      floor_no: 2,
                      property_facts: [
                        {
                          id: "fact-1",
                          property_id: propertyId,
                          field: "elevator",
                          value_boolean: null,
                          source: "url",
                          confidence: "stated",
                          created_at: new Date().toISOString(),
                        },
                      ],
                    },
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        if (table === "requirements") {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: {
                    case_id: caseId,
                    elevator_required: true,
                    max_budget_sar: 1_000_000,
                  },
                  error: null,
                }),
              }),
            }),
          };
        }
        return { select: () => ({}) };
      },
    } as any);

    let insertedPayload: any[] = [];
    mockAdminFrom.mockImplementation((table: string) => {
      if (table === "inspection_items") {
        return {
          insert: (rows: any[]) => {
            insertedPayload = rows;
            return {
              select: async () => ({
                data: rows.map((r, idx) => ({ ...r, id: `inserted-${idx}` })),
                error: null,
              }),
            };
          },
        };
      }
      return {} as any;
    });

    const { getOrGenerateInspectionItems } = await import("./inspection");

    const result = await getOrGenerateInspectionItems(caseId, propertyId);

    expect(result.length).toBeGreaterThanOrEqual(5);
    expect(result.length).toBeLessThanOrEqual(12);
    expect(insertedPayload.length).toBe(result.length);
    expect(insertedPayload.every((p) => p.property_id === propertyId)).toBe(true);
  });
});

describe("Inspection Server Action - saveFindingAction (Acceptance 2, 3, 4)", () => {
  const caseId = "case-finding-test";
  const propertyId = "prop-finding-test";
  const itemId = "item-finding-test";

  beforeEach(() => {
    vi.restoreAllMocks();
    mockAdminFrom.mockReset();
  });

  it("Acceptance 2 & 4: saves finding with result 'problem' and trims note to max 300 characters", async () => {
    const auth = await import("@/lib/auth");
    const serverSupabase = await import("@/lib/supabase/server");

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
        if (table === "inspection_items") {
          return {
            select: () => ({
              eq: () => ({
                single: async () => ({
                  data: { id: itemId, property_id: propertyId },
                  error: null,
                }),
              }),
            }),
          };
        }
        return { select: () => ({}) };
      },
    } as any);

    let upsertPayload: any = null;
    let upsertOptions: any = null;
    mockAdminFrom.mockImplementation((table: string) => {
      if (table === "inspection_findings") {
        return {
          upsert: (payload: any, options: any) => {
            upsertPayload = payload;
            upsertOptions = options;
            return {
              select: () => ({
                single: async () => ({
                  data: { id: "finding-problem-1" },
                  error: null,
                }),
              }),
            };
          },
        };
      }
      return {} as any;
    });

    const { saveFindingAction } = await import("./inspection");

    // Pass a 350-character note with extra whitespace
    const rawNote = "   " + "ملاحظة فحص ميداني مهمة جداً ومفصلة. ".repeat(15) + "   ";
    const res = await saveFindingAction(caseId, propertyId, itemId, "problem", rawNote);

    expect(res.success).toBe(true);
    expect(res.findingId).toBe("finding-problem-1");
    expect(upsertPayload).toBeDefined();
    expect(upsertPayload.inspection_item_id).toBe(itemId);
    expect(upsertPayload.property_id).toBe(propertyId);
    expect(upsertPayload.result).toBe("problem");
    expect(upsertOptions).toEqual({ onConflict: "inspection_item_id" });

    // Verify note is trimmed and capped at max 300 characters
    expect(upsertPayload.note.length).toBeLessThanOrEqual(300);
    expect(upsertPayload.note).not.toMatch(/^\s+/);
    expect(upsertPayload.note).not.toMatch(/\s+$/);
  });

  it("Acceptance 3: updates existing finding when changing from problem to good without duplicate rows", async () => {
    const auth = await import("@/lib/auth");
    const serverSupabase = await import("@/lib/supabase/server");

    vi.spyOn(auth, "requireCase").mockResolvedValue({
      id: caseId,
      owner_id: "user-1",
      city: "الرياض",
      state_version: 2,
      status: "analyzed",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
    });

    vi.spyOn(serverSupabase, "createClient").mockReturnValue({
      from: () => ({
        select: () => ({
          eq: () => ({
            single: async () => ({
              data: { id: itemId, property_id: propertyId },
              error: null,
            }),
          }),
        }),
      }),
    } as any);

    let upsertPayload: any = null;
    let upsertOptions: any = null;
    mockAdminFrom.mockImplementation((table: string) => {
      if (table === "inspection_findings") {
        return {
          upsert: (payload: any, options: any) => {
            upsertPayload = payload;
            upsertOptions = options;
            return {
              select: () => ({
                single: async () => ({
                  data: { id: "finding-problem-1" }, // Same finding ID updated!
                  error: null,
                }),
              }),
            };
          },
        };
      }
      return {} as any;
    });

    const { saveFindingAction } = await import("./inspection");

    const res = await saveFindingAction(caseId, propertyId, itemId, "good", "تم التأكد وسليم");

    expect(res.success).toBe(true);
    expect(upsertPayload.result).toBe("good");
    expect(upsertPayload.inspection_item_id).toBe(itemId);
    expect(upsertOptions).toEqual({ onConflict: "inspection_item_id" });
  });

  it("rejects invalid finding result enum", async () => {
    const auth = await import("@/lib/auth");
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

    const { saveFindingAction } = await import("./inspection");

    const res = await saveFindingAction(
      caseId,
      propertyId,
      itemId,
      "invalid_status" as any,
      null
    );

    expect(res.success).toBe(false);
    expect(res.error).toBe("قيمة الفحص غير صالحة");
  });
});


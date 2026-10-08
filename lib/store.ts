"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  PropertyItem,
  UserNeed,
  InspectionQuestion,
  INITIAL_USER_NEED,
  INITIAL_PROPERTIES,
  INITIAL_INSPECTION_ITEMS,
  INITIAL_SAVED_CASES,
} from "./seed";

export type RankingViewMode = "ranked" | "provisional" | "insufficient";

interface AppState {
  // Need & Constraints
  selectedCity: string;
  selectedCityId: string;
  selectedDistrict: string;
  selectedDistrictId: string;
  setSelectedCity: (city: string, cityId?: string) => void;
  setSelectedDistrict: (district: string, districtId?: string) => void;
  userNeed: UserNeed;
  updateBudget: (budget: number, formatted: string) => void;
  updateHardBudget: (budget: number, formatted?: string) => void;
  updatePreferencePriority: (id: string, priority: "high" | "medium" | "low") => void;

  // Properties list
  properties: PropertyItem[];
  addProperty: (property: Partial<PropertyItem>) => void;
  removeProperty: (id: string) => void;

  // Preflight resolutions
  p1AreaResolved: boolean;
  p1SelectedArea: string; // "148" | "160"
  resolveP1Area: (area: "148" | "160") => void;

  p3AgeResolved: boolean;
  p3BuildingAge: string;
  resolveP3Age: (age: string) => void;

  // Checkout
  checkoutStatus: "idle" | "success" | "failed";
  setCheckoutStatus: (status: "idle" | "success" | "failed") => void;

  // Results & Ranking
  rankingMode: RankingViewMode;
  setRankingMode: (mode: RankingViewMode) => void;
  selectedForVisit: string[];
  toggleSelectForVisit: (id: string) => void;
  bookmarkedIds: string[];
  toggleBookmark: (id: string) => void;

  // Inspection
  inspectionItems: InspectionQuestion[];
  inspectionAnswers: Record<string, "good" | "problem" | "unchecked">;
  inspectionNotes: Record<string, string>;
  setInspectionAnswer: (id: string, status: "good" | "problem" | "unchecked") => void;
  setInspectionNote: (id: string, note: string) => void;

  // Reassessment
  isReassessed: boolean;
  applyReassessment: () => void;

  // Dashboard & Cases
  savedCases: typeof INITIAL_SAVED_CASES;
  deleteCase: (id: string) => void;

  // Global Modals & Toasts & Auth
  isAuthenticated: boolean;
  setAuthenticated: (auth: boolean, phone?: string) => void;
  isLoginSheetOpen: boolean;
  setLoginSheetOpen: (open: boolean) => void;
  isAddSheetOpen: boolean;
  setAddSheetOpen: (open: boolean) => void;

  toast: string | null;
  showToast: (msg: string) => void;
  clearToast: () => void;

  // Reset Demo
  resetDemo: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      selectedCity: "الرياض",
      selectedCityId: "riyadh",
      selectedDistrict: "الياسمين",
      selectedDistrictId: "riyadh-alyasmin",
      setSelectedCity: (city, cityId) =>
        set({
          selectedCity: city,
          selectedCityId: cityId || "riyadh",
        }),
      setSelectedDistrict: (district, districtId) =>
        set({
          selectedDistrict: district,
          selectedDistrictId: districtId || "riyadh-alyasmin",
        }),
      userNeed: INITIAL_USER_NEED,
      updateBudget: (budget, formatted) =>
        set((state) => ({
          userNeed: {
            ...state.userNeed,
            hardConstraint: {
              ...state.userNeed.hardConstraint,
              numericBudget: budget,
              value: formatted,
            },
          },
        })),
      updateHardBudget: (budget, formatted) =>
        set((state) => ({
          userNeed: {
            ...state.userNeed,
            hardConstraint: {
              ...state.userNeed.hardConstraint,
              numericBudget: budget,
              value: formatted || `${budget.toLocaleString("ar-SA")} ر.س`,
            },
          },
        })),
      bookmarkedIds: ["p1"],
      toggleBookmark: (id) =>
        set((state) => ({
          bookmarkedIds: state.bookmarkedIds.includes(id)
            ? state.bookmarkedIds.filter((item) => item !== id)
            : [...state.bookmarkedIds, id],
        })),
      isAuthenticated: true,
      setAuthenticated: (auth) => set({ isAuthenticated: auth }),
      updatePreferencePriority: (id, priority) =>
        set((state) => ({
          userNeed: {
            ...state.userNeed,
            preferences: state.userNeed.preferences.map((p) =>
              p.id === id
                ? {
                    ...p,
                    priority,
                    priorityLabel:
                      priority === "high"
                        ? "أولوية مرتفعة"
                        : priority === "medium"
                        ? "أولوية متوسطة"
                        : "أولوية منخفضة",
                  }
                : p
            ),
          },
        })),

      properties: INITIAL_PROPERTIES,
      addProperty: (prop) => {
        const current = get().properties;
        if (current.length >= 5) return;
        const newId = `p${current.length + 1}`;
        const newProp: PropertyItem = {
          id: newId,
          title: prop.title || `شقة مقترحة ${current.length + 1}`,
          price: prop.price || 850000,
          formattedPrice: prop.formattedPrice || `${(prop.price || 850000).toLocaleString("ar-SA")} ر.س`,
          areaM2: prop.areaM2 || 140,
          rooms: prop.rooms || 3,
          district: prop.district || "شمال الرياض",
          source: prop.source || "link",
          sourceLabel: prop.sourceLabel || "رابط مضاف",
          colorTone: (["sandstone", "cocoa", "driftwood"] as const)[current.length % 3],
          images: prop.images || [],
          preRank: current.length + 1,
          postRank: current.length + 1,
          visitPriority: "medium",
          visitPriorityReason: "عقار مضاف حديثاً يتطلب استكمال قراءة المؤشرات.",
          keyAdvantage: "موقع ملائم ومساحة متناسبة مع الاحتياج",
          keyTradeoff: "بانتظار تدقيق تفاصيل المخطط والصك",
          fairPriceStatus: "available",
          fairPriceRange: "5,400 - 5,800 ر.س / م²",
          travelTimeWorkMin: 18,
          facts: [
            {
              id: `${newId}-price`,
              label: "سعر العقار",
              value: prop.formattedPrice || "850,000 ر.س",
              certainty: "reported",
              scope: "property",
            },
            {
              id: `${newId}-area`,
              label: "المساحة",
              value: `${prop.areaM2 || 140} م²`,
              certainty: "reported",
              scope: "property",
            },
          ],
          whyReasons: [
            {
              category: "الملاءمة",
              title: "توافق مبدئي مع الشروط الأساسية",
              description: "تم استيراد العقار وجاري مواءمة الأوزان التفضيلية.",
              certainty: "reported",
            },
          ],
        };
        set({ properties: [...current, newProp] });
        get().showToast("تمت إضافة العقار بنجاح");
      },
      removeProperty: (id) =>
        set((state) => ({
          properties: state.properties.filter((p) => p.id !== id),
        })),

      // Preflight
      p1AreaResolved: false,
      p1SelectedArea: "148",
      resolveP1Area: (area) =>
        set((state) => ({
          p1AreaResolved: true,
          p1SelectedArea: area,
          properties: state.properties.map((p) =>
            p.id === "p1"
              ? {
                  ...p,
                  areaM2: Number(area),
                  facts: p.facts.map((f) =>
                    f.id === "p1-area"
                      ? {
                          ...f,
                          value: `${area} م² (تم اعتماده اختيارياً)`,
                          certainty: "user_observed",
                        }
                      : f
                  ),
                }
              : p
          ),
        })),

      p3AgeResolved: false,
      p3BuildingAge: "",
      resolveP3Age: (age) =>
        set((state) => ({
          p3AgeResolved: true,
          p3BuildingAge: age,
          properties: state.properties.map((p) =>
            p.id === "p3"
              ? {
                  ...p,
                  facts: p.facts.map((f) =>
                    f.id === "p3-age"
                      ? {
                          ...f,
                          value: `${age} سنوات (مُدخل يدوياً)`,
                          certainty: "user_observed",
                        }
                      : f
                  ),
                }
              : p
          ),
        })),

      // Checkout
      checkoutStatus: "idle",
      setCheckoutStatus: (status) => set({ checkoutStatus: status }),

      // Results
      rankingMode: "ranked",
      setRankingMode: (mode) => set({ rankingMode: mode }),
      selectedForVisit: ["p1", "p3"],
      toggleSelectForVisit: (id) =>
        set((state) => ({
          selectedForVisit: state.selectedForVisit.includes(id)
            ? state.selectedForVisit.filter((item) => item !== id)
            : [...state.selectedForVisit, id],
        })),

      // Inspection
      inspectionItems: INITIAL_INSPECTION_ITEMS,
      inspectionAnswers: {
        "insp-1": "problem", // Pre-filled leak problem
        "insp-2": "good",
        "insp-3": "good",
        "insp-4": "good",
        "insp-5": "good",
        "insp-6": "unchecked",
        "insp-7": "unchecked",
        "insp-8": "unchecked",
      },
      inspectionNotes: {
        "insp-1": "لوحظت آثار رطوبة وتقشر طلاء في سقف الممر قرب حمام الضيوف.",
        "insp-2": "تم التأكد من أبعاد الصالة والغرفة الرئيسية وتبدو متطابقة مع 148 م² الصافية.",
      },
      setInspectionAnswer: (id, status) =>
        set((state) => ({
          inspectionAnswers: { ...state.inspectionAnswers, [id]: status },
        })),
      setInspectionNote: (id, note) =>
        set((state) => ({
          inspectionNotes: { ...state.inspectionNotes, [id]: note },
        })),

      // Reassessment
      isReassessed: false,
      applyReassessment: () =>
        set((state) => ({
          isReassessed: true,
          properties: state.properties.map((p) => {
            if (p.id === "p1") {
              return {
                ...p,
                preRank: 2,
                visitPriority: "medium",
                visitPriorityReason: "تراجع الترتيب لوجود مشكلة رطوبة وتسرب في السقف تستلزم فحصاً معمارياً دقيقاً.",
              };
            }
            if (p.id === "p3") {
              return {
                ...p,
                preRank: 1,
                visitPriority: "high",
                visitPriorityReason: "تصدر الخيارات بعد استقرار فحص سلامة البناء وتفوق الوفر المالي.",
              };
            }
            return p;
          }),
        })),

      // Dashboard
      savedCases: INITIAL_SAVED_CASES,
      deleteCase: (id) =>
        set((state) => ({
          savedCases: state.savedCases.filter((c) => c.id !== id),
        })),

      // Modals & Toast
      isLoginSheetOpen: false,
      setLoginSheetOpen: (open) => set({ isLoginSheetOpen: open }),
      isAddSheetOpen: false,
      setAddSheetOpen: (open) => set({ isAddSheetOpen: open }),

      toast: null,
      showToast: (msg) => {
        set({ toast: msg });
        setTimeout(() => {
          if (get().toast === msg) set({ toast: null });
        }, 3500);
      },
      clearToast: () => set({ toast: null }),

      // Full reset of demo state
      resetDemo: () => {
        if (typeof window !== "undefined") {
          sessionStorage.clear();
        }
        set({
          selectedCity: "الرياض",
          selectedCityId: "riyadh",
          selectedDistrict: "الياسمين",
          selectedDistrictId: "riyadh-alyasmin",
          userNeed: INITIAL_USER_NEED,
          properties: INITIAL_PROPERTIES,
          p1AreaResolved: false,
          p1SelectedArea: "148",
          p3AgeResolved: false,
          p3BuildingAge: "",
          checkoutStatus: "idle",
          rankingMode: "ranked",
          selectedForVisit: ["p1", "p3"],
          inspectionItems: INITIAL_INSPECTION_ITEMS,
          inspectionAnswers: {
            "insp-1": "problem",
            "insp-2": "good",
            "insp-3": "good",
            "insp-4": "good",
            "insp-5": "good",
            "insp-6": "unchecked",
            "insp-7": "unchecked",
            "insp-8": "unchecked",
          },
          inspectionNotes: {
            "insp-1": "لوحظت آثار رطوبة وتقشر طلاء في سقف الممر قرب حمام الضيوف.",
            "insp-2": "تم التأكد من أبعاد الصالة والغرفة الرئيسية وتبدو متطابقة مع 148 م² الصافية.",
          },
          isReassessed: false,
          savedCases: INITIAL_SAVED_CASES,
          isLoginSheetOpen: false,
          isAddSheetOpen: false,
          toast: "تمت إعادة ضبط بيانات النموذج التجريبي بنجاح (Seed Reset)",
        });
      },
    }),
    {
      name: "bawsala-demo-storage",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);

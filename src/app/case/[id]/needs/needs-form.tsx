"use client";

import React, { useState } from "react";
import { useFormState as useActionState, useFormStatus } from "react-dom";
import {
  ShieldCheck,
  ArrowLeft,
  Coins,
  Users,
  Layers,
  Car,
  Sparkles,
  Plus,
  Trash2,
  AlertCircle,
  Loader2,
  Building2,
  Check,
} from "lucide-react";
import { FieldError } from "@/components/ui/field-error";
import { formatSAR } from "@/lib/utils";
import { saveRequirements, RequirementsFormState } from "@/actions/requirements";
import type { Database } from "@/types/database";
import type {
  HardConstraint,
  PreferenceWeight,
  LocationFrequency,
} from "@/lib/schemas/requirements";

type RequirementsRow = Database["public"]["Tables"]["requirements"]["Row"];

interface CustomConstraintItem {
  id: string;
  text: string;
}

interface PreferenceItem {
  id: string;
  label: string;
  weight: PreferenceWeight;
}

interface LocationItem {
  id: string;
  label: string;
  address_text: string;
  frequency: LocationFrequency;
}

interface NeedsFormProps {
  caseId: string;
  initialData: RequirementsRow | null;
  city?: string | null;
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-slate-900 hover:bg-blue-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer"
    >
      {pending ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-white" />
          <span>جاري حفظ المعايير والانتقال...</span>
        </>
      ) : (
        <>
          <span>حفظ المعايير ومتابعة إلى حصر العقارات</span>
          <ArrowLeft className="w-4 h-4" />
        </>
      )}
    </button>
  );
}

export function NeedsForm({ caseId, initialData, city }: NeedsFormProps) {
  const saveActionWithId = saveRequirements.bind(null, caseId);
  const initialState: RequirementsFormState = { errors: {} };
  const [state, formAction] = useActionState(saveActionWithId, initialState);

  // Section 1: Budget and purchase method
  const [budget, setBudget] = useState(
    initialData?.max_budget_sar !== undefined && initialData?.max_budget_sar !== null
      ? String(initialData.max_budget_sar)
      : ""
  );
  const [purchaseMethod, setPurchaseMethod] = useState(
    initialData?.purchase_method ?? "undecided"
  );

  // Section 2: Household needs
  const [householdSize, setHouseholdSize] = useState(
    initialData?.household_size !== undefined && initialData?.household_size !== null
      ? String(initialData.household_size)
      : ""
  );
  const [minBedrooms, setMinBedrooms] = useState(
    initialData?.min_bedrooms !== undefined && initialData?.min_bedrooms !== null
      ? String(initialData.min_bedrooms)
      : ""
  );
  const [minAreaSqm, setMinAreaSqm] = useState(
    initialData?.min_area_sqm !== undefined && initialData?.min_area_sqm !== null
      ? String(initialData.min_area_sqm)
      : ""
  );

  // Section 3: Hard constraints
  const initialConstraints = Array.isArray(initialData?.hard_constraints)
    ? (initialData?.hard_constraints as Array<{
        key: string;
        label: string;
        value?: number | string;
      }>)
    : [];

  const [hasElevator, setHasElevator] = useState(
    initialConstraints.some((c) => c.key === "elevator_required")
  );
  const [hasParking, setHasParking] = useState(
    initialConstraints.some((c) => c.key === "private_parking")
  );
  const [hasNewBuilding, setHasNewBuilding] = useState(
    initialConstraints.some((c) => c.key === "new_building_only")
  );

  const initialMaxFloor = initialConstraints.find((c) => c.key === "max_floor");
  const [hasMaxFloor, setHasMaxFloor] = useState(Boolean(initialMaxFloor));
  const [maxFloorValue, setMaxFloorValue] = useState(
    initialMaxFloor?.value !== undefined ? String(initialMaxFloor.value) : ""
  );

  const [customConstraints, setCustomConstraints] = useState<CustomConstraintItem[]>(() => {
    return initialConstraints
      .filter((c) => c.key === "custom")
      .map((c, index) => ({
        id: `custom-init-${index}`,
        text: String(c.value ?? c.label ?? ""),
      }));
  });

  // Section 4: Preferences and Important locations
  const initialPrefs = Array.isArray(initialData?.preferences)
    ? (initialData?.preferences as Array<{
        label: string;
        weight: PreferenceWeight;
      }>)
    : [];

  const [preferences, setPreferences] = useState<PreferenceItem[]>(() => {
    return initialPrefs.map((p, index) => ({
      id: `pref-init-${index}`,
      label: String(p.label ?? ""),
      weight:
        p.weight === "high" || p.weight === "low" ? p.weight : "medium",
    }));
  });

  const initialLocs = Array.isArray(initialData?.important_locations)
    ? (initialData?.important_locations as Array<{
        label: string;
        address_text: string;
        frequency: LocationFrequency;
      }>)
    : [];

  const [locations, setLocations] = useState<LocationItem[]>(() => {
    return initialLocs.map((l, index) => ({
      id: `loc-init-${index}`,
      label: String(l.label ?? ""),
      address_text: String(l.address_text ?? ""),
      frequency: l.frequency === "weekly" ? "weekly" : "daily",
    }));
  });

  // Total hard constraints count
  const fixedConstraintsCount =
    (hasElevator ? 1 : 0) +
    (hasParking ? 1 : 0) +
    (hasNewBuilding ? 1 : 0) +
    (hasMaxFloor ? 1 : 0);
  const totalHardConstraints = fixedConstraintsCount + customConstraints.length;

  const handleAddCustomConstraint = () => {
    if (totalHardConstraints >= 10) return;
    setCustomConstraints((prev) => [
      ...prev,
      { id: `custom-${Date.now()}-${prev.length}`, text: "" },
    ]);
  };

  const handleUpdateCustomConstraint = (id: string, text: string) => {
    setCustomConstraints((prev) =>
      prev.map((c) => (c.id === id ? { ...c, text } : c))
    );
  };

  const handleRemoveCustomConstraint = (id: string) => {
    setCustomConstraints((prev) => prev.filter((c) => c.id !== id));
  };

  const handleAddPreference = () => {
    if (preferences.length >= 10) return;
    setPreferences((prev) => [
      ...prev,
      { id: `pref-${Date.now()}-${prev.length}`, label: "", weight: "medium" },
    ]);
  };

  const handleUpdatePreference = (
    id: string,
    field: "label" | "weight",
    value: string
  ) => {
    setPreferences((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        if (field === "label") return { ...p, label: value };
        return { ...p, weight: value as PreferenceWeight };
      })
    );
  };

  const handleRemovePreference = (id: string) => {
    setPreferences((prev) => prev.filter((p) => p.id !== id));
  };

  const handleAddLocation = () => {
    if (locations.length >= 5) return;
    setLocations((prev) => [
      ...prev,
      {
        id: `loc-${Date.now()}-${prev.length}`,
        label: "",
        address_text: "",
        frequency: "daily",
      },
    ]);
  };

  const handleUpdateLocation = (
    id: string,
    field: "label" | "address_text" | "frequency",
    value: string
  ) => {
    setLocations((prev) =>
      prev.map((l) => {
        if (l.id !== id) return l;
        if (field === "label") return { ...l, label: value };
        if (field === "address_text") return { ...l, address_text: value };
        return { ...l, frequency: value as LocationFrequency };
      })
    );
  };

  const handleRemoveLocation = (id: string) => {
    setLocations((prev) => prev.filter((l) => l.id !== id));
  };

  // Build serialized arrays for submission
  const serializedConstraints: HardConstraint[] = [];
  if (hasElevator) {
    serializedConstraints.push({ key: "elevator_required", label: "وجود مصعد" });
  }
  if (hasParking) {
    serializedConstraints.push({ key: "private_parking", label: "موقف سيارة خاص" });
  }
  if (hasNewBuilding) {
    serializedConstraints.push({ key: "new_building_only", label: "مبنى جديد / أول ساكن" });
  }
  if (hasMaxFloor) {
    serializedConstraints.push({
      key: "max_floor",
      label: "أقصى دور",
      value: maxFloorValue !== "" ? Number(maxFloorValue) : 0,
    });
  }
  for (const item of customConstraints) {
    if (item.text.trim()) {
      serializedConstraints.push({
        key: "custom",
        label: item.text.trim(),
        value: item.text.trim(),
      });
    }
  }

  const serializedPreferences = preferences
    .filter((p) => p.label.trim())
    .map((p) => ({
      label: p.label.trim(),
      weight: p.weight,
    }));

  const serializedLocations = locations
    .filter((l) => l.label.trim() || l.address_text.trim())
    .map((l) => ({
      label: l.label.trim(),
      address_text: l.address_text.trim(),
      frequency: l.frequency,
    }));

  const parsedBudget = Number(budget);
  const showBudgetPreview = !isNaN(parsedBudget) && parsedBudget > 0;

  return (
    <div className="space-y-10">
      {/* Hero / Page Intro */}
      <section className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-slate-200/80 text-slate-700 text-xs font-medium shadow-xs">
          <ShieldCheck className="w-4 h-4 text-blue-600" />
          <span>المرحلة الأولى • صياغة المعايير الهندسية والمالية</span>
          {city && (
            <>
              <span className="text-slate-300">•</span>
              <span className="font-bold text-blue-600">{city}</span>
            </>
          )}
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-[1.3]">
          محددات واحتياجات قرار الشراء <br className="hidden sm:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-l from-slate-900 via-slate-800 to-blue-600">
            بدقة هندسية غير قابلة للمساومة
          </span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 font-normal leading-relaxed max-w-2xl mx-auto">
          تحدد هذه المعايير خوارزمية الفرز والتقييم الحتمي. أي عقار يتجاوز ميزانيتك القصوى أو يخالف شروطك الحتمية سيتم استبعاده فوراً من المنافسة.
        </p>
      </section>

      {/* Main Form */}
      <form action={formAction} className="space-y-8">
        <input
          type="hidden"
          name="hard_constraints"
          value={JSON.stringify(serializedConstraints)}
        />
        <input
          type="hidden"
          name="preferences"
          value={JSON.stringify(serializedPreferences)}
        />
        <input
          type="hidden"
          name="important_locations"
          value={JSON.stringify(serializedLocations)}
        />

        {/* ============================================================== */}
        {/* Section 1: الميزانية وطريقة الشراء */}
        {/* ============================================================== */}
        <div className="bg-white rounded-3xl border border-slate-200/70 shadow-sm p-6 sm:p-8 space-y-6 relative overflow-hidden">
          <div className="absolute -top-24 -left-24 w-56 h-56 bg-blue-50/50 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  الميزانية والقدرة المالية
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  السقف المالي الأعلى وطريقة السداد المقترحة
                </p>
              </div>
            </div>
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200/40">
              شرط حتمي
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Budget Input */}
            <div className="space-y-2">
              <label htmlFor="max_budget_sar" className="block text-xs font-bold text-slate-700">
                الميزانية القصوى المتاحة (ريال سعودي)
              </label>
              <div className="relative">
                <input
                  id="max_budget_sar"
                  name="max_budget_sar"
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="مثال: 950000"
                  className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
                />
              </div>

              {showBudgetPreview && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-50 border border-blue-200/60 text-blue-700 text-xs font-bold mt-1">
                  <Coins className="w-3.5 h-3.5 text-blue-600" />
                  <span>المبلغ المعتمد: {formatSAR(parsedBudget)}</span>
                </div>
              )}

              {state?.errors?.max_budget_sar?.[0] && (
                <FieldError message={state.errors.max_budget_sar[0]} />
              )}
            </div>

            {/* Purchase Method */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                طريقة التمويل والشراء
              </label>
              <input type="hidden" name="purchase_method" value={purchaseMethod} />
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPurchaseMethod("cash")}
                  className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                    purchaseMethod === "cash"
                      ? "bg-slate-900 text-white border-slate-900 shadow-xs font-bold"
                      : "border-slate-200/80 text-slate-700 hover:border-slate-300 hover:bg-slate-50 font-medium bg-white"
                  }`}
                >
                  <span className="block text-xs">نقداً</span>
                  <span className="block text-[10px] opacity-70 mt-0.5">سيولة جاهزة</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPurchaseMethod("finance")}
                  className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                    purchaseMethod === "finance"
                      ? "bg-slate-900 text-white border-slate-900 shadow-xs font-bold"
                      : "border-slate-200/80 text-slate-700 hover:border-slate-300 hover:bg-slate-50 font-medium bg-white"
                  }`}
                >
                  <span className="block text-xs">تمويل عقاري</span>
                  <span className="block text-[10px] opacity-70 mt-0.5">بنكي / دعم</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPurchaseMethod("undecided")}
                  className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                    purchaseMethod === "undecided"
                      ? "bg-slate-900 text-white border-slate-900 shadow-xs font-bold"
                      : "border-slate-200/80 text-slate-700 hover:border-slate-300 hover:bg-slate-50 font-medium bg-white"
                  }`}
                >
                  <span className="block text-xs">لم يتقرر بعد</span>
                  <span className="block text-[10px] opacity-70 mt-0.5">قيد الدراسة</span>
                </button>
              </div>
              {state?.errors?.purchase_method?.[0] && (
                <FieldError message={state.errors.purchase_method[0]} />
              )}
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* Section 2: احتياج الأسرة */}
        {/* ============================================================== */}
        <div className="bg-white rounded-3xl border border-slate-200/70 shadow-sm p-6 sm:p-8 space-y-6 relative overflow-hidden">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  مواصفات المسكن واحتياج الأسرة
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  الحد الأدنى لعدد الغرف والمساحة الصافية المناسبة لأسرتك
                </p>
              </div>
            </div>
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200/40">
              معايير تشغيلية
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {/* Household Size */}
            <div className="space-y-2">
              <label htmlFor="household_size" className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                <span>أفراد الأسرة المقيمين (1–20)</span>
              </label>
              <input
                id="household_size"
                name="household_size"
                type="number"
                min={1}
                max={20}
                value={householdSize}
                onChange={(e) => setHouseholdSize(e.target.value)}
                placeholder="مثال: 4"
                className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
              />
              {state?.errors?.household_size?.[0] && (
                <FieldError message={state.errors.household_size[0]} />
              )}
            </div>

            {/* Min Bedrooms */}
            <div className="space-y-2">
              <label htmlFor="min_bedrooms" className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span>الحد الأدنى لغرف النوم (1–10)</span>
              </label>
              <input
                id="min_bedrooms"
                name="min_bedrooms"
                type="number"
                min={1}
                max={10}
                value={minBedrooms}
                onChange={(e) => setMinBedrooms(e.target.value)}
                placeholder="مثال: 3"
                className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
              />
              {state?.errors?.min_bedrooms?.[0] && (
                <FieldError message={state.errors.min_bedrooms[0]} />
              )}
            </div>

            {/* Min Area Sqm */}
            <div className="space-y-2">
              <label htmlFor="min_area_sqm" className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-slate-400" />
                <span>الحد الأدنى للمساحة (م²) (اختياري)</span>
              </label>
              <input
                id="min_area_sqm"
                name="min_area_sqm"
                type="number"
                step="any"
                value={minAreaSqm}
                onChange={(e) => setMinAreaSqm(e.target.value)}
                placeholder="مثال: 150"
                className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
              />
              {state?.errors?.min_area_sqm?.[0] && (
                <FieldError message={state.errors.min_area_sqm[0]} />
              )}
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* Section 3: شروط لا تنازل عنها (Hard Constraints) */}
        {/* ============================================================== */}
        <div className="bg-white rounded-3xl border border-slate-200/70 shadow-sm p-6 sm:p-8 space-y-6 relative overflow-hidden">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold text-slate-900">
                    شروط حتمية لا تنازل عنها
                  </h2>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-100">
                    استبعاد فوري
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  أي عقار يفتقر إلى أي شرط هنا سيتم استبعاده فوراً من المنافسة
                </p>
              </div>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
              {totalHardConstraints} / 10
            </span>
          </div>

          {/* Warning Notice */}
          <div className="bg-amber-50/70 border border-amber-200/70 rounded-2xl p-4 flex items-start gap-3 text-xs text-amber-900 leading-relaxed">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">قاعدة التحليل الهندسي الحتمي:</span> السعر المنخفض لا يعوض أبداً عيباً جوهرياً مثل غياب المصعد في الأدوار العليا أو عدم وجود موقف خاص. هذه الشروط تحميك من الشراء العاطفي.
            </div>
          </div>

          {/* Interactive Fixed Constraint Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Elevator */}
            <button
              type="button"
              onClick={() => setHasElevator(!hasElevator)}
              className={`p-4 rounded-2xl border text-right transition-all flex items-center justify-between gap-3 cursor-pointer ${
                hasElevator
                  ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                  : "border-slate-200/80 text-slate-700 hover:border-slate-300 hover:bg-slate-50 bg-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    hasElevator ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  <Layers className="w-4 h-4" />
                </span>
                <div>
                  <div className="text-xs font-bold">وجود مصعد عامل</div>
                  <div className={`text-[11px] ${hasElevator ? "text-slate-300" : "text-slate-400"}`}>
                    إلزامي للأدوار العليا
                  </div>
                </div>
              </div>
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center border transition-colors ${
                  hasElevator ? "bg-blue-600 border-blue-600 text-white" : "border-slate-300 text-transparent"
                }`}
              >
                <Check className="w-3.5 h-3.5" />
              </div>
            </button>

            {/* Parking */}
            <button
              type="button"
              onClick={() => setHasParking(!hasParking)}
              className={`p-4 rounded-2xl border text-right transition-all flex items-center justify-between gap-3 cursor-pointer ${
                hasParking
                  ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                  : "border-slate-200/80 text-slate-700 hover:border-slate-300 hover:bg-slate-50 bg-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    hasParking ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  <Car className="w-4 h-4" />
                </span>
                <div>
                  <div className="text-xs font-bold">موقف سيارة خاص</div>
                  <div className={`text-[11px] ${hasParking ? "text-slate-300" : "text-slate-400"}`}>
                    مسجل بالصك أو مخصص
                  </div>
                </div>
              </div>
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center border transition-colors ${
                  hasParking ? "bg-blue-600 border-blue-600 text-white" : "border-slate-300 text-transparent"
                }`}
              >
                <Check className="w-3.5 h-3.5" />
              </div>
            </button>

            {/* New Building */}
            <button
              type="button"
              onClick={() => setHasNewBuilding(!hasNewBuilding)}
              className={`p-4 rounded-2xl border text-right transition-all flex items-center justify-between gap-3 cursor-pointer ${
                hasNewBuilding
                  ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                  : "border-slate-200/80 text-slate-700 hover:border-slate-300 hover:bg-slate-50 font-medium bg-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    hasNewBuilding ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                </span>
                <div>
                  <div className="text-xs font-bold">مبنى جديد / أول ساكن</div>
                  <div className={`text-[11px] ${hasNewBuilding ? "text-slate-300" : "text-slate-400"}`}>
                    عمر العقار صفر سنوات
                  </div>
                </div>
              </div>
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center border transition-colors ${
                  hasNewBuilding ? "bg-blue-600 border-blue-600 text-white" : "border-slate-300 text-transparent"
                }`}
              >
                <Check className="w-3.5 h-3.5" />
              </div>
            </button>

            {/* Max Floor */}
            <div
              className={`p-4 rounded-2xl border transition-all space-y-3 ${
                hasMaxFloor
                  ? "bg-slate-50 border-slate-300"
                  : "border-slate-200/80 bg-white"
              }`}
            >
              <button
                type="button"
                onClick={() => setHasMaxFloor(!hasMaxFloor)}
                className="w-full text-right flex items-center justify-between gap-3 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      hasMaxFloor ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    <Building2 className="w-4 h-4" />
                  </span>
                  <div>
                    <div className="text-xs font-bold text-slate-800">أقصى دور مسموح به</div>
                    <div className="text-[11px] text-slate-400">تحديد أعلى دور ترغب بالسكن فيه</div>
                  </div>
                </div>
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center border transition-colors ${
                    hasMaxFloor ? "bg-blue-600 border-blue-600 text-white" : "border-slate-300 text-transparent"
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                </div>
              </button>

              {hasMaxFloor && (
                <div className="pt-2 border-t border-slate-200/60">
                  <input
                    id="max_floor_val"
                    type="number"
                    min={0}
                    max={50}
                    value={maxFloorValue}
                    onChange={(e) => setMaxFloorValue(e.target.value)}
                    placeholder="رقم الدور الأقصى (مثال: 3)"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Custom Conditions */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-700">شروط إضافية خاصة بك</span>
                <p className="text-[11px] text-slate-400">
                  شروط فنية أخرى ملزمة لك (مثال: غرفة سائق، مدخل مستقل، عزل صوتي)
                </p>
              </div>
              <button
                type="button"
                disabled={totalHardConstraints >= 10}
                onClick={handleAddCustomConstraint}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة شرط مخصص</span>
              </button>
            </div>

            {customConstraints.map((item) => (
              <div key={item.id} className="flex items-center gap-2">
                <input
                  value={item.text}
                  maxLength={120}
                  onChange={(e) => handleUpdateCustomConstraint(item.id, e.target.value)}
                  placeholder="اكتب الشرط الحتمي (مثال: غرفة خادمة مستقلة، شرفة لا تطل على الجيران)"
                  className="flex-1 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveCustomConstraint(item.id)}
                  className="p-3 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                  title="حذف الشرط"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {state?.errors?.hard_constraints?.[0] && (
            <FieldError message={state.errors.hard_constraints[0]} />
          )}
        </div>

        {/* ============================================================== */}
        {/* Section 4: التفضيلات والمواقع المهمة */}
        {/* ============================================================== */}
        <div className="bg-white rounded-3xl border border-slate-200/70 shadow-sm p-6 sm:p-8 space-y-8 relative overflow-hidden">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  التفضيلات التنافسية والمواقع المهمة
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  معايير ترجيحية تُمنح درجات ونقاط للمقارنة والمفاضلة بين العقارات المتأهلة
                </p>
              </div>
            </div>
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200/40">
              أوزان تفضيلية
            </span>
          </div>

          {/* Preferences Sub-section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-800">
                  قائمة التفضيلات التفضيلية (حتى 10 تفضيلات)
                </span>
                <p className="text-[11px] text-slate-400">
                  حدد درجة الأهمية النسبية لكل ميزة للمساعدة في وزن التقييم النهائي
                </p>
              </div>
              <span className="text-xs font-bold text-slate-500">
                {preferences.length} / 10
              </span>
            </div>

            <div className="space-y-3">
              {preferences.map((pref) => (
                <div
                  key={pref.id}
                  className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-200/70"
                >
                  <input
                    value={pref.label}
                    maxLength={80}
                    onChange={(e) => handleUpdatePreference(pref.id, "label", e.target.value)}
                    placeholder="وصف الميزة المرغوبة (مثال: واجهة شمالية، مطبخ راكب، تشطيب مودرن)"
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                  />
                  <div className="w-full sm:w-44">
                    <select
                      value={pref.weight}
                      onChange={(e) =>
                        handleUpdatePreference(
                          pref.id,
                          "weight",
                          e.target.value as PreferenceWeight
                        )
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-700 shadow-xs focus:border-blue-600 focus:outline-none"
                    >
                      <option value="high">أهمية عالية (ترجيح قوي)</option>
                      <option value="medium">أهمية متوسطة (عادية)</option>
                      <option value="low">أهمية منخفضة (ثانوية)</option>
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemovePreference(pref.id)}
                    className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all self-end sm:self-center cursor-pointer"
                    title="حذف التفضيل"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              disabled={preferences.length >= 10}
              onClick={handleAddPreference}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة تفضيل جديد</span>
            </button>

            {state?.errors?.preferences?.[0] && (
              <FieldError message={state.errors.preferences[0]} />
            )}
          </div>

          {/* Important Locations Sub-section */}
          <div className="pt-6 border-t border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-800">
                  المواقع الجغرافية المهمة للتنقل اليومي (حتى 5 مواقع)
                </span>
                <p className="text-[11px] text-slate-400">
                  نحسب أزمنة التنقل وعبء الزحام لكل عقار مرشح إلى هذه المقرات
                </p>
              </div>
              <span className="text-xs font-bold text-slate-500">
                {locations.length} / 5
              </span>
            </div>

            <div className="space-y-3">
              {locations.map((loc) => (
                <div
                  key={loc.id}
                  className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-200/70"
                >
                  <div className="w-full sm:w-44">
                    <input
                      value={loc.label}
                      maxLength={60}
                      onChange={(e) => handleUpdateLocation(loc.id, "label", e.target.value)}
                      placeholder="اسم المقر (مثل: عمل الزوج، مدرسة)"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                    />
                  </div>
                  <div className="flex-1">
                    <input
                      value={loc.address_text}
                      maxLength={200}
                      onChange={(e) => handleUpdateLocation(loc.id, "address_text", e.target.value)}
                      placeholder="الحي أو الشارع (مثل: حي الملقا، طريق الملك فهد)"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                    />
                  </div>
                  <div className="w-full sm:w-36">
                    <select
                      value={loc.frequency}
                      onChange={(e) =>
                        handleUpdateLocation(
                          loc.id,
                          "frequency",
                          e.target.value as LocationFrequency
                        )
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-700 shadow-xs focus:border-blue-600 focus:outline-none"
                    >
                      <option value="daily">تردد يومي (عمل/مدرسة)</option>
                      <option value="weekly">تردد أسبوعي (عائلة/ترفيه)</option>
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveLocation(loc.id)}
                    className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all self-end sm:self-center cursor-pointer"
                    title="حذف الموقع"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              disabled={locations.length >= 5}
              onClick={handleAddLocation}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة مقر مهم</span>
            </button>

            {state?.errors?.important_locations?.[0] && (
              <FieldError message={state.errors.important_locations[0]} />
            )}
          </div>
        </div>

        {/* Global Form Error */}
        {state?.errors?.form?.[0] && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{state.errors.form[0]}</span>
          </div>
        )}

        {/* Submit Action Bar */}
        <div className="bg-white rounded-3xl border border-slate-200/70 p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              يتم حفظ المحددات وتطبيقها حتمياً في مراحل المقارنة والتحليل اللاحقة.
            </span>
          </div>
          <SubmitButton />
        </div>
      </form>
    </div>
  );
}

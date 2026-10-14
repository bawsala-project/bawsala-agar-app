"use client";

import React, { useState } from "react";
import { useFormState as useActionState, useFormStatus } from "react-dom";
import {
  ShieldCheck,
  ArrowLeft,
  Coins,
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
      className="w-full sm:w-auto px-8 py-4 rounded-full bg-[var(--navy)] hover:bg-[var(--midnight)] active:scale-98 disabled:opacity-60 disabled:cursor-not-allowed text-[var(--cream)] font-bold text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-all duration-200 shadow-xs cursor-pointer"
    >
      {pending ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-[var(--cream)]" />
          <span>جاري حفظ المعايير والانتقال…</span>
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

  const existingMaxFloor = initialConstraints.find((c) => c.key === "max_floor");
  const [hasMaxFloor, setHasMaxFloor] = useState(Boolean(existingMaxFloor));
  const [maxFloorValue, setMaxFloorValue] = useState(
    existingMaxFloor?.value !== undefined ? String(existingMaxFloor.value) : "4"
  );

  // Custom constraints list (up to 10 total)
  const initialCustom = initialConstraints
    .filter((c) => c.key === "custom" || c.key.startsWith("custom_"))
    .map((c, i) => ({ id: `c-${i}`, text: c.label }));
  const [customConstraints, setCustomConstraints] =
    useState<CustomConstraintItem[]>(initialCustom);

  // Section 4: Preferences (weighted)
  const initialPrefs = Array.isArray(initialData?.preferences)
    ? (initialData?.preferences as Array<{
        label: string;
        weight: PreferenceWeight;
      }>).map((p, i) => ({ id: `p-${i}`, label: p.label, weight: p.weight }))
    : [
        { id: "p-0", label: "واجهة شمالية أو شرقية", weight: "medium" as PreferenceWeight },
        { id: "p-1", label: "قرب من المسجد والحديقة", weight: "high" as PreferenceWeight },
      ];
  const [preferences, setPreferences] = useState<PreferenceItem[]>(initialPrefs);

  // Section 5: Important locations
  const initialLocs = Array.isArray(initialData?.important_locations)
    ? (initialData?.important_locations as Array<{
        label: string;
        address_text: string;
        frequency: LocationFrequency;
      }>).map((l, i) => ({
        id: `l-${i}`,
        label: l.label,
        address_text: l.address_text,
        frequency: l.frequency,
      }))
    : [{ id: "l-0", label: "مقر العمل الرئيسي", address_text: "", frequency: "daily" as LocationFrequency }];
  const [locations, setLocations] = useState<LocationItem[]>(initialLocs);

  // Constraint handlers
  const handleAddCustomConstraint = () => {
    const totalActive =
      (hasElevator ? 1 : 0) +
      (hasParking ? 1 : 0) +
      (hasNewBuilding ? 1 : 0) +
      (hasMaxFloor ? 1 : 0) +
      customConstraints.length;

    if (totalActive >= 10) return;
    setCustomConstraints((prev) => [
      ...prev,
      { id: `c-${Date.now()}`, text: "" },
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

  // Preference handlers
  const handleAddPreference = () => {
    if (preferences.length >= 10) return;
    setPreferences((prev) => [
      ...prev,
      { id: `p-${Date.now()}`, label: "", weight: "medium" },
    ]);
  };

  const handleUpdatePreference = (
    id: string,
    field: "label" | "weight",
    value: string
  ) => {
    setPreferences((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const handleRemovePreference = (id: string) => {
    setPreferences((prev) => prev.filter((p) => p.id !== id));
  };

  // Location handlers
  const handleAddLocation = () => {
    if (locations.length >= 5) return;
    setLocations((prev) => [
      ...prev,
      {
        id: `l-${Date.now()}`,
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
      prev.map((l) => (l.id === id ? { ...l, [field]: value } : l))
    );
  };

  const handleRemoveLocation = (id: string) => {
    setLocations((prev) => prev.filter((l) => l.id !== id));
  };

  // Build serialized arrays for hidden inputs
  const serializedConstraints: HardConstraint[] = [];
  if (hasElevator) {
    serializedConstraints.push({
      key: "elevator_required",
      label: "وجود مصعد عامل في المبنى",
    });
  }
  if (hasParking) {
    serializedConstraints.push({
      key: "private_parking",
      label: "موقف سيارة خاص ومسجل بالصك",
    });
  }
  if (hasNewBuilding) {
    serializedConstraints.push({
      key: "new_building_only",
      label: "مبنى جديد أو أول ساكن",
    });
  }
  if (hasMaxFloor && maxFloorValue) {
    serializedConstraints.push({
      key: "max_floor",
      label: `أقصى دور مسموح به هو الدور ${maxFloorValue}`,
      value: Number(maxFloorValue),
    });
  }
  customConstraints.forEach((c) => {
    if (c.text.trim()) {
      serializedConstraints.push({
        key: "custom",
        label: c.text.trim(),
      });
    }
  });

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
    <div className="space-y-10" dir="rtl">
      {/* Hero / Page Intro */}
      <section className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--paper)] border border-[var(--mist)] text-[var(--dusty-blue)] text-xs font-medium shadow-xs">
          <ShieldCheck className="w-4 h-4 text-[var(--navy)]" />
          <span>المرحلة الأولى • صياغة المعايير الهندسية والمالية</span>
          {city && (
            <>
              <span className="text-[var(--mist)]">•</span>
              <span className="font-bold text-[var(--navy)]">{city}</span>
            </>
          )}
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-[var(--navy)] tracking-tight leading-[1.3] font-display">
          محددات واحتياجات قرار الشراء
        </h1>
        <p className="text-xs sm:text-sm text-[var(--dusty-blue)] font-normal leading-relaxed max-w-2xl mx-auto">
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
        <div className="bg-[var(--paper)] rounded-[28px] border border-[var(--mist)] shadow-[0_20px_60px_rgba(15,26,43,0.06)] p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[var(--mist)]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--navy)]" />
              <div>
                <h2 className="text-base sm:text-lg font-bold text-[var(--navy)] font-display">
                  الميزانية والقدرة المالية
                </h2>
                <p className="text-xs text-[var(--dusty-blue)] mt-0.5">
                  السقف المالي الأعلى وطريقة السداد المقترحة
                </p>
              </div>
            </div>
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[var(--cream)] text-[var(--navy)] border border-[var(--mist)]">
              شرط حتمي
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Budget Input */}
            <div className="space-y-2">
              <label htmlFor="max_budget_sar" className="block text-xs font-bold text-[var(--navy)]">
                الميزانية القصوى المتاحة (ريال سعودي)
              </label>
              <input
                id="max_budget_sar"
                name="max_budget_sar"
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="مثال: 950000"
                className="w-full px-4 py-3.5 rounded-2xl bg-[var(--cream)] border border-[var(--mist)] text-sm font-bold text-[var(--navy)] placeholder:text-[var(--dusty-blue)]/50 focus:border-[var(--navy)] outline-none transition-all"
              />

              {showBudgetPreview && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--cream)] border border-[var(--mist)] text-[var(--navy)] text-xs font-bold mt-1">
                  <Coins className="w-3.5 h-3.5 text-[var(--navy)]" />
                  <span>المبلغ المعتمد: {formatSAR(parsedBudget)}</span>
                </div>
              )}

              {state?.errors?.max_budget_sar?.[0] && (
                <FieldError message={state.errors.max_budget_sar[0]} />
              )}
            </div>

            {/* Purchase Method */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[var(--navy)]">
                طريقة التمويل والشراء
              </label>
              <input type="hidden" name="purchase_method" value={purchaseMethod} />
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPurchaseMethod("cash")}
                  className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                    purchaseMethod === "cash"
                      ? "bg-[var(--navy)] text-[var(--cream)] border-[var(--navy)] font-bold shadow-xs"
                      : "bg-[var(--cream)] text-[var(--navy)] border-[var(--mist)] hover:border-[var(--navy)] font-medium"
                  }`}
                >
                  <span className="block text-xs">نقداً</span>
                  <span className="block text-[10px] opacity-75 mt-0.5">سيولة جاهزة</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPurchaseMethod("finance")}
                  className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                    purchaseMethod === "finance"
                      ? "bg-[var(--navy)] text-[var(--cream)] border-[var(--navy)] font-bold shadow-xs"
                      : "bg-[var(--cream)] text-[var(--navy)] border-[var(--mist)] hover:border-[var(--navy)] font-medium"
                  }`}
                >
                  <span className="block text-xs">تمويل عقاري</span>
                  <span className="block text-[10px] opacity-75 mt-0.5">بنكي / دعم</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPurchaseMethod("undecided")}
                  className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                    purchaseMethod === "undecided"
                      ? "bg-[var(--navy)] text-[var(--cream)] border-[var(--navy)] font-bold shadow-xs"
                      : "bg-[var(--cream)] text-[var(--navy)] border-[var(--mist)] hover:border-[var(--navy)] font-medium"
                  }`}
                >
                  <span className="block text-xs">لم يتقرر بعد</span>
                  <span className="block text-[10px] opacity-75 mt-0.5">قيد الدراسة</span>
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
        <div className="bg-[var(--paper)] rounded-[28px] border border-[var(--mist)] shadow-[0_20px_60px_rgba(15,26,43,0.06)] p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[var(--mist)]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--navy)]" />
              <div>
                <h2 className="text-base sm:text-lg font-bold text-[var(--navy)] font-display">
                  السعة المكانية للأسرة
                </h2>
                <p className="text-xs text-[var(--dusty-blue)] mt-0.5">
                  الحد الأدنى لعدد الغرف والمساحة الصافية
                </p>
              </div>
            </div>
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[var(--cream)] text-[var(--navy)] border border-[var(--mist)]">
              احتياج وظيفي
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {/* Household Size */}
            <div className="space-y-2">
              <label htmlFor="household_size" className="block text-xs font-bold text-[var(--navy)]">
                عدد أفراد الأسرة
              </label>
              <div className="relative">
                <input
                  id="household_size"
                  name="household_size"
                  type="number"
                  min={1}
                  max={25}
                  value={householdSize}
                  onChange={(e) => setHouseholdSize(e.target.value)}
                  placeholder="مثال: 5"
                  className="w-full px-4 py-3.5 rounded-2xl bg-[var(--cream)] border border-[var(--mist)] text-sm font-bold text-[var(--navy)] placeholder:text-[var(--dusty-blue)]/50 focus:border-[var(--navy)] outline-none transition-all"
                />
              </div>
              {state?.errors?.household_size?.[0] && (
                <FieldError message={state.errors.household_size[0]} />
              )}
            </div>

            {/* Min Bedrooms */}
            <div className="space-y-2">
              <label htmlFor="min_bedrooms" className="block text-xs font-bold text-[var(--navy)]">
                الحد الأدنى لغرف النوم
              </label>
              <div className="relative">
                <input
                  id="min_bedrooms"
                  name="min_bedrooms"
                  type="number"
                  min={1}
                  max={15}
                  value={minBedrooms}
                  onChange={(e) => setMinBedrooms(e.target.value)}
                  placeholder="مثال: 3"
                  className="w-full px-4 py-3.5 rounded-2xl bg-[var(--cream)] border border-[var(--mist)] text-sm font-bold text-[var(--navy)] placeholder:text-[var(--dusty-blue)]/50 focus:border-[var(--navy)] outline-none transition-all"
                />
              </div>
              {state?.errors?.min_bedrooms?.[0] && (
                <FieldError message={state.errors.min_bedrooms[0]} />
              )}
            </div>

            {/* Min Area */}
            <div className="space-y-2">
              <label htmlFor="min_area_sqm" className="block text-xs font-bold text-[var(--navy)]">
                الحد الأدنى للمساحة (م²)
              </label>
              <div className="relative">
                <input
                  id="min_area_sqm"
                  name="min_area_sqm"
                  type="number"
                  min={30}
                  max={5000}
                  value={minAreaSqm}
                  onChange={(e) => setMinAreaSqm(e.target.value)}
                  placeholder="مثال: 150"
                  className="w-full px-4 py-3.5 rounded-2xl bg-[var(--cream)] border border-[var(--mist)] text-sm font-bold text-[var(--navy)] placeholder:text-[var(--dusty-blue)]/50 focus:border-[var(--navy)] outline-none transition-all"
                />
              </div>
              {state?.errors?.min_area_sqm?.[0] && (
                <FieldError message={state.errors.min_area_sqm[0]} />
              )}
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* Section 3: الشروط الحتمية */}
        {/* ============================================================== */}
        <div className="bg-[var(--paper)] rounded-[28px] border border-[var(--mist)] shadow-[0_20px_60px_rgba(15,26,43,0.06)] p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[var(--mist)]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--navy)]" />
              <div>
                <h2 className="text-base sm:text-lg font-bold text-[var(--navy)] font-display">
                  الشروط الحتمية الصارمة (Hard Constraints)
                </h2>
                <p className="text-xs text-[var(--dusty-blue)] mt-0.5">
                  معايير استبعاد تلقائي فورية، العقار الذي لا يحققها يُقصى
                </p>
              </div>
            </div>
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[var(--cream)] text-[var(--navy)] border border-[var(--mist)]">
              استبعاد إلزامي
            </span>
          </div>

          {/* Interactive Fixed Constraint Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Elevator */}
            <button
              type="button"
              onClick={() => setHasElevator(!hasElevator)}
              className={`p-4 rounded-2xl border text-right transition-all flex items-center justify-between gap-3 cursor-pointer ${
                hasElevator
                  ? "bg-[var(--navy)] text-[var(--cream)] border-[var(--navy)] shadow-xs"
                  : "bg-[var(--cream)] text-[var(--navy)] border-[var(--mist)] hover:border-[var(--navy)]"
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    hasElevator ? "bg-[var(--midnight)] text-[var(--cream)]" : "bg-[var(--paper)] text-[var(--navy)] border border-[var(--mist)]"
                  }`}
                >
                  <Layers className="w-4 h-4" />
                </span>
                <div>
                  <div className="text-xs font-bold">وجود مصعد عامل</div>
                  <div className={`text-[11px] ${hasElevator ? "text-[var(--cream)]/80" : "text-[var(--dusty-blue)]"}`}>
                    إلزامي للأدوار العليا
                  </div>
                </div>
              </div>
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center border transition-colors ${
                  hasElevator ? "bg-[var(--cream)] border-[var(--cream)] text-[var(--navy)]" : "border-[var(--mist)] text-transparent"
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
                  ? "bg-[var(--navy)] text-[var(--cream)] border-[var(--navy)] shadow-xs"
                  : "bg-[var(--cream)] text-[var(--navy)] border-[var(--mist)] hover:border-[var(--navy)]"
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    hasParking ? "bg-[var(--midnight)] text-[var(--cream)]" : "bg-[var(--paper)] text-[var(--navy)] border border-[var(--mist)]"
                  }`}
                >
                  <Car className="w-4 h-4" />
                </span>
                <div>
                  <div className="text-xs font-bold">موقف سيارة خاص</div>
                  <div className={`text-[11px] ${hasParking ? "text-[var(--cream)]/80" : "text-[var(--dusty-blue)]"}`}>
                    مسجل بالصك أو مخصص
                  </div>
                </div>
              </div>
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center border transition-colors ${
                  hasParking ? "bg-[var(--cream)] border-[var(--cream)] text-[var(--navy)]" : "border-[var(--mist)] text-transparent"
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
                  ? "bg-[var(--navy)] text-[var(--cream)] border-[var(--navy)] shadow-xs"
                  : "bg-[var(--cream)] text-[var(--navy)] border-[var(--mist)] hover:border-[var(--navy)]"
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    hasNewBuilding ? "bg-[var(--midnight)] text-[var(--cream)]" : "bg-[var(--paper)] text-[var(--navy)] border border-[var(--mist)]"
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                </span>
                <div>
                  <div className="text-xs font-bold">مبنى جديد / أول ساكن</div>
                  <div className={`text-[11px] ${hasNewBuilding ? "text-[var(--cream)]/80" : "text-[var(--dusty-blue)]"}`}>
                    عمر العقار صفر سنوات
                  </div>
                </div>
              </div>
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center border transition-colors ${
                  hasNewBuilding ? "bg-[var(--cream)] border-[var(--cream)] text-[var(--navy)]" : "border-[var(--mist)] text-transparent"
                }`}
              >
                <Check className="w-3.5 h-3.5" />
              </div>
            </button>

            {/* Max Floor */}
            <div
              className={`p-4 rounded-2xl border transition-all space-y-3 ${
                hasMaxFloor
                  ? "bg-[var(--cream)] border-[var(--navy)]"
                  : "border-[var(--mist)] bg-[var(--cream)]"
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
                      hasMaxFloor ? "bg-[var(--navy)] text-[var(--cream)]" : "bg-[var(--paper)] text-[var(--navy)] border border-[var(--mist)]"
                    }`}
                  >
                    <Building2 className="w-4 h-4" />
                  </span>
                  <div>
                    <div className="text-xs font-bold text-[var(--navy)]">أقصى دور مسموح به</div>
                    <div className="text-[11px] text-[var(--dusty-blue)]">تحديد أعلى دور ترغب بالسكن فيه</div>
                  </div>
                </div>
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center border transition-colors ${
                    hasMaxFloor ? "bg-[var(--navy)] border-[var(--navy)] text-[var(--cream)]" : "border-[var(--mist)] text-transparent"
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                </div>
              </button>

              {hasMaxFloor && (
                <div className="pt-2 border-t border-[var(--mist)]">
                  <input
                    id="max_floor_val"
                    type="number"
                    min={0}
                    max={50}
                    value={maxFloorValue}
                    onChange={(e) => setMaxFloorValue(e.target.value)}
                    placeholder="رقم الدور الأقصى (مثال: 3)"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--paper)] border border-[var(--mist)] text-xs font-bold text-[var(--navy)] focus:border-[var(--navy)] outline-none"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Custom Conditions */}
          <div className="pt-4 border-t border-[var(--mist)] space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-[var(--navy)]">شروط إضافية خاصة بك</span>
                <p className="text-[11px] text-[var(--dusty-blue)]">
                  شروط فنية أخرى ملزمة لك (مثال: غرفة خادمة، مدخل مستقل، عزل صوتي)
                </p>
              </div>
              <button
                type="button"
                disabled={serializedConstraints.length >= 10}
                onClick={handleAddCustomConstraint}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--cream)] hover:bg-[var(--paper)] text-[var(--navy)] border border-[var(--mist)] text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
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
                  className="flex-1 px-4 py-3 rounded-xl bg-[var(--cream)] border border-[var(--mist)] text-xs font-medium text-[var(--navy)] placeholder:text-[var(--dusty-blue)]/50 focus:border-[var(--navy)] outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveCustomConstraint(item.id)}
                  className="p-3 text-[var(--dusty-blue)] hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
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
        <div className="bg-[var(--paper)] rounded-[28px] border border-[var(--mist)] shadow-[0_20px_60px_rgba(15,26,43,0.06)] p-6 sm:p-8 space-y-8">
          <div className="flex items-center justify-between pb-4 border-b border-[var(--mist)]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--navy)]" />
              <div>
                <h2 className="text-base sm:text-lg font-bold text-[var(--navy)] font-display">
                  التفضيلات التنافسية والمواقع المهمة
                </h2>
                <p className="text-xs text-[var(--dusty-blue)] mt-0.5">
                  معايير ترجيحية تُمنح درجات ونقاط للمقارنة والمفاضلة بين العقارات المتأهلة
                </p>
              </div>
            </div>
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[var(--cream)] text-[var(--navy)] border border-[var(--mist)]">
              أوزان تفضيلية
            </span>
          </div>

          {/* Preferences Sub-section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-[var(--navy)]">
                  قائمة التفضيلات التفضيلية (حتى 10 تفضيلات)
                </span>
                <p className="text-[11px] text-[var(--dusty-blue)]">
                  حدد درجة الأهمية النسبية لكل ميزة للمساعدة في وزن التقييم النهائي
                </p>
              </div>
              <span className="text-xs font-bold text-[var(--dusty-blue)]">
                {preferences.length} / 10
              </span>
            </div>

            <div className="space-y-3">
              {preferences.map((pref) => (
                <div
                  key={pref.id}
                  className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 p-3 rounded-2xl bg-[var(--cream)] border border-[var(--mist)]"
                >
                  <input
                    value={pref.label}
                    maxLength={80}
                    onChange={(e) => handleUpdatePreference(pref.id, "label", e.target.value)}
                    placeholder="وصف الميزة المرغوبة (مثال: واجهة شمالية، مطبخ راكب، تشطيب مودرن)"
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-[var(--paper)] border border-[var(--mist)] text-xs font-medium text-[var(--navy)] placeholder:text-[var(--dusty-blue)]/50 focus:border-[var(--navy)] outline-none"
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
                      className="w-full rounded-xl border border-[var(--mist)] bg-[var(--paper)] px-3 py-2.5 text-xs font-bold text-[var(--navy)] shadow-xs focus:border-[var(--navy)] focus:outline-none"
                    >
                      <option value="high">أهمية عالية (ترجيح قوي)</option>
                      <option value="medium">أهمية متوسطة (عادية)</option>
                      <option value="low">أهمية منخفضة (ثانوية)</option>
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemovePreference(pref.id)}
                    className="p-2.5 text-[var(--dusty-blue)] hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all self-end sm:self-center cursor-pointer"
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
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[var(--cream)] hover:bg-[var(--paper)] text-[var(--navy)] border border-[var(--mist)] text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة تفضيل جديد</span>
            </button>

            {state?.errors?.preferences?.[0] && (
              <FieldError message={state.errors.preferences[0]} />
            )}
          </div>

          {/* Important Locations Sub-section */}
          <div className="pt-6 border-t border-[var(--mist)] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-[var(--navy)]">
                  المواقع الجغرافية المهمة للتنقل اليومي (حتى 5 مواقع)
                </span>
                <p className="text-[11px] text-[var(--dusty-blue)]">
                  نحسب أزمنة التنقل وعبء الزحام لكل عقار مرشح إلى هذه المقرات
                </p>
              </div>
              <span className="text-xs font-bold text-[var(--dusty-blue)]">
                {locations.length} / 5
              </span>
            </div>

            <div className="space-y-3">
              {locations.map((loc) => (
                <div
                  key={loc.id}
                  className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 p-3 rounded-2xl bg-[var(--cream)] border border-[var(--mist)]"
                >
                  <div className="w-full sm:w-44">
                    <input
                      value={loc.label}
                      maxLength={60}
                      onChange={(e) => handleUpdateLocation(loc.id, "label", e.target.value)}
                      placeholder="اسم المقر (مثل: عمل الزوج، مدرسة)"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--paper)] border border-[var(--mist)] text-xs font-bold text-[var(--navy)] placeholder:text-[var(--dusty-blue)]/50 focus:border-[var(--navy)] outline-none"
                    />
                  </div>
                  <div className="flex-1">
                    <input
                      value={loc.address_text}
                      maxLength={200}
                      onChange={(e) => handleUpdateLocation(loc.id, "address_text", e.target.value)}
                      placeholder="الحي أو الشارع (مثل: حي الملقا، طريق الملك فهد)"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--paper)] border border-[var(--mist)] text-xs font-medium text-[var(--navy)] placeholder:text-[var(--dusty-blue)]/50 focus:border-[var(--navy)] outline-none"
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
                      className="w-full rounded-xl border border-[var(--mist)] bg-[var(--paper)] px-3 py-2.5 text-xs font-bold text-[var(--navy)] shadow-xs focus:border-[var(--navy)] focus:outline-none"
                    >
                      <option value="daily">تردد يومي (عمل/مدرسة)</option>
                      <option value="weekly">تردد أسبوعي (عائلة/ترفيه)</option>
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveLocation(loc.id)}
                    className="p-2.5 text-[var(--dusty-blue)] hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all self-end sm:self-center cursor-pointer"
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
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[var(--cream)] hover:bg-[var(--paper)] text-[var(--navy)] border border-[var(--mist)] text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
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
        <div className="bg-[var(--paper)] rounded-[28px] border border-[var(--mist)] p-6 shadow-[0_20px_60px_rgba(15,26,43,0.06)] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-[var(--dusty-blue)]">
            <ShieldCheck className="w-4 h-4 text-[var(--navy)] shrink-0" />
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

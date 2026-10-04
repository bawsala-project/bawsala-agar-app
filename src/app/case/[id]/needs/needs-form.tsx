"use client";

import React, { useState } from "react";
import { useFormState as useActionState, useFormStatus } from "react-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant="primary"
      pending={pending}
      disabled={pending}
      className="w-full sm:w-auto"
    >
      حفظ ومتابعة إلى العقارات
    </Button>
  );
}

export function NeedsForm({ caseId, initialData }: NeedsFormProps) {
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
    serializedConstraints.push({
      key: "custom",
      label: item.text,
      value: item.text,
    });
  }

  const serializedPreferences = preferences.map((p) => ({
    label: p.label,
    weight: p.weight,
  }));

  const serializedLocations = locations.map((l) => ({
    label: l.label,
    address_text: l.address_text,
    frequency: l.frequency,
  }));

  const parsedBudget = Number(budget);
  const showBudgetPreview = !isNaN(parsedBudget) && parsedBudget > 0;

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">الاحتياجات والمحددات</h1>
        <p className="text-sm text-gray-600 mt-1">
          حدد الميزانية واحتياجاتك وشروطك الأساسية للمقارنة بين العقارات
        </p>
      </div>

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

        {/* Section 1: الميزانية وطريقة الشراء */}
        <section className="bg-white p-6 rounded-lg border border-gray-200 space-y-4">
          <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">
            الميزانية وطريقة الشراء
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Input
                id="max_budget_sar"
                name="max_budget_sar"
                type="number"
                label="الميزانية القصوى (ريال)"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                error={state?.errors?.max_budget_sar?.[0]}
                placeholder="مثال: 800000"
              />
              {showBudgetPreview && (
                <p className="text-xs font-medium text-blue-600 mt-1">
                  المعاينة: {formatSAR(parsedBudget)}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="purchase_method"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                طريقة الشراء
              </label>
              <select
                id="purchase_method"
                name="purchase_method"
                value={purchaseMethod}
                onChange={(e) => setPurchaseMethod(e.target.value)}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="cash">نقداً</option>
                <option value="finance">تمويل عقاري</option>
                <option value="undecided">لم يتقرر بعد</option>
              </select>
              {state?.errors?.purchase_method?.[0] && (
                <FieldError message={state.errors.purchase_method[0]} />
              )}
            </div>
          </div>
        </section>

        {/* Section 2: احتياج الأسرة */}
        <section className="bg-white p-6 rounded-lg border border-gray-200 space-y-4">
          <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">
            احتياج الأسرة
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              id="household_size"
              name="household_size"
              type="number"
              label="عدد أفراد الأسرة (1–20)"
              value={householdSize}
              onChange={(e) => setHouseholdSize(e.target.value)}
              error={state?.errors?.household_size?.[0]}
              placeholder="مثال: 4"
            />
            <Input
              id="min_bedrooms"
              name="min_bedrooms"
              type="number"
              label="الحد الأدنى لغرف النوم (1–10)"
              value={minBedrooms}
              onChange={(e) => setMinBedrooms(e.target.value)}
              error={state?.errors?.min_bedrooms?.[0]}
              placeholder="مثال: 3"
            />
            <Input
              id="min_area_sqm"
              name="min_area_sqm"
              type="number"
              step="any"
              label="الحد الأدنى للمساحة (م²) (اختياري)"
              value={minAreaSqm}
              onChange={(e) => setMinAreaSqm(e.target.value)}
              error={state?.errors?.min_area_sqm?.[0]}
              placeholder="مثال: 140"
            />
          </div>
        </section>

        {/* Section 3: شروط لا تنازل عنها */}
        <section className="bg-white p-6 rounded-lg border border-gray-200 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <h2 className="text-lg font-bold text-gray-900">شروط لا تنازل عنها</h2>
            <span className="text-xs text-gray-500">
              ({totalHardConstraints}/10)
            </span>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-800">
              <input
                type="checkbox"
                checked={hasElevator}
                onChange={(e) => setHasElevator(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
              />
              <span>وجود مصعد</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-800">
              <input
                type="checkbox"
                checked={hasParking}
                onChange={(e) => setHasParking(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
              />
              <span>موقف سيارة خاص</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-800">
              <input
                type="checkbox"
                checked={hasNewBuilding}
                onChange={(e) => setHasNewBuilding(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
              />
              <span>مبنى جديد / أول ساكن</span>
            </label>

            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-800">
                <input
                  type="checkbox"
                  checked={hasMaxFloor}
                  onChange={(e) => setHasMaxFloor(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                />
                <span>أقصى دور</span>
              </label>

              {hasMaxFloor && (
                <div className="ps-6 max-w-xs">
                  <Input
                    id="max_floor_val"
                    type="number"
                    label="رقم الدور الأقصى"
                    value={maxFloorValue}
                    onChange={(e) => setMaxFloorValue(e.target.value)}
                    placeholder="مثال: 4"
                  />
                </div>
              )}
            </div>

            {/* Custom conditions */}
            <div className="pt-2 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">شروط إضافية مخصصة</span>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={totalHardConstraints >= 10}
                  onClick={handleAddCustomConstraint}
                  className="text-xs py-1 px-3"
                >
                  + إضافة شرط مخصص
                </Button>
              </div>

              {customConstraints.map((item) => (
                <div key={item.id} className="flex items-center gap-2">
                  <div className="flex-1">
                    <Input
                      value={item.text}
                      maxLength={120}
                      onChange={(e) => handleUpdateCustomConstraint(item.id, e.target.value)}
                      placeholder="اكتب الشرط المخصص (مثال: مدخل خاص، غرفة سائق...)"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => handleRemoveCustomConstraint(item.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs px-2 py-2"
                  >
                    حذف
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {state?.errors?.hard_constraints?.[0] && (
            <FieldError message={state.errors.hard_constraints[0]} />
          )}
        </section>

        {/* Section 4: التفضيلات والمواقع المهمة */}
        <section className="bg-white p-6 rounded-lg border border-gray-200 space-y-6">
          <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">
            التفضيلات والمواقع المهمة
          </h2>

          {/* Preferences */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-800">
                التفضيلات (حتى 10 تفضيلات)
              </span>
              <span className="text-xs text-gray-500">
                ({preferences.length}/10)
              </span>
            </div>

            {preferences.map((pref) => (
              <div
                key={pref.id}
                className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-3 bg-gray-50 rounded-md border border-gray-200"
              >
                <div className="flex-1">
                  <Input
                    value={pref.label}
                    maxLength={80}
                    onChange={(e) => handleUpdatePreference(pref.id, "label", e.target.value)}
                    placeholder="وصف التفضيل (مثال: واجهة جنوبية، شرفة واسعة)"
                  />
                </div>
                <div className="w-full sm:w-40">
                  <select
                    value={pref.weight}
                    onChange={(e) =>
                      handleUpdatePreference(
                        pref.id,
                        "weight",
                        e.target.value as PreferenceWeight
                      )
                    }
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="high">أهمية عالية</option>
                    <option value="medium">أهمية متوسطة</option>
                    <option value="low">أهمية منخفضة</option>
                  </select>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => handleRemovePreference(pref.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs self-end sm:self-center"
                >
                  حذف
                </Button>
              </div>
            ))}

            <div>
              <Button
                type="button"
                variant="secondary"
                disabled={preferences.length >= 10}
                onClick={handleAddPreference}
                className="text-xs"
              >
                + إضافة تفضيل
              </Button>
            </div>
            {state?.errors?.preferences?.[0] && (
              <FieldError message={state.errors.preferences[0]} />
            )}
          </div>

          {/* Important locations */}
          <div className="space-y-3 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-800">
                المواقع المهمة (حتى 5 مواقع)
              </span>
              <span className="text-xs text-gray-500">
                ({locations.length}/5)
              </span>
            </div>

            {locations.map((loc) => (
              <div
                key={loc.id}
                className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-3 bg-gray-50 rounded-md border border-gray-200"
              >
                <div className="flex-1">
                  <Input
                    value={loc.label}
                    maxLength={60}
                    onChange={(e) => handleUpdateLocation(loc.id, "label", e.target.value)}
                    placeholder="اسم الموقع (مثل: مقر العمل)"
                  />
                </div>
                <div className="flex-1">
                  <Input
                    value={loc.address_text}
                    maxLength={200}
                    onChange={(e) => handleUpdateLocation(loc.id, "address_text", e.target.value)}
                    placeholder="العنوان أو الحي (مثل: طريق الملك فهد)"
                  />
                </div>
                <div className="w-full sm:w-32">
                  <select
                    value={loc.frequency}
                    onChange={(e) =>
                      handleUpdateLocation(
                        loc.id,
                        "frequency",
                        e.target.value as LocationFrequency
                      )
                    }
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="daily">زيارة يومية</option>
                    <option value="weekly">زيارة أسبوعية</option>
                  </select>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => handleRemoveLocation(loc.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs self-end sm:self-center"
                >
                  حذف
                </Button>
              </div>
            ))}

            <div>
              <Button
                type="button"
                variant="secondary"
                disabled={locations.length >= 5}
                onClick={handleAddLocation}
                className="text-xs"
              >
                + إضافة موقع مهم
              </Button>
            </div>
            {state?.errors?.important_locations?.[0] && (
              <FieldError message={state.errors.important_locations[0]} />
            )}
          </div>
        </section>

        {state?.errors?.form?.[0] && (
          <FieldError message={state.errors.form[0]} />
        )}

        <div className="flex justify-end pt-2">
          <SubmitButton />
        </div>
      </form>
    </div>
  );
}

"use client";

import React, { useEffect, useRef, useState } from "react";
import { useFormState as useActionState, useFormStatus } from "react-dom";
import {
  ShieldCheck,
  ArrowLeft,
  ArrowRight,
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
  initialContext?: {
    typology?: string;
    intent?: string;
    title?: string;
  };
}

const TYPOLOGY_LABELS: Record<string, string> = {
  apt: "شقة تمليك",
  villa: "فيلا مستقلة / دوبلكس",
  townhouse: "تاون هاوس",
};

const INTENT_LABELS: Record<string, string> = {
  family: "سكن عائلي أول",
  upgrade: "ترقية مسكن",
  invest: "استثمار عقاري",
};

export interface ParsedArabicNeeds {
  budget?: number;
  purchaseMethod?: "cash" | "finance" | "undecided";
  householdSize?: number;
  minBedrooms?: number;
  minAreaSqm?: number;
  hasElevator?: boolean;
  hasParking?: boolean;
  hasNewBuilding?: boolean;
  maxFloor?: number;
  districtOrLocation?: string;
  matchedFieldsAr: string[];
}

function normalizeDigits(input: string): string {
  const arabicIndic = "٠١٢٣٤٥٦٧٨٩";
  let out = input;
  for (let i = 0; i < 10; i++) {
    out = out.split(arabicIndic[i]).join(String(i));
  }
  return out;
}

export function parseArabicNeedsDescription(rawText: string): ParsedArabicNeeds {
  const text = normalizeDigits(rawText).replace(/،/g, " ").replace(/,/g, "");
  const result: ParsedArabicNeeds = { matchedFieldsAr: [] };

  // 1. Budget extraction (e.g., "1.2 مليون", "مليون و 200 ألف", "مليون ونصف", "900 ألف", "850000")
  const millionWithThousands = text.match(/مليون\s*و\s*(\d{2,3})\s*(?:ألف|الف)/);
  const decimalMillion = text.match(/(\d+(?:\.\d+)?)\s*مليون/);
  const millionHalf = /مليون\s*و\s*(?:نصف|نص)/.test(text);
  const singleMillion = /(?:ميزانية|بسعر|حدود)\s*مليون(?!\s*و)/.test(text);
  const thousandsMatch = text.match(/(\d{3,4})\s*(?:ألف|الف)/);
  const explicitLargeNum = text.match(/\b(\d{6,7})\b/);

  if (millionWithThousands) {
    result.budget = 1_000_000 + Number(millionWithThousands[1]) * 1_000;
    result.matchedFieldsAr.push("الميزانية القصوى");
  } else if (millionHalf) {
    result.budget = 1_500_000;
    result.matchedFieldsAr.push("الميزانية القصوى");
  } else if (decimalMillion) {
    result.budget = Math.round(Number(decimalMillion[1]) * 1_000_000);
    result.matchedFieldsAr.push("الميزانية القصوى");
  } else if (singleMillion) {
    result.budget = 1_000_000;
    result.matchedFieldsAr.push("الميزانية القصوى");
  } else if (thousandsMatch) {
    result.budget = Number(thousandsMatch[1]) * 1_000;
    result.matchedFieldsAr.push("الميزانية القصوى");
  } else if (explicitLargeNum) {
    result.budget = Number(explicitLargeNum[1]);
    result.matchedFieldsAr.push("الميزانية القصوى");
  }

  // 2. Purchase Method
  if (/(?:كاش|نقد|نقداً|نقدا)/.test(text)) {
    result.purchaseMethod = "cash";
    result.matchedFieldsAr.push("الدفع كاش");
  } else if (/(?:تمويل|بنك|عقاري|رهن|أقساط|اقساط)/.test(text)) {
    result.purchaseMethod = "finance";
    result.matchedFieldsAr.push("تمويل عقاري");
  }

  // 3. Bedrooms
  const bedroomsNum = text.match(/(\d+)\s*(?:غرف|غرفة)/);
  if (bedroomsNum) {
    result.minBedrooms = Number(bedroomsNum[1]);
    result.matchedFieldsAr.push("عدد الغرف");
  } else if (/غرفتين/.test(text)) {
    result.minBedrooms = 2;
    result.matchedFieldsAr.push("عدد الغرف");
  } else if (/(?:ثلاث|ثلاثة)\s*غرف/.test(text)) {
    result.minBedrooms = 3;
    result.matchedFieldsAr.push("عدد الغرف");
  } else if (/(?:أربع|اربع|أربعة|اربعة)\s*غرف/.test(text)) {
    result.minBedrooms = 4;
    result.matchedFieldsAr.push("عدد الغرف");
  } else if (/(?:خمس|خمسة)\s*غرف/.test(text)) {
    result.minBedrooms = 5;
    result.matchedFieldsAr.push("عدد الغرف");
  }

  // 4. Area (sqm)
  const areaMatch = text.match(/(\d{2,4})\s*(?:متر|م2|م²)/);
  if (areaMatch) {
    result.minAreaSqm = Number(areaMatch[1]);
    result.matchedFieldsAr.push("المساحة الدنيا");
  }

  // 5. Household size
  const familyMatch = text.match(/(?:أسرة|اسرة|عائلة|افراد|أفراد|أشخاص|اشخاص)\s*(?:من\s*)?(\d+)/) ||
    text.match(/(\d+)\s*(?:أفراد|افراد|أشخاص|اشخاص)/);
  if (familyMatch) {
    result.householdSize = Number(familyMatch[1]);
    result.matchedFieldsAr.push("حجم الأسرة");
  }

  // 6. Hard constraints
  if (/مصعد/.test(text)) {
    result.hasElevator = true;
    result.matchedFieldsAr.push("شرط المصعد");
  }
  if (/(?:موقف|بايكة|باركنج)/.test(text)) {
    result.hasParking = true;
    result.matchedFieldsAr.push("شرط الموقف الخاص");
  }
  if (/(?:جديد|جديدة|أول ساكن|اول ساكن)/.test(text)) {
    result.hasNewBuilding = true;
    result.matchedFieldsAr.push("مبنى جديد");
  }
  if (/(?:دور أرضي|دور ارضي|الأرضي|الارضي)/.test(text)) {
    result.maxFloor = 0;
    result.matchedFieldsAr.push("الحد الأعلى للدور");
  } else if (/(?:الدور الأول|الدور الاول|دور اول|دور أول)/.test(text)) {
    result.maxFloor = 1;
    result.matchedFieldsAr.push("الحد الأعلى للدور");
  } else {
    const floorMatch = text.match(/(?:دور|الدور)\s*(\d+)/);
    if (floorMatch) {
      result.maxFloor = Number(floorMatch[1]);
      result.matchedFieldsAr.push("الحد الأعلى للدور");
    }
  }

  // 7. Important daily location / district
  const districtMatch = text.match(/حي\s+([\u0600-\u06FF]+(?:\s+[\u0600-\u06FF]+)?)/);
  if (districtMatch) {
    const cleaned = districtMatch[1]
      .replace(/\s+(?:مع|أو|او|و|بمساحة|بميزانية|كاش|تمويل).*$/, "")
      .trim();
    if (cleaned) {
      result.districtOrLocation = `حي ${cleaned}`;
      result.matchedFieldsAr.push("الموقع اليومي المهم");
    }
  }

  return result;
}

const WIZARD_STEPS: { title: string; hint: string; fields: string[] }[] = [
  { title: "صف بيتك بكلماتك", hint: "اختياري — نعبّئ الأسئلة التالية عنك", fields: [] },
  { title: "كم ميزانيتك؟", hint: "أي عقار يتجاوزها يُستبعد", fields: ["max_budget_sar", "purchase_method"] },
  { title: "من سيسكن معك؟", hint: "حجم الأسرة والمساحة", fields: ["household_size", "min_bedrooms", "min_area_sqm"] },
  { title: "ما الذي لا تتنازل عنه؟", hint: "شروط تستبعد أي عقار لا يحققها", fields: ["hard_constraints"] },
  { title: "ما الأهم لك؟", hint: "تفضيلاتك والأماكن التي تزورها", fields: ["preferences", "important_locations"] },
];

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full sm:w-auto px-8 py-4 rounded-full bg-[var(--navy)] hover:bg-[var(--midnight)] active:scale-98 disabled:opacity-60 disabled:cursor-not-allowed text-[var(--cream)] font-bold text-sm flex items-center justify-center gap-2.5 transition-all duration-200 shadow-xs cursor-pointer"
    >
      {pending ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-[var(--cream)]" />
          <span>جارٍ الحفظ…</span>
        </>
      ) : (
        <>
          <span>حفظ ومتابعة للعقارات</span>
          <ArrowLeft className="w-4 h-4" />
        </>
      )}
    </button>
  );
}

export function NeedsForm({ caseId, initialData, city, initialContext }: NeedsFormProps) {
  const saveActionWithId = saveRequirements.bind(null, caseId);
  const initialState: RequirementsFormState = { errors: {} };
  const [state, formAction] = useActionState(saveActionWithId, initialState);

  // Mobile wizard: one question per screen (< lg). Desktop keeps the full form.
  const [step, setStep] = useState(0);
  const wizardTopRef = useRef<HTMLDivElement>(null);
  const goToStep = (next: number) => {
    setStep(Math.max(0, Math.min(WIZARD_STEPS.length - 1, next)));
    requestAnimationFrame(() =>
      wizardTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    );
  };
  const stepCls = (i: number, base: string) =>
    `${base} ${i === step ? "max-lg:animate-[stepIn_0.35s_cubic-bezier(0.22,1,0.36,1)]" : "max-lg:hidden"}`;
  const isLastStep = step === WIZARD_STEPS.length - 1;

  // Jump to the first step that holds a server validation error.
  useEffect(() => {
    const errs = state?.errors ?? {};
    const firstErrStep = WIZARD_STEPS.findIndex((s) => s.fields.some((f) => (errs as Record<string, unknown>)[f]));
    if (firstErrStep >= 0) goToStep(firstErrStep);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  // Quick Natural-Language Needs Helper State
  const [freeTextNeeds, setFreeTextNeeds] = useState("");
  const [parsedFeedback, setParsedFeedback] = useState<string[] | null>(null);

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

  // Section 4: Preferences (weighted) — seeded with landing-page purchase intent when new
  const defaultIntentPref: PreferenceItem[] =
    initialContext?.intent === "invest"
      ? [
          { id: "p-intent", label: "عائد تأجيري مرتفع وسهولة إعادة التأجير", weight: "high" },
          { id: "p-0", label: "واجهة شمالية أو شرقية", weight: "medium" },
        ]
      : initialContext?.intent === "upgrade"
      ? [
          { id: "p-intent", label: "جودة تشطيبات عالية وتصميم معماري حديث", weight: "high" },
          { id: "p-0", label: "واجهة شمالية أو شرقية", weight: "medium" },
        ]
      : [
          { id: "p-0", label: "واجهة شمالية أو شرقية", weight: "medium" },
          { id: "p-1", label: "قرب من المسجد والحديقة", weight: "high" },
        ];

  const initialPrefs = Array.isArray(initialData?.preferences)
    ? (initialData?.preferences as Array<{
        label: string;
        weight: PreferenceWeight;
      }>).map((p, i) => ({ id: `p-${i}`, label: p.label, weight: p.weight }))
    : defaultIntentPref;
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

  const handleSmartParseNeeds = () => {
    if (!freeTextNeeds.trim()) return;
    const parsed = parseArabicNeedsDescription(freeTextNeeds);
    if (parsed.budget !== undefined) setBudget(String(parsed.budget));
    if (parsed.purchaseMethod) setPurchaseMethod(parsed.purchaseMethod);
    if (parsed.householdSize !== undefined) setHouseholdSize(String(parsed.householdSize));
    if (parsed.minBedrooms !== undefined) setMinBedrooms(String(parsed.minBedrooms));
    if (parsed.minAreaSqm !== undefined) setMinAreaSqm(String(parsed.minAreaSqm));
    if (parsed.hasElevator) setHasElevator(true);
    if (parsed.hasParking) setHasParking(true);
    if (parsed.hasNewBuilding) setHasNewBuilding(true);
    if (parsed.maxFloor !== undefined) {
      setHasMaxFloor(true);
      setMaxFloorValue(String(parsed.maxFloor));
    }
    if (parsed.districtOrLocation) {
      setLocations((prev) => {
        if (prev.length === 0) {
          return [
            {
              id: "l-0",
              label: "مقر العمل / الوجهة اليومية",
              address_text: parsed.districtOrLocation!,
              frequency: "daily",
            },
          ];
        }
        const next = [...prev];
        next[0] = {
          ...next[0],
          address_text: parsed.districtOrLocation!,
        };
        return next;
      });
    }
    setParsedFeedback(
      parsed.matchedFieldsAr.length > 0
        ? parsed.matchedFieldsAr
        : ["لم يتم رصد أرقام صريحة — يمكنك استكمال الحقول أدناه مباشرة"]
    );
  };

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
    <div className="space-y-6 sm:space-y-10" dir="rtl">
      {/* Hero / Page Intro */}
      <section className={`text-center max-w-3xl mx-auto space-y-3 ${step > 0 ? "max-lg:hidden" : ""}`}>
        <div className="inline-flex flex-wrap items-center justify-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--paper)] border border-[var(--mist)] text-[var(--dusty-blue)] text-xs font-medium shadow-xs">
          <ShieldCheck className="w-4 h-4 text-[var(--navy)]" />
          <span>احتياجك وميزانيتك</span>
          {city && (
            <>
              <span className="text-[var(--mist)]">•</span>
              <span className="font-bold text-[var(--navy)]">{city}</span>
            </>
          )}
          {initialContext?.typology && TYPOLOGY_LABELS[initialContext.typology] && (
            <>
              <span className="text-[var(--mist)]">•</span>
              <span className="font-bold text-[var(--navy)]">
                {TYPOLOGY_LABELS[initialContext.typology]}
              </span>
            </>
          )}
          {initialContext?.intent && INTENT_LABELS[initialContext.intent] && (
            <>
              <span className="text-[var(--mist)]">•</span>
              <span className="font-bold text-[var(--navy)]">
                {INTENT_LABELS[initialContext.intent]}
              </span>
            </>
          )}
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-[var(--navy)] tracking-tight leading-[1.3] font-display">
          {initialContext?.title?.trim()
            ? initialContext.title.trim()
            : "ماذا تحتاج في بيتك؟"}
        </h1>
        <p className="text-sm text-[var(--dusty-blue)] font-normal leading-relaxed max-w-2xl mx-auto">
          أي عقار يتجاوز ميزانيتك أو شروطك يُستبعد تلقائياً.
        </p>
      </section>

      {/* Main Form */}
      <form
        action={formAction}
        className="space-y-8"
        onKeyDown={(e) => {
          // On mobile, Enter advances to the next question instead of submitting early.
          if (
            e.key === "Enter" &&
            !isLastStep &&
            (e.target as HTMLElement).tagName === "INPUT" &&
            window.matchMedia("(max-width: 1023px)").matches
          ) {
            e.preventDefault();
            goToStep(step + 1);
          }
        }}
      >
        {/* Mobile wizard header */}
        <div ref={wizardTopRef} className="lg:hidden scroll-mt-28 space-y-4 pt-1">
          <div className="flex items-center gap-1.5" aria-hidden="true">
            {WIZARD_STEPS.map((_, i) => (
              <button
                key={i}
                type="button"
                tabIndex={-1}
                onClick={() => i < step && goToStep(i)}
                className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                  i <= step ? "bg-[var(--navy)]" : "bg-[var(--mist)]"
                }`}
              />
            ))}
          </div>
          <div key={step} className="space-y-1.5 animate-[stepIn_0.35s_cubic-bezier(0.22,1,0.36,1)]">
            <p className="text-xs font-bold tracking-wide text-[var(--dusty-blue)]">
              السؤال {step + 1} من {WIZARD_STEPS.length}
            </p>
            <h2 className="text-[26px] leading-[1.25] font-extrabold text-[var(--navy)] font-display">
              {WIZARD_STEPS[step].title}
            </h2>
            <p className="text-sm text-[var(--dusty-blue)]">{WIZARD_STEPS[step].hint}</p>
          </div>
        </div>
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
        {/* Section 0: اكتب احتياجك بكلماتك */}
        {/* ============================================================== */}
        <div className={stepCls(0, "bg-[var(--paper)] rounded-[28px] border border-[var(--mist)] shadow-[0_20px_60px_rgba(15,26,43,0.04)] p-4 sm:p-8 space-y-4")}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[var(--mist)]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[var(--cream)] border border-[var(--mist)] flex items-center justify-center text-[var(--navy)]">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-[var(--navy)] font-display">
                  اكتب احتياجك بكلماتك
                </h2>
                <p className="text-sm text-[var(--dusty-blue)] mt-0.5">
                  جملة واحدة، ونعبّئ الحقول عنك
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() =>
                setFreeTextNeeds(
                  "أبحث عن شقة جديدة 4 غرف بمساحة 150 متر وميزانية 900 ألف كاش لأسرة من 4 أفراد مع مصعد وموقف خاص قريبة من حي الملقا"
                )
              }
              className="self-start sm:self-center text-sm font-semibold text-[var(--dusty-blue)] hover:text-[var(--navy)] underline underline-offset-4 cursor-pointer"
            >
              جرّب مثالاً
            </button>
          </div>

          <div className="space-y-3">
            <textarea
              value={freeTextNeeds}
              onChange={(e) => setFreeTextNeeds(e.target.value)}
              rows={2}
              placeholder="مثال: شقة 4 غرف، 150 م²، 900 ألف كاش، مع مصعد، قرب حي العليا"
              className="w-full px-4 py-3 rounded-2xl bg-[var(--cream)] border border-[var(--mist)] text-sm text-[var(--navy)] placeholder:text-[var(--dusty-blue)]/50 focus:border-[var(--navy)] outline-none transition-all resize-none"
            />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleSmartParseNeeds}
                className="px-5 py-2.5 rounded-full bg-[var(--navy)] hover:bg-[var(--midnight)] text-[var(--cream)] text-xs font-bold inline-flex items-center gap-2 transition-all cursor-pointer shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>عبّئ الحقول تلقائياً</span>
              </button>

              {parsedFeedback && (
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#E9F4EE] border border-[#C5E4D4] text-[#1E6B43] text-[11px] font-bold">
                  <Check className="w-3.5 h-3.5 shrink-0" />
                  <span>تمت التعبئة: {parsedFeedback.join(" • ")}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* Section 1: الميزانية وطريقة الشراء */}
        {/* ============================================================== */}
        <div className={stepCls(1, "bg-[var(--paper)] rounded-[28px] border border-[var(--mist)] shadow-[0_20px_60px_rgba(15,26,43,0.06)] p-4 sm:p-8 space-y-6")}>
          <div className="max-lg:hidden flex items-center justify-between pb-4 border-b border-[var(--mist)]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--navy)]" />
              <div>
                <h2 className="text-base sm:text-lg font-bold text-[var(--navy)] font-display">
                  الميزانية
                </h2>
                <p className="text-xs text-[var(--dusty-blue)] mt-0.5">
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
                أقصى ميزانية (ر.س)
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
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--cream)] border border-[var(--mist)] text-[var(--navy)] text-xs font-body font-bold tabular-nums mt-1">
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
                طريقة الشراء
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
                  <span className="block text-sm">نقداً</span>
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
                  <span className="block text-sm">تمويل عقاري</span>
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
                  <span className="block text-sm">لم يتقرر بعد</span>
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
        <div className={stepCls(2, "bg-[var(--paper)] rounded-[28px] border border-[var(--mist)] shadow-[0_20px_60px_rgba(15,26,43,0.06)] p-4 sm:p-8 space-y-6")}>
          <div className="max-lg:hidden flex items-center justify-between pb-4 border-b border-[var(--mist)]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--navy)]" />
              <div>
                <h2 className="text-base sm:text-lg font-bold text-[var(--navy)] font-display">
                  حجم الأسرة والمساحة
                </h2>
                <p className="text-xs text-[var(--dusty-blue)] mt-0.5">
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
        <div className={stepCls(3, "bg-[var(--paper)] rounded-[28px] border border-[var(--mist)] shadow-[0_20px_60px_rgba(15,26,43,0.06)] p-4 sm:p-8 space-y-6")}>
          <div className="max-lg:hidden flex items-center justify-between pb-4 border-b border-[var(--mist)]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--navy)]" />
              <div>
                <h2 className="text-base sm:text-lg font-bold text-[var(--navy)] font-display">
                  شروط لا تنازل عنها
                </h2>
                <p className="text-xs text-[var(--dusty-blue)] mt-0.5">
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
                  <div className="text-sm font-bold">وجود مصعد عامل</div>
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
                  <div className="text-sm font-bold">موقف سيارة خاص</div>
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
                  <div className="text-sm font-bold">مبنى جديد / أول ساكن</div>
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
                    <div className="text-sm font-bold text-[var(--navy)]">أقصى دور مسموح به</div>
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
                <span className="text-xs font-bold text-[var(--navy)]">شروط إضافية</span>
              </div>
              <button
                type="button"
                disabled={serializedConstraints.length >= 10}
                onClick={handleAddCustomConstraint}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--cream)] hover:bg-[var(--paper)] text-[var(--navy)] border border-[var(--mist)] text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>أضف شرطاً</span>
              </button>
            </div>

            {customConstraints.map((item) => (
              <div key={item.id} className="flex items-center gap-2">
                <input
                  value={item.text}
                  maxLength={120}
                  onChange={(e) => handleUpdateCustomConstraint(item.id, e.target.value)}
                  placeholder="مثال: غرفة خادمة مستقلة"
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
        <div className={stepCls(4, "bg-[var(--paper)] rounded-[28px] border border-[var(--mist)] shadow-[0_20px_60px_rgba(15,26,43,0.06)] p-4 sm:p-8 space-y-8")}>
          <div className="max-lg:hidden flex items-center justify-between pb-4 border-b border-[var(--mist)]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--navy)]" />
              <div>
                <h2 className="text-base sm:text-lg font-bold text-[var(--navy)] font-display">
                  تفضيلات ومواقع مهمة
                </h2>
                <p className="text-xs text-[var(--dusty-blue)] mt-0.5">
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
                  ما يهمك أكثر
                </span>
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
                    placeholder="مثال: واجهة شمالية"
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
                      <option value="high">أهمية عالية</option>
                      <option value="medium">أهمية متوسطة</option>
                      <option value="low">أهمية منخفضة</option>
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
              <span>أضف تفضيلاً</span>
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
                  أماكن تذهب إليها كثيراً
                </span>
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
                      placeholder="مثل: العمل، المدرسة"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--paper)] border border-[var(--mist)] text-xs font-bold text-[var(--navy)] placeholder:text-[var(--dusty-blue)]/50 focus:border-[var(--navy)] outline-none"
                    />
                  </div>
                  <div className="flex-1">
                    <input
                      value={loc.address_text}
                      maxLength={200}
                      onChange={(e) => handleUpdateLocation(loc.id, "address_text", e.target.value)}
                      placeholder="الحي أو الشارع"
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
                      <option value="daily">يومياً</option>
                      <option value="weekly">أسبوعياً</option>
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
              <span>أضف مكاناً</span>
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
        <div className="sticky bottom-0 z-30 -mx-4 sm:mx-0 bg-[var(--paper)] sm:rounded-[28px] border-t sm:border border-[var(--mist)] p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-6 shadow-[0_-8px_24px_rgba(15,26,43,0.06)] sm:shadow-[0_20px_60px_rgba(15,26,43,0.06)] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="hidden sm:flex items-center gap-2 text-sm text-[var(--dusty-blue)]">
            <ShieldCheck className="w-4 h-4 text-[var(--navy)] shrink-0" />
            <span>
              تُطبَّق على كل العقارات لاحقاً.
            </span>
          </div>
          <div className={`w-full sm:w-auto ${isLastStep ? "" : "max-lg:hidden"}`}>
            <SubmitButton />
          </div>
          {!isLastStep && (
            <div className="lg:hidden w-full flex items-center gap-3">
              {step > 0 && (
                <button
                  type="button"
                  onClick={() => goToStep(step - 1)}
                  aria-label="السؤال السابق"
                  className="shrink-0 w-14 h-14 rounded-full border border-[var(--mist)] bg-[var(--cream)] text-[var(--navy)] flex items-center justify-center active:scale-95 transition-transform cursor-pointer"
                >
                  <ArrowRight className="w-5 h-5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => goToStep(step + 1)}
                className="flex-1 h-14 rounded-full bg-[var(--navy)] text-[var(--cream)] font-bold text-base flex items-center justify-center gap-2.5 active:scale-[0.98] transition-transform shadow-xs cursor-pointer"
              >
                <span>{step === 0 && !freeTextNeeds.trim() ? "تخطَّ" : "التالي"}</span>
                <ArrowLeft className="w-5 h-5" />
              </button>
            </div>
          )}
          {isLastStep && step > 0 && (
            <button
              type="button"
              onClick={() => goToStep(step - 1)}
              className="lg:hidden text-sm font-semibold text-[var(--dusty-blue)] underline underline-offset-4 cursor-pointer"
            >
              السؤال السابق
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

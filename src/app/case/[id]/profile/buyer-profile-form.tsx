"use client";

import React, { useState, useTransition } from "react";
import {
  Coins,
  Users,
  Briefcase,
  Sliders,
  CheckCircle2,
  AlertOctagon,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Plus,
  X,
  ShieldCheck,
  Car,
  Loader2,
  Check,
} from "lucide-react";
import { formatSAR } from "@/lib/utils";
import {
  InstrumentCard,
} from "@/components/ui/instrument-card";
import {
  InstrumentChip,
} from "@/components/ui/instrument-chip";
import {
  InstrumentInput,
} from "@/components/ui/instrument-input";
import {
  InstrumentSlider,
} from "@/components/ui/instrument-slider";
import {
  type BuyerProfile,
  DEFAULT_BUYER_PROFILE,
  FLOOR_PREFERENCES,
  FLOOR_PREFERENCE_LABELS,
  NEIGHBORHOOD_TYPES,
  NEIGHBORHOOD_TYPE_LABELS,
  PURCHASE_TIMELINES,
  PURCHASE_TIMELINE_LABELS,
  PRIORITY_ITEMS,
  DEFAULT_DEAL_BREAKER_PRESETS,
} from "@/lib/schemas/buyer-profile";
import {
  saveBuyerProfile,
  saveBuyerProfileStep,
} from "@/actions/buyer-profile";

interface BuyerProfileFormProps {
  caseId: string;
  initialProfile: BuyerProfile | null;
  city?: string | null;
}

const STEPS = [
  { id: 1, key: "budget", label: "الميزانية", icon: Coins },
  { id: 2, key: "household", label: "الأسرة", icon: Users },
  { id: 3, key: "daily_life", label: "الحياة اليومية", icon: Briefcase },
  { id: 4, key: "needs", label: "المواصفات", icon: Sliders },
  { id: 5, key: "priorities", label: "الأولويات", icon: CheckCircle2 },
  { id: 6, key: "constraints", label: "الموانع", icon: AlertOctagon },
] as const;

export function BuyerProfileForm({
  caseId,
  initialProfile,
  city,
}: BuyerProfileFormProps) {
  const [isPending, startTransition] = useTransition();

  // Active step (1 to 6)
  const [activeStep, setActiveStep] = useState<number>(1);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>({});

  // Form State
  const initial = initialProfile || DEFAULT_BUYER_PROFILE;

  // 1. Budget
  const [maxBudget, setMaxBudget] = useState<number>(initial.max_budget_sar);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "mortgage">(initial.payment_method);
  const [monthlyCeiling, setMonthlyCeiling] = useState<string>(
    initial.monthly_installment_ceiling_sar !== null && initial.monthly_installment_ceiling_sar !== undefined
      ? String(initial.monthly_installment_ceiling_sar)
      : ""
  );

  // 2. Household
  const [familyMembers, setFamilyMembers] = useState<number>(initial.family_members_count);
  const [childrenCount, setChildrenCount] = useState<number>(initial.children_count);
  const [childrenAgesRange, setChildrenAgesRange] = useState<string>(initial.children_ages_range);
  const [hasElderly, setHasElderly] = useState<boolean>(initial.has_elderly);
  const [carCount, setCarCount] = useState<number>(initial.car_count);

  // 3. Daily Life
  const [workLocation, setWorkLocation] = useState<string>(initial.work_location);
  const [schoolLocation, setSchoolLocation] = useState<string>(initial.school_location);
  const [commuteTolerance, setCommuteTolerance] = useState<number>(initial.commute_tolerance_minutes);
  const [neighborhoodType, setNeighborhoodType] = useState<BuyerProfile["preferred_neighborhood_type"]>(
    initial.preferred_neighborhood_type
  );

  // 4. Needs
  const [minBedrooms, setMinBedrooms] = useState<number>(initial.min_bedrooms);
  const [minBathrooms, setMinBathrooms] = useState<number>(initial.min_bathrooms);
  const [minArea, setMinArea] = useState<string>(
    initial.min_area_sqm !== null && initial.min_area_sqm !== undefined
      ? String(initial.min_area_sqm)
      : ""
  );
  const [floorPreference, setFloorPreference] = useState<BuyerProfile["floor_preference"]>(
    initial.floor_preference
  );
  const [elevatorRequired, setElevatorRequired] = useState<boolean>(initial.elevator_required);
  const [parkingRequired, setParkingRequired] = useState<boolean>(initial.parking_required);
  const [maidRoomRequired, setMaidRoomRequired] = useState<boolean>(initial.maid_room_required);
  const [outdoorSpaceRequired, setOutdoorSpaceRequired] = useState<boolean>(initial.outdoor_space_required);

  // 5. Priorities (Ranked list of up to 5 priority IDs)
  const [rankedPriorities, setRankedPriorities] = useState<string[]>(
    initial.ranked_priorities.length > 0
      ? initial.ranked_priorities
      : ["price", "location", "quality", "space", "quiet_privacy"]
  );

  // 6. Constraints & Timeline
  const [dealBreakers, setDealBreakers] = useState<string[]>(initial.deal_breakers || []);
  const [newDealBreaker, setNewDealBreaker] = useState<string>("");
  const [purchaseTimeline, setPurchaseTimeline] = useState<BuyerProfile["purchase_timeline"]>(
    initial.purchase_timeline
  );

  // Build full profile payload
  const buildCurrentProfile = (): BuyerProfile => ({
    max_budget_sar: Number(maxBudget),
    payment_method: paymentMethod,
    monthly_installment_ceiling_sar:
      paymentMethod === "mortgage" && monthlyCeiling ? Number(monthlyCeiling) : null,
    family_members_count: Number(familyMembers),
    children_count: Number(childrenCount),
    children_ages_range: childrenAgesRange,
    has_elderly: Boolean(hasElderly),
    car_count: Number(carCount),
    work_location: workLocation,
    school_location: schoolLocation,
    commute_tolerance_minutes: Number(commuteTolerance),
    preferred_neighborhood_type: neighborhoodType,
    min_bedrooms: Number(minBedrooms),
    min_bathrooms: Number(minBathrooms),
    min_area_sqm: minArea ? Number(minArea) : null,
    floor_preference: floorPreference,
    elevator_required: Boolean(elevatorRequired),
    parking_required: Boolean(parkingRequired),
    maid_room_required: Boolean(maidRoomRequired),
    outdoor_space_required: Boolean(outdoorSpaceRequired),
    ranked_priorities: rankedPriorities,
    deal_breakers: dealBreakers,
    purchase_timeline: purchaseTimeline,
  });

  // Extract data for a specific step to save progress
  const getStepData = (step: number): Record<string, unknown> => {
    switch (step) {
      case 1:
        return {
          max_budget_sar: Number(maxBudget),
          payment_method: paymentMethod,
          monthly_installment_ceiling_sar:
            paymentMethod === "mortgage" && monthlyCeiling ? Number(monthlyCeiling) : null,
        };
      case 2:
        return {
          family_members_count: Number(familyMembers),
          children_count: Number(childrenCount),
          children_ages_range: childrenAgesRange,
          has_elderly: Boolean(hasElderly),
          car_count: Number(carCount),
        };
      case 3:
        return {
          work_location: workLocation,
          school_location: schoolLocation,
          commute_tolerance_minutes: Number(commuteTolerance),
          preferred_neighborhood_type: neighborhoodType,
        };
      case 4:
        return {
          min_bedrooms: Number(minBedrooms),
          min_bathrooms: Number(minBathrooms),
          min_area_sqm: minArea ? Number(minArea) : null,
          floor_preference: floorPreference,
          elevator_required: Boolean(elevatorRequired),
          parking_required: Boolean(parkingRequired),
          maid_room_required: Boolean(maidRoomRequired),
          outdoor_space_required: Boolean(outdoorSpaceRequired),
        };
      case 5:
        return {
          ranked_priorities: rankedPriorities,
        };
      case 6:
        return {
          deal_breakers: dealBreakers,
          purchase_timeline: purchaseTimeline,
        };
      default:
        return {};
    }
  };

  // Save current step progress in the background
  const handleSaveStepProgress = async (stepToSave: number, nextStep?: number) => {
    setErrors({});
    const stepData = getStepData(stepToSave);
    const res = await saveBuyerProfileStep(caseId, stepToSave, stepData);
    if (!res.success && res.errors) {
      setErrors(res.errors);
      return false;
    }

    setSaveStatus("تم حفظ تقدم الخطوة تلقائياً");
    setTimeout(() => setSaveStatus(null), 2500);

    if (nextStep && nextStep <= 6) {
      setActiveStep(nextStep);
    }
    return true;
  };

  // Move priority up
  const movePriorityUp = (index: number) => {
    if (index === 0) return;
    const next = [...rankedPriorities];
    const temp = next[index];
    next[index] = next[index - 1];
    next[index - 1] = temp;
    setRankedPriorities(next);
  };

  // Move priority down
  const movePriorityDown = (index: number) => {
    if (index === rankedPriorities.length - 1) return;
    const next = [...rankedPriorities];
    const temp = next[index];
    next[index] = next[index + 1];
    next[index + 1] = temp;
    setRankedPriorities(next);
  };

  // Toggle priority in top 5
  const togglePrioritySelection = (id: string) => {
    if (rankedPriorities.includes(id)) {
      if (rankedPriorities.length <= 1) return; // Keep at least 1
      setRankedPriorities(rankedPriorities.filter((p) => p !== id));
    } else {
      if (rankedPriorities.length >= 5) {
        // Replace last item or alert
        const next = [...rankedPriorities.slice(0, 4), id];
        setRankedPriorities(next);
      } else {
        setRankedPriorities([...rankedPriorities, id]);
      }
    }
  };

  // Toggle deal-breaker
  const toggleDealBreaker = (text: string) => {
    if (dealBreakers.includes(text)) {
      setDealBreakers(dealBreakers.filter((d) => d !== text));
    } else {
      if (dealBreakers.length < 15) {
        setDealBreakers([...dealBreakers, text]);
      }
    }
  };

  // Add custom deal-breaker
  const handleAddCustomDealBreaker = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newDealBreaker.trim();
    if (!trimmed || dealBreakers.includes(trimmed)) return;
    if (dealBreakers.length < 15) {
      setDealBreakers([...dealBreakers, trimmed]);
      setNewDealBreaker("");
    }
  };

  // Submit complete profile
  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const profile = buildCurrentProfile();

    startTransition(async () => {
      const res = await saveBuyerProfile(caseId, profile, true);
      if (!res.success && res.errors) {
        setErrors(res.errors);
        // Find which step contains the error and jump to it
        if (res.errors.max_budget_sar || res.errors.payment_method || res.errors.monthly_installment_ceiling_sar) {
          setActiveStep(1);
        } else if (res.errors.family_members_count || res.errors.children_count) {
          setActiveStep(2);
        } else if (res.errors.commute_tolerance_minutes) {
          setActiveStep(3);
        } else if (res.errors.min_bedrooms || res.errors.min_bathrooms) {
          setActiveStep(4);
        } else if (res.errors.ranked_priorities) {
          setActiveStep(5);
        }
      }
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 select-none" dir="rtl">
      {/* Top Header Card */}
      <div className="bg-[var(--paper)] rounded-[28px] border border-[var(--mist)] p-6 sm:p-8 space-y-4 shadow-[0_20px_60px_rgba(15,26,43,0.04)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--cream)] text-[var(--dusty-blue)] border border-[var(--mist)] text-xs font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-[var(--navy)]" />
              <span>المرحلة الأولى • ملف المشتري ومعايير القرار</span>
              {city && (
                <>
                  <span>•</span>
                  <span className="font-bold text-[var(--navy)]">{city}</span>
                </>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-[var(--navy)] tracking-tight">
              تحديد ملف المشتري والاحتياجات
            </h1>
            <p className="text-xs sm:text-sm text-[var(--dusty-blue)] max-w-2xl leading-relaxed">
              هذه المعايير هي الإطار المالي والسكني الحاكم الذي سنبني عليه مطابقة خياراتك للشقق وأولوياتك دون أي تسويق أو تحيز.
            </p>
          </div>

          {saveStatus && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#E9F4EE] text-[#1E6B43] border border-[#C5E4D4] text-xs font-semibold animate-pulse self-start sm:self-center">
              <Check className="w-3.5 h-3.5" />
              <span>{saveStatus}</span>
            </div>
          )}
        </div>

        {/* 6-Step Visual Navigation Bar */}
        <div className="pt-2 border-t border-[var(--mist)]">
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {STEPS.map((s) => {
              const Icon = s.icon;
              const isActive = activeStep === s.id;
              const isPast = activeStep > s.id;

              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    void handleSaveStepProgress(activeStep, s.id);
                  }}
                  className={`p-2.5 sm:p-3 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    isActive
                      ? "bg-[var(--navy)] text-[var(--cream)] border-[var(--navy)] shadow-xs scale-[1.02]"
                      : isPast
                      ? "bg-[var(--cream)] text-[var(--navy)] border-[var(--mist)] hover:border-[var(--navy)] font-medium"
                      : "bg-[var(--paper)] text-[var(--dusty-blue)] border-[var(--mist)] hover:text-[var(--navy)]"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <Icon className="w-3.5 h-3.5" />
                    <span className="text-[11px] font-bold">{s.label}</span>
                  </div>
                  <span className={`text-[10px] font-mono tabular-nums ${isActive ? "text-[var(--cream)]/80" : "text-[var(--dusty-blue)]"}`}>
                    خطوة {s.id} من 6
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Step Body Card */}
      <InstrumentCard interactive={false} className="p-6 sm:p-10 space-y-8">
        {/* STEP 1: BUDGET & PAYMENT METHOD */}
        {activeStep === 1 && (
          <div className="space-y-6">
            <div className="border-b border-[var(--mist)] pb-4 space-y-1">
              <h2 className="text-lg font-display font-bold text-[var(--navy)] flex items-center gap-2">
                <Coins className="w-5 h-5 text-[var(--navy)]" />
                <span>الخطوة 1: الميزانية القصوى وطريقة السداد</span>
              </h2>
              <p className="text-xs text-[var(--dusty-blue)]">
                حدد السقف المالي النهائي للشراء لمنع اقتراح أي عقار يتجاوز قدرتك وتفادي التوريط البنكي.
              </p>
            </div>

            <div className="space-y-5">
              {/* Max Price Slider & Input */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[var(--navy)]">
                    الحد الأقصى لميزانية الشراء (ر.س)
                  </label>
                  <span className="font-display font-bold text-base text-[var(--navy)] tabular-nums">
                    {formatSAR(maxBudget)}
                  </span>
                </div>
                <InstrumentSlider
                  value={maxBudget}
                  min={300_000}
                  max={4_000_000}
                  step={25_000}
                  unit="ر.س"
                  onChange={setMaxBudget}
                />
                <div className="pt-1">
                  <InstrumentInput
                    type="number"
                    value={maxBudget}
                    onChange={(e) => setMaxBudget(Number(e.target.value))}
                    label="أو أدخل المبلغ يدوياً بالريال السعودي"
                    hint="مثال: 950000"
                    error={errors.max_budget_sar?.[0]}
                  />
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-2 pt-2">
                <label className="block text-xs font-bold text-[var(--navy)]">
                  طريقة السداد وتغطية المبلغ
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("cash")}
                    className={`p-4 rounded-2xl border text-right transition-all cursor-pointer ${
                      paymentMethod === "cash"
                        ? "bg-[var(--navy)] text-[var(--cream)] border-[var(--navy)] shadow-xs font-bold"
                        : "bg-[var(--cream)] text-[var(--navy)] border-[var(--mist)] hover:border-[var(--navy)]"
                    }`}
                  >
                    <span className="block text-sm font-bold">سداد نقدي مباشر (كاش)</span>
                    <span className={`block text-[11px] mt-0.5 font-normal ${paymentMethod === "cash" ? "text-[var(--cream)]/80" : "text-[var(--dusty-blue)]"}`}>
                      سيولة ذاتية متوفرة بدون وساطة بنكية
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("mortgage")}
                    className={`p-4 rounded-2xl border text-right transition-all cursor-pointer ${
                      paymentMethod === "mortgage"
                        ? "bg-[var(--navy)] text-[var(--cream)] border-[var(--navy)] scale-[1.01] shadow-xs font-bold"
                        : "bg-[var(--cream)] text-[var(--navy)] border-[var(--mist)] hover:border-[var(--navy)]"
                    }`}
                  >
                    <span className="block text-sm font-bold">تمويل عقاري بنكي (مرابحة / إجارة)</span>
                    <span className={`block text-[11px] mt-0.5 font-normal ${paymentMethod === "mortgage" ? "text-[var(--cream)]/80" : "text-[var(--dusty-blue)]"}`}>
                      دفعة أولى مع استقطاع شهري من الراتب
                    </span>
                  </button>
                </div>
              </div>

              {/* Monthly Installment Ceiling (if Mortgage) */}
              {paymentMethod === "mortgage" && (
                <div className="p-4 rounded-2xl bg-[var(--cream)] border border-[var(--mist)] space-y-2 animate-in fade-in">
                  <InstrumentInput
                    type="number"
                    value={monthlyCeiling}
                    onChange={(e) => setMonthlyCeiling(e.target.value)}
                    label="سقف القسط الشهري الأقصى للتمويل (ر.س)"
                    hint="مثال: 5500 ر.س شهرياً"
                    error={errors.monthly_installment_ceiling_sar?.[0]}
                  />
                  <p className="text-[11px] text-[var(--dusty-blue)]">
                    يستخدم لاحتساب تكلفة الالتزام الشهري وتفادي الضغط على ميزانية الأسرة.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 2: HOUSEHOLD */}
        {activeStep === 2 && (
          <div className="space-y-6">
            <div className="border-b border-[var(--mist)] pb-4 space-y-1">
              <h2 className="text-lg font-display font-bold text-[var(--navy)] flex items-center gap-2">
                <Users className="w-5 h-5 text-[var(--navy)]" />
                <span>الخطوة 2: الأسرة والمقيمون والسيارات</span>
              </h2>
              <p className="text-xs text-[var(--dusty-blue)]">
                تحديد احتياجات المقيمين الفعليين لضمان استيعاب غرف النوم وعدد المواقف وسهولة الحركة لكبار السن.
              </p>
            </div>

            <div className="space-y-5">
              {/* Family Members Count */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[var(--navy)]">
                    عدد أفراد الأسرة الإجمالي (بمن فيهم المشتري)
                  </label>
                  <span className="font-display font-bold text-base text-[var(--navy)]">
                    {familyMembers} أفراد
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                    <InstrumentChip
                      key={num}
                      label={`${num} ${num === 1 ? "فرد" : num === 2 ? "فردان" : "أفراد"}`}
                      selected={familyMembers === num}
                      onSelect={() => setFamilyMembers(num)}
                    />
                  ))}
                </div>
              </div>

              {/* Children Count & Ages Range */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-[var(--navy)]">
                    عدد الأطفال
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[0, 1, 2, 3, 4, 5].map((num) => (
                      <InstrumentChip
                        key={num}
                        label={`${num} ${num === 0 ? "بدون" : num === 1 ? "طفل" : num === 2 ? "طفلان" : "أطفال"}`}
                        selected={childrenCount === num}
                        onSelect={() => setChildrenCount(num)}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <InstrumentInput
                    value={childrenAgesRange}
                    onChange={(e) => setChildrenAgesRange(e.target.value)}
                    label="الفئة العمرية للأطفال (اختياري)"
                    hint="مثال: رضيع وطفل 7 سنوات"
                  />
                </div>
              </div>

              {/* Elderly Toggle */}
              <div className="pt-2">
                <div className="p-4 rounded-2xl bg-[var(--cream)] border border-[var(--mist)] flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-[var(--navy)] block">
                      هل يقيم كبار سن بالمنزل؟
                    </span>
                    <span className="text-[11px] text-[var(--dusty-blue)] block mt-0.5">
                      يُفعّل إلزامية المصعد أو تفضيل الأدوار الأرضية بدون درج
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <InstrumentChip
                      label="نعم"
                      selected={hasElderly}
                      onSelect={() => setHasElderly(true)}
                    />
                    <InstrumentChip
                      label="لا"
                      selected={!hasElderly}
                      onSelect={() => setHasElderly(false)}
                    />
                  </div>
                </div>
              </div>

              {/* Car Count */}
              <div className="space-y-2 pt-2">
                <label className="block text-xs font-bold text-[var(--navy)]">
                  عدد السيارات التابعة للأسرة
                </label>
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3, 4].map((num) => (
                    <InstrumentChip
                      key={num}
                      label={`${num} ${num === 1 ? "سيارة واحدة" : num === 2 ? "سيارتان" : "سيارات"}`}
                      icon={<Car className="w-3.5 h-3.5" />}
                      selected={carCount === num}
                      onSelect={() => setCarCount(num)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: DAILY LIFE & COMMUTE */}
        {activeStep === 3 && (
          <div className="space-y-6">
            <div className="border-b border-[var(--mist)] pb-4 space-y-1">
              <h2 className="text-lg font-display font-bold text-[var(--navy)] flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-[var(--navy)]" />
                <span>الخطوة 3: الحياة اليومية والازدحام والمواقع</span>
              </h2>
              <p className="text-xs text-[var(--dusty-blue)]">
                الارتباط الجغرافي اليومي يحدد جودة المعيشة الحقيقية بعد الشراء؛ نقيس أثر الموقع على مشاويرك الفعلية.
              </p>
            </div>

            <div className="space-y-5">
              {/* Work Location */}
              <InstrumentInput
                value={workLocation}
                onChange={(e) => setWorkLocation(e.target.value)}
                label="مقر العمل الرئيسي (اسم الحي أو المدينة أو المعلم)"
                hint="مثال: مركز الملك عبد الله المالي، حي الملز، طريق الملك فهد"
                error={errors.work_location?.[0]}
              />

              {/* School Location */}
              <InstrumentInput
                value={schoolLocation}
                onChange={(e) => setSchoolLocation(e.target.value)}
                label="مقر المدارس أو الجامعات (اسم الحي أو النطاق)"
                hint="مثال: مدارس الرياض، حي النرجس، جامعة الملك سعود"
                error={errors.school_location?.[0]}
              />

              {/* Commute Tolerance Slider */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[var(--navy)]">
                    أقصى وقت مقبول للمشوار الواحد في أوقات الذروة (بالدقائق)
                  </label>
                  <span className="font-display font-bold text-base text-[var(--navy)] tabular-nums">
                    {commuteTolerance} دقيقة
                  </span>
                </div>
                <InstrumentSlider
                  value={commuteTolerance}
                  min={10}
                  max={90}
                  step={5}
                  unit="دقيقة"
                  onChange={setCommuteTolerance}
                />
              </div>

              {/* Preferred Neighborhood Type */}
              <div className="space-y-2 pt-2">
                <label className="block text-xs font-bold text-[var(--navy)]">
                  نمط الحي السكني المفضل
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {NEIGHBORHOOD_TYPES.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setNeighborhoodType(type)}
                      className={`p-4 rounded-2xl border text-right transition-all cursor-pointer ${
                        neighborhoodType === type
                          ? "bg-[var(--navy)] text-[var(--cream)] border-[var(--navy)] font-bold shadow-xs"
                          : "bg-[var(--cream)] text-[var(--navy)] border-[var(--mist)] hover:border-[var(--navy)]"
                      }`}
                    >
                      <span className="block text-xs font-bold">
                        {NEIGHBORHOOD_TYPE_LABELS[type]}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: NEEDS & SPECIFICATIONS */}
        {activeStep === 4 && (
          <div className="space-y-6">
            <div className="border-b border-[var(--mist)] pb-4 space-y-1">
              <h2 className="text-lg font-display font-bold text-[var(--navy)] flex items-center gap-2">
                <Sliders className="w-5 h-5 text-[var(--navy)]" />
                <span>الخطوة 4: مواصفات الشقة ومتطلبات البناء</span>
              </h2>
              <p className="text-xs text-[var(--dusty-blue)]">
                المواصفات الأساسية والراحة السكنية للشقة (الغرف، المساحة، الموقف، والمصعد).
              </p>
            </div>

            <div className="space-y-5">
              {/* Bedrooms and Bathrooms */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-[var(--navy)]">
                    الحد الأدنى لغرف النوم
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <InstrumentChip
                        key={num}
                        label={`${num} ${num === 1 ? "غرفة" : num === 2 ? "غرفتان" : "غرف"}`}
                        selected={minBedrooms === num}
                        onSelect={() => setMinBedrooms(num)}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-[var(--navy)]">
                    الحد الأدنى لدورات المياه
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[1, 2, 3, 4].map((num) => (
                      <InstrumentChip
                        key={num}
                        label={`${num} ${num === 1 ? "دورة مياه" : "دورات"}`}
                        selected={minBathrooms === num}
                        onSelect={() => setMinBathrooms(num)}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Minimum Area Sqm */}
              <div className="pt-2">
                <InstrumentInput
                  type="number"
                  value={minArea}
                  onChange={(e) => setMinArea(e.target.value)}
                  label="الحد الأدنى للمساحة الصافية الداخلية (م²)"
                  hint="مثال: 130 م² (اتركه فارغاً إن لم يكن هناك اشتراط حاسم)"
                  error={errors.min_area_sqm?.[0]}
                />
              </div>

              {/* Floor Preference */}
              <div className="space-y-2 pt-2">
                <label className="block text-xs font-bold text-[var(--navy)]">
                  تفضيل الدور
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {FLOOR_PREFERENCES.map((pref) => (
                    <button
                      key={pref}
                      type="button"
                      onClick={() => setFloorPreference(pref)}
                      className={`p-3 rounded-2xl border text-right transition-all cursor-pointer ${
                        floorPreference === pref
                          ? "bg-[var(--navy)] text-[var(--cream)] border-[var(--navy)] font-bold shadow-xs"
                          : "bg-[var(--cream)] text-[var(--navy)] border-[var(--mist)] hover:border-[var(--navy)]"
                      }`}
                    >
                      <span className="text-xs">{FLOOR_PREFERENCE_LABELS[pref]}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Feature Checkboxes / Chips (Elevator, Parking, Maid Room, Outdoor Space) */}
              <div className="space-y-2 pt-2">
                <label className="block text-xs font-bold text-[var(--navy)]">
                  اشتراطات الراحة والمرافق
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    onClick={() => setElevatorRequired(!elevatorRequired)}
                    className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                      elevatorRequired
                        ? "bg-[var(--cream)] border-[var(--navy)] text-[var(--navy)] font-bold"
                        : "bg-[var(--paper)] border-[var(--mist)] text-[var(--dusty-blue)]"
                    }`}
                  >
                    <span className="text-xs">مصعد إلزامي في المبنى</span>
                    <span className={`w-5 h-5 rounded-lg border flex items-center justify-center ${elevatorRequired ? "bg-[var(--navy)] border-[var(--navy)] text-[var(--cream)]" : "border-[var(--mist)]"}`}>
                      {elevatorRequired && <Check className="w-3.5 h-3.5" />}
                    </span>
                  </div>

                  <div
                    onClick={() => setParkingRequired(!parkingRequired)}
                    className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                      parkingRequired
                        ? "bg-[var(--cream)] border-[var(--navy)] text-[var(--navy)] font-bold"
                        : "bg-[var(--paper)] border-[var(--mist)] text-[var(--dusty-blue)]"
                    }`}
                  >
                    <span className="text-xs">موقف سيارة خاص مسجل بالصك</span>
                    <span className={`w-5 h-5 rounded-lg border flex items-center justify-center ${parkingRequired ? "bg-[var(--navy)] border-[var(--navy)] text-[var(--cream)]" : "border-[var(--mist)]"}`}>
                      {parkingRequired && <Check className="w-3.5 h-3.5" />}
                    </span>
                  </div>

                  <div
                    onClick={() => setMaidRoomRequired(!maidRoomRequired)}
                    className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                      maidRoomRequired
                        ? "bg-[var(--cream)] border-[var(--navy)] text-[var(--navy)] font-bold"
                        : "bg-[var(--paper)] border-[var(--mist)] text-[var(--dusty-blue)]"
                    }`}
                  >
                    <span className="text-xs">غرفة عاملة منزلية مستقلة</span>
                    <span className={`w-5 h-5 rounded-lg border flex items-center justify-center ${maidRoomRequired ? "bg-[var(--navy)] border-[var(--navy)] text-[var(--cream)]" : "border-[var(--mist)]"}`}>
                      {maidRoomRequired && <Check className="w-3.5 h-3.5" />}
                    </span>
                  </div>

                  <div
                    onClick={() => setOutdoorSpaceRequired(!outdoorSpaceRequired)}
                    className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                      outdoorSpaceRequired
                        ? "bg-[var(--cream)] border-[var(--navy)] text-[var(--navy)] font-bold"
                        : "bg-[var(--paper)] border-[var(--mist)] text-[var(--dusty-blue)]"
                    }`}
                  >
                    <span className="text-xs">مساحة خارجية (بلكونة / تراس / حوش)</span>
                    <span className={`w-5 h-5 rounded-lg border flex items-center justify-center ${outdoorSpaceRequired ? "bg-[var(--navy)] border-[var(--navy)] text-[var(--cream)]" : "border-[var(--mist)]"}`}>
                      {outdoorSpaceRequired && <Check className="w-3.5 h-3.5" />}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: RANKED 5 PRIORITIES (DRAG OR TAP) */}
        {activeStep === 5 && (
          <div className="space-y-6">
            <div className="border-b border-[var(--mist)] pb-4 space-y-1">
              <h2 className="text-lg font-display font-bold text-[var(--navy)] flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[var(--navy)]" />
                <span>الخطوة 5: ترتيب الأولويات الخمس للمفاضلة</span>
              </h2>
              <p className="text-xs text-[var(--dusty-blue)]">
                اختر ورتّب أولوياتك الخمس (بالنقر أو الأسهم). الأولويات الأولى ستحصل على ترجيح حاسم في مصفوفة المقارنة والتوصية النهائية.
              </p>
            </div>

            <div className="space-y-6">
              {/* Ordered Ranked List (1 to 5) */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-[var(--navy)]">
                  قائمتك المرتبة (من #1 الأكثر أهمية إلى #5):
                </label>
                <div className="space-y-2">
                  {rankedPriorities.map((id, index) => {
                    const item = PRIORITY_ITEMS.find((p) => p.id === id);
                    if (!item) return null;

                    return (
                      <div
                        key={id}
                        className="bg-[var(--cream)] border border-[var(--mist)] hover:border-[var(--navy)] rounded-2xl p-3.5 sm:p-4 flex items-center justify-between gap-3 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-7 h-7 rounded-xl bg-[var(--navy)] text-[var(--cream)] text-xs font-bold flex items-center justify-center shrink-0">
                            #{index + 1}
                          </span>
                          <div>
                            <div className="text-xs sm:text-sm font-bold text-[var(--navy)]">
                              {item.label}
                            </div>
                            <div className="text-[11px] text-[var(--dusty-blue)] font-normal">
                              {item.description}
                            </div>
                          </div>
                        </div>

                        {/* Order Controls (Tap / Reorder buttons) */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => movePriorityUp(index)}
                            className="w-8 h-8 rounded-xl bg-[var(--paper)] border border-[var(--mist)] text-[var(--navy)] hover:bg-[var(--cream)] disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center cursor-pointer transition-colors"
                            aria-label="تقديم الأولوية"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={index === rankedPriorities.length - 1}
                            onClick={() => movePriorityDown(index)}
                            className="w-8 h-8 rounded-xl bg-[var(--paper)] border border-[var(--mist)] text-[var(--navy)] hover:bg-[var(--cream)] disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center cursor-pointer transition-colors"
                            aria-label="تأخير الأولوية"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => togglePrioritySelection(id)}
                            className="w-8 h-8 rounded-xl bg-[var(--paper)] border border-[var(--mist)] text-[#A62626] hover:bg-[#FDF1F0] flex items-center justify-center cursor-pointer transition-colors"
                            aria-label="إزالة من القائمة"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Pool of Available Priorities */}
              <div className="space-y-2 pt-2 border-t border-[var(--mist)]">
                <label className="block text-xs font-bold text-[var(--navy)]">
                  خيارات إضافية للتبديل والاختيار (انقر لإضافتها للقائمة):
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {PRIORITY_ITEMS.filter((item) => !rankedPriorities.includes(item.id)).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => togglePrioritySelection(item.id)}
                      className="p-3 rounded-2xl bg-[var(--paper)] border border-[var(--mist)] hover:border-[var(--navy)] text-right flex items-center justify-between gap-2 transition-all cursor-pointer"
                    >
                      <div>
                        <div className="text-xs font-bold text-[var(--navy)]">{item.label}</div>
                        <div className="text-[11px] text-[var(--dusty-blue)]">{item.description}</div>
                      </div>
                      <span className="w-7 h-7 rounded-xl bg-[var(--cream)] text-[var(--navy)] border border-[var(--mist)] flex items-center justify-center shrink-0">
                        <Plus className="w-3.5 h-3.5" />
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 6: CONSTRAINTS & DEAL-BREAKERS & TIMELINE */}
        {activeStep === 6 && (
          <div className="space-y-6">
            <div className="border-b border-[var(--mist)] pb-4 space-y-1">
              <h2 className="text-lg font-display font-bold text-[var(--navy)] flex items-center gap-2">
                <AlertOctagon className="w-5 h-5 text-[var(--navy)]" />
                <span>الخطوة 6: الموانع الحاسمة (Deal-Breakers) والجدول الزمني</span>
              </h2>
              <p className="text-xs text-[var(--dusty-blue)]">
                الموانع هي خطوط حمراء غير قابلة للتفاوض: أي عقار يحتوي أحد هذه الموانع سيتم استبعاده فوراً أو تنبيهك بشأنه.
              </p>
            </div>

            <div className="space-y-6">
              {/* Free Chips Deal-Breakers */}
              <div className="space-y-2.5">
                <label className="block text-xs font-bold text-[var(--navy)]">
                  حدد الموانع الحاسمة (انقر لاختيار أو إلغاء الشرط):
                </label>
                <div className="flex flex-wrap gap-2">
                  {DEFAULT_DEAL_BREAKER_PRESETS.map((preset) => {
                    const isSelected = dealBreakers.includes(preset);
                    return (
                      <InstrumentChip
                        key={preset}
                        label={preset}
                        selected={isSelected}
                        onSelect={() => toggleDealBreaker(preset)}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Add Custom Free Chip Input */}
              <form onSubmit={handleAddCustomDealBreaker} className="space-y-2 pt-2">
                <label className="block text-xs font-bold text-[var(--navy)]">
                  أضف مانعاً مخصصاً (حر الإدخال):
                </label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <InstrumentInput
                      value={newDealBreaker}
                      onChange={(e) => setNewDealBreaker(e.target.value)}
                      placeholder="مثال: واجهة تطل على محطة وقود أو مبنى عمالة"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!newDealBreaker.trim()}
                    className="px-5 py-3 rounded-2xl bg-[var(--navy)] hover:bg-[var(--midnight)] disabled:opacity-40 text-[var(--cream)] text-xs font-bold shrink-0 transition-all cursor-pointer"
                  >
                    إضافة +
                  </button>
                </div>
              </form>

              {/* Selected Deal-Breakers Review Chips */}
              {dealBreakers.length > 0 && (
                <div className="p-4 rounded-2xl bg-[#FDF1F0] border border-[#F6CBC8] space-y-2">
                  <span className="text-xs font-bold text-[#A62626] block">
                    الموانع المسجلة حالياً ({dealBreakers.length}):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {dealBreakers.map((db, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--paper)] text-[#A62626] border border-[#F6CBC8] text-xs font-medium"
                      >
                        <span>{db}</span>
                        <button
                          type="button"
                          onClick={() => toggleDealBreaker(db)}
                          className="hover:opacity-70 cursor-pointer"
                          aria-label="حذف"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Purchase Timeline */}
              <div className="space-y-2 pt-2 border-t border-[var(--mist)]">
                <label className="block text-xs font-bold text-[var(--navy)]">
                  الجدول الزمني المخطط لإتمام الشراء
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {PURCHASE_TIMELINES.map((tl) => (
                    <button
                      key={tl}
                      type="button"
                      onClick={() => setPurchaseTimeline(tl)}
                      className={`p-4 rounded-2xl border text-right transition-all cursor-pointer ${
                        purchaseTimeline === tl
                          ? "bg-[var(--navy)] text-[var(--cream)] border-[var(--navy)] font-bold shadow-xs"
                          : "bg-[var(--cream)] text-[var(--navy)] border-[var(--mist)] hover:border-[var(--navy)]"
                      }`}
                    >
                      <span className="block text-xs font-bold">
                        {PURCHASE_TIMELINE_LABELS[tl]}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Global Errors Display */}
        {errors && Object.keys(errors).length > 0 && (
          <div className="p-4 rounded-2xl bg-[#FDF1F0] border border-[#F6CBC8] text-xs text-[#A62626] space-y-1">
            <strong className="block">يرجى تصحيح الملاحظات التالية:</strong>
            <ul className="list-disc list-inside space-y-0.5">
              {Object.entries(errors).map(([k, errs]) =>
                errs?.map((msg, i) => <li key={`${k}-${i}`}>{msg}</li>)
              )}
            </ul>
          </div>
        )}

        {/* Step Action Buttons Footer */}
        <div className="pt-6 border-t border-[var(--mist)] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            {activeStep > 1 ? (
              <button
                type="button"
                onClick={() => {
                  void handleSaveStepProgress(activeStep, activeStep - 1);
                }}
                className="w-full sm:w-auto px-6 py-3 rounded-full bg-[var(--cream)] hover:bg-[var(--paper)] text-[var(--navy)] border border-[var(--mist)] text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <ArrowRight className="w-4 h-4" />
                <span>الخطوة السابقة</span>
              </button>
            ) : (
              <span className="text-xs text-[var(--dusty-blue)]">
                الخطوة الأولى من 6
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {activeStep < 6 ? (
              <button
                type="button"
                onClick={() => {
                  void handleSaveStepProgress(activeStep, activeStep + 1);
                }}
                className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[var(--navy)] hover:bg-[var(--midnight)] text-[var(--cream)] text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs active:scale-[0.98]"
              >
                <span>حفظ والانتقال: {STEPS[activeStep]?.label}</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={isPending}
                className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[var(--navy)] hover:bg-[var(--midnight)] active:scale-[0.98] disabled:opacity-60 text-[var(--cream)] text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[var(--cream)]" />
                    <span>جاري حفظ ملف المشتري…</span>
                  </>
                ) : (
                  <>
                    <span>حفظ ملف المشتري ومتابعة إلى حصر العقارات</span>
                    <ArrowLeft className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </InstrumentCard>
    </div>
  );
}

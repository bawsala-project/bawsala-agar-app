import type { ResolvedField, ResolveFactsResult } from "@/lib/evidence/resolve";
import type { ConstraintResult } from "@/lib/analysis/constraints";

export type InspectionCategory =
  | "building_services"
  | "unit_specs"
  | "parking_access"
  | "neighborhood";

export type InspectionPriority = "high" | "medium" | "low";

export type InspectionTriggerReason =
  | "unknown_fact"
  | "conflict"
  | "detected_risk"
  | "constraint_verification";

export type InspectionAssessmentType =
  | "fit"
  | "price"
  | "daily_life"
  | "risks"
  | "financial"
  | string;

export interface InspectionCandidateItem {
  category: InspectionCategory;
  question_ar: string;
  why_it_matters_ar: string;
  how_to_check_ar: string;
  priority: InspectionPriority;
  trigger_reason: InspectionTriggerReason;
  affected_assessment_types: string[];
}

export const CATEGORY_LABELS_AR: Record<InspectionCategory, string> = {
  building_services: "خدمات ومرافق المبنى",
  unit_specs: "مواصفات وتشطيب الوحدة",
  parking_access: "المواقف وسهولة الوصول",
  neighborhood: "الحي والموقع العام",
};

export const PRIORITY_LABELS_AR: Record<
  InspectionPriority,
  { label: string; badgeClasses: string }
> = {
  high: {
    label: "عاجل",
    badgeClasses: "bg-rose-50 text-rose-700 border-rose-200",
  },
  medium: {
    label: "مهم",
    badgeClasses: "bg-amber-50 text-amber-700 border-amber-200",
  },
  low: {
    label: "إرشادي",
    badgeClasses: "bg-slate-100 text-slate-700 border-slate-200",
  },
};

export const TRIGGER_REASON_LABELS_AR: Record<InspectionTriggerReason, string> = {
  unknown_fact: "حقيقة غير مؤكدة",
  conflict: "تعارض في البيانات",
  detected_risk: "مخاطر محتملة",
  constraint_verification: "التحقق من شرط إلزامي",
};

export const ASSESSMENT_TYPE_LABELS_AR: Record<string, string> = {
  fit: "الملاءمة",
  price: "السعر",
  daily_life: "المعيشة اليومية",
  risks: "المخاطر",
  financial: "التكاليف",
};

export interface PropertyInput {
  id?: string;
  title?: string | null;
  district?: string | null;
  listing_price_sar?: number | null;
  area_sqm?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  floor_no?: number | null;
  notes?: string | null;
  [key: string]: unknown;
}

/**
 * Pure generator creating 5 to 12 targeted inspection checks for a property
 * derived exclusively from its unknowns, conflicts, detected risks, and unverified constraints.
 */
export function generateInspectionCandidates(
  property: PropertyInput,
  resolvedFacts: Record<string, ResolvedField> | ResolveFactsResult,
  constraints: ConstraintResult[] = []
): InspectionCandidateItem[] {
  // Extract resolved field map safely
  const facts: Record<string, ResolvedField> =
    resolvedFacts && typeof resolvedFacts === "object" && "fields" in resolvedFacts
      ? (resolvedFacts as ResolveFactsResult).fields
      : (resolvedFacts as Record<string, ResolvedField>) || {};

  const items: InspectionCandidateItem[] = [];
  const addedQuestions = new Set<string>();

  function addItem(item: InspectionCandidateItem) {
    if (addedQuestions.has(item.question_ar)) return;
    addedQuestions.add(item.question_ar);
    items.push(item);
  }

  // Helper to extract known number
  function getKnownNumber(fieldKey: string, fallback?: number | null): number | null {
    const f = facts[fieldKey];
    if (f && f.status === "known" && typeof f.value === "number") {
      return f.value;
    }
    if (typeof fallback === "number") return fallback;
    return null;
  }

  const floorNo = getKnownNumber("floor_no", property.floor_no);
  const buildingFloors = getKnownNumber("building_floors");

  // Check 1: Elevator unknown or floor >= 2
  // Category: building_services, Affected: ['fit', 'daily_life'], How: "معاينة عمل المصعد وتاريخ آخر صيانة"
  const elevatorFact = facts.elevator;
  const elevatorConstraint = constraints.find((c) => c.key === "elevator_required");
  const isElevatorUnknown =
    !elevatorFact || elevatorFact.status === "unknown" || elevatorConstraint?.result === "unknown";
  const isFloorHigh = floorNo !== null && floorNo >= 2;

  if (isElevatorUnknown || isFloorHigh) {
    const isConstraintTrigger = elevatorConstraint !== undefined;
    const triggerReason: InspectionTriggerReason = isConstraintTrigger
      ? "constraint_verification"
      : isElevatorUnknown
        ? "unknown_fact"
        : "detected_risk";

    addItem({
      category: "building_services",
      question_ar: "هل المصعد متوفر ويعمل بكفاءة وتوجد صيانة دورية معتمدة؟",
      why_it_matters_ar:
        "سهولة الوصول اليومي وسلامة العائلة، وتجنب مشقة استخدام الدرج خاصة في الأدوار المرتفعة.",
      how_to_check_ar: "معاينة عمل المصعد وتاريخ آخر صيانة",
      priority: isFloorHigh || isConstraintTrigger ? "high" : "medium",
      trigger_reason: triggerReason,
      affected_assessment_types: ["fit", "daily_life"],
    });
  }

  // Check 2: Parking unknown or constraint active
  // Category: parking_access, Affected: ['fit', 'daily_life'], How: "التأكد من رقم الموقف المسجل بالصك وتجربة الدخول بالسيارة"
  const parkingFact = facts.private_parking;
  const parkingConstraint = constraints.find((c) => c.key === "private_parking");
  const isParkingUnknown = !parkingFact || parkingFact.status === "unknown";
  const isParkingConflicting = parkingFact?.status === "conflicting";
  const isParkingConstraintActive = parkingConstraint !== undefined;

  if (isParkingUnknown || isParkingConflicting || isParkingConstraintActive) {
    const triggerReason: InspectionTriggerReason = isParkingConstraintActive
      ? "constraint_verification"
      : isParkingConflicting
        ? "conflict"
        : "unknown_fact";

    addItem({
      category: "parking_access",
      question_ar: "هل يتوفر موقف سيارة خاص ومسجل رسميًا للوحدة؟",
      why_it_matters_ar:
        "ضمان توفر موقف مخصص ومحمي وتجنب النزاعات اليومية مع الجيران وصعوبة البحث عن موقف.",
      how_to_check_ar: "التأكد من رقم الموقف المسجل بالصك وتجربة الدخول بالسيارة",
      priority: isParkingConstraintActive ? "high" : "medium",
      trigger_reason: triggerReason,
      affected_assessment_types: ["fit", "daily_life"],
    });
  }

  // Check 3: Area or Price conflicting
  // Category: unit_specs, Affected: ['fit', 'price'], How: "طلب مسح الصك العقاري ومطابقة المخطط المعتمد"
  const areaFact = facts.area_sqm;
  const priceFact = facts.listing_price_sar;
  const isAreaConflicting = areaFact?.status === "conflicting";
  const isPriceConflicting = priceFact?.status === "conflicting";

  if (isAreaConflicting || isPriceConflicting) {
    const questionText = isAreaConflicting && isPriceConflicting
      ? "ما هي المساحة الفعلية المعتمدة بالصك وما هو السعر النهائي الشامل؟"
      : isAreaConflicting
        ? "ما هي المساحة الدقيقة للوحدة الصافية المثبتة في الصك؟"
        : "ما هو السعر النهائي المعتمد والشامل للضريبة والسعي؟";

    addItem({
      category: "unit_specs",
      question_ar: questionText,
      why_it_matters_ar:
        "وجود تعارض في بيانات الإعلان؛ يلزم مطابقة الصك العقاري لحماية الميزانية وعدم دفع قيمة أعلى من المساحة الحقيقية.",
      how_to_check_ar: "طلب مسح الصك العقاري ومطابقة المخطط المعتمد",
      priority: "high",
      trigger_reason: "conflict",
      affected_assessment_types: ["fit", "price"],
    });
  }

  // Check 4: Property age unknown and new_building requested
  // Category: building_services, Affected: ['fit', 'risks'], How: "التحقق من سنة إتمام البناء وشهادة الإشغال"
  const ageFact = facts.property_age_years;
  const newBuildingConstraint = constraints.find((c) => c.key === "new_building_only");
  const isNewBuildingRequested = newBuildingConstraint !== undefined;
  const isAgeUnknown = !ageFact || ageFact.status === "unknown" || newBuildingConstraint?.result === "unknown";

  if (isNewBuildingRequested && isAgeUnknown) {
    addItem({
      category: "building_services",
      question_ar: "ما هي سنة إتمام البناء الفعلية وهل صدرت شهادة الإشغال؟",
      why_it_matters_ar:
        "التأكد من مطابقة شرط المبنى الجديد والتثبت من سريان ضمانات الهيكل الإنشائي والعوازل المعتمدة.",
      how_to_check_ar: "التحقق من سنة إتمام البناء وشهادة الإشغال",
      priority: "high",
      trigger_reason: "constraint_verification",
      affected_assessment_types: ["fit", "risks"],
    });
  }

  // Check 5: Upper/ground floor risks (sound, leakage, sunlight)
  // Category: unit_specs, Affected: ['risks', 'daily_life']
  const isGroundFloor = floorNo === 0 || floorNo === 1;
  const isTopFloor =
    (floorNo !== null && buildingFloors !== null && floorNo >= buildingFloors) ||
    (floorNo !== null && floorNo >= 3);

  if (isGroundFloor) {
    addItem({
      category: "unit_specs",
      question_ar: "هل تتمتع الوحدة بخصوصية كافية وعزل عن ضوضاء المداخل والشارع؟",
      why_it_matters_ar:
        "الأدوار الأرضية قد تواجه ضعف الخصوصية أو ارتداد الروائح من الصرف الصحي وضوضاء حركة السكان.",
      how_to_check_ar:
        "معاينة النوافذ وارتفاعها عن الشارع وتفقد مستوى الخصوصية وتصريف الصرف الصحي الداخلي",
      priority: "medium",
      trigger_reason: "detected_risk",
      affected_assessment_types: ["risks", "daily_life"],
    });
  } else if (isTopFloor) {
    addItem({
      category: "unit_specs",
      question_ar: "هل عزل السطح المائي والحراري سليم ومضمون ضد التسريبات والشمس؟",
      why_it_matters_ar:
        "الأدوار العليا أكثر عرضة للحرارة وتسريبات مياه الأمطار من السطح وتكلفة التكييف العالية.",
      how_to_check_ar:
        "معاينة سطح العمارة والبحث عن أي آثار رطوبة أو تشققات وتفقد فواتير ضمان العزل",
      priority: "medium",
      trigger_reason: "detected_risk",
      affected_assessment_types: ["risks", "daily_life"],
    });
  }

  // Check other unverified hard constraints
  for (const c of constraints) {
    if (
      c.result === "unknown" &&
      c.key !== "elevator_required" &&
      c.key !== "private_parking" &&
      c.key !== "new_building_only"
    ) {
      addItem({
        category: "unit_specs",
        question_ar: `التحقق من الشرط الخاص: ${c.labelAr}`,
        why_it_matters_ar: `هذا الشرط وارد ضمن متطلباتك الأساسية (${c.detailAr || "يتطلب تحققًا ميدانيًا"}).`,
        how_to_check_ar: "معاينة الوحدة وسؤال المالك أو الوسيط ومطابقة المواصفات ميدانيًا",
        priority: "high",
        trigger_reason: "constraint_verification",
        affected_assessment_types: ["fit"],
      });
    }
  }

  // Check remaining unknown facts (bedrooms, bathrooms, building_floors, district)
  if (facts.bedrooms?.status === "unknown") {
    addItem({
      category: "unit_specs",
      question_ar: "هل عدد الغرف وتوزيعها الداخلي يطابق احتياجك الفعلي؟",
      why_it_matters_ar: "التأكد من كفاية الغرف لاستيعاب العائلة قبل توقيع العقد.",
      how_to_check_ar: "عدّ الغرف ميدانيًا ومعاينة مساحاتها وصلاحيتها للاستخدام المقصود",
      priority: "high",
      trigger_reason: "unknown_fact",
      affected_assessment_types: ["fit"],
    });
  }

  if (facts.bathrooms?.status === "unknown") {
    addItem({
      category: "unit_specs",
      question_ar: "كم عدد دورات المياه وهل توزيعها مناسب للاستخدام العائلي والضيوف؟",
      why_it_matters_ar: "كفاية دورات المياه شرط أساسي لراحة العائلة ومنع الازدحام اليومي.",
      how_to_check_ar: "معاينة كافة دورات المياه واختبار تصريف المياه والتهوية",
      priority: "low",
      trigger_reason: "unknown_fact",
      affected_assessment_types: ["fit", "daily_life"],
    });
  }

  if (facts.building_floors?.status === "unknown") {
    addItem({
      category: "building_services",
      question_ar: "كم عدد الأدوار والشقق في المبنى وهل الكثافة السكانية معقولة؟",
      why_it_matters_ar: "كثافة المبنى تؤثر على الهدوء والضغط على المصاعد والمواقف المشتركة.",
      how_to_check_ar: "معاينة لوحة توزيع الشقق والعدادات وسؤال حارس المبنى",
      priority: "low",
      trigger_reason: "unknown_fact",
      affected_assessment_types: ["daily_life"],
    });
  }

  if (facts.district?.status === "unknown") {
    addItem({
      category: "neighborhood",
      question_ar: "هل موقع العقار والحي مخدوم بشبكات البنية التحتية والخدمات الأساسية؟",
      why_it_matters_ar: "توفر الصرف الصحي والمياه وشبكة الألياف يحدد استقرار وجودة السكن.",
      how_to_check_ar: "التأكد من أغطية الصرف الصحي وكبائن الاتصالات وسؤال سكان الحي",
      priority: "medium",
      trigger_reason: "unknown_fact",
      affected_assessment_types: ["daily_life"],
    });
  }

  // Fallback practical checks if total < 5 (max 12 total)
  // Contract mentions:
  // - فحص ضغط المياه وجودة العزل الصوتي للنوافذ.
  // - فحص عداد الكهرباء (مستقل أم مشترك).
  const fallbackList: InspectionCandidateItem[] = [
    {
      category: "unit_specs",
      question_ar: "ما مدى قوة ضغط المياه وجودة العزل الصوتي للنوافذ ضد الضوضاء؟",
      why_it_matters_ar:
        "ضعف تدفق المياه والضجيج الخارجي من أكثر المنغصات اليومية شيوعاً بعد الانتقال.",
      how_to_check_ar: "فحص ضغط المياه وجودة العزل الصوتي للنوافذ",
      priority: "medium",
      trigger_reason: "detected_risk",
      affected_assessment_types: ["daily_life"],
    },
    {
      category: "building_services",
      question_ar: "هل عداد الكهرباء مخصص ومستقل تماماً للوحدة أم مشترك مع شقق أخرى؟",
      why_it_matters_ar:
        "العدادات المشتركة تؤدي إلى نزاعات متكررة وصعوبة في احتساب الفاتورة الشهرية بدقة.",
      how_to_check_ar: "فحص عداد الكهرباء (مستقل أم مشترك)",
      priority: "high",
      trigger_reason: "unknown_fact",
      affected_assessment_types: ["daily_life", "price"],
    },
    {
      category: "unit_specs",
      question_ar: "هل توجد أي علامات رطوبة أو تسريبات سابقة في الأسقف والجدران؟",
      why_it_matters_ar:
        "تسريبات السباكة الخفية تسبب تلف الدهانات وتكلف مبالغ إصلاح باهظة.",
      how_to_check_ar:
        "معاينة زوايا الأسقف وأسفل المغاسل ومحيط دورات المياه بحثاً عن بقع أو انتفاخ",
      priority: "high",
      trigger_reason: "detected_risk",
      affected_assessment_types: ["risks", "daily_life"],
    },
    {
      category: "building_services",
      question_ar: "هل يوجد اتحاد ملاك معتمد ورسوم صيانة شهرية محددة للمرافق المشتركة؟",
      why_it_matters_ar:
        "غياب إدارة موحدة للمبنى يؤدي إلى إهمال النظافة وتعطل المصاعد والإنارة العامة.",
      how_to_check_ar:
        "الاستفسار عن قيمة الرسوم الدورية ومستوى التزام السكان بالدفع وصيانة المبنى",
      priority: "medium",
      trigger_reason: "detected_risk",
      affected_assessment_types: ["financial", "daily_life"],
    },
    {
      category: "neighborhood",
      question_ar: "هل توجد تغطية ممتازة لشبكات الجوال وخدمات الإنترنت داخل كافة الغرف؟",
      why_it_matters_ar:
        "ضعف الإرسال داخل بعض المباني يعيق العمل والاتصالات اليومية الضرورية.",
      how_to_check_ar:
        "فحص مستوى أبراج الجوال وإجراء اتصال هاتفي واختبار التصفح داخل كل غرفة",
      priority: "low",
      trigger_reason: "detected_risk",
      affected_assessment_types: ["daily_life"],
    },
    {
      category: "parking_access",
      question_ar: "ما مدى انسيابية الدخول والخروج من الشارع في أوقات الذروة وتوفر مواقف الزوار؟",
      why_it_matters_ar:
        "الشوارع الضيقة أو المزدحمة تعقد التنقل اليومي وتسبب إزعاجاً لضيوفك.",
      how_to_check_ar:
        "معاينة عرض الشارع ومخارج الحي وتوفر مساحات وقوف جانبية آمنة للزوار",
      priority: "medium",
      trigger_reason: "detected_risk",
      affected_assessment_types: ["daily_life"],
    },
    {
      category: "building_services",
      question_ar: "هل شبكة الصرف الصحي وغرف التفتيش معزولة ولا تنبعث منها روائح في المداخل؟",
      why_it_matters_ar:
        "سوء تنفيذ مجاري الصرف أو التهوية ينعكس على راحة سكان المبنى وصحتهم.",
      how_to_check_ar:
        "تفقد نظافة محيط المبنى والمنور والتأكد من إحكام غلق فتحات الصرف الصحي",
      priority: "medium",
      trigger_reason: "detected_risk",
      affected_assessment_types: ["risks", "daily_life"],
    },
  ];

  // If fewer than 5 items, pad from fallbacks until at least 5
  for (const fallback of fallbackList) {
    if (items.length >= 5) break;
    addItem(fallback);
  }

  // Strictly enforce 5 to 12 items limit
  if (items.length > 12) {
    return items.slice(0, 12);
  }

  return items;
}

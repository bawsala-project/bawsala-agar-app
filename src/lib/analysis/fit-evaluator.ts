import { DEFAULT_BUYER_PROFILE, type BuyerProfile } from "@/lib/schemas/buyer-profile";
import type { ResolveFactsResult, PropertyFact, ResolvedFieldsMap, GroupedClaims } from "@/lib/evidence/resolve";
import { computeDimensionWeights, DimensionWeights, FitDimensionKey } from "./weights";

export interface DimensionEvaluation {
  key: FitDimensionKey;
  labelAr: string;
  score: number; // 0 to 100
  weight: number; // 0.0 to 1.0
  weightedScore: number; // score * weight
  reasonAr: string;
  supportingEvidence: string[];
  status: "excellent" | "good" | "fair" | "poor";
}

export type ConfidenceLevel = "high" | "medium" | "low";

export interface ConfidenceAssessment {
  level: ConfidenceLevel;
  score: number; // 0 to 100
  reasonAr: string;
}

export interface PropertyDataInput {
  id: string;
  title?: string | null;
  district?: string | null;
  city?: string | null;
  listingPriceSar?: number | null;
  areaSqm?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  floorNo?: number | null;
  buildingAgeYears?: number | null;
  deedType?: string | null; // e.g. "electronic_independent" | "shared"
  notes?: string | null;
  facts?: PropertyFact[];
  resolved?: ResolveFactsResult | { fields: ResolvedFieldsMap; claims?: GroupedClaims };
  inspectionFindings?: Array<{
    category?: string;
    item?: string;
    status?: "pass" | "issue" | "info";
    detailAr?: string;
  }>;
}

export interface PropertyFitEvaluation {
  propertyId: string;
  propertyTitle: string;
  district: string;
  dimensions: {
    suitability: DimensionEvaluation;
    priceAffordability: DimensionEvaluation;
    locationDailyLife: DimensionEvaluation;
    propertyQuality: DimensionEvaluation;
    risks: DimensionEvaluation;
  };
  dimensionWeights: DimensionWeights;
  weightedFitScore: number; // 0 to 100
  fitRating: "strong" | "partial" | "weak" | "insufficient_evidence";
  topPros: [string, string, string];
  topCons: [string, string, string];
  rankingReasonAr: string;
  missingInformation: string[];
  confidence: ConfidenceAssessment;
  isCertain: boolean;
}

export interface CaseFitEvaluation {
  properties: PropertyFitEvaluation[];
  rankedProperties: PropertyFitEvaluation[];
  missingInformation: string[];
  confidence: ConfidenceAssessment;
  summaryAr: string;
}

/**
 * 1. Dimension 1: Suitability (الملاءمة للاحتياج والأسرة)
 * Evaluates bedrooms, area per person, floor, parking, elevator against BuyerProfile.
 */
export function evaluateSuitability(
  profile: BuyerProfile,
  property: PropertyDataInput
): DimensionEvaluation {
  const supportingEvidence: string[] = [];
  let scorePoints = 0;
  const reasons: string[] = [];

  const familyMembers = Math.max(1, profile.family_members_count || 1);

  // A. Bedrooms
  const bedrooms = property.bedrooms ?? (property.resolved?.fields.bedrooms?.status === "known" ? Number(property.resolved.fields.bedrooms.value) : null);
  if (bedrooms !== null && !isNaN(bedrooms)) {
    if (bedrooms >= profile.min_bedrooms) {
      scorePoints += 30;
      reasons.push(`${bedrooms} غرف نوم تلبي الحد الأدنى المطلوب (${profile.min_bedrooms} غرف)`);
      supportingEvidence.push(`عدد الغرف: ${bedrooms}`);
    } else if (bedrooms === profile.min_bedrooms - 1) {
      scorePoints += 18;
      reasons.push(`${bedrooms} غرف نوم (أقل بغرفة واحدة من الحد الأدنى المرغوب)`);
    } else {
      scorePoints += 8;
      reasons.push(`${bedrooms} غرف نوم لا تكفي لاحتياج الأسرة (${profile.min_bedrooms} غرف)`);
    }
  } else {
    scorePoints += 15;
    reasons.push("عدد غرف النوم غير محدد بدقة");
  }

  // B. Area per person
  const area = property.areaSqm ?? (property.resolved?.fields.area_sqm?.status === "known" ? Number(property.resolved.fields.area_sqm.value) : null);
  if (area !== null && !isNaN(area) && area > 0) {
    const areaPerPerson = Math.round(area / familyMembers);
    supportingEvidence.push(`مساحة الفرد: ${areaPerPerson} م² (${area} م² إجمالي)`);

    if (areaPerPerson >= 35) {
      scorePoints += 30;
      reasons.push(`اتساع رحب بمعدل ${areaPerPerson} م² لكل فرد من أفراد الأسرة`);
    } else if (areaPerPerson >= 26) {
      scorePoints += 25;
      reasons.push(`مساحة مناسبة بمعدل ${areaPerPerson} م² لكل فرد`);
    } else if (areaPerPerson >= 20) {
      scorePoints += 18;
      reasons.push(`مساحة متوسطة (${areaPerPerson} م² لكل فرد)`);
    } else {
      scorePoints += 8;
      reasons.push(`مساحة ضيقة للأسرة (${areaPerPerson} م² فقط لكل فرد)`);
    }

    if (profile.min_area_sqm && area < profile.min_area_sqm) {
      scorePoints = Math.max(0, scorePoints - 6);
      reasons.push(`أقل من المساحة الدنيا المحددة بالميزانية (${profile.min_area_sqm} م²)`);
    }
  } else {
    scorePoints += 15;
    reasons.push("المساحة الإجمالية غير محددة");
  }

  // C. Floor & Elevator
  const floorNo = property.floorNo ?? (property.resolved?.fields.floor_no?.status === "known" ? Number(property.resolved.fields.floor_no.value) : null);
  const hasElevator = property.resolved?.fields.elevator?.status === "known"
    ? Boolean(property.resolved.fields.elevator.value)
    : undefined;

  let floorScore = 15;
  if (floorNo !== null && !isNaN(floorNo)) {
    supportingEvidence.push(`الدور: ${floorNo === 0 ? "أرضي" : floorNo}`);

    if (profile.floor_preference === "ground" && floorNo === 0) {
      floorScore = 20;
      reasons.push("دور أرضي يطابق رغبة الأسرة");
    } else if (profile.floor_preference === "top" && floorNo >= 3) {
      floorScore = 20;
      reasons.push("دور علوي يطابق التفضيل");
    } else if (profile.floor_preference === "middle" && (floorNo === 1 || floorNo === 2)) {
      floorScore = 20;
      reasons.push("دور متوسط مناسب");
    } else {
      floorScore = 16;
    }

    // Elevator requirement for upper floors or elderly
    if (floorNo > 0 && (profile.elevator_required || profile.has_elderly)) {
      if (hasElevator === true) {
        supportingEvidence.push("يتوفر مصعد معتمد");
      } else if (hasElevator === false) {
        floorScore = Math.max(2, floorScore - 12);
        reasons.push("مبنى بدون مصعد في دور علوي مع حاجة الأسرة أو كبار السن له");
      } else {
        reasons.push("حالة وجود المصعد غير مؤكدة");
      }
    }
  } else {
    reasons.push("رقم الدور غير محدد");
  }
  scorePoints += floorScore;

  // D. Parking & Cars
  const hasParking = property.resolved?.fields.private_parking?.status === "known"
    ? Boolean(property.resolved.fields.private_parking.value)
    : undefined;

  let parkingScore = 12;
  if (profile.parking_required || profile.car_count > 0) {
    if (hasParking === true) {
      parkingScore = 20;
      supportingEvidence.push("موقف خاص مسجل");
      reasons.push("يتوفر موقف سيارة مخصص");
    } else if (hasParking === false) {
      parkingScore = 5;
      reasons.push("عدم توفر موقف سيارة خاص للوحدة");
    } else {
      parkingScore = 10;
      reasons.push("موقف السيارة غير مؤكد في الإعلان");
    }
  } else {
    parkingScore = 20;
  }
  scorePoints += parkingScore;

  const score = Math.min(100, Math.max(0, scorePoints));
  const reasonAr = reasons.slice(0, 2).join("، مع ");

  return {
    key: "suitability",
    labelAr: "الملاءمة للاحتياج والأسرة",
    score,
    weight: 0.20,
    weightedScore: score * 0.20,
    reasonAr: reasonAr || "ملاءمة جيدة للاحتياجات الأسرية الأساسية",
    supportingEvidence,
    status: score >= 85 ? "excellent" : score >= 70 ? "good" : score >= 50 ? "fair" : "poor",
  };
}

/**
 * 2. Dimension 2: Price & Affordability (السعر والقدرة المالية)
 * Evaluates price vs budget, installment burden, price per sqm.
 */
export function evaluatePriceAffordability(
  profile: BuyerProfile,
  property: PropertyDataInput
): DimensionEvaluation {
  const supportingEvidence: string[] = [];
  const reasons: string[] = [];

  const price = property.listingPriceSar ?? (property.resolved?.fields.listing_price_sar?.status === "known" ? Number(property.resolved.fields.listing_price_sar.value) : null);
  const maxBudget = profile.max_budget_sar;

  let score = 50;

  if (price !== null && !isNaN(price) && price > 0 && maxBudget > 0) {
    supportingEvidence.push(`سعر العرض: ${price.toLocaleString("ar-SA")} ر.س`);
    supportingEvidence.push(`سقف الميزانية: ${maxBudget.toLocaleString("ar-SA")} ر.س`);

    const delta = maxBudget - price;

    if (price <= maxBudget) {
      const savingsRatio = delta / maxBudget;
      if (savingsRatio >= 0.15) {
        score = 98;
        reasons.push(`وفر مالي ممتاز (${Math.round(delta).toLocaleString("ar-SA")} ر.س أقل من الميزانية القصوى)`);
      } else if (savingsRatio >= 0.05) {
        score = 92;
        reasons.push(`ضمن الميزانية مع هامش أمان مالي مريح (${Math.round(delta).toLocaleString("ar-SA")} ر.س أقل من الميزانية القصوى)`);
      } else {
        score = 85;
        reasons.push("مطابق تماماً لسقف الميزانية المحددة للشراء");
      }
    } else {
      const overRatio = (price - maxBudget) / maxBudget;
      if (overRatio <= 0.05) {
        score = 62;
        reasons.push(`تجاوز طفيف للميزانية بنسبة ${Math.round(overRatio * 100)}% (${Math.round(-delta).toLocaleString("ar-SA")} ر.س)`);
      } else if (overRatio <= 0.12) {
        score = 42;
        reasons.push(`تجاوز للميزانية بنسبة ${Math.round(overRatio * 100)}% يتطلب تمويلاً إضافياً`);
      } else {
        score = 18;
        reasons.push(`سعر مرتفع يتجاوز الميزانية بـ ${Math.round(-delta).toLocaleString("ar-SA")} ر.س`);
      }
    }

    // Mortgage installment burden check
    if (profile.payment_method === "mortgage") {
      const estimatedInstallment = Math.round(price * 0.0055);
      supportingEvidence.push(`القسط التقديري: ~${estimatedInstallment.toLocaleString("ar-SA")} ر.س/شهر`);

      const ceiling = profile.monthly_installment_ceiling_sar;
      if (ceiling && ceiling > 0) {
        if (estimatedInstallment <= ceiling) {
          reasons.push(`القسط التقديري (~${estimatedInstallment} ر.س) ضمن سقفك الشهري (${ceiling} ر.س)`);
          score = Math.min(100, score + 4);
        } else {
          const overInst = estimatedInstallment - ceiling;
          reasons.push(`القسط التقديري يتجاوز سقف القسط الشهري بـ ${overInst} ر.س`);
          score = Math.max(10, score - 15);
        }
      }
    }

    // Price per sqm
    const area = property.areaSqm ?? (property.resolved?.fields.area_sqm?.status === "known" ? Number(property.resolved.fields.area_sqm.value) : null);
    if (area && area > 0) {
      const pSqm = Math.round(price / area);
      supportingEvidence.push(`سعر المتر: ${pSqm.toLocaleString("ar-SA")} ر.س/م²`);
    }
  } else {
    reasons.push("سعر العقار غير معروف بدقة للمقارنة المالية");
    score = 30;
  }

  const reasonAr = reasons.slice(0, 2).join("، مع ");

  return {
    key: "priceAffordability",
    labelAr: "السعر والقدرة المالية",
    score,
    weight: 0.20,
    weightedScore: score * 0.20,
    reasonAr: reasonAr || "تقييم السعر مقارنة بالميزانية والقدرة المالية",
    supportingEvidence,
    status: score >= 85 ? "excellent" : score >= 70 ? "good" : score >= 50 ? "fair" : "poor",
  };
}

/**
 * 3. Dimension 3: Location & Daily Life (الموقع والحياة اليومية)
 * Evaluates commute to work & school, services nearby, neighborhood alignment.
 */
export function evaluateLocationDailyLife(
  profile: BuyerProfile,
  property: PropertyDataInput
): DimensionEvaluation {
  const supportingEvidence: string[] = [];
  const reasons: string[] = [];

  let score = 75; // Baseline neutral score for residential location

  const resolvedDistrictStr =
    property.resolved?.fields.district?.status === "known"
      ? String(property.resolved.fields.district.value)
      : "";
  const district = (property.district || resolvedDistrictStr || "").trim();
  const city = property.city || "الرياض";

  if (district) {
    supportingEvidence.push(`الحي: ${district} (${city})`);
  }

  // Work commute check
  if (profile.work_location && profile.work_location.trim().length > 0) {
    const work = profile.work_location.trim();
    if (district && (district.includes(work) || work.includes(district))) {
      score += 15;
      reasons.push(`موقع مثالي في نفس نطاق مقر العمل (${work})`);
      supportingEvidence.push(`قرب مباشر من مقر العمل: ${work}`);
    } else {
      reasons.push(`ضمن النطاق العام لمدينة ${city} مع تحمل تنقل حتى ${profile.commute_tolerance_minutes} دقيقة`);
    }
  }

  // School commute check
  if (profile.school_location && profile.school_location.trim().length > 0) {
    const school = profile.school_location.trim();
    if (district && (district.includes(school) || school.includes(district))) {
      score += 10;
      reasons.push(`قريب من مدارس الأبناء (${school})`);
      supportingEvidence.push(`قرب من مدرسة الأبناء: ${school}`);
    }
  }

  // Preferred neighborhood type
  if (profile.preferred_neighborhood_type) {
    switch (profile.preferred_neighborhood_type) {
      case "quiet_family":
        reasons.push("طابع سكني عائلي هادئ بعيد عن الضوضاء التجارية");
        score += 3;
        break;
      case "vibrant_services":
        reasons.push("قريب من الخدمات والأنشطة اليومية");
        score += 3;
        break;
      case "modern_planned":
        reasons.push("مخطط عمراني حديث منظم");
        score += 3;
        break;
      case "close_to_highways":
        reasons.push("سهولة الوصول للمحاور الرئيسية والطرق السريعة");
        score += 3;
        break;
    }
  }

  score = Math.min(100, Math.max(20, score));
  const reasonAr = reasons.slice(0, 2).join("، و");

  return {
    key: "locationDailyLife",
    labelAr: "الموقع والحياة اليومية",
    score,
    weight: 0.20,
    weightedScore: score * 0.20,
    reasonAr: reasonAr || "موقع سكني ملائم لروتين الحياة اليومية",
    supportingEvidence,
    status: score >= 85 ? "excellent" : score >= 70 ? "good" : score >= 50 ? "fair" : "poor",
  };
}

/**
 * 4. Dimension 4: Property Quality (جودة العقار وحالته)
 * Evaluates building age, condition, finishing, maintenance costs.
 * Engineering inspection feeds this dimension as supporting evidence!
 */
export function evaluatePropertyQuality(
  profile: BuyerProfile,
  property: PropertyDataInput
): DimensionEvaluation {
  const supportingEvidence: string[] = [];
  const reasons: string[] = [];

  let score = 70;

  // Building age
  const age = property.buildingAgeYears ?? (property.resolved?.fields.property_age_years?.status === "known" ? Number(property.resolved.fields.property_age_years.value) : null);

  if (age !== null && !isNaN(age)) {
    supportingEvidence.push(`عمر المبنى: ${age === 0 ? "جديد (صفر سنوات)" : `${age} سنوات`}`);

    if (age === 0) {
      score = 96;
      reasons.push("مبنى جديد بالكامل مع ضمانات إنشائية سارية");
    } else if (age <= 2) {
      score = 90;
      reasons.push("عقار حديث الإنشاء (سنتين أو أقل) بحالة ممتازة");
    } else if (age <= 5) {
      score = 80;
      reasons.push(`عمر المبنى ${age} سنوات، بحالة جيدة مع استهلاك اعتيادي`);
    } else if (age <= 10) {
      score = 64;
      reasons.push(`عمر المبنى ${age} سنوات، يتطلب فحص التمديدات وأنظمة الصيانة`);
    } else {
      score = 45;
      reasons.push(`عمر المبنى ${age} سنة، يحتاج إلى رصد ميزانية لأعمال التجديد والصيانة`);
    }
  } else {
    reasons.push("عمر المبنى غير محدد بدقة في بيانات العرض");
    score = 55;
  }

  // Supporting evidence from Engineering Inspection
  if (property.inspectionFindings && property.inspectionFindings.length > 0) {
    const issues = property.inspectionFindings.filter((f) => f.status === "issue");
    const passed = property.inspectionFindings.filter((f) => f.status === "pass");

    if (passed.length > 0) {
      supportingEvidence.push(`الفحص الهندسي الميداني: مطابقة ${passed.length} عناصر فنية`);
      score = Math.min(100, score + 4);
    }
    if (issues.length > 0) {
      supportingEvidence.push(`الفحص الهندسي الميداني: رصد ${issues.length} ملاحظات تحتاج معالجة`);
      score = Math.max(25, score - (issues.length * 8));
      reasons.push(`توجد ملاحظات هندسية مرصودة أثناء المعاينة (${issues[0]?.detailAr || "ملاحظات تشطيب"})`);
    }
  }

  const reasonAr = reasons.slice(0, 2).join("، مع ");

  return {
    key: "propertyQuality",
    labelAr: "جودة العقار وحالته",
    score,
    weight: 0.20,
    weightedScore: score * 0.20,
    reasonAr: reasonAr || "جودة وحالة العقار وتكاليف الصيانة المتوقعة",
    supportingEvidence,
    status: score >= 85 ? "excellent" : score >= 70 ? "good" : score >= 50 ? "fair" : "poor",
  };
}

/**
 * 5. Dimension 5: Risks (المخاطر وجوانب الحذر)
 * Evaluates legal/deed issues, area mismatch (marketed vs deed vs plan), hidden costs.
 * Deed and area checks feed this dimension as supporting evidence!
 */
export function evaluateRisks(
  profile: BuyerProfile,
  property: PropertyDataInput
): DimensionEvaluation {
  const supportingEvidence: string[] = [];
  const reasons: string[] = [];

  let safetyScore = 85; // Baseline high safety, penalizing discovered risks

  // A. Area Mismatch check (marketed vs actual vs deed vs plan)
  const areaField = property.resolved?.fields.area_sqm;
  if (areaField?.status === "conflicting") {
    safetyScore -= 28;
    reasons.push("تعارض في المساحة المسجلة بين الإعلان والمستندات يتطلب التحقق القطعي");
    supportingEvidence.push("تعارض مساحات: اختلاف أرقام المساحة بين المصادر");
  } else if (areaField?.status === "known") {
    supportingEvidence.push(`مساحة مدققة: ${areaField.value} م² دون تعارضات مسجلة`);
  }

  // Price conflict check
  const priceField = property.resolved?.fields.listing_price_sar;
  if (priceField?.status === "conflicting") {
    safetyScore -= 25;
    reasons.push("تعارض في سعر العرض المسجل بين المنصات والإعلان");
    supportingEvidence.push("تعارض سعر: أرقام أسعار متضاربة تتطلب تأكيد البائع");
  }

  // B. Legal & Deed Checks (supporting evidence)
  if (property.deedType === "electronic_independent") {
    safetyScore += 10;
    supportingEvidence.push("صك إلكتروني مستقل موثق يضمن الملكية الفورية");
    reasons.push("صك ملكية إلكتروني مستقل وخالٍ من القيود المانعة");
  } else if (property.deedType === "shared") {
    safetyScore -= 20;
    reasons.push("صك مشاع أو غير مستقل يحمل مخاطر في نقل الملكية والفرز");
    supportingEvidence.push("صك مشاع مشترك: يتطلب فرزاً نظامياً معتمداً");
  } else {
    supportingEvidence.push("حالة الصك والوثائق القانونية قيد التدقيق");
  }

  // C. Deal Breakers check
  if (Array.isArray(profile.deal_breakers) && profile.deal_breakers.length > 0) {
    const elevatorField = property.resolved?.fields.elevator;
    const isElevatorFalse = elevatorField?.status === "known" && elevatorField.value === false;
    const parkingField = property.resolved?.fields.private_parking;
    const isParkingFalse = parkingField?.status === "known" && parkingField.value === false;

    for (const db of profile.deal_breakers) {
      if (db.includes("مصعد") && isElevatorFalse && (property.floorNo || 0) > 0) {
        safetyScore -= 20;
        reasons.push(`مانع شراء صريح: ${db}`);
        supportingEvidence.push(`مخالفة شرط حاسم: ${db}`);
      }
      if (db.includes("موقف") && isParkingFalse) {
        safetyScore -= 15;
        reasons.push(`مانع شراء صريح: ${db}`);
        supportingEvidence.push(`مخالفة شرط حاسم: ${db}`);
      }
    }
  }

  // Bound score
  const score = Math.min(100, Math.max(15, safetyScore));
  const reasonAr = reasons.length > 0 ? reasons.slice(0, 2).join("، مع ") : "موقف قانوني سليم وتطابق في البيانات دون مخاطر ظاهرة";

  return {
    key: "risks",
    labelAr: "المخاطر وجوانب الحذر",
    score,
    weight: 0.20,
    weightedScore: score * 0.20,
    reasonAr,
    supportingEvidence,
    status: score >= 85 ? "excellent" : score >= 70 ? "good" : score >= 50 ? "fair" : "poor",
  };
}

/**
 * Computes missing information for a candidate property.
 */
export function computePropertyMissingInformation(
  property: PropertyDataInput
): string[] {
  const missing: string[] = [];

  const price = property.listingPriceSar ?? (property.resolved?.fields.listing_price_sar?.status === "known" ? property.resolved.fields.listing_price_sar.value : null);
  if (!price) missing.push("سعر العرض الإجمالي");

  const area = property.areaSqm ?? (property.resolved?.fields.area_sqm?.status === "known" ? property.resolved.fields.area_sqm.value : null);
  if (!area) missing.push("المساحة الصافية المعتمدة (م²)");

  const bedrooms = property.bedrooms ?? (property.resolved?.fields.bedrooms?.status === "known" ? property.resolved.fields.bedrooms.value : null);
  if (bedrooms === null || bedrooms === undefined) missing.push("عدد غرف النوم");

  const floor = property.floorNo ?? (property.resolved?.fields.floor_no?.status === "known" ? property.resolved.fields.floor_no.value : null);
  if (floor === null || floor === undefined) missing.push("رقم الدور وموقع الشقة في المبنى");

  const age = property.buildingAgeYears ?? (property.resolved?.fields.property_age_years?.status === "known" ? property.resolved.fields.property_age_years.value : null);
  if (age === null || age === undefined) missing.push("عمر المبنى وسنة البناء");

  const districtField = property.resolved?.fields.district;
  const hasDistrict = Boolean(property.district) || (districtField?.status === "known" && Boolean(districtField.value));
  if (!hasDistrict) {
    missing.push("اسم الحي وموقع العقار بدقة");
  }

  if (property.resolved?.fields.elevator?.status === "unknown") {
    missing.push("توفر المصعد وحالته التشغيلية");
  }

  if (property.resolved?.fields.private_parking?.status === "unknown") {
    missing.push("تخصيص موقف سيارة خاص بالصك");
  }

  return missing;
}

/**
 * Computes confidence assessment for a property.
 * Evaluates data completeness and source reliability.
 * Rule: Never present a score as certain when confidence is low.
 */
export function computePropertyConfidence(
  property: PropertyDataInput,
  missingCount: number
): ConfidenceAssessment {
  let reliabilityPoints = 100;

  // Deductions for missing fields
  reliabilityPoints -= missingCount * 12;

  // Deductions for conflicting fields
  if (property.resolved) {
    const conflictingCount = Object.values(property.resolved.fields).filter(
      (f) => f.status === "conflicting"
    ).length;
    reliabilityPoints -= conflictingCount * 20;

    // Bonus for user-stated / verified facts
    const verifiedCount = Object.values(property.resolved.fields).filter(
      (f) => f.status === "known" && f.certainty === "user_stated"
    ).length;
    reliabilityPoints += verifiedCount * 4;
  }

  const score = Math.min(100, Math.max(10, reliabilityPoints));

  if (score >= 78) {
    return {
      level: "high",
      score,
      reasonAr: "بيانات العقار مكتملة وموثقة بدرجة عالية من الدقة للاستشارة",
    };
  } else if (score >= 50) {
    return {
      level: "medium",
      score,
      reasonAr: "تتوفر البيانات الأساسية مع بعض الحقول غير المؤكدة التي تتطلب تدقيقاً بالمعاينة الميدانية",
    };
  } else {
    return {
      level: "low",
      score,
      reasonAr: "بيانات غير مكتملة أو تحتوي على تعارضات؛ النتيجة تقديرية مبدئية ولا تعتبر قطعية",
    };
  }
}

/**
 * Selects top 3 pros and top 3 cons based on dimension results and specific factors.
 */
export function selectTopProsAndCons(
  dimensions: {
    suitability: DimensionEvaluation;
    priceAffordability: DimensionEvaluation;
    locationDailyLife: DimensionEvaluation;
    propertyQuality: DimensionEvaluation;
    risks: DimensionEvaluation;
  },
  missingInfo: string[]
): { topPros: [string, string, string]; topCons: [string, string, string] } {
  const prosPool: string[] = [];
  const consPool: string[] = [];

  // Price
  if (dimensions.priceAffordability.score >= 80) {
    prosPool.push(dimensions.priceAffordability.reasonAr);
  } else if (dimensions.priceAffordability.score < 65) {
    consPool.push(dimensions.priceAffordability.reasonAr);
  }

  // Suitability
  if (dimensions.suitability.score >= 75) {
    prosPool.push(dimensions.suitability.reasonAr);
  } else if (dimensions.suitability.score < 65) {
    consPool.push(dimensions.suitability.reasonAr);
  }

  // Quality
  if (dimensions.propertyQuality.score >= 78) {
    prosPool.push(dimensions.propertyQuality.reasonAr);
  } else if (dimensions.propertyQuality.score < 65) {
    consPool.push(dimensions.propertyQuality.reasonAr);
  }

  // Location
  if (dimensions.locationDailyLife.score >= 78) {
    prosPool.push(dimensions.locationDailyLife.reasonAr);
  } else if (dimensions.locationDailyLife.score < 65) {
    consPool.push(dimensions.locationDailyLife.reasonAr);
  }

  // Risks
  if (dimensions.risks.score >= 80) {
    prosPool.push(dimensions.risks.reasonAr);
  } else if (dimensions.risks.score < 65) {
    consPool.push(dimensions.risks.reasonAr);
  }

  // Fallbacks to guarantee exactly 3 pros and 3 cons
  const defaultPros = [
    "موقع سكني ملائم لروتين الحياة اليومية",
    "توزيع مساحات مناسب لاحتياجات الأسرة",
    "خلو العقار من التعارضات القانونية المؤكدة",
  ];

  const defaultCons = [
    missingInfo[0] ? `حاجة للتأكد الميداني من (${missingInfo[0]})` : "يتطلب التحقق من رسوم اتحاد الملاك الدورية",
    missingInfo[1] ? `نقص معلومات (${missingInfo[1]})` : "ضرورة فحص التمديدات وعوازل الصوت أثناء المعاينة",
    missingInfo[2] ? `عدم توفر وثيقة (${missingInfo[2]})` : "الحاجة لمراجعة وثائق الضمان والصيانة مع المطور",
  ];

  while (prosPool.length < 3) {
    const candidate = defaultPros[prosPool.length];
    if (candidate && !prosPool.includes(candidate)) prosPool.push(candidate);
    else prosPool.push(`ميزة إضافية: ${dimensions.suitability.labelAr}`);
  }

  while (consPool.length < 3) {
    const candidate = defaultCons[consPool.length];
    if (candidate && !consPool.includes(candidate)) consPool.push(candidate);
    else consPool.push(`تنبيه: يتطلب فحص (${dimensions.propertyQuality.labelAr})`);
  }

  return {
    topPros: [prosPool[0]!, prosPool[1]!, prosPool[2]!],
    topCons: [consPool[0]!, consPool[1]!, consPool[2]!],
  };
}

/**
 * Pure evaluation function for a single candidate property against a BuyerProfile.
 */
export function evaluatePropertyFit(
  rawProfile: BuyerProfile | null | undefined,
  property: PropertyDataInput
): PropertyFitEvaluation {
  const profile = rawProfile ?? DEFAULT_BUYER_PROFILE;
  // 1. Calculate weights dynamically from buyer's ranked priorities
  const weights = computeDimensionWeights(profile.ranked_priorities);

  // 2. Evaluate each of the 5 dimensions
  const suitability = evaluateSuitability(profile, property);
  const priceAffordability = evaluatePriceAffordability(profile, property);
  const locationDailyLife = evaluateLocationDailyLife(profile, property);
  const propertyQuality = evaluatePropertyQuality(profile, property);
  const risks = evaluateRisks(profile, property);

  // Update weights in evaluations
  suitability.weight = weights.suitability;
  suitability.weightedScore = suitability.score * weights.suitability;

  priceAffordability.weight = weights.priceAffordability;
  priceAffordability.weightedScore = priceAffordability.score * weights.priceAffordability;

  locationDailyLife.weight = weights.locationDailyLife;
  locationDailyLife.weightedScore = locationDailyLife.score * weights.locationDailyLife;

  propertyQuality.weight = weights.propertyQuality;
  propertyQuality.weightedScore = propertyQuality.score * weights.propertyQuality;

  risks.weight = weights.risks;
  risks.weightedScore = risks.score * weights.risks;

  // 3. Compute weighted fit score (0-100)
  const rawWeightedScore =
    suitability.weightedScore +
    priceAffordability.weightedScore +
    locationDailyLife.weightedScore +
    propertyQuality.weightedScore +
    risks.weightedScore;

  const weightedFitScore = Math.min(100, Math.max(0, Math.round(rawWeightedScore)));

  // 4. Missing Information & Confidence Assessment
  const missingInformation = computePropertyMissingInformation(property);
  const confidence = computePropertyConfidence(property, missingInformation.length);

  // Never present a score as certain when confidence is low
  const isCertain = confidence.level !== "low";

  // Fit rating mapping
  let fitRating: "strong" | "partial" | "weak" | "insufficient_evidence" = "partial";
  if (!isCertain || confidence.level === "low" || missingInformation.length >= 4) {
    fitRating = "insufficient_evidence";
  } else if (weightedFitScore >= 75) {
    fitRating = "strong";
  } else if (weightedFitScore >= 52) {
    fitRating = "partial";
  } else {
    fitRating = "weak";
  }

  // 5. Select top 3 pros and top 3 cons
  const { topPros, topCons } = selectTopProsAndCons(
    { suitability, priceAffordability, locationDailyLife, propertyQuality, risks },
    missingInformation
  );

  // 6. Plain-language reason for ranking
  const topPriorityId = profile.ranked_priorities?.[0] || "price";
  const priorityLabels: Record<string, string> = {
    price: "السعر والقيمة المالية",
    location: "الموقع وسهولة الوصول",
    quality: "جودة البناء والتشطيب",
    space: "المساحة والاتساع الداخلي",
    quiet_privacy: "الهدوء والخصوصية",
    resale_value: "القيمة الاستثمارية وإعادة البيع",
    services_nearby: "قرب الخدمات والمدارس",
  };

  const topPriorityLabel = priorityLabels[topPriorityId] || "أولوياتك المحددة";

  let rankingReasonAr = "";
  if (fitRating === "strong") {
    rankingReasonAr = `يحقق ملاءمة عالية (${weightedFitScore}%) لتطابقه مع أولويتك الأولى (${topPriorityLabel}) مع التوازن في بقية أبعاد التقييم.`;
  } else if (fitRating === "partial") {
    rankingReasonAr = `ملاءمة مقبولة (${weightedFitScore}%) مع وجود تباين في بعض الجوانب مثل (${topCons[0]}) التي تستوجب المفاضلة.`;
  } else if (fitRating === "weak") {
    rankingReasonAr = `ملاءمة منخفضة (${weightedFitScore}%) لوجود فوارق جوهرية عن متطلباتك، خاصة فيما يخص (${topCons[0]}).`;
  } else {
    rankingReasonAr = `التقييم استرشادي مبدئي لنقص بيانات أساسية، ويلزم استكمال فحص (${missingInformation[0] || "المواصفات"}) قبل الحسم.`;
  }

  const propertyTitle = property.title?.trim() || `شقة حي ${property.district || "السكنية"}`;
  const district = property.district?.trim() || "الرياض";

  return {
    propertyId: property.id,
    propertyTitle,
    district,
    dimensions: {
      suitability,
      priceAffordability,
      locationDailyLife,
      propertyQuality,
      risks,
    },
    dimensionWeights: weights,
    weightedFitScore,
    fitRating,
    topPros,
    topCons,
    rankingReasonAr,
    missingInformation,
    confidence,
    isCertain,
  };
}

/**
 * Pure case-level evaluation function comparing multiple candidate properties.
 * Orders properties by fit score, handles ties, outputs overall confidence and missing items.
 */
export function evaluateCaseFit(
  rawProfile: BuyerProfile | null | undefined,
  properties: PropertyDataInput[]
): CaseFitEvaluation {
  const profile = rawProfile ?? DEFAULT_BUYER_PROFILE;
  const evaluatedProps = properties.map((prop) => evaluatePropertyFit(profile, prop));

  // Sort properties by:
  // 1. Certainty (certain options first)
  // 2. Weighted fit score descending
  // 3. Lowest risk / highest safety
  const rankedProperties = [...evaluatedProps].sort((a, b) => {
    if (a.isCertain !== b.isCertain) {
      return a.isCertain ? -1 : 1;
    }
    if (b.weightedFitScore !== a.weightedFitScore) {
      return b.weightedFitScore - a.weightedFitScore;
    }
    return b.dimensions.risks.score - a.dimensions.risks.score;
  });

  // Aggregate missing information across all candidate properties
  const missingSet = new Set<string>();
  for (const p of evaluatedProps) {
    for (const m of p.missingInformation) {
      missingSet.add(m);
    }
  }
  const caseMissing = Array.from(missingSet);

  // Overall case confidence
  const lowCount = evaluatedProps.filter((p) => p.confidence.level === "low").length;
  const highCount = evaluatedProps.filter((p) => p.confidence.level === "high").length;

  let overallConfidence: ConfidenceAssessment;
  if (lowCount > 0 && lowCount >= evaluatedProps.length / 2) {
    overallConfidence = {
      level: "low",
      score: 40,
      reasonAr: "أغلب العقارات المرشحة ينقصها بيانات أساسية أو صكوك مكتملة، مما يجعل المقارنة تقديرية أولية.",
    };
  } else if (highCount >= evaluatedProps.length / 2) {
    overallConfidence = {
      level: "high",
      score: 85,
      reasonAr: "بيانات العقارات مكتملة بدرجة كافية للمفاضلة وترتيب الأفضلية الاستشارية بثقة عالية.",
    };
  } else {
    overallConfidence = {
      level: "medium",
      score: 65,
      reasonAr: "تتوفر بيانات كافية للمقارنة مع وجود بنود إرشادية تستوجب التحقق أثناء الزيارة الميدانية.",
    };
  }

  // Plain Arabic summary
  const bestOption = rankedProperties[0];
  let summaryAr = "";
  if (bestOption) {
    summaryAr = `استناداً إلى ملفك وتفضيلاتك المحددة، يُظهر العقار (${bestOption.propertyTitle}) أعلى نسبة ملاءمة لاحتياجاتك بنتيجة (${bestOption.weightedFitScore}%)؛ بفضل ${bestOption.topPros[0]}. يليه خيارات أخرى تتطلب موازنة بين السعر والموقع.`;
  } else {
    summaryAr = "لم يتم تسجيل عقارات مرشحة كافية للمقارنة الاستشارية.";
  }

  return {
    properties: evaluatedProps,
    rankedProperties,
    missingInformation: caseMissing,
    confidence: overallConfidence,
    summaryAr,
  };
}

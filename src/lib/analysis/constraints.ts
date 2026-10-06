import type { ResolveFactsResult } from "@/lib/evidence/resolve";
import type { Database } from "@/types/database";

export type RequirementsRow = Database["public"]["Tables"]["requirements"]["Row"];

export type ConstraintStatus = "pass" | "fail" | "unknown";

export interface ConstraintResult {
  key: string;
  labelAr: string;
  result: ConstraintStatus;
  detailAr: string;
}

export function pricePerSqm(resolved: ResolveFactsResult): number | null {
  if (
    resolved.fields.listing_price_sar.status === "known" &&
    resolved.fields.area_sqm.status === "known"
  ) {
    const price = Number(resolved.fields.listing_price_sar.value);
    const area = Number(resolved.fields.area_sqm.value);
    if (!isNaN(price) && !isNaN(area) && price > 0 && area > 0) {
      return Math.round((price / area) * 100) / 100;
    }
  }
  return null;
}

export function evaluateConstraints(
  requirements: RequirementsRow,
  resolved: ResolveFactsResult
): ConstraintResult[] {
  const results: ConstraintResult[] = [];

  // 1. Budget check
  const priceField = resolved.fields.listing_price_sar;
  const maxBudget = requirements.max_budget_sar;

  if (priceField.status === "conflicting") {
    results.push({
      key: "budget",
      labelAr: "ضمن الميزانية",
      result: "unknown",
      detailAr: "يوجد تعارض في سعر العرض يتطلب الاختيار أو التصحيح",
    });
  } else if (priceField.status === "unknown") {
    results.push({
      key: "budget",
      labelAr: "ضمن الميزانية",
      result: "unknown",
      detailAr: "سعر العرض غير معروف في الإعلان",
    });
  } else {
    const price = Number(priceField.value);
    if (price <= maxBudget) {
      results.push({
        key: "budget",
        labelAr: "ضمن الميزانية",
        result: "pass",
        detailAr: `السعر (${price.toLocaleString()} ر.س) ضمن الميزانية المحددة (${maxBudget.toLocaleString()} ر.س)`,
      });
    } else {
      results.push({
        key: "budget",
        labelAr: "ضمن الميزانية",
        result: "fail",
        detailAr: `السعر (${price.toLocaleString()} ر.س) يتجاوز الميزانية المحددة (${maxBudget.toLocaleString()} ر.س)`,
      });
    }
  }

  // 2. Min Bedrooms check
  const bedField = resolved.fields.bedrooms;
  const minBedrooms = requirements.min_bedrooms;

  if (bedField.status === "conflicting") {
    results.push({
      key: "bedrooms",
      labelAr: "غرف النوم",
      result: "unknown",
      detailAr: "يوجد تعارض في عدد غرف النوم",
    });
  } else if (bedField.status === "unknown") {
    results.push({
      key: "bedrooms",
      labelAr: "غرف النوم",
      result: "unknown",
      detailAr: "عدد غرف النوم غير معروف في الإعلان",
    });
  } else {
    const beds = Number(bedField.value);
    if (beds >= minBedrooms) {
      results.push({
        key: "bedrooms",
        labelAr: "غرف النوم",
        result: "pass",
        detailAr: `يتوفر ${beds} غرف نوم (المطلوب ${minBedrooms} كحد أدنى)`,
      });
    } else {
      results.push({
        key: "bedrooms",
        labelAr: "غرف النوم",
        result: "fail",
        detailAr: `يتوفر ${beds} غرف نوم وهو أقل من المطلوب (${minBedrooms})`,
      });
    }
  }

  // 3. Min Area Sqm check (only if set in requirements)
  if (
    requirements.min_area_sqm !== null &&
    requirements.min_area_sqm !== undefined &&
    Number(requirements.min_area_sqm) > 0
  ) {
    const minArea = Number(requirements.min_area_sqm);
    const areaField = resolved.fields.area_sqm;

    if (areaField.status === "conflicting") {
      results.push({
        key: "min_area",
        labelAr: "الحد الأدنى للمساحة",
        result: "unknown",
        detailAr: "يوجد تعارض في المساحة",
      });
    } else if (areaField.status === "unknown") {
      results.push({
        key: "min_area",
        labelAr: "الحد الأدنى للمساحة",
        result: "unknown",
        detailAr: "المساحة غير معروفة في الإعلان",
      });
    } else {
      const area = Number(areaField.value);
      if (area >= minArea) {
        results.push({
          key: "min_area",
          labelAr: "الحد الأدنى للمساحة",
          result: "pass",
          detailAr: `المساحة ${area} م² (المطلوب ${minArea} م² كحد أدنى)`,
        });
      } else {
        results.push({
          key: "min_area",
          labelAr: "الحد الأدنى للمساحة",
          result: "fail",
          detailAr: `المساحة ${area} م² وهي أقل من المطلوب (${minArea} م²)`,
        });
      }
    }
  }

  // 4. Hard Constraints
  if (requirements.hard_constraints && Array.isArray(requirements.hard_constraints)) {
    const constraints = requirements.hard_constraints as Array<{
      key: string;
      label?: string;
      value?: unknown;
    }>;

    for (const c of constraints) {
      if (!c || !c.key) continue;

      if (c.key === "elevator_required") {
        const elevField = resolved.fields.elevator;
        const floorField = resolved.fields.floor_no;
        const label = c.label || "وجود مصعد";

        if (elevField.status === "conflicting" || floorField.status === "conflicting") {
          results.push({
            key: "elevator_required",
            labelAr: label,
            result: "unknown",
            detailAr: "يوجد تعارض في بيانات المصعد أو رقم الدور",
          });
        } else if (elevField.status === "known" && Boolean(elevField.value) === true) {
          results.push({
            key: "elevator_required",
            labelAr: label,
            result: "pass",
            detailAr: "يتوفر مصعد في المبنى",
          });
        } else if (elevField.status === "known" && Boolean(elevField.value) === false) {
          if (floorField.status === "known") {
            const floor = Number(floorField.value);
            if (floor >= 2) {
              results.push({
                key: "elevator_required",
                labelAr: label,
                result: "fail",
                detailAr: `الشقة بالدور ${floor} ولا يتوفر مصعد في المبنى`,
              });
            } else {
              results.push({
                key: "elevator_required",
                labelAr: label,
                result: "pass",
                detailAr: `الشقة بالدور ${floor} ولا يتطلب مصعدًا بشكل حرج`,
              });
            }
          } else {
            results.push({
              key: "elevator_required",
              labelAr: label,
              result: "unknown",
              detailAr: "لا يتوفر مصعد ولكن رقم الدور غير معروف للتحقق",
            });
          }
        } else {
          // elevField is unknown
          if (floorField.status === "known" && Number(floorField.value) < 2) {
            results.push({
              key: "elevator_required",
              labelAr: label,
              result: "pass",
              detailAr: `الشقة بالدور ${floorField.value} ولا يتطلب مصعدًا بشكل حرج`,
            });
          } else {
            results.push({
              key: "elevator_required",
              labelAr: label,
              result: "unknown",
              detailAr: "توفر المصعد غير معروف في إعلان العقار",
            });
          }
        }
      } else if (c.key === "private_parking") {
        const parkField = resolved.fields.private_parking;
        const label = c.label || "موقف سيارة خاص";

        if (parkField.status === "conflicting") {
          results.push({
            key: "private_parking",
            labelAr: label,
            result: "unknown",
            detailAr: "يوجد تعارض في بيانات الموقف الخاص",
          });
        } else if (parkField.status === "unknown") {
          results.push({
            key: "private_parking",
            labelAr: label,
            result: "unknown",
            detailAr: "توفر الموقف الخاص غير مؤكد في الإعلان",
          });
        } else {
          const hasParking = Boolean(parkField.value);
          if (hasParking) {
            results.push({
              key: "private_parking",
              labelAr: label,
              result: "pass",
              detailAr: "يتوفر موقف خاص للعقار",
            });
          } else {
            results.push({
              key: "private_parking",
              labelAr: label,
              result: "fail",
              detailAr: "لا يتوفر موقف سيارة خاص للعقار",
            });
          }
        }
      } else if (c.key === "max_floor") {
        const floorField = resolved.fields.floor_no;
        const maxFloor = Number(c.value);
        const label = c.label || `أقصى دور (${maxFloor})`;

        if (floorField.status === "conflicting") {
          results.push({
            key: "max_floor",
            labelAr: label,
            result: "unknown",
            detailAr: "يوجد تعارض في رقم الدور",
          });
        } else if (floorField.status === "unknown") {
          results.push({
            key: "max_floor",
            labelAr: label,
            result: "unknown",
            detailAr: "رقم الدور غير معروف في الإعلان",
          });
        } else {
          const floor = Number(floorField.value);
          if (floor <= maxFloor) {
            results.push({
              key: "max_floor",
              labelAr: label,
              result: "pass",
              detailAr: `الدور ${floor} (المسموح به حتى الدور ${maxFloor})`,
            });
          } else {
            results.push({
              key: "max_floor",
              labelAr: label,
              result: "fail",
              detailAr: `الدور ${floor} يتجاوز الحد الأقصى المطلوب (الدور ${maxFloor})`,
            });
          }
        }
      } else if (c.key === "new_building_only") {
        const ageField = resolved.fields.property_age_years;
        const label = c.label || "بناء حديث فقط";

        if (ageField.status === "conflicting") {
          results.push({
            key: "new_building_only",
            labelAr: label,
            result: "unknown",
            detailAr: "يوجد تعارض في عمر العقار",
          });
        } else if (ageField.status === "unknown") {
          results.push({
            key: "new_building_only",
            labelAr: label,
            result: "unknown",
            detailAr: "عمر العقار غير محدد في الإعلان",
          });
        } else {
          const age = Number(ageField.value);
          if (age === 0) {
            results.push({
              key: "new_building_only",
              labelAr: label,
              result: "pass",
              detailAr: "عقار جديد / بناء حديث (عمره 0 سنة)",
            });
          } else {
            results.push({
              key: "new_building_only",
              labelAr: label,
              result: "fail",
              detailAr: `عمر العقار ${age} سنة (المطلوب بناء جديد 0 سنة)`,
            });
          }
        }
      } else if (c.key === "custom") {
        results.push({
          key: "custom",
          labelAr: c.label || "شرط خاص",
          result: "unknown",
          detailAr: "يتطلب تحققًا يدويًا",
        });
      }
    }
  }

  return results;
}

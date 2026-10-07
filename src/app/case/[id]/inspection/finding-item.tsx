"use client";

import React, { useState, useTransition, useEffect, useRef } from "react";
import {
  saveFindingAction,
  type FindingResult,
  type InspectionItemRow,
} from "@/actions/inspection";
import {
  PRIORITY_LABELS_AR,
  TRIGGER_REASON_LABELS_AR,
  ASSESSMENT_TYPE_LABELS_AR,
  type InspectionPriority,
  type InspectionTriggerReason,
} from "@/lib/inspection/generate-items";
import { cn } from "@/lib/utils";

export interface FindingItemProps {
  caseId: string;
  propertyId: string;
  item: InspectionItemRow;
  initialFinding?: {
    result: FindingResult;
    note?: string | null;
  } | null;
  onFindingChange?: (
    itemId: string,
    result: FindingResult,
    note: string | null
  ) => void;
}

export function FindingItem({
  caseId,
  propertyId,
  item,
  initialFinding,
  onFindingChange,
}: FindingItemProps) {
  const [result, setResult] = useState<FindingResult | null>(
    initialFinding?.result ?? null
  );
  const [note, setNote] = useState<string>(initialFinding?.note ?? "");
  const [syncStatus, setSyncStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle"
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const noteTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef<{ result: FindingResult | null; note: string }>({
    result: initialFinding?.result ?? null,
    note: initialFinding?.note ?? "",
  });

  // Sync server action call
  const triggerSave = (newResult: FindingResult, newNote: string) => {
    setSyncStatus("saving");
    setErrorMessage(null);

    startTransition(async () => {
      try {
        const res = await saveFindingAction(
          caseId,
          propertyId,
          item.id,
          newResult,
          newNote
        );

        if (res.success) {
          setSyncStatus("saved");
          lastSavedRef.current = { result: newResult, note: newNote };
          setTimeout(() => {
            setSyncStatus("idle");
          }, 2000);
        } else {
          setSyncStatus("error");
          setErrorMessage(res.error || "تعذر حفظ النتيجة");
        }
      } catch (err: unknown) {
        setSyncStatus("error");
        setErrorMessage(
          err instanceof Error ? err.message : "حدث خطأ أثناء حفظ الفحص"
        );
      }
    });
  };

  const handleResultSelect = (newResult: FindingResult) => {
    // Instant optimistic client update
    setResult(newResult);
    onFindingChange?.(item.id, newResult, note);

    triggerSave(newResult, note);
  };

  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value.slice(0, 300);
    setNote(val);
    if (result) {
      onFindingChange?.(item.id, result, val);
    }

    // Debounce save for note typing
    if (noteTimeoutRef.current) {
      clearTimeout(noteTimeoutRef.current);
    }

    if (result) {
      noteTimeoutRef.current = setTimeout(() => {
        if (val !== lastSavedRef.current.note) {
          triggerSave(result, val);
        }
      }, 700);
    }
  };

  const handleNoteBlur = () => {
    if (noteTimeoutRef.current) {
      clearTimeout(noteTimeoutRef.current);
    }
    if (result && (note !== lastSavedRef.current.note || result !== lastSavedRef.current.result)) {
      triggerSave(result, note);
    }
  };

  useEffect(() => {
    return () => {
      if (noteTimeoutRef.current) {
        clearTimeout(noteTimeoutRef.current);
      }
    };
  }, []);

  const priority = item.priority as InspectionPriority;
  const priorityConfig = PRIORITY_LABELS_AR[priority] || PRIORITY_LABELS_AR.medium;
  const triggerReason = item.trigger_reason as InspectionTriggerReason;
  const triggerLabel = TRIGGER_REASON_LABELS_AR[triggerReason] || "تحقق ميداني";

  const showNoteInput = result === "good" || result === "problem";

  return (
    <article
      className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 shadow-sm hover:border-gray-300 transition-colors space-y-4"
      aria-labelledby={`item-q-${item.id}`}
    >
      {/* Top Meta: Priority & Trigger Reason */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "px-2.5 py-0.5 rounded-full font-bold border",
              priorityConfig.badgeClasses
            )}
          >
            {priorityConfig.label}
          </span>

          <span className="px-2 py-0.5 rounded-md bg-gray-50 text-gray-500 border border-gray-100 font-medium">
            {triggerLabel}
          </span>
        </div>

        {/* Affected Assessment Axes */}
        {item.affected_assessment_types && item.affected_assessment_types.length > 0 && (
          <div className="flex items-center gap-1 text-[11px] text-gray-500 font-medium">
            <span>يؤثر على:</span>
            <div className="flex items-center gap-1">
              {item.affected_assessment_types.map((axis) => (
                <span
                  key={axis}
                  className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold text-[10px]"
                >
                  {ASSESSMENT_TYPE_LABELS_AR[axis] || axis}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Question Text */}
      <h3
        id={`item-q-${item.id}`}
        className="text-base sm:text-lg font-bold text-gray-900 leading-snug"
      >
        {item.question_ar}
      </h3>

      {/* Why it matters box */}
      <div className="bg-amber-50/60 border border-amber-200/70 rounded-xl p-3 text-xs sm:text-sm text-gray-700 space-y-1">
        <div className="flex items-center gap-1.5 font-bold text-amber-900">
          <span aria-hidden="true">💡</span>
          <span>سبب الأهمية:</span>
        </div>
        <p className="leading-relaxed pr-5">{item.why_it_matters_ar}</p>
      </div>

      {/* How to check box */}
      <div className="bg-blue-50/50 border border-blue-200/70 rounded-xl p-3 text-xs sm:text-sm text-gray-800 space-y-1">
        <div className="flex items-center gap-1.5 font-bold text-blue-900">
          <span aria-hidden="true">🔍</span>
          <span>طريقة الفحص الميداني:</span>
        </div>
        <p className="leading-relaxed pr-5 font-medium text-slate-800">
          {item.how_to_check_ar}
        </p>
      </div>

      {/* Interactive Finding Buttons (3 Segmented Radios) */}
      <div className="pt-2 border-t border-gray-100 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-gray-600 block">
            تسجيل نتيجة الفحص:
          </span>

          {/* Sync indicator */}
          <div className="text-[11px] font-semibold flex items-center gap-1.5">
            {isPending || syncStatus === "saving" ? (
              <span className="text-blue-600 flex items-center gap-1 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                <span>جاري الحفظ...</span>
              </span>
            ) : syncStatus === "saved" ? (
              <span className="text-emerald-600 flex items-center gap-1 font-bold">
                <span>✓</span>
                <span>تم الحفظ</span>
              </span>
            ) : syncStatus === "error" ? (
              <span className="text-rose-600 flex items-center gap-1 font-bold">
                <span>⚠</span>
                <span>{errorMessage || "فشل الحفظ"}</span>
              </span>
            ) : null}
          </div>
        </div>

        {/* 3 Segmented Radio Buttons */}
        <div
          role="radiogroup"
          aria-label={`نتيجة فحص: ${item.question_ar}`}
          className="grid grid-cols-3 gap-2"
        >
          {/* Button 1: good (سليم / مطابق) */}
          <button
            type="button"
            role="radio"
            aria-checked={result === "good"}
            onClick={() => handleResultSelect("good")}
            className={cn(
              "px-3 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] border",
              result === "good"
                ? "bg-emerald-600 text-white border-emerald-600 shadow-sm ring-2 ring-emerald-200"
                : "bg-white text-gray-700 hover:bg-emerald-50/40 hover:text-emerald-700 border-gray-200"
            )}
          >
            <span aria-hidden="true">✓</span>
            <span>سليم / مطابق</span>
          </button>

          {/* Button 2: problem (مشكلة / مخالف) */}
          <button
            type="button"
            role="radio"
            aria-checked={result === "problem"}
            onClick={() => handleResultSelect("problem")}
            className={cn(
              "px-3 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] border",
              result === "problem"
                ? "bg-rose-600 text-white border-rose-600 shadow-sm ring-2 ring-rose-200"
                : "bg-white text-gray-700 hover:bg-rose-50/40 hover:text-rose-700 border-gray-200"
            )}
          >
            <span aria-hidden="true">⚠</span>
            <span>مشكلة / مخالف</span>
          </button>

          {/* Button 3: not_checked (لم أتحقق) */}
          <button
            type="button"
            role="radio"
            aria-checked={result === "not_checked"}
            onClick={() => handleResultSelect("not_checked")}
            className={cn(
              "px-3 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] border",
              result === "not_checked"
                ? "bg-slate-700 text-white border-slate-700 shadow-sm ring-2 ring-slate-200"
                : "bg-white text-gray-700 hover:bg-slate-50 border-gray-200"
            )}
          >
            <span aria-hidden="true">—</span>
            <span>لم أتحقق</span>
          </button>
        </div>

        {/* Auto-expanded optional note input when good or problem is selected */}
        {showNoteInput && (
          <div className="pt-2 space-y-1.5 animate-fadeIn">
            <div className="flex items-center justify-between text-xs">
              <label
                htmlFor={`note-${item.id}`}
                className="font-bold text-gray-600 flex items-center gap-1"
              >
                <span>ملاحظات إضافية (اختياري)</span>
                {result === "problem" && (
                  <span className="text-rose-600 text-[11px]">
                    - يُفضل توثيق تفاصيل المشكلة
                  </span>
                )}
              </label>
              <span
                className={cn(
                  "text-[10px] font-medium",
                  note.length >= 280 ? "text-amber-600 font-bold" : "text-gray-400"
                )}
              >
                {note.length}/300
              </span>
            </div>

            <textarea
              id={`note-${item.id}`}
              value={note}
              onChange={handleNoteChange}
              onBlur={handleNoteBlur}
              rows={2}
              maxLength={300}
              placeholder="دوّن تفاصيل أو شواهد رأيتها أثناء الزيارة..."
              className="w-full text-xs sm:text-sm p-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-gray-800 placeholder-gray-400 bg-gray-50/50 resize-none transition-colors"
            />
          </div>
        )}
      </div>
    </article>
  );
}

"use client";

import React, { useState, useTransition, useEffect, useRef } from "react";
import { Lightbulb, Search } from "lucide-react";
import {
  saveFindingAction,
  type FindingResult,
  type InspectionItemRow,
} from "@/actions/inspection";
import {
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

      if (noteTimeoutRef.current) {
        clearTimeout(noteTimeoutRef.current);
      }

      noteTimeoutRef.current = setTimeout(() => {
        triggerSave(result, val);
      }, 800);
    }
  };

  const handleNoteBlur = () => {
    if (result && note !== lastSavedRef.current.note) {
      if (noteTimeoutRef.current) {
        clearTimeout(noteTimeoutRef.current);
      }
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
  const triggerReason = item.trigger_reason as InspectionTriggerReason;
  const triggerLabel = TRIGGER_REASON_LABELS_AR[triggerReason] || "تحقق ميداني";

  const showNoteInput = result === "good" || result === "problem";

  return (
    <article
      className="bg-[var(--paper)] rounded-[28px] border border-[var(--mist)] p-5 sm:p-6 shadow-[0_20px_60px_rgba(15,26,43,0.04)] space-y-4"
      aria-labelledby={`item-q-${item.id}`}
    >
      {/* Top Meta: Priority & Trigger Reason */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "px-3 py-0.5 rounded-full font-medium text-xs border",
              priority === "high"
                ? "bg-[#FDF1F0] text-[#A62626] border-[#F6CBC8]"
                : priority === "medium"
                ? "bg-[#FFF9EC] text-[#9A6700] border-[#F9E2AF]"
                : "bg-[var(--cream)] text-[var(--dusty-blue)] border-[var(--mist)]"
            )}
          >
            {priority === "high" ? "أولوية مرتفعة" : priority === "medium" ? "أولوية متوسطة" : "أولوية منخفضة"}
          </span>

          <span className="px-2.5 py-0.5 rounded-full bg-[var(--cream)] text-[var(--dusty-blue)] border border-[var(--mist)] text-[11px] font-medium">
            {triggerLabel}
          </span>
        </div>

        {/* Affected Assessment Axes */}
        {item.affected_assessment_types && item.affected_assessment_types.length > 0 && (
          <div className="flex items-center gap-1.5 text-[11px] text-[var(--dusty-blue)] font-medium">
            <span>يؤثر على:</span>
            <div className="flex items-center gap-1">
              {item.affected_assessment_types.map((axis) => (
                <span
                  key={axis}
                  className="px-2 py-0.5 rounded-md bg-[var(--cream)] text-[var(--navy)] font-medium text-[10px] border border-[var(--mist)]"
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
        className="text-base sm:text-lg font-bold font-display text-[var(--navy)] leading-snug"
      >
        {item.question_ar}
      </h3>

      {/* Why it matters box */}
      <div className="bg-[var(--cream)] border border-[var(--mist)] rounded-2xl p-3.5 text-xs text-[var(--navy)] space-y-1">
        <div className="flex items-center gap-1.5 font-bold text-[#9A6700]">
          <Lightbulb className="w-3.5 h-3.5 text-[#9A6700]" />
          <span>سبب الأهمية:</span>
        </div>
        <p className="leading-relaxed pr-5 font-normal text-[var(--dusty-blue)]">{item.why_it_matters_ar}</p>
      </div>

      {/* How to check box */}
      <div className="bg-[var(--cream)] border border-[var(--mist)] rounded-2xl p-3.5 text-xs text-[var(--navy)] space-y-1">
        <div className="flex items-center gap-1.5 font-bold text-[var(--navy)]">
          <Search className="w-3.5 h-3.5 text-[var(--navy)]" />
          <span>طريقة الفحص الميداني:</span>
        </div>
        <p className="leading-relaxed pr-5 font-medium text-[var(--dusty-blue)]">
          {item.how_to_check_ar}
        </p>
      </div>

      {/* Interactive Finding Buttons (3 Segmented Radios) */}
      <div className="pt-3 border-t border-[var(--mist)] space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-[var(--navy)] block">
            تسجيل نتيجة الفحص:
          </span>

          {/* Sync indicator */}
          <div className="text-[11px] font-medium flex items-center gap-1.5">
            {isPending || syncStatus === "saving" ? (
              <span className="text-[var(--dusty-blue)] flex items-center gap-1 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--navy)]" />
                <span>جاري الحفظ...</span>
              </span>
            ) : syncStatus === "saved" ? (
              <span className="text-[#1E6B43] flex items-center gap-1 font-medium">
                <span>✓</span>
                <span>تم الحفظ</span>
              </span>
            ) : syncStatus === "error" ? (
              <span className="text-[#A62626] flex items-center gap-1 font-medium">
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
          className="grid grid-cols-3 gap-2 sm:gap-2.5"
        >
          {/* Button 1: good (سليم / مطابق) */}
          <button
            type="button"
            role="radio"
            aria-checked={result === "good"}
            onClick={() => handleResultSelect("good")}
            className={cn(
              "px-3 py-3 rounded-full text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] border shadow-xs cursor-pointer",
              result === "good"
                ? "bg-[#1E6B43] text-[var(--cream)] border-[#1E6B43] shadow-sm"
                : "bg-[var(--paper)] text-[var(--navy)] hover:border-[#1E6B43] border-[var(--mist)]"
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
              "px-3 py-3 rounded-full text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] border shadow-xs cursor-pointer",
              result === "problem"
                ? "bg-[#A62626] text-[var(--cream)] border-[#A62626] shadow-sm"
                : "bg-[var(--paper)] text-[var(--navy)] hover:border-[#A62626] border-[var(--mist)]"
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
              "px-3 py-3 rounded-full text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] border shadow-xs cursor-pointer",
              result === "not_checked"
                ? "bg-[var(--navy)] text-[var(--cream)] border-[var(--navy)] shadow-sm"
                : "bg-[var(--paper)] text-[var(--navy)] hover:border-[var(--navy)] border-[var(--mist)]"
            )}
          >
            <span aria-hidden="true">—</span>
            <span>لم أتحقق</span>
          </button>
        </div>

        {/* Auto-expanded optional note input when good or problem is selected */}
        {showNoteInput && (
          <div className="pt-2 space-y-2 animate-fadeIn">
            <div className="flex items-center justify-between text-xs">
              <label
                htmlFor={`note-${item.id}`}
                className="font-medium text-[var(--navy)] flex items-center gap-1.5"
              >
                <span>ملاحظات إضافية (اختياري)</span>
                {result === "problem" && (
                  <span className="text-[#A62626] text-[11px] font-medium">
                    - يُفضل توثيق تفاصيل المشكلة
                  </span>
                )}
              </label>
              <span
                className={cn(
                  "text-[10px] font-mono",
                  note.length >= 280 ? "text-[#9A6700]" : "text-[var(--dusty-blue)]"
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
              className="w-full text-xs sm:text-sm p-3.5 rounded-2xl border border-[var(--mist)] focus:border-[var(--navy)] outline-none text-[var(--navy)] placeholder:text-[var(--dusty-blue)]/60 bg-[var(--cream)] focus:bg-[var(--paper)] resize-none transition-colors"
            />
          </div>
        )}
      </div>
    </article>
  );
}

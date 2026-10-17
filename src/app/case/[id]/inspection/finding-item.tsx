"use client";

import React, { useState, useTransition, useEffect, useRef } from "react";
import {
  saveFindingAction,
  type FindingResult,
  type InspectionItemRow,
} from "@/actions/inspection";
import { type InspectionPriority } from "@/lib/inspection/generate-items";
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
  const [showHint, setShowHint] = useState(false);
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
          }, 1800);
        } else {
          setSyncStatus("error");
          setErrorMessage(res.error || "تعذر الحفظ");
        }
      } catch (err: unknown) {
        setSyncStatus("error");
        setErrorMessage(
          err instanceof Error ? err.message : "خطأ في الحفظ"
        );
      }
    });
  };

  const handleResultSelect = (newResult: FindingResult) => {
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
  const showNoteInput = result === "good" || result === "problem";

  return (
    <article
      className={cn(
        "bg-[var(--paper)] rounded-[20px] border p-4 transition-all duration-200 flex flex-col justify-between gap-3",
        result === "good"
          ? "border-[#2D6A4F]/40"
          : result === "problem"
          ? "border-[#A62626]/45"
          : "border-[var(--mist)]/80 hover:border-[var(--navy)]/30"
      )}
      aria-labelledby={`item-q-${item.id}`}
    >
      <div className="space-y-2">
        {/* Compact Row 1: Priority Tag + Question + Hint Toggle */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 min-w-0">
            <span
              className={cn(
                "px-2 py-0.5 rounded-md font-bold text-[10px] border shrink-0 mt-0.5",
                priority === "high"
                  ? "bg-[#FDF1F0] text-[#A62626] border-[#F6CBC8]"
                  : priority === "medium"
                  ? "bg-[#FFF9EC] text-[#9A6700] border-[#F9E2AF]"
                  : "bg-[var(--cream)] text-[var(--dusty-blue)] border-[var(--mist)]"
              )}
            >
              {priority === "high" ? "عاجل" : priority === "medium" ? "مهم" : "إرشادي"}
            </span>

            <h3
              id={`item-q-${item.id}`}
              className="text-sm sm:text-[15px] font-bold text-[var(--navy)] leading-snug"
            >
              {item.question_ar}
            </h3>
          </div>

          <button
            type="button"
            onClick={() => setShowHint((v) => !v)}
            aria-expanded={showHint}
            className="shrink-0 text-[11px] font-semibold text-[var(--dusty-blue)] hover:text-[var(--navy)] px-2 py-0.5 rounded-lg bg-[var(--cream)]/70 hover:bg-[var(--cream)] transition-colors"
          >
            {showHint ? "إخفاء" : "؟ كيف أفحص"}
          </button>
        </div>

        {/* Progressive Disclosure Hint Drawer (Hidden by default to prevent UI fatigue) */}
        <div
          className={cn(
            "rounded-xl bg-[var(--cream)]/70 border border-[var(--mist)]/60 p-3 text-xs space-y-1.5 text-[var(--dusty-blue)] leading-relaxed",
            showHint ? "block" : "hidden"
          )}
        >
          <p>
            <strong className="text-[var(--navy)]">طريقة الفحص: </strong>
            {item.how_to_check_ar}
          </p>
          <p>
            <strong className="text-[#9A6700]">الأهمية: </strong>
            {item.why_it_matters_ar}
          </p>
        </div>
      </div>

      {/* Compact Row 2: 3-Button Segmented Pill + Sync Status */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center gap-2">
          <div
            role="radiogroup"
            aria-label={`نتيجة فحص: ${item.question_ar}`}
            className="flex-1 grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-[var(--cream)]/70 border border-[var(--mist)]/60"
          >
            {/* 1: good */}
            <button
              type="button"
              role="radio"
              aria-label="سليم / مطابق"
              aria-checked={result === "good"}
              onClick={() => handleResultSelect("good")}
              className={cn(
                "py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer",
                result === "good"
                  ? "bg-[#2D6A4F] text-white shadow-xs"
                  : "text-[var(--navy)] hover:bg-[var(--paper)]"
              )}
            >
              <span aria-hidden="true">✓</span>
              <span>سليم</span>
            </button>

            {/* 2: problem */}
            <button
              type="button"
              role="radio"
              aria-label="مشكلة / مخالف"
              aria-checked={result === "problem"}
              onClick={() => handleResultSelect("problem")}
              className={cn(
                "py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer",
                result === "problem"
                  ? "bg-[#A62626] text-white shadow-xs"
                  : "text-[var(--navy)] hover:bg-[var(--paper)]"
              )}
            >
              <span aria-hidden="true">✕</span>
              <span>مشكلة</span>
            </button>

            {/* 3: not_checked */}
            <button
              type="button"
              role="radio"
              aria-checked={result === "not_checked"}
              onClick={() => handleResultSelect("not_checked")}
              className={cn(
                "py-1.5 px-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition-all cursor-pointer",
                result === "not_checked"
                  ? "bg-[var(--navy)] text-[var(--cream)] shadow-xs"
                  : "text-[var(--dusty-blue)] hover:text-[var(--navy)] hover:bg-[var(--paper)]"
              )}
            >
              <span>لم أتحقق</span>
            </button>
          </div>

          {/* Subtle inline sync indicator */}
          {(isPending || syncStatus !== "idle") && (
            <span className="text-[10px] font-medium shrink-0">
              {isPending || syncStatus === "saving" ? (
                <span className="text-[var(--dusty-blue)]">حفظ...</span>
              ) : syncStatus === "saved" ? (
                <span className="text-[#2D6A4F]">✓</span>
              ) : (
                <span className="text-[#A62626]" title={errorMessage || ""}>!</span>
              )}
            </span>
          )}
        </div>

        {/* Slim Note Input (Only when good or problem is selected) */}
        {showNoteInput && (
          <div className="space-y-1 pt-0.5">
            <div className="flex items-center justify-between text-[11px] text-[var(--dusty-blue)]">
              <label htmlFor={`note-${item.id}`} className="font-medium">
                ملاحظات إضافية (اختياري)
              </label>
              <span className="tabular-nums text-[10px]">{note.length}/300</span>
            </div>
            <textarea
              id={`note-${item.id}`}
              value={note}
              onChange={handleNoteChange}
              onBlur={handleNoteBlur}
              rows={1}
              maxLength={300}
              placeholder={
                result === "problem"
                  ? "صف المشكلة باختصار (مثال: تسريب، ضعف ضغط المياه)..."
                  : "أضف ملاحظة سريعة..."
              }
              className="w-full text-xs py-2 px-3 rounded-xl border border-[var(--mist)] focus:border-[var(--navy)] outline-none text-[var(--navy)] placeholder:text-[var(--dusty-blue)]/60 bg-[var(--cream)]/50 focus:bg-[var(--paper)] resize-none transition-colors"
            />
          </div>
        )}
      </div>
    </article>
  );
}

"use client";

import { Trash2 } from "lucide-react";
import { softDeleteCaseAction } from "@/actions/cases";

interface DeleteCaseButtonProps {
  caseId: string;
}

export function DeleteCaseButton({ caseId }: DeleteCaseButtonProps) {
  return (
    <form
      action={softDeleteCaseAction.bind(null, caseId, undefined)}
      onSubmit={(event) => {
        if (!window.confirm("هل أنت متأكد من حذف هذه الحالة؟ لن تتمكن من الوصول إليها بعد الحذف.")) {
          event.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
        title="حذف الحالة"
      >
        <Trash2 className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">حذف الحالة</span>
      </button>
    </form>
  );
}

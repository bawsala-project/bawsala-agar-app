"use client";

import { softDeleteCaseAction } from "@/actions/cases";
import { Button } from "@/components/ui/button";

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
      <Button type="submit" variant="ghost" className="text-xs text-red-700 hover:bg-red-50">
        حذف الحالة
      </Button>
    </form>
  );
}

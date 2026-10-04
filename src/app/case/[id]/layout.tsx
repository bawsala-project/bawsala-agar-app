import { requireCase } from "@/lib/auth";
import { StepIndicator } from "./step-indicator";

export default async function CaseLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { id: string };
}) {
  await requireCase(params.id);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-gray-200 bg-white">
        <StepIndicator caseId={params.id} />
      </header>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}

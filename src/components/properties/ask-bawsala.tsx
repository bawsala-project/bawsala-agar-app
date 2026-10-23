"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Send, User, X } from "lucide-react";
import { askFollowupQuestion } from "@/actions/followup";
import { BawsalaCompass } from "@/components/brand/bawsala-compass";

interface Turn {
  q: string;
  a?: string;
  error?: string;
}

const SUGGESTIONS = [
  "لو زادت ميزانيتي 50 ألف، هل يتغير الترتيب؟",
  "أيهما أنسب لأسرة فيها أطفال صغار؟",
  "ما أهم شيء أتحقق منه في المعاينة؟",
];

export function AskBawsala({ caseId }: { caseId: string }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [question, setQuestion] = useState("");
  const [pending, startTransition] = useTransition();

  // Light-dismiss fallback for browsers without <dialog closedby> (e.g. Safari)
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || "closedBy" in HTMLDialogElement.prototype) return;
    const onClick = (event: MouseEvent) => {
      if (event.target !== dialog) return;
      const r = dialog.getBoundingClientRect();
      const inside =
        r.top <= event.clientY && event.clientY <= r.bottom &&
        r.left <= event.clientX && event.clientX <= r.right;
      if (!inside) dialog.close();
    };
    dialog.addEventListener("click", onClick);
    return () => dialog.removeEventListener("click", onClick);
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [turns]);

  const open = () => {
    dialogRef.current?.showModal();
    inputRef.current?.focus();
  };

  const submit = (text: string) => {
    const q = text.trim();
    if (q.length < 3 || pending) return;
    setQuestion("");
    const idx = turns.length;
    setTurns((t) => [...t, { q }]);
    startTransition(async () => {
      const res = await askFollowupQuestion(caseId, q);
      setTurns((t) => t.map((turn, i) => (i === idx ? { ...turn, a: res.answer, error: res.error } : turn)));
    });
  };

  return (
    <>
      {/* Integrated Inline Prompt Bar inside DecisionFollowupQA */}
      <div className="pt-2 border-t border-[var(--mist)]/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[var(--navy)] text-[var(--cream)] flex items-center justify-center shrink-0">
            <BawsalaCompass size={20} />
          </div>
          <div>
            <p className="text-xs sm:text-sm font-bold text-[var(--navy)]">
              هل لديك سؤال محدد لم يُذكر أعلاه؟
            </p>
            <p className="text-[11px] text-[var(--dusty-blue)]">
              اسأل مساعد بوصلة الذكي مباشرة حول شقق هذه الحالة وميزانيتك
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={open}
          className="h-10 px-4 rounded-full bg-[var(--navy)] hover:bg-[var(--midnight)] text-[var(--cream)] text-xs font-bold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer shrink-0"
        >
          <span>اسأل بوصلة العقار (AI)</span>
        </button>
      </div>

      {/* Floating Action Button — shown only on wide desktop (xl+) where outer margin exists */}
      <button
        type="button"
        onClick={open}
        aria-haspopup="dialog"
        aria-label="اسأل بوصلة العقار — مساعد الذكاء الاصطناعي"
        className="bawsala-ai-fab isolate hidden xl:flex fixed bottom-6 left-6 z-[60] w-14 h-14 rounded-full bg-[var(--navy)] text-[var(--cream)] items-center justify-center cursor-pointer hover:scale-105 active:scale-95 transition-transform"
      >
        <BawsalaCompass size={28} />
        <span className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full bg-[var(--cream)] text-[var(--navy)] text-[10px] font-black border border-[var(--mist)] shadow-sm">
          AI
        </span>
      </button>

      <dialog
        ref={dialogRef}
        {...({ closedby: "any" } as Record<string, string>)}
        aria-labelledby="ask-bawsala-title"
        dir="rtl"
        className="bawsala-sheet shadow-[0_-20px_60px_rgba(15,26,43,0.25)]"
      >
        <div className="flex flex-col max-h-[85dvh]">
          {/* Grabber + header */}
          <div className="pt-2.5 pb-3 px-5 border-b border-[var(--mist)] shrink-0">
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-[var(--mist)]" aria-hidden="true" />
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[var(--navy)] text-[var(--cream)] flex items-center justify-center">
                  <BawsalaCompass size={24} />
                </div>
                <div>
                  <h2 id="ask-bawsala-title" className="text-base font-display font-bold text-[var(--navy)]">
                    اسأل بوصلة العقار
                  </h2>
                  <p className="text-[11px] text-[var(--dusty-blue)]">
                    إجابات مبنية فقط على احتياجاتك وشقق هذه الحالة · مجاناً
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => dialogRef.current?.close()}
                aria-label="إغلاق"
                className="w-9 h-9 rounded-full bg-[var(--cream)] border border-[var(--mist)] flex items-center justify-center text-[var(--navy)] hover:border-[var(--navy)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Conversation */}
          <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4 space-y-4 min-h-[200px]">
            {turns.length === 0 ? (
              <div className="space-y-3">
                <p className="text-sm text-[var(--dusty-blue)] leading-relaxed">
                  اسأل أي سؤال عن قرارك: الملاءمة، السعر، الميزانية، الموقع، أو ما يجب التحقق منه. إذا كانت المعلومة غير متوفرة سنخبرك بصراحة.
                </p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => submit(s)}
                      className="px-3 py-1.5 rounded-full bg-[var(--cream)] border border-[var(--mist)] text-xs text-[var(--navy)] hover:border-[var(--navy)] transition-colors cursor-pointer"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <ol className="space-y-4" aria-live="polite">
                {turns.map((t, i) => (
                  <li key={i} className="space-y-2">
                    <div className="flex items-start gap-2 justify-start">
                      <User className="w-4 h-4 mt-1 text-[var(--dusty-blue)] shrink-0" />
                      <p className="px-3 py-2 rounded-2xl bg-[var(--navy)] text-[var(--cream)] text-sm max-w-[85%]">{t.q}</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="w-6 h-6 rounded-full bg-[var(--cream)] border border-[var(--mist)] flex items-center justify-center shrink-0 text-[var(--navy)]">
                        <BawsalaCompass size={16} />
                      </span>
                      <div className="px-3 py-2 rounded-2xl bg-[var(--cream)] border border-[var(--mist)] text-sm leading-relaxed text-[var(--navy)] whitespace-pre-line max-w-[85%]">
                        {t.error ? (
                          <span className="text-[#A62626]">{t.error}</span>
                        ) : t.a ? (
                          t.a
                        ) : (
                          <span className="text-[var(--dusty-blue)] animate-pulse">جارٍ التفكير في حالتك…</span>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            )}
            <div ref={endRef} />
          </div>

          {/* Composer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit(question);
            }}
            className="shrink-0 border-t border-[var(--mist)] px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] flex items-end gap-2 bg-[var(--paper)]"
          >
            <label htmlFor="ask-bawsala-input" className="sr-only">سؤالك</label>
            <textarea
              id="ask-bawsala-input"
              ref={inputRef}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submit(question);
                }
              }}
              maxLength={500}
              rows={1}
              placeholder="اكتب سؤالك عن قرار الشراء…"
              className="flex-1 resize-none rounded-2xl border border-[var(--mist)] bg-[var(--cream)] px-3.5 py-2.5 text-sm text-[var(--navy)] placeholder:text-[var(--dusty-blue)]/70 focus:outline-none focus:border-[var(--navy)] max-h-32"
            />
            <button
              type="submit"
              disabled={pending || question.trim().length < 3}
              aria-label="إرسال"
              className="w-11 h-11 rounded-full bg-[var(--navy)] text-[var(--cream)] flex items-center justify-center hover:bg-[var(--midnight)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
            >
              <Send className="w-4 h-4 -scale-x-100" />
            </button>
          </form>
        </div>
      </dialog>
    </>
  );
}

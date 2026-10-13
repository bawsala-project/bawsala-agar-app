"use client";

import React, { useState } from "react";
import { useFormStatus } from "react-dom";
import { CheckCircle2, Info, ArrowLeft, Loader2 } from "lucide-react";
import { startCase } from "@/actions/cases";
import type { AllowedCity } from "@/lib/constants/cities";

interface ConsultationCardProps {
  allowedCities: readonly AllowedCity[];
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-slate-900 hover:bg-blue-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-xs flex items-center justify-center gap-2.5 transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer"
    >
      {pending ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-white" />
          <span>جاري إعداد الجلسة الاستشارية...</span>
        </>
      ) : (
        <>
          <span>بدء دراسة القرار العقاري</span>
          <ArrowLeft className="w-4 h-4" />
        </>
      )}
    </button>
  );
}

export function ConsultationCard({ allowedCities }: ConsultationCardProps) {
  const [selectedCity, setSelectedCity] = useState<string>(allowedCities[0] ?? "الرياض");
  const [selectedTypology, setSelectedTypology] = useState<string>("apt");
  const [selectedIntent, setSelectedIntent] = useState<string>("family");

  return (
    <div className="bg-white rounded-3xl border border-slate-200/70 shadow-sm p-8 md:p-12 space-y-10 relative overflow-hidden">
      {/* Subtle Ambient Background Light */}
      <div className="absolute -top-32 -left-32 w-72 h-72 bg-blue-50/60 rounded-full blur-3xl pointer-events-none" />

      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
            <h2 className="text-xl font-bold text-slate-900">بدء دراسة قرار استشاري جديدة</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            حدد الإطار السكني والجغرافي لتطبيق معايير التدقيق الفني المعتمدة
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 self-start sm:self-auto px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100/80 text-xs font-semibold">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          المرحلة الأولى مجانية
        </span>
      </div>

      <form action={startCase} className="space-y-8">
        {/* Hidden inputs for selected states */}
        <input type="hidden" name="city" value={selectedCity} />
        <input type="hidden" name="typology" value={selectedTypology} />
        <input type="hidden" name="purchase_intent" value={selectedIntent} />

        {/* Parameter 1: City Selector */}
        <div className="space-y-3">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            المدينة المستهدفة للشراء
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5" id="cityOptions">
            {allowedCities.map((city) => {
              const isSelected = selectedCity === city;
              return (
                <button
                  key={city}
                  type="button"
                  onClick={() => setSelectedCity(city)}
                  className={`px-4 py-3 rounded-2xl border text-xs transition-all text-center cursor-pointer ${
                    isSelected
                      ? "bg-slate-900 text-white border-slate-900 shadow-xs font-bold"
                      : "border-slate-200/80 text-slate-600 hover:border-slate-300 font-semibold bg-white"
                  }`}
                >
                  {city}
                </button>
              );
            })}
          </div>
        </div>

        {/* Parameter 2: Property Typology */}
        <div className="space-y-3">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            نوع العقار المستهدف
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3" id="typologyOptions">
            {/* Apartment */}
            <button
              type="button"
              onClick={() => setSelectedTypology("apt")}
              className={`p-4 rounded-2xl border flex items-center gap-3 transition-all text-right cursor-pointer ${
                selectedTypology === "apt"
                  ? "bg-blue-50/50 border-blue-600/40 text-blue-900 shadow-xs font-bold"
                  : "border-slate-200/80 text-slate-700 hover:border-slate-300 hover:bg-slate-50 font-medium bg-white"
              }`}
            >
              <span
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                  selectedTypology === "apt"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                <svg className="w-5 h-5 fill-none stroke-current stroke-[1.8]" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 21h18M5 21V5a2 2 0 012-2h10a2 2 0 012 2v16M9 7h1m4 0h1m-6 4h1m4 0h1m-6 4h1m4 0h1m-3 5v-3a1 1 0 011-1h2a1 1 0 011 1v3"
                  />
                </svg>
              </span>
              <div>
                <div className="text-xs">شقة تمليك</div>
                <div className="text-[11px] font-normal text-slate-500">مبنى مستقل أو مجمع مغلق</div>
              </div>
            </button>

            {/* Villa */}
            <button
              type="button"
              onClick={() => setSelectedTypology("villa")}
              className={`p-4 rounded-2xl border flex items-center gap-3 transition-all text-right cursor-pointer ${
                selectedTypology === "villa"
                  ? "bg-blue-50/50 border-blue-600/40 text-blue-900 shadow-xs font-bold"
                  : "border-slate-200/80 text-slate-700 hover:border-slate-300 hover:bg-slate-50 font-medium bg-white"
              }`}
            >
              <span
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                  selectedTypology === "villa"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                <svg className="w-5 h-5 fill-none stroke-current stroke-[1.8]" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 10.5L12 3l9 7.5V20a1.5 1.5 0 01-1.5 1.5h-15A1.5 1.5 0 013 20v-9.5z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 21v-6a1 1 0 011-1h4a1 1 0 011 1v6"
                  />
                </svg>
              </span>
              <div>
                <div className="text-xs font-bold">فيلا مستقلة / دوبلكس</div>
                <div className="text-[11px] font-normal text-slate-400">وحدات سكنية منفصلة</div>
              </div>
            </button>

            {/* Townhouse */}
            <button
              type="button"
              onClick={() => setSelectedTypology("townhouse")}
              className={`p-4 rounded-2xl border flex items-center gap-3 transition-all text-right cursor-pointer ${
                selectedTypology === "townhouse"
                  ? "bg-blue-50/50 border-blue-600/40 text-blue-900 shadow-xs font-bold"
                  : "border-slate-200/80 text-slate-700 hover:border-slate-300 hover:bg-slate-50 font-medium bg-white"
              }`}
            >
              <span
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                  selectedTypology === "townhouse"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                <svg className="w-5 h-5 fill-none stroke-current stroke-[1.8]" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2 21h20M3 21V9.5L8.5 5 14 9.5V21M14 9.5L18.5 6 21 8.5V21M6.5 13h1.5m-1.5 3.5h1.5M10 21v-3.5a1 1 0 00-1-1H7.5a1 1 0 00-1 1V21m10.5-7.5h1.5M17 21v-3.5"
                  />
                </svg>
              </span>
              <div>
                <div className="text-xs font-bold">تاون هاوس</div>
                <div className="text-[11px] font-normal text-slate-400">نمط عصري مشترك</div>
              </div>
            </button>
          </div>
        </div>

        {/* Parameter 3: Strategic Purchase Intent */}
        <div className="space-y-3">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            الهدف الاستراتيجي من الشراء
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3" id="intentOptions">
            <button
              type="button"
              onClick={() => setSelectedIntent("family")}
              className={`p-3.5 rounded-2xl border transition-all text-center cursor-pointer ${
                selectedIntent === "family"
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200/80 text-slate-700 hover:bg-slate-50 bg-white"
              }`}
            >
              <span className="block text-xs font-bold">سكن عائلي أول</span>
              <span className="block text-[11px] opacity-70 mt-0.5 font-normal">
                أولوية الخصوصية والراحة
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedIntent("upgrade")}
              className={`p-3.5 rounded-2xl border transition-all text-center cursor-pointer ${
                selectedIntent === "upgrade"
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200/80 text-slate-700 hover:bg-slate-50 bg-white"
              }`}
            >
              <span className="block text-xs font-bold">ترقية مسكن</span>
              <span className="block text-[11px] opacity-70 mt-0.5 font-normal">
                تحسين الموقع وجودة البناء
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedIntent("invest")}
              className={`p-3.5 rounded-2xl border transition-all text-center cursor-pointer ${
                selectedIntent === "invest"
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200/80 text-slate-700 hover:bg-slate-50 bg-white"
              }`}
            >
              <span className="block text-xs font-bold">استثمار عقاري</span>
              <span className="block text-[11px] opacity-70 mt-0.5 font-normal">
                عائد الإيجار ونمو رأس المال
              </span>
            </button>
          </div>
        </div>

        {/* Session Workspace Title */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-700" htmlFor="session_title">
            عنوان جلسة التقييم (اختياري)
          </label>
          <input
            name="session_title"
            id="session_title"
            className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
            placeholder="مثال: مقارنة شقق حي النرجس والملقا 2025"
            type="text"
          />
        </div>

        {/* Submit CTA Button */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Info className="w-4 h-4 text-slate-400 shrink-0" />
            <span>يمكنك إدخال من 2 إلى 5 عقارات فور بدء الجلسة للمقارنة التلقائية</span>
          </div>
          <SubmitButton />
        </div>
      </form>
    </div>
  );
}

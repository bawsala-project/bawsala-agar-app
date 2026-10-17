"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Check } from "lucide-react";
import { CompassLoader } from "./compass-loader";

export interface CityBearing {
  name: string;
  angle: number;
  region: string;
  description: string;
}

export const SAUDI_CITIES_BEARINGS: CityBearing[] = [
  {
    name: "الرياض",
    angle: 0,
    region: "المنطقة الوسطى",
    description: "العاصمة والمركز المالي الأكبر لحركة العقار",
  },
  {
    name: "الدرعية",
    angle: 25,
    region: "المنطقة الوسطى",
    description: "المشاريع التراثية والسكنية الفاخرة",
  },
  {
    name: "الخبر",
    angle: 65,
    region: "المنطقة الشرقية",
    description: "واجهات بحرية ومجمعات سكنية عصرية",
  },
  {
    name: "الدمام",
    angle: 80,
    region: "المنطقة الشرقية",
    description: "حركة سكنية كبرى وتنوع في المخططات",
  },
  {
    name: "مكة المكرمة",
    angle: 235,
    region: "منطقة مكة المكرمة",
    description: "مناطق مركزية ومشاريع إسكانية كبرى",
  },
  {
    name: "جدة",
    angle: 245,
    region: "منطقة مكة المكرمة",
    description: "عروس البحر الأحمر والنمو العمراني الساحلي",
  },
  {
    name: "المدينة المنورة",
    angle: 290,
    region: "منطقة المدينة المنورة",
    description: "مناطق جوار الحرم ومخططات الضواحي الجديدة",
  },
  {
    name: "أبها",
    angle: 195,
    region: "منطقة عسير",
    description: "بيئة جبلية سكنية وسياحية فريدة",
  },
];

interface CityCompassSelectorProps {
  selectedCity?: string;
  onSelectCity?: (city: string) => void;
  className?: string;
}

export function CityCompassSelector({
  selectedCity = "الرياض",
  onSelectCity,
  className = "",
}: CityCompassSelectorProps) {
  const [currentCity, setCurrentCity] = useState(selectedCity);

  const activeBearing =
    SAUDI_CITIES_BEARINGS.find((c) => c.name === currentCity) ||
    SAUDI_CITIES_BEARINGS[0];

  const handleCityChange = (cityName: string) => {
    setCurrentCity(cityName);
    onSelectCity?.(cityName);
  };

  return (
    <div className={`space-y-8 ${className}`} dir="rtl">
      {/* Compass Display */}
      <div className="flex flex-col items-center justify-center space-y-3">
        <CompassLoader
          size={72}
          state="pointing"
          targetAngle={activeBearing.angle}
          messages={[
            `البوصلة تشير نحو: ${activeBearing.name} (${activeBearing.angle}°)`,
            `تدقيق معايير ${activeBearing.region}`,
          ]}
          showProgressLine={false}
        />

        <div className="flex items-center gap-2 mt-2 px-3.5 py-1.5 rounded-full bg-[var(--cream)] border border-[var(--mist)] text-xs text-[var(--dusty-blue)]">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--navy)] animate-pulse" />
          <span>الوجهة الجغرافية النشطة: </span>
          <span className="font-bold text-[var(--navy)]">
            {activeBearing.name}
          </span>
          <span className="font-mono text-[var(--dusty-blue)]">
            [{activeBearing.angle}° Azimuth]
          </span>
        </div>
      </div>

      {/* City Choice Cards Grid */}
      <div
        role="radiogroup"
        aria-label="قائمة المدن المدعومة"
        className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 px-2"
      >
        {SAUDI_CITIES_BEARINGS.map((city) => {
          const isSelected = city.name === currentCity;

          return (
            <motion.button
              key={city.name}
              role="radio"
              aria-checked={isSelected}
              aria-label={`اختيار مدينة ${city.name}`}
              whileHover={{ y: -3, scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleCityChange(city.name)}
              className={`p-5 rounded-[24px] text-right transition-all flex flex-col justify-between border select-none cursor-pointer min-h-[52px] ${
                isSelected
                  ? "bg-[var(--navy)] text-[var(--cream)] border-[var(--navy)] shadow-md"
                  : "bg-[var(--paper)] text-[var(--navy)] border-[var(--mist)] hover:border-[var(--navy)] shadow-xs"
              }`}
            >
              <div className="space-y-2 w-full">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center ${
                        isSelected
                          ? "bg-[var(--midnight)] text-[var(--cream)]"
                          : "bg-[var(--cream)] text-[var(--navy)] border border-[var(--mist)]"
                      }`}
                    >
                      <MapPin className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-body font-bold text-base">
                      {city.name}
                    </span>
                  </div>

                  <span
                    className={`font-mono text-xs px-2 py-0.5 rounded-full ${
                      isSelected
                        ? "bg-[var(--midnight)] text-[var(--cream)]"
                        : "bg-[var(--cream)] text-[var(--dusty-blue)] border border-[var(--mist)]"
                    }`}
                  >
                    {city.angle}°
                  </span>
                </div>

                <p
                  className={`text-[11px] leading-relaxed ${
                    isSelected ? "text-[var(--mist)]" : "text-[var(--dusty-blue)]"
                  }`}
                >
                  {city.description}
                </p>
              </div>

              <div
                className={`pt-3 mt-3 border-t flex items-center justify-between text-[11px] ${
                  isSelected
                    ? "border-[rgba(255,255,255,0.15)] text-[var(--mist)]"
                    : "border-[var(--mist)] text-[var(--dusty-blue)]"
                }`}
              >
                <span>{city.region}</span>
                {isSelected && (
                  <span className="inline-flex items-center gap-1 font-bold text-[var(--cream)]">
                    <Check className="w-3.5 h-3.5" />
                    <span>محددة</span>
                  </span>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

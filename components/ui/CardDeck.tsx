"use client";

import React, { useState } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { ChevronLeft, Layers, List } from "lucide-react";
import { PropertyItem } from "@/lib/seed";
import { BdiNumber } from "@/lib/format";

interface CardDeckProps {
  items: PropertyItem[];
  renderCard: (item: PropertyItem, isTop: boolean) => React.ReactNode;
  onSelectProperty?: (item: PropertyItem) => void;
  className?: string;
}

export function CardDeck({
  items,
  renderCard,
  onSelectProperty,
  className = "",
}: CardDeckProps) {
  const [deckItems, setDeckItems] = useState(items);
  const [isListView, setIsListView] = useState(false);
  const [dragDirection, setDragDirection] = useState(0);

  // Sync with prop updates if items length changes
  React.useEffect(() => {
    setDeckItems(items);
  }, [items]);

  const currentIndex = items.findIndex((i) => i.id === deckItems[0]?.id);
  const totalCount = items.length;

  const sendToBack = (direction: number = 1) => {
    setDragDirection(direction);
    setDeckItems((prev) => {
      const [top, ...rest] = prev;
      return [...rest, top];
    });
  };

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (Math.abs(info.offset.x) > 80 || Math.abs(info.velocity.x) > 400) {
      sendToBack(info.offset.x > 0 ? 1 : -1);
    }
  };

  return (
    <div className={`space-y-4 ${className}`} dir="rtl">
      {/* Deck Controls Header */}
      <div className="flex items-center justify-between">
        {/* Counter Pill with Tabular Numerals wrapped in bdi */}
        <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full glass-light border border-[#130F08]/10 text-xs font-sans text-[#130F08] shadow-xs">
          <BdiNumber value={`${currentIndex + 1} / ${totalCount}`} className="font-semibold text-[#130F08]" />
        </div>

        {/* View Mode Toggle: Deck vs List */}
        <div className="p-0.5 rounded-full glass-light border border-[#130F08]/10 flex items-center shadow-xs">
          <button
            type="button"
            onClick={() => setIsListView(false)}
            className={`px-3 py-1 rounded-full text-xs transition-all flex items-center gap-1 cursor-pointer ${
              !isListView
                ? "bg-[#130F08] text-[#FAF6EF] font-semibold shadow-xs"
                : "text-[#130F08]/60 hover:text-[#130F08]"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>عرض الحزمة</span>
          </button>
          <button
            type="button"
            onClick={() => setIsListView(true)}
            className={`px-3 py-1 rounded-full text-xs transition-all flex items-center gap-1 cursor-pointer ${
              isListView
                ? "bg-[#130F08] text-[#FAF6EF] font-semibold shadow-xs"
                : "text-[#130F08]/60 hover:text-[#130F08]"
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>قائمة</span>
          </button>
        </div>
      </div>

      {/* Render Mode: Stacked Deck vs Vertical List */}
      {isListView ? (
        /* Vertical List Mode */
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {items.map((item) => (
            <div key={item.id} onClick={() => onSelectProperty?.(item)}>
              {renderCard(item, true)}
            </div>
          ))}
        </motion.div>
      ) : (
        /* Stacked Card Deck Mode */
        <div className="relative min-h-[480px] w-full flex items-center justify-center pt-2 pb-8">
          <AnimatePresence mode="popLayout">
            {deckItems.slice(0, 3).map((item, idx) => {
              const isTop = idx === 0;
              const scale = isTop ? 1 : idx === 1 ? 0.94 : 0.88;
              const yOffset = isTop ? 0 : idx === 1 ? 14 : 28;
              const opacity = isTop ? 1 : idx === 1 ? 0.85 : 0.65;
              const zIndex = 30 - idx * 10;

              return (
                <motion.div
                  key={item.id}
                  layout
                  drag={isTop ? "x" : false}
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.7}
                  onDragEnd={isTop ? handleDragEnd : undefined}
                  initial={{
                    scale: 0.85,
                    y: 35,
                    opacity: 0,
                  }}
                  animate={{
                    scale,
                    y: yOffset,
                    opacity,
                    zIndex,
                  }}
                  exit={{
                    x: dragDirection > 0 ? 320 : -320,
                    opacity: 0,
                    rotate: dragDirection > 0 ? 12 : -12,
                    transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 150,
                    damping: 22,
                  }}
                  className="absolute inset-x-0 cursor-grab active:cursor-grabbing origin-top"
                  style={{ zIndex }}
                >
                  {renderCard(item, isTop)}
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Quick Deck Advance Chevron Controls */}
          <div className="absolute -bottom-2 inset-x-0 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => sendToBack(1)}
              className="px-4 py-1.5 rounded-full glass-light border border-[#130F08]/12 text-xs font-semibold text-[#130F08] hover:bg-[#E9DFD0]/60 flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
            >
              <span>العقار التالي</span>
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

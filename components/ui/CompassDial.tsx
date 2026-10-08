"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  animate,
  useReducedMotion,
  useMotionValueEvent,
  MotionValue,
} from "framer-motion";
import { ChevronUp, ChevronDown } from "lucide-react";

export interface CompassDialItem {
  id: string;
  label: string;
}

export interface CompassDialProps {
  items: CompassDialItem[];
  value?: string;
  onChange?: (id: string, item: CompassDialItem) => void;
  onConfirm?: () => void;
  className?: string;
  spinKey?: string | number;
}

const TOTAL_TICKS = 72;
const ANGULAR_STEP = 17; // 17 degrees per item
const RING_RADIUS = 124; // Hub tick ring radius
const LABEL_RADIUS = 176; // Label radius 176px
const VISIBLE_OFFSETS = [-4, -3, -2, -1, 0, 1, 2, 3, 4];

export function CompassDial({
  items,
  value,
  onChange,
  onConfirm,
  className = "",
  spinKey,
}: CompassDialProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  // Find initial index
  const initialIndex = Math.max(
    0,
    items.findIndex((item) => item.id === value)
  );

  // Motion value for continuous fractional selected index (e.g., 0.0, 1.2, -0.5)
  const scrollIndex = useMotionValue(initialIndex);

  // Smooth spring for snapping
  const smoothIndex = useSpring(scrollIndex, {
    stiffness: 300,
    damping: 30,
    mass: 0.8,
  });

  // Active snapped index in [0, items.length - 1] for accessibility and state
  const [activeIndex, setActiveIndex] = useState(initialIndex);

  // Virtual center index for looping slot calculation
  const [centerIndex, setCenterIndex] = useState(initialIndex);

  // Sync state if external value or items change
  const [prevValue, setPrevValue] = useState(value);
  const [prevItems, setPrevItems] = useState(items);
  if (value !== prevValue || items !== prevItems) {
    setPrevValue(value);
    setPrevItems(items);
    const idx = items.findIndex((item) => item.id === value);
    const validIdx = idx >= 0 ? idx : 0;
    if (validIdx !== activeIndex) {
      setActiveIndex(validIdx);
      scrollIndex.set(validIdx);
      setCenterIndex(validIdx);
    }
  }

  // Keep centerIndex updated during continuous scroll/drag
  useMotionValueEvent(smoothIndex, "change", (latest) => {
    const rounded = Math.round(latest);
    if (rounded !== centerIndex) {
      setCenterIndex(rounded);
    }
  });

  // Needle wobble rotation (spring)
  const needleWobble = useMotionValue(0);
  const smoothNeedleWobble = useSpring(needleWobble, {
    stiffness: 450,
    damping: 18,
  });

  // Re-spin ring offset motion value
  const spinOffset = useMotionValue(0);

  // Trigger needle wobble animation (+/-4 deg spring wobble)
  const triggerNeedleWobble = useCallback(() => {
    if (shouldReduceMotion) return;
    needleWobble.set(4);
    setTimeout(() => needleWobble.set(-3.5), 60);
    setTimeout(() => needleWobble.set(1.5), 130);
    setTimeout(() => needleWobble.set(-0.8), 200);
    setTimeout(() => needleWobble.set(0), 280);
  }, [needleWobble, shouldReduceMotion]);

  // Trigger 360-degree re-spin when spinKey changes
  useEffect(() => {
    if (spinKey !== undefined && !shouldReduceMotion) {
      animate(spinOffset, spinOffset.get() + 360, {
        duration: 0.9,
        ease: [0.22, 1, 0.36, 1],
      });
      triggerNeedleWobble();
    }
  }, [spinKey, shouldReduceMotion, triggerNeedleWobble, spinOffset]);

  // Snap to target integer index
  const snapToIndex = useCallback(
    (targetIdx: number) => {
      const N = items.length;
      if (N === 0) return;
      const normalized = ((targetIdx % N) + N) % N;
      if (normalized !== activeIndex) {
        setActiveIndex(normalized);
        onChange?.(items[normalized].id, items[normalized]);
        triggerNeedleWobble();
      } else {
        triggerNeedleWobble();
      }
      if (shouldReduceMotion) {
        scrollIndex.set(targetIdx);
      } else {
        animate(scrollIndex, targetIdx, {
          type: "spring",
          stiffness: 320,
          damping: 30,
        });
      }
    },
    [items, activeIndex, onChange, scrollIndex, shouldReduceMotion, triggerNeedleWobble]
  );

  // Wheel interaction (mouse wheel or trackpad)
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY;
    const step = delta > 0 ? 1 : -1;
    const current = Math.round(scrollIndex.get());
    snapToIndex(current + step);
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "ArrowLeft") {
      e.preventDefault();
      snapToIndex(Math.round(scrollIndex.get()) + 1);
    } else if (e.key === "ArrowUp" || e.key === "ArrowRight") {
      e.preventDefault();
      snapToIndex(Math.round(scrollIndex.get()) - 1);
    } else if (e.key === "PageDown") {
      e.preventDefault();
      snapToIndex(Math.round(scrollIndex.get()) + 3);
    } else if (e.key === "PageUp") {
      e.preventDefault();
      snapToIndex(Math.round(scrollIndex.get()) - 3);
    } else if (e.key === "Home") {
      e.preventDefault();
      snapToIndex(0);
    } else if (e.key === "End") {
      e.preventDefault();
      snapToIndex(items.length - 1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      onConfirm?.();
    }
  };

  // Pointer Drag on wheel area
  const dragStartY = useRef(0);
  const dragStartIndex = useRef(0);
  const isDragging = useRef(false);

  const handlePointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest(".scrub-bar")) return;
    isDragging.current = true;
    dragStartY.current = e.clientY;
    dragStartIndex.current = scrollIndex.get();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const deltaY = e.clientY - dragStartY.current;
    const indexDelta = -deltaY / 44;
    scrollIndex.set(dragStartIndex.current + indexDelta);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    isDragging.current = false;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
    const finalIndex = Math.round(scrollIndex.get());
    snapToIndex(finalIndex);
  };

  // Scrub bar drag
  const scrubBarRef = useRef<HTMLDivElement>(null);
  const isScrubbing = useRef(false);

  const handleScrubPointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    isScrubbing.current = true;
    updateScrubFromPointer(e.clientY);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleScrubPointerMove = (e: React.PointerEvent) => {
    if (!isScrubbing.current) return;
    e.stopPropagation();
    updateScrubFromPointer(e.clientY);
  };

  const handleScrubPointerUp = (e: React.PointerEvent) => {
    if (!isScrubbing.current) return;
    e.stopPropagation();
    isScrubbing.current = false;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
    const finalIndex = Math.round(scrollIndex.get());
    snapToIndex(finalIndex);
  };

  const updateScrubFromPointer = (clientY: number) => {
    const bar = scrubBarRef.current;
    const N = items.length;
    if (!bar || N <= 1) return;
    const rect = bar.getBoundingClientRect();
    const handleHalfHeight = 22;
    const availableHeight = rect.height - handleHalfHeight * 2;
    const relativeY = Math.max(
      0,
      Math.min(availableHeight, clientY - rect.top - handleHalfHeight)
    );
    const progress = availableHeight > 0 ? relativeY / availableHeight : 0;
    const targetMod = progress * (N - 1);

    const currentVal = scrollIndex.get();
    const currentRound = Math.round(currentVal);
    const currentMod = ((currentRound % N) + N) % N;
    const delta = targetMod - currentMod;
    scrollIndex.set(currentRound + delta);
  };

  // Rotation of the tick ring: rotates counter-clockwise as index increases + spinOffset
  const ringRotation = useTransform(
    [smoothIndex, spinOffset],
    ([idx, offset]) => -(Number(idx) * ANGULAR_STEP) + Number(offset)
  );

  // Position of the scrub handle in percentage [0, 100%] mapped to item index
  const scrubProgress = useTransform(smoothIndex, (curr) => {
    const N = items.length;
    if (N <= 1) return 0;
    const mod = ((curr % N) + N) % N;
    return (mod / (N - 1)) * 100;
  });

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      role="listbox"
      aria-label="عجلة الاختيار"
      aria-activedescendant={items[activeIndex]?.id}
      onWheel={handleWheel}
      onKeyDown={handleKeyDown}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{ direction: "ltr" }}
      className={`relative w-full h-[400px] select-none touch-none outline-none focus-visible:ring-1 focus-visible:ring-sandstone/40 overflow-hidden ${className}`}
    >
      {/* Background Hub Soft Glow (on left edge) */}
      <div
        className="absolute top-1/2 -translate-y-1/2 pointer-events-none"
        style={{
          left: "0px",
          width: "280px",
          height: "280px",
          transform: "translate(-50%, -50%)",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, var(--cocoa) 0%, transparent 70%)",
          opacity: 0.5,
        }}
      />

      {/* 1. Hub & Tick Ring on the LEFT edge of the screen (half cropped) */}
      <div
        className="absolute top-1/2 pointer-events-none"
        style={{
          left: "0px",
          width: `${RING_RADIUS * 2}px`,
          height: `${RING_RADIUS * 2}px`,
          transform: "translate(-50%, -50%)",
        }}
      >
        {/* Rotating 72-Tick Ring */}
        <motion.svg
          style={{ rotate: ringRotation }}
          className="w-full h-full"
          viewBox={`0 0 ${RING_RADIUS * 2} ${RING_RADIUS * 2}`}
        >
          {/* Outer Circular Arc Line */}
          <circle
            cx={RING_RADIUS}
            cy={RING_RADIUS}
            r={RING_RADIUS - 1}
            fill="none"
            stroke="var(--stroke)"
            strokeWidth="1"
          />

          {/* 72 Fine Tick Marks with Sandstone 35% Accents */}
          {Array.from({ length: TOTAL_TICKS }).map((_, i) => {
            const angleDeg = (i * 360) / TOTAL_TICKS;
            const isMajor = i % 6 === 0;
            const tickLength = isMajor ? 12 : 6;
            const outerR = RING_RADIUS - 1;
            const innerR = outerR - tickLength;
            const angleRad = (angleDeg * Math.PI) / 180;

            const x1 = RING_RADIUS + innerR * Math.cos(angleRad);
            const y1 = RING_RADIUS + innerR * Math.sin(angleRad);
            const x2 = RING_RADIUS + outerR * Math.cos(angleRad);
            const y2 = RING_RADIUS + outerR * Math.sin(angleRad);

            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={isMajor ? "var(--sandstone)" : "var(--stroke)"}
                strokeOpacity={isMajor ? 0.38 : 1}
                strokeWidth={isMajor ? 1.5 : 1}
                strokeLinecap="round"
              />
            );
          })}
        </motion.svg>
      </div>

      {/* 2. Fixed Outlined Diamond Needle on the LEFT Edge Pointing RIGHT toward Selected Label */}
      <div
        className="absolute top-1/2 pointer-events-none"
        style={{
          left: "0px",
          width: "48px",
          height: "16px",
          marginTop: "-8px",
          transformOrigin: "left center",
        }}
      >
        <motion.div
          style={{
            rotate: smoothNeedleWobble,
            transformOrigin: "left center",
          }}
          className="w-full h-full flex items-center justify-start"
        >
          {/* Diamond SVG pointing horizontally right */}
          <svg
            width="48"
            height="16"
            viewBox="0 0 48 16"
            fill="none"
          >
            <polygon
              points="2,8 24,2 46,8 24,14"
              fill="var(--espresso)"
              stroke="var(--sandstone)"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <circle cx="8" cy="8" r="2.5" fill="var(--sandstone)" />
          </svg>
        </motion.div>
      </div>

      {/* 3. Looping Dial Items along the Arc (7 visible: 3 above, 3 below selected at angle 0) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {VISIBLE_OFFSETS.map((offset) => {
          const virtualIndex = centerIndex + offset;
          const N = items.length;
          const itemIndex = ((virtualIndex % N) + N) % N;
          const item = items[itemIndex];
          if (!item) return null;

          return (
            <DialItemView
              key={virtualIndex}
              virtualIndex={virtualIndex}
              item={item}
              smoothIndex={smoothIndex}
              onSelect={() => snapToIndex(virtualIndex)}
            />
          );
        })}
      </div>

      {/* 4. Slim Vertical Scrub Bar on RIGHT Edge with Draggable 22x44 Pill Handle */}
      <div
        ref={scrubBarRef}
        onPointerDown={handleScrubPointerDown}
        onPointerMove={handleScrubPointerMove}
        onPointerUp={handleScrubPointerUp}
        onPointerCancel={handleScrubPointerUp}
        className="scrub-bar absolute top-1/2 -translate-y-1/2 w-8 h-[60%] flex items-center justify-center cursor-pointer pointer-events-auto z-20"
        style={{ right: "12px" }}
        aria-hidden="true"
      >
        {/* Track Line: 4px wide, surface-2 */}
        <div className="relative w-1 h-full rounded-full bg-surface-2 border border-stroke flex items-center justify-center">
          {/* Draggable Sandstone Pill Handle: 22x44 with chevrons */}
          <motion.div
            style={{
              top: useTransform(scrubProgress, (p) => `calc(${p}% - 22px)`),
            }}
            className="absolute -left-[9px] w-[22px] h-[44px] rounded-full bg-sandstone text-espresso shadow-lg flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-transform cursor-grab active:cursor-grabbing"
          >
            <ChevronUp className="w-3 h-3 stroke-[2.5]" />
            <ChevronDown className="w-3 h-3 stroke-[2.5]" />
          </motion.div>
        </div>
      </div>
    </div>
  );
}

// Sub-component for each dial item slot along the radiating arc
interface DialItemViewProps {
  virtualIndex: number;
  item: CompassDialItem;
  smoothIndex: MotionValue<number>;
  onSelect: () => void;
}

function DialItemView({
  virtualIndex,
  item,
  smoothIndex,
  onSelect,
}: DialItemViewProps) {
  // Angular offset in degrees from horizontal (angle 0)
  const angleDeg = useTransform(smoothIndex, (curr: number) => {
    return (virtualIndex - curr) * ANGULAR_STEP;
  });

  // Continuous distance from angle 0 in step units
  const stepDist = useTransform(angleDeg, (deg: number) => {
    return Math.abs(deg / ANGULAR_STEP);
  });

  // Scale: selected = 1.0 (52px), neighbors = 28/52 ~ 0.5385 (28px)
  const scale = useTransform(stepDist, (dist: number) => {
    if (dist <= 0.05) return 1.0;
    if (dist >= 1.0) return 28 / 52;
    const t = dist;
    return 1.0 - t * (1.0 - 28 / 52);
  });

  // Opacity: selected = 1.0, neighbor 1 = 0.8, neighbor 2 = 0.55, neighbor 3 = 0.3, > 3.6 = 0
  const opacity = useTransform(stepDist, (dist: number) => {
    if (dist <= 0.05) return 1.0;
    if (dist <= 1.0) {
      return 1.0 - dist * 0.2;
    }
    if (dist <= 2.0) {
      return 0.8 - (dist - 1.0) * 0.25;
    }
    if (dist <= 3.0) {
      return 0.55 - (dist - 2.0) * 0.25;
    }
    if (dist <= 3.6) {
      return 0.30 - (dist - 3.0) * 0.5;
    }
    return 0;
  });

  // Blur: 0 to 1.5px blur only on farthest
  const blur = useTransform(stepDist, (dist: number) => {
    if (dist <= 2.0) return "blur(0px)";
    if (dist >= 3.0) return "blur(1.5px)";
    const b = (dist - 2.0) * 1.5;
    return `blur(${b.toFixed(2)}px)`;
  });

  // Check if near selected for weight 600 vs 500
  const [isNearSelected, setIsNearSelected] = useState(
    () => Math.abs(virtualIndex - smoothIndex.get()) < 0.45
  );
  useMotionValueEvent(stepDist, "change", (d) => {
    const near = d < 0.45;
    if (near !== isNearSelected) {
      setIsNearSelected(near);
    }
  });

  // Transform for item positioned at hub's exact center (left: 0, top: 50%):
  const transform = useTransform(angleDeg, (deg: number) => {
    return `rotate(${deg}deg) translateX(${LABEL_RADIUS}px) translateY(-50%)`;
  });

  return (
    <motion.div
      style={{
        transform,
        transformOrigin: "0 0",
        zIndex: isNearSelected ? 10 : 1,
      }}
      onClick={onSelect}
      className="absolute left-0 top-1/2 flex items-center pointer-events-auto cursor-pointer select-none"
    >
      <motion.div
        style={{
          scale,
          opacity,
          filter: blur,
          transformOrigin: "left center",
        }}
        className="transition-colors duration-150"
      >
        <span
          dir="rtl"
          className="block text-[52px] leading-none text-sandstone whitespace-nowrap tracking-normal"
          style={{
            fontWeight: isNearSelected ? 600 : 500,
            maxWidth: "175px",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {item.label}
        </span>
      </motion.div>
    </motion.div>
  );
}

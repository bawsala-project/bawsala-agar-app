"use client";

import React from "react";

interface WordmarkProps {
  className?: string;
  height?: number;
  width?: number;
  useTextFallback?: boolean;
}

export function Wordmark({
  className = "",
  height = 30,
  width = 185,
  useTextFallback = false,
}: WordmarkProps) {
  if (useTextFallback) {
    return (
      <span
        className={`font-sans tracking-[0.28em] uppercase font-semibold select-none leading-none inline-block ${className}`}
        style={{ fontSize: height * 0.9, color: "currentColor" }}
      >
        BAWSALA
      </span>
    );
  }

  // Exact vector glyph curves with fill="currentColor" to ensure identical color with compass
  return (
    <div
      className={`relative inline-flex items-center justify-center select-none shrink-0 ${className}`}
      style={{ height, width }}
    >
      <svg
        viewBox="0 0 5057 750"
        fill="currentColor"
        aria-label="BAWSALA"
        className="w-full h-full object-contain overflow-visible"
        style={{ color: "currentColor" }}
      >
        <g transform="translate(-50, 725) scale(1, -1)">
          <path transform="translate(0, 0)" d="M70 692Q186 700 275 700Q522 700 522 535Q522 473 486.0 428.5Q450 384 371 368Q447 359 491.0 322.0Q535 285 535 193Q535 0 288 0H70ZM153 10H288Q377 10 414.5 56.5Q452 103 452.0 199.0Q452 295 414.0 327.0Q376 359 301 361H153ZM275 690Q217 690 153 683V371H301Q442 377 442 533Q442 609 400.0 649.5Q358 690 275 690Z" />
          <path transform="translate(710, 0)" d="M42 0H30L329 700L340 705L592 0H507L429 220H137ZM298 592 141 230H426Z" />
          <path transform="translate(1472, 0)" d="M797 700Q816 681 816 651Q816 626 805 600L569 0L558 -5L426 414L263 0L252 -5L30 700H115L294 108L421 430L336 700H421L600 108L793 600Q804 625 804.0 652.0Q804 679 789 694Z" />
          <path transform="translate(2458, 0)" d="M439 658Q348 693 267.5 693.0Q187 693 142.0 659.0Q97 625 97 565Q97 492 173 452Q207 435 247.5 420.5Q288 406 329.0 388.0Q370 370 404.0 347.0Q438 324 459.0 283.5Q480 243 480.0 180.5Q480 118 445.0 74.0Q410 30 360.5 14.5Q311 -1 245 -1Q122 -1 35 60L40 68Q73 42 125.5 25.5Q178 9 233 9Q314 9 371.5 46.5Q429 84 429 157Q429 237 353 282Q319 302 278.5 319.0Q238 336 197.0 354.5Q156 373 122 396Q46 446 46 538Q46 611 95.0 656.5Q144 702 242.5 702.0Q341 702 443 668Z" />
          <path transform="translate(3113, 0)" d="M42 0H30L329 700L340 705L592 0H507L429 220H137ZM298 592 141 230H426Z" />
          <path transform="translate(3875, 0)" d="M450 0H70V700H153V10H450Z" />
          <path transform="translate(4495, 0)" d="M42 0H30L329 700L340 705L592 0H507L429 220H137ZM298 592 141 230H426Z" />
        </g>
      </svg>
    </div>
  );
}

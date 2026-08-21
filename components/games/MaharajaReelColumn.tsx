"use client";

import React, { useEffect, useState, useRef } from "react";
import { SymbolId, MaharajaSymbolIcon } from "./MaharajaSymbols";
import { REEL_STRIP } from "./maharajaLogic";

interface MaharajaReelColumnProps {
  reelIndex: number;
  isSpinning: boolean;
  targetSymbols: SymbolId[]; // 3 target symbols [top, mid, bot]
  onStop: () => void;
  isTurbo?: boolean;
  isWinningCell: (rowIndex: number) => boolean;
}

export const MaharajaReelColumn: React.FC<MaharajaReelColumnProps> = ({
  reelIndex,
  isSpinning,
  targetSymbols,
  onStop,
  isTurbo = false,
  isWinningCell,
}) => {
  // We keep a strip of symbols: initial 3 symbols, followed by random strip during spin, ending with target 3 symbols
  const [strip, setStrip] = useState<SymbolId[]>(targetSymbols);
  const [offsetY, setOffsetY] = useState<number>(0);
  const [animating, setAnimating] = useState<boolean>(false);
  const prevSpinning = useRef(isSpinning);

  const CELL_HEIGHT = 100; // in px or percentage based units
  const totalExtraSymbols = isTurbo ? 10 : 20 + reelIndex * 6; // left to right progressive length

  useEffect(() => {
    // When spin starts
    if (isSpinning && !prevSpinning.current) {
      // Build a long strip: current symbols -> random symbols from REEL_STRIP -> targetSymbols
      const randomMiddle: SymbolId[] = [];
      for (let i = 0; i < totalExtraSymbols; i++) {
        randomMiddle.push(REEL_STRIP[Math.floor(Math.random() * REEL_STRIP.length)]);
      }
      const newStrip = [...strip.slice(-3), ...randomMiddle, ...targetSymbols];
      setStrip(newStrip);
      setOffsetY(0);
      setAnimating(true);

      // Trigger vertical sliding translation
      requestAnimationFrame(() => {
        const targetOffset = (newStrip.length - 3) * CELL_HEIGHT;
        setOffsetY(targetOffset);
      });
    }

    prevSpinning.current = isSpinning;
  }, [isSpinning, targetSymbols, totalExtraSymbols]);

  const handleTransitionEnd = () => {
    if (animating) {
      setAnimating(false);
      setStrip(targetSymbols);
      setOffsetY(0);
      onStop();
    }
  };

  const durationSec = isTurbo
    ? 0.3 + reelIndex * 0.15
    : 0.8 + reelIndex * 0.35; // Staggered from left to right: 0.8s, 1.15s, 1.5s, 1.85s, 2.2s

  return (
    <div className="relative w-full overflow-hidden rounded-xl sm:rounded-2xl p-1 bg-gradient-to-b from-[#180a22]/95 to-[#0e0414]/95 border border-amber-500/35 shadow-inner">
      {/* 3 Visible rows viewport (Height matches 3 square cells + gaps) */}
      <div
        className="relative w-full flex flex-col gap-1.5 sm:gap-2.5 overflow-hidden"
        style={{
          height: "320px", // fixed height for 3 cells
        }}
      >
        <div
          onTransitionEnd={handleTransitionEnd}
          className="w-full flex flex-col gap-1.5 sm:gap-2.5"
          style={{
            transform: `translateY(-${animating ? offsetY : 0}px)`,
            transition: animating
              ? `transform ${durationSec}s cubic-bezier(0.15, 0.9, 0.25, 1.08)` // Smooth vertical slide with elastic bounce
              : "none",
            filter: animating ? "blur(0.6px)" : "none",
          }}
        >
          {strip.map((symbolId, idx) => {
            // Check if this symbol in current view is winning
            const isVisibleResult = !animating && idx < 3;
            const isWin = isVisibleResult && isWinningCell(idx);

            return (
              <div
                key={idx}
                className={`relative w-full aspect-square rounded-lg sm:rounded-xl flex items-center justify-center p-1 sm:p-2 bg-gradient-to-b from-[#251033]/90 via-[#180924]/90 to-[#100519]/90 border transition-all duration-300 shrink-0 ${
                  isWin
                    ? "border-amber-300 bg-amber-500/25 shadow-[0_0_22px_rgba(255,215,0,0.9)] scale-105 z-20 animate-pulse"
                    : "border-amber-500/20 hover:border-amber-500/40"
                }`}
                style={{ height: "98px" }}
              >
                <MaharajaSymbolIcon symbolId={symbolId} isWinning={isWin} />

                {isWin && (
                  <div className="absolute inset-0 rounded-lg sm:rounded-xl border-2 border-yellow-300 pointer-events-none shadow-[inset_0_0_15px_rgba(255,215,0,0.7)]" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

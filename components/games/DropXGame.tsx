"use client";

import React, { useState, useCallback } from "react";
import {
  Sparkles,
  Zap,
  Sliders,
  RotateCcw,
  Trophy,
  ShieldAlert,
  Flame,
  Gauge,
  Wallet,
  Play,
  Layers,
  History,
} from "lucide-react";
import confetti from "canvas-confetti";
import { sound } from "@/lib/soundFx";
import { DropXCanvas, PlinkoBall } from "./DropXCanvas";

interface DropXGameProps {
  playerBalance: number;
  onUpdateBalance: (newBalance: number) => void;
  onRecordRound?: (data: { bet: number; win: number; multiplier: number }) => void;
}

type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

// Plinko Multipliers Lookup by Rows and Risk
const PLINKO_PAYTABLES: Record<number, Record<RiskLevel, number[]>> = {
  8: {
    LOW: [5.6, 2.1, 1.1, 1.0, 0.5, 1.0, 1.1, 2.1, 5.6],
    MEDIUM: [13.0, 3.0, 1.3, 0.7, 0.4, 0.7, 1.3, 3.0, 13.0],
    HIGH: [29.0, 4.0, 1.5, 0.3, 0.2, 0.3, 1.5, 4.0, 29.0],
  },
  10: {
    LOW: [8.9, 3.0, 1.4, 1.1, 1.0, 0.5, 1.0, 1.1, 1.4, 3.0, 8.9],
    MEDIUM: [22.0, 5.0, 2.0, 1.4, 0.6, 0.4, 0.6, 1.4, 2.0, 5.0, 22.0],
    HIGH: [76.0, 10.0, 3.0, 0.9, 0.3, 0.2, 0.3, 0.9, 3.0, 10.0, 76.0],
  },
  12: {
    LOW: [10.0, 3.0, 1.6, 1.4, 1.1, 1.0, 0.5, 1.0, 1.1, 1.4, 1.6, 3.0, 10.0],
    MEDIUM: [33.0, 11.0, 4.0, 2.0, 1.1, 0.6, 0.3, 0.6, 1.1, 2.0, 4.0, 11.0, 33.0],
    HIGH: [170.0, 24.0, 8.1, 2.0, 0.7, 0.2, 0.2, 0.2, 0.7, 2.0, 8.1, 24.0, 170.0],
  },
  14: {
    LOW: [13.0, 4.0, 1.9, 1.4, 1.2, 1.1, 1.0, 0.5, 1.0, 1.1, 1.2, 1.4, 1.9, 4.0, 13.0],
    MEDIUM: [58.0, 15.0, 7.0, 4.0, 1.9, 1.0, 0.5, 0.2, 0.5, 1.0, 1.9, 4.0, 7.0, 15.0, 58.0],
    HIGH: [420.0, 56.0, 18.0, 5.0, 1.9, 0.3, 0.2, 0.2, 0.2, 0.3, 1.9, 5.0, 18.0, 56.0, 420.0],
  },
  16: {
    LOW: [16.0, 8.0, 2.0, 1.4, 1.2, 1.1, 1.0, 0.5, 0.5, 1.0, 1.1, 1.2, 1.4, 2.0, 8.0, 16.0, 16.0],
    MEDIUM: [110.0, 41.0, 10.0, 5.0, 3.0, 1.5, 1.0, 0.5, 0.3, 0.5, 1.0, 1.5, 3.0, 5.0, 10.0, 41.0, 110.0],
    HIGH: [1000.0, 130.0, 26.0, 9.0, 4.0, 2.0, 0.2, 0.2, 0.2, 0.2, 0.2, 2.0, 4.0, 9.0, 26.0, 130.0, 1000.0],
  },
};

export const DropXGame: React.FC<DropXGameProps> = ({
  playerBalance,
  onUpdateBalance,
  onRecordRound,
}) => {
  const [betAmount, setBetAmount] = useState(50);
  const [rows, setRows] = useState<number>(10);
  const [risk, setRisk] = useState<RiskLevel>("MEDIUM");
  const [activeBalls, setActiveBalls] = useState<PlinkoBall[]>([]);
  const [dropHistory, setDropHistory] = useState<number[]>([1.4, 2.0, 0.4, 5.0, 0.6, 22.0, 1.4]);
  const [lastWin, setLastWin] = useState<{ amount: number; multiplier: number } | null>(null);

  const activeMultipliers = PLINKO_PAYTABLES[rows]?.[risk] || PLINKO_PAYTABLES[10].MEDIUM;

  // 1. Drop a Ball
  const dropBall = () => {
    if (playerBalance < betAmount) {
      alert("Insufficient Balance");
      return;
    }

    onUpdateBalance(playerBalance - betAmount);
    sound.playChipBet();

    // Spawn new ball at top center with slight random offset
    const newBall: PlinkoBall = {
      id: `ball_${Date.now()}_${Math.random()}`,
      x: 350 + (Math.random() - 0.5) * 12,
      y: 25,
      vx: (Math.random() - 0.5) * 1.5,
      vy: 0,
      radius: rows >= 14 ? 5 : 6,
      color: risk === "HIGH" ? "#f43f5e" : risk === "MEDIUM" ? "#fbbf24" : "#38bdf8",
      betAmount,
      isLanded: false,
    };

    setActiveBalls((prev) => [...prev, newBall]);
  };

  // 2. Burst Drop Multiple Balls
  const dropMultipleBalls = (count: number) => {
    if (playerBalance < betAmount * count) {
      alert("Insufficient Balance for multi-drop");
      return;
    }

    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        dropBall();
      }, i * 180);
    }
  };

  // 3. Callback when a ball lands in a bucket
  const handleBallLanded = useCallback(
    (ballId: string, bucketIndex: number, multiplier: number, ballBetAmount: number) => {
      const winAmount = Number((ballBetAmount * multiplier).toFixed(2));

      onUpdateBalance(playerBalance + winAmount);
      setDropHistory((prev) => [multiplier, ...prev.slice(0, 9)]);
      setLastWin({ amount: winAmount, multiplier });

      if (multiplier >= 10) {
        sound.playWin();
        confetti({ particleCount: 65, spread: 70, origin: { y: 0.8 } });
      } else {
        sound.playCoinFlip();
      }

      if (onRecordRound) {
        onRecordRound({ bet: ballBetAmount, win: winAmount, multiplier });
      }

      // Cleanup landed ball
      setActiveBalls((prev) => prev.filter((b) => b.id !== ballId));
    },
    [playerBalance, onUpdateBalance, onRecordRound]
  );

  return (
    <div className="w-full flex flex-col space-y-4">
      {/* Top Drop History Strip */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider shrink-0 flex items-center gap-1">
          <History className="w-3 h-3 text-cyan-400" /> Recent Landings:
        </span>
        {dropHistory.map((mult, idx) => (
          <span
            key={idx}
            className={`text-xs font-mono font-black px-2.5 py-1 rounded-xl shrink-0 transition-all ${
              mult >= 20
                ? "bg-rose-950/70 text-rose-300 border border-rose-500/50 shadow-md shadow-rose-500/20"
                : mult >= 3
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/50"
                : mult >= 1
                ? "bg-emerald-950/70 text-emerald-300 border border-emerald-500/50"
                : "bg-slate-900 text-gray-400 border border-slate-800"
            }`}
          >
            {mult}x
          </span>
        ))}
      </div>

      {/* 60FPS Plinko Physics Arena & Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: 60FPS Canvas View (7 cols) */}
        <div className="lg:col-span-7 h-[440px] sm:h-[480px] md:h-[520px]">
          <DropXCanvas
            rows={rows}
            risk={risk}
            multipliers={activeMultipliers}
            balls={activeBalls}
            onBallLanded={handleBallLanded}
          />
        </div>

        {/* Right: Plinko Controls & Quick Drop Buttons (5 cols) */}
        <div className="lg:col-span-5 bg-[#080d18] border border-cyan-500/20 rounded-3xl p-5 shadow-2xl space-y-4">
          {/* Risk Level Selector */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-gray-300 uppercase tracking-wider block">Risk Volatility</span>
            <div className="grid grid-cols-3 gap-1.5">
              {(["LOW", "MEDIUM", "HIGH"] as RiskLevel[]).map((r) => (
                <button
                  key={r}
                  onClick={() => {
                    setRisk(r);
                    sound.playCardDeal();
                  }}
                  className={`py-2 rounded-xl text-xs font-black border transition-all ${
                    risk === r
                      ? r === "HIGH"
                        ? "bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-500/30"
                        : r === "MEDIUM"
                        ? "bg-amber-500 text-black border-amber-400 shadow-md shadow-amber-500/30"
                        : "bg-cyan-500 text-black border-cyan-400 shadow-md shadow-cyan-500/30"
                      : "bg-[#040812] border-slate-800 text-gray-400 hover:text-white"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Pyramid Pin Rows Selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-gray-300 uppercase tracking-wider">Pyramid Rows</span>
              <span className="font-mono font-black text-cyan-400">{rows} Rows</span>
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {[8, 10, 12, 14, 16].map((num) => (
                <button
                  key={num}
                  onClick={() => {
                    setRows(num);
                    sound.playCardDeal();
                  }}
                  className={`py-1.5 rounded-xl text-xs font-mono font-bold border transition-colors ${
                    rows === num
                      ? "bg-cyan-500 text-black border-cyan-400 shadow-md shadow-cyan-500/20"
                      : "bg-[#040812] border-slate-800 text-gray-400 hover:text-white"
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          {/* Bet Amount Input & Chips */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Bet Amount (INR)</span>
            <div className="flex items-center gap-2 bg-[#040812] border border-slate-800 rounded-2xl px-3 py-2">
              <span className="text-cyan-400 font-bold text-sm">₹</span>
              <input
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(Math.max(10, Number(e.target.value)))}
                className="w-full bg-transparent text-white font-mono font-bold text-base focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              {[20, 50, 100, 500].map((val) => (
                <button
                  key={val}
                  onClick={() => {
                    setBetAmount(val);
                    sound.playChipBet();
                  }}
                  className={`py-1.5 rounded-xl text-xs font-mono font-bold border transition-colors ${
                    betAmount === val
                      ? "bg-cyan-500 text-black border-cyan-400"
                      : "bg-[#040812] border-slate-800 text-gray-400 hover:text-white"
                  }`}
                >
                  ₹{val}
                </button>
              ))}
            </div>
          </div>

          {/* Primary Action Button: DROP BALL */}
          <button
            onClick={dropBall}
            className="w-full h-20 rounded-2xl bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 hover:from-cyan-400 hover:to-emerald-300 text-black font-black text-base shadow-xl shadow-cyan-500/25 transition-all active:scale-95 flex flex-col items-center justify-center space-y-0.5"
          >
            <span className="text-xs uppercase tracking-widest font-extrabold text-black/90">DROP PLINKO BALL</span>
            <span className="text-xl font-mono font-black">₹{betAmount}</span>
          </button>

          {/* Multi-Ball Quick Burst Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={() => dropMultipleBalls(5)}
              className="py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500/40 text-xs font-bold text-cyan-300 transition-colors flex items-center justify-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Drop 5 Balls</span>
            </button>

            <button
              onClick={() => dropMultipleBalls(10)}
              className="py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500/40 text-xs font-bold text-amber-300 transition-colors flex items-center justify-center gap-1.5"
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Drop 10 Balls</span>
            </button>
          </div>

          {/* Win Celebration Banner */}
          {lastWin && (
            <div className="p-2.5 bg-emerald-950/60 border border-emerald-500/50 rounded-2xl text-emerald-300 font-bold text-xs flex items-center justify-center gap-2 animate-bounce">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>Landed {lastWin.multiplier}x! Payout: ₹{lastWin.amount}!</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

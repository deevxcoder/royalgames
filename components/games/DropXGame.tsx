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
  CircleDot,
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

  // 1. Drop a Ball with automatic center alignment
  const dropBall = () => {
    if (playerBalance < betAmount) {
      alert("Insufficient Balance");
      return;
    }

    onUpdateBalance(playerBalance - betAmount);
    sound.playChipBet();

    const newBall: PlinkoBall = {
      id: `ball_${Date.now()}_${Math.random()}`,
      x: 0,
      y: 0,
      vx: (Math.random() - 0.5) * 0.8,
      vy: 0.8,
      radius: rows >= 14 ? 4 : 5.5,
      color: risk === "HIGH" ? "#f43f5e" : risk === "MEDIUM" ? "#fbbf24" : "#38bdf8",
      betAmount,
      isLanded: false,
      initialized: false,
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
      }, i * 160);
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
    <div className="w-full flex flex-col space-y-3">
      {/* Top Drop History Strip */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider shrink-0 flex items-center gap-1">
          <History className="w-3.5 h-3.5 text-cyan-400" /> Recent:
        </span>
        {dropHistory.map((mult, idx) => (
          <span
            key={idx}
            className={`text-xs font-mono font-black px-2.5 py-0.5 rounded-xl shrink-0 transition-all ${
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

      {/* 60FPS Full-View Plinko Physics Arena */}
      <div className="w-full h-[310px] sm:h-[380px] md:h-[450px]">
        <DropXCanvas
          rows={rows}
          risk={risk}
          multipliers={activeMultipliers}
          balls={activeBalls}
          onBallLanded={handleBallLanded}
        />
      </div>

      {/* Spacious, Ergonomic Dashboard Panel (No Cramping) */}
      <div className="bg-[#080d18] border border-slate-800/90 rounded-3xl p-4 sm:p-5 shadow-2xl space-y-3.5 backdrop-blur-md">
        {/* 1. Risk Volatility Selector */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-gray-400 px-1">
            <span className="uppercase tracking-wider">Risk Volatility:</span>
            <span className="font-mono text-cyan-400">Max Multiplier: {activeMultipliers[0]}x</span>
          </div>

          <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#040812] border border-slate-800/90 rounded-2xl">
            {(["LOW", "MEDIUM", "HIGH"] as RiskLevel[]).map((r) => (
              <button
                key={r}
                onClick={() => {
                  setRisk(r);
                  sound.playCardDeal();
                }}
                className={`py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  risk === r
                    ? r === "HIGH"
                      ? "bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-lg shadow-rose-500/30 scale-[1.02]"
                      : r === "MEDIUM"
                      ? "bg-gradient-to-r from-amber-400 to-amber-500 text-black shadow-lg shadow-amber-500/30 scale-[1.02]"
                      : "bg-gradient-to-r from-cyan-400 to-cyan-500 text-black shadow-lg shadow-cyan-500/30 scale-[1.02]"
                    : "text-gray-400 hover:text-white hover:bg-slate-900"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Pyramid Pin Rows Selector */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-gray-400 px-1">
            <span className="uppercase tracking-wider">Pyramid Rows:</span>
            <span className="font-mono text-cyan-400">{rows} Rows Matrix</span>
          </div>

          <div className="grid grid-cols-5 gap-1.5 p-1 bg-[#040812] border border-slate-800/90 rounded-2xl">
            {[8, 10, 12, 14, 16].map((num) => (
              <button
                key={num}
                onClick={() => {
                  setRows(num);
                  sound.playCardDeal();
                }}
                className={`py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                  rows === num
                    ? "bg-cyan-500 text-black shadow-md shadow-cyan-500/30 font-black scale-[1.02]"
                    : "text-gray-400 hover:text-white hover:bg-slate-900"
                }`}
              >
                {num} Rows
              </button>
            ))}
          </div>
        </div>

        {/* 3. Bet Amount Input & Quick Chips */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-gray-400 px-1">
            <span className="uppercase tracking-wider">Bet Amount (INR):</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
            <div className="sm:col-span-4 flex items-center gap-1.5 bg-[#040812] border border-slate-800 rounded-2xl px-3 py-2">
              <span className="text-cyan-400 font-bold text-sm">₹</span>
              <input
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(Math.max(10, Number(e.target.value)))}
                className="w-full bg-transparent text-white font-mono font-bold text-sm focus:outline-none"
              />
            </div>

            <div className="sm:col-span-8 grid grid-cols-4 gap-1.5">
              {[20, 50, 100, 500].map((val) => (
                <button
                  key={val}
                  onClick={() => {
                    setBetAmount(val);
                    sound.playChipBet();
                  }}
                  className={`py-2 rounded-xl text-xs font-mono font-bold border transition-colors cursor-pointer ${
                    betAmount === val
                      ? "bg-cyan-500 text-black border-cyan-400 shadow-md shadow-cyan-500/20"
                      : "bg-[#040812] border-slate-800 text-gray-400 hover:text-white"
                  }`}
                >
                  ₹{val}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 4. Grand Primary DROP BALL Button + Multi-Drops */}
        <div className="grid grid-cols-12 gap-2 pt-1">
          <button
            onClick={dropBall}
            className="col-span-8 h-14 rounded-2xl bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 text-black font-black text-sm shadow-xl shadow-cyan-500/25 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer border border-cyan-300/40"
          >
            <CircleDot className="w-5 h-5 stroke-[2.5]" />
            <span className="uppercase tracking-wider font-extrabold text-black/90">DROP BALL</span>
            <span className="font-mono font-black text-base">₹{betAmount}</span>
          </button>

          {/* Quick Multi-Drops */}
          <button
            onClick={() => dropMultipleBalls(5)}
            className="col-span-2 h-14 rounded-2xl bg-slate-900 border border-slate-800 hover:border-cyan-500/40 text-cyan-300 text-xs font-black transition-all active:scale-95 flex flex-col items-center justify-center cursor-pointer shadow-md"
            title="Drop 5 Balls in sequence"
          >
            <Zap className="w-4 h-4 text-cyan-400" />
            <span>x5</span>
          </button>

          <button
            onClick={() => dropMultipleBalls(10)}
            className="col-span-2 h-14 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 text-amber-300 text-xs font-black transition-all active:scale-95 flex flex-col items-center justify-center cursor-pointer shadow-md"
            title="Drop 10 Balls in sequence"
          >
            <Flame className="w-4 h-4 text-amber-400" />
            <span>x10</span>
          </button>
        </div>

        {/* Win Celebration Banner */}
        {lastWin && (
          <div className="p-2.5 bg-emerald-950/70 border border-emerald-500/60 rounded-2xl text-emerald-300 font-bold text-xs flex items-center justify-center gap-2 animate-bounce shadow-lg">
            <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Landed {lastWin.multiplier}x! Won ₹{lastWin.amount.toLocaleString()}!</span>
          </div>
        )}
      </div>
    </div>
  );
};

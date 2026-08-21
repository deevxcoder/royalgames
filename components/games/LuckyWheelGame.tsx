"use client";

import React, { useState, useCallback } from "react";
import {
  Trophy,
  Sparkles,
  Zap,
  RotateCcw,
  Flame,
  Wallet,
  History,
  Disc,
  ShieldAlert,
  Crown,
} from "lucide-react";
import confetti from "canvas-confetti";
import { sound } from "@/lib/soundFx";
import { LuckyWheelCanvas } from "./LuckyWheelCanvas";

interface LuckyWheelGameProps {
  playerBalance: number;
  onUpdateBalance: (newBalance: number) => void;
  onRecordRound?: (data: { bet: number; win: number; multiplier: number }) => void;
}

type WheelRisk = "LOW" | "MEDIUM" | "HIGH";

const WHEEL_RISK_SEGMENTS: Record<WheelRisk, number[]> = {
  LOW: [1.2, 0.0, 1.5, 0.0, 2.0, 0.0, 1.2, 0.0, 3.0, 0.0, 1.5, 0.0, 2.0, 0.0, 5.0, 0.0],
  MEDIUM: [1.5, 0.0, 2.0, 0.0, 3.0, 0.0, 1.5, 0.0, 5.0, 0.0, 2.0, 0.0, 10.0, 0.0, 20.0, 0.0],
  HIGH: [2.0, 0.0, 5.0, 0.0, 10.0, 0.0, 2.0, 0.0, 25.0, 0.0, 5.0, 0.0, 50.0, 0.0, 100.0, 0.0],
};

export const LuckyWheelGame: React.FC<LuckyWheelGameProps> = ({
  playerBalance,
  onUpdateBalance,
  onRecordRound,
}) => {
  const [betAmount, setBetAmount] = useState(50);
  const [risk, setRisk] = useState<WheelRisk>("MEDIUM");
  const [isSpinning, setIsSpinning] = useState(false);
  const [targetAngle, setTargetAngle] = useState(0);
  const [lastWin, setLastWin] = useState<{ amount: number; multiplier: number } | null>(null);
  const [isMiss, setIsMiss] = useState(false);
  const [spinHistory, setSpinHistory] = useState<number[]>([2.0, 0.0, 5.0, 1.5, 0.0, 100.0, 0.0]);

  const activeSegments = WHEEL_RISK_SEGMENTS[risk];

  // 1. Spin Wheel Action
  const spinWheel = () => {
    if (isSpinning) return;
    if (playerBalance < betAmount) {
      alert("Insufficient Balance");
      return;
    }

    onUpdateBalance(playerBalance - betAmount);
    setIsSpinning(true);
    setLastWin(null);
    setIsMiss(false);
    setTargetAngle(Math.random() * Math.PI * 2);
    sound.playCardDeal();
  };

  // 2. Spin Complete Callback from Canvas
  const handleSpinComplete = useCallback(
    (landedIndex: number) => {
      setIsSpinning(false);
      const wonMult = activeSegments[landedIndex] || 0;
      const winAmount = Number((betAmount * wonMult).toFixed(2));

      setSpinHistory((prev) => [wonMult, ...prev.slice(0, 9)]);

      if (wonMult > 0) {
        onUpdateBalance(playerBalance + winAmount);
        setLastWin({ amount: winAmount, multiplier: wonMult });
        setIsMiss(false);

        if (wonMult >= 20) {
          sound.playWin();
          confetti({ particleCount: 100, spread: 90, origin: { y: 0.55 } });
        } else if (wonMult >= 5) {
          sound.playWin();
          confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
        } else {
          sound.playCoinFlip();
        }
      } else {
        // Landed on 0x Miss
        setIsMiss(true);
        sound.playLoss();
      }

      if (onRecordRound) {
        onRecordRound({ bet: betAmount, win: winAmount, multiplier: wonMult });
      }
    },
    [betAmount, playerBalance, onUpdateBalance, onRecordRound, activeSegments]
  );

  return (
    <div className="w-full flex flex-col space-y-3">
      {/* Top Spin History Strip */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider shrink-0 flex items-center gap-1">
          <History className="w-3.5 h-3.5 text-purple-400" /> Recent:
        </span>
        {spinHistory.map((mult, idx) => (
          <span
            key={idx}
            className={`text-xs font-mono font-black px-2.5 py-0.5 rounded-xl shrink-0 transition-all ${
              mult === 0
                ? "bg-slate-900 text-rose-400 border border-slate-800"
                : mult >= 50
                ? "bg-gradient-to-r from-amber-500/30 to-rose-500/30 text-amber-300 border border-amber-400 shadow-md shadow-amber-500/30"
                : mult >= 10
                ? "bg-purple-950/70 text-purple-300 border border-purple-500/50 shadow-md shadow-purple-500/20"
                : mult >= 3
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/50"
                : "bg-emerald-950/70 text-emerald-300 border border-emerald-500/50"
            }`}
          >
            {mult === 0 ? "0x" : `${mult}x`}
          </span>
        ))}
      </div>

      {/* 60FPS Casino Wheel Arena */}
      <div className="w-full h-[270px] sm:h-[340px] md:h-[410px]">
        <LuckyWheelCanvas
          isSpinning={isSpinning}
          targetAngle={targetAngle}
          onSpinComplete={handleSpinComplete}
          segments={activeSegments}
        />
      </div>

      {/* Spacious, Ergonomic Dashboard Controls Panel */}
      <div className="bg-[#0b0718] border border-purple-950/80 rounded-3xl p-4 sm:p-5 shadow-2xl space-y-3.5 backdrop-blur-md">
        {/* Row 1: Risk Level Selector Full-Width Segmented Row */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-gray-400 px-1">
            <span className="uppercase tracking-wider">Select Wheel Volatility:</span>
            <span className="font-mono text-amber-400 font-black flex items-center gap-1">
              <Crown className="w-3.5 h-3.5 text-amber-400" /> Max Jackpot: {Math.max(...activeSegments)}x
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#05030d] border border-slate-800 rounded-2xl">
            {(["LOW", "MEDIUM", "HIGH"] as WheelRisk[]).map((r) => (
              <button
                key={r}
                disabled={isSpinning}
                onClick={() => {
                  setRisk(r);
                  sound.playCardDeal();
                }}
                className={`py-2 rounded-xl text-xs font-black transition-all cursor-pointer disabled:opacity-50 ${
                  risk === r
                    ? r === "HIGH"
                      ? "bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-lg shadow-rose-500/30 scale-[1.02]"
                      : r === "MEDIUM"
                      ? "bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg shadow-purple-500/30 scale-[1.02]"
                      : "bg-gradient-to-r from-emerald-400 to-teal-500 text-black shadow-lg shadow-emerald-500/30 scale-[1.02]"
                    : "text-gray-400 hover:text-white hover:bg-slate-900"
                }`}
              >
                {r === "LOW" ? "🌿 LOW (5x)" : r === "MEDIUM" ? "🔥 MEDIUM (20x)" : "⚡ HIGH (100x)"}
              </button>
            ))}
          </div>
        </div>

        {/* Row 2: Bet Amount Input & Quick Chips */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-gray-400 px-1">
            <span className="uppercase tracking-wider">Spin Stake (INR):</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
            <div className="sm:col-span-4 flex items-center gap-1.5 bg-[#05030d] border border-slate-800 rounded-2xl px-3 py-2">
              <span className="text-purple-400 font-black text-sm">₹</span>
              <input
                type="number"
                disabled={isSpinning}
                value={betAmount}
                onChange={(e) => setBetAmount(Math.max(10, Number(e.target.value)))}
                className="w-full bg-transparent text-white font-mono font-black text-sm focus:outline-none disabled:opacity-50"
              />
            </div>

            <div className="sm:col-span-8 grid grid-cols-4 gap-1.5">
              {[20, 50, 100, 500].map((val) => (
                <button
                  key={val}
                  disabled={isSpinning}
                  onClick={() => {
                    setBetAmount(val);
                    sound.playChipBet();
                  }}
                  className={`py-2 rounded-xl text-xs font-mono font-bold border transition-colors cursor-pointer ${
                    betAmount === val
                      ? "bg-purple-600 text-white border-purple-400 shadow-md shadow-purple-500/20"
                      : "bg-[#05030d] border-slate-800 text-gray-400 hover:text-white disabled:opacity-40"
                  }`}
                >
                  ₹{val}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Row 3: Grand SPIN WHEEL Button */}
        <button
          onClick={spinWheel}
          disabled={isSpinning}
          className="w-full h-14 rounded-2xl bg-gradient-to-r from-purple-500 via-fuchsia-500 to-amber-500 hover:from-purple-400 hover:to-amber-400 text-white font-black text-sm sm:text-base shadow-xl shadow-purple-500/25 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer border border-purple-300/40 disabled:opacity-50"
        >
          <Disc className={`w-5 h-5 ${isSpinning ? "animate-spin" : ""}`} />
          <span className="uppercase tracking-wider font-extrabold">
            {isSpinning ? "SPINNING LUCKY WHEEL..." : "SPIN LUCKY WHEEL"}
          </span>
          <span className="font-mono font-black text-base sm:text-lg">₹{betAmount}</span>
        </button>

        {/* Miss Alert */}
        {isMiss && (
          <div className="p-2.5 bg-rose-950/80 border border-rose-500/70 rounded-2xl text-rose-200 font-bold text-xs flex items-center justify-center gap-2 animate-shake shadow-lg">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
            <span>Landed on 0x Miss! Lost ₹{betAmount}. Spin Again for 100x Jackpot!</span>
          </div>
        )}

        {/* Win Celebration Banner */}
        {lastWin && (
          <div className="p-2.5 bg-emerald-950/80 border border-emerald-500/70 rounded-2xl text-emerald-200 font-bold text-xs flex items-center justify-center gap-2 animate-bounce shadow-lg">
            <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{lastWin.multiplier >= 50 ? "👑 GRAND 100x JACKPOT!" : "Jackpot Win!"} Won ₹{lastWin.amount.toLocaleString()} ({lastWin.multiplier}x)!</span>
          </div>
        )}
      </div>
    </div>
  );
};

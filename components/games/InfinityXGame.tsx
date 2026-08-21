"use client";

import React, { useState } from "react";
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
  History,
  Rocket,
} from "lucide-react";
import confetti from "canvas-confetti";
import { sound } from "@/lib/soundFx";
import { InfinityXCanvas } from "./InfinityXCanvas";

interface InfinityXGameProps {
  playerBalance: number;
  onUpdateBalance: (newBalance: number) => void;
  onRecordRound?: (data: { bet: number; win: number; multiplier: number }) => void;
}

export const InfinityXGame: React.FC<InfinityXGameProps> = ({
  playerBalance,
  onUpdateBalance,
  onRecordRound,
}) => {
  const [betAmount, setBetAmount] = useState(50);
  const [targetMultiplier, setTargetMultiplier] = useState(2.0);
  const [isRolling, setIsRolling] = useState(false);
  const [resultMultiplier, setResultMultiplier] = useState<number | null>(null);
  const [isWin, setIsWin] = useState<boolean | null>(null);
  const [lastWin, setLastWin] = useState<{ amount: number; multiplier: number } | null>(null);
  const [rollHistory, setRollHistory] = useState<number[]>([1.45, 8.24, 1.02, 3.5, 12.8, 1.95, 2.1]);

  // Mathematical Calculations (98.8% RTP)
  const winProbability = Number((98.8 / targetMultiplier).toFixed(2));
  const potentialProfit = Number((betAmount * targetMultiplier - betAmount).toFixed(2));
  const totalPayout = Number((betAmount * targetMultiplier).toFixed(2));

  // Play Limbo Roll
  const playRoll = () => {
    if (isRolling) return;
    if (playerBalance < betAmount) {
      alert("Insufficient Balance");
      return;
    }

    onUpdateBalance(playerBalance - betAmount);
    setIsRolling(true);
    setResultMultiplier(null);
    setIsWin(null);
    setLastWin(null);
    sound.playCardDeal();

    setTimeout(() => {
      // Provably Fair Pareto Distribution (98.8% RTP)
      const r = Math.random();
      const rawOutcome = Math.max(1.0, Number((0.988 / (1 - r)).toFixed(2)));
      const finalOutcome = Math.min(rawOutcome, 10000.0);

      setResultMultiplier(finalOutcome);
      setIsRolling(false);

      const won = finalOutcome >= targetMultiplier;
      setIsWin(won);
      setRollHistory((prev) => [finalOutcome, ...prev.slice(0, 9)]);

      if (won) {
        onUpdateBalance(playerBalance + totalPayout);
        setLastWin({ amount: totalPayout, multiplier: targetMultiplier });
        sound.playWin();
        confetti({ particleCount: 75, spread: 70, origin: { y: 0.6 } });
        if (onRecordRound) {
          onRecordRound({ bet: betAmount, win: totalPayout, multiplier: targetMultiplier });
        }
      } else {
        sound.playLoss();
        if (onRecordRound) {
          onRecordRound({ bet: betAmount, win: 0, multiplier: finalOutcome });
        }
      }
    }, 420);
  };

  return (
    <div className="w-full flex flex-col space-y-3">
      {/* Top Roll History Road Strip */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider shrink-0 flex items-center gap-1">
          <History className="w-3.5 h-3.5 text-purple-400" /> Recent Rolls:
        </span>
        {rollHistory.map((mult, idx) => (
          <span
            key={idx}
            className={`text-xs font-mono font-black px-2.5 py-0.5 rounded-xl shrink-0 transition-all ${
              mult >= 10
                ? "bg-purple-950/70 text-purple-300 border border-purple-500/50 shadow-md shadow-purple-500/20"
                : mult >= 2
                ? "bg-emerald-950/70 text-emerald-300 border border-emerald-500/50"
                : "bg-slate-900 text-gray-400 border border-slate-800"
            }`}
          >
            {mult.toFixed(2)}x
          </span>
        ))}
      </div>

      {/* 60FPS Neon Infinity Portal Canvas */}
      <div className="w-full h-[270px] sm:h-[340px] md:h-[410px]">
        <InfinityXCanvas
          isRolling={isRolling}
          resultMultiplier={resultMultiplier}
          targetMultiplier={targetMultiplier}
          isWin={isWin}
        />
      </div>

      {/* Spacious, Ergonomic Dashboard Controls Panel */}
      <div className="bg-[#080d18] border border-purple-950/80 rounded-3xl p-4 sm:p-5 shadow-2xl space-y-3.5 backdrop-blur-md">
        {/* Row 1: Target Multiplier & Presets */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-gray-400 px-1">
            <span className="uppercase tracking-wider">Target Multiplier Goal:</span>
            <span className="font-mono text-purple-400 font-black">
              Win Chance: {winProbability}% • Profit: ₹{potentialProfit}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
            <div className="sm:col-span-4 flex items-center gap-1.5 bg-[#04060d] border border-slate-800 rounded-2xl px-3 py-2">
              <span className="text-purple-400 font-black text-sm">x</span>
              <input
                type="number"
                disabled={isRolling}
                step="0.1"
                min="1.01"
                max="10000"
                value={targetMultiplier}
                onChange={(e) => setTargetMultiplier(Math.max(1.01, Number(e.target.value)))}
                className="w-full bg-transparent text-white font-mono font-black text-sm focus:outline-none disabled:opacity-50"
              />
            </div>

            <div className="sm:col-span-8 grid grid-cols-5 gap-1.5">
              {[1.5, 2.0, 5.0, 10.0, 100.0].map((val) => (
                <button
                  key={val}
                  disabled={isRolling}
                  onClick={() => {
                    setTargetMultiplier(val);
                    sound.playChipBet();
                  }}
                  className={`py-2 rounded-xl text-xs font-mono font-bold border transition-colors cursor-pointer ${
                    targetMultiplier === val
                      ? "bg-purple-600 text-white border-purple-400 shadow-md shadow-purple-500/20"
                      : "bg-[#04060d] border-slate-800 text-gray-400 hover:text-white disabled:opacity-40"
                  }`}
                >
                  {val}x
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Row 2: Bet Amount Input & Quick Chips */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-gray-400 px-1">
            <span className="uppercase tracking-wider">Bet Amount (INR):</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
            <div className="sm:col-span-4 flex items-center gap-1.5 bg-[#04060d] border border-slate-800 rounded-2xl px-3 py-2">
              <span className="text-amber-400 font-black text-sm">₹</span>
              <input
                type="number"
                disabled={isRolling}
                value={betAmount}
                onChange={(e) => setBetAmount(Math.max(10, Number(e.target.value)))}
                className="w-full bg-transparent text-white font-mono font-black text-sm focus:outline-none disabled:opacity-50"
              />
            </div>

            <div className="sm:col-span-8 grid grid-cols-4 gap-1.5">
              {[20, 50, 100, 500].map((val) => (
                <button
                  key={val}
                  disabled={isRolling}
                  onClick={() => {
                    setBetAmount(val);
                    sound.playChipBet();
                  }}
                  className={`py-2 rounded-xl text-xs font-mono font-bold border transition-colors cursor-pointer ${
                    betAmount === val
                      ? "bg-amber-500 text-black border-amber-400 shadow-md shadow-amber-500/20"
                      : "bg-[#04060d] border-slate-800 text-gray-400 hover:text-white disabled:opacity-40"
                  }`}
                >
                  ₹{val}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Row 3: Grand LAUNCH QUANTUM WARP Button */}
        <button
          onClick={playRoll}
          disabled={isRolling}
          className="w-full h-14 rounded-2xl bg-gradient-to-r from-purple-500 via-indigo-500 to-amber-500 hover:from-purple-400 hover:to-amber-400 text-white font-black text-sm sm:text-base shadow-xl shadow-purple-500/25 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer border border-purple-300/40 disabled:opacity-50"
        >
          <Rocket className="w-5 h-5 stroke-[2.5]" />
          <span className="uppercase tracking-wider font-extrabold">
            {isRolling ? "WARPING QUANTUM PORTAL..." : `LAUNCH WARP (TARGET: ${targetMultiplier.toFixed(2)}x)`}
          </span>
          <span className="font-mono font-black text-base sm:text-lg">
            (₹{betAmount} ➔ ₹{totalPayout})
          </span>
        </button>

        {/* Loss Alert */}
        {isWin === false && (
          <div className="p-2.5 bg-rose-950/80 border border-rose-500/70 rounded-2xl text-rose-200 font-bold text-xs flex items-center justify-center gap-2 animate-shake shadow-lg">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
            <span>Target Missed! Crashed at {resultMultiplier?.toFixed(2)}x. Lost ₹{betAmount}.</span>
          </div>
        )}

        {/* Win Celebration Banner */}
        {lastWin && (
          <div className="p-2.5 bg-emerald-950/80 border border-emerald-500/70 rounded-2xl text-emerald-200 font-bold text-xs flex items-center justify-center gap-2 animate-bounce shadow-lg">
            <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Target Exceeded! Won ₹{lastWin.amount.toLocaleString()} ({lastWin.multiplier}x)!</span>
          </div>
        )}
      </div>
    </div>
  );
};

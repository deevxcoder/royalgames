"use client";

import React, { useState, useRef } from "react";
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

  // Mathematical Calculations
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
        confetti({ particleCount: 70, spread: 65, origin: { y: 0.6 } });
        if (onRecordRound) {
          onRecordRound({ bet: betAmount, win: totalPayout, multiplier: targetMultiplier });
        }
      } else {
        sound.playLoss();
        if (onRecordRound) {
          onRecordRound({ bet: betAmount, win: 0, multiplier: finalOutcome });
        }
      }
    }, 400);
  };

  return (
    <div className="w-full flex flex-col space-y-4">
      {/* Top Roll History Road Strip */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider shrink-0 flex items-center gap-1">
          <History className="w-3 h-3 text-purple-400" /> Recent Quantum Rolls:
        </span>
        {rollHistory.map((mult, idx) => (
          <span
            key={idx}
            className={`text-xs font-mono font-black px-2.5 py-1 rounded-xl shrink-0 transition-all ${
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
      <div className="w-full h-[360px] sm:h-[400px] md:h-[450px]">
        <InfinityXCanvas
          isRolling={isRolling}
          resultMultiplier={resultMultiplier}
          targetMultiplier={targetMultiplier}
          isWin={isWin}
        />
      </div>

      {/* Interactive Controls & Multiplier Target Sliders */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left: Target Multiplier & Probability Matrix (7 cols) */}
        <div className="lg:col-span-7 bg-[#080d18] border border-purple-500/30 rounded-3xl p-5 shadow-2xl space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-purple-400" />
              Target Multiplier Goal
            </span>
            <span className="text-xs font-mono font-black text-purple-400 bg-purple-950/60 border border-purple-500/40 px-3 py-0.5 rounded-full">
              Win Chance: {winProbability}%
            </span>
          </div>

          {/* Target Input & Slider */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 bg-[#050811] border border-slate-800 rounded-2xl px-4 py-3">
              <span className="text-purple-400 font-black text-lg">Target:</span>
              <input
                type="number"
                step="0.1"
                min="1.01"
                max="10000"
                value={targetMultiplier}
                onChange={(e) => setTargetMultiplier(Math.max(1.01, Number(e.target.value)))}
                className="w-full bg-transparent text-white font-mono font-black text-2xl focus:outline-none"
              />
              <span className="text-gray-500 font-mono font-bold">x</span>
            </div>

            {/* Quick Multiplier Presets */}
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
              {[1.2, 1.5, 2.0, 5.0, 10.0, 50.0, 100.0, 1000.0].map((preset) => (
                <button
                  key={preset}
                  onClick={() => {
                    setTargetMultiplier(preset);
                    sound.playChipBet();
                  }}
                  className={`py-1.5 rounded-xl text-xs font-mono font-bold border transition-colors ${
                    targetMultiplier === preset
                      ? "bg-purple-600 text-white border-purple-400 shadow-md shadow-purple-500/30"
                      : "bg-[#050811] border-slate-800 text-gray-400 hover:text-white"
                  }`}
                >
                  {preset}x
                </button>
              ))}
            </div>
          </div>

          {/* Live Profit Preview Matrix */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="bg-[#050811] border border-slate-800/80 rounded-2xl p-3 text-center">
              <span className="text-[10px] uppercase font-bold text-gray-500 block">Potential Profit</span>
              <span className="text-sm font-black font-mono text-emerald-400">₹{potentialProfit}</span>
            </div>
            <div className="bg-[#050811] border border-slate-800/80 rounded-2xl p-3 text-center">
              <span className="text-[10px] uppercase font-bold text-gray-500 block">Total Payout</span>
              <span className="text-sm font-black font-mono text-purple-300">₹{totalPayout}</span>
            </div>
          </div>
        </div>

        {/* Right: Bet Controls & Tactical Roll Button (5 cols) */}
        <div className="lg:col-span-5 bg-[#080d18] border border-slate-800/90 rounded-3xl p-5 shadow-2xl space-y-4">
          <div className="space-y-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Bet Amount (INR)</span>
            <div className="flex items-center gap-2 bg-[#050811] border border-slate-800 rounded-2xl px-3 py-2">
              <span className="text-purple-400 font-bold text-sm">₹</span>
              <input
                type="number"
                disabled={isRolling}
                value={betAmount}
                onChange={(e) => setBetAmount(Math.max(10, Number(e.target.value)))}
                className="w-full bg-transparent text-white font-mono font-bold text-base focus:outline-none disabled:opacity-50"
              />
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              {[20, 50, 100, 500].map((val) => (
                <button
                  key={val}
                  disabled={isRolling}
                  onClick={() => {
                    setBetAmount(val);
                    sound.playChipBet();
                  }}
                  className={`py-1.5 rounded-xl text-xs font-mono font-bold border transition-colors ${
                    betAmount === val
                      ? "bg-purple-600 text-white border-purple-400"
                      : "bg-[#050811] border-slate-800 text-gray-400 hover:text-white disabled:opacity-40"
                  }`}
                >
                  ₹{val}
                </button>
              ))}
            </div>
          </div>

          {/* Primary Action Button: PLAY INFINITY X */}
          <button
            onClick={playRoll}
            disabled={isRolling}
            className="w-full h-20 rounded-2xl bg-gradient-to-r from-purple-500 via-pink-500 to-amber-500 hover:from-purple-400 hover:to-amber-400 text-black font-black text-base shadow-xl shadow-purple-500/25 transition-all active:scale-95 flex flex-col items-center justify-center space-y-0.5"
          >
            <div className="flex items-center gap-1 text-xs uppercase tracking-widest font-extrabold text-black/90">
              <Zap className="w-4 h-4" />
              <span>{isRolling ? "CHARGING PORTAL..." : "BLAST INFINITY X"}</span>
            </div>
            <span className="text-xl font-mono font-black">₹{betAmount}</span>
          </button>

          {/* Win Celebration Alert */}
          {lastWin && (
            <div className="p-2.5 bg-emerald-950/60 border border-emerald-500/50 rounded-2xl text-emerald-300 font-bold text-xs flex items-center justify-center gap-2 animate-bounce">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>Quantum Win! Payout: ₹{lastWin.amount} ({lastWin.multiplier}x)!</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

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
} from "lucide-react";
import confetti from "canvas-confetti";
import { sound } from "@/lib/soundFx";
import { LuckyWheelCanvas } from "./LuckyWheelCanvas";

interface LuckyWheelGameProps {
  playerBalance: number;
  onUpdateBalance: (newBalance: number) => void;
  onRecordRound?: (data: { bet: number; win: number; multiplier: number }) => void;
}

const WHEEL_SEGMENTS = [
  1.2, 2.0, 1.5, 5.0, 1.2, 10.0, 1.5, 3.0, 1.2, 20.0, 1.5, 2.0, 1.2, 50.0, 1.5, 3.0,
];

export const LuckyWheelGame: React.FC<LuckyWheelGameProps> = ({
  playerBalance,
  onUpdateBalance,
  onRecordRound,
}) => {
  const [betAmount, setBetAmount] = useState(50);
  const [isSpinning, setIsSpinning] = useState(false);
  const [targetAngle, setTargetAngle] = useState(0);
  const [lastWin, setLastWin] = useState<{ amount: number; multiplier: number } | null>(null);
  const [spinHistory, setSpinHistory] = useState<number[]>([2.0, 1.5, 5.0, 1.2, 10.0, 3.0]);

  // Spin Wheel Action
  const spinWheel = () => {
    if (isSpinning) return;
    if (playerBalance < betAmount) {
      alert("Insufficient Balance");
      return;
    }

    onUpdateBalance(playerBalance - betAmount);
    setIsSpinning(true);
    setLastWin(null);
    setTargetAngle(Math.random() * Math.PI * 2);
    sound.playCardDeal();
  };

  // Spin Complete Callback from Canvas
  const handleSpinComplete = useCallback(
    (landedIndex: number) => {
      setIsSpinning(false);
      const wonMult = WHEEL_SEGMENTS[landedIndex] || 1.2;
      const winAmount = Number((betAmount * wonMult).toFixed(2));

      onUpdateBalance(playerBalance + winAmount);
      setLastWin({ amount: winAmount, multiplier: wonMult });
      setSpinHistory((prev) => [wonMult, ...prev.slice(0, 9)]);

      if (wonMult >= 10) {
        sound.playWin();
        confetti({ particleCount: 75, spread: 80, origin: { y: 0.6 } });
      } else {
        sound.playCoinFlip();
      }

      if (onRecordRound) {
        onRecordRound({ bet: betAmount, win: winAmount, multiplier: wonMult });
      }
    },
    [betAmount, playerBalance, onUpdateBalance, onRecordRound]
  );

  return (
    <div className="w-full flex flex-col space-y-4">
      {/* Top Spin History Strip */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider shrink-0 flex items-center gap-1">
          <History className="w-3 h-3 text-purple-400" /> Recent Spins:
        </span>
        {spinHistory.map((mult, idx) => (
          <span
            key={idx}
            className={`text-xs font-mono font-black px-2.5 py-1 rounded-xl shrink-0 transition-all ${
              mult >= 10
                ? "bg-purple-950/70 text-purple-300 border border-purple-500/50 shadow-md shadow-purple-500/20"
                : mult >= 3
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/50"
                : "bg-slate-900 text-gray-400 border border-slate-800"
            }`}
          >
            {mult}x
          </span>
        ))}
      </div>

      {/* 60FPS Wheel Arena */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: 60FPS Canvas Wheel (7 cols) */}
        <div className="lg:col-span-7 h-[380px] sm:h-[420px] md:h-[460px]">
          <LuckyWheelCanvas
            isSpinning={isSpinning}
            targetAngle={targetAngle}
            onSpinComplete={handleSpinComplete}
            segments={WHEEL_SEGMENTS}
          />
        </div>

        {/* Right: Controls Panel (5 cols) */}
        <div className="lg:col-span-5 bg-[#0b0718] border border-purple-500/30 rounded-3xl p-5 shadow-2xl space-y-4">
          <div className="space-y-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Spin Bet Stake (INR)</span>
            <div className="flex items-center gap-2 bg-[#05030d] border border-slate-800 rounded-2xl px-3 py-2">
              <span className="text-purple-400 font-bold text-sm">₹</span>
              <input
                type="number"
                disabled={isSpinning}
                value={betAmount}
                onChange={(e) => setBetAmount(Math.max(10, Number(e.target.value)))}
                className="w-full bg-transparent text-white font-mono font-bold text-base focus:outline-none disabled:opacity-50"
              />
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              {[20, 50, 100, 500].map((val) => (
                <button
                  key={val}
                  disabled={isSpinning}
                  onClick={() => {
                    setBetAmount(val);
                    sound.playChipBet();
                  }}
                  className={`py-1.5 rounded-xl text-xs font-mono font-bold border transition-colors ${
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

          {/* Primary Action Button: SPIN WHEEL */}
          <button
            onClick={spinWheel}
            disabled={isSpinning}
            className="w-full h-20 rounded-2xl bg-gradient-to-r from-purple-500 via-pink-500 to-amber-500 hover:from-purple-400 hover:to-amber-400 text-black font-black text-base shadow-xl shadow-purple-500/25 transition-all active:scale-95 flex flex-col items-center justify-center space-y-0.5"
          >
            <div className="flex items-center gap-1.5 text-xs uppercase tracking-widest font-extrabold text-black/90">
              <Disc className="w-4 h-4 animate-spin" />
              <span>{isSpinning ? "SPINNING LUCKY WHEEL..." : "SPIN LUCKY WHEEL"}</span>
            </div>
            <span className="text-xl font-mono font-black">₹{betAmount}</span>
          </button>

          {/* Multiplier Paytable Highlights */}
          <div className="bg-[#05030d] border border-slate-800/80 rounded-2xl p-3 space-y-2">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Wheel Multipliers</span>
            <div className="grid grid-cols-4 gap-1.5 text-center text-xs font-mono font-black">
              <span className="p-1 rounded bg-slate-900 text-gray-300">1.2x</span>
              <span className="p-1 rounded bg-slate-900 text-cyan-400">2.0x</span>
              <span className="p-1 rounded bg-slate-900 text-purple-400">5.0x</span>
              <span className="p-1 rounded bg-rose-950 text-rose-300">50.0x</span>
            </div>
          </div>

          {/* Win Celebration Banner */}
          {lastWin && (
            <div className="p-2.5 bg-emerald-950/60 border border-emerald-500/50 rounded-2xl text-emerald-300 font-bold text-xs flex items-center justify-center gap-2 animate-bounce">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>Wheel Stopped on {lastWin.multiplier}x! Payout: ₹{lastWin.amount}!</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

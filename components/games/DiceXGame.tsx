"use client";

import React, { useState } from "react";
import {
  Dice5,
  Sparkles,
  Zap,
  Sliders,
  RotateCcw,
  Trophy,
  ShieldAlert,
  Flame,
  Wallet,
  History,
  TrendingUp,
} from "lucide-react";
import confetti from "canvas-confetti";
import { sound } from "@/lib/soundFx";

interface DiceXGameProps {
  playerBalance: number;
  onUpdateBalance: (newBalance: number) => void;
  onRecordRound?: (data: { bet: number; win: number; multiplier: number }) => void;
}

export const DiceXGame: React.FC<DiceXGameProps> = ({
  playerBalance,
  onUpdateBalance,
  onRecordRound,
}) => {
  const [betAmount, setBetAmount] = useState(50);
  const [targetNumber, setTargetNumber] = useState(50);
  const [rollMode, setRollMode] = useState<"OVER" | "UNDER">("OVER");
  const [isRolling, setIsRolling] = useState(false);
  const [diceResult, setDiceResult] = useState<number | null>(null);
  const [isWin, setIsWin] = useState<boolean | null>(null);
  const [lastWin, setLastWin] = useState<{ amount: number; multiplier: number } | null>(null);
  const [diceHistory, setDiceHistory] = useState<number[]>([64, 18, 85, 42, 91, 55, 33]);

  // Win Probability & Multiplier Math (99.0% RTP)
  const winChance = rollMode === "OVER" ? 100 - targetNumber : targetNumber;
  const multiplier = Number((99.0 / winChance).toFixed(2));
  const totalPayout = Number((betAmount * multiplier).toFixed(2));
  const profitOnWin = Number((totalPayout - betAmount).toFixed(2));

  // Roll Dice Action
  const rollDice = () => {
    if (isRolling) return;
    if (playerBalance < betAmount) {
      alert("Insufficient Balance");
      return;
    }

    onUpdateBalance(playerBalance - betAmount);
    setIsRolling(true);
    setDiceResult(null);
    setIsWin(null);
    setLastWin(null);
    sound.playCardDeal();

    setTimeout(() => {
      // 1 to 100 Integer Roll
      const roll = Math.floor(Math.random() * 100) + 1;
      setDiceResult(roll);
      setIsRolling(false);

      const won = rollMode === "OVER" ? roll > targetNumber : roll < targetNumber;
      setIsWin(won);
      setDiceHistory((prev) => [roll, ...prev.slice(0, 9)]);

      if (won) {
        onUpdateBalance(playerBalance + totalPayout);
        setLastWin({ amount: totalPayout, multiplier });
        sound.playWin();
        confetti({ particleCount: 65, spread: 65, origin: { y: 0.6 } });
        if (onRecordRound) {
          onRecordRound({ bet: betAmount, win: totalPayout, multiplier });
        }
      } else {
        sound.playLoss();
        if (onRecordRound) {
          onRecordRound({ bet: betAmount, win: 0, multiplier: 0 });
        }
      }
    }, 380);
  };

  return (
    <div className="w-full flex flex-col space-y-4">
      {/* Top History Strip */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider shrink-0 flex items-center gap-1">
          <History className="w-3 h-3 text-amber-400" /> Recent Rolls:
        </span>
        {diceHistory.map((num, idx) => (
          <span
            key={idx}
            className={`text-xs font-mono font-black px-2.5 py-1 rounded-xl shrink-0 transition-all ${
              num > 50
                ? "bg-emerald-950/70 text-emerald-300 border border-emerald-500/50"
                : "bg-rose-950/70 text-rose-300 border border-rose-500/50"
            }`}
          >
            {num}
          </span>
        ))}
      </div>

      {/* 60FPS Digital Dice Arena */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Interactive Probability Table & Result Display (7 cols) */}
        <div className="lg:col-span-7 bg-[#080d1a] border border-amber-500/20 rounded-3xl p-6 shadow-2xl flex flex-col items-center justify-center space-y-6 relative overflow-hidden">
          <div className="text-center space-y-1">
            <span className="text-xs text-amber-400 font-mono font-bold tracking-widest uppercase flex items-center justify-center gap-1.5">
              <Dice5 className="w-4 h-4" /> DIGITAL PROBABILITY TABLE • 99.0% RTP
            </span>

            {/* Giant Outcome Display */}
            <div className="text-7xl sm:text-8xl font-black font-mono tracking-tight drop-shadow-[0_10px_35px_rgba(245,158,11,0.3)]">
              {isRolling ? (
                <span className="text-amber-400 animate-pulse">{(Math.random() * 99 + 1).toFixed(0)}</span>
              ) : diceResult !== null ? (
                <span className={isWin ? "text-emerald-400 animate-bounce" : "text-rose-500"}>
                  {diceResult}
                </span>
              ) : (
                <span className="text-white">{targetNumber}</span>
              )}
            </div>

            <div className="text-xs font-mono font-bold text-gray-400">
              {isRolling
                ? "GENERATING QUANTUM RANDOMNESS..."
                : isWin === true
                ? `WON! RESULT ${diceResult} MET CONDITION`
                : isWin === false
                ? `MISSED TARGET! RESULT WAS ${diceResult}`
                : `ROLL ${rollMode} ${targetNumber} TO WIN`}
            </div>
          </div>

          {/* Interactive 0–100 Probability Slider Bar */}
          <div className="w-full max-w-md bg-[#050811] border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setRollMode("OVER");
                    sound.playCardDeal();
                  }}
                  className={`px-3.5 py-1.5 rounded-xl font-black transition-all ${
                    rollMode === "OVER"
                      ? "bg-amber-500 text-black shadow-md shadow-amber-500/30"
                      : "bg-slate-900 text-gray-400 border border-slate-800"
                  }`}
                >
                  Roll Over
                </button>
                <button
                  onClick={() => {
                    setRollMode("UNDER");
                    sound.playCardDeal();
                  }}
                  className={`px-3.5 py-1.5 rounded-xl font-black transition-all ${
                    rollMode === "UNDER"
                      ? "bg-amber-500 text-black shadow-md shadow-amber-500/30"
                      : "bg-slate-900 text-gray-400 border border-slate-800"
                  }`}
                >
                  Roll Under
                </button>
              </div>

              <span className="font-mono text-emerald-400 font-black text-sm">
                {multiplier}x Payout
              </span>
            </div>

            {/* Slider Track with Dynamic Gradient */}
            <div className="space-y-2">
              <input
                type="range"
                min={5}
                max={95}
                value={targetNumber}
                onChange={(e) => setTargetNumber(Number(e.target.value))}
                className="w-full h-3 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />

              <div className="flex items-center justify-between text-[11px] font-mono text-gray-400 font-bold">
                <span>0</span>
                <span>25</span>
                <span>50</span>
                <span>75</span>
                <span>100</span>
              </div>
            </div>

            {/* Probability Stats Strip */}
            <div className="grid grid-cols-3 gap-2 pt-1 text-center">
              <div className="bg-[#080d1a] border border-slate-800/80 rounded-xl p-2">
                <span className="text-[9px] uppercase font-bold text-gray-500 block">Win Chance</span>
                <span className="text-xs font-black font-mono text-cyan-400">{winChance}%</span>
              </div>
              <div className="bg-[#080d1a] border border-slate-800/80 rounded-xl p-2">
                <span className="text-[9px] uppercase font-bold text-gray-500 block">Multiplier</span>
                <span className="text-xs font-black font-mono text-amber-400">{multiplier}x</span>
              </div>
              <div className="bg-[#080d1a] border border-slate-800/80 rounded-xl p-2">
                <span className="text-[9px] uppercase font-bold text-gray-500 block">Profit</span>
                <span className="text-xs font-black font-mono text-emerald-400">₹{profitOnWin}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Bet Controls & Roll Button (5 cols) */}
        <div className="lg:col-span-5 bg-[#080d1a] border border-slate-800/90 rounded-3xl p-5 shadow-2xl space-y-4">
          <div className="space-y-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Bet Stake (INR)</span>
            <div className="flex items-center gap-2 bg-[#050811] border border-slate-800 rounded-2xl px-3 py-2">
              <span className="text-amber-400 font-bold text-sm">₹</span>
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
                      ? "bg-amber-500 text-black border-amber-400 shadow-md shadow-amber-500/20"
                      : "bg-[#050811] border-slate-800 text-gray-400 hover:text-white disabled:opacity-40"
                  }`}
                >
                  ₹{val}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Target Number Presets */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Quick Target Targets</span>
            <div className="grid grid-cols-4 gap-1.5">
              {[25, 50, 75, 90].map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    setTargetNumber(t);
                    sound.playChipBet();
                  }}
                  className={`py-1.5 rounded-xl text-xs font-mono font-bold border transition-colors ${
                    targetNumber === t
                      ? "bg-amber-500 text-black border-amber-400"
                      : "bg-[#050811] border-slate-800 text-gray-400 hover:text-white"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Primary Action Button: ROLL DICE */}
          <button
            onClick={rollDice}
            disabled={isRolling}
            className="w-full h-20 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-base shadow-xl shadow-amber-500/25 transition-all active:scale-95 flex flex-col items-center justify-center space-y-0.5"
          >
            <div className="flex items-center gap-1.5 text-xs uppercase tracking-widest font-extrabold text-black/90">
              <Dice5 className="w-4 h-4" />
              <span>{isRolling ? "ROLLING 3D DICE..." : `ROLL ${rollMode} ${targetNumber}`}</span>
            </div>
            <span className="text-xl font-mono font-black">₹{betAmount}</span>
          </button>

          {/* Win Celebration Banner */}
          {lastWin && (
            <div className="p-2.5 bg-emerald-950/60 border border-emerald-500/50 rounded-2xl text-emerald-300 font-bold text-xs flex items-center justify-center gap-2 animate-bounce">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>Roll Win! Payout: ₹{lastWin.amount} ({lastWin.multiplier}x)!</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

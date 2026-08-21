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
  Percent,
} from "lucide-react";
import confetti from "canvas-confetti";
import { sound } from "@/lib/soundFx";
import { DiceXCanvas } from "./DiceXCanvas";

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
    }, 420);
  };

  return (
    <div className="w-full flex flex-col space-y-3">
      {/* Top History Strip */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider shrink-0 flex items-center gap-1">
          <History className="w-3.5 h-3.5 text-amber-400" /> Recent:
        </span>
        {diceHistory.map((num, idx) => (
          <span
            key={idx}
            className={`text-xs font-mono font-black px-2.5 py-0.5 rounded-xl shrink-0 transition-all ${
              num > 50
                ? "bg-emerald-950/70 text-emerald-300 border border-emerald-500/50"
                : "bg-rose-950/70 text-rose-300 border border-rose-500/50"
            }`}
          >
            {num}
          </span>
        ))}
      </div>

      {/* 60FPS 3D Animated Dice Stage */}
      <div className="w-full h-[270px] sm:h-[340px] md:h-[420px]">
        <DiceXCanvas
          isRolling={isRolling}
          diceResult={diceResult}
          targetNumber={targetNumber}
          rollMode={rollMode}
          isWin={isWin}
        />
      </div>

      {/* Spacious, Ergonomic Dashboard Controls Panel */}
      <div className="bg-[#080d1a] border border-slate-800/90 rounded-3xl p-4 sm:p-5 shadow-2xl space-y-3.5 backdrop-blur-md">
        {/* Row 1: Roll Mode Switcher & Stats Strip */}
        <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
          {/* Roll Over / Roll Under Switcher */}
          <div className="flex items-center gap-1 p-1 bg-[#040812] border border-slate-800 rounded-2xl flex-1 max-w-xs">
            <button
              onClick={() => {
                setRollMode("OVER");
                sound.playCardDeal();
              }}
              className={`flex-1 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                rollMode === "OVER"
                  ? "bg-gradient-to-r from-amber-400 to-amber-500 text-black shadow-md shadow-amber-500/20 scale-[1.02]"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Roll Over 🔼
            </button>
            <button
              onClick={() => {
                setRollMode("UNDER");
                sound.playCardDeal();
              }}
              className={`flex-1 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                rollMode === "UNDER"
                  ? "bg-gradient-to-r from-amber-400 to-amber-500 text-black shadow-md shadow-amber-500/20 scale-[1.02]"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Roll Under 🔽
            </button>
          </div>

          {/* Multiplier & Win Chance Badges */}
          <div className="flex items-center gap-2 font-mono">
            <div className="bg-[#040812] border border-slate-800 rounded-xl px-3 py-1 text-center">
              <span className="text-[9px] uppercase font-bold text-gray-500 block">Win Chance</span>
              <span className="text-xs font-black text-cyan-400">{winChance}%</span>
            </div>
            <div className="bg-[#040812] border border-slate-800 rounded-xl px-3 py-1 text-center">
              <span className="text-[9px] uppercase font-bold text-gray-500 block">Multiplier</span>
              <span className="text-xs font-black text-amber-400">{multiplier}x</span>
            </div>
          </div>
        </div>

        {/* Row 2: Interactive Probability Slider & Target Presets */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-gray-400 px-1">
            <span className="uppercase tracking-wider">Target Threshold: {targetNumber}</span>
            <span className="font-mono text-emerald-400">Profit: ₹{profitOnWin}</span>
          </div>

          <div className="p-2.5 bg-[#040812] border border-slate-800 rounded-2xl space-y-2">
            <input
              type="range"
              min={5}
              max={95}
              value={targetNumber}
              onChange={(e) => setTargetNumber(Number(e.target.value))}
              className="w-full h-3 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />

            {/* Quick Target Number Presets */}
            <div className="grid grid-cols-4 gap-1.5 pt-1">
              {[25, 50, 75, 90].map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    setTargetNumber(t);
                    sound.playChipBet();
                  }}
                  className={`py-1 rounded-xl text-xs font-mono font-bold border transition-colors cursor-pointer ${
                    targetNumber === t
                      ? "bg-amber-500 text-black border-amber-400 shadow-md shadow-amber-500/20"
                      : "bg-[#080d1a] border-slate-800 text-gray-400 hover:text-white"
                  }`}
                >
                  Target {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Row 3: Bet Amount Input & Quick Chips */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-gray-400 px-1">
            <span className="uppercase tracking-wider">Bet Amount (INR):</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
            <div className="sm:col-span-4 flex items-center gap-1.5 bg-[#040812] border border-slate-800 rounded-2xl px-3 py-2">
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
                      : "bg-[#040812] border-slate-800 text-gray-400 hover:text-white disabled:opacity-40"
                  }`}
                >
                  ₹{val}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Row 4: Grand Primary ROLL DICE Button */}
        <button
          onClick={rollDice}
          disabled={isRolling}
          className="w-full h-14 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-black font-black text-sm sm:text-base shadow-xl shadow-amber-500/25 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer border border-amber-300/40 disabled:opacity-50"
        >
          <Dice5 className="w-5 h-5 stroke-[2.5]" />
          <span className="uppercase tracking-wider font-extrabold text-black/90">
            {isRolling ? "ROLLING 3D DICE..." : `ROLL ${rollMode} ${targetNumber}`}
          </span>
          <span className="font-mono font-black text-base sm:text-lg">
            (₹{betAmount} ➔ ₹{totalPayout})
          </span>
        </button>

        {/* Win Celebration Banner */}
        {lastWin && (
          <div className="p-2.5 bg-emerald-950/70 border border-emerald-500/60 rounded-2xl text-emerald-300 font-bold text-xs flex items-center justify-center gap-2 animate-bounce shadow-lg">
            <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Roll Win! Won ₹{lastWin.amount.toLocaleString()} ({lastWin.multiplier}x)!</span>
          </div>
        )}
      </div>
    </div>
  );
};

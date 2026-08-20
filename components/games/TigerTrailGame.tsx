"use client";

import React, { useState } from "react";
import {
  ChevronRight,
  ShieldAlert,
  Sparkles,
  Trophy,
  Flame,
  RotateCcw,
  Zap,
  TrendingUp,
  Award,
  Wallet,
  Compass,
} from "lucide-react";
import confetti from "canvas-confetti";
import { sound } from "@/lib/soundFx";
import { TigerTrailCanvas } from "./TigerTrailCanvas";

interface TigerTrailGameProps {
  playerBalance: number;
  onUpdateBalance: (newBalance: number) => void;
  onRecordRound?: (data: { bet: number; win: number; multiplier: number }) => void;
}

type Difficulty = "EASY" | "MEDIUM" | "HARD" | "EXTREME";

const DIFFICULTY_CONFIG = {
  EASY: {
    steps: [1.15, 1.35, 1.6, 1.95, 2.45, 3.2, 4.3, 6.0, 9.0, 15.0],
    winRate: 0.88,
    badgeColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
  },
  MEDIUM: {
    steps: [1.25, 1.6, 2.1, 2.85, 4.0, 6.0, 9.5, 16.0, 30.0, 65.0],
    winRate: 0.78,
    badgeColor: "bg-amber-500/20 text-amber-400 border-amber-500/40",
  },
  HARD: {
    steps: [1.45, 2.2, 3.5, 5.8, 10.5, 20.0, 42.0, 95.0, 220.0, 500.0],
    winRate: 0.65,
    badgeColor: "bg-rose-500/20 text-rose-400 border-rose-500/40",
  },
  EXTREME: {
    steps: [1.8, 3.5, 7.5, 18.0, 45.0, 120.0, 320.0, 850.0, 1500.0, 2500.0],
    winRate: 0.52,
    badgeColor: "bg-purple-500/20 text-purple-400 border-purple-500/40",
  },
};

export const TigerTrailGame: React.FC<TigerTrailGameProps> = ({
  playerBalance,
  onUpdateBalance,
  onRecordRound,
}) => {
  const [betAmount, setBetAmount] = useState(50);
  const [difficulty, setDifficulty] = useState<Difficulty>("MEDIUM");
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isWinner, setIsWinner] = useState(false);
  const [isStepping, setIsStepping] = useState(false);
  const [lastWin, setLastWin] = useState<{ amount: number; multiplier: number } | null>(null);

  const activeSteps = DIFFICULTY_CONFIG[difficulty].steps;
  const currentMultiplier = currentStep === 0 ? 1.0 : activeSteps[currentStep - 1];
  const nextMultiplier = currentStep < 10 ? activeSteps[currentStep] : activeSteps[9];
  const currentCashoutValue = Number((betAmount * currentMultiplier).toFixed(2));
  const safeChancePercent = Math.round(DIFFICULTY_CONFIG[difficulty].winRate * 100);

  // 1. Start New Expedition
  const startExpedition = () => {
    if (playerBalance < betAmount) {
      alert("Insufficient Balance");
      return;
    }

    onUpdateBalance(playerBalance - betAmount);
    setCurrentStep(0);
    setIsPlaying(true);
    setIsGameOver(false);
    setIsWinner(false);
    setLastWin(null);
    sound.playCardDeal();
  };

  // 2. Step Forward across river
  const stepForward = () => {
    if (!isPlaying || isStepping || currentStep >= 10) return;
    setIsStepping(true);

    const isSafe = Math.random() < DIFFICULTY_CONFIG[difficulty].winRate;

    setTimeout(() => {
      if (isSafe) {
        const nextStep = currentStep + 1;
        setCurrentStep(nextStep);
        sound.playChipBet();

        // Check if reached final 10th stone Jackpot
        if (nextStep >= 10) {
          triggerCashout(activeSteps[9]);
          setIsWinner(true);
        }
      } else {
        // Triggered River Trap / Crumble
        setIsGameOver(true);
        setIsPlaying(false);
        sound.playLoss();
      }
      setIsStepping(false);
    }, 280);
  };

  // 3. Cashout Expedition
  const triggerCashout = (customMult?: number) => {
    if (!isPlaying && !customMult) return;
    const finalMult = customMult || currentMultiplier;
    const winAmount = Number((betAmount * finalMult).toFixed(2));

    onUpdateBalance(playerBalance + winAmount);
    setLastWin({ amount: winAmount, multiplier: finalMult });
    setIsPlaying(false);
    setIsWinner(true);
    sound.playWin();
    confetti({ particleCount: 75, spread: 70, origin: { y: 0.6 } });

    if (onRecordRound) {
      onRecordRound({ bet: betAmount, win: winAmount, multiplier: finalMult });
    }
  };

  return (
    <div className="w-full flex flex-col space-y-4">
      {/* 60FPS Jungle River Canvas Stage */}
      <div className="w-full h-[360px] sm:h-[400px] md:h-[450px]">
        <TigerTrailCanvas
          currentStep={currentStep}
          isGameOver={isGameOver}
          isWinner={isWinner}
          difficulty={difficulty}
          stepsMultipliers={activeSteps}
        />
      </div>

      {/* Stepper HUD Progress Bar */}
      <div className="bg-[#08150f] border border-emerald-500/30 rounded-3xl p-4 shadow-xl space-y-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-amber-400" />
            <span className="font-black text-white uppercase tracking-wider">Stepping Stones Roadmap</span>
          </div>
          <span className="text-[11px] font-mono text-emerald-400 font-bold">
            Safe Step Probability: ~{safeChancePercent}%
          </span>
        </div>

        {/* 10 Step Multipliers Strip */}
        <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
          {activeSteps.map((mult, idx) => {
            const stepNum = idx + 1;
            const isCurrent = currentStep === stepNum;
            const isPassed = currentStep > stepNum;

            return (
              <div
                key={idx}
                className={`flex flex-col items-center justify-center p-2 rounded-2xl border text-center transition-all ${
                  isCurrent
                    ? "bg-gradient-to-b from-amber-400 to-amber-600 border-amber-300 text-black shadow-lg shadow-amber-500/30 scale-105 animate-pulse"
                    : isPassed
                    ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-300"
                    : "bg-[#040d09] border-slate-800 text-gray-500"
                }`}
              >
                <span className="text-[9px] font-bold uppercase">S{stepNum}</span>
                <span className="text-xs font-black font-mono">{mult}x</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Interactive Controls & Difficulty Selectors */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left: Difficulty & Bet Config (5 cols) */}
        <div className="lg:col-span-5 bg-[#08150f] border border-slate-800/90 rounded-3xl p-5 shadow-xl space-y-4">
          <div className="space-y-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Expedition Risk Level</span>
            <div className="grid grid-cols-4 gap-1.5">
              {(["EASY", "MEDIUM", "HARD", "EXTREME"] as Difficulty[]).map((mode) => (
                <button
                  key={mode}
                  disabled={isPlaying}
                  onClick={() => {
                    setDifficulty(mode);
                    sound.playCardDeal();
                  }}
                  className={`py-2 rounded-xl text-xs font-black border transition-all ${
                    difficulty === mode
                      ? "bg-amber-500 text-black border-amber-400 shadow-md shadow-amber-500/20"
                      : "bg-[#040d09] border-slate-800 text-gray-400 hover:text-white disabled:opacity-40"
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Bet Amount Input & Quick Chips */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Bet Amount (INR)</span>
            <div className="flex items-center gap-2 bg-[#040d09] border border-slate-800 rounded-2xl px-3 py-2">
              <span className="text-amber-400 font-bold text-sm">₹</span>
              <input
                type="number"
                disabled={isPlaying}
                value={betAmount}
                onChange={(e) => setBetAmount(Math.max(10, Number(e.target.value)))}
                className="w-full bg-transparent text-white font-mono font-bold text-base focus:outline-none disabled:opacity-50"
              />
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              {[20, 50, 100, 500].map((val) => (
                <button
                  key={val}
                  disabled={isPlaying}
                  onClick={() => {
                    setBetAmount(val);
                    sound.playChipBet();
                  }}
                  className={`py-1.5 rounded-xl text-xs font-mono font-bold border transition-colors ${
                    betAmount === val
                      ? "bg-emerald-500 text-black border-emerald-400"
                      : "bg-[#040d09] border-slate-800 text-gray-400 hover:text-white disabled:opacity-40"
                  }`}
                >
                  ₹{val}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Primary Action Buttons (7 cols) */}
        <div className="lg:col-span-7 bg-[#08150f] border border-slate-800/90 rounded-3xl p-5 shadow-xl flex flex-col justify-center min-h-[190px]">
          {!isPlaying ? (
            <button
              onClick={startExpedition}
              className="w-full h-24 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-lg shadow-xl shadow-amber-500/25 transition-all active:scale-95 flex flex-col items-center justify-center space-y-0.5"
            >
              <span className="text-xs font-extrabold uppercase tracking-widest text-black/80">START EXPEDITION</span>
              <span className="text-2xl font-mono font-black">₹{betAmount}</span>
            </button>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
              {/* Step Forward Button */}
              <button
                onClick={stepForward}
                disabled={isStepping || currentStep >= 10}
                className="h-24 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 text-black font-black text-base shadow-xl shadow-amber-500/20 transition-all active:scale-95 flex flex-col items-center justify-center"
              >
                <div className="flex items-center gap-1 text-xs uppercase tracking-wider">
                  <span>STEP FORWARD</span>
                  <ChevronRight className="w-4 h-4 stroke-[3]" />
                </div>
                <span className="text-lg font-mono font-black">NEXT: {nextMultiplier}x</span>
              </button>

              {/* Cashout Button */}
              <button
                onClick={() => triggerCashout()}
                disabled={currentStep === 0}
                className="h-24 rounded-2xl bg-gradient-to-r from-emerald-400 to-emerald-600 hover:from-emerald-300 hover:to-emerald-500 disabled:opacity-40 text-black font-black text-base shadow-xl shadow-emerald-500/30 transition-all active:scale-95 flex flex-col items-center justify-center animate-pulse"
              >
                <span className="text-xs uppercase tracking-wider font-extrabold text-black/80">CASH OUT</span>
                <span className="text-xl font-mono font-black">₹{currentCashoutValue}</span>
                <span className="text-[10px] font-bold text-emerald-950 font-mono">({currentMultiplier}x)</span>
              </button>
            </div>
          )}

          {/* Trap Alert / Status Notification */}
          {isGameOver && (
            <div className="mt-3 p-2.5 bg-rose-950/60 border border-rose-500/50 rounded-2xl text-rose-300 font-bold text-xs flex items-center justify-center gap-2 animate-shake">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span>Unstable Stone Crumbled! Lost ₹{betAmount}.</span>
            </div>
          )}

          {/* Win Celebration Banner */}
          {lastWin && (
            <div className="mt-3 p-2.5 bg-emerald-950/60 border border-emerald-500/50 rounded-2xl text-emerald-300 font-bold text-xs flex items-center justify-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>Expedition Success! Won ₹{lastWin.amount} ({lastWin.multiplier}x)!</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

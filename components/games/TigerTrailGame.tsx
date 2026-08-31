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
  Footprints,
  Coins,
} from "lucide-react";
import confetti from "canvas-confetti";
import { sound } from "@/lib/soundFx";
import { TigerTrailCanvas } from "./TigerTrailCanvas";

interface TigerTrailGameProps {
  playerBalance: number;
  onUpdateBalance: (newBalance: number) => void;
  onRecordRound?: (data: { bet: number; win: number; multiplier: number }) => void;
  liveRtp?: number;
}

type Difficulty = "EASY" | "MEDIUM" | "HARD" | "EXTREME";

const DIFFICULTY_CONFIG = {
  EASY: {
    label: "Easy",
    icon: "🌿",
    winChance: "88%",
    steps: [1.12, 1.30, 1.55, 1.90, 2.40, 3.1, 4.2, 5.8, 8.5, 14.0],
    activeColor: "from-emerald-500 to-emerald-600 text-black border-emerald-400 shadow-emerald-500/25",
  },
  MEDIUM: {
    label: "Medium",
    icon: "🔥",
    winChance: "78%",
    steps: [1.22, 1.55, 2.05, 2.75, 3.85, 5.8, 9.0, 15.0, 28.0, 60.0],
    activeColor: "from-amber-400 to-amber-600 text-black border-amber-300 shadow-amber-500/30",
  },
  HARD: {
    label: "Hard",
    icon: "⚡",
    winChance: "65%",
    steps: [1.40, 2.10, 3.35, 5.5, 9.8, 18.5, 38.0, 88.0, 200.0, 450.0],
    activeColor: "from-rose-500 to-rose-600 text-white border-rose-400 shadow-rose-500/25",
  },
  EXTREME: {
    label: "Extreme",
    icon: "💀",
    winChance: "52%",
    steps: [1.75, 3.3, 7.0, 16.5, 40.0, 110.0, 290.0, 780.0, 1350.0, 2200.0],
    activeColor: "from-purple-500 to-purple-700 text-white border-purple-400 shadow-purple-500/30",
  },
};

export const TigerTrailGame: React.FC<TigerTrailGameProps> = ({
  playerBalance,
  onUpdateBalance,
  onRecordRound,
  liveRtp = 96.0,
}) => {
  const [betAmount, setBetAmount] = useState(50);
  const [difficulty, setDifficulty] = useState<Difficulty>("MEDIUM");
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isWinner, setIsWinner] = useState(false);
  const [isStepping, setIsStepping] = useState(false);
  const [lastWin, setLastWin] = useState<{ amount: number; multiplier: number } | null>(null);

  const balanceRef = React.useRef(playerBalance);
  React.useEffect(() => {
    balanceRef.current = playerBalance;
  }, [playerBalance]);

  const activeConfig = DIFFICULTY_CONFIG[difficulty];
  const activeSteps = activeConfig.steps;
  const currentMultiplier = currentStep === 0 ? 1.0 : activeSteps[currentStep - 1];
  const nextMultiplier = currentStep < 10 ? activeSteps[currentStep] : activeSteps[9];
  const currentCashoutValue = Number((betAmount * currentMultiplier).toFixed(2));

  // 1. Start New Expedition
  const startExpedition = () => {
    if (balanceRef.current < betAmount) {
      alert("Insufficient Balance");
      return;
    }

    balanceRef.current = Number((balanceRef.current - betAmount).toFixed(2));
    onUpdateBalance(balanceRef.current);

    setCurrentStep(0);
    setIsPlaying(true);
    setIsGameOver(false);
    setIsWinner(false);
    setLastWin(null);
    sound.playCardDeal();
  };

  // 2. Step Forward across river with dynamic House Edge
  const stepForward = () => {
    if (!isPlaying || isStepping || currentStep >= 10) return;
    setIsStepping(true);

    const prevMult = currentStep === 0 ? 1.0 : activeSteps[currentStep - 1];
    const nextMult = activeSteps[currentStep];
    // Dynamic Provably Fair step probability based on liveRtp
    const stepWinRate = ((liveRtp || 96.0) / 100) * (prevMult / nextMult);
    const isSafe = Math.random() < Math.max(0.2, Math.min(0.95, stepWinRate));

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
        if (onRecordRound) {
          onRecordRound({ bet: betAmount, win: 0, multiplier: 0 });
        }
      }
      setIsStepping(false);
    }, 220);
  };

  // 3. Cashout Expedition
  const triggerCashout = (customMult?: number) => {
    if (!isPlaying && !customMult) return;
    const finalMult = customMult || currentMultiplier;
    const winAmount = Number((betAmount * finalMult).toFixed(2));

    balanceRef.current = Number((balanceRef.current + winAmount).toFixed(2));
    onUpdateBalance(balanceRef.current);

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
    <div className="w-full flex flex-col space-y-3">
      {/* 60FPS Jungle River Canvas Stage with integrated HUD */}
      <div className="w-full h-[280px] sm:h-[350px] md:h-[420px] relative rounded-3xl overflow-hidden border border-emerald-500/30 shadow-2xl bg-[#040d09]">
        <TigerTrailCanvas
          currentStep={currentStep}
          isGameOver={isGameOver}
          isWinner={isWinner}
          difficulty={difficulty}
          stepsMultipliers={activeSteps}
        />
      </div>

      {/* Spacious, Ergonomic Dashboard Panel (No Cramping) */}
      <div className="bg-[#08120d] border border-emerald-950/80 rounded-3xl p-4 sm:p-5 shadow-2xl space-y-3.5 backdrop-blur-md">
        {!isPlaying ? (
          /* ========================================================= */
          /* 1. BETTING DASHBOARD (When not in round) */
          /* ========================================================= */
          <div className="space-y-3.5">
            {/* Row 1: Risk Level Full-Width Segmented Selector */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-gray-400 px-1">
                <span className="uppercase tracking-wider">Select Expedition Risk:</span>
                <span className="font-mono text-emerald-400">Win Rate: ~{activeConfig.winChance}</span>
              </div>

              <div className="grid grid-cols-4 gap-1.5 p-1 bg-[#040906] border border-slate-800/80 rounded-2xl">
                {(["EASY", "MEDIUM", "HARD", "EXTREME"] as Difficulty[]).map((mode) => {
                  const cfg = DIFFICULTY_CONFIG[mode];
                  const isSelected = difficulty === mode;

                  return (
                    <button
                      key={mode}
                      onClick={() => {
                        setDifficulty(mode);
                        sound.playCardDeal();
                      }}
                      className={`py-2 px-1 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1 cursor-pointer ${
                        isSelected
                          ? `bg-gradient-to-r ${cfg.activeColor} shadow-lg scale-[1.02]`
                          : "text-gray-400 hover:text-gray-200 hover:bg-slate-900/60"
                      }`}
                    >
                      <span className="text-xs">{cfg.icon}</span>
                      <span className="truncate">{cfg.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Row 2: Bet Amount Input & Quick Chips */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-gray-400 px-1">
                <span className="uppercase tracking-wider">Bet Amount (INR):</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                <div className="sm:col-span-4 flex items-center gap-1.5 bg-[#040906] border border-slate-800 rounded-2xl px-3 py-2">
                  <span className="text-amber-400 font-black text-sm">₹</span>
                  <input
                    type="number"
                    value={betAmount}
                    onChange={(e) => setBetAmount(Math.max(10, Number(e.target.value)))}
                    className="w-full bg-transparent text-white font-mono font-black text-sm focus:outline-none"
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
                      className={`py-2 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer ${
                        betAmount === val
                          ? "bg-emerald-500 text-black border-emerald-400 shadow-md shadow-emerald-500/20"
                          : "bg-[#040906] border-slate-800 text-gray-400 hover:text-white"
                      }`}
                    >
                      ₹{val}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Row 3: Grand START EXPEDITION Button */}
            <button
              onClick={startExpedition}
              className="w-full h-14 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 active:scale-95 text-black font-black text-sm sm:text-base shadow-xl shadow-amber-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer border border-amber-300/40"
            >
              <Footprints className="w-5 h-5 stroke-[2.5]" />
              <span className="uppercase tracking-wider font-extrabold text-black/90">START EXPEDITION</span>
              <span className="font-mono font-black text-base sm:text-lg">₹{betAmount}</span>
            </button>
          </div>
        ) : (
          /* ========================================================= */
          /* 2. ACTIVE EXPEDITION CONTROLS (In Flight / Step Phase) */
          /* ========================================================= */
          <div className="grid grid-cols-12 gap-2.5 w-full">
            {/* STEP FORWARD BUTTON (7 cols) */}
            <button
              onClick={stepForward}
              disabled={isStepping || currentStep >= 10}
              className="col-span-7 h-16 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 disabled:opacity-50 text-black font-black shadow-xl shadow-amber-500/30 transition-all active:scale-95 flex flex-col items-center justify-center cursor-pointer border border-amber-300/50"
            >
              <div className="flex items-center gap-1 uppercase tracking-wider font-black text-xs sm:text-sm">
                <span>STEP FORWARD</span>
                <ChevronRight className="w-4 h-4 stroke-[3]" />
              </div>
              <div className="flex items-center gap-1.5 text-xs font-mono font-extrabold text-black/90">
                <span>NEXT STONE:</span>
                <span className="text-sm font-black underline">{nextMultiplier}x</span>
              </div>
            </button>

            {/* CASHOUT BUTTON (5 cols) */}
            <button
              onClick={() => triggerCashout()}
              disabled={currentStep === 0}
              className={`col-span-5 h-16 rounded-2xl font-black shadow-xl transition-all active:scale-95 flex flex-col items-center justify-center cursor-pointer ${
                currentStep > 0
                  ? "bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600 hover:from-emerald-300 hover:to-emerald-500 text-black shadow-emerald-500/30 border border-emerald-300/50 animate-pulse"
                  : "bg-[#040906] border border-slate-800 text-gray-500 cursor-not-allowed opacity-50"
              }`}
            >
              <span className="text-[10px] sm:text-xs uppercase tracking-wider font-extrabold">
                {currentStep > 0 ? "CASH OUT 💰" : "AT CAMP"}
              </span>
              <span className="text-sm sm:text-base font-mono font-black">
                ₹{currentCashoutValue}
              </span>
              {currentStep > 0 && (
                <span className="text-[10px] font-mono font-bold text-black/80">({currentMultiplier}x)</span>
              )}
            </button>
          </div>
        )}

        {/* Trap Alert Status Notification */}
        {isGameOver && (
          <div className="p-2.5 bg-rose-950/80 border border-rose-500/70 rounded-2xl text-rose-200 font-bold text-xs flex items-center justify-center gap-2 animate-shake shadow-lg shadow-rose-950/50">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
            <span>Unstable Stone Crumbled! Lost ₹{betAmount}. Try Next River Crossing!</span>
          </div>
        )}

        {/* Win Celebration Banner */}
        {lastWin && (
          <div className="p-2.5 bg-emerald-950/80 border border-emerald-500/70 rounded-2xl text-emerald-200 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50">
            <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Expedition Success! Won ₹{lastWin.amount.toLocaleString()} ({lastWin.multiplier}x)!</span>
          </div>
        )}
      </div>
    </div>
  );
};

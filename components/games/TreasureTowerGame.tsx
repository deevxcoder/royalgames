"use client";

import React, { useState } from "react";
import {
  Castle,
  Trophy,
  Sparkles,
  Zap,
  ShieldAlert,
  Flame,
  Wallet,
  History,
  DoorClosed,
  DoorOpen,
  ChevronUp,
} from "lucide-react";
import confetti from "canvas-confetti";
import { sound } from "@/lib/soundFx";

interface TreasureTowerGameProps {
  playerBalance: number;
  onUpdateBalance: (newBalance: number) => void;
  onRecordRound?: (data: { bet: number; win: number; multiplier: number }) => void;
}

type TowerDifficulty = "EASY" | "MEDIUM" | "HARD" | "EXTREME";

const TOWER_CONFIG: Record<
  TowerDifficulty,
  { doorsPerFloor: number; safeDoors: number; multipliers: number[] }
> = {
  EASY: {
    doorsPerFloor: 4,
    safeDoors: 3,
    multipliers: [1.25, 1.65, 2.2, 3.0, 4.2, 6.0, 9.0, 15.0],
  },
  MEDIUM: {
    doorsPerFloor: 3,
    safeDoors: 2,
    multipliers: [1.45, 2.15, 3.25, 5.0, 7.8, 12.5, 22.0, 45.0],
  },
  HARD: {
    doorsPerFloor: 2,
    safeDoors: 1,
    multipliers: [1.9, 3.8, 7.6, 15.2, 30.4, 60.8, 121.6, 250.0],
  },
  EXTREME: {
    doorsPerFloor: 3,
    safeDoors: 1,
    multipliers: [2.85, 8.5, 25.5, 76.5, 150.0, 220.0, 300.0, 500.0],
  },
};

export const TreasureTowerGame: React.FC<TreasureTowerGameProps> = ({
  playerBalance,
  onUpdateBalance,
  onRecordRound,
}) => {
  const [betAmount, setBetAmount] = useState(50);
  const [difficulty, setDifficulty] = useState<TowerDifficulty>("MEDIUM");
  const [currentFloor, setCurrentFloor] = useState(0); // 0 = at ground, 1 = floor 1 cleared...
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isWinner, setIsWinner] = useState(false);
  const [towerHistory, setTowerHistory] = useState<number[]>([2.15, 5.0, 1.45, 12.5, 3.25, 1.0]);
  const [lastWin, setLastWin] = useState<{ amount: number; multiplier: number } | null>(null);

  const activeMultipliers = TOWER_CONFIG[difficulty].multipliers;
  const doorsCount = TOWER_CONFIG[difficulty].doorsPerFloor;
  const safeDoorsCount = TOWER_CONFIG[difficulty].safeDoors;

  const currentMultiplier = currentFloor === 0 ? 1.0 : activeMultipliers[currentFloor - 1];
  const cashoutValue = Number((betAmount * currentMultiplier).toFixed(2));

  // Start Tower Climb
  const startClimb = () => {
    if (playerBalance < betAmount) {
      alert("Insufficient Balance");
      return;
    }

    onUpdateBalance(playerBalance - betAmount);
    setCurrentFloor(0);
    setIsPlaying(true);
    setIsGameOver(false);
    setIsWinner(false);
    setLastWin(null);
    sound.playCardDeal();
  };

  // Pick Door on Active Floor
  const handleDoorPick = (doorIdx: number) => {
    if (!isPlaying || isGameOver || currentFloor >= 8) return;

    // Determine if safe based on probability
    const isSafe = Math.random() < safeDoorsCount / doorsCount;

    if (isSafe) {
      const nextFloor = currentFloor + 1;
      setCurrentFloor(nextFloor);
      sound.playCoinFlip();

      if (nextFloor >= 8) {
        // Reached 8th Floor Pinnacle Jackpot!
        triggerCashout(activeMultipliers[7]);
      }
    } else {
      // Trap Triggered!
      setIsGameOver(true);
      setIsPlaying(false);
      sound.playLoss();
    }
  };

  // Cashout Action
  const triggerCashout = (customMult?: number) => {
    if (!isPlaying && !customMult) return;
    if (currentFloor === 0 && !customMult) return;

    const finalMult = customMult || currentMultiplier;
    const winAmount = Number((betAmount * finalMult).toFixed(2));

    onUpdateBalance(playerBalance + winAmount);
    setLastWin({ amount: winAmount, multiplier: finalMult });
    setIsPlaying(false);
    setIsWinner(true);
    setTowerHistory((prev) => [finalMult, ...prev.slice(0, 9)]);

    sound.playWin();
    confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });

    if (onRecordRound) {
      onRecordRound({ bet: betAmount, win: winAmount, multiplier: finalMult });
    }
  };

  return (
    <div className="w-full flex flex-col space-y-4">
      {/* Top History Strip */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider shrink-0 flex items-center gap-1">
          <History className="w-3 h-3 text-amber-400" /> Tower Climbs:
        </span>
        {towerHistory.map((mult, idx) => (
          <span
            key={idx}
            className={`text-xs font-mono font-black px-2.5 py-1 rounded-xl shrink-0 transition-all ${
              mult >= 10
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-md shadow-amber-500/20"
                : mult >= 2
                ? "bg-emerald-950/70 text-emerald-300 border border-emerald-500/50"
                : "bg-slate-900 text-gray-400 border border-slate-800"
            }`}
          >
            {mult}x
          </span>
        ))}
      </div>

      {/* 8-Floor Temple Tower Arena */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: 8-Floor Tower Matrix (7 cols) */}
        <div className="lg:col-span-7 bg-[#0b0c16] border border-amber-500/30 rounded-3xl p-5 shadow-2xl flex flex-col items-center justify-center space-y-2 relative overflow-hidden">
          <div className="w-full flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
            <span className="font-bold text-amber-400 uppercase flex items-center gap-1.5">
              <Castle className="w-4 h-4" /> ANCIENT TEMPLE TOWER ({difficulty})
            </span>
            <span className="font-mono text-emerald-400 font-bold">
              Floor {currentFloor}/8 • Current: {currentMultiplier}x
            </span>
          </div>

          {/* 8 Tower Floors (Rendered Top-to-Bottom: Floor 8 at top, Floor 1 at bottom) */}
          <div className="w-full max-w-md space-y-1.5 py-2">
            {Array.from({ length: 8 }, (_, i) => 7 - i).map((floorIdx) => {
              const floorNum = floorIdx + 1;
              const isFloorActive = isPlaying && currentFloor === floorIdx;
              const isFloorPassed = currentFloor > floorIdx;
              const mult = activeMultipliers[floorIdx];

              return (
                <div
                  key={floorIdx}
                  className={`flex items-center justify-between p-2 rounded-2xl border transition-all ${
                    isFloorActive
                      ? "bg-amber-500/20 border-amber-400 shadow-lg shadow-amber-500/30 scale-105"
                      : isFloorPassed
                      ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-400"
                      : "bg-[#06070e] border-slate-800/80 text-gray-600"
                  }`}
                >
                  {/* Floor Number & Multiplier */}
                  <div className="flex items-center gap-2 font-mono text-xs font-bold pl-2">
                    <span className="text-[10px] text-gray-400 uppercase">F{floorNum}</span>
                    <span className={isFloorActive ? "text-amber-400 text-sm font-black" : ""}>{mult}x</span>
                  </div>

                  {/* Floor Doors */}
                  <div className="flex items-center gap-2">
                    {Array.from({ length: doorsCount }, (_, dIdx) => (
                      <button
                        key={dIdx}
                        disabled={!isFloorActive}
                        onClick={() => handleDoorPick(dIdx)}
                        className={`w-12 h-9 rounded-xl flex items-center justify-center text-xs font-bold border transition-all ${
                          isFloorActive
                            ? "bg-amber-500 hover:bg-amber-400 text-black border-amber-300 shadow-md shadow-amber-500/40 animate-pulse active:scale-95 cursor-pointer"
                            : isFloorPassed
                            ? "bg-emerald-900/60 border-emerald-500/40 text-emerald-300"
                            : "bg-[#0f111f] border-slate-800 text-gray-600"
                        }`}
                      >
                        {isFloorPassed ? "💎" : isFloorActive ? "🚪" : "🔒"}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Controls & Cashout Panel (5 cols) */}
        <div className="lg:col-span-5 bg-[#0b0c16] border border-slate-800/90 rounded-3xl p-5 shadow-2xl space-y-4">
          {/* Difficulty Selector */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Temple Risk Difficulty</span>
            <div className="grid grid-cols-4 gap-1.5">
              {(["EASY", "MEDIUM", "HARD", "EXTREME"] as TowerDifficulty[]).map((d) => (
                <button
                  key={d}
                  disabled={isPlaying}
                  onClick={() => {
                    setDifficulty(d);
                    sound.playCardDeal();
                  }}
                  className={`py-2 rounded-xl text-xs font-black border transition-all ${
                    difficulty === d
                      ? "bg-amber-500 text-black border-amber-400 shadow-md shadow-amber-500/20"
                      : "bg-[#06070e] border-slate-800 text-gray-400 hover:text-white disabled:opacity-40"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Bet Amount Input & Chips */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Bet Amount (INR)</span>
            <div className="flex items-center gap-2 bg-[#06070e] border border-slate-800 rounded-2xl px-3 py-2">
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
                      ? "bg-amber-500 text-black border-amber-400"
                      : "bg-[#06070e] border-slate-800 text-gray-400 hover:text-white disabled:opacity-40"
                  }`}
                >
                  ₹{val}
                </button>
              ))}
            </div>
          </div>

          {/* Primary Action Button: START or CASHOUT */}
          {!isPlaying ? (
            <button
              onClick={startClimb}
              className="w-full h-20 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-base shadow-xl shadow-amber-500/25 transition-all active:scale-95 flex flex-col items-center justify-center space-y-0.5"
            >
              <span className="text-xs uppercase tracking-widest font-extrabold text-black/80">CLIMB TREASURE TOWER</span>
              <span className="text-xl font-mono font-black">₹{betAmount}</span>
            </button>
          ) : (
            <button
              onClick={() => triggerCashout()}
              disabled={currentFloor === 0}
              className="w-full h-20 rounded-2xl bg-gradient-to-r from-emerald-400 to-emerald-600 hover:from-emerald-300 hover:to-emerald-500 disabled:opacity-40 text-black font-black text-base shadow-xl shadow-emerald-500/30 transition-all active:scale-95 flex flex-col items-center justify-center animate-pulse"
            >
              <span className="text-xs uppercase tracking-wider font-extrabold text-black/80">CASH OUT FLOOR {currentFloor}</span>
              <span className="text-xl font-mono font-black">₹{cashoutValue}</span>
              <span className="text-[10px] font-bold text-emerald-950 font-mono">({currentMultiplier}x)</span>
            </button>
          )}

          {/* Trap Alert */}
          {isGameOver && (
            <div className="p-2.5 bg-rose-950/60 border border-rose-500/50 rounded-2xl text-rose-300 font-bold text-xs flex items-center justify-center gap-2 animate-shake">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span>Temple Trap Snapped! Lost ₹{betAmount}.</span>
            </div>
          )}

          {/* Win Celebration Alert */}
          {lastWin && (
            <div className="p-2.5 bg-emerald-950/60 border border-emerald-500/50 rounded-2xl text-emerald-300 font-bold text-xs flex items-center justify-center gap-2 animate-bounce">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>Treasure Extracted! Won ₹{lastWin.amount} ({lastWin.multiplier}x)!</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

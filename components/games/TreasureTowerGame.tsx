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
  Shuffle,
  Gem,
} from "lucide-react";
import confetti from "canvas-confetti";
import { sound } from "@/lib/soundFx";
import { TreasureTowerCanvas } from "./TreasureTowerCanvas";

interface TreasureTowerGameProps {
  playerBalance: number;
  onUpdateBalance: (newBalance: number) => void;
  onRecordRound?: (data: { bet: number; win: number; multiplier: number }) => void;
  liveRtp?: number;
}

type TowerDifficulty = "EASY" | "MEDIUM" | "HARD" | "EXTREME";

const BASE_TOWER_CONFIG: Record<
  TowerDifficulty,
  { doorsPerFloor: number; safeDoors: number; multipliers: number[] }
> = {
  EASY: {
    doorsPerFloor: 4,
    safeDoors: 3,
    multipliers: [1.22, 1.60, 2.10, 2.85, 3.90, 5.5, 8.2, 13.5],
  },
  MEDIUM: {
    doorsPerFloor: 3,
    safeDoors: 2,
    multipliers: [1.40, 2.05, 3.10, 4.70, 7.20, 11.5, 19.5, 40.0],
  },
  HARD: {
    doorsPerFloor: 2,
    safeDoors: 1,
    multipliers: [1.85, 3.65, 7.20, 14.2, 28.0, 56.0, 110.0, 230.0],
  },
  EXTREME: {
    doorsPerFloor: 3,
    safeDoors: 1,
    multipliers: [2.75, 8.0, 23.5, 70.0, 135.0, 200.0, 275.0, 450.0],
  },
};

export const TreasureTowerGame: React.FC<TreasureTowerGameProps> = ({
  playerBalance,
  onUpdateBalance,
  onRecordRound,
  liveRtp = 96.0,
}) => {
  const [betAmount, setBetAmount] = useState(50);
  const [difficulty, setDifficulty] = useState<TowerDifficulty>("MEDIUM");
  const [currentFloor, setCurrentFloor] = useState(0); // 0 = ground, 1 = floor 1 cleared...
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isWinner, setIsWinner] = useState(false);
  const [towerHistory, setTowerHistory] = useState<number[]>([2.05, 4.7, 1.40, 11.5, 3.10, 1.0]);
  const [lastWin, setLastWin] = useState<{ amount: number; multiplier: number } | null>(null);

  const balanceRef = React.useRef(playerBalance);
  React.useEffect(() => {
    balanceRef.current = playerBalance;
  }, [playerBalance]);

  // Scaled multipliers based on liveRtp
  const scaling = Math.max(0.75, Math.min(1.05, (liveRtp || 96.0) / 96.0));
  const activeMultipliers = React.useMemo(() => {
    return BASE_TOWER_CONFIG[difficulty].multipliers.map((m) => Number((m * scaling).toFixed(2)));
  }, [difficulty, scaling]);

  const doorsCount = BASE_TOWER_CONFIG[difficulty].doorsPerFloor;
  const safeDoorsCount = BASE_TOWER_CONFIG[difficulty].safeDoors;

  const currentMultiplier = currentFloor === 0 ? 1.0 : activeMultipliers[currentFloor - 1];
  const cashoutValue = Number((betAmount * currentMultiplier).toFixed(2));

  // 1. Start Tower Climb
  const startClimb = () => {
    if (balanceRef.current < betAmount) {
      alert("Insufficient Balance");
      return;
    }

    balanceRef.current = Number((balanceRef.current - betAmount).toFixed(2));
    onUpdateBalance(balanceRef.current);

    setCurrentFloor(0);
    setIsPlaying(true);
    setIsGameOver(false);
    setIsWinner(false);
    setLastWin(null);
    sound.playCardDeal();
  };

  // 2. Pick Door / Chest on Active Floor with dynamic House Edge
  const handleDoorPick = (doorIdx: number) => {
    if (!isPlaying || isGameOver || currentFloor >= 8) return;

    // Determine if safe based on probability calibrated to liveRtp
    const naturalSafeProb = safeDoorsCount / doorsCount;
    const rtpFactor = Math.max(0.8, Math.min(1.0, (liveRtp || 96.0) / 100));
    const isSafe = Math.random() < naturalSafeProb * rtpFactor;

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
      if (onRecordRound) {
        onRecordRound({ bet: betAmount, win: 0, multiplier: 0 });
      }
    }
  };

  // 3. Random Chest Picker
  const pickRandomChest = () => {
    if (!isPlaying || isGameOver || currentFloor >= 8) return;
    const randomDoor = Math.floor(Math.random() * doorsCount);
    handleDoorPick(randomDoor);
  };

  // 4. Cashout Action
  const triggerCashout = (customMult?: number) => {
    if (!isPlaying && !customMult) return;
    if (currentFloor === 0 && !customMult) return;

    const finalMult = customMult || currentMultiplier;
    const winAmount = Number((betAmount * finalMult).toFixed(2));

    balanceRef.current = Number((balanceRef.current + winAmount).toFixed(2));
    onUpdateBalance(balanceRef.current);

    setLastWin({ amount: winAmount, multiplier: finalMult });
    setIsPlaying(false);
    setIsWinner(true);
    setTowerHistory((prev) => [finalMult, ...prev.slice(0, 9)]);

    sound.playWin();
    confetti({ particleCount: 75, spread: 75, origin: { y: 0.6 } });

    if (onRecordRound) {
      onRecordRound({ bet: betAmount, win: winAmount, multiplier: finalMult });
    }
  };

  return (
    <div className="w-full flex flex-col space-y-3">
      {/* Top History Strip */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider shrink-0 flex items-center gap-1">
          <History className="w-3.5 h-3.5 text-amber-400" /> Climbs:
        </span>
        {towerHistory.map((mult, idx) => (
          <span
            key={idx}
            className={`text-xs font-mono font-black px-2.5 py-0.5 rounded-xl shrink-0 transition-all ${
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

      {/* 60FPS 3D Temple Tower Stage */}
      <div className="w-full h-[280px] sm:h-[350px] md:h-[420px]">
        <TreasureTowerCanvas
          currentFloor={currentFloor}
          isPlaying={isPlaying}
          isGameOver={isGameOver}
          isWinner={isWinner}
          difficulty={difficulty}
          doorsCount={doorsCount}
          multipliers={activeMultipliers}
          onPickDoor={handleDoorPick}
        />
      </div>

      {/* Spacious, Ergonomic Dashboard Controls Panel */}
      <div className="bg-[#0b0c16] border border-slate-800/90 rounded-3xl p-4 sm:p-5 shadow-2xl space-y-3.5 backdrop-blur-md">
        {!isPlaying ? (
          /* ========================================================= */
          /* 1. BETTING DASHBOARD (Before Climb) */
          /* ========================================================= */
          <div className="space-y-3.5">
            {/* Row 1: Difficulty Selector */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-gray-400 px-1">
                <span className="uppercase tracking-wider">Temple Difficulty:</span>
                <span className="font-mono text-amber-400">Pinnacle: {activeMultipliers[7]}x Jackpot</span>
              </div>

              <div className="grid grid-cols-4 gap-1.5 p-1 bg-[#05060d] border border-slate-800 rounded-2xl">
                {(["EASY", "MEDIUM", "HARD", "EXTREME"] as TowerDifficulty[]).map((d) => (
                  <button
                    key={d}
                    onClick={() => {
                      setDifficulty(d);
                      sound.playCardDeal();
                    }}
                    className={`py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      difficulty === d
                        ? d === "EXTREME"
                          ? "bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/30 scale-[1.02]"
                          : d === "HARD"
                          ? "bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-lg shadow-rose-500/30 scale-[1.02]"
                          : d === "MEDIUM"
                          ? "bg-gradient-to-r from-amber-400 to-amber-500 text-black shadow-lg shadow-amber-500/30 scale-[1.02]"
                          : "bg-gradient-to-r from-emerald-400 to-teal-500 text-black shadow-lg shadow-emerald-500/30 scale-[1.02]"
                        : "text-gray-400 hover:text-white hover:bg-slate-900"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Row 2: Bet Amount Input & Quick Chips */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-gray-400 px-1">
                <span className="uppercase tracking-wider">Bet Stake (INR):</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                <div className="sm:col-span-4 flex items-center gap-1.5 bg-[#05060d] border border-slate-800 rounded-2xl px-3 py-2">
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
                      className={`py-2 rounded-xl text-xs font-mono font-bold border transition-colors cursor-pointer ${
                        betAmount === val
                          ? "bg-amber-500 text-black border-amber-400 shadow-md shadow-amber-500/20"
                          : "bg-[#05060d] border-slate-800 text-gray-400 hover:text-white"
                      }`}
                    >
                      ₹{val}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Row 3: Grand CLIMB TOWER Button */}
            <button
              onClick={startClimb}
              className="w-full h-14 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-black font-black text-sm sm:text-base shadow-xl shadow-amber-500/25 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer border border-amber-300/40"
            >
              <Castle className="w-5 h-5 stroke-[2.5]" />
              <span className="uppercase tracking-wider font-extrabold text-black/90">CLIMB TREASURE TOWER</span>
              <span className="font-mono font-black text-base sm:text-lg">₹{betAmount}</span>
            </button>
          </div>
        ) : (
          /* ========================================================= */
          /* 2. ACTIVE TOWER CLIMB IN-GAME ACTIONS */
          /* ========================================================= */
          <div className="grid grid-cols-12 gap-2.5 w-full">
            {/* Auto Pick Random Chest (4 cols) */}
            <button
              onClick={pickRandomChest}
              className="col-span-4 h-16 rounded-2xl bg-slate-900/90 border border-slate-700 hover:border-amber-500/50 text-amber-300 font-bold text-xs transition-all active:scale-95 flex flex-col items-center justify-center gap-1 cursor-pointer shadow-md"
            >
              <Shuffle className="w-4 h-4 text-amber-400" />
              <span className="text-[10px] uppercase font-extrabold">Random Chest</span>
            </button>

            {/* Cashout Button (8 cols) */}
            <button
              onClick={() => triggerCashout()}
              disabled={currentFloor === 0}
              className={`col-span-8 h-16 rounded-2xl font-black text-xs sm:text-sm shadow-xl transition-all active:scale-95 flex flex-col items-center justify-center cursor-pointer ${
                currentFloor > 0
                  ? "bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600 hover:from-emerald-300 hover:to-emerald-500 text-black shadow-emerald-500/30 border border-emerald-300/50 animate-pulse"
                  : "bg-[#05060d] border border-slate-800 text-gray-500 cursor-not-allowed opacity-50"
              }`}
            >
              <span className="text-[10px] sm:text-xs uppercase tracking-wider font-extrabold text-black/90">
                {currentFloor > 0 ? `CASH OUT FLOOR ${currentFloor} 💎` : "OPEN FIRST CHEST ON TOWER"}
              </span>
              <span className="text-sm sm:text-base font-mono font-black">
                ₹{cashoutValue} {currentFloor > 0 ? `(${currentMultiplier}x)` : ""}
              </span>
            </button>
          </div>
        )}

        {/* Trap Alert */}
        {isGameOver && (
          <div className="p-2.5 bg-rose-950/80 border border-rose-500/70 rounded-2xl text-rose-200 font-bold text-xs flex items-center justify-center gap-2 animate-shake shadow-lg">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
            <span>Temple Trap Snapped! Lost ₹{betAmount}. Try Next Climb!</span>
          </div>
        )}

        {/* Win Celebration Alert */}
        {lastWin && (
          <div className="p-2.5 bg-emerald-950/80 border border-emerald-500/70 rounded-2xl text-emerald-200 font-bold text-xs flex items-center justify-center gap-2 animate-bounce shadow-lg">
            <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Treasure Extracted! Won ₹{lastWin.amount.toLocaleString()} ({lastWin.multiplier}x)!</span>
          </div>
        )}
      </div>
    </div>
  );
};

"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
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
  Layers,
  History,
  CircleDot,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import confetti from "canvas-confetti";
import { sound } from "@/lib/soundFx";
import { DropXCanvas, PlinkoBall } from "./DropXCanvas";

interface DropXGameProps {
  playerBalance: number;
  onUpdateBalance: (newBalance: number) => void;
  onRecordRound?: (data: { bet: number; win: number; multiplier: number }) => void;
}

type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

const PLINKO_PAYTABLES: Record<number, Record<RiskLevel, number[]>> = {
  8: {
    LOW: [5.4, 2.0, 1.1, 1.0, 0.5, 1.0, 1.1, 2.0, 5.4],
    MEDIUM: [12.6, 2.9, 1.3, 0.7, 0.4, 0.7, 1.3, 2.9, 12.6],
    HIGH: [28.1, 3.9, 1.5, 0.3, 0.2, 0.3, 1.5, 3.9, 28.1],
  },
  10: {
    LOW: [8.6, 2.9, 1.4, 1.1, 1.0, 0.5, 1.0, 1.1, 1.4, 2.9, 8.6],
    MEDIUM: [20.0, 4.5, 1.8, 1.3, 0.5, 0.3, 0.5, 1.3, 1.8, 4.5, 20.0],
    HIGH: [72.0, 9.0, 2.8, 0.8, 0.3, 0.2, 0.3, 0.8, 2.8, 9.0, 72.0],
  },
  12: {
    LOW: [9.7, 2.9, 1.6, 1.4, 1.1, 1.0, 0.5, 1.0, 1.1, 1.4, 1.6, 2.9, 9.7],
    MEDIUM: [30.0, 10.0, 3.8, 1.8, 1.0, 0.5, 0.3, 0.5, 1.0, 1.8, 3.8, 10.0, 30.0],
    HIGH: [160.0, 22.0, 7.5, 1.8, 0.6, 0.2, 0.2, 0.2, 0.6, 1.8, 7.5, 22.0, 160.0],
  },
  14: {
    LOW: [12.5, 3.8, 1.8, 1.4, 1.2, 1.1, 1.0, 0.5, 1.0, 1.1, 1.2, 1.4, 1.8, 3.8, 12.5],
    MEDIUM: [54.0, 14.0, 6.5, 3.8, 1.7, 1.0, 0.5, 0.2, 0.5, 1.0, 1.7, 3.8, 6.5, 14.0, 54.0],
    HIGH: [400.0, 52.0, 16.5, 4.5, 1.7, 0.3, 0.2, 0.2, 0.2, 0.3, 1.7, 4.5, 16.5, 52.0, 400.0],
  },
  16: {
    LOW: [15.0, 7.5, 2.0, 1.4, 1.2, 1.1, 1.0, 0.5, 0.5, 1.0, 1.1, 1.2, 1.4, 2.0, 7.5, 15.0, 15.0],
    MEDIUM: [100.0, 38.0, 9.0, 4.5, 2.8, 1.4, 1.0, 0.5, 0.3, 0.5, 1.0, 1.4, 2.8, 4.5, 9.0, 38.0, 100.0],
    HIGH: [950.0, 120.0, 24.0, 8.5, 3.8, 1.8, 0.2, 0.2, 0.2, 0.2, 0.2, 1.8, 3.8, 8.5, 24.0, 120.0, 950.0],
  },
};

// Generates an authentic Galton Binomial distribution path
function generatePlinkoPath(totalRows: number): { pathSteps: number[]; targetBucketIndex: number } {
  const pathSteps: number[] = [];
  let rightTurns = 0;

  for (let r = 0; r < totalRows; r++) {
    // 50/50 binary random walk with natural central gravity
    const decision = Math.random() < 0.5 ? 0 : 1;
    pathSteps.push(decision);
    if (decision === 1) rightTurns++;
  }

  return {
    pathSteps,
    targetBucketIndex: rightTurns,
  };
}

export const DropXGame: React.FC<DropXGameProps> = ({
  playerBalance,
  onUpdateBalance,
  onRecordRound,
}) => {
  const [betAmount, setBetAmount] = useState(20);
  const [rows, setRows] = useState<number>(10);
  const [risk, setRisk] = useState<RiskLevel>("MEDIUM");
  const [activeBalls, setActiveBalls] = useState<PlinkoBall[]>([]);
  const [dropHistory, setDropHistory] = useState<number[]>([1.4, 0.6, 0.4, 0.6, 2.0, 0.4, 1.4]);
  const [lastOutcome, setLastOutcome] = useState<{
    amount: number;
    multiplier: number;
    bet: number;
    isWin: boolean;
  } | null>(null);

  // Synchronized Realtime Balance Tracker for Concurrency Safety
  const balanceRef = useRef(playerBalance);
  useEffect(() => {
    balanceRef.current = playerBalance;
  }, [playerBalance]);

  const activeMultipliers = PLINKO_PAYTABLES[rows]?.[risk] || PLINKO_PAYTABLES[10].MEDIUM;

  // 1. Single Ball Drop with Atomic Balance Deduction
  const dropBall = useCallback(() => {
    if (balanceRef.current < betAmount) {
      alert("Insufficient Balance");
      return;
    }

    // Atomically deduct balance
    balanceRef.current = Number((balanceRef.current - betAmount).toFixed(2));
    onUpdateBalance(balanceRef.current);
    sound.playChipBet();

    const { pathSteps, targetBucketIndex } = generatePlinkoPath(rows);

    const newBall: PlinkoBall = {
      id: `ball_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      x: 0,
      y: 0,
      vx: (Math.random() - 0.5) * 0.4,
      vy: 2.0,
      radius: rows >= 14 ? 4 : 5.5,
      color: risk === "HIGH" ? "#f43f5e" : risk === "MEDIUM" ? "#fbbf24" : "#38bdf8",
      betAmount,
      pathSteps,
      targetBucketIndex,
      currentRow: 0,
      isLanded: false,
      initialized: false,
    };

    setActiveBalls((prev) => [...prev, newBall]);
  }, [betAmount, rows, risk, onUpdateBalance]);

  // 2. Burst Multi-Ball Drops
  const dropMultipleBalls = useCallback(
    (count: number) => {
      const totalCost = betAmount * count;
      if (balanceRef.current < totalCost) {
        alert(`Insufficient Balance for x${count} multi-drop (Requires ₹${totalCost})`);
        return;
      }

      for (let i = 0; i < count; i++) {
        setTimeout(() => {
          dropBall();
        }, i * 110);
      }
    },
    [betAmount, dropBall]
  );

  // 3. Callback when a ball lands in a bucket
  const handleBallLanded = useCallback(
    (ballId: string, bucketIndex: number, multiplier: number, ballBetAmount: number) => {
      const winAmount = Number((ballBetAmount * multiplier).toFixed(2));

      // Atomically add returned win
      balanceRef.current = Number((balanceRef.current + winAmount).toFixed(2));
      onUpdateBalance(balanceRef.current);

      setDropHistory((prev) => [multiplier, ...prev.slice(0, 9)]);
      const isWin = multiplier >= 1.0;
      setLastOutcome({ amount: winAmount, multiplier, bet: ballBetAmount, isWin });

      // Audio & Confetti Feedback
      if (multiplier >= 5.0) {
        sound.playWin();
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.85 } });
      } else if (multiplier >= 1.4) {
        sound.playCoinFlip();
      }

      // Transmit to authoritative studio backend
      if (onRecordRound) {
        onRecordRound({ bet: ballBetAmount, win: winAmount, multiplier });
      }

      // Cleanup landed ball
      setActiveBalls((prev) => prev.filter((b) => b.id !== ballId));
    },
    [onUpdateBalance, onRecordRound]
  );

  return (
    <div className="w-full flex flex-col space-y-3">
      {/* Top Drop History Strip */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider shrink-0 flex items-center gap-1">
          <History className="w-3.5 h-3.5 text-cyan-400" /> Recent:
        </span>
        {dropHistory.map((mult, idx) => (
          <span
            key={idx}
            className={`text-xs font-mono font-black px-2.5 py-0.5 rounded-xl shrink-0 transition-all ${
              mult >= 20
                ? "bg-rose-950/70 text-rose-300 border border-rose-500/50 shadow-md shadow-rose-500/20"
                : mult >= 3
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/50"
                : mult >= 1.4
                ? "bg-emerald-950/70 text-emerald-300 border border-emerald-500/50"
                : mult === 1.0
                ? "bg-sky-950/50 text-sky-400 border border-sky-500/30"
                : "bg-slate-900/90 text-slate-400 border border-slate-800"
            }`}
          >
            {mult}x
          </span>
        ))}
      </div>

      {/* 60FPS Full-View Plinko Physics Arena */}
      <div className="w-full h-[310px] sm:h-[380px] md:h-[450px]">
        <DropXCanvas
          rows={rows}
          risk={risk}
          multipliers={activeMultipliers}
          balls={activeBalls}
          onBallLanded={handleBallLanded}
        />
      </div>

      {/* Ergonomic Dashboard Panel */}
      <div className="bg-[#080d18] border border-slate-800/90 rounded-3xl p-4 sm:p-5 shadow-2xl space-y-3.5 backdrop-blur-md">
        {/* 1. Risk Volatility Selector */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-gray-400 px-1">
            <span className="uppercase tracking-wider">Risk Volatility:</span>
            <span className="font-mono text-cyan-400">Max Multiplier: {activeMultipliers[0]}x</span>
          </div>

          <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#040812] border border-slate-800/90 rounded-2xl">
            {(["LOW", "MEDIUM", "HIGH"] as RiskLevel[]).map((r) => (
              <button
                key={r}
                onClick={() => {
                  setRisk(r);
                  sound.playCardDeal();
                }}
                className={`py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  risk === r
                    ? r === "HIGH"
                      ? "bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-lg shadow-rose-500/30 scale-[1.02]"
                      : r === "MEDIUM"
                      ? "bg-gradient-to-r from-amber-400 to-amber-500 text-black shadow-lg shadow-amber-500/30 scale-[1.02]"
                      : "bg-gradient-to-r from-cyan-400 to-cyan-500 text-black shadow-lg shadow-cyan-500/30 scale-[1.02]"
                    : "text-gray-400 hover:text-white hover:bg-slate-900"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Pyramid Pin Rows Selector */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-gray-400 px-1">
            <span className="uppercase tracking-wider">Pyramid Rows:</span>
            <span className="font-mono text-cyan-400">{rows} Rows Matrix</span>
          </div>

          <div className="grid grid-cols-5 gap-1.5 p-1 bg-[#040812] border border-slate-800/90 rounded-2xl">
            {[8, 10, 12, 14, 16].map((num) => (
              <button
                key={num}
                onClick={() => {
                  setRows(num);
                  sound.playCardDeal();
                }}
                className={`py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                  rows === num
                    ? "bg-cyan-500 text-black shadow-md shadow-cyan-500/30 font-black scale-[1.02]"
                    : "text-gray-400 hover:text-white hover:bg-slate-900"
                }`}
              >
                {num} Rows
              </button>
            ))}
          </div>
        </div>

        {/* 3. Bet Amount Input & Quick Chips */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-gray-400 px-1">
            <span className="uppercase tracking-wider">Bet Amount (INR):</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
            <div className="sm:col-span-4 flex items-center gap-1.5 bg-[#040812] border border-slate-800 rounded-2xl px-3 py-2">
              <span className="text-cyan-400 font-bold text-sm">₹</span>
              <input
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(Math.max(10, Number(e.target.value)))}
                className="w-full bg-transparent text-white font-mono font-bold text-sm focus:outline-none"
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
                      ? "bg-cyan-500 text-black border-cyan-400 shadow-md shadow-cyan-500/20"
                      : "bg-[#040812] border-slate-800 text-gray-400 hover:text-white"
                  }`}
                >
                  ₹{val}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 4. Grand Primary DROP BALL Button + Multi-Drops */}
        <div className="grid grid-cols-12 gap-2 pt-1">
          <button
            onClick={dropBall}
            className="col-span-8 h-14 rounded-2xl bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 text-black font-black text-sm shadow-xl shadow-cyan-500/25 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer border border-cyan-300/40"
          >
            <CircleDot className="w-5 h-5 stroke-[2.5]" />
            <span className="uppercase tracking-wider font-extrabold text-black/90">DROP BALL</span>
            <span className="font-mono font-black text-base">₹{betAmount}</span>
          </button>

          {/* Quick Multi-Drops */}
          <button
            onClick={() => dropMultipleBalls(5)}
            className="col-span-2 h-14 rounded-2xl bg-slate-900 border border-slate-800 hover:border-cyan-500/40 text-cyan-300 text-xs font-black transition-all active:scale-95 flex flex-col items-center justify-center cursor-pointer shadow-md"
            title="Drop 5 Balls in sequence"
          >
            <Zap className="w-4 h-4 text-cyan-400" />
            <span>x5</span>
          </button>

          <button
            onClick={() => dropMultipleBalls(10)}
            className="col-span-2 h-14 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 text-amber-300 text-xs font-black transition-all active:scale-95 flex flex-col items-center justify-center cursor-pointer shadow-md"
            title="Drop 10 Balls in sequence"
          >
            <Flame className="w-4 h-4 text-amber-400" />
            <span>x10</span>
          </button>
        </div>

        {/* Dynamic Outcome Banner (Win / Loss Accurate Representation) */}
        {lastOutcome && (
          <div
            className={`p-2.5 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg ${
              lastOutcome.multiplier >= 1.4
                ? "bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 animate-pulse"
                : lastOutcome.multiplier === 1.0
                ? "bg-sky-950/70 border border-sky-500/50 text-sky-300"
                : "bg-slate-900/90 border border-slate-700/60 text-slate-300"
            }`}
          >
            {lastOutcome.multiplier >= 1.4 ? (
              <>
                <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  Landed {lastOutcome.multiplier}x! Profit: +₹{(lastOutcome.amount - lastOutcome.bet).toFixed(0)} (Won ₹{lastOutcome.amount})
                </span>
              </>
            ) : lastOutcome.multiplier === 1.0 ? (
              <>
                <CircleDot className="w-4 h-4 text-sky-400 shrink-0" />
                <span>Landed 1.0x • Push / Refund (₹{lastOutcome.amount})</span>
              </>
            ) : (
              <>
                <TrendingDown className="w-4 h-4 text-rose-400 shrink-0" />
                <span>
                  Landed {lastOutcome.multiplier}x • Returned ₹{lastOutcome.amount} (-₹{(lastOutcome.bet - lastOutcome.amount).toFixed(0)})
                </span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

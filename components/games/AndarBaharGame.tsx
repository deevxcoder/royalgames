"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Trophy,
  Sparkles,
  Zap,
  RotateCcw,
  ShieldAlert,
  Flame,
  Wallet,
  History,
  Users,
  Coins,
  CircleDot,
  CheckCircle2,
  TrendingUp,
  Award,
} from "lucide-react";
import confetti from "canvas-confetti";
import { sound } from "@/lib/soundFx";
import {
  tickAndGetABState,
  AndarBaharRoundState,
  Card,
} from "@/lib/serverAndarBaharEngine";
import { AndarBaharCanvas } from "./AndarBaharCanvas";

interface AndarBaharGameProps {
  playerBalance: number;
  onUpdateBalance: (newBalance: number) => void;
  onRecordRound?: (data: { bet: number; win: number; multiplier: number }) => void;
  liveRtp?: number;
}

type BetChoice = "ANDAR" | "BAHAR";

interface ActivePlayerBet {
  side: BetChoice;
  amount: number;
  multiplier: number;
}

export const AndarBaharGame: React.FC<AndarBaharGameProps> = ({
  playerBalance,
  onUpdateBalance,
  onRecordRound,
  liveRtp = 96.0,
}) => {
  const [selectedChip, setSelectedChip] = useState<number>(50);
  const [activeBets, setActiveBets] = useState<{ ANDAR: number; BAHAR: number }>({ ANDAR: 0, BAHAR: 0 });
  const [gameState, setGameState] = useState<AndarBaharRoundState>(() => tickAndGetABState());
  const [settledRounds, setSettledRounds] = useState<Record<string, boolean>>({});
  const [lastWin, setLastWin] = useState<{ amount: number; side: BetChoice; multiplier: number } | null>(null);

  // Simulated live multiplayer activity counters
  const [multiplayerStats, setMultiplayerStats] = useState({
    andarPool: 34500,
    andarCount: 142,
    baharPool: 41200,
    baharCount: 168,
  });

  const balanceRef = useRef(playerBalance);
  useEffect(() => {
    balanceRef.current = playerBalance;
  }, [playerBalance]);

  // Scaled multipliers calibrated to standard iGaming Table House Edge (95.0% RTP / ~5-7% House Edge)
  const andarMultiplier = 1.80;
  const baharMultiplier = 1.90;

  // 1. Authoritative 50ms Clock Tick Loop
  useEffect(() => {
    const interval = setInterval(() => {
      const state = tickAndGetABState();
      setGameState(state);

      // Dynamically simulate small fluctuating multiplayer bets
      if (state.phase === "BETTING" && Math.random() < 0.25) {
        setMultiplayerStats((prev) => ({
          andarPool: prev.andarPool + Math.floor(Math.random() * 500) + 100,
          andarCount: prev.andarCount + (Math.random() < 0.5 ? 1 : 0),
          baharPool: prev.baharPool + Math.floor(Math.random() * 600) + 100,
          baharCount: prev.baharCount + (Math.random() < 0.5 ? 1 : 0),
        }));
      }

      // Reset pool on new round
      if (state.phase === "BETTING" && state.countdownLeft > 9.5) {
        setMultiplayerStats({
          andarPool: Math.floor(Math.random() * 15000) + 20000,
          andarCount: Math.floor(Math.random() * 50) + 100,
          baharPool: Math.floor(Math.random() * 18000) + 22000,
          baharCount: Math.floor(Math.random() * 50) + 110,
        });
      }
    }, 50);

    return () => clearInterval(interval);
  }, []);

  // 2. Automatic Round Settlement in RESULT phase
  useEffect(() => {
    if (gameState.phase === "RESULT" && !settledRounds[gameState.roundId]) {
      setSettledRounds((prev) => ({ ...prev, [gameState.roundId]: true }));

      const winningSide = gameState.winningSide;
      const userBetOnWin = activeBets[winningSide];
      const userBetTotal = activeBets.ANDAR + activeBets.BAHAR;

      if (userBetTotal > 0) {
        if (userBetOnWin > 0) {
          // User Won!
          const mult = winningSide === "ANDAR" ? andarMultiplier : baharMultiplier;
          const totalWin = Number((userBetOnWin * mult).toFixed(2));

          balanceRef.current = Number((balanceRef.current + totalWin).toFixed(2));
          onUpdateBalance(balanceRef.current);

          setLastWin({ amount: totalWin, side: winningSide, multiplier: mult });
          sound.playWin();
          confetti({ particleCount: 75, spread: 70, origin: { y: 0.6 } });

          if (onRecordRound) {
            onRecordRound({ bet: userBetTotal, win: totalWin, multiplier: mult });
          }
        } else {
          // User Lost
          sound.playLoss();
          if (onRecordRound) {
            onRecordRound({ bet: userBetTotal, win: 0, multiplier: 0 });
          }
        }

        // Reset active bets after round finishes
        setActiveBets({ ANDAR: 0, BAHAR: 0 });
      }
    }
  }, [
    gameState.phase,
    gameState.roundId,
    gameState.winningSide,
    activeBets,
    andarMultiplier,
    baharMultiplier,
    onUpdateBalance,
    onRecordRound,
    settledRounds,
  ]);

  // 3. Place Bet on ANDAR or BAHAR
  const handlePlaceBet = (side: BetChoice) => {
    if (gameState.phase !== "BETTING") {
      alert("Betting is currently closed for this round. Please wait for the next deal!");
      return;
    }

    if (balanceRef.current < selectedChip) {
      alert("Insufficient Balance");
      return;
    }

    // Atomically deduct chip bet
    balanceRef.current = Number((balanceRef.current - selectedChip).toFixed(2));
    onUpdateBalance(balanceRef.current);
    sound.playChipBet();

    setActiveBets((prev) => ({
      ...prev,
      [side]: prev[side] + selectedChip,
    }));
  };

  // 4. Clear Bets
  const handleClearBets = () => {
    if (gameState.phase !== "BETTING") return;
    const totalBet = activeBets.ANDAR + activeBets.BAHAR;
    if (totalBet === 0) return;

    // Refund
    balanceRef.current = Number((balanceRef.current + totalBet).toFixed(2));
    onUpdateBalance(balanceRef.current);
    setActiveBets({ ANDAR: 0, BAHAR: 0 });
    sound.playCardDeal();
  };

  return (
    <div className="w-full flex flex-col space-y-3">
      {/* Top 20-Round Road History Strip (Bead Plate) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider shrink-0 flex items-center gap-1">
          <History className="w-3.5 h-3.5 text-amber-400" /> Road History:
        </span>
        {gameState.history.map((h, idx) => (
          <span
            key={idx}
            className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-mono font-black shrink-0 transition-transform ${
              h.winner === "ANDAR"
                ? "bg-sky-500 text-black shadow-md shadow-sky-500/30"
                : "bg-amber-500 text-black shadow-md shadow-amber-500/30"
            }`}
            title={`Round ${h.roundId} • Joker ${h.joker} • Won on ${h.count} cards`}
          >
            {h.winner === "ANDAR" ? "A" : "B"}
          </span>
        ))}
      </div>

      {/* 60FPS VIP Macau Felt Stage */}
      <div className="w-full h-[340px] sm:h-[380px] md:h-[450px]">
        <AndarBaharCanvas
          phase={gameState.phase}
          countdownLeft={gameState.countdownLeft}
          jokerCard={gameState.jokerCard}
          andarCards={gameState.andarCards}
          baharCards={gameState.baharCards}
          winningSide={gameState.winningSide}
          winningCard={gameState.winningCard}
        />
      </div>

      {/* Luxury Interactive Betting Control Arena */}
      <div className="bg-[#06140c] border border-emerald-950/90 rounded-3xl p-4 sm:p-5 shadow-2xl space-y-4 backdrop-blur-md">
        {/* 1. Dual Glowing Betting Pads: ANDAR vs BAHAR */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {/* ANDAR BETTING PAD */}
          <button
            onClick={() => handlePlaceBet("ANDAR")}
            disabled={gameState.phase !== "BETTING"}
            className={`relative p-4 rounded-2xl border transition-all cursor-pointer flex flex-col items-center justify-center gap-1 group ${
              activeBets.ANDAR > 0
                ? "bg-gradient-to-b from-sky-950/80 to-sky-900/60 border-sky-400 shadow-xl shadow-sky-500/30 scale-[1.02]"
                : "bg-[#031521] border-sky-900/60 hover:border-sky-500/60 hover:bg-sky-950/40"
            } ${gameState.phase !== "BETTING" ? "opacity-75 cursor-not-allowed" : "active:scale-98"}`}
          >
            <span className="text-[11px] font-black text-sky-400 tracking-widest uppercase">ANDAR (INSIDE)</span>
            <span className="text-xl sm:text-2xl font-black font-mono text-white">
              {andarMultiplier}x
            </span>
            <div className="text-[10px] text-sky-300/80 font-mono mt-0.5">
              ₹{multiplayerStats.andarPool.toLocaleString()} ({multiplayerStats.andarCount} Bets)
            </div>

            {/* Placed Chip Badge */}
            {activeBets.ANDAR > 0 && (
              <div className="mt-1 px-3 py-1 rounded-full bg-sky-500 text-black font-mono font-black text-xs shadow-md animate-bounce">
                Your Bet: ₹{activeBets.ANDAR}
              </div>
            )}
          </button>

          {/* BAHAR BETTING PAD */}
          <button
            onClick={() => handlePlaceBet("BAHAR")}
            disabled={gameState.phase !== "BETTING"}
            className={`relative p-4 rounded-2xl border transition-all cursor-pointer flex flex-col items-center justify-center gap-1 group ${
              activeBets.BAHAR > 0
                ? "bg-gradient-to-b from-amber-950/80 to-amber-900/60 border-amber-400 shadow-xl shadow-amber-500/30 scale-[1.02]"
                : "bg-[#1f1004] border-amber-900/60 hover:border-amber-500/60 hover:bg-amber-950/40"
            } ${gameState.phase !== "BETTING" ? "opacity-75 cursor-not-allowed" : "active:scale-98"}`}
          >
            <span className="text-[11px] font-black text-amber-400 tracking-widest uppercase">BAHAR (OUTSIDE)</span>
            <span className="text-xl sm:text-2xl font-black font-mono text-white">
              {baharMultiplier}x
            </span>
            <div className="text-[10px] text-amber-300/80 font-mono mt-0.5">
              ₹{multiplayerStats.baharPool.toLocaleString()} ({multiplayerStats.baharCount} Bets)
            </div>

            {/* Placed Chip Badge */}
            {activeBets.BAHAR > 0 && (
              <div className="mt-1 px-3 py-1 rounded-full bg-amber-400 text-black font-mono font-black text-xs shadow-md animate-bounce">
                Your Bet: ₹{activeBets.BAHAR}
              </div>
            )}
          </button>
        </div>

        {/* 2. Chip Selector & Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-emerald-950/60">
          <div className="flex items-center gap-1.5 overflow-x-auto py-1">
            <span className="text-xs font-bold text-gray-400 mr-1 uppercase">Chips:</span>
            {[20, 50, 100, 500, 1000].map((val) => (
              <button
                key={val}
                onClick={() => {
                  setSelectedChip(val);
                  sound.playChipBet();
                }}
                className={`w-11 h-11 rounded-full font-mono font-black text-xs flex items-center justify-center border transition-all cursor-pointer ${
                  selectedChip === val
                    ? val >= 500
                      ? "bg-gradient-to-tr from-amber-400 to-yellow-300 text-black border-yellow-200 shadow-lg shadow-amber-500/30 scale-110"
                      : "bg-gradient-to-tr from-emerald-500 to-teal-400 text-black border-teal-200 shadow-lg shadow-emerald-500/30 scale-110"
                    : "bg-[#03150c] text-gray-300 border-emerald-900/60 hover:border-emerald-500/40"
                }`}
              >
                ₹{val}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleClearBets}
              disabled={gameState.phase !== "BETTING" || (activeBets.ANDAR === 0 && activeBets.BAHAR === 0)}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-gray-300 hover:text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Clear
            </button>
          </div>
        </div>

        {/* 3. Victory Outcome Banner */}
        {lastWin && (
          <div className="p-3 bg-emerald-950/90 border border-emerald-500/60 rounded-2xl text-emerald-300 font-bold text-xs flex items-center justify-center gap-2 animate-bounce shadow-xl">
            <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              {lastWin.side} Won! Paid {lastWin.multiplier}x • You Won ₹{lastWin.amount.toLocaleString()}!
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

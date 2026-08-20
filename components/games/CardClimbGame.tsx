"use client";

import React, { useState } from "react";
import {
  Trophy,
  Sparkles,
  Zap,
  ShieldAlert,
  Flame,
  Wallet,
  History,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
} from "lucide-react";
import confetti from "canvas-confetti";
import { sound } from "@/lib/soundFx";

interface CardClimbGameProps {
  playerBalance: number;
  onUpdateBalance: (newBalance: number) => void;
  onRecordRound?: (data: { bet: number; win: number; multiplier: number }) => void;
}

interface Card {
  value: number; // 2 to 14 (Ace = 14)
  suit: "♠" | "♥" | "♦" | "♣";
  display: string;
  color: "red" | "black";
}

const SUITS: Array<"♠" | "♥" | "♦" | "♣"> = ["♠", "♥", "♦", "♣"];
const VALUES = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

const getRandomCard = (): Card => {
  const value = VALUES[Math.floor(Math.random() * VALUES.length)];
  const suit = SUITS[Math.floor(Math.random() * SUITS.length)];
  const displayValue =
    value === 14 ? "A" : value === 13 ? "K" : value === 12 ? "Q" : value === 11 ? "J" : `${value}`;
  const color = suit === "♥" || suit === "♦" ? "red" : "black";

  return { value, suit, display: `${displayValue}${suit}`, color };
};

export const CardClimbGame: React.FC<CardClimbGameProps> = ({
  playerBalance,
  onUpdateBalance,
  onRecordRound,
}) => {
  const [betAmount, setBetAmount] = useState(50);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentCard, setCurrentCard] = useState<Card>({
    value: 8,
    suit: "♠",
    display: "8♠",
    color: "black",
  });
  const [cardHistory, setCardHistory] = useState<Card[]>([]);
  const [climbStreak, setClimbStreak] = useState(0);
  const [accumulatedMultiplier, setAccumulatedMultiplier] = useState(1.0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [lastWin, setLastWin] = useState<{ amount: number; multiplier: number } | null>(null);

  // Dynamic Multiplier Odds based on current card rank
  const higherChance = (14 - currentCard.value) / 13;
  const lowerChance = (currentCard.value - 2) / 13;

  const higherMult = Number((0.985 / Math.max(0.08, higherChance)).toFixed(2));
  const lowerMult = Number((0.985 / Math.max(0.08, lowerChance)).toFixed(2));

  const currentCashout = Number((betAmount * accumulatedMultiplier).toFixed(2));

  // Start Deal
  const startCardClimb = () => {
    if (playerBalance < betAmount) {
      alert("Insufficient Balance");
      return;
    }

    onUpdateBalance(playerBalance - betAmount);
    const firstCard = getRandomCard();
    setCurrentCard(firstCard);
    setCardHistory([firstCard]);
    setClimbStreak(0);
    setAccumulatedMultiplier(1.0);
    setIsGameOver(false);
    setLastWin(null);
    setIsPlaying(true);
    sound.playCardDeal();
  };

  // Predict Higher or Lower
  const makePrediction = (choice: "HIGHER" | "LOWER") => {
    if (!isPlaying || isGameOver) return;

    sound.playCardDeal();
    const nextCard = getRandomCard();

    const isCorrect =
      choice === "HIGHER"
        ? nextCard.value >= currentCard.value
        : nextCard.value <= currentCard.value;

    const stepMult = choice === "HIGHER" ? higherMult : lowerMult;

    setTimeout(() => {
      setCardHistory((prev) => [nextCard, ...prev.slice(0, 7)]);
      setCurrentCard(nextCard);

      if (isCorrect) {
        const newStreak = climbStreak + 1;
        const newAccum = Number((accumulatedMultiplier * (stepMult * 0.75 + 0.35)).toFixed(2));

        setClimbStreak(newStreak);
        setAccumulatedMultiplier(newAccum);
        sound.playCoinFlip();

        if (newStreak >= 8) {
          triggerCashout(newAccum);
        }
      } else {
        setIsGameOver(true);
        setIsPlaying(false);
        sound.playLoss();
      }
    }, 200);
  };

  // Cashout Action
  const triggerCashout = (customMult?: number) => {
    if (!isPlaying && !customMult) return;
    if (climbStreak === 0 && !customMult) return;

    const finalMult = customMult || accumulatedMultiplier;
    const winAmount = Number((betAmount * finalMult).toFixed(2));

    onUpdateBalance(playerBalance + winAmount);
    setLastWin({ amount: winAmount, multiplier: finalMult });
    setIsPlaying(false);
    sound.playWin();
    confetti({ particleCount: 65, spread: 70, origin: { y: 0.6 } });

    if (onRecordRound) {
      onRecordRound({ bet: betAmount, win: winAmount, multiplier: finalMult });
    }
  };

  return (
    <div className="w-full flex flex-col space-y-4">
      {/* 60FPS Velvet Table Felt Arena */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Card Table Felt (7 cols) */}
        <div className="lg:col-span-7 bg-[#07130e] border border-emerald-500/30 rounded-3xl p-6 shadow-2xl flex flex-col items-center justify-center space-y-6 relative overflow-hidden min-h-[380px]">
          {/* Table Ambient Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="text-center space-y-1">
            <span className="text-xs text-emerald-400 font-mono font-bold tracking-widest uppercase">
              🃏 MONTE CARLO HI-LO CARD CLIMB
            </span>
            <div className="text-xs font-bold text-gray-400 font-mono">
              Climb Streak: {climbStreak} Correct • Multiplier: {accumulatedMultiplier.toFixed(2)}x
            </div>
          </div>

          {/* Current Dealt Card (3D Playing Card Presentation) */}
          <div className="w-36 h-52 bg-gradient-to-br from-white via-slate-100 to-slate-200 rounded-2xl shadow-2xl border-2 border-slate-300 flex flex-col justify-between p-3.5 text-slate-900 transition-all transform hover:scale-105">
            <div className={`text-lg font-black leading-none ${currentCard.color === "red" ? "text-rose-600" : "text-black"}`}>
              {currentCard.display}
            </div>

            <div className={`text-5xl font-black text-center ${currentCard.color === "red" ? "text-rose-600" : "text-black"}`}>
              {currentCard.suit}
            </div>

            <div className={`text-lg font-black text-right leading-none ${currentCard.color === "red" ? "text-rose-600" : "text-black"}`}>
              {currentCard.display}
            </div>
          </div>

          {/* Previous Cards Road Strip */}
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-sm">
            {cardHistory.slice(1).map((c, i) => (
              <span
                key={i}
                className={`text-xs font-bold font-mono px-2 py-1 rounded-lg bg-[#040d09] border border-slate-800 ${
                  c.color === "red" ? "text-rose-400" : "text-gray-300"
                }`}
              >
                {c.display}
              </span>
            ))}
          </div>
        </div>

        {/* Right: Controls & Prediction Buttons (5 cols) */}
        <div className="lg:col-span-5 bg-[#07130e] border border-slate-800/90 rounded-3xl p-5 shadow-2xl space-y-4">
          <div className="space-y-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Bet Stake (INR)</span>
            <div className="flex items-center gap-2 bg-[#040d09] border border-slate-800 rounded-2xl px-3 py-2">
              <span className="text-emerald-400 font-bold text-sm">₹</span>
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
                      ? "bg-emerald-500 text-black border-emerald-400 shadow-md shadow-emerald-500/20"
                      : "bg-[#040d09] border-slate-800 text-gray-400 hover:text-white disabled:opacity-40"
                  }`}
                >
                  ₹{val}
                </button>
              ))}
            </div>
          </div>

          {/* Primary Actions */}
          {!isPlaying ? (
            <button
              onClick={startCardClimb}
              className="w-full h-20 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-black text-base shadow-xl shadow-emerald-500/25 transition-all active:scale-95 flex flex-col items-center justify-center space-y-0.5"
            >
              <span className="text-xs uppercase tracking-widest font-extrabold text-black/90">DEAL CARDS</span>
              <span className="text-xl font-mono font-black">₹{betAmount}</span>
            </button>
          ) : (
            <div className="space-y-3">
              {/* Higher / Lower Dual Buttons */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => makePrediction("HIGHER")}
                  className="h-20 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-sm shadow-lg shadow-amber-500/20 transition-all active:scale-95 flex flex-col items-center justify-center"
                >
                  <div className="flex items-center gap-1">
                    <span>HIGHER</span>
                    <ArrowUpRight className="w-4 h-4 stroke-[3]" />
                  </div>
                  <span className="text-xs font-mono font-black">+{higherMult}x</span>
                </button>

                <button
                  onClick={() => makePrediction("LOWER")}
                  className="h-20 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-black text-sm shadow-lg shadow-cyan-500/20 transition-all active:scale-95 flex flex-col items-center justify-center"
                >
                  <div className="flex items-center gap-1">
                    <span>LOWER</span>
                    <ArrowDownRight className="w-4 h-4 stroke-[3]" />
                  </div>
                  <span className="text-xs font-mono font-black">+{lowerMult}x</span>
                </button>
              </div>

              {/* Cashout Button */}
              {climbStreak > 0 && (
                <button
                  onClick={() => triggerCashout()}
                  className="w-full h-14 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-sm shadow-xl shadow-emerald-500/30 transition-all active:scale-95 flex items-center justify-center gap-2 animate-pulse"
                >
                  <span className="text-xs uppercase tracking-wider font-extrabold">CASH OUT</span>
                  <span className="text-base font-mono font-black">₹{currentCashout} ({accumulatedMultiplier.toFixed(2)}x)</span>
                </button>
              )}
            </div>
          )}

          {/* Loss Alert */}
          {isGameOver && (
            <div className="p-2.5 bg-rose-950/60 border border-rose-500/50 rounded-2xl text-rose-300 font-bold text-xs flex items-center justify-center gap-2 animate-shake">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span>Incorrect Guess! Card Was {currentCard.display}. Lost ₹{betAmount}.</span>
            </div>
          )}

          {/* Win Celebration Banner */}
          {lastWin && (
            <div className="p-2.5 bg-emerald-950/60 border border-emerald-500/50 rounded-2xl text-emerald-300 font-bold text-xs flex items-center justify-center gap-2 animate-bounce">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>Card Climb Win! Payout: ₹{lastWin.amount} ({lastWin.multiplier.toFixed(2)}x)!</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

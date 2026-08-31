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
  Award,
} from "lucide-react";
import confetti from "canvas-confetti";
import { sound } from "@/lib/soundFx";
import { CardClimbCanvas, PlayingCard } from "./CardClimbCanvas";

interface CardClimbGameProps {
  playerBalance: number;
  onUpdateBalance: (newBalance: number) => void;
  onRecordRound?: (data: { bet: number; win: number; multiplier: number }) => void;
  liveRtp?: number;
}

const SUITS: Array<"♠" | "♥" | "♦" | "♣"> = ["♠", "♥", "♦", "♣"];
const VALUES = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

const getRandomCard = (): PlayingCard => {
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
  liveRtp = 96.0,
}) => {
  const [betAmount, setBetAmount] = useState(50);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentCard, setCurrentCard] = useState<PlayingCard>({
    value: 8,
    suit: "♠",
    display: "8♠",
    color: "black",
  });
  const [cardHistory, setCardHistory] = useState<PlayingCard[]>([]);
  const [climbStreak, setClimbStreak] = useState(0);
  const [accumulatedMultiplier, setAccumulatedMultiplier] = useState(1.0);
  const [isFlipping, setIsFlipping] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isWin, setIsWin] = useState<boolean | null>(null);
  const [lastWin, setLastWin] = useState<{ amount: number; multiplier: number } | null>(null);

  const balanceRef = React.useRef(playerBalance);
  React.useEffect(() => {
    balanceRef.current = playerBalance;
  }, [playerBalance]);

  // Dynamic Multiplier Odds based on current card rank & liveRtp
  const activeRtpFraction = (liveRtp || 96.0) / 100;
  const higherChance = (14 - currentCard.value) / 13;
  const lowerChance = (currentCard.value - 2) / 13;

  const higherMult = Number((activeRtpFraction / Math.max(0.08, higherChance)).toFixed(2));
  const lowerMult = Number((activeRtpFraction / Math.max(0.08, lowerChance)).toFixed(2));

  const currentCashout = Number((betAmount * accumulatedMultiplier).toFixed(2));

  // Start Deal
  const startCardClimb = () => {
    if (balanceRef.current < betAmount) {
      alert("Insufficient Balance");
      return;
    }

    balanceRef.current = Number((balanceRef.current - betAmount).toFixed(2));
    onUpdateBalance(balanceRef.current);

    const firstCard = getRandomCard();
    setCurrentCard(firstCard);
    setCardHistory([firstCard]);
    setClimbStreak(0);
    setAccumulatedMultiplier(1.0);
    setIsGameOver(false);
    setIsWin(null);
    setLastWin(null);
    setIsPlaying(true);
    setIsFlipping(true);
    sound.playCardDeal();

    setTimeout(() => {
      setIsFlipping(false);
    }, 400);
  };

  // Predict Higher or Lower
  const makePrediction = (choice: "HIGHER" | "LOWER") => {
    if (!isPlaying || isGameOver || isFlipping) return;

    sound.playCardDeal();
    setIsFlipping(true);
    const nextCard = getRandomCard();

    const isCorrect =
      choice === "HIGHER"
        ? nextCard.value >= currentCard.value
        : nextCard.value <= currentCard.value;

    const stepMult = choice === "HIGHER" ? higherMult : lowerMult;

    setTimeout(() => {
      setCardHistory((prev) => [nextCard, ...prev.slice(0, 7)]);
      setCurrentCard(nextCard);
      setIsFlipping(false);

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
        setIsWin(false);
        sound.playLoss();
        if (onRecordRound) {
          onRecordRound({ bet: betAmount, win: 0, multiplier: 0 });
        }
      }
    }, 380);
  };

  // Cashout Action
  const triggerCashout = (customMult?: number) => {
    if (!isPlaying && !customMult) return;
    if (climbStreak === 0 && !customMult) return;

    const finalMult = customMult || accumulatedMultiplier;
    const winAmount = Number((betAmount * finalMult).toFixed(2));

    balanceRef.current = Number((balanceRef.current + winAmount).toFixed(2));
    onUpdateBalance(balanceRef.current);

    setLastWin({ amount: winAmount, multiplier: finalMult });
    setIsPlaying(false);
    setIsWin(true);
    sound.playWin();
    confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });

    if (onRecordRound) {
      onRecordRound({ bet: betAmount, win: winAmount, multiplier: finalMult });
    }
  };

  return (
    <div className="w-full flex flex-col space-y-3">
      {/* 60FPS 3D Royal Card Felt Stage */}
      <div className="w-full h-[270px] sm:h-[340px] md:h-[420px]">
        <CardClimbCanvas
          currentCard={currentCard}
          cardHistory={cardHistory}
          climbStreak={climbStreak}
          accumulatedMultiplier={accumulatedMultiplier}
          isPlaying={isPlaying}
          isFlipping={isFlipping}
          isGameOver={isGameOver}
          isWin={isWin}
        />
      </div>

      {/* Spacious, Ergonomic Dashboard Controls Panel */}
      <div className="bg-[#07130e] border border-emerald-950/80 rounded-3xl p-4 sm:p-5 shadow-2xl space-y-3.5 backdrop-blur-md">
        {!isPlaying ? (
          /* ========================================================= */
          /* 1. BETTING DASHBOARD (Before Deal) */
          /* ========================================================= */
          <div className="space-y-3.5">
            {/* Row 1: Bet Amount Input & Quick Chips */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-gray-400 px-1">
                <span className="uppercase tracking-wider">Bet Stake (INR):</span>
                <span className="font-mono text-emerald-400">Streak Max: 80x+ Jackpot</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                <div className="sm:col-span-4 flex items-center gap-1.5 bg-[#040d09] border border-slate-800 rounded-2xl px-3 py-2">
                  <span className="text-emerald-400 font-black text-sm">₹</span>
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
                          ? "bg-emerald-500 text-black border-emerald-400 shadow-md shadow-emerald-500/20"
                          : "bg-[#040d09] border-slate-800 text-gray-400 hover:text-white"
                      }`}
                    >
                      ₹{val}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Row 2: Grand DEAL CARDS Button */}
            <button
              onClick={startCardClimb}
              className="w-full h-14 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 hover:from-emerald-400 hover:to-teal-300 text-black font-black text-sm sm:text-base shadow-xl shadow-emerald-500/25 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer border border-emerald-300/40"
            >
              <Layers className="w-5 h-5 stroke-[2.5]" />
              <span className="uppercase tracking-wider font-extrabold text-black/90">DEAL CARDS</span>
              <span className="font-mono font-black text-base sm:text-lg">₹{betAmount}</span>
            </button>
          </div>
        ) : (
          /* ========================================================= */
          /* 2. IN-GAME ACTIVE PREDICTION & CASHOUT CONTROLS */
          /* ========================================================= */
          <div className="space-y-3">
            {/* Higher / Lower Dual Predictor Buttons */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => makePrediction("HIGHER")}
                disabled={isFlipping}
                className="h-16 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-black font-black text-xs sm:text-sm shadow-xl shadow-amber-500/25 transition-all active:scale-95 flex flex-col items-center justify-center cursor-pointer border border-amber-300/50"
              >
                <div className="flex items-center gap-1">
                  <span className="uppercase font-black">HIGHER 🔼</span>
                  <ArrowUpRight className="w-4 h-4 stroke-[3]" />
                </div>
                <span className="text-xs font-mono font-extrabold text-black/90">
                  +{higherMult}x (Rank ≥ {currentCard.display})
                </span>
              </button>

              <button
                onClick={() => makePrediction("LOWER")}
                disabled={isFlipping}
                className="h-16 rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-500 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-black font-black text-xs sm:text-sm shadow-xl shadow-cyan-500/25 transition-all active:scale-95 flex flex-col items-center justify-center cursor-pointer border border-cyan-300/50"
              >
                <div className="flex items-center gap-1">
                  <span className="uppercase font-black">LOWER 🔽</span>
                  <ArrowDownRight className="w-4 h-4 stroke-[3]" />
                </div>
                <span className="text-xs font-mono font-extrabold text-black/90">
                  +{lowerMult}x (Rank ≤ {currentCard.display})
                </span>
              </button>
            </div>

            {/* Cashout Button */}
            <button
              onClick={() => triggerCashout()}
              disabled={climbStreak === 0}
              className={`w-full h-14 rounded-2xl font-black text-xs sm:text-sm shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer ${
                climbStreak > 0
                  ? "bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600 hover:from-emerald-300 hover:to-emerald-500 text-black shadow-emerald-500/30 border border-emerald-300/50 animate-pulse"
                  : "bg-[#040d09] border border-slate-800 text-gray-500 cursor-not-allowed opacity-50"
              }`}
            >
              <span className="uppercase tracking-wider font-extrabold">
                {climbStreak > 0 ? "CASH OUT 💰" : "FIRST STREAK REQUIRED"}
              </span>
              <span className="font-mono font-black text-sm sm:text-base">
                ₹{currentCashout} {climbStreak > 0 ? `(${accumulatedMultiplier.toFixed(2)}x)` : ""}
              </span>
            </button>
          </div>
        )}

        {/* Loss Alert */}
        {isGameOver && (
          <div className="p-2.5 bg-rose-950/80 border border-rose-500/70 rounded-2xl text-rose-200 font-bold text-xs flex items-center justify-center gap-2 animate-shake shadow-lg">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
            <span>Incorrect Guess! Card Was {currentCard.display}. Lost ₹{betAmount}.</span>
          </div>
        )}

        {/* Win Celebration Banner */}
        {lastWin && (
          <div className="p-2.5 bg-emerald-950/80 border border-emerald-500/70 rounded-2xl text-emerald-200 font-bold text-xs flex items-center justify-center gap-2 shadow-lg">
            <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Card Climb Success! Won ₹{lastWin.amount.toLocaleString()} ({lastWin.multiplier}x)!</span>
          </div>
        )}
      </div>
    </div>
  );
};

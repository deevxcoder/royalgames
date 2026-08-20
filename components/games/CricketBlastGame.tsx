"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Trophy,
  Zap,
  TrendingUp,
  History,
  ShieldAlert,
  Flame,
  Award,
  Wallet,
  CheckCircle2,
} from "lucide-react";
import confetti from "canvas-confetti";
import { sound } from "@/lib/soundFx";
import { CricketBlastCanvas } from "./CricketBlastCanvas";

interface CricketBlastGameProps {
  playerBalance: number;
  onUpdateBalance: (newBalance: number) => void;
  onRecordRound?: (data: { bet: number; win: number; multiplier: number }) => void;
}

export const CricketBlastGame: React.FC<CricketBlastGameProps> = ({
  playerBalance,
  onUpdateBalance,
  onRecordRound,
}) => {
  const [gameState, setGameState] = useState<"PREPARING" | "AIRBORNE" | "CAUGHT">("PREPARING");
  const [multiplier, setMultiplier] = useState(1.0);
  const [countdown, setCountdown] = useState(4.0);
  const [crashMultiplier, setCrashMultiplier] = useState<number>(3.5);
  const [shotHistory, setShotHistory] = useState<number[]>([6.4, 1.85, 2.4, 18.2, 1.15, 4.8, 1.02, 12.5]);

  // Bet State
  const [betAmount, setBetAmount] = useState(50);
  const [isBetPlaced, setIsBetPlaced] = useState(false);
  const [hasCashedOut, setHasCashedOut] = useState(false);
  const [autoCashoutEnabled, setAutoCashoutEnabled] = useState(false);
  const [autoCashoutMult, setAutoCashoutMult] = useState(2.0);
  const [lastWin, setLastWin] = useState<{ amount: number; multiplier: number } | null>(null);

  const gameLoopRef = useRef<any>(null);
  const countdownRef = useRef<any>(null);

  // 1. Start Countdown Sequence
  const startCountdown = useCallback(() => {
    setGameState("PREPARING");
    setMultiplier(1.0);
    setCountdown(4.0);
    setHasCashedOut(false);

    let timeLeft = 4.0;
    countdownRef.current = setInterval(() => {
      timeLeft -= 0.1;
      if (timeLeft <= 0) {
        clearInterval(countdownRef.current);
        startShot();
      } else {
        setCountdown(Number(timeLeft.toFixed(1)));
      }
    }, 100);
  }, []);

  // 2. Start Active Shot in Air
  const startShot = () => {
    setGameState("AIRBORNE");
    setMultiplier(1.0);
    sound.startJetEngine();

    // Determine secret boundary catch point (House Edge 2.4%)
    const r = Math.random();
    const secretCrash = Math.max(1.01, Number((0.976 / (1 - r)).toFixed(2)));
    setCrashMultiplier(secretCrash);

    if (isBetPlaced && playerBalance >= betAmount) {
      onUpdateBalance(playerBalance - betAmount);
    }

    const startTime = Date.now();

    gameLoopRef.current = setInterval(() => {
      const elapsedSec = (Date.now() - startTime) / 1000;
      const currentMult = Number(Math.exp(0.07 * Math.pow(elapsedSec * 1.4, 1.2)).toFixed(2));

      sound.updateJetPitch(currentMult);

      // Check Auto-Cashout
      if (
        isBetPlaced &&
        !hasCashedOut &&
        autoCashoutEnabled &&
        currentMult >= autoCashoutMult &&
        currentMult < secretCrash
      ) {
        triggerCashout(currentMult);
      }

      // Check Catch Out Event
      if (currentMult >= secretCrash) {
        clearInterval(gameLoopRef.current);
        setMultiplier(secretCrash);
        setGameState("CAUGHT");
        sound.playSonicBoom();
        setShotHistory((prev) => [secretCrash, ...prev.slice(0, 9)]);
        setIsBetPlaced(false);

        // Schedule next ball
        setTimeout(() => {
          startCountdown();
        }, 3000);
      } else {
        setMultiplier(currentMult);
      }
    }, 50);
  };

  // 3. Cashout Shot Action
  const triggerCashout = (customMult?: number) => {
    if (!isBetPlaced || hasCashedOut || gameState !== "AIRBORNE") return;

    const finalMult = customMult || multiplier;
    const winAmount = Number((betAmount * finalMult).toFixed(2));

    setHasCashedOut(true);
    setIsBetPlaced(false);
    onUpdateBalance(playerBalance + winAmount);
    setLastWin({ amount: winAmount, multiplier: finalMult });

    sound.playWin();
    confetti({ particleCount: 70, spread: 75, origin: { y: 0.6 } });

    if (onRecordRound) {
      onRecordRound({ bet: betAmount, win: winAmount, multiplier: finalMult });
    }
  };

  // Toggle Bet Placement
  const handleToggleBet = () => {
    if (gameState === "AIRBORNE" && isBetPlaced) {
      triggerCashout();
      return;
    }

    if (isBetPlaced) {
      setIsBetPlaced(false);
    } else {
      if (playerBalance < betAmount) {
        alert("Insufficient Balance");
        return;
      }
      sound.playChipBet();
      setIsBetPlaced(true);
    }
  };

  useEffect(() => {
    startCountdown();
    return () => {
      clearInterval(gameLoopRef.current);
      clearInterval(countdownRef.current);
      sound.stopJetEngine();
    };
  }, [startCountdown]);

  return (
    <div className="w-full flex flex-col space-y-4">
      {/* Top Shot History Highway */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider shrink-0 flex items-center gap-1">
          <History className="w-3 h-3 text-amber-400" /> Match Overs:
        </span>
        {shotHistory.map((mult, idx) => (
          <span
            key={idx}
            className={`text-xs font-mono font-black px-2.5 py-1 rounded-xl shrink-0 transition-all ${
              mult >= 6
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-md shadow-amber-500/20"
                : mult >= 2
                ? "bg-emerald-950/70 text-emerald-300 border border-emerald-500/50"
                : "bg-slate-900 text-sky-400 border border-slate-800"
            }`}
          >
            {mult.toFixed(2)}x
          </span>
        ))}
      </div>

      {/* 60FPS Night Stadium Canvas Stage */}
      <div className="w-full h-[360px] sm:h-[400px] md:h-[450px]">
        <CricketBlastCanvas
          gameState={gameState}
          multiplier={multiplier}
          countdown={countdown}
          crashMultiplier={crashMultiplier}
        />
      </div>

      {/* Interactive Cricket Bet Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left: Bet Config & Auto-Cashout (6 cols) */}
        <div className="lg:col-span-6 bg-[#081224] border border-amber-500/30 rounded-3xl p-5 shadow-2xl space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">Batter Shot Stake</span>
            {/* Auto Cashout Toggle */}
            <div className="flex items-center gap-2 text-xs">
              <label className="text-gray-400 font-bold text-[11px]">Auto Cashout</label>
              <input
                type="checkbox"
                checked={autoCashoutEnabled}
                onChange={(e) => setAutoCashoutEnabled(e.target.checked)}
                className="accent-amber-500 w-3.5 h-3.5 rounded"
              />
              {autoCashoutEnabled && (
                <input
                  type="number"
                  step="0.1"
                  min="1.05"
                  value={autoCashoutMult}
                  onChange={(e) => setAutoCashoutMult(Math.max(1.05, Number(e.target.value)))}
                  className="w-16 bg-[#040914] border border-slate-700 rounded-lg px-2 py-0.5 text-xs font-mono font-bold text-amber-400 focus:outline-none"
                />
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 bg-[#040914] border border-slate-800 rounded-2xl px-3 py-2">
              <span className="text-amber-400 font-bold text-sm">₹</span>
              <input
                type="number"
                disabled={gameState === "AIRBORNE" && isBetPlaced}
                value={betAmount}
                onChange={(e) => setBetAmount(Math.max(10, Number(e.target.value)))}
                className="w-full bg-transparent text-white font-mono font-bold text-base focus:outline-none disabled:opacity-50"
              />
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              {[20, 50, 100, 500].map((val) => (
                <button
                  key={val}
                  disabled={gameState === "AIRBORNE" && isBetPlaced}
                  onClick={() => {
                    setBetAmount(val);
                    sound.playChipBet();
                  }}
                  className={`py-1.5 rounded-xl text-xs font-mono font-bold border transition-colors ${
                    betAmount === val
                      ? "bg-amber-500 text-black border-amber-400"
                      : "bg-[#040914] border-slate-800 text-gray-400 hover:text-white disabled:opacity-40"
                  }`}
                >
                  ₹{val}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Primary HIT SIX / CASHOUT Button (6 cols) */}
        <div className="lg:col-span-6 bg-[#081224] border border-slate-800/90 rounded-3xl p-5 shadow-2xl flex flex-col justify-center min-h-[175px]">
          {gameState === "AIRBORNE" && isBetPlaced && !hasCashedOut ? (
            <button
              onClick={() => triggerCashout()}
              className="w-full h-24 rounded-2xl bg-gradient-to-r from-emerald-400 to-emerald-600 hover:from-emerald-300 hover:to-emerald-500 text-black font-black text-base shadow-xl shadow-emerald-500/30 transition-all active:scale-95 flex flex-col items-center justify-center animate-pulse"
            >
              <span className="text-xs uppercase tracking-wider font-extrabold text-black/80">CASH OUT MAXIMUM SIX</span>
              <span className="text-2xl font-mono font-black">₹{(betAmount * multiplier).toFixed(2)}</span>
            </button>
          ) : (
            <button
              onClick={handleToggleBet}
              className={`w-full h-24 rounded-2xl font-black text-base transition-all active:scale-95 flex flex-col items-center justify-center shadow-lg ${
                isBetPlaced
                  ? "bg-rose-950/60 border border-rose-500/60 text-rose-300 hover:bg-rose-900/60"
                  : "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black shadow-amber-500/25"
              }`}
            >
              <span className="text-xs uppercase tracking-wider font-extrabold">
                {isBetPlaced ? "CANCEL NEXT OVER BET" : "SMASH LOFTED SIX"}
              </span>
              <span className="text-2xl font-mono font-black">₹{betAmount}</span>
            </button>
          )}

          {/* Win Celebration Banner */}
          {lastWin && (
            <div className="mt-3 p-2 bg-emerald-950/60 border border-emerald-500/50 rounded-2xl text-emerald-300 font-bold text-xs flex items-center justify-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>Clean Six! Won ₹{lastWin.amount} ({lastWin.multiplier.toFixed(2)}x)!</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

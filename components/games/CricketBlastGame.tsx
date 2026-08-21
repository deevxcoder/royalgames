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

  // Synchronized state refs for rock-solid interval execution
  const isBetPlacedRef = useRef(isBetPlaced);
  const hasCashedOutRef = useRef(hasCashedOut);
  const autoCashoutEnabledRef = useRef(autoCashoutEnabled);
  const autoCashoutMultRef = useRef(autoCashoutMult);
  const betAmountRef = useRef(betAmount);
  const playerBalanceRef = useRef(playerBalance);
  const gameStateRef = useRef(gameState);

  useEffect(() => { isBetPlacedRef.current = isBetPlaced; }, [isBetPlaced]);
  useEffect(() => { hasCashedOutRef.current = hasCashedOut; }, [hasCashedOut]);
  useEffect(() => { autoCashoutEnabledRef.current = autoCashoutEnabled; }, [autoCashoutEnabled]);
  useEffect(() => { autoCashoutMultRef.current = autoCashoutMult; }, [autoCashoutMult]);
  useEffect(() => { betAmountRef.current = betAmount; }, [betAmount]);
  useEffect(() => { playerBalanceRef.current = playerBalance; }, [playerBalance]);
  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);

  // 1. Start Countdown Sequence
  const startCountdown = useCallback(() => {
    setGameState("PREPARING");
    setMultiplier(1.0);
    setCountdown(4.0);
    setHasCashedOut(false);

    if (countdownRef.current) clearInterval(countdownRef.current);
    if (gameLoopRef.current) clearInterval(gameLoopRef.current);

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

    const placed = isBetPlacedRef.current;
    const bet = betAmountRef.current;
    const bal = playerBalanceRef.current;

    if (placed && bal >= bet) {
      onUpdateBalance(bal - bet);
    }

    const startTime = Date.now();

    gameLoopRef.current = setInterval(() => {
      const elapsedSec = (Date.now() - startTime) / 1000;
      const currentMult = Number(Math.exp(0.07 * Math.pow(elapsedSec * 1.4, 1.2)).toFixed(2));

      sound.updateJetPitch(currentMult);

      // Check Auto-Cashout
      if (
        isBetPlacedRef.current &&
        !hasCashedOutRef.current &&
        autoCashoutEnabledRef.current &&
        autoCashoutMultRef.current > 1.0 &&
        currentMult >= autoCashoutMultRef.current &&
        currentMult < secretCrash
      ) {
        triggerCashout(autoCashoutMultRef.current);
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
    if (!isBetPlacedRef.current || hasCashedOutRef.current || gameStateRef.current !== "AIRBORNE") return;

    const finalMult = customMult ? Number(customMult.toFixed(2)) : multiplier;
    const bet = betAmountRef.current;
    const winAmount = Number((bet * finalMult).toFixed(2));

    setHasCashedOut(true);
    setIsBetPlaced(false);
    onUpdateBalance(playerBalanceRef.current + winAmount);
    setLastWin({ amount: winAmount, multiplier: finalMult });

    sound.playWin();
    confetti({ particleCount: 70, spread: 75, origin: { y: 0.6 } });

    if (onRecordRound) {
      onRecordRound({ bet, win: winAmount, multiplier: finalMult });
    }
  };

  // Toggle Bet Placement - STRICT LOCK RULE (Only allowed during PREPARING countdown)
  const handleToggleBet = () => {
    if (gameState === "AIRBORNE" && isBetPlaced && !hasCashedOut) {
      triggerCashout();
      return;
    }

    if (gameState !== "PREPARING") return;

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

  const isInputsDisabled = gameState !== "PREPARING" || isBetPlaced;

  return (
    <div className="w-full flex flex-col space-y-3">
      {/* Top Shot History Highway */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider shrink-0 flex items-center gap-1">
          <History className="w-3.5 h-3.5 text-amber-400" /> Recent Overs:
        </span>
        {shotHistory.map((mult, idx) => (
          <span
            key={idx}
            className={`text-xs font-mono font-black px-2.5 py-0.5 rounded-xl shrink-0 transition-all ${
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
      <div className="w-full h-[280px] sm:h-[350px] md:h-[420px]">
        <CricketBlastCanvas
          gameState={gameState}
          multiplier={multiplier}
          countdown={countdown}
          crashMultiplier={crashMultiplier}
        />
      </div>

      {/* Spacious, Ergonomic Dashboard Controls Panel */}
      <div className="bg-[#081224] border border-amber-500/30 rounded-3xl p-4 sm:p-5 shadow-2xl space-y-3.5 backdrop-blur-md">
        {/* Row 1: Auto Cashout Control Bar */}
        <div className="flex items-center justify-between p-2 bg-[#040914] border border-slate-800 rounded-2xl">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span className="text-xs font-black text-white uppercase tracking-wider">Batter Stake Controls</span>
            {gameState === "AIRBORNE" && !isBetPlaced && (
              <span className="text-[9px] font-mono text-rose-400 bg-rose-950/60 border border-rose-800/60 px-1.5 py-0.2 rounded font-bold">
                LOCKED
              </span>
            )}
          </div>

          {/* Auto Cashout Controls */}
          <div className="flex items-center gap-2 text-xs">
            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                disabled={isInputsDisabled}
                checked={autoCashoutEnabled}
                onChange={(e) => setAutoCashoutEnabled(e.target.checked)}
                className="accent-amber-500 w-3.5 h-3.5 rounded cursor-pointer disabled:opacity-50"
              />
              <span className={`text-[11px] font-bold ${autoCashoutEnabled ? "text-amber-400" : "text-gray-400"}`}>
                Auto Cashout
              </span>
            </label>

            {autoCashoutEnabled && (
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  disabled={isInputsDisabled}
                  step="0.1"
                  min="1.05"
                  max="1000"
                  value={autoCashoutMult}
                  onChange={(e) => setAutoCashoutMult(Math.max(1.05, Number(e.target.value)))}
                  className="w-16 bg-[#081224] border border-amber-500/50 rounded-lg px-1.5 py-0.5 text-xs font-mono font-bold text-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-400 disabled:opacity-50 text-right"
                />
                <span className="text-[11px] font-mono font-bold text-amber-400">x</span>
              </div>
            )}
          </div>
        </div>

        {/* Row 2: Bet Amount Input & Quick Chips */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-gray-400 px-1">
            <span className="uppercase tracking-wider">Bet Amount (INR):</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
            <div className={`sm:col-span-4 flex items-center gap-1.5 bg-[#040914] border rounded-2xl px-3 py-2 transition-colors ${
              isInputsDisabled ? "border-slate-800 opacity-60" : "border-slate-700"
            }`}>
              <span className="text-amber-400 font-black text-sm">₹</span>
              <input
                type="number"
                disabled={isInputsDisabled}
                value={betAmount}
                onChange={(e) => setBetAmount(Math.max(10, Number(e.target.value)))}
                className="w-full bg-transparent text-white font-mono font-black text-sm focus:outline-none disabled:cursor-not-allowed"
              />
            </div>

            <div className="sm:col-span-8 grid grid-cols-4 gap-1.5">
              {[20, 50, 100, 500].map((val) => (
                <button
                  key={val}
                  disabled={isInputsDisabled}
                  onClick={() => {
                    setBetAmount(val);
                    sound.playChipBet();
                  }}
                  className={`py-2 rounded-xl text-xs font-mono font-bold border transition-colors cursor-pointer ${
                    betAmount === val && !isInputsDisabled
                      ? "bg-amber-500 text-black border-amber-400 shadow-md shadow-amber-500/20"
                      : "bg-[#040914] border-slate-800 text-gray-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
                  }`}
                >
                  ₹{val}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Row 3: Grand Primary Action Button */}
        <div>
          {gameState === "AIRBORNE" && isBetPlaced && !hasCashedOut ? (
            <button
              onClick={() => triggerCashout()}
              className="w-full h-14 sm:h-16 rounded-2xl bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600 hover:from-emerald-300 hover:to-emerald-500 text-black font-black text-sm sm:text-base shadow-xl shadow-emerald-500/30 transition-all active:scale-95 flex flex-col items-center justify-center animate-pulse cursor-pointer border border-emerald-300/40"
            >
              <span className="text-[10px] sm:text-xs uppercase tracking-wider font-extrabold text-black/90">
                CASH OUT MAXIMUM SIX
              </span>
              <span className="text-base sm:text-lg font-mono font-black">
                ₹{(betAmount * multiplier).toFixed(2)} ({multiplier.toFixed(2)}x)
              </span>
            </button>
          ) : hasCashedOut ? (
            <div className="w-full h-14 sm:h-16 rounded-2xl bg-emerald-950/40 border border-emerald-500/50 flex flex-col items-center justify-center text-emerald-400">
              <span className="text-[10px] uppercase font-bold tracking-wider">CASHED OUT</span>
              <span className="text-sm sm:text-base font-mono font-black">₹{lastWin?.amount} (@{lastWin?.multiplier.toFixed(2)}x)</span>
            </div>
          ) : gameState === "PREPARING" ? (
            <button
              onClick={handleToggleBet}
              className={`w-full h-14 sm:h-16 rounded-2xl font-black text-sm transition-all active:scale-95 flex items-center justify-center gap-2 shadow-xl cursor-pointer ${
                isBetPlaced
                  ? "bg-rose-950/80 border border-rose-500/80 text-rose-300 hover:bg-rose-900/80 shadow-rose-500/20"
                  : "bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-black shadow-amber-500/25 border border-amber-300/40"
              }`}
            >
              <span className="uppercase tracking-wider font-extrabold">
                {isBetPlaced ? "CANCEL NEXT OVER BET" : "🏏 SMASH LOFTED SIX"}
              </span>
              <span className="font-mono font-black text-base sm:text-lg">₹{betAmount}</span>
            </button>
          ) : (
            <div className="w-full h-14 sm:h-16 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col items-center justify-center text-gray-500 cursor-not-allowed">
              <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 text-slate-400">
                🔒 BET LOCKED
              </span>
              <span className="text-[10px] text-gray-500">Wait for Next Delivery</span>
            </div>
          )}
        </div>

        {/* Win Celebration Banner */}
        {lastWin && (
          <div className="p-2.5 bg-emerald-950/70 border border-emerald-500/60 rounded-2xl text-emerald-300 font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg">
            <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Clean Six! Won ₹{lastWin.amount.toLocaleString()} ({lastWin.multiplier.toFixed(2)}x)!</span>
          </div>
        )}
      </div>
    </div>
  );
};

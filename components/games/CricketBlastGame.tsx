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
import { calculateAscentMultiplier } from "@/lib/serverCrashEngine";

interface CricketBlastGameProps {
  playerBalance: number;
  onUpdateBalance: (newBalance: number) => void;
  onRecordRound?: (data: { bet: number; win: number; multiplier: number }) => void;
  liveRtp?: number;
}

export const CricketBlastGame: React.FC<CricketBlastGameProps> = ({
  playerBalance,
  onUpdateBalance,
  onRecordRound,
}) => {
  const [gameState, setGameState] = useState<"PREPARING" | "AIRBORNE" | "CAUGHT">("PREPARING");
  const [multiplier, setMultiplier] = useState(1.0);
  const [countdown, setCountdown] = useState(10.0);
  const [crashMultiplier, setCrashMultiplier] = useState<number>(3.5);
  const [shotHistory, setShotHistory] = useState<number[]>([6.4, 1.85, 2.4, 18.2, 1.15, 4.8, 1.02, 12.5]);

  // Bet State
  const [betAmount, setBetAmount] = useState(50);
  const [isBetPlaced, setIsBetPlaced] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [hasCashedOut, setHasCashedOut] = useState(false);
  const [autoCashoutEnabled, setAutoCashoutEnabled] = useState(false);
  const [autoCashoutMult, setAutoCashoutMult] = useState(2.0);
  const [lastWin, setLastWin] = useState<{ amount: number; multiplier: number } | null>(null);

  const serverStateRef = useRef<any>(null);
  const currentRoundIdRef = useRef<string>("");
  const activePhaseRef = useRef<string>("");

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

  const serverOffsetRef = useRef<number>(0);
  const lastServerTimeRef = useRef<number>(0);
  const settledRoundsRef = useRef<Set<string>>(new Set());
  const deductedRoundsRef = useRef<Set<string>>(new Set());

  // Real-Time Server State Synchronizer
  useEffect(() => {
    let isMounted = true;

    const pollServerState = async () => {
      try {
        const fetchStart = Date.now();
        const res = await fetch("/api/studio/multiplayer/state?game=royal_cricketblast&_t=" + fetchStart, {
          cache: "no-store",
        });
        const data = await res.json();
        const fetchEnd = Date.now();
        if (!isMounted || !data.success) return;

        // Discard out-of-order poll responses
        if (data.serverTime && data.serverTime < lastServerTimeRef.current) return;
        lastServerTimeRef.current = data.serverTime;

        // Smooth Exponential Moving Average for server clock offset
        const roundTrip = fetchEnd - fetchStart;
        if (roundTrip < 1000) {
          const estimatedServerNow = data.serverTime + Math.floor(roundTrip / 2);
          const newOffset = estimatedServerNow - fetchEnd;
          serverOffsetRef.current =
            serverOffsetRef.current === 0
              ? newOffset
              : Math.round(serverOffsetRef.current * 0.85 + newOffset * 0.15);
        }

        serverStateRef.current = data;
        setIsReady(true);

        const isNewRound = currentRoundIdRef.current !== data.roundId;
        if (isNewRound) {
          currentRoundIdRef.current = data.roundId;
          if (data.history) {
            setShotHistory(data.history.slice(0, 9));
          }
        }
      } catch (e) {}
    };

    pollServerState();
    const interval = setInterval(pollServerState, 350);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // 60FPS Continuous Time-Based Flight & Countdown Animation Loop
  useEffect(() => {
    const animLoop = setInterval(() => {
      const serverState = serverStateRef.current;
      if (!serverState) return;

      const accurateServerNow = Date.now() + serverOffsetRef.current;
      const flightStart = serverState.flightStart;
      const crashTime = serverState.crashTime;
      const roundId = serverState.roundId;

      if (accurateServerNow < flightStart) {
        // 1. COUNTDOWN PHASE (Strict 10.0s window)
        const remainingMs = Math.max(0, flightStart - accurateServerNow);
        const timeLeft = Number((remainingMs / 1000).toFixed(1));
        setCountdown((prev) => (prev !== timeLeft ? timeLeft : prev));
        setMultiplier(1.0);

        if (activePhaseRef.current !== "COUNTDOWN") {
          activePhaseRef.current = "COUNTDOWN";
          setGameState("PREPARING");
          setCrashMultiplier(serverState.crashMultiplier || 2.5);
          setHasCashedOut(false);
        }
      } else if (accurateServerNow < crashTime) {
        // 2. AIRBORNE (FLYING) PHASE
        const elapsedSec = Math.max(0, (accurateServerNow - flightStart) / 1000);
        const currentMult = Number(
          Math.min(serverState.crashMultiplier, calculateAscentMultiplier(elapsedSec)).toFixed(2)
        );

        setMultiplier((prev) => (prev !== currentMult ? currentMult : prev));
        setCountdown(0);

        if (activePhaseRef.current !== "FLYING") {
          activePhaseRef.current = "FLYING";
          setGameState("AIRBORNE");
          setCrashMultiplier(serverState.crashMultiplier || 2.5);
          sound.startJetEngine();

          // Deduct placed bet on ball strike ONCE per roundId
          if (!deductedRoundsRef.current.has(roundId)) {
            deductedRoundsRef.current.add(roundId);
            const placed = isBetPlacedRef.current;
            const bet = betAmountRef.current;
            const bal = playerBalanceRef.current;
            if (placed && bal >= bet) {
              onUpdateBalance(bal - bet);
            }
          }
        }

        sound.updateJetPitch(currentMult);

        // Auto-cashout check
        if (
          isBetPlacedRef.current &&
          !hasCashedOutRef.current &&
          autoCashoutEnabledRef.current &&
          autoCashoutMultRef.current > 1.0 &&
          currentMult >= autoCashoutMultRef.current &&
          currentMult < serverState.crashMultiplier
        ) {
          triggerCashout(autoCashoutMultRef.current);
        }
      } else {
        // 3. CAUGHT (CRASHED) PHASE (Strict 3.5s cooldown)
        const crashM = serverState.crashMultiplier || 1.0;
        setMultiplier((prev) => (prev !== crashM ? crashM : prev));
        setCountdown(0);

        if (activePhaseRef.current !== "CRASHED") {
          activePhaseRef.current = "CRASHED";
          setGameState("CAUGHT");
          sound.playSonicBoom();
          if (serverState.history) {
            setShotHistory(serverState.history.slice(0, 9));
          }

          // Record loss for un-cashed bets ONCE per roundId
          if (!settledRoundsRef.current.has(roundId)) {
            settledRoundsRef.current.add(roundId);
            if (isBetPlacedRef.current && !hasCashedOutRef.current) {
              if (onRecordRound) {
                onRecordRound({ bet: betAmountRef.current, win: 0, multiplier: crashM });
              }
            }
            setIsBetPlaced(false);
            setHasCashedOut(false);
          }
        }
      }
    }, 33);

    return () => clearInterval(animLoop);
  }, [onRecordRound, onUpdateBalance]);

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
    return () => {
      sound.stopJetEngine();
    };
  }, []);

  const isInputsDisabled = gameState !== "PREPARING" || isBetPlaced;

  if (!isReady) {
    return (
      <div className="w-full h-[480px] rounded-3xl bg-[#090d18] border border-slate-800/90 flex flex-col items-center justify-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center animate-pulse">
          <History className="w-7 h-7 text-amber-400 animate-spin" />
        </div>
        <div className="text-center space-y-1">
          <p className="text-sm font-black tracking-widest text-amber-400 uppercase">Synchronizing Live Stadium...</p>
          <p className="text-xs text-slate-400">Connecting to authoritative multiplayer match arena</p>
        </div>
      </div>
    );
  }

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

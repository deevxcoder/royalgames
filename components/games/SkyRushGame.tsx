"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Plane,
  Flame,
  Zap,
  TrendingUp,
  RotateCcw,
  CheckCircle2,
  Users,
  Award,
  Wallet,
  AlertCircle,
  Trophy,
  Sparkles,
  History,
  Check,
  UserCheck,
} from "lucide-react";
import confetti from "canvas-confetti";
import { sound } from "@/lib/soundFx";
import { SkyRushCanvas, JumpPassengerEvent } from "./SkyRushCanvas";
import { calculateAscentMultiplier } from "@/lib/serverCrashEngine";

interface SkyRushGameProps {
  playerBalance: number;
  onUpdateBalance: (newBalance: number) => void;
  onRecordRound?: (data: { bet: number; win: number; multiplier: number }) => void;
  liveRtp?: number;
}

interface BetPanelState {
  amount: number;
  isBetPlaced: boolean;
  hasCashedOut: boolean;
  cashedOutMult: number | null;
  autoCashoutEnabled: boolean;
  autoCashoutMult: number;
}

interface Passenger {
  id: string;
  user: string;
  bet: number;
  plannedCashout: number;
  cashedOutAt: number | null;
  winAmount: number | null;
  isNewEntry?: boolean;
  justCashedOut?: boolean;
}

interface CashoutToast {
  id: string;
  user: string;
  amount: number;
  multiplier: number;
}

const PASSENGER_NAMES = [
  "AlphaJet", "SkyRider99", "CryptoAce", "LuckyPilot", "Viper_007",
  "Zara_K", "RocketQueen", "MoonShot", "Phoenix7", "JetMaster",
  "CosmicKing", "StealthNinja", "ApexPredator", "GoldTiger", "HyperNova",
  "StarLord", "Velox9", "ShadowFox", "TurboMax", "ThunderBird",
  "AeroStrike", "CyberFalcon", "AceHigh", "BlazeRider", "QuantumLeap",
  "OrbitX", "Zenith99", "StormChaser", "FalconEye", "SkyCaptain",
  "EagleOne", "NovaBlast", "MatrixRider", "ApexTitan", "Vortex_X",
  "CyberSamurai", "CosmoAce", "RacerX", "ShadowWolf", "GoldStriker",
  "AstroKnight", "SilverSurfer", "ZenMaster", "PhantomJet", "NeonDrifter"
];

const BET_AMOUNTS = [20, 50, 100, 200, 250, 500, 1000, 1500, 2000];

export const SkyRushGame: React.FC<SkyRushGameProps> = ({
  playerBalance,
  onUpdateBalance,
  onRecordRound,
}) => {
  // Flight Game State
  const [gameState, setGameState] = useState<"COUNTDOWN" | "FLYING" | "CRASHED">("COUNTDOWN");
  const [multiplier, setMultiplier] = useState(1.0);
  const [countdown, setCountdown] = useState(10.0);
  const [crashMultiplier, setCrashMultiplier] = useState<number>(2.45);
  const [flightHistory, setFlightHistory] = useState<number[]>([1.84, 3.22, 1.12, 14.8, 2.05, 5.6, 1.45, 24.5, 1.02]);

  const [isReady, setIsReady] = useState(false);

  // Dual Bet Panels
  const [panel1, setPanel1] = useState<BetPanelState>({
    amount: 50,
    isBetPlaced: false,
    hasCashedOut: false,
    cashedOutMult: null,
    autoCashoutEnabled: false,
    autoCashoutMult: 2.0,
  });

  const [panel2, setPanel2] = useState<BetPanelState>({
    amount: 100,
    isBetPlaced: false,
    hasCashedOut: false,
    cashedOutMult: null,
    autoCashoutEnabled: true,
    autoCashoutMult: 1.5,
  });

  // Simulated Live Multiplayer Bets Ticker
  const [livePlayers, setLivePlayers] = useState<Passenger[]>([]);
  const [cashoutToasts, setCashoutToasts] = useState<CashoutToast[]>([]);
  const [cashoutEvents, setCashoutEvents] = useState<JumpPassengerEvent[]>([]);

  const plannedPassengersRef = useRef<Passenger[]>([]);

  // Synchronized state refs for rock-solid interval execution
  const panel1Ref = useRef(panel1);
  const panel2Ref = useRef(panel2);
  const playerBalanceRef = useRef(playerBalance);
  const gameStateRef = useRef(gameState);

  useEffect(() => {
    panel1Ref.current = panel1;
  }, [panel1]);

  useEffect(() => {
    panel2Ref.current = panel2;
  }, [panel2]);

  useEffect(() => {
    playerBalanceRef.current = playerBalance;
  }, [playerBalance]);

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  // Deterministic Pseudo-Random Generator based on roundId seed
  // Guarantees that all users and tabs in the world see the exact same other players & bets!
  const createPlannedPassengers = (roundId: string, secretCrash: number) => {
    let seed = 0;
    for (let i = 0; i < roundId.length; i++) {
      seed = (seed << 5) - seed + roundId.charCodeAt(i);
      seed |= 0;
    }
    seed = Math.abs(seed) || 987654321;

    const prng = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };

    const totalCount = Math.floor(prng() * 8) + 22; // 22 - 29 players
    const pool = [...PASSENGER_NAMES];
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(prng() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    const generated: Passenger[] = [];
    for (let i = 0; i < totalCount; i++) {
      const user = pool[i % pool.length];
      const bet = BET_AMOUNTS[Math.floor(prng() * BET_AMOUNTS.length)];

      const rand = prng();
      let plannedMult: number;
      if (rand < 0.35) {
        plannedMult = Number((1.15 + prng() * 0.45).toFixed(2));
      } else if (rand < 0.70) {
        plannedMult = Number((1.6 + prng() * 1.2).toFixed(2));
      } else if (rand < 0.90) {
        plannedMult = Number((2.8 + prng() * 3.2).toFixed(2));
      } else {
        plannedMult = Number((6.0 + prng() * 14.0).toFixed(2));
      }

      generated.push({
        id: `p_${roundId}_${i}`,
        user,
        bet,
        plannedCashout: plannedMult,
        cashedOutAt: null,
        winAmount: null,
        isNewEntry: false,
        justCashedOut: false,
      });
    }

    return generated;
  };

  // Real-Time Server State Synchronizer with Network Offset Calculation
  const serverStateRef = useRef<any>(null);
  const currentRoundIdRef = useRef<string>("");
  const activePhaseRef = useRef<string>("");
  const serverOffsetRef = useRef<number>(0);
  const lastServerTimeRef = useRef<number>(0);
  const settledRoundsRef = useRef<Set<string>>(new Set());
  const deductedRoundsRef = useRef<Set<string>>(new Set());
  const cashedPassengerIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    let isMounted = true;

    const pollServerState = async () => {
      try {
        const fetchStart = Date.now();
        const res = await fetch("/api/studio/multiplayer/state?game=royal_skyrush&_t=" + fetchStart, {
          cache: "no-store",
        });
        const data = await res.json();
        const fetchEnd = Date.now();
        if (!isMounted || !data.success) return;

        // Discard out-of-order poll responses
        if (data.serverTime && data.serverTime < lastServerTimeRef.current) return;
        lastServerTimeRef.current = data.serverTime;

        // Smooth Exponential Moving Average for server clock offset to prevent visual jitter
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
        if (isNewRound || !plannedPassengersRef.current.length) {
          currentRoundIdRef.current = data.roundId;
          cashedPassengerIdsRef.current.clear();
          const planned = createPlannedPassengers(data.roundId, data.crashMultiplier || 2.0);
          plannedPassengersRef.current = planned;
          setLivePlayers(planned);
          if (data.history) {
            setFlightHistory(data.history.slice(0, 12));
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
          setGameState("COUNTDOWN");
          setCrashMultiplier(serverState.crashMultiplier || 2.0);
          setCashoutToasts([]);
          setCashoutEvents([]);
          setLivePlayers(plannedPassengersRef.current);
          setPanel1((prev) => ({ ...prev, hasCashedOut: false, cashedOutMult: null }));
          setPanel2((prev) => ({ ...prev, hasCashedOut: false, cashedOutMult: null }));
        }
      } else if (accurateServerNow < crashTime) {
        // 2. FLYING PHASE
        const elapsedSec = Math.max(0, (accurateServerNow - flightStart) / 1000);
        const currentMult = Number(
          Math.min(serverState.crashMultiplier, calculateAscentMultiplier(elapsedSec)).toFixed(2)
        );

        setMultiplier((prev) => (prev !== currentMult ? currentMult : prev));
        setCountdown(0);

        if (activePhaseRef.current !== "FLYING") {
          activePhaseRef.current = "FLYING";
          setGameState("FLYING");
          setCrashMultiplier(serverState.crashMultiplier || 2.0);
          sound.startJetEngine();

          // Deduct placed bets on takeoff ONCE per roundId
          if (!deductedRoundsRef.current.has(roundId)) {
            deductedRoundsRef.current.add(roundId);
            const p1AtStart = panel1Ref.current;
            const p2AtStart = panel2Ref.current;
            const bal = playerBalanceRef.current;
            let deduction = 0;
            if (p1AtStart.isBetPlaced && !p1AtStart.hasCashedOut && bal >= p1AtStart.amount) {
              deduction += p1AtStart.amount;
            }
            if (p2AtStart.isBetPlaced && !p2AtStart.hasCashedOut && bal >= deduction + p2AtStart.amount) {
              deduction += p2AtStart.amount;
            }
            if (deduction > 0) {
              onUpdateBalance(bal - deduction);
            }
          }
        }

        sound.updateJetPitch(currentMult);

        // Check Passenger Cashouts efficiently without cascading re-renders
        const newJumps: JumpPassengerEvent[] = [];
        const newToasts: CashoutToast[] = [];
        let hasPlayerUpdates = false;

        plannedPassengersRef.current.forEach((p) => {
          if (!cashedPassengerIdsRef.current.has(p.id) && p.plannedCashout <= currentMult && currentMult < serverState.crashMultiplier) {
            cashedPassengerIdsRef.current.add(p.id);
            const win = Math.round(p.bet * currentMult);
            hasPlayerUpdates = true;

            newJumps.push({
              id: `jump_${p.id}_${p.plannedCashout}`,
              user: p.user,
              amount: win,
              multiplier: currentMult,
              timestamp: Date.now(),
            });

            newToasts.push({
              id: `toast_${p.id}_${p.plannedCashout}`,
              user: p.user,
              amount: win,
              multiplier: currentMult,
            });
          }
        });

        if (newJumps.length > 0) {
          setCashoutEvents((prev) => [...prev, ...newJumps]);
        }
        if (newToasts.length > 0) {
          setCashoutToasts((prev) => [...newToasts, ...prev].slice(0, 3));
        }
        if (hasPlayerUpdates) {
          setLivePlayers((prev) =>
            prev.map((p) =>
              cashedPassengerIdsRef.current.has(p.id)
                ? { ...p, cashedOutAt: p.plannedCashout, winAmount: Math.round(p.bet * p.plannedCashout), justCashedOut: true }
                : p
            )
          );
        }

        // Check Auto-Cashouts for Panel 1 & Panel 2
        const p1 = panel1Ref.current;
        if (
          p1.isBetPlaced &&
          !p1.hasCashedOut &&
          p1.autoCashoutEnabled &&
          p1.autoCashoutMult > 1.0 &&
          currentMult >= p1.autoCashoutMult &&
          currentMult < serverState.crashMultiplier
        ) {
          triggerCashout(1, p1.autoCashoutMult);
        }

        const p2 = panel2Ref.current;
        if (
          p2.isBetPlaced &&
          !p2.hasCashedOut &&
          p2.autoCashoutEnabled &&
          p2.autoCashoutMult > 1.0 &&
          currentMult >= p2.autoCashoutMult &&
          currentMult < serverState.crashMultiplier
        ) {
          triggerCashout(2, p2.autoCashoutMult);
        }
      } else {
        // 3. CRASHED REVIEW PHASE (Strict 3.5s cooldown)
        const crashM = serverState.crashMultiplier || 1.0;
        setMultiplier((prev) => (prev !== crashM ? crashM : prev));
        setCountdown(0);

        if (activePhaseRef.current !== "CRASHED") {
          activePhaseRef.current = "CRASHED";
          setGameState("CRASHED");
          sound.playSonicBoom();
          if (serverState.history) {
            setFlightHistory(serverState.history.slice(0, 12));
          }

          // Record round loss for uncashed bets ONCE per roundId
          if (!settledRoundsRef.current.has(roundId)) {
            settledRoundsRef.current.add(roundId);
            const p1 = panel1Ref.current;
            const p2 = panel2Ref.current;
            if (p1.isBetPlaced && !p1.hasCashedOut && onRecordRound) {
              onRecordRound({ bet: p1.amount, win: 0, multiplier: crashM });
            }
            if (p2.isBetPlaced && !p2.hasCashedOut && onRecordRound) {
              onRecordRound({ bet: p2.amount, win: 0, multiplier: crashM });
            }

            setPanel1((prev) => ({ ...prev, isBetPlaced: false, hasCashedOut: false, cashedOutMult: null }));
            setPanel2((prev) => ({ ...prev, isBetPlaced: false, hasCashedOut: false, cashedOutMult: null }));
          }
        }
      }
    }, 33);

    return () => clearInterval(animLoop);
  }, [onRecordRound, onUpdateBalance]);

  // User Cashout action
  const triggerCashout = (panelNumber: 1 | 2, customMult?: number) => {
    const targetPanel = panelNumber === 1 ? panel1Ref.current : panel2Ref.current;
    if (!targetPanel.isBetPlaced || targetPanel.hasCashedOut || gameStateRef.current !== "FLYING") return;

    const cashMult = customMult ? Number(customMult.toFixed(2)) : multiplier;
    const winAmount = Number((targetPanel.amount * cashMult).toFixed(2));

    if (panelNumber === 1) {
      setPanel1((prev) => ({ ...prev, hasCashedOut: true, cashedOutMult: cashMult, isBetPlaced: false }));
    } else {
      setPanel2((prev) => ({ ...prev, hasCashedOut: true, cashedOutMult: cashMult, isBetPlaced: false }));
    }

    onUpdateBalance(playerBalanceRef.current + winAmount);
    sound.playWin();
    confetti({ particleCount: 65, spread: 70, origin: { y: 0.6 } });

    // Spawn user parachute jump from plane
    setCashoutEvents((prevJumps) => [
      ...prevJumps,
      {
        id: `jump_user_${panelNumber}_${Date.now()}`,
        user: `YOU (${panelNumber === 1 ? "Bet 1" : "Bet 2"})`,
        amount: winAmount,
        multiplier: cashMult,
        timestamp: Date.now(),
      },
    ]);

    // Show on toast
    setCashoutToasts((t) => [
      {
        id: `toast_user_${panelNumber}_${Date.now()}`,
        user: `YOU (${panelNumber === 1 ? "Bet 1" : "Bet 2"})`,
        amount: winAmount,
        multiplier: cashMult,
      },
      ...t.slice(0, 2),
    ]);

    if (onRecordRound) {
      onRecordRound({ bet: targetPanel.amount, win: winAmount, multiplier: cashMult });
    }
  };

  // Toggle Bet Placement - STRICT LOCK RULE (Only allowed during COUNTDOWN timer)
  const handleToggleBet = (panelNumber: 1 | 2) => {
    const targetPanel = panelNumber === 1 ? panel1 : panel2;
    if (gameState === "FLYING" && targetPanel.isBetPlaced && !targetPanel.hasCashedOut) {
      triggerCashout(panelNumber);
      return;
    }

    if (gameState !== "COUNTDOWN") {
      return;
    }

    if (targetPanel.isBetPlaced) {
      if (panelNumber === 1) setPanel1((prev) => ({ ...prev, isBetPlaced: false }));
      else setPanel2((prev) => ({ ...prev, isBetPlaced: false }));
    } else {
      if (playerBalance < targetPanel.amount) {
        alert("Insufficient balance to place bet");
        return;
      }
      sound.playChipBet();
      if (panelNumber === 1) setPanel1((prev) => ({ ...prev, isBetPlaced: true }));
      else setPanel2((prev) => ({ ...prev, isBetPlaced: true }));
    }
  };

  useEffect(() => {
    return () => {
      sound.stopJetEngine();
    };
  }, []);

  const cashedCount = livePlayers.filter((p) => p.cashedOutAt !== null).length;
  const isPanel1InputsDisabled = gameState !== "COUNTDOWN" || panel1.isBetPlaced;
  const isPanel2InputsDisabled = gameState !== "COUNTDOWN" || panel2.isBetPlaced;

  if (!isReady) {
    return (
      <div className="w-full h-[480px] rounded-3xl bg-[#090d18] border border-slate-800/90 flex flex-col items-center justify-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center animate-pulse">
          <Plane className="w-7 h-7 text-amber-400 animate-bounce" />
        </div>
        <div className="text-center space-y-1">
          <p className="text-sm font-black tracking-widest text-amber-400 uppercase">Synchronizing with Royal RGS Engine...</p>
          <p className="text-xs text-slate-400">Connecting to authoritative multiplayer crash arena</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col space-y-3">
      {/* Top Multiplier Roadmap History Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider shrink-0 flex items-center gap-1">
          <History className="w-3 h-3 text-amber-400" /> Recent:
        </span>
        {flightHistory.map((mult, idx) => (
          <span
            key={idx}
            className={`text-xs font-mono font-black px-2.5 py-1 rounded-xl shrink-0 transition-all ${
              mult >= 10
                ? "bg-purple-950/70 text-purple-300 border border-purple-500/50 shadow-md shadow-purple-500/20"
                : mult >= 2
                ? "bg-emerald-950/70 text-emerald-300 border border-emerald-500/50"
                : "bg-slate-900 text-sky-400 border border-slate-800"
            }`}
          >
            {mult.toFixed(2)}x
          </span>
        ))}
      </div>

      {/* Main Game Flight Arena + Right-side Passengers Container */}
      <div className="w-full flex flex-col lg:flex-row gap-4 items-stretch">
        {/* Left/Center Column: Canvas + Dual Bet Controls */}
        <div className="flex-1 w-full space-y-3 flex flex-col">
          {/* 60FPS Canvas View & Overlay Toasts */}
          <div className="w-full h-[300px] sm:h-[360px] md:h-[420px] rounded-3xl overflow-hidden border border-amber-500/20 shadow-2xl relative">
            <SkyRushCanvas
              gameState={gameState}
              multiplier={multiplier}
              countdown={countdown}
              crashMultiplier={crashMultiplier}
              cashoutEvents={cashoutEvents}
            />

            {/* Live Floating Cashout Toasts on Rocket Screen - Compact on Mobile */}
            <div className="absolute top-2 right-2 sm:top-4 sm:right-4 z-20 flex flex-col gap-1 sm:gap-1.5 pointer-events-none max-w-[145px] sm:max-w-[220px]">
              {cashoutToasts.slice(0, 2).map((toast) => (
                <div
                  key={toast.id}
                  className="flex items-center gap-1 sm:gap-2 px-2 py-0.5 sm:px-3 sm:py-1.5 rounded-xl sm:rounded-2xl bg-slate-950/80 border border-emerald-500/50 shadow-md shadow-emerald-500/10 backdrop-blur-sm animate-in fade-in slide-in-from-right-3 duration-200"
                >
                  <span className="text-xs sm:text-base animate-bounce">🎉</span>
                  <div className="flex flex-col text-left min-w-0">
                    <span className="text-[8px] sm:text-[10px] font-bold text-gray-300 truncate max-w-[68px] sm:max-w-[120px]">
                      {toast.user}
                    </span>
                    <span className="text-[9px] sm:text-xs font-mono font-black text-emerald-400 truncate">
                      ₹{toast.amount.toLocaleString()} @ {toast.multiplier.toFixed(2)}x
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Countdown Badge overlay with joining ticker */}
            {gameState === "COUNTDOWN" && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-900/90 border border-amber-500/40 text-amber-300 text-xs font-bold shadow-lg backdrop-blur">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span>Place Your Bets ({countdown.toFixed(1)}s remaining)</span>
              </div>
            )}
          </div>

          {/* Dual Bet Panels */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* PANEL 1 */}
            <div className="bg-[#0b0f1a] border border-slate-800/90 rounded-3xl p-4 sm:p-5 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <span className="text-xs font-black text-white uppercase tracking-wider">Flight Bet 1</span>
                  {gameState === "FLYING" && !panel1.isBetPlaced && (
                    <span className="text-[9px] font-mono text-rose-400 bg-rose-950/60 border border-rose-800/60 px-1.5 py-0.2 rounded font-bold">
                      LOCKED
                    </span>
                  )}
                </div>

                {/* Auto Cashout Controls */}
                <div className="flex items-center gap-2 text-xs bg-[#07090e] border border-slate-800/90 rounded-2xl px-2.5 py-1">
                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      disabled={isPanel1InputsDisabled}
                      checked={panel1.autoCashoutEnabled}
                      onChange={(e) => setPanel1((prev) => ({ ...prev, autoCashoutEnabled: e.target.checked }))}
                      className="accent-amber-500 w-3.5 h-3.5 rounded cursor-pointer disabled:opacity-50"
                    />
                    <span className={`text-[11px] font-bold ${panel1.autoCashoutEnabled ? "text-amber-400" : "text-gray-400"}`}>
                      Auto Cashout
                    </span>
                  </label>

                  {panel1.autoCashoutEnabled && (
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        disabled={isPanel1InputsDisabled}
                        step="0.1"
                        min="1.05"
                        max="1000"
                        value={panel1.autoCashoutMult}
                        onChange={(e) => {
                          const val = Math.max(1.05, Number(e.target.value));
                          setPanel1((prev) => ({ ...prev, autoCashoutMult: val }));
                        }}
                        className="w-16 bg-[#0c121e] border border-amber-500/50 rounded-lg px-1.5 py-0.5 text-xs font-mono font-bold text-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-400 disabled:opacity-50 text-right"
                      />
                      <span className="text-[11px] font-mono font-bold text-amber-400">x</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 items-center">
                {/* Bet Amount Input & Chips */}
                <div className="space-y-1.5">
                  <div className={`flex items-center gap-1.5 bg-[#07090e] border rounded-2xl px-3 py-1.5 transition-colors ${
                    isPanel1InputsDisabled ? "border-slate-800 opacity-60" : "border-slate-700"
                  }`}>
                    <span className="text-amber-400 font-bold text-xs">₹</span>
                    <input
                      type="number"
                      disabled={isPanel1InputsDisabled}
                      value={panel1.amount}
                      onChange={(e) => setPanel1((prev) => ({ ...prev, amount: Math.max(10, Number(e.target.value)) }))}
                      className="w-full bg-transparent text-white font-mono font-bold text-sm focus:outline-none disabled:cursor-not-allowed"
                    />
                  </div>

                  <div className="grid grid-cols-4 gap-1">
                    {[20, 50, 100, 500].map((val) => (
                      <button
                        key={val}
                        disabled={isPanel1InputsDisabled}
                        onClick={() => {
                          setPanel1((prev) => ({ ...prev, amount: val }));
                          sound.playChipBet();
                        }}
                        className={`py-1 rounded-xl text-[10px] font-mono font-bold border transition-colors ${
                          panel1.amount === val && !isPanel1InputsDisabled
                            ? "bg-amber-500 text-black border-amber-400"
                            : "bg-slate-900 border-slate-800 text-gray-400 hover:text-white disabled:opacity-40 disabled:hover:text-gray-400 disabled:cursor-not-allowed"
                        }`}
                      >
                        ₹{val}
                      </button>
                    ))}
                  </div>
                </div>

                {/* BET / CASHOUT / LOCKED Button */}
                <div>
                  {gameState === "FLYING" && panel1.isBetPlaced && !panel1.hasCashedOut ? (
                    <button
                      onClick={() => triggerCashout(1)}
                      className="w-full h-16 sm:h-20 rounded-2xl bg-gradient-to-r from-emerald-400 to-emerald-600 hover:from-emerald-300 hover:to-emerald-500 text-black font-black text-sm sm:text-base shadow-xl shadow-emerald-500/30 transition-all active:scale-95 flex flex-col items-center justify-center animate-pulse cursor-pointer"
                    >
                      <span className="text-[10px] sm:text-xs uppercase tracking-wider font-extrabold">CASH OUT</span>
                      <span className="text-base sm:text-lg font-mono font-black">
                        ₹{(panel1.amount * multiplier).toFixed(2)}
                      </span>
                    </button>
                  ) : panel1.hasCashedOut ? (
                    <div className="w-full h-16 sm:h-20 rounded-2xl bg-emerald-950/40 border border-emerald-500/50 flex flex-col items-center justify-center text-emerald-400">
                      <span className="text-[10px] uppercase font-bold tracking-wider">CASHED OUT</span>
                      <span className="text-sm font-mono font-black">@{panel1.cashedOutMult?.toFixed(2)}x</span>
                    </div>
                  ) : gameState === "COUNTDOWN" ? (
                    <button
                      onClick={() => handleToggleBet(1)}
                      className={`w-full h-16 sm:h-20 rounded-2xl font-black text-xs sm:text-sm transition-all active:scale-95 flex flex-col items-center justify-center shadow-lg cursor-pointer ${
                        panel1.isBetPlaced
                          ? "bg-rose-950/80 border border-rose-500/80 text-rose-300 hover:bg-rose-900/80 shadow-rose-500/20"
                          : "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black shadow-amber-500/20"
                      }`}
                    >
                      <span className="text-[10px] sm:text-xs uppercase tracking-wider">
                        {panel1.isBetPlaced ? "CANCEL BET" : "PLACE BET"}
                      </span>
                      <span className="text-sm sm:text-base font-mono">₹{panel1.amount}</span>
                    </button>
                  ) : (
                    <div className="w-full h-16 sm:h-20 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col items-center justify-center text-gray-500 cursor-not-allowed">
                      <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 text-slate-400">
                        🔒 BET LOCKED
                      </span>
                      <span className="text-[10px] text-gray-500">Wait for Next Flight</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* PANEL 2 */}
            <div className="bg-[#0b0f1a] border border-slate-800/90 rounded-3xl p-4 sm:p-5 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                  <span className="text-xs font-black text-white uppercase tracking-wider">Flight Bet 2</span>
                  {gameState === "FLYING" && !panel2.isBetPlaced && (
                    <span className="text-[9px] font-mono text-rose-400 bg-rose-950/60 border border-rose-800/60 px-1.5 py-0.2 rounded font-bold">
                      LOCKED
                    </span>
                  )}
                </div>

                {/* Auto Cashout Controls */}
                <div className="flex items-center gap-2 text-xs bg-[#07090e] border border-slate-800/90 rounded-2xl px-2.5 py-1">
                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      disabled={isPanel2InputsDisabled}
                      checked={panel2.autoCashoutEnabled}
                      onChange={(e) => setPanel2((prev) => ({ ...prev, autoCashoutEnabled: e.target.checked }))}
                      className="accent-cyan-500 w-3.5 h-3.5 rounded cursor-pointer disabled:opacity-50"
                    />
                    <span className={`text-[11px] font-bold ${panel2.autoCashoutEnabled ? "text-cyan-400" : "text-gray-400"}`}>
                      Auto Cashout
                    </span>
                  </label>

                  {panel2.autoCashoutEnabled && (
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        disabled={isPanel2InputsDisabled}
                        step="0.1"
                        min="1.05"
                        max="1000"
                        value={panel2.autoCashoutMult}
                        onChange={(e) => {
                          const val = Math.max(1.05, Number(e.target.value));
                          setPanel2((prev) => ({ ...prev, autoCashoutMult: val }));
                        }}
                        className="w-16 bg-[#0c121e] border border-cyan-500/50 rounded-lg px-1.5 py-0.5 text-xs font-mono font-bold text-cyan-300 focus:outline-none focus:ring-1 focus:ring-cyan-400 disabled:opacity-50 text-right"
                      />
                      <span className="text-[11px] font-mono font-bold text-cyan-400">x</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 items-center">
                {/* Bet Amount Input & Chips */}
                <div className="space-y-1.5">
                  <div className={`flex items-center gap-1.5 bg-[#07090e] border rounded-2xl px-3 py-1.5 transition-colors ${
                    isPanel2InputsDisabled ? "border-slate-800 opacity-60" : "border-slate-700"
                  }`}>
                    <span className="text-cyan-400 font-bold text-xs">₹</span>
                    <input
                      type="number"
                      disabled={isPanel2InputsDisabled}
                      value={panel2.amount}
                      onChange={(e) => setPanel2((prev) => ({ ...prev, amount: Math.max(10, Number(e.target.value)) }))}
                      className="w-full bg-transparent text-white font-mono font-bold text-sm focus:outline-none disabled:cursor-not-allowed"
                    />
                  </div>

                  <div className="grid grid-cols-4 gap-1">
                    {[50, 100, 250, 1000].map((val) => (
                      <button
                        key={val}
                        disabled={isPanel2InputsDisabled}
                        onClick={() => {
                          setPanel2((prev) => ({ ...prev, amount: val }));
                          sound.playChipBet();
                        }}
                        className={`py-1 rounded-xl text-[10px] font-mono font-bold border transition-colors ${
                          panel2.amount === val && !isPanel2InputsDisabled
                            ? "bg-cyan-500 text-black border-cyan-400"
                            : "bg-slate-900 border-slate-800 text-gray-400 hover:text-white disabled:opacity-40 disabled:hover:text-gray-400 disabled:cursor-not-allowed"
                        }`}
                      >
                        ₹{val}
                      </button>
                    ))}
                  </div>
                </div>

                {/* BET / CASHOUT / LOCKED Button */}
                <div>
                  {gameState === "FLYING" && panel2.isBetPlaced && !panel2.hasCashedOut ? (
                    <button
                      onClick={() => triggerCashout(2)}
                      className="w-full h-16 sm:h-20 rounded-2xl bg-gradient-to-r from-emerald-400 to-emerald-600 hover:from-emerald-300 hover:to-emerald-500 text-black font-black text-sm sm:text-base shadow-xl shadow-emerald-500/30 transition-all active:scale-95 flex flex-col items-center justify-center animate-pulse cursor-pointer"
                    >
                      <span className="text-[10px] sm:text-xs uppercase tracking-wider font-extrabold">CASH OUT</span>
                      <span className="text-base sm:text-lg font-mono font-black">
                        ₹{(panel2.amount * multiplier).toFixed(2)}
                      </span>
                    </button>
                  ) : panel2.hasCashedOut ? (
                    <div className="w-full h-16 sm:h-20 rounded-2xl bg-emerald-950/40 border border-emerald-500/50 flex flex-col items-center justify-center text-emerald-400">
                      <span className="text-[10px] uppercase font-bold tracking-wider">CASHED OUT</span>
                      <span className="text-sm font-mono font-black">@{panel2.cashedOutMult?.toFixed(2)}x</span>
                    </div>
                  ) : gameState === "COUNTDOWN" ? (
                    <button
                      onClick={() => handleToggleBet(2)}
                      className={`w-full h-16 sm:h-20 rounded-2xl font-black text-xs sm:text-sm transition-all active:scale-95 flex flex-col items-center justify-center shadow-lg cursor-pointer ${
                        panel2.isBetPlaced
                          ? "bg-rose-950/80 border border-rose-500/80 text-rose-300 hover:bg-rose-900/80 shadow-rose-500/20"
                          : "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black shadow-cyan-500/20"
                      }`}
                    >
                      <span className="text-[10px] sm:text-xs uppercase tracking-wider">
                        {panel2.isBetPlaced ? "CANCEL BET" : "PLACE BET"}
                      </span>
                      <span className="text-sm sm:text-base font-mono">₹{panel2.amount}</span>
                    </button>
                  ) : (
                    <div className="w-full h-16 sm:h-20 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col items-center justify-center text-gray-500 cursor-not-allowed">
                      <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 text-slate-400">
                        🔒 BET LOCKED
                      </span>
                      <span className="text-[10px] text-gray-500">Wait for Next Flight</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: In-Game Live Flight Passengers with Entrance & Cashout Animations */}
        <div className="w-full lg:w-80 bg-[#090d16] border border-slate-800/90 rounded-3xl p-4 flex flex-col space-y-3 shrink-0 shadow-xl">
          <div className="flex items-center justify-between text-xs text-gray-400 border-b border-slate-800/80 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="font-black text-white flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-amber-400" />
                Passengers ({livePlayers.length})
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[11px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                {cashedCount} Cashed
              </span>
            </div>
          </div>

          {/* Passenger List with real-time entry and cashout pulses */}
          <div className="space-y-1.5 max-h-56 sm:max-h-72 lg:max-h-[500px] overflow-y-auto pr-1 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-1.5 lg:gap-1.5">
            {livePlayers.map((p) => {
              const isCashed = p.cashedOutAt !== null;
              return (
                <div
                  key={p.id}
                  className={`p-2 rounded-xl border text-xs font-mono flex items-center justify-between transition-all duration-300 ${
                    isCashed
                      ? "bg-gradient-to-r from-emerald-950/60 to-emerald-900/30 border-emerald-500/50 text-emerald-300 shadow-md shadow-emerald-500/10 ring-1 ring-emerald-500/30"
                      : p.isNewEntry
                      ? "bg-amber-500/10 border-amber-500/40 text-amber-300 animate-pulse"
                      : "bg-[#06080e] border-slate-800/80 text-gray-300 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        isCashed
                          ? "bg-emerald-400 animate-ping"
                          : gameState === "FLYING"
                          ? "bg-amber-400 animate-pulse"
                          : "bg-slate-600"
                      }`}
                    />
                    <span className="truncate font-sans font-bold text-[11px] max-w-[90px] text-gray-100">
                      {p.user}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-right shrink-0">
                    {isCashed ? (
                      <span className="font-black text-[11px] text-emerald-400 flex items-center gap-1">
                        <Check className="w-3 h-3 stroke-[3]" />
                        <span>+{p.cashedOutAt?.toFixed(2)}x</span>
                      </span>
                    ) : (
                      <span className="font-bold text-[11px] text-gray-400">
                        ₹{p.bet}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

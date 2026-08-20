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
} from "lucide-react";
import confetti from "canvas-confetti";
import { sound } from "@/lib/soundFx";
import { SkyRushCanvas } from "./SkyRushCanvas";

interface SkyRushGameProps {
  playerBalance: number;
  onUpdateBalance: (newBalance: number) => void;
  onRecordRound?: (data: { bet: number; win: number; multiplier: number }) => void;
}

interface BetPanelState {
  amount: number;
  isBetPlaced: boolean;
  hasCashedOut: boolean;
  cashedOutMult: number | null;
  autoCashoutEnabled: boolean;
  autoCashoutMult: number;
}

export const SkyRushGame: React.FC<SkyRushGameProps> = ({
  playerBalance,
  onUpdateBalance,
  onRecordRound,
}) => {
  // Flight Game State
  const [gameState, setGameState] = useState<"COUNTDOWN" | "FLYING" | "CRASHED">("COUNTDOWN");
  const [multiplier, setMultiplier] = useState(1.0);
  const [countdown, setCountdown] = useState(4.0);
  const [crashMultiplier, setCrashMultiplier] = useState<number>(2.45);
  const [flightHistory, setFlightHistory] = useState<number[]>([1.84, 3.22, 1.12, 14.8, 2.05, 5.6, 1.45, 24.5, 1.02]);

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
  const [livePlayers, setLivePlayers] = useState<
    Array<{ id: string; user: string; bet: number; cashedOutAt: number | null }>
  >([]);

  const gameLoopRef = useRef<any>(null);
  const countdownIntervalRef = useRef<any>(null);

  // Generate simulated live players for the round
  const generateLivePlayers = () => {
    const names = [
      "AlphaJet", "SkyRider99", "CryptoAce", "LuckyPilot", "Viper_007",
      "Zara_K", "RocketQueen", "MoonShot", "Phoenix7", "JetMaster"
    ];
    return names.slice(0, 7 + Math.floor(Math.random() * 4)).map((user, i) => ({
      id: `p_${i}`,
      user,
      bet: [20, 50, 100, 250, 500][Math.floor(Math.random() * 5)],
      cashedOutAt: null,
    }));
  };

  // Start Countdown Sequence
  const startCountdown = useCallback(() => {
    setGameState("COUNTDOWN");
    setMultiplier(1.0);
    setCountdown(4.0);
    setLivePlayers(generateLivePlayers());

    // Reset panel cashed out states for next flight
    setPanel1((prev) => ({ ...prev, hasCashedOut: false, cashedOutMult: null }));
    setPanel2((prev) => ({ ...prev, hasCashedOut: false, cashedOutMult: null }));

    let timeLeft = 4.0;
    countdownIntervalRef.current = setInterval(() => {
      timeLeft -= 0.1;
      if (timeLeft <= 0) {
        clearInterval(countdownIntervalRef.current);
        startFlight();
      } else {
        setCountdown(Number(timeLeft.toFixed(1)));
      }
    }, 100);
  }, []);

  // Start Active Flight
  const startFlight = () => {
    setGameState("FLYING");
    setMultiplier(1.0);
    sound.startJetEngine();

    // Determine Provably Fair Crash Multiplier (House edge 2.5%)
    const r = Math.random();
    const secretCrash = Math.max(1.01, Number((0.975 / (1 - r)).toFixed(2)));
    setCrashMultiplier(secretCrash);

    // Deduct balances for placed bets
    if (panel1.isBetPlaced && playerBalance >= panel1.amount) {
      onUpdateBalance(playerBalance - panel1.amount);
    }
    if (panel2.isBetPlaced && playerBalance >= panel2.amount) {
      onUpdateBalance(playerBalance - panel2.amount);
    }

    const startTime = Date.now();

    gameLoopRef.current = setInterval(() => {
      const elapsedSec = (Date.now() - startTime) / 1000;
      // Exponential curve: e^(0.065 * t^1.2)
      const currentMult = Number(Math.exp(0.065 * Math.pow(elapsedSec * 1.5, 1.25)).toFixed(2));

      sound.updateJetPitch(currentMult);

      // Check Simulated Players Auto-Cashout
      setLivePlayers((prev) =>
        prev.map((p) => {
          if (!p.cashedOutAt && Math.random() < 0.04 && currentMult > 1.3) {
            return { ...p, cashedOutAt: currentMult };
          }
          return p;
        })
      );

      // Check Auto-Cashout for User Panel 1
      setPanel1((prev) => {
        if (
          prev.isBetPlaced &&
          !prev.hasCashedOut &&
          prev.autoCashoutEnabled &&
          currentMult >= prev.autoCashoutMult &&
          currentMult < secretCrash
        ) {
          triggerCashout(1, currentMult);
        }
        return prev;
      });

      // Check Auto-Cashout for User Panel 2
      setPanel2((prev) => {
        if (
          prev.isBetPlaced &&
          !prev.hasCashedOut &&
          prev.autoCashoutEnabled &&
          currentMult >= prev.autoCashoutMult &&
          currentMult < secretCrash
        ) {
          triggerCashout(2, currentMult);
        }
        return prev;
      });

      // Check Crash Event
      if (currentMult >= secretCrash) {
        clearInterval(gameLoopRef.current);
        setMultiplier(secretCrash);
        setGameState("CRASHED");
        sound.playSonicBoom();
        setFlightHistory((prev) => [secretCrash, ...prev.slice(0, 11)]);

        // Clear bets
        setPanel1((prev) => ({ ...prev, isBetPlaced: false }));
        setPanel2((prev) => ({ ...prev, isBetPlaced: false }));

        // Wait 3 seconds and schedule next round
        setTimeout(() => {
          startCountdown();
        }, 3200);
      } else {
        setMultiplier(currentMult);
      }
    }, 50);
  };

  // Cashout action
  const triggerCashout = (panelNumber: 1 | 2, customMult?: number) => {
    const targetPanel = panelNumber === 1 ? panel1 : panel2;
    if (!targetPanel.isBetPlaced || targetPanel.hasCashedOut || gameState !== "FLYING") return;

    const cashMult = customMult || multiplier;
    const winAmount = Number((targetPanel.amount * cashMult).toFixed(2));

    if (panelNumber === 1) {
      setPanel1((prev) => ({ ...prev, hasCashedOut: true, cashedOutMult: cashMult, isBetPlaced: false }));
    } else {
      setPanel2((prev) => ({ ...prev, hasCashedOut: true, cashedOutMult: cashMult, isBetPlaced: false }));
    }

    onUpdateBalance(playerBalance + winAmount);
    sound.playWin();
    confetti({ particleCount: 60, spread: 65, origin: { y: 0.6 } });

    if (onRecordRound) {
      onRecordRound({ bet: targetPanel.amount, win: winAmount, multiplier: cashMult });
    }
  };

  // Toggle Bet Placement
  const handleToggleBet = (panelNumber: 1 | 2) => {
    const targetPanel = panelNumber === 1 ? panel1 : panel2;
    if (gameState === "FLYING" && targetPanel.isBetPlaced) {
      // In flight -> triggers cashout!
      triggerCashout(panelNumber);
      return;
    }

    // Toggle bet for next round
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
    startCountdown();
    return () => {
      clearInterval(gameLoopRef.current);
      clearInterval(countdownIntervalRef.current);
      sound.stopJetEngine();
    };
  }, [startCountdown]);

  return (
    <div className="w-full flex flex-col space-y-4">
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

      {/* Arena Center: 60FPS Canvas View */}
      <div className="w-full h-[360px] sm:h-[420px] md:h-[480px] rounded-3xl overflow-hidden border border-amber-500/20 shadow-2xl relative">
        <SkyRushCanvas
          gameState={gameState}
          multiplier={multiplier}
          countdown={countdown}
          crashMultiplier={crashMultiplier}
        />
      </div>

      {/* Bottom Dual Bet Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* PANEL 1 */}
        <div className="bg-[#0b0f1a] border border-slate-800/90 rounded-3xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span className="text-xs font-black text-white uppercase tracking-wider">Flight Bet 1</span>
            </div>

            {/* Auto Cashout Toggle */}
            <div className="flex items-center gap-2 text-xs">
              <label className="text-gray-400 font-bold text-[11px]">Auto Cashout</label>
              <input
                type="checkbox"
                checked={panel1.autoCashoutEnabled}
                onChange={(e) => setPanel1((prev) => ({ ...prev, autoCashoutEnabled: e.target.checked }))}
                className="accent-amber-500 w-3.5 h-3.5 rounded"
              />
              {panel1.autoCashoutEnabled && (
                <input
                  type="number"
                  step="0.1"
                  min="1.05"
                  value={panel1.autoCashoutMult}
                  onChange={(e) => setPanel1((prev) => ({ ...prev, autoCashoutMult: Math.max(1.05, Number(e.target.value)) }))}
                  className="w-16 bg-[#07090e] border border-slate-700 rounded-lg px-2 py-0.5 text-xs font-mono font-bold text-amber-400 focus:outline-none"
                />
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
            {/* Bet Amount Input & Chips */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 bg-[#07090e] border border-slate-800 rounded-2xl px-3 py-2">
                <span className="text-amber-400 font-bold text-xs">₹</span>
                <input
                  type="number"
                  value={panel1.amount}
                  onChange={(e) => setPanel1((prev) => ({ ...prev, amount: Math.max(10, Number(e.target.value)) }))}
                  className="w-full bg-transparent text-white font-mono font-bold text-sm focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-4 gap-1.5">
                {[20, 50, 100, 500].map((val) => (
                  <button
                    key={val}
                    onClick={() => {
                      setPanel1((prev) => ({ ...prev, amount: val }));
                      sound.playChipBet();
                    }}
                    className={`py-1 rounded-xl text-[11px] font-mono font-bold border transition-colors ${
                      panel1.amount === val
                        ? "bg-amber-500 text-black border-amber-400"
                        : "bg-slate-900 border-slate-800 text-gray-400 hover:text-white"
                    }`}
                  >
                    ₹{val}
                  </button>
                ))}
              </div>
            </div>

            {/* Massive BET / CASHOUT Button */}
            <div>
              {gameState === "FLYING" && panel1.isBetPlaced && !panel1.hasCashedOut ? (
                <button
                  onClick={() => triggerCashout(1)}
                  className="w-full h-20 rounded-2xl bg-gradient-to-r from-emerald-400 to-emerald-600 hover:from-emerald-300 hover:to-emerald-500 text-black font-black text-base shadow-xl shadow-emerald-500/30 transition-all active:scale-95 flex flex-col items-center justify-center animate-pulse"
                >
                  <span className="text-xs uppercase tracking-wider font-extrabold">CASH OUT</span>
                  <span className="text-lg font-mono font-black">
                    ₹{(panel1.amount * multiplier).toFixed(2)}
                  </span>
                </button>
              ) : (
                <button
                  onClick={() => handleToggleBet(1)}
                  className={`w-full h-20 rounded-2xl font-black text-sm transition-all active:scale-95 flex flex-col items-center justify-center shadow-lg ${
                    panel1.isBetPlaced
                      ? "bg-rose-950/60 border border-rose-500/60 text-rose-300 hover:bg-rose-900/60"
                      : "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black shadow-amber-500/20"
                  }`}
                >
                  <span className="text-xs uppercase tracking-wider">
                    {panel1.isBetPlaced ? "CANCEL BET" : "PLACE BET"}
                  </span>
                  <span className="text-base font-mono">₹{panel1.amount}</span>
                  {panel1.hasCashedOut && (
                    <span className="text-[10px] text-emerald-400 font-bold">
                      Cashed @ {panel1.cashedOutMult?.toFixed(2)}x
                    </span>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* PANEL 2 (Dual Bet Panel) */}
        <div className="bg-[#0b0f1a] border border-slate-800/90 rounded-3xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
              <span className="text-xs font-black text-white uppercase tracking-wider">Flight Bet 2</span>
            </div>

            {/* Auto Cashout Toggle */}
            <div className="flex items-center gap-2 text-xs">
              <label className="text-gray-400 font-bold text-[11px]">Auto Cashout</label>
              <input
                type="checkbox"
                checked={panel2.autoCashoutEnabled}
                onChange={(e) => setPanel2((prev) => ({ ...prev, autoCashoutEnabled: e.target.checked }))}
                className="accent-cyan-500 w-3.5 h-3.5 rounded"
              />
              {panel2.autoCashoutEnabled && (
                <input
                  type="number"
                  step="0.1"
                  min="1.05"
                  value={panel2.autoCashoutMult}
                  onChange={(e) => setPanel2((prev) => ({ ...prev, autoCashoutMult: Math.max(1.05, Number(e.target.value)) }))}
                  className="w-16 bg-[#07090e] border border-slate-700 rounded-lg px-2 py-0.5 text-xs font-mono font-bold text-cyan-400 focus:outline-none"
                />
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
            {/* Bet Amount Input & Chips */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 bg-[#07090e] border border-slate-800 rounded-2xl px-3 py-2">
                <span className="text-cyan-400 font-bold text-xs">₹</span>
                <input
                  type="number"
                  value={panel2.amount}
                  onChange={(e) => setPanel2((prev) => ({ ...prev, amount: Math.max(10, Number(e.target.value)) }))}
                  className="w-full bg-transparent text-white font-mono font-bold text-sm focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-4 gap-1.5">
                {[50, 100, 250, 1000].map((val) => (
                  <button
                    key={val}
                    onClick={() => {
                      setPanel2((prev) => ({ ...prev, amount: val }));
                      sound.playChipBet();
                    }}
                    className={`py-1 rounded-xl text-[11px] font-mono font-bold border transition-colors ${
                      panel2.amount === val
                        ? "bg-cyan-500 text-black border-cyan-400"
                        : "bg-slate-900 border-slate-800 text-gray-400 hover:text-white"
                    }`}
                  >
                    ₹{val}
                  </button>
                ))}
              </div>
            </div>

            {/* Massive BET / CASHOUT Button */}
            <div>
              {gameState === "FLYING" && panel2.isBetPlaced && !panel2.hasCashedOut ? (
                <button
                  onClick={() => triggerCashout(2)}
                  className="w-full h-20 rounded-2xl bg-gradient-to-r from-emerald-400 to-emerald-600 hover:from-emerald-300 hover:to-emerald-500 text-black font-black text-base shadow-xl shadow-emerald-500/30 transition-all active:scale-95 flex flex-col items-center justify-center animate-pulse"
                >
                  <span className="text-xs uppercase tracking-wider font-extrabold">CASH OUT</span>
                  <span className="text-lg font-mono font-black">
                    ₹{(panel2.amount * multiplier).toFixed(2)}
                  </span>
                </button>
              ) : (
                <button
                  onClick={() => handleToggleBet(2)}
                  className={`w-full h-20 rounded-2xl font-black text-sm transition-all active:scale-95 flex flex-col items-center justify-center shadow-lg ${
                    panel2.isBetPlaced
                      ? "bg-rose-950/60 border border-rose-500/60 text-rose-300 hover:bg-rose-900/60"
                      : "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black shadow-cyan-500/20"
                  }`}
                >
                  <span className="text-xs uppercase tracking-wider">
                    {panel2.isBetPlaced ? "CANCEL BET" : "PLACE BET"}
                  </span>
                  <span className="text-base font-mono">₹{panel2.amount}</span>
                  {panel2.hasCashedOut && (
                    <span className="text-[10px] text-emerald-400 font-bold">
                      Cashed @ {panel2.cashedOutMult?.toFixed(2)}x
                    </span>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Simulated Live Room Players Ticker */}
      <div className="bg-[#0a0d16] border border-slate-800 rounded-2xl p-4 space-y-2">
        <div className="flex items-center justify-between text-xs text-gray-400 border-b border-slate-800 pb-2">
          <span className="font-bold flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-amber-400" />
            Live Flight Passengers ({livePlayers.length} in room)
          </span>
          <span className="font-mono text-[11px] text-emerald-400 font-bold">
            {livePlayers.filter((p) => p.cashedOutAt !== null).length} Cashed Out
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
          {livePlayers.map((p) => (
            <div
              key={p.id}
              className={`p-2 rounded-xl border text-xs font-mono flex items-center justify-between transition-all ${
                p.cashedOutAt
                  ? "bg-emerald-950/30 border-emerald-500/30 text-emerald-400"
                  : "bg-[#06080e] border-slate-800 text-gray-400"
              }`}
            >
              <span className="truncate font-sans font-bold text-[11px] max-w-[80px]">{p.user}</span>
              <span className="font-bold">
                {p.cashedOutAt ? `${p.cashedOutAt.toFixed(2)}x` : `₹${p.bet}`}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

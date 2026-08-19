"use client";

import React, { useState, useEffect, useRef, use } from "react";
import { useSearchParams, useParams, useRouter } from "next/navigation";
import {
  Sparkles,
  Wallet,
  ArrowLeft,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  AlertCircle,
  Trophy,
  Flame,
  Bomb,
  Plane,
  Coins,
  ShieldCheck,
  RotateCcw,
  Zap,
} from "lucide-react";
import confetti from "canvas-confetti";
import { sound } from "@/lib/soundFx";

export default function PlaySessionPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const sessionId = (params?.sessionId as string) || "sess_demo";
  const sessionToken = searchParams.get("token") || "";
  const initialGame = searchParams.get("game") || "royal_coinflip";
  const returnUrl = searchParams.get("returnUrl") || "http://localhost:3000";

  const [activeGame, setActiveGame] = useState<string>(initialGame);
  const [playerBalance, setPlayerBalance] = useState<number>(1000);
  const [betAmount, setBetAmount] = useState<number>(50);
  const [isProcessing, setIsProcessing] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [lastWin, setLastWin] = useState<number | null>(null);

  // 1. Coin Flip States
  const [coinChoice, setCoinChoice] = useState<"heads" | "tails">("heads");
  const [coinFlipping, setCoinFlipping] = useState(false);
  const [coinOutcome, setCoinOutcome] = useState<"heads" | "tails" | null>(null);

  // 2. Andar Bahar States
  const [andarBaharSide, setAndarBaharSide] = useState<"andar" | "bahar">("andar");
  const [jokerCard, setJokerCard] = useState<any>({ display: "K♠", color: "black" });
  const [andarCards, setAndarCards] = useState<any[]>([]);
  const [baharCards, setBaharCards] = useState<any[]>([]);
  const [winningSide, setWinningSide] = useState<string | null>(null);

  // 3. Chicken Road Cross States
  const [chickenLane, setChickenLane] = useState(0);
  const [chickenPlaying, setChickenPlaying] = useState(false);
  const [chickenCrashed, setChickenCrashed] = useState(false);
  const [chickenMult, setChickenMult] = useState(1.0);

  // 4. Aviator Crash States
  const [aviatorFlying, setAviatorFlying] = useState(false);
  const [aviatorMult, setAviatorMult] = useState(1.0);
  const [aviatorCrashed, setAviatorCrashed] = useState(false);
  const [aviatorCashedOut, setAviatorCashedOut] = useState(false);
  const aviatorTimerRef = useRef<any>(null);

  // 5. Mines Gold States
  const [minesCount, setMinesCount] = useState(3);
  const [minesPlaying, setMinesPlaying] = useState(false);
  const [revealedMines, setRevealedMines] = useState<number[]>([]);
  const [mineHitIndex, setMineHitIndex] = useState<number | null>(null);
  const [minesMultiplier, setMinesMultiplier] = useState(1.0);

  // 6. European Roulette States
  const [rouletteBetType, setRouletteBetType] = useState("red");
  const [rouletteSpinning, setRouletteSpinning] = useState(false);
  const [rouletteNumber, setRouletteNumber] = useState<number | null>(null);

  useEffect(() => {
    sound.enabled = soundEnabled;
  }, [soundEnabled]);

  const fireConfetti = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors: ["#fbbf24", "#f59e0b", "#10b981", "#ffffff"],
      });
    } catch {}
  };

  // Generic Round Execution Engine
  const executeStudioRound = async (extraPayload: any = {}) => {
    if (isProcessing) return;
    setIsProcessing(true);
    setLastWin(null);

    try {
      const res = await fetch("/api/studio/round", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          sessionToken,
          gameUid: activeGame,
          betAmount,
          currentBalance: playerBalance,
          ...extraPayload,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to settle round");
      }

      setPlayerBalance(data.newBalance);

      if (data.isWin && data.winAmount > 0) {
        sound.playWin();
        fireConfetti();
        setLastWin(data.winAmount);
      } else if (!data.isWin && !extraPayload.chickenAction && !extraPayload.isMinesOngoing) {
        sound.playLoss();
      }

      return data;
    } catch (err: any) {
      console.error("Game execution error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  // 1. Play Coin Flip
  const handlePlayCoinFlip = async () => {
    if (isProcessing || playerBalance < betAmount) return;
    setCoinFlipping(true);
    sound.playCoinFlip();

    setTimeout(async () => {
      const data = await executeStudioRound({ coinChoice });
      setCoinFlipping(false);
      if (data?.coinResult) {
        setCoinOutcome(data.coinResult);
      }
    }, 1200);
  };

  // 2. Play Andar Bahar
  const handlePlayAndarBahar = async () => {
    if (isProcessing || playerBalance < betAmount) return;
    sound.playCardDeal();
    setWinningSide(null);
    setAndarCards([]);
    setBaharCards([]);

    const data = await executeStudioRound({ andarBaharSide });
    if (data?.jokerCard) {
      setJokerCard(data.jokerCard);
      setAndarCards(data.dealtAndar || []);
      setBaharCards(data.dealtBahar || []);
      setWinningSide(data.winningSide);
    }
  };

  // 3. Play Chicken Cross - Hop Step
  const handleChickenStep = async () => {
    if (chickenCrashed) return;
    if (!chickenPlaying) {
      if (playerBalance < betAmount) return;
      setChickenPlaying(true);
      setChickenLane(0);
      setChickenCrashed(false);
      setChickenMult(1.0);
    }

    sound.playGem();
    const data = await executeStudioRound({
      chickenAction: "step",
      currentChickenLane: chickenLane,
    });

    if (data?.crashed) {
      sound.playLoss();
      setChickenCrashed(true);
      setChickenPlaying(false);
    } else if (data?.lane !== undefined) {
      setChickenLane(data.lane);
      setChickenMult(data.multiplier);
    }
  };

  // Chicken Cross - Cashout
  const handleChickenCashout = async () => {
    if (!chickenPlaying || chickenCrashed) return;
    const data = await executeStudioRound({
      chickenAction: "cashout",
      currentChickenLane: chickenLane,
    });
    setChickenPlaying(false);
  };

  // 4. Aviator Flight
  const handleStartAviator = () => {
    if (isProcessing || aviatorFlying || playerBalance < betAmount) return;
    setAviatorFlying(true);
    setAviatorCrashed(false);
    setAviatorCashedOut(false);
    setAviatorMult(1.0);

    const crashAt = 1.2 + Math.random() * 5.0; // Random crash threshold
    let cur = 1.0;

    aviatorTimerRef.current = setInterval(() => {
      cur += 0.05 + cur * 0.02;
      setAviatorMult(Number(cur.toFixed(2)));

      if (cur >= crashAt) {
        clearInterval(aviatorTimerRef.current);
        setAviatorFlying(false);
        setAviatorCrashed(true);
        sound.playLoss();
        executeStudioRound({ aviatorCashoutMult: 0 });
      }
    }, 100);
  };

  const handleAviatorCashout = async () => {
    if (!aviatorFlying || aviatorCrashed || aviatorCashedOut) return;
    clearInterval(aviatorTimerRef.current);
    setAviatorFlying(false);
    setAviatorCashedOut(true);
    await executeStudioRound({ aviatorCashoutMult: aviatorMult });
  };

  // 5. Mines - Start
  const handleStartMines = () => {
    if (playerBalance < betAmount) return;
    setMinesPlaying(true);
    setRevealedMines([]);
    setMineHitIndex(null);
    setMinesMultiplier(1.0);
  };

  const handlePickMineTile = async (index: number) => {
    if (!minesPlaying || revealedMines.includes(index)) return;
    sound.playGem();

    const data = await executeStudioRound({
      minesCount,
      revealedMinesIndices: revealedMines,
      mineTileIndex: index,
      isMinesOngoing: true,
    });

    if (data?.hitBomb) {
      sound.playLoss();
      setMineHitIndex(index);
      setMinesPlaying(false);
    } else {
      setRevealedMines((prev) => [...prev, index]);
      if (data?.multiplier) setMinesMultiplier(data.multiplier);
    }
  };

  const handleMinesCashout = async () => {
    if (!minesPlaying || revealedMines.length === 0) return;
    await executeStudioRound({
      minesCount,
      revealedMinesIndices: revealedMines,
      isMinesCashout: true,
    });
    setMinesPlaying(false);
  };

  // 6. European Roulette Spin
  const handleSpinRoulette = async () => {
    if (isProcessing || rouletteSpinning || playerBalance < betAmount) return;
    setRouletteSpinning(true);

    const tickInterval = setInterval(() => sound.playRouletteTick(), 120);

    setTimeout(async () => {
      clearInterval(tickInterval);
      const data = await executeStudioRound({ rouletteBetType });
      setRouletteSpinning(false);
      if (data?.winningNumber !== undefined) {
        setRouletteNumber(data.winningNumber);
      }
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between selection:bg-amber-500 selection:text-black" suppressHydrationWarning>
      {/* Studio Session Top Bar */}
      <header className="h-14 bg-slate-900/90 backdrop-blur border-b border-slate-800 px-4 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => (window.location.href = returnUrl)}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors flex items-center gap-1 text-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Exit Game</span>
          </button>

          <div className="h-4 w-[1px] bg-slate-700"></div>

          {/* Game Switcher Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto py-1">
            {[
              { id: "royal_coinflip", label: "🪙 Coin Flip" },
              { id: "royal_andarbahar", label: "🎴 Andar Bahar" },
              { id: "royal_chickencross", label: "🐔 Chicken Cross" },
              { id: "royal_aviator", label: "✈️ Aviator" },
              { id: "royal_mines", label: "💣 Mines Gold" },
              { id: "royal_roulette", label: "🎡 Roulette" },
            ].map((g) => (
              <button
                key={g.id}
                onClick={() => setActiveGame(g.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  activeGame === g.id
                    ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Player Balance Counter */}
          <div className="flex items-center gap-2 px-3 py-1 bg-slate-950 border border-slate-700 rounded-xl">
            <Wallet className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-slate-400">Balance:</span>
            <span className="text-sm font-bold text-emerald-400 font-mono">
              ₹{playerBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
          </div>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-amber-400 transition-colors"
            title="Mute/Unmute SFX"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-rose-400" />}
          </button>
        </div>
      </header>

      {/* Win Banner Notification */}
      {lastWin !== null && (
        <div className="bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 text-slate-950 py-1.5 px-4 text-center font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg animate-bounce">
          <Trophy className="w-4 h-4" />
          <span>YOU WON ₹{lastWin.toLocaleString()}!</span>
        </div>
      )}

      {/* Main Game Stage */}
      <main className="flex-1 flex flex-col justify-center items-center p-4 max-w-4xl mx-auto w-full">
        {/* 1. COIN FLIP ROYALE */}
        {activeGame === "royal_coinflip" && (
          <div className="w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col items-center space-y-6">
            <div className="text-center space-y-1">
              <h2 className="text-xl font-bold text-amber-400 font-mono">🪙 COIN FLIP ROYALE</h2>
              <p className="text-xs text-slate-400">Predict Heads or Tails for a 1.96x Instant Payout</p>
            </div>

            {/* 3D Animated Coin */}
            <div className="relative my-4 flex items-center justify-center">
              <div
                className={`w-36 h-36 rounded-full border-4 border-yellow-300 bg-gradient-to-tr from-amber-600 via-yellow-400 to-amber-500 shadow-2xl shadow-yellow-500/30 flex items-center justify-center transition-transform duration-700 ${
                  coinFlipping ? "animate-spin" : ""
                }`}
              >
                <span className="text-4xl font-extrabold text-slate-950 font-serif">
                  {coinOutcome === "tails" ? "T" : "H"}
                </span>
              </div>
            </div>

            {/* Selection Buttons */}
            <div className="grid grid-cols-2 gap-4 w-full max-w-xs">
              <button
                onClick={() => setCoinChoice("heads")}
                className={`py-3 rounded-2xl font-bold text-sm border transition-all ${
                  coinChoice === "heads"
                    ? "bg-amber-500/20 text-amber-400 border-amber-500 shadow-lg shadow-amber-500/20"
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                }`}
              >
                HEADS (1.96x)
              </button>
              <button
                onClick={() => setCoinChoice("tails")}
                className={`py-3 rounded-2xl font-bold text-sm border transition-all ${
                  coinChoice === "tails"
                    ? "bg-amber-500/20 text-amber-400 border-amber-500 shadow-lg shadow-amber-500/20"
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                }`}
              >
                TAILS (1.96x)
              </button>
            </div>

            <button
              onClick={handlePlayCoinFlip}
              disabled={coinFlipping || playerBalance < betAmount}
              className="w-full max-w-xs py-3.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 text-slate-950 font-extrabold text-sm rounded-2xl shadow-xl shadow-amber-500/30 transition-all disabled:opacity-50"
            >
              {coinFlipping ? "Flipping..." : `FLIP COIN (₹${betAmount})`}
            </button>
          </div>
        )}

        {/* 2. ANDAR BAHAR LIVE */}
        {activeGame === "royal_andarbahar" && (
          <div className="w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col items-center space-y-6">
            <div className="text-center space-y-1">
              <h2 className="text-xl font-bold text-amber-400 font-mono">🎴 ANDAR BAHAR LIVE</h2>
              <p className="text-xs text-slate-400">Match the Joker Card rank on Andar (1.90x) or Bahar (2.00x)</p>
            </div>

            {/* Joker Card */}
            <div className="flex flex-col items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Joker Card</span>
              <div
                className={`w-20 h-28 rounded-xl bg-white border-2 border-yellow-400 shadow-xl flex items-center justify-center font-bold text-2xl ${
                  jokerCard.color === "red" ? "text-rose-600" : "text-slate-950"
                }`}
              >
                {jokerCard.display}
              </div>
            </div>

            {/* Andar / Bahar Dealing Felt */}
            <div className="grid grid-cols-2 gap-4 w-full">
              <div
                onClick={() => setAndarBaharSide("andar")}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  andarBaharSide === "andar"
                    ? "bg-amber-500/10 border-amber-500"
                    : "bg-slate-950/60 border-slate-800"
                }`}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-xs text-amber-400">ANDAR (1.90x)</span>
                  {winningSide === "andar" && (
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-bold">
                      WINNER!
                    </span>
                  )}
                </div>
                <div className="flex gap-1 overflow-x-auto min-h-[56px] items-center">
                  {andarCards.map((c, i) => (
                    <div
                      key={i}
                      className={`w-10 h-14 bg-white rounded-lg border text-xs font-bold flex items-center justify-center shrink-0 shadow ${
                        c.color === "red" ? "text-rose-600" : "text-slate-950"
                      }`}
                    >
                      {c.display}
                    </div>
                  ))}
                </div>
              </div>

              <div
                onClick={() => setAndarBaharSide("bahar")}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  andarBaharSide === "bahar"
                    ? "bg-amber-500/10 border-amber-500"
                    : "bg-slate-950/60 border-slate-800"
                }`}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-xs text-purple-400">BAHAR (2.00x)</span>
                  {winningSide === "bahar" && (
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-bold">
                      WINNER!
                    </span>
                  )}
                </div>
                <div className="flex gap-1 overflow-x-auto min-h-[56px] items-center">
                  {baharCards.map((c, i) => (
                    <div
                      key={i}
                      className={`w-10 h-14 bg-white rounded-lg border text-xs font-bold flex items-center justify-center shrink-0 shadow ${
                        c.color === "red" ? "text-rose-600" : "text-slate-950"
                      }`}
                    >
                      {c.display}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={handlePlayAndarBahar}
              disabled={isProcessing || playerBalance < betAmount}
              className="w-full max-w-xs py-3.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 text-slate-950 font-extrabold text-sm rounded-2xl shadow-xl shadow-amber-500/30 transition-all disabled:opacity-50"
            >
              {isProcessing ? "Dealing..." : `DEAL CARDS (₹${betAmount})`}
            </button>
          </div>
        )}

        {/* 3. CHICKEN ROAD CROSS */}
        {activeGame === "royal_chickencross" && (
          <div className="w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col items-center space-y-6">
            <div className="text-center space-y-1">
              <h2 className="text-xl font-bold text-amber-400 font-mono">🐔 CHICKEN ROAD CROSS</h2>
              <p className="text-xs text-slate-400">Hop across highway lanes to multiply your payout up to 250x</p>
            </div>

            {/* Road Stepper Visualization */}
            <div className="w-full flex justify-between items-center gap-1.5 bg-slate-950 p-4 rounded-2xl border border-slate-800 overflow-x-auto">
              {[0, 1, 2, 3, 4, 5, 6].map((lane) => (
                <div
                  key={lane}
                  className={`flex-1 min-w-[50px] py-4 rounded-xl flex flex-col items-center gap-1 border text-center transition-all ${
                    chickenLane === lane && chickenPlaying
                      ? "bg-amber-500/20 border-amber-500 scale-105"
                      : chickenLane > lane
                      ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400"
                      : "bg-slate-900 border-slate-800 text-slate-600"
                  }`}
                >
                  <span className="text-lg">{chickenLane === lane && chickenPlaying ? "🐔" : "🛣️"}</span>
                  <span className="text-[10px] font-mono font-bold">
                    {(1.0 + lane * 0.35).toFixed(2)}x
                  </span>
                </div>
              ))}
            </div>

            {chickenCrashed && (
              <div className="text-rose-400 font-bold text-xs flex items-center gap-1 animate-pulse">
                <AlertCircle className="w-4 h-4" />
                SPLATTED! Better luck next round.
              </div>
            )}

            <div className="flex gap-4 w-full max-w-xs">
              <button
                onClick={handleChickenStep}
                disabled={chickenCrashed}
                className="flex-1 py-3.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 text-slate-950 font-extrabold text-sm rounded-2xl shadow-xl shadow-amber-500/30 transition-all"
              >
                {chickenPlaying ? "HOP NEXT LANE" : `START CROSSING (₹${betAmount})`}
              </button>

              {chickenPlaying && chickenLane > 0 && (
                <button
                  onClick={handleChickenCashout}
                  className="flex-1 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm rounded-2xl shadow-xl shadow-emerald-500/30 transition-all"
                >
                  CASHOUT ₹{(betAmount * chickenMult).toFixed(0)}
                </button>
              )}
            </div>
          </div>
        )}

        {/* 4. AVIATOR ROYALE CRASH */}
        {activeGame === "royal_aviator" && (
          <div className="w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col items-center space-y-6">
            <div className="text-center space-y-1">
              <h2 className="text-xl font-bold text-amber-400 font-mono">✈️ AVIATOR ROYALE CRASH</h2>
              <p className="text-xs text-slate-400">Cashout before the lucky plane flies away!</p>
            </div>

            {/* Flight Display */}
            <div className="w-full h-48 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden">
              <div className="text-5xl font-black font-mono tracking-tight text-amber-400">
                {aviatorMult.toFixed(2)}x
              </div>

              {aviatorFlying && (
                <div className="text-xs text-emerald-400 font-mono mt-2 animate-pulse flex items-center gap-1">
                  <Plane className="w-4 h-4 text-rose-500" />
                  Plane in flight...
                </div>
              )}

              {aviatorCrashed && (
                <div className="text-sm text-rose-500 font-bold mt-2">FLEW AWAY!</div>
              )}
            </div>

            <div className="w-full max-w-xs">
              {aviatorFlying ? (
                <button
                  onClick={handleAviatorCashout}
                  className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 text-slate-950 font-black text-base rounded-2xl shadow-xl shadow-emerald-500/30 transition-all"
                >
                  CASHOUT ₹{(betAmount * aviatorMult).toFixed(0)}
                </button>
              ) : (
                <button
                  onClick={handleStartAviator}
                  disabled={playerBalance < betAmount}
                  className="w-full py-4 bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 text-white font-black text-base rounded-2xl shadow-xl shadow-rose-500/30 transition-all disabled:opacity-50"
                >
                  FLY PLANE (₹{betAmount})
                </button>
              )}
            </div>
          </div>
        )}

        {/* 5. MINES GOLD */}
        {activeGame === "royal_mines" && (
          <div className="w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col items-center space-y-6">
            <div className="text-center space-y-1">
              <h2 className="text-xl font-bold text-amber-400 font-mono">💣 MINES GOLD (5x5)</h2>
              <p className="text-xs text-slate-400">Uncover sparkling gems, avoid hidden mines, cashout anytime!</p>
            </div>

            {/* 5x5 Grid */}
            <div className="grid grid-cols-5 gap-2.5 bg-slate-950 p-4 rounded-2xl border border-slate-800">
              {Array.from({ length: 25 }).map((_, idx) => {
                const isRevealed = revealedMines.includes(idx);
                const isHit = mineHitIndex === idx;

                return (
                  <button
                    key={idx}
                    onClick={() => handlePickMineTile(idx)}
                    disabled={!minesPlaying || isRevealed}
                    className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg border transition-all ${
                      isRevealed
                        ? "bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-inner"
                        : isHit
                        ? "bg-rose-500/30 border-rose-500 text-rose-500 animate-bounce"
                        : "bg-slate-900 border-slate-800 hover:border-amber-500/50 hover:bg-slate-800"
                    }`}
                  >
                    {isRevealed ? "💎" : isHit ? "💣" : ""}
                  </button>
                );
              })}
            </div>

            <div className="flex gap-4 w-full max-w-xs">
              {minesPlaying ? (
                <button
                  onClick={handleMinesCashout}
                  disabled={revealedMines.length === 0}
                  className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm rounded-2xl shadow-xl shadow-emerald-500/30 transition-all disabled:opacity-50"
                >
                  CASHOUT ₹{(betAmount * minesMultiplier).toFixed(0)} ({minesMultiplier.toFixed(2)}x)
                </button>
              ) : (
                <button
                  onClick={handleStartMines}
                  disabled={playerBalance < betAmount}
                  className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 text-slate-950 font-extrabold text-sm rounded-2xl shadow-xl shadow-amber-500/30 transition-all disabled:opacity-50"
                >
                  START MINES ROUND (₹{betAmount})
                </button>
              )}
            </div>
          </div>
        )}

        {/* 6. EUROPEAN ROULETTE */}
        {activeGame === "royal_roulette" && (
          <div className="w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col items-center space-y-6">
            <div className="text-center space-y-1">
              <h2 className="text-xl font-bold text-amber-400 font-mono">🎡 EUROPEAN ROULETTE</h2>
              <p className="text-xs text-slate-400">Single 0 European wheel with 36x straight-up payouts</p>
            </div>

            {/* Roulette Wheel Output */}
            <div className="w-32 h-32 rounded-full border-4 border-yellow-400 bg-slate-950 flex flex-col items-center justify-center shadow-xl">
              {rouletteSpinning ? (
                <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <div className="text-3xl font-black font-mono text-white">
                  {rouletteNumber !== null ? rouletteNumber : "?"}
                </div>
              )}
            </div>

            {/* Bet Placement Buttons */}
            <div className="grid grid-cols-4 gap-2 w-full max-w-sm">
              {[
                { id: "red", label: "RED (2x)", color: "bg-rose-600 hover:bg-rose-500" },
                { id: "black", label: "BLACK (2x)", color: "bg-slate-950 hover:bg-slate-900" },
                { id: "even", label: "EVEN (2x)", color: "bg-slate-800 hover:bg-slate-700" },
                { id: "odd", label: "ODD (2x)", color: "bg-slate-800 hover:bg-slate-700" },
              ].map((b) => (
                <button
                  key={b.id}
                  onClick={() => setRouletteBetType(b.id)}
                  className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${b.color} ${
                    rouletteBetType === b.id
                      ? "border-yellow-400 shadow-lg scale-105"
                      : "border-slate-700 text-slate-300"
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>

            <button
              onClick={handleSpinRoulette}
              disabled={rouletteSpinning || playerBalance < betAmount}
              className="w-full max-w-xs py-3.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 text-slate-950 font-extrabold text-sm rounded-2xl shadow-xl shadow-amber-500/30 transition-all disabled:opacity-50"
            >
              {rouletteSpinning ? "Spinning Wheel..." : `SPIN ROULETTE (₹${betAmount})`}
            </button>
          </div>
        )}
      </main>

      {/* Bet Control Bottom Bar */}
      <footer className="bg-slate-900/90 border-t border-slate-800 p-4 flex flex-col sm:flex-row items-center justify-between gap-4 z-20">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Bet Amount:</span>
          <div className="flex items-center gap-1.5">
            {[10, 50, 100, 500, 1000].map((amt) => (
              <button
                key={amt}
                onClick={() => setBetAmount(amt)}
                className={`px-3 py-1 rounded-xl text-xs font-mono font-bold border transition-all ${
                  betAmount === amt
                    ? "bg-amber-500 text-slate-950 border-amber-400"
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                }`}
              >
                ₹{amt}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Provably Fair SHA-256 RNG Active</span>
        </div>
      </footer>
    </div>
  );
}

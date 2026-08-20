"use client";

import React, { useState, useEffect, useRef } from "react";
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
  TrendingUp,
  ChevronRight,
  RefreshCw,
  Sliders,
  CheckCircle2,
  Dice5,
  Layers,
  Award,
  CircleDot,
  Radio,
} from "lucide-react";
import confetti from "canvas-confetti";
import { sound } from "@/lib/soundFx";
import { STUDIO_GAMES } from "@/lib/gamesCatalog";
import { SkyRushGame } from "@/components/games/SkyRushGame";
import { TigerTrailGame } from "@/components/games/TigerTrailGame";
import { BombGridGame } from "@/components/games/BombGridGame";
import { InfinityXGame } from "@/components/games/InfinityXGame";
import { CricketBlastGame } from "@/components/games/CricketBlastGame";
import { DropXGame } from "@/components/games/DropXGame";
import { DiceXGame } from "@/components/games/DiceXGame";
import { TreasureTowerGame } from "@/components/games/TreasureTowerGame";
import { CardClimbGame } from "@/components/games/CardClimbGame";
import { LuckyWheelGame } from "@/components/games/LuckyWheelGame";

export default function PlaySessionPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const sessionId = (params?.sessionId as string) || "sess_demo";
  const sessionToken = searchParams.get("token") || "";
  const initialGame = searchParams.get("game") || "royal_tigertrail";
  const returnUrl = searchParams.get("returnUrl") || "http://localhost:3000";

  const [activeGame, setActiveGame] = useState<string>(initialGame);
  const [playerBalance, setPlayerBalance] = useState<number>(1000);
  const [betAmount, setBetAmount] = useState<number>(50);
  const [isProcessing, setIsProcessing] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [lastWin, setLastWin] = useState<{ amount: number; multiplier: number } | null>(null);
  const [roundHistory, setRoundHistory] = useState<number[]>([1.84, 2.12, 1.05, 4.5, 12.8, 1.95, 3.2]);

  // ==========================================
  // 1. TIGER TRAIL (Step-Risk / Jungle Cashout)
  // ==========================================
  const [tigerStep, setTigerStep] = useState(0);
  const [tigerPlaying, setTigerPlaying] = useState(false);
  const [tigerCrashed, setTigerCrashed] = useState(false);
  const [tigerDifficulty, setTigerDifficulty] = useState<"EASY" | "MEDIUM" | "HARD">("MEDIUM");

  const TIGER_STEPS = {
    EASY: [1.15, 1.35, 1.6, 1.95, 2.45, 3.2, 4.3, 6.0, 9.0, 15.0],
    MEDIUM: [1.25, 1.6, 2.1, 2.85, 4.0, 6.0, 9.5, 16.0, 30.0, 65.0],
    HARD: [1.45, 2.2, 3.5, 5.8, 10.5, 20.0, 42.0, 95.0, 220.0, 500.0],
  };

  const startTigerTrail = () => {
    if (playerBalance < betAmount) {
      alert("Insufficient Balance");
      return;
    }
    setPlayerBalance((prev) => Number((prev - betAmount).toFixed(2)));
    setTigerStep(0);
    setTigerPlaying(true);
    setTigerCrashed(false);
    setLastWin(null);
    sound.playCardDeal();
  };

  const stepTigerForward = () => {
    if (!tigerPlaying || isProcessing) return;
    setIsProcessing(true);

    const stepsArray = TIGER_STEPS[tigerDifficulty];
    const nextStepIndex = tigerStep + 1;

    // Win chance calculation based on difficulty
    const failRate = tigerDifficulty === "EASY" ? 0.15 : tigerDifficulty === "MEDIUM" ? 0.25 : 0.38;
    const isSafe = Math.random() > failRate;

    setTimeout(() => {
      if (isSafe) {
        setTigerStep(nextStepIndex);
        sound.playChipBet();
        if (nextStepIndex >= stepsArray.length) {
          // Reached Final Step Jackpot
          cashoutTigerTrail(stepsArray[stepsArray.length - 1]);
        }
      } else {
        // Hit Trap
        setTigerCrashed(true);
        setTigerPlaying(false);
        sound.playLoss();
      }
      setIsProcessing(false);
    }, 280);
  };

  const cashoutTigerTrail = (customMult?: number) => {
    if (!tigerPlaying && !customMult) return;
    const mult = customMult || TIGER_STEPS[tigerDifficulty][tigerStep - 1] || 1.0;
    const win = Number((betAmount * mult).toFixed(2));

    setPlayerBalance((prev) => Number((prev + win).toFixed(2)));
    setLastWin({ amount: win, multiplier: mult });
    setTigerPlaying(false);
    setRoundHistory((prev) => [mult, ...prev.slice(0, 9)]);
    sound.playWin();
    confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
  };

  // ==========================================
  // 2. BOMB GRID (5x5 Crystal / Mines Grid)
  // ==========================================
  const [mineCount, setMineCount] = useState(3);
  const [bombGridPlaying, setBombGridPlaying] = useState(false);
  const [revealedGrid, setRevealedGrid] = useState<number[]>([]);
  const [mineLocations, setMineLocations] = useState<number[]>([]);
  const [hitMineIndex, setHitMineIndex] = useState<number | null>(null);

  const startBombGrid = () => {
    if (playerBalance < betAmount) {
      alert("Insufficient Balance");
      return;
    }
    setPlayerBalance((prev) => Number((prev - betAmount).toFixed(2)));
    setRevealedGrid([]);
    setHitMineIndex(null);
    setLastWin(null);

    // Randomize mine positions
    const mines: number[] = [];
    while (mines.length < mineCount) {
      const idx = Math.floor(Math.random() * 25);
      if (!mines.includes(idx)) mines.push(idx);
    }
    setMineLocations(mines);
    setBombGridPlaying(true);
    sound.playCardDeal();
  };

  const getGridMultiplier = (gemsFound: number) => {
    if (gemsFound === 0) return 1.0;
    let mult = 1.0;
    for (let i = 0; i < gemsFound; i++) {
      mult *= (25 - i) / (25 - mineCount - i);
    }
    return Number((mult * 0.985).toFixed(2));
  };

  const clickTile = (index: number) => {
    if (!bombGridPlaying || revealedGrid.includes(index) || isProcessing) return;

    if (mineLocations.includes(index)) {
      // Hit Bomb!
      setHitMineIndex(index);
      setRevealedGrid(Array.from({ length: 25 }, (_, i) => i));
      setBombGridPlaying(false);
      sound.playLoss();
    } else {
      // Found Crystal!
      const newRevealed = [...revealedGrid, index];
      setRevealedGrid(newRevealed);
      sound.playCoinFlip();

      const gemsCount = newRevealed.length;
      if (gemsCount === 25 - mineCount) {
        // Cleared all safe tiles!
        const finalMult = getGridMultiplier(gemsCount);
        cashoutBombGrid(finalMult);
      }
    }
  };

  const cashoutBombGrid = (customMult?: number) => {
    if (!bombGridPlaying && !customMult) return;
    const gemsFound = revealedGrid.length;
    if (gemsFound === 0) return;

    const mult = customMult || getGridMultiplier(gemsFound);
    const win = Number((betAmount * mult).toFixed(2));

    setPlayerBalance((prev) => Number((prev + win).toFixed(2)));
    setLastWin({ amount: win, multiplier: mult });
    setBombGridPlaying(false);
    setRoundHistory((prev) => [mult, ...prev.slice(0, 9)]);
    sound.playWin();
    confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
  };

  // ==========================================
  // 3. INFINITY X (Limbo Target Multiplier)
  // ==========================================
  const [targetMultiplier, setTargetMultiplier] = useState(2.0);
  const [infinityResult, setInfinityResult] = useState<number | null>(null);
  const [infinityPlaying, setInfinityPlaying] = useState(false);

  const winProbability = Number((98.8 / targetMultiplier).toFixed(2));

  const playInfinityX = () => {
    if (playerBalance < betAmount) {
      alert("Insufficient Balance");
      return;
    }
    setPlayerBalance((prev) => Number((prev - betAmount).toFixed(2)));
    setInfinityPlaying(true);
    setInfinityResult(null);
    setLastWin(null);
    sound.playCardDeal();

    setTimeout(() => {
      // Provably fair distribution curve
      const r = Math.random();
      const rawMult = Math.max(1.0, Number((0.99 / (1 - r)).toFixed(2)));
      const finalResult = Math.min(rawMult, 10000.0);

      setInfinityResult(finalResult);
      setInfinityPlaying(false);

      if (finalResult >= targetMultiplier) {
        // Won!
        const win = Number((betAmount * targetMultiplier).toFixed(2));
        setPlayerBalance((prev) => Number((prev + win).toFixed(2)));
        setLastWin({ amount: win, multiplier: targetMultiplier });
        sound.playWin();
        confetti({ particleCount: 50, spread: 50, origin: { y: 0.5 } });
      } else {
        sound.playLoss();
      }
      setRoundHistory((prev) => [finalResult, ...prev.slice(0, 9)]);
    }, 450);
  };

  // ==========================================
  // 4. SKY RUSH (Ascending Jet Multiplier)
  // ==========================================
  const [skyFlying, setSkyFlying] = useState(false);
  const [skyMultiplier, setSkyMultiplier] = useState(1.0);
  const [skyCrashed, setSkyCrashed] = useState(false);
  const skyTimerRef = useRef<any>(null);

  const startSkyRush = () => {
    if (playerBalance < betAmount) {
      alert("Insufficient Balance");
      return;
    }
    setPlayerBalance((prev) => Number((prev - betAmount).toFixed(2)));
    setSkyMultiplier(1.0);
    setSkyCrashed(false);
    setSkyFlying(true);
    setLastWin(null);
    sound.playCardDeal();

    // Determine secret crash point
    const r = Math.random();
    const crashAt = Math.max(1.05, Number((0.97 / (1 - r)).toFixed(2)));

    let current = 1.0;
    const interval = setInterval(() => {
      current += current < 2 ? 0.02 : current < 5 ? 0.05 : 0.15;
      const formatted = Number(current.toFixed(2));

      if (formatted >= crashAt) {
        clearInterval(interval);
        setSkyMultiplier(crashAt);
        setSkyFlying(false);
        setSkyCrashed(true);
        sound.playLoss();
        setRoundHistory((prev) => [crashAt, ...prev.slice(0, 9)]);
      } else {
        setSkyMultiplier(formatted);
      }
    }, 60);

    skyTimerRef.current = interval;
  };

  const cashoutSkyRush = () => {
    if (!skyFlying || skyCrashed) return;
    clearInterval(skyTimerRef.current);
    const win = Number((betAmount * skyMultiplier).toFixed(2));
    setPlayerBalance((prev) => Number((prev + win).toFixed(2)));
    setLastWin({ amount: win, multiplier: skyMultiplier });
    setSkyFlying(false);
    sound.playWin();
    confetti({ particleCount: 70, spread: 80, origin: { y: 0.55 } });
    setRoundHistory((prev) => [skyMultiplier, ...prev.slice(0, 9)]);
  };

  // ==========================================
  // 5. DICE X (Over / Under Probability Table)
  // ==========================================
  const [diceTarget, setDiceTarget] = useState(50);
  const [diceMode, setDiceMode] = useState<"OVER" | "UNDER">("OVER");
  const [diceResult, setDiceResult] = useState<number | null>(null);
  const [diceRolling, setDiceRolling] = useState(false);

  const diceWinChance = diceMode === "OVER" ? 100 - diceTarget : diceTarget;
  const diceMultiplier = Number((98.5 / diceWinChance).toFixed(2));

  const rollDiceX = () => {
    if (playerBalance < betAmount) {
      alert("Insufficient Balance");
      return;
    }
    setPlayerBalance((prev) => Number((prev - betAmount).toFixed(2)));
    setDiceRolling(true);
    setDiceResult(null);
    setLastWin(null);
    sound.playCoinFlip();

    setTimeout(() => {
      const roll = Math.floor(Math.random() * 100) + 1;
      setDiceResult(roll);
      setDiceRolling(false);

      const isWin = diceMode === "OVER" ? roll > diceTarget : roll < diceTarget;
      if (isWin) {
        const win = Number((betAmount * diceMultiplier).toFixed(2));
        setPlayerBalance((prev) => Number((prev + win).toFixed(2)));
        setLastWin({ amount: win, multiplier: diceMultiplier });
        sound.playWin();
        confetti({ particleCount: 50, spread: 50 });
      } else {
        sound.playLoss();
      }
      setRoundHistory((prev) => [isWin ? diceMultiplier : 0, ...prev.slice(0, 9)]);
    }, 400);
  };

  // Toggle Fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const currentGameMeta = STUDIO_GAMES.find((g) => g.game_uid === activeGame) || STUDIO_GAMES[0];

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-black">
      {/* Top Header Bar */}
      <header className="h-14 bg-[#0a0d16] border-b border-slate-800/90 px-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <a
            href={returnUrl}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 text-gray-300 hover:text-white transition-colors"
            title="Exit Game"
          >
            <ArrowLeft className="w-4 h-4" />
          </a>

          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="text-sm font-black text-white tracking-tight">{currentGameMeta.name}</h1>
            <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full font-mono font-bold">
              RTP {currentGameMeta.rtp}%
            </span>
          </div>
        </div>

        {/* Center Round History Badges */}
        <div className="hidden md:flex items-center gap-1.5 overflow-x-auto max-w-sm">
          {roundHistory.map((mult, idx) => (
            <span
              key={idx}
              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg ${
                mult >= 5
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                  : mult >= 2
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                  : "bg-slate-800 text-gray-400 border border-slate-700"
              }`}
            >
              {mult.toFixed(2)}x
            </span>
          ))}
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2.5">
          {/* Balance */}
          <div className="flex items-center gap-2 bg-[#06080e] border border-slate-800 px-3 py-1.5 rounded-xl">
            <Wallet className="w-4 h-4 text-emerald-400" />
            <div className="flex flex-col text-right">
              <span className="text-[9px] uppercase font-bold text-gray-500 leading-none">Balance</span>
              <span className="text-xs font-black text-emerald-400 leading-tight">
                ₹{playerBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={() => {
              sound.enabled = !soundEnabled;
              setSoundEnabled(!soundEnabled);
            }}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-gray-400 hover:text-white transition-colors"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4 text-gray-600" />}
          </button>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-gray-400 hover:text-white transition-colors"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Studio Arena */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-6 flex flex-col md:flex-row gap-6 items-start justify-center">
        {/* GAME PLAY CANVAS / STAGE (Left 65%) */}
        <div className="flex-1 w-full bg-[#0b0f19] border border-slate-800/90 rounded-3xl p-6 min-h-[460px] flex flex-col items-center justify-center relative overflow-hidden shadow-2xl">
          {/* Ambient Background Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

          {/* GAME 1: TIGER TRAIL (60FPS Jungle River & Animated Tiger Stepper) */}
          {activeGame === "royal_tigertrail" && (
            <div className="w-full">
              <TigerTrailGame
                playerBalance={playerBalance}
                onUpdateBalance={setPlayerBalance}
                onRecordRound={(data) => {
                  setRoundHistory((prev) => [data.multiplier, ...prev.slice(0, 9)]);
                }}
              />
            </div>
          )}

          {/* GAME 2: BOMB GRID (5x5 Laser Energy Cell Minefield) */}
          {activeGame === "royal_bombgrid" && (
            <div className="w-full">
              <BombGridGame
                playerBalance={playerBalance}
                onUpdateBalance={setPlayerBalance}
                onRecordRound={(data) => {
                  setRoundHistory((prev) => [data.multiplier, ...prev.slice(0, 9)]);
                }}
              />
            </div>
          )}

          {/* GAME 3: INFINITY X (60FPS Neon Infinity Portal Limbo) */}
          {activeGame === "royal_infinityx" && (
            <div className="w-full">
              <InfinityXGame
                playerBalance={playerBalance}
                onUpdateBalance={setPlayerBalance}
                onRecordRound={(data) => {
                  setRoundHistory((prev) => [data.multiplier, ...prev.slice(0, 9)]);
                }}
              />
            </div>
          )}

          {/* GAME 4: SKY RUSH (High-Speed Futuristic Crash) */}
          {activeGame === "royal_skyrush" && (
            <div className="w-full">
              <SkyRushGame
                playerBalance={playerBalance}
                onUpdateBalance={setPlayerBalance}
                onRecordRound={(data) => {
                  setRoundHistory((prev) => [data.multiplier, ...prev.slice(0, 9)]);
                }}
              />
            </div>
          )}

          {/* GAME 5: CRICKET BLAST (60FPS Night Stadium Lofted Hit) */}
          {activeGame === "royal_cricketblast" && (
            <div className="w-full">
              <CricketBlastGame
                playerBalance={playerBalance}
                onUpdateBalance={setPlayerBalance}
                onRecordRound={(data) => {
                  setRoundHistory((prev) => [data.multiplier, ...prev.slice(0, 9)]);
                }}
              />
            </div>
          )}

          {/* GAME 6: DROP X (60FPS Plinko Multi-Pin Physics Drop) */}
          {activeGame === "royal_dropx" && (
            <div className="w-full">
              <DropXGame
                playerBalance={playerBalance}
                onUpdateBalance={setPlayerBalance}
                onRecordRound={(data) => {
                  setRoundHistory((prev) => [data.multiplier, ...prev.slice(0, 9)]);
                }}
              />
            </div>
          )}

          {/* GAME 7: DICE X (60FPS Digital Probability Table) */}
          {activeGame === "royal_dicex" && (
            <div className="w-full">
              <DiceXGame
                playerBalance={playerBalance}
                onUpdateBalance={setPlayerBalance}
                onRecordRound={(data) => {
                  setRoundHistory((prev) => [data.multiplier, ...prev.slice(0, 9)]);
                }}
              />
            </div>
          )}

          {/* GAME 8: TREASURE TOWER (8-Floor Temple Risk Tower) */}
          {activeGame === "royal_treasuretower" && (
            <div className="w-full">
              <TreasureTowerGame
                playerBalance={playerBalance}
                onUpdateBalance={setPlayerBalance}
                onRecordRound={(data) => {
                  setRoundHistory((prev) => [data.multiplier, ...prev.slice(0, 9)]);
                }}
              />
            </div>
          )}

          {/* GAME 9: CARD CLIMB (Monte Carlo Hi-Lo Luxury Felt Table) */}
          {activeGame === "royal_cardclimb" && (
            <div className="w-full">
              <CardClimbGame
                playerBalance={playerBalance}
                onUpdateBalance={setPlayerBalance}
                onRecordRound={(data) => {
                  setRoundHistory((prev) => [data.multiplier, ...prev.slice(0, 9)]);
                }}
              />
            </div>
          )}

          {/* GAME 10: LUCKY WHEEL X (60FPS Multiplier Spinning Wheel) */}
          {activeGame === "royal_luckywheel" && (
            <div className="w-full">
              <LuckyWheelGame
                playerBalance={playerBalance}
                onUpdateBalance={setPlayerBalance}
                onRecordRound={(data) => {
                  setRoundHistory((prev) => [data.multiplier, ...prev.slice(0, 9)]);
                }}
              />
            </div>
          )}
        </div>

        {/* CONTROLS & STUDIO SUITE SELECTOR (Right Sidebar) */}
        <div className="w-full md:w-80 space-y-4 shrink-0">

          {/* Studio 10-Game Switcher */}
          <div className="bg-[#0b0f19] border border-slate-800/90 rounded-3xl p-5 shadow-xl space-y-3">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
              Royal Studio Games Suite
            </span>

            <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
              {STUDIO_GAMES.map((g) => (
                <button
                  key={g.game_uid}
                  onClick={() => {
                    setActiveGame(g.game_uid);
                    setLastWin(null);
                    sound.playCardDeal();
                  }}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition-all text-left ${
                    activeGame === g.game_uid
                      ? "bg-gradient-to-r from-amber-500/20 to-amber-600/10 border border-amber-500/50 text-amber-300"
                      : "bg-[#07090e] border border-slate-800/60 text-gray-400 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span>{g.name}</span>
                  </div>
                  <span className="text-[10px] font-mono text-gray-500">{g.category}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

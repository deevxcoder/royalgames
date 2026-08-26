"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams, useParams, useRouter } from "next/navigation";
import {
  Sparkles,
  Wallet,
  ArrowLeft,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  ChevronDown,
  Gamepad2,
} from "lucide-react";
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
  const initialGame = searchParams.get("game") || "royal_skyrush";
  const returnUrl = searchParams.get("returnUrl") || "/";

  const [activeGame, setActiveGame] = useState<string>(initialGame);
  const [playerBalance, setPlayerBalance] = useState<number>(1000);
  const [currency, setCurrency] = useState<string>("INR");
  const [clientName, setClientName] = useState<string>("Demo Mode");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isGameMenuOpen, setIsGameMenuOpen] = useState(false);
  const [roundHistory, setRoundHistory] = useState<number[]>([1.84, 2.12, 1.05, 4.5, 12.8, 1.95, 3.2]);

  const [deactivationError, setDeactivationError] = useState<string | null>(null);

  // Load Session Info from Database
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const token = searchParams.get("token") || "";
        const urlGame = searchParams.get("game") || "";
        const res = await fetch(`/api/studio/session?sessionId=${sessionId}&token=${token}&game=${urlGame}`);
        const data = await res.json();
        if (data.isDeactivated || (!data.success && res.status === 403)) {
          setDeactivationError(data.error || "This game is currently deactivated by the casino operator.");
          return;
        }
        if (data.success) {
          if (typeof data.balance === "number") {
            setPlayerBalance(data.balance);
          }
          if (data.currency) {
            setCurrency(data.currency);
          }
          if (data.clientName) {
            setClientName(data.clientName);
          }
          // If URL has a game, use it; otherwise use session gameUid
          if (urlGame && STUDIO_GAMES.some((g) => g.game_uid === urlGame)) {
            setActiveGame(urlGame);
          } else if (data.gameUid && STUDIO_GAMES.some((g) => g.game_uid === data.gameUid)) {
            setActiveGame(data.gameUid);
          }
        }
      } catch (err) {
        console.error("Failed to load session:", err);
      }
    };
    fetchSession();
  }, [sessionId, searchParams]);

  // Sync game from URL params
  useEffect(() => {
    const gameParam = searchParams.get("game");
    if (gameParam && STUDIO_GAMES.some((g) => g.game_uid === gameParam)) {
      setActiveGame(gameParam);
    }
  }, [searchParams]);

  // Authoritative Round Settlement Handler
  const handleRecordRound = useCallback(
    async (roundData: { bet: number; win: number; multiplier: number }) => {
      // 1. Immediately update UI round history
      setRoundHistory((prev) => [roundData.multiplier, ...prev.slice(0, 9)]);

      // 2. Transmit to studio backend
      try {
        const token = searchParams.get("token") || "";
        const res = await fetch("/api/studio/round", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            sessionToken: token,
            gameUid: activeGame,
            betAmount: roundData.bet,
            winAmount: roundData.win,
            multiplier: roundData.multiplier,
            currentBalance: playerBalance,
          }),
        });
        const result = await res.json();
        if (result.success && typeof result.newBalance === "number") {
          setPlayerBalance(result.newBalance);
        }
      } catch (err) {
        console.error("Failed to record round:", err);
      }
    },
    [sessionId, searchParams, activeGame, playerBalance]
  );

  // Switch Game in Demo Session
  const handleSwitchGame = (gameUid: string) => {
    setActiveGame(gameUid);
    setIsGameMenuOpen(false);
    const token = searchParams.get("token");
    const tokenPart = token ? `&token=${encodeURIComponent(token)}` : "";
    const returnPart = returnUrl ? `&returnUrl=${encodeURIComponent(returnUrl)}` : "";
    router.replace(`/play/${sessionId}?game=${gameUid}${tokenPart}${returnPart}`);
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
      <header className="h-14 bg-[#0a0d16] border-b border-slate-800/90 px-3 sm:px-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <a
            href={returnUrl}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 text-gray-300 hover:text-white transition-colors"
            title="Exit to Casino Lobby"
          >
            <ArrowLeft className="w-4 h-4" />
          </a>

          {/* Interactive Game Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsGameMenuOpen(!isGameMenuOpen)}
              className="flex items-center gap-1.5 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-[#06080e] border border-slate-800 hover:border-amber-500/40 transition-colors cursor-pointer"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <h1 className="text-xs sm:text-sm font-black text-white tracking-tight truncate max-w-[110px] sm:max-w-none">
                {currentGameMeta.name}
              </h1>
              <span className="hidden sm:inline-block text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/30 px-1.5 py-0.2 rounded-full font-mono font-bold">
                RTP {currentGameMeta.rtp}%
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${isGameMenuOpen ? "rotate-180" : ""}`} />
            </button>

            {/* Game Switcher Menu */}
            {isGameMenuOpen && (
              <div className="absolute top-12 left-0 w-64 bg-[#0a0e1a] border border-slate-800 rounded-2xl shadow-2xl p-2 z-50 space-y-1 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
                <div className="text-[10px] font-bold text-gray-500 uppercase px-2.5 py-1 border-b border-slate-800 flex items-center justify-between">
                  <span>Switch Studio Title</span>
                  <span className="text-amber-400 font-mono">{STUDIO_GAMES.length} Games</span>
                </div>
                <div className="max-h-72 overflow-y-auto space-y-0.5">
                  {STUDIO_GAMES.map((g) => (
                    <button
                      key={g.game_uid}
                      onClick={() => handleSwitchGame(g.game_uid)}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left transition-colors cursor-pointer ${
                        activeGame === g.game_uid
                          ? "bg-amber-500 text-black font-black"
                          : "text-gray-300 hover:bg-slate-900 hover:text-white"
                      }`}
                    >
                      <div className="flex flex-col">
                        <span className="text-xs font-bold">{g.name}</span>
                        <span className={`text-[9px] ${activeGame === g.game_uid ? "text-black/70 font-bold" : "text-gray-500"}`}>
                          {g.category}
                        </span>
                      </div>
                      <span className={`text-[10px] font-mono font-bold ${activeGame === g.game_uid ? "text-black" : "text-amber-400"}`}>
                        {g.rtp}%
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
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
        <div className="flex items-center gap-2">
          {/* Balance */}
          <div className="flex items-center gap-1.5 sm:gap-2 bg-[#06080e] border border-slate-800 px-2.5 sm:px-3 py-1.5 rounded-xl">
            <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
            <div className="flex flex-col text-right">
              <span className="text-[8px] sm:text-[9px] uppercase font-bold text-gray-500 leading-none">
                {currency} Balance
              </span>
              <span className="text-xs sm:text-sm font-black text-emerald-400 font-mono leading-tight">
                {currency === "INR" ? "₹" : "$"}
                {playerBalance.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={() => {
              sound.enabled = !soundEnabled;
              setSoundEnabled(!soundEnabled);
            }}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-gray-400 hover:text-white transition-colors cursor-pointer"
            title={soundEnabled ? "Mute Sound" : "Enable Sound"}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4 text-gray-600" />}
          </button>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-gray-400 hover:text-white transition-colors cursor-pointer hidden sm:block"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Studio Arena */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-1 sm:p-3 md:p-5 flex flex-col items-center justify-start">
        <div className="w-full bg-[#0b0f19] border border-slate-800/90 rounded-2xl sm:rounded-3xl p-1.5 sm:p-3 md:p-4 flex flex-col items-center justify-start relative overflow-hidden shadow-2xl">
          {/* Ambient Background Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

          {/* Deactivated Game Notice */}
          {deactivationError && (
            <div className="w-full min-h-[450px] flex flex-col items-center justify-center p-8 text-center bg-slate-950/80 border border-rose-500/30 rounded-2xl my-6">
              <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 text-2xl font-black mb-4">
                ⛔
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white mb-2">Game Deactivated</h2>
              <p className="text-sm text-slate-400 max-w-md mb-6">{deactivationError}</p>
              <a
                href={returnUrl}
                className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition-all"
              >
                Return to Casino Lobby
              </a>
            </div>
          )}

          {/* GAME 1: SKY RUSH (Crash Multiplier Jet) */}
          {!deactivationError && activeGame === "royal_skyrush" && (
            <div className="w-full">
              <SkyRushGame
                playerBalance={playerBalance}
                onUpdateBalance={setPlayerBalance}
                onRecordRound={handleRecordRound}
              />
            </div>
          )}

          {/* GAME 2: TIGER TRAIL (Step / Jungle River Cashout) */}
          {!deactivationError && activeGame === "royal_tigertrail" && (
            <div className="w-full">
              <TigerTrailGame
                playerBalance={playerBalance}
                onUpdateBalance={setPlayerBalance}
                onRecordRound={handleRecordRound}
              />
            </div>
          )}

          {/* GAME 3: BOMB GRID (5x5 Laser Energy Mines) */}
          {!deactivationError && activeGame === "royal_bombgrid" && (
            <div className="w-full">
              <BombGridGame
                playerBalance={playerBalance}
                onUpdateBalance={setPlayerBalance}
                onRecordRound={handleRecordRound}
              />
            </div>
          )}

          {/* GAME 4: DROP X (60FPS Plinko Multi-Pin Drop) */}
          {!deactivationError && activeGame === "royal_dropx" && (
            <div className="w-full">
              <DropXGame
                playerBalance={playerBalance}
                onUpdateBalance={setPlayerBalance}
                onRecordRound={handleRecordRound}
              />
            </div>
          )}

          {/* GAME 5: CRICKET BLAST (Night Stadium Crash Hit) */}
          {!deactivationError && activeGame === "royal_cricketblast" && (
            <div className="w-full">
              <CricketBlastGame
                playerBalance={playerBalance}
                onUpdateBalance={setPlayerBalance}
                onRecordRound={handleRecordRound}
              />
            </div>
          )}

          {/* GAME 6: INFINITY X (Quantum Fast Limbo) */}
          {!deactivationError && activeGame === "royal_infinityx" && (
            <div className="w-full">
              <InfinityXGame
                playerBalance={playerBalance}
                onUpdateBalance={setPlayerBalance}
                onRecordRound={handleRecordRound}
              />
            </div>
          )}

          {/* GAME 7: TREASURE TOWER (8-Floor Pyramid Risk Tower) */}
          {!deactivationError && activeGame === "royal_treasuretower" && (
            <div className="w-full">
              <TreasureTowerGame
                playerBalance={playerBalance}
                onUpdateBalance={setPlayerBalance}
                onRecordRound={handleRecordRound}
              />
            </div>
          )}

          {/* GAME 8: DICE X (60FPS 3D Probability Dice) */}
          {!deactivationError && activeGame === "royal_dicex" && (
            <div className="w-full">
              <DiceXGame
                playerBalance={playerBalance}
                onUpdateBalance={setPlayerBalance}
                onRecordRound={handleRecordRound}
              />
            </div>
          )}

          {/* GAME 9: CARD CLIMB (3D Royal Hi-Lo Felt Table) */}
          {!deactivationError && activeGame === "royal_cardclimb" && (
            <div className="w-full">
              <CardClimbGame
                playerBalance={playerBalance}
                onUpdateBalance={setPlayerBalance}
                onRecordRound={handleRecordRound}
              />
            </div>
          )}

          {/* GAME 10: LUCKY WHEEL X (60FPS Multiplier Wheel) */}
          {!deactivationError && activeGame === "royal_luckywheel" && (
            <div className="w-full">
              <LuckyWheelGame
                playerBalance={playerBalance}
                onUpdateBalance={setPlayerBalance}
                onRecordRound={handleRecordRound}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

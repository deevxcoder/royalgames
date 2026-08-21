"use client";

import React, { useState, useEffect } from "react";
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
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isGameMenuOpen, setIsGameMenuOpen] = useState(false);
  const [roundHistory, setRoundHistory] = useState<number[]>([1.84, 2.12, 1.05, 4.5, 12.8, 1.95, 3.2]);

  // Sync game from URL params
  useEffect(() => {
    const gameParam = searchParams.get("game");
    if (gameParam && STUDIO_GAMES.some((g) => g.game_uid === gameParam)) {
      setActiveGame(gameParam);
    }
  }, [searchParams]);

  // Switch Game in Demo Session
  const handleSwitchGame = (gameUid: string) => {
    setActiveGame(gameUid);
    setIsGameMenuOpen(false);
    router.replace(`/play/${sessionId}?game=${gameUid}`);
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
            title="Exit to Studio Home"
          >
            <ArrowLeft className="w-4 h-4" />
          </a>

          {/* Interactive Game Switcher Dropdown (Demo & Preview Mode) */}
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
                  <span className="text-amber-400 font-mono">10 Games</span>
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
              <span className="text-[8px] sm:text-[9px] uppercase font-bold text-gray-500 leading-none">Balance</span>
              <span className="text-xs sm:text-sm font-black text-emerald-400 font-mono leading-tight">
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

          {/* GAME 1: SKY RUSH (Crash Multiplier Jet) */}
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

          {/* GAME 2: TIGER TRAIL (Step / Jungle River Cashout) */}
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

          {/* GAME 3: BOMB GRID (5x5 Laser Energy Mines) */}
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

          {/* GAME 4: DROP X (60FPS Plinko Multi-Pin Drop) */}
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

          {/* GAME 5: CRICKET BLAST (Night Stadium Crash Hit) */}
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

          {/* GAME 6: INFINITY X (Quantum Fast Limbo) */}
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

          {/* GAME 7: TREASURE TOWER (8-Floor Pyramid Risk Tower) */}
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

          {/* GAME 8: DICE X (60FPS 3D Probability Dice) */}
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

          {/* GAME 9: CARD CLIMB (3D Royal Hi-Lo Felt Table) */}
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

          {/* GAME 10: LUCKY WHEEL X (60FPS Multiplier Wheel) */}
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
      </main>
    </div>
  );
}

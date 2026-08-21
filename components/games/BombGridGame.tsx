"use client";

import React, { useState, useCallback } from "react";
import {
  Bomb,
  Sparkles,
  Zap,
  RotateCcw,
  Trophy,
  ShieldAlert,
  Flame,
  Shuffle,
  Eye,
  Sliders,
  Wallet,
  ShieldCheck,
  Gem,
} from "lucide-react";
import confetti from "canvas-confetti";
import { sound } from "@/lib/soundFx";

interface BombGridGameProps {
  playerBalance: number;
  onUpdateBalance: (newBalance: number) => void;
  onRecordRound?: (data: { bet: number; win: number; multiplier: number }) => void;
}

interface TileState {
  index: number;
  isRevealed: boolean;
  isMine: boolean;
  isHit: boolean;
}

export const BombGridGame: React.FC<BombGridGameProps> = ({
  playerBalance,
  onUpdateBalance,
  onRecordRound,
}) => {
  const [betAmount, setBetAmount] = useState(50);
  const [mineCount, setMineCount] = useState(3);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isWinner, setIsWinner] = useState(false);
  const [tiles, setTiles] = useState<TileState[]>(() =>
    Array.from({ length: 25 }, (_, i) => ({
      index: i,
      isRevealed: false,
      isMine: false,
      isHit: false,
    }))
  );
  const [revealedCount, setRevealedCount] = useState(0);
  const [lastWin, setLastWin] = useState<{ amount: number; multiplier: number } | null>(null);

  // Calculate Provably Fair multiplier for X gems found
  const getMultiplierForGems = useCallback(
    (gems: number, mines: number) => {
      if (gems === 0) return 1.0;
      let mult = 1.0;
      const totalSafe = 25 - mines;
      for (let i = 0; i < gems; i++) {
        mult *= (25 - i) / (totalSafe - i);
      }
      return Number((mult * 0.985).toFixed(2));
    },
    []
  );

  const currentMultiplier = getMultiplierForGems(revealedCount, mineCount);
  const nextMultiplier = getMultiplierForGems(revealedCount + 1, mineCount);
  const currentProfit = Number((betAmount * currentMultiplier).toFixed(2));
  const safeTilesLeft = 25 - mineCount - revealedCount;
  const remainingTiles = 25 - revealedCount;
  const nextSafeChance = remainingTiles > 0 ? Math.round((safeTilesLeft / remainingTiles) * 100) : 0;

  // 1. Start New Minefield Game
  const startGridGame = () => {
    if (playerBalance < betAmount) {
      alert("Insufficient Balance");
      return;
    }

    onUpdateBalance(playerBalance - betAmount);
    setLastWin(null);
    setIsGameOver(false);
    setIsWinner(false);
    setRevealedCount(0);

    // Randomize mine locations
    const mines: number[] = [];
    while (mines.length < mineCount) {
      const rand = Math.floor(Math.random() * 25);
      if (!mines.includes(rand)) mines.push(rand);
    }

    setTiles(
      Array.from({ length: 25 }, (_, i) => ({
        index: i,
        isRevealed: false,
        isMine: mines.includes(i),
        isHit: false,
      }))
    );

    setIsPlaying(true);
    sound.playCardDeal();
  };

  // 2. Click Tile / Cell
  const handleTileClick = (index: number) => {
    if (!isPlaying || isGameOver || tiles[index].isRevealed) return;

    const clickedTile = tiles[index];

    if (clickedTile.isMine) {
      // Hit Bomb!
      sound.playSonicBoom();
      setTiles((prev) =>
        prev.map((t) => ({
          ...t,
          isRevealed: true,
          isHit: t.index === index,
        }))
      );
      setIsGameOver(true);
      setIsPlaying(false);
    } else {
      // Safe Crystal Found!
      sound.playCoinFlip();
      const newRevealedCount = revealedCount + 1;
      setRevealedCount(newRevealedCount);

      setTiles((prev) =>
        prev.map((t) => (t.index === index ? { ...t, isRevealed: true } : t))
      );

      // Check if cleared ALL safe tiles!
      if (newRevealedCount === 25 - mineCount) {
        const finalMult = getMultiplierForGems(newRevealedCount, mineCount);
        triggerCashout(finalMult);
      }
    }
  };

  // 3. Pick Random Safe Tile
  const pickRandomTile = () => {
    if (!isPlaying || isGameOver) return;
    const unrevealedIndices = tiles
      .filter((t) => !t.isRevealed)
      .map((t) => t.index);
    if (unrevealedIndices.length === 0) return;
    const randomPick = unrevealedIndices[Math.floor(Math.random() * unrevealedIndices.length)];
    handleTileClick(randomPick);
  };

  // 4. Cashout Minefield
  const triggerCashout = (customMult?: number) => {
    if (!isPlaying && !customMult) return;
    if (revealedCount === 0 && !customMult) return;

    const finalMult = customMult || currentMultiplier;
    const winAmount = Number((betAmount * finalMult).toFixed(2));

    onUpdateBalance(playerBalance + winAmount);
    setLastWin({ amount: winAmount, multiplier: finalMult });
    setIsPlaying(false);
    setIsWinner(true);

    // Reveal rest of grid in dimmed mode
    setTiles((prev) => prev.map((t) => ({ ...t, isRevealed: true })));

    sound.playWin();
    confetti({ particleCount: 75, spread: 70, origin: { y: 0.55 } });

    if (onRecordRound) {
      onRecordRound({ bet: betAmount, win: winAmount, multiplier: finalMult });
    }
  };

  return (
    <div className="w-full flex flex-col space-y-3">
      {/* 5x5 Minefield Hero Arena Card */}
      <div className="w-full bg-[#080d1a] border border-amber-500/20 rounded-3xl p-3.5 sm:p-5 shadow-2xl flex flex-col items-center justify-center relative overflow-hidden">
        {/* Ambient Background Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Top Grid HUD Header */}
        <div className="w-full flex items-center justify-between pb-2 mb-2 border-b border-slate-800/80 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span className="font-bold text-gray-300 uppercase tracking-wider">
              {mineCount} Mines Hidden
            </span>
          </div>

          <div className="flex items-center gap-3 font-mono font-bold">
            <span className="text-gray-400">
              💎 {revealedCount}/{25 - mineCount}
            </span>
            <span className="text-emerald-400">
              Safe: {isPlaying ? `${nextSafeChance}%` : "—"}
            </span>
          </div>
        </div>

        {/* 5x5 Interactive Cell Matrix */}
        <div className="grid grid-cols-5 gap-2 sm:gap-3 p-1 max-w-[360px] sm:max-w-[420px] w-full">
          {tiles.map((tile) => {
            const isCellRevealed = tile.isRevealed;
            const isCellMine = tile.isMine;
            const isCellHit = tile.isHit;

            return (
              <button
                key={tile.index}
                disabled={!isPlaying || isCellRevealed}
                onClick={() => handleTileClick(tile.index)}
                className={`aspect-square rounded-2xl flex items-center justify-center text-xl sm:text-2xl font-black transition-all duration-200 relative group overflow-hidden cursor-pointer ${
                  isCellRevealed
                    ? isCellMine
                      ? isCellHit
                        ? "bg-gradient-to-br from-rose-500 via-rose-600 to-red-700 text-white shadow-xl shadow-rose-600/50 scale-105 animate-bounce border border-rose-400"
                        : "bg-rose-950/40 border border-rose-600/30 text-rose-400/80 scale-95 opacity-70"
                      : "bg-gradient-to-br from-emerald-400 via-teal-500 to-emerald-600 text-black shadow-lg shadow-emerald-500/40 scale-100 border border-emerald-300/50 animate-in zoom-in duration-200"
                    : isPlaying
                    ? "bg-[#101728] hover:bg-[#1a2540] border border-slate-700 hover:border-amber-400/80 hover:shadow-lg hover:shadow-amber-500/20 active:scale-95"
                    : "bg-[#0c1220] border border-slate-800/80 text-gray-600 opacity-60"
                }`}
              >
                {/* Unrevealed Cell Shimmer */}
                {!isCellRevealed && isPlaying && (
                  <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/0 via-amber-500/5 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                )}

                {/* Cell Content */}
                {isCellRevealed ? (
                  isCellMine ? (
                    <span className="text-xl sm:text-2xl animate-shake">💣</span>
                  ) : (
                    <span className="drop-shadow-md animate-pulse text-lg sm:text-2xl">💎</span>
                  )
                ) : (
                  <span className="text-slate-600 font-mono text-xs sm:text-sm font-bold group-hover:text-amber-400 group-hover:scale-110 transition-transform">
                    {tile.index + 1}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Live Multiplier Pill Bar */}
        <div className="w-full flex items-center justify-between mt-2.5 pt-2 border-t border-slate-800/80 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-gray-400 font-bold text-[11px] uppercase">Multiplier:</span>
            <span className="font-mono font-black text-amber-400 text-sm">
              {currentMultiplier.toFixed(2)}x
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-gray-400 font-bold text-[11px] uppercase">Win Value:</span>
            <span className="font-mono font-black text-emerald-400 text-sm">
              ₹{currentProfit}
            </span>
          </div>
        </div>
      </div>

      {/* Spacious, Ergonomic Dashboard Panel (No Cramping) */}
      <div className="bg-[#080d1a] border border-slate-800/90 rounded-3xl p-4 sm:p-5 shadow-2xl space-y-3.5 backdrop-blur-md">
        {!isPlaying ? (
          /* ========================================================= */
          /* 1. BET & MINES CONFIGURATION (Before round) */
          /* ========================================================= */
          <div className="space-y-3.5">
            {/* Row 1: Mines Selector Full-Width Segmented Row */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-gray-400 px-1">
                <span className="uppercase tracking-wider">Hidden Mines:</span>
                <span className="font-mono text-rose-400">{mineCount} Mines ({getMultiplierForGems(1, mineCount)}x / gem)</span>
              </div>

              <div className="grid grid-cols-5 gap-1.5 p-1 bg-[#050811] border border-slate-800/90 rounded-2xl">
                {[1, 3, 5, 10, 20].map((count) => (
                  <button
                    key={count}
                    onClick={() => {
                      setMineCount(count);
                      sound.playCardDeal();
                    }}
                    className={`py-2 rounded-xl text-xs font-mono font-black transition-all cursor-pointer ${
                      mineCount === count
                        ? "bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-lg shadow-rose-600/30 scale-[1.02] border border-rose-400"
                        : "text-gray-400 hover:text-white hover:bg-slate-900"
                    }`}
                  >
                    {count} {count === 1 ? "Mine" : "Mines"}
                  </button>
                ))}
              </div>
            </div>

            {/* Row 2: Bet Amount Input & Quick Chips */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-gray-400 px-1">
                <span className="uppercase tracking-wider">Bet Amount (INR):</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                <div className="sm:col-span-4 flex items-center gap-1.5 bg-[#050811] border border-slate-800 rounded-2xl px-3 py-2">
                  <span className="text-amber-400 font-black text-sm">₹</span>
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
                          ? "bg-amber-500 text-black border-amber-400 shadow-md shadow-amber-500/20"
                          : "bg-[#050811] border-slate-800 text-gray-400 hover:text-white"
                      }`}
                    >
                      ₹{val}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Row 3: Grand START Button */}
            <button
              onClick={startGridGame}
              className="w-full h-14 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-black font-black text-sm sm:text-base shadow-xl shadow-amber-500/25 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer border border-amber-300/40"
            >
              <Bomb className="w-5 h-5 stroke-[2.5]" />
              <span className="uppercase tracking-wider font-extrabold text-black/90">
                START GRID MINES
              </span>
              <span className="font-mono font-black text-base sm:text-lg">₹{betAmount}</span>
            </button>
          </div>
        ) : (
          /* ========================================================= */
          /* 2. IN-GAME ACTIVE CASHOUT & AUTO-PICK CONTROLS */
          /* ========================================================= */
          <div className="grid grid-cols-12 gap-2.5 w-full">
            {/* Auto Pick Random Tile Helper (4 cols) */}
            <button
              onClick={pickRandomTile}
              className="col-span-4 h-16 rounded-2xl bg-slate-900/90 border border-slate-700 hover:border-amber-500/50 text-amber-300 font-bold text-xs transition-all active:scale-95 flex flex-col items-center justify-center gap-1 cursor-pointer shadow-md"
            >
              <Shuffle className="w-4 h-4 text-amber-400" />
              <span className="text-[10px] uppercase font-extrabold">Random Tile</span>
            </button>

            {/* Cashout Button (8 cols) */}
            <button
              onClick={() => triggerCashout()}
              disabled={revealedCount === 0}
              className={`col-span-8 h-16 rounded-2xl font-black text-xs sm:text-sm shadow-xl transition-all active:scale-95 flex flex-col items-center justify-center cursor-pointer ${
                revealedCount > 0
                  ? "bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600 hover:from-emerald-300 hover:to-emerald-500 text-black shadow-emerald-500/30 border border-emerald-300/50 animate-pulse"
                  : "bg-[#050811] border border-slate-800 text-gray-500 cursor-not-allowed opacity-50"
              }`}
            >
              <span className="text-[10px] sm:text-xs uppercase tracking-wider font-extrabold text-black/90">
                {revealedCount > 0 ? "CASH OUT 💎" : "PICK A GEM TO EXTRACT"}
              </span>
              <span className="text-sm sm:text-base font-mono font-black">
                ₹{currentProfit} {revealedCount > 0 ? `(${currentMultiplier}x)` : ""}
              </span>
            </button>
          </div>
        )}

        {/* Plasma Bomb Loss Alert */}
        {isGameOver && (
          <div className="p-2.5 bg-rose-950/80 border border-rose-500/70 rounded-2xl text-rose-200 font-bold text-xs flex items-center justify-center gap-2 animate-shake shadow-lg shadow-rose-950/40">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
            <span>💥 Plasma Bomb Triggered! Lost ₹{betAmount}.</span>
          </div>
        )}

        {/* Win Notification */}
        {lastWin && (
          <div className="p-2.5 bg-emerald-950/80 border border-emerald-500/70 rounded-2xl text-emerald-200 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40">
            <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
            <span>🎉 Extracted ₹{lastWin.amount.toLocaleString()} ({lastWin.multiplier.toFixed(2)}x)!</span>
          </div>
        )}
      </div>
    </div>
  );
};

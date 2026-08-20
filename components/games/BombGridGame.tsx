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
    <div className="w-full flex flex-col space-y-4">
      {/* 5x5 Minefield Cyber Arena */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left / Center 5x5 Matrix (7 cols) */}
        <div className="lg:col-span-7 bg-[#080d1a] border border-amber-500/20 rounded-3xl p-5 md:p-6 shadow-2xl flex flex-col items-center justify-center relative overflow-hidden">
          {/* Ambient Background Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

          {/* Grid HUD Header */}
          <div className="w-full flex items-center justify-between pb-4 mb-2 border-b border-slate-800/80 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
              <span className="font-bold text-gray-300 uppercase">Mines: {mineCount}</span>
            </div>
            <div className="flex items-center gap-4 font-mono font-bold">
              <span className="text-gray-400">Gems: {revealedCount}/{25 - mineCount}</span>
              <span className="text-emerald-400">
                Safe Chance: {isPlaying ? `${nextSafeChance}%` : "—"}
              </span>
            </div>
          </div>

          {/* 5x5 Interactive Cell Grid */}
          <div className="grid grid-cols-5 gap-2.5 sm:gap-3.5 p-2 max-w-[420px] w-full">
            {tiles.map((tile) => {
              const isCellRevealed = tile.isRevealed;
              const isCellMine = tile.isMine;
              const isCellHit = tile.isHit;

              return (
                <button
                  key={tile.index}
                  disabled={!isPlaying || isCellRevealed}
                  onClick={() => handleTileClick(tile.index)}
                  className={`aspect-square rounded-2xl flex items-center justify-center text-xl sm:text-2xl font-black transition-all duration-300 relative group overflow-hidden ${
                    isCellRevealed
                      ? isCellMine
                        ? isCellHit
                          ? "bg-gradient-to-br from-rose-500 to-red-700 text-white shadow-xl shadow-rose-600/50 scale-105 animate-bounce"
                          : "bg-rose-950/40 border border-rose-600/30 text-rose-400/80 scale-95 opacity-80"
                        : "bg-gradient-to-br from-emerald-400 to-teal-600 text-black shadow-lg shadow-emerald-500/40 scale-100"
                      : isPlaying
                      ? "bg-[#101728] hover:bg-[#1a2540] border border-slate-700 hover:border-amber-400/80 hover:shadow-lg hover:shadow-amber-500/20 active:scale-95"
                      : "bg-[#0c1220] border border-slate-800 text-gray-600 opacity-60"
                  }`}
                >
                  {/* Unrevealed Cell Scanlines & Glow */}
                  {!isCellRevealed && isPlaying && (
                    <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/0 via-amber-500/5 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}

                  {/* Cell Content */}
                  {isCellRevealed ? (
                    isCellMine ? (
                      <span>💣</span>
                    ) : (
                      <span className="drop-shadow-md animate-pulse">💎</span>
                    )
                  ) : (
                    <span className="text-gray-600 font-mono text-sm font-bold opacity-40 group-hover:opacity-100 group-hover:text-amber-400">
                      {tile.index + 1}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick Action Footer: Pick Random */}
          {isPlaying && (
            <div className="w-full flex items-center justify-between pt-4 mt-2 border-t border-slate-800/80 text-xs">
              <button
                onClick={pickRandomTile}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-amber-500/50 text-amber-300 text-xs font-bold transition-all active:scale-95"
              >
                <Shuffle className="w-3.5 h-3.5" />
                <span>Auto-Pick Random Tile</span>
              </button>

              <span className="font-mono text-xs font-bold text-amber-400">
                Next: {nextMultiplier}x
              </span>
            </div>
          )}
        </div>

        {/* Right Configuration & Tactile Cashout Panel (5 cols) */}
        <div className="lg:col-span-5 bg-[#080d1a] border border-slate-800/90 rounded-3xl p-5 shadow-2xl space-y-5">
          {/* Multiplier / Profit HUD Display */}
          <div className="bg-[#050811] border border-slate-800 rounded-2xl p-4 text-center space-y-1">
            <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">
              {isPlaying ? "Accumulated Multiplier" : "Ready to Extract"}
            </span>
            <div className="text-4xl font-black font-mono text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-amber-500">
              {currentMultiplier.toFixed(2)}x
            </div>
            <div className="text-xs font-bold text-emerald-400 font-mono">
              Profit: ₹{(currentProfit - betAmount > 0 ? currentProfit - betAmount : 0).toFixed(2)}
            </div>
          </div>

          {/* Mine Density Selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-gray-400 uppercase tracking-wider">Hidden Mines Count</span>
              <span className="font-mono font-black text-rose-400">{mineCount} Mines</span>
            </div>

            <div className="grid grid-cols-5 gap-1.5">
              {[1, 3, 5, 10, 20].map((count) => (
                <button
                  key={count}
                  disabled={isPlaying}
                  onClick={() => {
                    setMineCount(count);
                    sound.playCardDeal();
                  }}
                  className={`py-1.5 rounded-xl text-xs font-mono font-bold border transition-colors ${
                    mineCount === count
                      ? "bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-600/30"
                      : "bg-slate-900 border-slate-800 text-gray-400 hover:text-white disabled:opacity-40"
                  }`}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>

          {/* Bet Amount Input & Chips */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Bet Amount (INR)</span>
            <div className="flex items-center gap-2 bg-[#050811] border border-slate-800 rounded-2xl px-3 py-2">
              <span className="text-amber-400 font-bold text-sm">₹</span>
              <input
                type="number"
                disabled={isPlaying}
                value={betAmount}
                onChange={(e) => setBetAmount(Math.max(10, Number(e.target.value)))}
                className="w-full bg-transparent text-white font-mono font-bold text-base focus:outline-none disabled:opacity-50"
              />
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              {[20, 50, 100, 500].map((val) => (
                <button
                  key={val}
                  disabled={isPlaying}
                  onClick={() => {
                    setBetAmount(val);
                    sound.playChipBet();
                  }}
                  className={`py-1.5 rounded-xl text-xs font-mono font-bold border transition-colors ${
                    betAmount === val
                      ? "bg-amber-500 text-black border-amber-400"
                      : "bg-slate-900 border-slate-800 text-gray-400 hover:text-white disabled:opacity-40"
                  }`}
                >
                  ₹{val}
                </button>
              ))}
            </div>
          </div>

          {/* Primary Action Button: START or CASHOUT */}
          {!isPlaying ? (
            <button
              onClick={startGridGame}
              className="w-full h-20 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-base shadow-xl shadow-amber-500/25 transition-all active:scale-95 flex flex-col items-center justify-center"
            >
              <span className="text-xs uppercase tracking-wider font-extrabold text-black/80">START GRID MINES</span>
              <span className="text-xl font-mono font-black">₹{betAmount}</span>
            </button>
          ) : (
            <button
              onClick={() => triggerCashout()}
              disabled={revealedCount === 0}
              className="w-full h-20 rounded-2xl bg-gradient-to-r from-emerald-400 to-emerald-600 hover:from-emerald-300 hover:to-emerald-500 disabled:opacity-40 text-black font-black text-base shadow-xl shadow-emerald-500/30 transition-all active:scale-95 flex flex-col items-center justify-center animate-pulse"
            >
              <span className="text-xs uppercase tracking-wider font-extrabold text-black/80">CASH OUT</span>
              <span className="text-xl font-mono font-black">₹{currentProfit}</span>
              <span className="text-[10px] font-bold text-emerald-950 font-mono">({currentMultiplier}x)</span>
            </button>
          )}

          {/* Bomb Loss Alert */}
          {isGameOver && (
            <div className="p-3 bg-rose-950/60 border border-rose-500/50 rounded-2xl text-rose-300 font-bold text-xs flex items-center justify-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span>Plasma Bomb Triggered! Lost ₹{betAmount}.</span>
            </div>
          )}

          {/* Win Notification */}
          {lastWin && (
            <div className="p-3 bg-emerald-950/60 border border-emerald-500/50 rounded-2xl text-emerald-300 font-bold text-xs flex items-center justify-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>Extracted ₹{lastWin.amount} ({lastWin.multiplier}x)!</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

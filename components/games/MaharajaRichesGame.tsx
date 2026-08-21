"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Zap,
  Info,
  Plus,
  Minus,
  Crown,
  Flame,
  Award,
  X,
  Volume2,
  VolumeX,
} from "lucide-react";
import confetti from "canvas-confetti";
import { sound } from "@/lib/soundFx";
import {
  SymbolId,
  SYMBOLS_CONFIG,
  MaharajaSymbolIcon,
} from "./MaharajaSymbols";
import {
  PAYLINES,
  SpinResult,
  LineWin,
  generateRandomReels,
  evaluateSpin,
} from "./maharajaLogic";
import { MaharajaReelColumn } from "./MaharajaReelColumn";
import { MaharajaBigWinModal } from "./MaharajaBigWinModal";

interface MaharajaRichesGameProps {
  playerBalance: number;
  onUpdateBalance: (newBalance: number) => void;
  onRecordRound?: (data: { bet: number; win: number; multiplier: number }) => void;
}

const BET_OPTIONS = [10, 20, 50, 100, 200, 500, 1000, 2000, 5000];

export const MaharajaRichesGame: React.FC<MaharajaRichesGameProps> = ({
  playerBalance,
  onUpdateBalance,
  onRecordRound,
}) => {
  // Game States
  const [betIndex, setBetIndex] = useState(2); // default ₹50
  const betAmount = BET_OPTIONS[betIndex];

  // Grid is 5 reels x 3 rows
  const [currentGrid, setCurrentGrid] = useState<SymbolId[][]>([
    ["ganesha", "lotus", "peacock"],
    ["diya", "tajmahal", "ganesha"],
    ["peacock", "diya", "lotus"],
    ["tajmahal", "ganesha", "diya"],
    ["lotus", "peacock", "tajmahal"],
  ]);

  const [pendingGrid, setPendingGrid] = useState<SymbolId[][] | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [isTurbo, setIsTurbo] = useState(false);
  const [reelsSpinningState, setReelsSpinningState] = useState<boolean[]>([false, false, false, false, false]);

  // Auto Spin
  const [autoSpinCount, setAutoSpinCount] = useState(0);
  const [isAutoActive, setIsAutoActive] = useState(false);
  const [showAutoModal, setShowAutoModal] = useState(false);

  // Free Spins Bonus
  const [freeSpinsRemaining, setFreeSpinsRemaining] = useState(0);
  const [totalFreeSpinsWon, setTotalFreeSpinsWon] = useState(0);
  const [isFreeSpinsMode, setIsFreeSpinsMode] = useState(false);

  // Win State & Popups
  const [lastSpinResult, setLastSpinResult] = useState<SpinResult | null>(null);
  const [activeWinLineIdx, setActiveWinLineIdx] = useState<number | null>(null);
  const [displayedWinAmount, setDisplayedWinAmount] = useState<number>(0);
  const [winToast, setWinToast] = useState<{ message: string; amount: number } | null>(null);
  const [bigWinModalData, setBigWinModalData] = useState<{
    win: number;
    bet: number;
    multiplier: number;
  } | null>(null);

  // Modals
  const [showPaytableModal, setShowPaytableModal] = useState(false);

  const stoppedReelsCount = useRef(0);
  const pendingResultRef = useRef<SpinResult | null>(null);
  const isFreeSpinRoundRef = useRef(false);

  // Auto / Free Spin loop - strictly PAUSED when bigWinModalData is active
  useEffect(() => {
    if (!isSpinning && !bigWinModalData && (isAutoActive || isFreeSpinsMode)) {
      const timer = setTimeout(() => {
        if (isFreeSpinsMode && freeSpinsRemaining > 0) {
          executeSpin(true);
        } else if (isAutoActive && autoSpinCount > 0) {
          if (playerBalance >= betAmount) {
            setAutoSpinCount((prev) => prev - 1);
            executeSpin(false);
          } else {
            setIsAutoActive(false);
          }
        } else if (isAutoActive && autoSpinCount === 0) {
          setIsAutoActive(false);
        }
      }, 1200);

      return () => clearTimeout(timer);
    }
  }, [isSpinning, bigWinModalData, isAutoActive, autoSpinCount, isFreeSpinsMode, freeSpinsRemaining, playerBalance, betAmount]);

  // Cycle through active winning paylines for visual showcase
  useEffect(() => {
    if (!lastSpinResult || lastSpinResult.lineWins.length === 0 || isSpinning || bigWinModalData) {
      setActiveWinLineIdx(null);
      return;
    }

    let currentIndex = 0;
    const interval = setInterval(() => {
      setActiveWinLineIdx(currentIndex % lastSpinResult.lineWins.length);
      currentIndex++;
    }, 1800);

    return () => clearInterval(interval);
  }, [lastSpinResult, isSpinning, bigWinModalData]);

  // 1. Initiate Spin (Strictly blocked during Celebration Modal)
  const executeSpin = (isFreeSpinRound: boolean = false) => {
    if (isSpinning || bigWinModalData) return;

    if (!isFreeSpinRound && playerBalance < betAmount) {
      alert("Insufficient Balance for Bet!");
      setIsAutoActive(false);
      return;
    }

    if (!isFreeSpinRound) {
      onUpdateBalance(playerBalance - betAmount);
    } else {
      setFreeSpinsRemaining((prev) => Math.max(0, prev - 1));
    }

    setIsSpinning(true);
    setLastSpinResult(null);
    setActiveWinLineIdx(null);
    setDisplayedWinAmount(0);
    setWinToast(null);

    // Generate outcome
    const targetGrid = generateRandomReels();
    const evaluated = evaluateSpin(targetGrid, betAmount, isFreeSpinRound);

    setPendingGrid(targetGrid);
    pendingResultRef.current = evaluated;
    isFreeSpinRoundRef.current = isFreeSpinRound;
    stoppedReelsCount.current = 0;

    // Start all 5 reels spinning from left to right
    setReelsSpinningState([true, true, true, true, true]);
    sound.playChipBet();
  };

  // 2. Individual Reel Stop Callback (Called sequentially left to right: 0 -> 1 -> 2 -> 3 -> 4)
  const handleReelStop = (reelIdx: number) => {
    sound.playReelStop(reelIdx);

    if (pendingGrid && pendingGrid[reelIdx].includes("tajmahal")) {
      sound.playScatterHit(reelIdx + 1);
    }

    stoppedReelsCount.current += 1;

    // When the final (5th) reel stops
    if (stoppedReelsCount.current === 5) {
      if (pendingGrid) setCurrentGrid(pendingGrid);
      setReelsSpinningState([false, false, false, false, false]);
      setIsSpinning(false);

      if (pendingResultRef.current) {
        finalizeRound(pendingResultRef.current, isFreeSpinRoundRef.current);
      }
    }
  };

  // 3. Finalize spin payout & show celebration animations
  const finalizeRound = (result: SpinResult, isFreeSpinRound: boolean) => {
    setLastSpinResult(result);

    if (result.totalWin > 0) {
      setDisplayedWinAmount(result.totalWin);
      onUpdateBalance(playerBalance + result.totalWin);

      if (isFreeSpinRound) {
        setTotalFreeSpinsWon((prev) => prev + result.totalWin);
      }

      onRecordRound?.({
        bet: betAmount,
        win: result.totalWin,
        multiplier: result.totalMultiplier,
      });

      // BIG WIN / MEGA WIN / JACKPOT Celebration Modal (8x+ High Excitement Win)
      if (result.totalMultiplier >= 8.0) {
        setBigWinModalData({
          win: result.totalWin,
          bet: betAmount,
          multiplier: result.totalMultiplier,
        });
      } else {
        // Fast, smooth on-screen win highlight & chime (Zero modal interruption)
        sound.playLineWin();
        setWinToast({
          message: `WIN ₹${result.totalWin.toLocaleString("en-IN")}`,
          amount: result.totalWin,
        });
        confetti({
          particleCount: 20,
          spread: 45,
          origin: { y: 0.8 },
        });
        setTimeout(() => setWinToast(null), 2000);
      }
    }

    // Free Spins Trigger Celebration
    if (result.isFreeSpinsTriggered) {
      sound.playBigWinFanfare("MEGA");
      setIsFreeSpinsMode(true);
      setFreeSpinsRemaining((prev) => prev + result.freeSpinsAwarded);
      setWinToast({
        message: "🕌 10 FREE SPINS TRIGGERED (3X MULTIPLIER)!",
        amount: result.scatterWin,
      });
      setTimeout(() => setWinToast(null), 3000);
      confetti({
        particleCount: 60,
        spread: 75,
        origin: { y: 0.5 },
      });
    }

    // Free spins ended
    if (isFreeSpinRound && freeSpinsRemaining <= 1 && !result.isFreeSpinsTriggered) {
      setTimeout(() => {
        setIsFreeSpinsMode(false);
        sound.playWin();
      }, 1500);
    }
  };

  const isCellWinning = (reelIdx: number, rowIdx: number) => {
    if (!lastSpinResult) return false;
    if (activeWinLineIdx !== null && lastSpinResult.lineWins[activeWinLineIdx]) {
      const activeLine = lastSpinResult.lineWins[activeWinLineIdx];
      return activeLine.coords.some((c) => c.reel === reelIdx && c.row === rowIdx);
    }
    return lastSpinResult.lineWins.some((lw) =>
      lw.coords.some((c) => c.reel === reelIdx && c.row === rowIdx)
    );
  };

  return (
    <div className="w-full flex flex-col items-center justify-start max-w-5xl mx-auto select-none">
      {/* 3D Indian Royal Palace Frame Container */}
      <div className="w-full bg-gradient-to-b from-[#1b0d26] via-[#100718] to-[#0a0410] border-2 border-amber-500/70 rounded-3xl p-2 sm:p-4 md:p-6 shadow-[0_0_50px_rgba(245,158,11,0.3)] relative overflow-hidden flex flex-col items-center gap-3">
        {/* Background Royal Filigree & Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-gradient-to-b from-amber-500/15 via-pink-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        {/* TOP TITLE BANNER */}
        <div className="w-full flex items-center justify-between px-2 sm:px-4 py-1 z-10">
          <button
            onClick={() => setShowPaytableModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-xs font-bold transition-all cursor-pointer shadow-md"
          >
            <Info className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Paytable & Rules</span>
          </button>

          {/* Grand Embossed Logo */}
          <div className="relative flex flex-col items-center">
            <div className="px-6 py-1.5 rounded-2xl bg-gradient-to-r from-amber-600 via-yellow-400 to-amber-600 border border-amber-300 shadow-[0_0_20px_rgba(255,215,0,0.5)]">
              <h1 className="text-base sm:text-xl md:text-2xl font-black tracking-widest text-black uppercase font-serif drop-shadow-sm flex items-center gap-2">
                <span>⚜</span>
                <span>MAHARAJA RICHES</span>
                <span>⚜</span>
              </h1>
            </div>
            {isFreeSpinsMode && (
              <div className="mt-1 px-4 py-0.5 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 border border-pink-400 text-white font-black text-xs animate-bounce shadow-lg">
                👑 FREE SPINS: {freeSpinsRemaining} LEFT (3X MULTIPLIER!) 👑
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsTurbo(!isTurbo)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl border text-xs font-black transition-all cursor-pointer ${
                isTurbo
                  ? "bg-amber-500 border-yellow-300 text-black shadow-lg shadow-amber-500/30"
                  : "bg-slate-900/80 border-slate-800 text-gray-400 hover:text-white"
              }`}
            >
              <Zap className={`w-3.5 h-3.5 ${isTurbo ? "fill-black" : ""}`} />
              <span className="hidden sm:inline">TURBO</span>
            </button>
          </div>
        </div>

        {/* 🎰 THE 5x3 REEL MATRIX WITH TOP-TO-BOTTOM SLIDING ANIMATION */}
        <div className="w-full relative bg-[#09030e]/95 border-4 border-amber-500/80 rounded-2xl p-2 sm:p-3.5 shadow-[inset_0_0_30px_rgba(0,0,0,0.95)] overflow-hidden">
          {/* 5 Staggered Sliding Columns */}
          <div className="grid grid-cols-5 gap-1.5 sm:gap-2.5 md:gap-3.5 relative z-10">
            {[0, 1, 2, 3, 4].map((colIdx) => (
              <MaharajaReelColumn
                key={colIdx}
                reelIndex={colIdx}
                isSpinning={reelsSpinningState[colIdx]}
                targetSymbols={pendingGrid ? pendingGrid[colIdx] : currentGrid[colIdx]}
                onStop={() => handleReelStop(colIdx)}
                isTurbo={isTurbo}
                isWinningCell={(rowIdx) => isCellWinning(colIdx, rowIdx)}
              />
            ))}
          </div>

          {/* Standard Win Toast / Banner Notification */}
          {winToast && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 border-2 border-yellow-200 text-black font-black text-sm sm:text-base px-6 py-2 rounded-2xl shadow-[0_0_30px_rgba(255,215,0,0.8)] animate-bounce">
              {winToast.message}
            </div>
          )}

          {/* Active Win Line Info Strip */}
          {lastSpinResult && lastSpinResult.lineWins.length > 0 && activeWinLineIdx !== null && (
            <div className="mt-2.5 w-full bg-gradient-to-r from-amber-500/20 via-yellow-500/30 to-amber-500/20 border border-amber-400/60 rounded-xl py-1.5 px-3 flex items-center justify-between text-xs sm:text-sm font-black text-yellow-300 animate-pulse">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-amber-500 text-black text-[10px] font-mono">
                  LINE {lastSpinResult.lineWins[activeWinLineIdx].lineIndex + 1}
                </span>
                <span>
                  {lastSpinResult.lineWins[activeWinLineIdx].count}x{" "}
                  {SYMBOLS_CONFIG[lastSpinResult.lineWins[activeWinLineIdx].symbolId].name.toUpperCase()}
                  {lastSpinResult.lineWins[activeWinLineIdx].hasWild && " (WILD 2X)"}
                </span>
              </div>
              <span className="font-mono text-emerald-400 text-sm sm:text-base">
                +₹{lastSpinResult.lineWins[activeWinLineIdx].payout.toLocaleString("en-IN")}
              </span>
            </div>
          )}
        </div>

        {/* 🎮 BOTTOM CONSOLE & CONTROLS */}
        <div className="w-full grid grid-cols-1 md:grid-cols-12 gap-2 sm:gap-3 items-center justify-between bg-[#0e0414]/95 border-2 border-amber-500/60 rounded-2xl p-2.5 sm:p-3.5 shadow-xl">
          {/* 1. BALANCE & WIN DISPLAY (Cols 1-4) */}
          <div className="md:col-span-4 grid grid-cols-2 gap-2">
            {/* Balance Card */}
            <div className="flex flex-col items-start bg-[#1a0826] border border-amber-500/40 rounded-xl px-3 py-1.5 shadow-inner">
              <span className="text-[9px] sm:text-[10px] uppercase font-bold text-amber-300/70 tracking-wider">
                BALANCE
              </span>
              <span className="text-xs sm:text-base font-black font-mono text-emerald-400 truncate w-full">
                ₹{playerBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>

            {/* Win Card */}
            <div className="flex flex-col items-start bg-[#1a0826] border border-amber-500/40 rounded-xl px-3 py-1.5 shadow-inner">
              <span className="text-[9px] sm:text-[10px] uppercase font-bold text-amber-300/70 tracking-wider">
                WIN
              </span>
              <span
                className={`text-xs sm:text-base font-black font-mono truncate w-full transition-all ${
                  displayedWinAmount > 0 ? "text-yellow-300 scale-105" : "text-gray-400"
                }`}
              >
                ₹{displayedWinAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* 2. BET SELECTOR (- / +) (Cols 5-8) */}
          <div className="md:col-span-4 flex items-center justify-center gap-2">
            <button
              onClick={() => {
                if (betIndex > 0) {
                  setBetIndex(betIndex - 1);
                  sound.playChipBet();
                }
              }}
              disabled={isSpinning || Boolean(bigWinModalData) || betIndex === 0}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-900 border border-amber-500/40 hover:border-amber-400 text-amber-300 flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer active:scale-95 shadow-md"
            >
              <Minus className="w-4 h-4" />
            </button>

            <div className="flex-1 max-w-[130px] flex flex-col items-center bg-[#1a0826] border border-amber-500/50 rounded-xl py-1 px-2 text-center">
              <span className="text-[9px] uppercase font-bold text-amber-300/70 tracking-wider">
                BET
              </span>
              <span className="text-xs sm:text-sm font-black font-mono text-amber-400">
                ₹{betAmount}
              </span>
            </div>

            <button
              onClick={() => {
                if (betIndex < BET_OPTIONS.length - 1) {
                  setBetIndex(betIndex + 1);
                  sound.playChipBet();
                }
              }}
              disabled={isSpinning || Boolean(bigWinModalData) || betIndex === BET_OPTIONS.length - 1}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-900 border border-amber-500/40 hover:border-amber-400 text-amber-300 flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer active:scale-95 shadow-md"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* 3. AUTO & GRAND SPIN BUTTON (Cols 9-12) */}
          <div className="md:col-span-4 flex items-center justify-end gap-2 sm:gap-3">
            {/* Auto Spin Button */}
            <button
              disabled={Boolean(bigWinModalData)}
              onClick={() => {
                if (isAutoActive) {
                  setIsAutoActive(false);
                  setAutoSpinCount(0);
                } else {
                  setShowAutoModal(true);
                }
              }}
              className={`px-3 sm:px-4 py-2.5 rounded-xl border text-xs font-black transition-all cursor-pointer uppercase ${
                isAutoActive
                  ? "bg-rose-600 border-rose-400 text-white animate-pulse"
                  : "bg-slate-900 border-amber-500/40 text-amber-300 hover:border-amber-400"
              }`}
            >
              {isAutoActive ? `STOP (${autoSpinCount})` : "AUTO"}
            </button>

            {/* Giant 3D Golden Oval SPIN Button */}
            <button
              onClick={() => executeSpin(false)}
              disabled={isSpinning || Boolean(bigWinModalData) || (isFreeSpinsMode && freeSpinsRemaining > 0)}
              className="flex-1 md:flex-none px-6 sm:px-10 py-3 sm:py-3.5 rounded-2xl bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-500 hover:from-yellow-300 hover:to-amber-400 border-2 border-yellow-200 text-black font-black text-sm sm:text-base uppercase tracking-widest shadow-[0_0_25px_rgba(255,215,0,0.6)] transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-black animate-spin" style={{ animationDuration: "4s" }} />
              <span>SPIN</span>
            </button>
          </div>
        </div>

        {/* 💎 BOTTOM MINI PAYTABLE CAROUSEL STRIP */}
        <div className="w-full flex items-center justify-between overflow-x-auto gap-2 pt-1 px-1 text-[10px] text-gray-300 border-t border-amber-500/20">
          <div className="flex items-center gap-1.5 bg-[#14061e] border border-amber-500/30 rounded-xl px-2.5 py-1 shrink-0">
            <div className="w-5 h-5"><MaharajaSymbolIcon symbolId="ganesha" /></div>
            <div><span className="font-bold text-amber-400">Golden Ganesha:</span> <span className="font-mono text-yellow-300">5x • 1000x</span></div>
          </div>
          <div className="flex items-center gap-1.5 bg-[#14061e] border border-amber-500/30 rounded-xl px-2.5 py-1 shrink-0">
            <div className="w-5 h-5"><MaharajaSymbolIcon symbolId="peacock" /></div>
            <div><span className="font-bold text-cyan-400">Royal Peacock:</span> <span className="font-mono text-yellow-300">5x • 500x</span></div>
          </div>
          <div className="flex items-center gap-1.5 bg-[#14061e] border border-amber-500/30 rounded-xl px-2.5 py-1 shrink-0">
            <div className="w-5 h-5"><MaharajaSymbolIcon symbolId="lotus" /></div>
            <div><span className="font-bold text-pink-400">Lotus Bloom:</span> <span className="font-mono text-yellow-300">5x • 250x</span></div>
          </div>
          <div className="flex items-center gap-1.5 bg-[#14061e] border border-amber-500/30 rounded-xl px-2.5 py-1 shrink-0">
            <div className="w-5 h-5"><MaharajaSymbolIcon symbolId="diya" /></div>
            <div><span className="font-bold text-orange-400">Sacred Diya:</span> <span className="font-mono text-yellow-300">5x • 150x</span></div>
          </div>
          <div className="flex items-center gap-1.5 bg-[#14061e] border border-amber-500/30 rounded-xl px-2.5 py-1 shrink-0">
            <div className="w-5 h-5"><MaharajaSymbolIcon symbolId="tajmahal" /></div>
            <div><span className="font-bold text-sky-400">Taj Mahal (Bonus):</span> <span className="font-mono text-yellow-300">3+ • Free Spins</span></div>
          </div>
        </div>
      </div>

      {/* 🌟 JILI / PG SOFT STYLE GRAND BIG WIN CELEBRATION MODAL */}
      {bigWinModalData && (
        <MaharajaBigWinModal
          winAmount={bigWinModalData.win}
          betAmount={bigWinModalData.bet}
          multiplier={bigWinModalData.multiplier}
          onClose={() => setBigWinModalData(null)}
        />
      )}

      {/* AUTO SPIN SELECTION MODAL */}
      {showAutoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-[#12061a] border-2 border-amber-500/70 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-amber-500/30 pb-3">
              <h3 className="text-base font-black text-amber-300 uppercase tracking-wider">
                Select Auto Spins
              </h3>
              <button
                onClick={() => setShowAutoModal(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {[10, 20, 50, 100].map((count) => (
                <button
                  key={count}
                  onClick={() => {
                    setAutoSpinCount(count);
                    setIsAutoActive(true);
                    setShowAutoModal(false);
                  }}
                  className="py-3 rounded-xl bg-gradient-to-r from-amber-500/20 to-yellow-500/20 hover:from-amber-500 hover:to-yellow-400 hover:text-black border border-amber-500/40 text-amber-300 font-black text-sm transition-all cursor-pointer active:scale-95"
                >
                  {count} Spins
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* PAYTABLE & RULES MODAL */}
      {showPaytableModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-[#13071c] border-2 border-amber-500/80 rounded-3xl p-4 sm:p-6 max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl space-y-5 text-gray-200">
            <div className="flex items-center justify-between border-b border-amber-500/40 pb-3 sticky top-0 bg-[#13071c] z-10">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-400" />
                <h3 className="text-base sm:text-lg font-black text-amber-300 uppercase tracking-wider">
                  Maharaja Riches — Paytable & Rules
                </h3>
              </div>
              <button
                onClick={() => setShowPaytableModal(false)}
                className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-gray-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Special Features Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 bg-gradient-to-b from-amber-500/20 to-transparent border border-amber-500/40 rounded-2xl space-y-1">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                  <span className="text-xl">🐘</span>
                  <span>Golden Ganesha (WILD 2X)</span>
                </div>
                <p className="text-xs text-gray-300">
                  Substitutes for all symbols except Scatter. Multiplies any winning payline by <strong>2x</strong>!
                </p>
              </div>

              <div className="p-3.5 bg-gradient-to-b from-sky-500/20 to-transparent border border-sky-500/40 rounded-2xl space-y-1">
                <div className="flex items-center gap-2 text-sky-400 font-bold text-sm">
                  <span className="text-xl">🕌</span>
                  <span>Taj Mahal (SCATTER)</span>
                </div>
                <p className="text-xs text-gray-300">
                  3 or more Scatters anywhere award <strong>10 FREE SPINS</strong> with a <strong>3X Win Multiplier</strong> on all wins!
                </p>
              </div>
            </div>

            {/* Symbol Payout Grid */}
            <div className="space-y-2">
              <h4 className="text-xs uppercase font-bold text-amber-400 tracking-wider">
                Symbol Payout Multipliers (Line Bet)
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {Object.values(SYMBOLS_CONFIG).map((sym) => (
                  <div
                    key={sym.id}
                    className="p-2 bg-[#1b0a27] border border-amber-500/30 rounded-xl flex items-center gap-2.5"
                  >
                    <div className="w-10 h-10 shrink-0">
                      <MaharajaSymbolIcon symbolId={sym.id} />
                    </div>
                    <div className="flex flex-col text-[11px]">
                      <span className="font-bold text-white leading-tight">{sym.name}</span>
                      <span className="text-amber-400 font-mono">5x: {sym.payouts[5]}x</span>
                      <span className="text-gray-400 font-mono">4x: {sym.payouts[4]}x</span>
                      <span className="text-gray-500 font-mono">3x: {sym.payouts[3]}x</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Paylines Explanation */}
            <div className="p-3 bg-black/40 border border-slate-800 rounded-2xl space-y-1">
              <span className="text-xs font-bold text-amber-400 block">20 Fixed Paylines</span>
              <p className="text-xs text-gray-400">
                Wins are evaluated from left to right on adjacent reels starting from Reel 1. Highest win per line is paid.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

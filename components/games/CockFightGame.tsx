"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Swords,
  Trophy,
  Zap,
  RotateCcw,
  ShieldAlert,
  Flame,
  Wallet,
  History,
  Users,
  Search,
  CheckCircle2,
  AlertCircle,
  Crown,
} from "lucide-react";
import confetti from "canvas-confetti";
import { sound } from "@/lib/soundFx";
import {
  RoosterCorner,
  simulateCockFightMatch,
  CockFightMatchResult,
} from "@/lib/serverCockFightEngine";
import { CockFightCanvas } from "./CockFightCanvas";

interface CockFightGameProps {
  playerBalance: number;
  onUpdateBalance: (newBalance: number) => void;
  onRecordRound?: (data: { bet: number; win: number; multiplier: number }) => void;
  liveRtp?: number;
}

type ArenaState = "IDLE" | "MATCHMAKING" | "FIGHTING" | "RESULT";

export const CockFightGame: React.FC<CockFightGameProps> = ({
  playerBalance,
  onUpdateBalance,
  onRecordRound,
  liveRtp = 95.0,
}) => {
  const [stakeAmount, setStakeAmount] = useState<number>(100);
  const [selectedCorner, setSelectedCorner] = useState<RoosterCorner>("RED");
  const [arenaState, setArenaState] = useState<ArenaState>("IDLE");
  const [activeMatch, setActiveMatch] = useState<CockFightMatchResult | null>(null);

  // Combat Animation States
  const [redHp, setRedHp] = useState(100);
  const [blueHp, setBlueHp] = useState(100);
  const [currentActionText, setCurrentActionText] = useState("");
  const [combatStage, setCombatStage] = useState(0); // 0=idle, 1=clashing, 2=ko
  const [duelHistory, setDuelHistory] = useState<Array<{ id: string; winner: RoosterCorner; won: boolean; amount: number }>>([
    { id: "CF_881", winner: "RED", won: true, amount: 190 },
    { id: "CF_880", winner: "BLUE", won: false, amount: 0 },
    { id: "CF_879", winner: "RED", won: true, amount: 190 },
  ]);

  const balanceRef = useRef(playerBalance);
  useEffect(() => {
    balanceRef.current = playerBalance;
  }, [playerBalance]);

  // Scaled Payout Multiplier (1.90x based on 5% House Rake)
  const potMultiplier = Number((((liveRtp || 95.0) / 100) * 2.0).toFixed(2)); // 1.90x
  const potentialWin = Number((stakeAmount * potMultiplier).toFixed(2));
  const totalPot = stakeAmount * 2;
  const houseRake = Number((totalPot * 0.05).toFixed(2));

  // 1. Start Matchmaking
  const handleStartMatchmaking = () => {
    if (arenaState !== "IDLE") return;
    if (balanceRef.current < stakeAmount) {
      alert("Insufficient Balance to enter 1v1 Battle Arena!");
      return;
    }

    // Deduct Stake
    balanceRef.current = Number((balanceRef.current - stakeAmount).toFixed(2));
    onUpdateBalance(balanceRef.current);
    sound.playChipBet();

    setArenaState("MATCHMAKING");
    setRedHp(100);
    setBlueHp(100);
    setCurrentActionText("🔍 Searching Royal Arena for 1v1 live challenger...");

    // Simulate quick matchmaking pairing (1.8s)
    setTimeout(() => {
      const match = simulateCockFightMatch(stakeAmount, selectedCorner);
      setActiveMatch(match);
      setArenaState("FIGHTING");
      setCurrentActionText(`⚔️ Challenger Found: ${match.opponentName}! Battle Commencing!`);
      sound.playCardDeal();

      // Start Combat Sequence
      executeCombatSequence(match);
    }, 1800);
  };

  // 2. Step-by-Step Combat Sequence Execution
  const executeCombatSequence = (match: CockFightMatchResult) => {
    let step = 0;
    const interval = setInterval(() => {
      if (step < match.logs.length) {
        const log = match.logs[step];
        setCombatStage(1);
        setRedHp(log.redHpAfter);
        setBlueHp(log.blueHpAfter);
        setCurrentActionText(log.description);
        sound.playSonicBoom();

        step++;
      } else {
        clearInterval(interval);
        // Battle Finished - Knockout Stage
        setCombatStage(2);
        setArenaState("RESULT");

        const playerWon = match.playerWon;
        if (playerWon) {
          balanceRef.current = Number((balanceRef.current + match.winnerPayout).toFixed(2));
          onUpdateBalance(balanceRef.current);
          sound.playWin();
          confetti({ particleCount: 90, spread: 80, origin: { y: 0.6 } });

          if (onRecordRound) {
            onRecordRound({ bet: stakeAmount, win: match.winnerPayout, multiplier: potMultiplier });
          }
        } else {
          sound.playLoss();
          if (onRecordRound) {
            onRecordRound({ bet: stakeAmount, win: 0, multiplier: 0 });
          }
        }

        setDuelHistory((prev) => [
          {
            id: match.matchId,
            winner: match.winner,
            won: playerWon,
            amount: playerWon ? match.winnerPayout : 0,
          },
          ...prev.slice(0, 9),
        ]);
      }
    }, 1400);
  };

  // 3. Reset for next battle
  const handleNewDuel = () => {
    setArenaState("IDLE");
    setActiveMatch(null);
    setRedHp(100);
    setBlueHp(100);
    setCurrentActionText("");
    setCombatStage(0);
  };

  return (
    <div className="w-full flex flex-col space-y-3">
      {/* Top Royal Arena Header & Duel History */}
      <div className="flex items-center justify-between overflow-x-auto pb-1 max-w-full gap-2">
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[11px] font-black font-mono text-amber-400 bg-amber-950/60 border border-amber-500/40 px-2.5 py-1 rounded-xl flex items-center gap-1">
            <Crown className="w-3.5 h-3.5 text-amber-400" /> ROYAL ARENA (PvP)
          </span>
          <span className="text-[10px] text-gray-400 font-mono hidden sm:inline">
            5% House Rake • 100% Risk-Free Pot
          </span>
        </div>

        {/* Duel History Badges */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[10px] font-bold text-gray-500 uppercase">Recent Duels:</span>
          {duelHistory.map((d, idx) => (
            <span
              key={idx}
              className={`text-[10px] font-mono font-black px-2 py-0.5 rounded-lg shrink-0 ${
                d.winner === "RED"
                  ? "bg-red-950/80 text-red-400 border border-red-500/40"
                  : "bg-blue-950/80 text-blue-400 border border-blue-500/40"
              }`}
            >
              {d.winner === "RED" ? "🔴 Garuda" : "🔵 Shamo"}
            </span>
          ))}
        </div>
      </div>

      {/* 60FPS Sand Pit Colosseum Stage */}
      <div className="w-full h-[300px] sm:h-[370px] md:h-[440px]">
        <CockFightCanvas
          isFighting={arenaState === "FIGHTING"}
          isGameOver={arenaState === "RESULT"}
          winner={activeMatch?.winner || null}
          redHp={redHp}
          blueHp={blueHp}
          currentActionText={currentActionText}
          combatStage={combatStage}
        />
      </div>

      {/* Arena Interactive Betting Console */}
      <div className="bg-[#120703] border border-amber-950/90 rounded-3xl p-4 sm:p-5 shadow-2xl space-y-4 backdrop-blur-md">
        {/* 1. Corner Selection: RED GARUDA vs BLUE SHAMO */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {/* RED CORNER - GARUDA */}
          <button
            onClick={() => setSelectedCorner("RED")}
            disabled={arenaState !== "IDLE"}
            className={`relative p-4 rounded-2xl border transition-all cursor-pointer flex flex-col items-center justify-center gap-1 group ${
              selectedCorner === "RED"
                ? "bg-gradient-to-b from-red-950/90 to-red-900/60 border-red-500 shadow-xl shadow-red-500/30 scale-[1.02]"
                : "bg-[#210707] border-red-950/80 hover:border-red-500/50"
            } ${arenaState !== "IDLE" ? "opacity-75 cursor-not-allowed" : "active:scale-98"}`}
          >
            <span className="text-xs font-black text-red-400 tracking-wider uppercase">🔴 RED CORNER (GARUDA)</span>
            <span className="text-xl sm:text-2xl font-black font-mono text-white">{potMultiplier}x</span>
            <span className="text-[10px] text-red-300/80 font-mono">Fierce Razor Talons</span>
            {selectedCorner === "RED" && (
              <div className="mt-1 px-2.5 py-0.5 rounded-full bg-red-500 text-black font-mono font-black text-[10px]">
                SELECTED
              </div>
            )}
          </button>

          {/* BLUE CORNER - SHAMO */}
          <button
            onClick={() => setSelectedCorner("BLUE")}
            disabled={arenaState !== "IDLE"}
            className={`relative p-4 rounded-2xl border transition-all cursor-pointer flex flex-col items-center justify-center gap-1 group ${
              selectedCorner === "BLUE"
                ? "bg-gradient-to-b from-blue-950/90 to-blue-900/60 border-blue-500 shadow-xl shadow-blue-500/30 scale-[1.02]"
                : "bg-[#071321] border-blue-950/80 hover:border-blue-500/50"
            } ${arenaState !== "IDLE" ? "opacity-75 cursor-not-allowed" : "active:scale-98"}`}
          >
            <span className="text-xs font-black text-blue-400 tracking-wider uppercase">🔵 BLUE CORNER (SHAMO)</span>
            <span className="text-xl sm:text-2xl font-black font-mono text-white">{potMultiplier}x</span>
            <span className="text-[10px] text-blue-300/80 font-mono">Agile Steel Beak</span>
            {selectedCorner === "BLUE" && (
              <div className="mt-1 px-2.5 py-0.5 rounded-full bg-blue-500 text-black font-mono font-black text-[10px]">
                SELECTED
              </div>
            )}
          </button>
        </div>

        {/* 2. Stake Selector & 1v1 Duel Trigger */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-amber-950/60">
          <div className="flex items-center gap-1.5 overflow-x-auto py-1">
            <span className="text-xs font-bold text-gray-400 mr-1 uppercase">Stake:</span>
            {[50, 100, 250, 500, 1000].map((val) => (
              <button
                key={val}
                disabled={arenaState !== "IDLE"}
                onClick={() => {
                  setStakeAmount(val);
                  sound.playChipBet();
                }}
                className={`px-3 py-1.5 rounded-xl font-mono font-black text-xs border transition-all cursor-pointer ${
                  stakeAmount === val
                    ? "bg-gradient-to-r from-amber-500 to-yellow-400 text-black border-yellow-200 shadow-md shadow-amber-500/30 scale-105"
                    : "bg-[#1f0b04] text-gray-300 border-amber-900/60 hover:border-amber-500/40"
                } ${arenaState !== "IDLE" ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                ₹{val}
              </button>
            ))}
          </div>

          {/* Action Trigger Button */}
          {arenaState === "IDLE" ? (
            <button
              onClick={handleStartMatchmaking}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-black font-black text-sm tracking-wider uppercase shadow-xl shadow-amber-500/25 transition-all cursor-pointer active:scale-98 flex items-center justify-center gap-2"
            >
              <Swords className="w-4 h-4" />
              <span>ENTER 1v1 ARENA (₹{stakeAmount})</span>
            </button>
          ) : arenaState === "MATCHMAKING" ? (
            <div className="px-6 py-3 rounded-2xl bg-amber-950/80 border border-amber-500/50 text-amber-300 font-bold text-xs flex items-center gap-2 animate-pulse">
              <Search className="w-4 h-4 animate-spin" />
              <span>FINDING 1v1 OPPONENT...</span>
            </div>
          ) : arenaState === "FIGHTING" ? (
            <div className="px-6 py-3 rounded-2xl bg-red-950/80 border border-red-500/50 text-red-300 font-bold text-xs flex items-center gap-2">
              <Flame className="w-4 h-4 animate-bounce text-orange-400" />
              <span>DUEL IN PROGRESS (POT: ₹{totalPot})</span>
            </div>
          ) : (
            <button
              onClick={handleNewDuel}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-black text-sm tracking-wider uppercase shadow-xl shadow-emerald-500/25 transition-all cursor-pointer active:scale-98 flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>PLAY NEXT 1v1 DUEL</span>
            </button>
          )}
        </div>

        {/* 3. Victory/Defeat Banner */}
        {arenaState === "RESULT" && activeMatch && (
          <div
            className={`p-3.5 rounded-2xl border font-bold text-xs flex items-center justify-center gap-2 shadow-xl animate-bounce ${
              activeMatch.playerWon
                ? "bg-emerald-950/90 border-emerald-500/60 text-emerald-300"
                : "bg-red-950/90 border-red-500/60 text-red-300"
            }`}
          >
            <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              {activeMatch.playerWon
                ? `VICTORY! Your Rooster won the 1v1 Duel! You claimed the ₹${activeMatch.winnerPayout} Pot!`
                : `DEFEAT! ${activeMatch.opponentName} claimed the 1v1 Pot.`}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

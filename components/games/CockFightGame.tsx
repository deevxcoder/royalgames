"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
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
  Radio,
  Clock,
  XCircle,
  Copy,
  ExternalLink,
} from "lucide-react";
import confetti from "canvas-confetti";
import { sound } from "@/lib/soundFx";
import {
  RoosterCorner,
  CockFightMatchResult,
} from "@/lib/serverCockFightEngine";
import { CockFightCanvas } from "./CockFightCanvas";

interface CockFightGameProps {
  playerBalance: number;
  onUpdateBalance: (newBalance: number) => void;
  onRecordRound?: (data: { bet: number; win: number; multiplier: number }) => void;
  liveRtp?: number;
}

type ArenaState = "IDLE" | "WAITING_FOR_OPPONENT" | "MATCHED" | "FIGHTING" | "RESULT";

interface OpenRoomInfo {
  roomId: string;
  stake: number;
  hostName: string;
  hostCorner: RoosterCorner;
  createdAt: number;
}

export const CockFightGame: React.FC<CockFightGameProps> = ({
  playerBalance,
  onUpdateBalance,
  onRecordRound,
  liveRtp = 95.0,
}) => {
  const [stakeAmount, setStakeAmount] = useState<number>(100);
  const [selectedCorner, setSelectedCorner] = useState<RoosterCorner>("RED");
  const [arenaState, setArenaState] = useState<ArenaState>("IDLE");
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
  const [waitingSeconds, setWaitingSeconds] = useState<number>(0);
  const [openTables, setOpenTables] = useState<OpenRoomInfo[]>([]);
  const [activeMatch, setActiveMatch] = useState<CockFightMatchResult | null>(null);
  const [opponentName, setOpponentName] = useState<string>("Waiting...");

  // Unique Player Identity per tab/browser
  const [myPlayerId] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("cf_player_id");
      if (stored) return stored;
      const gen = `player_${Math.random().toString(36).substring(2, 8)}`;
      sessionStorage.setItem("cf_player_id", gen);
      return gen;
    }
    return `player_${Math.random().toString(36).substring(2, 8)}`;
  });

  const [myPlayerName] = useState(() => `Gladiator_${myPlayerId.slice(-4)}`);

  // Combat Animation States
  const [redHp, setRedHp] = useState(100);
  const [blueHp, setBlueHp] = useState(100);
  const [currentActionText, setCurrentActionText] = useState("");
  const [combatStage, setCombatStage] = useState(0); // 0=idle, 1=clashing, 2=ko
  const [duelHistory, setDuelHistory] = useState<Array<{ id: string; winner: RoosterCorner; won: boolean; amount: number }>>([
    { id: "CF_902", winner: "RED", won: true, amount: 190 },
    { id: "CF_901", winner: "BLUE", won: false, amount: 0 },
    { id: "CF_900", winner: "RED", won: true, amount: 190 },
  ]);

  const balanceRef = useRef(playerBalance);
  useEffect(() => {
    balanceRef.current = playerBalance;
  }, [playerBalance]);

  // Scaled Payout Multiplier (1.90x based on 5% House Rake)
  const potMultiplier = Number((((liveRtp || 95.0) / 100) * 2.0).toFixed(2)); // 1.90x
  const totalPot = stakeAmount * 2;

  // 1. Fetch Open Waiting Tables from Server every 3 seconds
  const fetchOpenTables = useCallback(async () => {
    try {
      const res = await fetch("/api/arena/cockfight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "LIST_ROOMS" }),
      });
      const data = await res.json();
      if (data.success && data.rooms) {
        setOpenTables(data.rooms);
      }
    } catch (e) {
      // Ignore polling errors
    }
  }, []);

  useEffect(() => {
    fetchOpenTables();
    const interval = setInterval(fetchOpenTables, 3000);
    return () => clearInterval(interval);
  }, [fetchOpenTables]);

  // 2. Poll Room Status while Waiting for 2nd Player
  useEffect(() => {
    let pollInterval: NodeJS.Timeout;
    let timerInterval: NodeJS.Timeout;

    if (arenaState === "WAITING_FOR_OPPONENT" && currentRoomId) {
      // Stopwatch
      setWaitingSeconds(0);
      timerInterval = setInterval(() => {
        setWaitingSeconds((prev) => prev + 1);
      }, 1000);

      // Room polling loop every 1s
      pollInterval = setInterval(async () => {
        try {
          const res = await fetch("/api/arena/cockfight", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "POLL_ROOM", roomId: currentRoomId, playerId: myPlayerId }),
          });
          const data = await res.json();

          if (data.success && data.status === "MATCHED" && data.matchResult) {
            clearInterval(pollInterval);
            clearInterval(timerInterval);

            // Challenger has entered the match!
            const oppName = data.room.hostPlayerId === myPlayerId ? data.room.challengerName : data.room.hostName;
            setOpponentName(oppName || "Live Challenger");
            setActiveMatch(data.matchResult);
            setArenaState("MATCHED");
            setCurrentActionText(`⚔️ 2nd Player Joined: ${oppName}! Starting 1v1 Battle...`);
            sound.playCardDeal();

            setTimeout(() => {
              setArenaState("FIGHTING");
              executeCombatSequence(data.matchResult);
            }, 1200);
          }
        } catch (e) {
          // Poll retry
        }
      }, 1000);
    }

    return () => {
      clearInterval(pollInterval);
      clearInterval(timerInterval);
    };
  }, [arenaState, currentRoomId, myPlayerId]);

  // 3. Join / Create 1v1 Match Queue
  const handleEnterArena = async (targetStake?: number) => {
    if (arenaState !== "IDLE") return;
    const stakeToUse = targetStake || stakeAmount;

    if (balanceRef.current < stakeToUse) {
      alert("Insufficient Balance to enter 1v1 Battle Arena!");
      return;
    }

    // Deduct Stake Escrow
    balanceRef.current = Number((balanceRef.current - stakeToUse).toFixed(2));
    onUpdateBalance(balanceRef.current);
    sound.playChipBet();

    try {
      const res = await fetch("/api/arena/cockfight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "JOIN_QUEUE",
          playerId: myPlayerId,
          playerName: myPlayerName,
          stake: stakeToUse,
          corner: selectedCorner,
        }),
      });
      const data = await res.json();

      if (data.success) {
        if (data.status === "MATCHED") {
          // Instantly matched with an already waiting Player!
          setCurrentRoomId(data.room.roomId);
          const oppName = data.room.hostPlayerId === myPlayerId ? data.room.challengerName : data.room.hostName;
          setOpponentName(oppName || "Live Challenger");
          setActiveMatch(data.matchResult);
          setArenaState("MATCHED");
          setCurrentActionText(`⚔️ 1v1 Challenger Found: ${oppName}! Entering Sand Pit...`);
          sound.playCardDeal();

          setTimeout(() => {
            setArenaState("FIGHTING");
            executeCombatSequence(data.matchResult);
          }, 1400);
        } else if (data.status === "WAITING") {
          // Waiting for a 2nd player to join
          setCurrentRoomId(data.room.roomId);
          setArenaState("WAITING_FOR_OPPONENT");
          setRedHp(100);
          setBlueHp(100);
          setCurrentActionText("⏳ WAITING FOR 2ND PLAYER TO ENTER ARENA...");
        }
      } else {
        // Refund on error
        balanceRef.current = Number((balanceRef.current + stakeToUse).toFixed(2));
        onUpdateBalance(balanceRef.current);
        alert(data.error || "Failed to join queue");
        setArenaState("IDLE");
      }
    } catch (e: any) {
      balanceRef.current = Number((balanceRef.current + stakeToUse).toFixed(2));
      onUpdateBalance(balanceRef.current);
      alert("Network error connecting to Arena");
      setArenaState("IDLE");
    }
  };

  // 4. Cancel & Refund Waiting Queue
  const handleCancelQueue = async () => {
    if (arenaState !== "WAITING_FOR_OPPONENT" || !currentRoomId) return;

    try {
      await fetch("/api/arena/cockfight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "CANCEL_ROOM", roomId: currentRoomId, playerId: myPlayerId }),
      });
    } catch (e) {
      // Ignore
    }

    // Refund player
    balanceRef.current = Number((balanceRef.current + stakeAmount).toFixed(2));
    onUpdateBalance(balanceRef.current);

    setArenaState("IDLE");
    setCurrentRoomId(null);
    setCurrentActionText("");
    sound.playCoinFlip();
    fetchOpenTables();
  };

  // 5. Execute 60FPS Combat Rounds
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
        // Battle Finished
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

  // 6. Reset for next battle
  const handleNewDuel = () => {
    setArenaState("IDLE");
    setActiveMatch(null);
    setCurrentRoomId(null);
    setRedHp(100);
    setBlueHp(100);
    setCurrentActionText("");
    setCombatStage(0);
    fetchOpenTables();
  };

  return (
    <div className="w-full flex flex-col space-y-3">
      {/* Top Royal Arena Header & Duel History */}
      <div className="flex items-center justify-between overflow-x-auto pb-1 max-w-full gap-2">
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[11px] font-black font-mono text-amber-400 bg-amber-950/60 border border-amber-500/40 px-2.5 py-1 rounded-xl flex items-center gap-1">
            <Crown className="w-3.5 h-3.5 text-amber-400" /> ROYAL ARENA (PvP)
          </span>
          <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
            <Radio className="w-3 h-3 animate-pulse text-emerald-400" /> True 1v1 Player vs Player
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
        {/* ========================================================================= */}
        {/* WAITING STATE HUD (When 1st Player is waiting for 2nd Player to join)     */}
        {/* ========================================================================= */}
        {arenaState === "WAITING_FOR_OPPONENT" && (
          <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/50 flex flex-col sm:flex-row items-center justify-between gap-3 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 text-lg">
                ⏳
              </div>
              <div>
                <div className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-2">
                  <span>WAITING FOR CHALLENGER TO ENTER</span>
                  <span className="font-mono text-white bg-black/40 px-2 py-0.5 rounded-lg border border-amber-500/30">
                    {Math.floor(waitingSeconds / 60)}:{(waitingSeconds % 60).toString().padStart(2, "0")}
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 font-mono mt-0.5">
                  Match will begin as soon as another player wagers ₹{stakeAmount}!
                </p>
              </div>
            </div>

            <button
              onClick={handleCancelQueue}
              className="px-4 py-2 rounded-xl bg-red-950/80 hover:bg-red-900 border border-red-500/50 text-red-300 hover:text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>CANCEL & REFUND</span>
            </button>
          </div>
        )}

        {/* 1. Corner Selection: RED GARUDA vs BLUE SHAMO */}
        {arenaState === "IDLE" && (
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {/* RED CORNER - GARUDA */}
            <button
              onClick={() => setSelectedCorner("RED")}
              className={`relative p-4 rounded-2xl border transition-all cursor-pointer flex flex-col items-center justify-center gap-1 group ${
                selectedCorner === "RED"
                  ? "bg-gradient-to-b from-red-950/90 to-red-900/60 border-red-500 shadow-xl shadow-red-500/30 scale-[1.02]"
                  : "bg-[#210707] border-red-950/80 hover:border-red-500/50"
              }`}
            >
              <span className="text-xs font-black text-red-400 tracking-wider uppercase">🔴 RED CORNER (GARUDA)</span>
              <span className="text-xl sm:text-2xl font-black font-mono text-white">{potMultiplier}x</span>
              <span className="text-[10px] text-red-300/80 font-mono">Fierce Razor Talons</span>
              {selectedCorner === "RED" && (
                <div className="mt-1 px-2.5 py-0.5 rounded-full bg-red-500 text-black font-mono font-black text-[10px]">
                  YOUR CHAMPION
                </div>
              )}
            </button>

            {/* BLUE CORNER - SHAMO */}
            <button
              onClick={() => setSelectedCorner("BLUE")}
              className={`relative p-4 rounded-2xl border transition-all cursor-pointer flex flex-col items-center justify-center gap-1 group ${
                selectedCorner === "BLUE"
                  ? "bg-gradient-to-b from-blue-950/90 to-blue-900/60 border-blue-500 shadow-xl shadow-blue-500/30 scale-[1.02]"
                  : "bg-[#071321] border-blue-950/80 hover:border-blue-500/50"
              }`}
            >
              <span className="text-xs font-black text-blue-400 tracking-wider uppercase">🔵 BLUE CORNER (SHAMO)</span>
              <span className="text-xl sm:text-2xl font-black font-mono text-white">{potMultiplier}x</span>
              <span className="text-[10px] text-blue-300/80 font-mono">Agile Steel Beak</span>
              {selectedCorner === "BLUE" && (
                <div className="mt-1 px-2.5 py-0.5 rounded-full bg-blue-500 text-black font-mono font-black text-[10px]">
                  YOUR CHAMPION
                </div>
              )}
            </button>
          </div>
        )}

        {/* 2. Stake Selector & 1v1 Duel Trigger */}
        {arenaState === "IDLE" && (
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-amber-950/60">
            <div className="flex items-center gap-1.5 overflow-x-auto py-1">
              <span className="text-xs font-bold text-gray-400 mr-1 uppercase">Stake:</span>
              {[50, 100, 250, 500, 1000].map((val) => (
                <button
                  key={val}
                  onClick={() => {
                    setStakeAmount(val);
                    sound.playChipBet();
                  }}
                  className={`px-3 py-1.5 rounded-xl font-mono font-black text-xs border transition-all cursor-pointer ${
                    stakeAmount === val
                      ? "bg-gradient-to-r from-amber-500 to-yellow-400 text-black border-yellow-200 shadow-md shadow-amber-500/30 scale-105"
                      : "bg-[#1f0b04] text-gray-300 border-amber-900/60 hover:border-amber-500/40"
                  }`}
                >
                  ₹{val}
                </button>
              ))}
            </div>

            <button
              onClick={() => handleEnterArena()}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-black font-black text-sm tracking-wider uppercase shadow-xl shadow-amber-500/25 transition-all cursor-pointer active:scale-98 flex items-center justify-center gap-2"
            >
              <Swords className="w-4 h-4" />
              <span>FIND OPPONENT (₹{stakeAmount})</span>
            </button>
          </div>
        )}

        {/* 3. Victory/Defeat Banner */}
        {arenaState === "RESULT" && activeMatch && (
          <div className="space-y-3">
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
                  ? `VICTORY! Your Rooster defeated ${opponentName}! You claimed the ₹${activeMatch.winnerPayout} Pot!`
                  : `DEFEAT! ${opponentName} claimed the 1v1 Pot.`}
              </span>
            </div>

            <button
              onClick={handleNewDuel}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-black text-sm tracking-wider uppercase shadow-xl shadow-emerald-500/25 transition-all cursor-pointer active:scale-98 flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>PLAY NEXT 1v1 DUEL</span>
            </button>
          </div>
        )}

        {/* 4. Live Open Waiting Tables in Royal Arena (Click to Join Directly!) */}
        {arenaState === "IDLE" && openTables.length > 0 && (
          <div className="pt-3 border-t border-amber-950/60 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-gray-400 px-1">
              <span className="text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-amber-400" /> LIVE OPEN 1v1 TABLES ({openTables.length}):
              </span>
              <span className="text-[10px] text-gray-500 font-mono">1/2 Players Waiting</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {openTables.map((t) => (
                <div
                  key={t.roomId}
                  className="p-3 bg-[#080302] border border-amber-900/40 rounded-xl flex items-center justify-between gap-2 hover:border-amber-500/50 transition-all"
                >
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>{t.hostName}</span>
                      <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded ${t.hostCorner === "RED" ? "bg-red-950 text-red-300 border border-red-500/30" : "bg-blue-950 text-blue-300 border border-blue-500/30"}`}>
                        {t.hostCorner}
                      </span>
                    </div>
                    <div className="text-[10px] text-amber-400 font-mono font-bold">
                      Stake: ₹{t.stake} (Pot: ₹{t.stake * 2})
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setStakeAmount(t.stake);
                      handleEnterArena(t.stake);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-black text-xs transition-all cursor-pointer active:scale-95 shadow-md"
                  >
                    FIGHT 1v1
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

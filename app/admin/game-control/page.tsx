"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  Zap,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Skull,
  TrendingUp,
  Play,
  RotateCcw,
  Sparkles,
  Sliders,
  ExternalLink,
  Flame,
  Award,
} from "lucide-react";
import { STUDIO_GAMES } from "@/lib/gamesCatalog";

export default function AdminGameControlPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Custom inputs state
  const [customSkyRushMult, setCustomSkyRushMult] = useState("1.05");
  const [customSkyRushRounds, setCustomSkyRushRounds] = useState("1");

  const [customCricketMult, setCustomCricketMult] = useState("1.02");
  const [customCricketRounds, setCustomCricketRounds] = useState("1");

  const [abRounds, setAbRounds] = useState("1");

  const fetchLiveState = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/game-control");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLiveState();
    const interval = setInterval(fetchLiveState, 2000); // Poll live engine state every 2s
    return () => clearInterval(interval);
  }, [fetchLiveState]);

  const showToast = (type: "success" | "error", text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Set Crash Override
  const handleSetCrashOverride = async (
    gameUid: "royal_skyrush" | "royal_cricketblast",
    multiplier: number,
    rounds: number = 1,
    label?: string
  ) => {
    setActionLoading(`${gameUid}_${multiplier}`);
    try {
      const res = await fetch("/api/admin/game-control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SET_CRASH_OVERRIDE",
          gameUid,
          forcedMultiplier: multiplier,
          roundsRemaining: rounds,
          label,
        }),
      });
      const resJson = await res.json();
      if (res.ok && resJson.success) {
        showToast("success", `⚡ ${gameUid === "royal_skyrush" ? "Sky Rush" : "Cricket Blast"}: Next round crash forced to ${multiplier}x!`);
        fetchLiveState();
      } else {
        showToast("error", resJson.error || "Failed to set override");
      }
    } catch (err: any) {
      showToast("error", err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // Set Andar Bahar Override
  const handleSetABOverride = async (winner: "ANDAR" | "BAHAR", rounds: number = 1) => {
    setActionLoading(`ab_${winner}`);
    try {
      const res = await fetch("/api/admin/game-control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SET_AB_OVERRIDE",
          forcedWinner: winner,
          roundsRemaining: rounds,
          label: `Forced ${winner} Win`,
        }),
      });
      const resJson = await res.json();
      if (res.ok && resJson.success) {
        showToast("success", `⚡ Andar Bahar Royale: Next round winner FORCED to ${winner}!`);
        fetchLiveState();
      } else {
        showToast("error", resJson.error || "Failed to set override");
      }
    } catch (err: any) {
      showToast("error", err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // Clear Single Game
  const handleClearGame = async (gameUid: string) => {
    setActionLoading(`clear_${gameUid}`);
    try {
      const res = await fetch("/api/admin/game-control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "CLEAR_GAME", gameUid }),
      });
      const resJson = await res.json();
      if (res.ok && resJson.success) {
        showToast("success", `${gameUid} reverted to clean Auto RNG mode.`);
        fetchLiveState();
      }
    } catch (err: any) {
      showToast("error", err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // Reset All
  const handleResetAll = async () => {
    if (!confirm("Are you sure you want to reset ALL 3 games to Auto Provably Fair RNG? Any active manual overrides will be immediately cancelled.")) return;
    setActionLoading("reset_all");
    try {
      const res = await fetch("/api/admin/game-control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "RESET_ALL" }),
      });
      const resJson = await res.json();
      if (res.ok && resJson.success) {
        showToast("success", "All 3 games successfully restored to clean Auto RNG mode.");
        fetchLiveState();
      }
    } catch (err: any) {
      showToast("error", err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const skyRushOverride = data?.overrides?.royal_skyrush;
  const cricketOverride = data?.overrides?.royal_cricketblast;
  const abOverride = data?.overrides?.royal_andarbahar;

  const skyRushLive = data?.liveStatus?.royal_skyrush;
  const cricketLive = data?.liveStatus?.royal_cricketblast;
  const abLive = data?.liveStatus?.royal_andarbahar;

  const hasAnyForced =
    skyRushOverride?.mode === "FORCED" ||
    cricketOverride?.mode === "FORCED" ||
    abOverride?.mode === "FORCED";

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gradient-to-r from-rose-950/40 via-[#101524] to-rose-950/30 border border-rose-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 font-bold text-xs">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            <span>Studio Owner God Mode • Real-Time Engine Overrides</span>
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight">
            Authoritative Game Outcome Control
          </h1>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            Direct manual control over live rounds. Override PRNG mathematics to force instant crash busts (House Win), schedule mega multipliers, or dictate winning card sides in real time.
          </p>
        </div>

        {/* Master Action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleResetAll}
            disabled={actionLoading === "reset_all"}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 font-bold text-xs transition-all cursor-pointer shadow-lg"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${actionLoading === "reset_all" ? "animate-spin" : ""}`} />
            <span>Reset All to Clean RNG</span>
          </button>
        </div>
      </div>

      {/* Global Status Warning */}
      {hasAnyForced ? (
        <div className="bg-rose-500/15 border border-rose-500/50 rounded-2xl p-4 flex items-center justify-between gap-3 text-xs text-rose-300 shadow-xl animate-pulse">
          <div className="flex items-center gap-3">
            <Flame className="w-5 h-5 text-rose-400 shrink-0" />
            <div>
              <span className="font-bold block">⚠️ Manual God Mode Override Is Currently Active</span>
              <span className="text-[11px] text-rose-300/80">
                One or more games are running forced outcomes. Engine will execute your exact multipliers / cards on next rounds.
              </span>
            </div>
          </div>
          <button
            onClick={handleResetAll}
            className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-black text-[11px] rounded-lg shadow-md cursor-pointer shrink-0"
          >
            Clear All
          </button>
        </div>
      ) : (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-3.5 flex items-center justify-between text-xs text-emerald-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>All 3 games are operating on standard Provably Fair Auto RNG with active RTP configurations.</span>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 font-bold hidden sm:inline">RNG ENGINE SYNCHRONIZED</span>
        </div>
      )}

      {/* Toast */}
      {toastMessage && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2.5 border shadow-xl ${
            toastMessage.type === "success"
              ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
              : "bg-rose-500/15 border-rose-500/40 text-rose-300"
          }`}
        >
          {toastMessage.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* GAME 1: SKY RUSH (Crash 1000x) */}
      <div className="bg-[#0b0f19] border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5">
        {/* Game Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center p-1.5 shrink-0 shadow-md">
              <img src="/games/royal_skyrush.svg" alt="Sky Rush" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-white">Sky Rush Royale</h2>
                <span className="text-[9px] px-2 py-0.2 rounded font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Crash Multiplier (1000x)
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                Live State: <span className="text-amber-400 font-bold">{skyRushLive?.phase || "SYNCING"}</span> • Current: {skyRushLive?.currentMultiplier}x • Crash: {skyRushLive?.crashMultiplier}x
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {skyRushOverride?.mode === "FORCED" ? (
              <span className="px-3 py-1 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-black flex items-center gap-1.5 font-mono">
                <Flame className="w-3.5 h-3.5 text-rose-400" />
                <span>FORCED AT {skyRushOverride.forcedMultiplier}x ({skyRushOverride.roundsRemaining} rds)</span>
              </span>
            ) : (
              <span className="px-3 py-1 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-bold font-mono">
                AUTO RNG (96.5% RTP)
              </span>
            )}

            <Link
              href="/play/sess_demo?game=royal_skyrush"
              target="_blank"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 transition-colors"
              title="Launch Live Game View"
            >
              <ExternalLink className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* 1-Click Preset Action Chips */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
            ⚡ Quick Instant Override Triggers (Next Round)
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {/* Instant Bust (1.05x) */}
            <button
              type="button"
              onClick={() => handleSetCrashOverride("royal_skyrush", 1.05, 1, "Instant Bust 1.05x")}
              className="p-3 bg-gradient-to-r from-rose-950/60 to-rose-900/60 hover:from-rose-900/80 hover:to-rose-800/80 border border-rose-500/40 hover:border-rose-400 rounded-2xl text-left transition-all group cursor-pointer shadow-lg"
            >
              <div className="flex items-center justify-between text-rose-400 mb-1">
                <Skull className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-mono font-bold uppercase bg-rose-500/20 px-1.5 py-0.2 rounded">
                  House Win
                </span>
              </div>
              <div className="text-base font-black text-white font-mono">1.05x</div>
              <div className="text-[10px] text-rose-300/80 leading-tight mt-0.5">Instant Plane Crash (Bust)</div>
            </button>

            {/* Quick 1.25x */}
            <button
              type="button"
              onClick={() => handleSetCrashOverride("royal_skyrush", 1.25, 1, "Low Crash 1.25x")}
              className="p-3 bg-slate-900/80 hover:bg-slate-800/80 border border-slate-700 hover:border-amber-500/40 rounded-2xl text-left transition-all cursor-pointer"
            >
              <div className="text-[10px] font-mono font-bold text-slate-400 mb-1">Tight Margin</div>
              <div className="text-base font-black text-amber-300 font-mono">1.25x</div>
              <div className="text-[10px] text-slate-500 leading-tight mt-0.5">Low Multiplier Fly</div>
            </button>

            {/* Safe 2.50x */}
            <button
              type="button"
              onClick={() => handleSetCrashOverride("royal_skyrush", 2.50, 1, "Safe 2.50x")}
              className="p-3 bg-slate-900/80 hover:bg-slate-800/80 border border-slate-700 hover:border-amber-500/40 rounded-2xl text-left transition-all cursor-pointer"
            >
              <div className="text-[10px] font-mono font-bold text-slate-400 mb-1">Standard</div>
              <div className="text-base font-black text-emerald-400 font-mono">2.50x</div>
              <div className="text-[10px] text-slate-500 leading-tight mt-0.5">Moderate Ascent</div>
            </button>

            {/* Big Win 10.00x */}
            <button
              type="button"
              onClick={() => handleSetCrashOverride("royal_skyrush", 10.00, 1, "Big Win 10.00x")}
              className="p-3 bg-slate-900/80 hover:bg-slate-800/80 border border-slate-700 hover:border-purple-500/40 rounded-2xl text-left transition-all cursor-pointer"
            >
              <div className="text-[10px] font-mono font-bold text-purple-400 mb-1">High Volatility</div>
              <div className="text-base font-black text-purple-300 font-mono">10.00x</div>
              <div className="text-[10px] text-slate-500 leading-tight mt-0.5">Exciting Player Win</div>
            </button>

            {/* Mega 50.00x */}
            <button
              type="button"
              onClick={() => handleSetCrashOverride("royal_skyrush", 50.00, 1, "Mega Jackpot 50.00x")}
              className="p-3 bg-gradient-to-r from-amber-500/10 to-yellow-500/10 hover:from-amber-500/20 border border-amber-500/40 rounded-2xl text-left transition-all cursor-pointer"
            >
              <div className="text-[10px] font-mono font-bold text-amber-400 mb-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Jackpot
              </div>
              <div className="text-base font-black text-amber-300 font-mono">50.00x</div>
              <div className="text-[10px] text-slate-500 leading-tight mt-0.5">Moonshot Demo Flight</div>
            </button>
          </div>
        </div>

        {/* Custom Exact Multiplier & Duration */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 bg-[#07090e] p-4 rounded-2xl border border-slate-800 text-xs">
          <div className="flex items-center gap-3 flex-wrap">
            <div>
              <label className="text-slate-400 font-bold block mb-1 uppercase tracking-wider text-[10px]">
                Target Multiplier (x)
              </label>
              <input
                type="number"
                step="0.01"
                min="1.01"
                max="1000"
                value={customSkyRushMult}
                onChange={(e) => setCustomSkyRushMult(e.target.value)}
                className="w-28 bg-[#0b0f19] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="text-slate-400 font-bold block mb-1 uppercase tracking-wider text-[10px]">
                Rounds Duration
              </label>
              <select
                value={customSkyRushRounds}
                onChange={(e) => setCustomSkyRushRounds(e.target.value)}
                className="bg-[#0b0f19] border border-slate-700 rounded-xl px-3 py-2 text-white font-semibold focus:outline-none focus:border-amber-500"
              >
                <option value="1">Next 1 Round Only</option>
                <option value="3">Next 3 Consecutive Rounds</option>
                <option value="5">Next 5 Consecutive Rounds</option>
                <option value="999">Permanent Until Cleared</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => handleSetCrashOverride("royal_skyrush", Number(customSkyRushMult), Number(customSkyRushRounds))}
              className="px-4 py-2 mt-auto bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs transition-all shadow-md shadow-amber-500/20 cursor-pointer"
            >
              Apply Exact Multiplier ({customSkyRushMult}x)
            </button>
          </div>

          {skyRushOverride?.mode === "FORCED" && (
            <button
              type="button"
              onClick={() => handleClearGame("royal_skyrush")}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs cursor-pointer"
            >
              Revert Sky Rush to Auto RNG
            </button>
          )}
        </div>
      </div>

      {/* GAME 2: CRICKET BLAST (Sports Crash 500x) */}
      <div className="bg-[#0b0f19] border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5">
        {/* Game Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center p-1.5 shrink-0 shadow-md">
              <img src="/games/royal_cricketblast.svg" alt="Cricket Blast" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-white">Cricket Blast</h2>
                <span className="text-[9px] px-2 py-0.2 rounded font-mono font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  Sports Crash (500x)
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                Live State: <span className="text-sky-400 font-bold">{cricketLive?.phase || "SYNCING"}</span> • Current: {cricketLive?.currentMultiplier}x • Crash: {cricketLive?.crashMultiplier}x
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {cricketOverride?.mode === "FORCED" ? (
              <span className="px-3 py-1 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-black flex items-center gap-1.5 font-mono">
                <Flame className="w-3.5 h-3.5 text-rose-400" />
                <span>FORCED AT {cricketOverride.forcedMultiplier}x ({cricketOverride.roundsRemaining} rds)</span>
              </span>
            ) : (
              <span className="px-3 py-1 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-bold font-mono">
                AUTO RNG (97.6% RTP)
              </span>
            )}

            <Link
              href="/play/sess_demo?game=royal_cricketblast"
              target="_blank"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-400 transition-colors"
              title="Launch Live Game View"
            >
              <ExternalLink className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* 1-Click Preset Action Chips */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
            ⚡ Quick Instant Override Triggers (Next Round)
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {/* Instant Out (1.02x) */}
            <button
              type="button"
              onClick={() => handleSetCrashOverride("royal_cricketblast", 1.02, 1, "Golden Duck 1.02x")}
              className="p-3 bg-gradient-to-r from-rose-950/60 to-rose-900/60 hover:from-rose-900/80 hover:to-rose-800/80 border border-rose-500/40 hover:border-rose-400 rounded-2xl text-left transition-all group cursor-pointer shadow-lg"
            >
              <div className="flex items-center justify-between text-rose-400 mb-1">
                <Skull className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-mono font-bold uppercase bg-rose-500/20 px-1.5 py-0.2 rounded">
                  Golden Duck
                </span>
              </div>
              <div className="text-base font-black text-white font-mono">1.02x</div>
              <div className="text-[10px] text-rose-300/80 leading-tight mt-0.5">Clean Bowled Next Ball</div>
            </button>

            {/* Single 1.50x */}
            <button
              type="button"
              onClick={() => handleSetCrashOverride("royal_cricketblast", 1.50, 1, "Quick Single 1.50x")}
              className="p-3 bg-slate-900/80 hover:bg-slate-800/80 border border-slate-700 hover:border-sky-500/40 rounded-2xl text-left transition-all cursor-pointer"
            >
              <div className="text-[10px] font-mono font-bold text-slate-400 mb-1">Quick Run</div>
              <div className="text-base font-black text-sky-300 font-mono">1.50x</div>
              <div className="text-[10px] text-slate-500 leading-tight mt-0.5">Catch Out at Deep Midwicket</div>
            </button>

            {/* Four 4.00x */}
            <button
              type="button"
              onClick={() => handleSetCrashOverride("royal_cricketblast", 4.00, 1, "Boundary Four 4.00x")}
              className="p-3 bg-slate-900/80 hover:bg-slate-800/80 border border-slate-700 hover:border-emerald-500/40 rounded-2xl text-left transition-all cursor-pointer"
            >
              <div className="text-[10px] font-mono font-bold text-emerald-400 mb-1">Boundary</div>
              <div className="text-base font-black text-emerald-300 font-mono">4.00x</div>
              <div className="text-[10px] text-slate-500 leading-tight mt-0.5">Classic Cover Drive</div>
            </button>

            {/* Sixer 6.00x */}
            <button
              type="button"
              onClick={() => handleSetCrashOverride("royal_cricketblast", 6.00, 1, "Maximum Six 6.00x")}
              className="p-3 bg-slate-900/80 hover:bg-slate-800/80 border border-slate-700 hover:border-purple-500/40 rounded-2xl text-left transition-all cursor-pointer"
            >
              <div className="text-[10px] font-mono font-bold text-purple-400 mb-1">Maximum 6</div>
              <div className="text-base font-black text-purple-300 font-mono">6.00x</div>
              <div className="text-[10px] text-slate-500 leading-tight mt-0.5">Over Long-On Boundary</div>
            </button>

            {/* Century 25.00x */}
            <button
              type="button"
              onClick={() => handleSetCrashOverride("royal_cricketblast", 25.00, 1, "Century Knock 25.00x")}
              className="p-3 bg-gradient-to-r from-amber-500/10 to-yellow-500/10 hover:from-amber-500/20 border border-amber-500/40 rounded-2xl text-left transition-all cursor-pointer"
            >
              <div className="text-[10px] font-mono font-bold text-amber-400 mb-1 flex items-center gap-1">
                <Award className="w-3 h-3" /> Century
              </div>
              <div className="text-base font-black text-amber-300 font-mono">25.00x</div>
              <div className="text-[10px] text-slate-500 leading-tight mt-0.5">Massive Stadium Shot</div>
            </button>
          </div>
        </div>

        {/* Custom Exact Multiplier & Duration */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 bg-[#07090e] p-4 rounded-2xl border border-slate-800 text-xs">
          <div className="flex items-center gap-3 flex-wrap">
            <div>
              <label className="text-slate-400 font-bold block mb-1 uppercase tracking-wider text-[10px]">
                Target Multiplier (x)
              </label>
              <input
                type="number"
                step="0.01"
                min="1.01"
                max="500"
                value={customCricketMult}
                onChange={(e) => setCustomCricketMult(e.target.value)}
                className="w-28 bg-[#0b0f19] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="text-slate-400 font-bold block mb-1 uppercase tracking-wider text-[10px]">
                Rounds Duration
              </label>
              <select
                value={customCricketRounds}
                onChange={(e) => setCustomCricketRounds(e.target.value)}
                className="bg-[#0b0f19] border border-slate-700 rounded-xl px-3 py-2 text-white font-semibold focus:outline-none focus:border-sky-500"
              >
                <option value="1">Next 1 Round Only</option>
                <option value="3">Next 3 Consecutive Rounds</option>
                <option value="5">Next 5 Consecutive Rounds</option>
                <option value="999">Permanent Until Cleared</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => handleSetCrashOverride("royal_cricketblast", Number(customCricketMult), Number(customCricketRounds))}
              className="px-4 py-2 mt-auto bg-sky-500 hover:bg-sky-400 text-slate-950 font-black rounded-xl text-xs transition-all shadow-md shadow-sky-500/20 cursor-pointer"
            >
              Apply Exact Multiplier ({customCricketMult}x)
            </button>
          </div>

          {cricketOverride?.mode === "FORCED" && (
            <button
              type="button"
              onClick={() => handleClearGame("royal_cricketblast")}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs cursor-pointer"
            >
              Revert Cricket Blast to Auto RNG
            </button>
          )}
        </div>
      </div>

      {/* GAME 3: ANDAR BAHAR ROYALE (Card Table 1.90x) */}
      <div className="bg-[#0b0f19] border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5">
        {/* Game Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center p-1.5 shrink-0 shadow-md">
              <img src="/games/royal_andarbahar.svg" alt="Andar Bahar" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-white">Andar Bahar Royale</h2>
                <span className="text-[9px] px-2 py-0.2 rounded font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Live Card Table (1.80x / 1.90x)
                </span>
                <span className="text-[9px] px-2 py-0.2 rounded font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 animate-pulse">
                  ⚡ Live Overridable Until Result
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                Live Phase: <span className="text-purple-400 font-bold uppercase">{abLive?.phase || "SYNCING"}</span>
                {abLive?.phase === "BETTING" && ` (${abLive?.countdownLeft || 0}s remaining)`} • Joker: <span className="text-amber-300 font-bold">{abLive?.jokerCard || "—"}</span> • Scheduled Winner: <span className="font-bold text-emerald-400">{abLive?.predictedWinner || abLive?.winningSide || "CALCULATING"}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {abOverride?.mode === "FORCED" ? (
              <span className="px-3 py-1 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-black flex items-center gap-1.5 font-mono">
                <Flame className="w-3.5 h-3.5 text-rose-400" />
                <span>FORCED WINNER: {abOverride.forcedWinner} ({abOverride.roundsRemaining} rds)</span>
              </span>
            ) : (
              <span className="px-3 py-1 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-bold font-mono">
                AUTO RNG (96.0% RTP)
              </span>
            )}

            <Link
              href="/play/sess_demo?game=royal_andarbahar"
              target="_blank"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-purple-400 transition-colors"
              title="Launch Live Game View"
            >
              <ExternalLink className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* 1. Real User Live Betting Pool & Liability Comparison Card */}
        <div className="bg-[#070a12] border border-slate-800/90 rounded-2xl p-4 sm:p-5 space-y-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              👤 Active Round Real User Bets & Net Liability
            </span>
            {abLive?.bestSideForCasino ? (
              <span className="text-[10px] font-mono font-black px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                ⭐ Lowest Liability: Force {abLive.bestSideForCasino}
              </span>
            ) : (
              <span className="text-[10px] font-mono text-slate-400">
                Equal / No Real Bets Yet
              </span>
            )}
          </div>

          {/* Real Bets Percentage Distribution Bar */}
          {(() => {
            const realTotal = (abLive?.realAndar || 0) + (abLive?.realBahar || 0);
            if (realTotal === 0) {
              return (
                <div className="p-3 bg-slate-900/50 border border-slate-800 rounded-xl text-center">
                  <span className="text-xs font-mono text-slate-400">
                    🟢 No real player bets placed yet in this round (₹0 on ANDAR • ₹0 on BAHAR)
                  </span>
                </div>
              );
            }
            const andarPct = Math.round(((abLive?.realAndar || 0) / realTotal) * 100);
            const baharPct = 100 - andarPct;
            return (
              <div className="space-y-1">
                <div className="w-full h-3 rounded-full bg-slate-900 overflow-hidden flex border border-slate-800">
                  <div style={{ width: `${andarPct}%` }} className="h-full bg-gradient-to-r from-sky-500 to-sky-400 transition-all duration-300" />
                  <div style={{ width: `${baharPct}%` }} className="h-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-300" />
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono font-bold">
                  <span className="text-sky-400">ANDAR: {andarPct}% (₹{(abLive?.realAndar || 0).toLocaleString()} by {abLive?.realAndarCount || 0} users)</span>
                  <span className="text-amber-400">BAHAR: {baharPct}% (₹{(abLive?.realBahar || 0).toLocaleString()} by {abLive?.realBaharCount || 0} users)</span>
                </div>
              </div>
            );
          })()}

          {/* Dual Real User Pool Cards with Net GGR Projections */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* ANDAR REAL STATS */}
            <div className="p-3.5 rounded-xl bg-sky-950/30 border border-sky-500/30 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-sky-400 uppercase">ANDAR (REAL USERS)</span>
                <span className="text-[10px] font-mono text-slate-400">{abLive?.realAndarCount || 0} Real Bets</span>
              </div>
              <div className="text-2xl font-mono font-black text-white">
                ₹{(abLive?.realAndar || 0).toLocaleString()}
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono pt-1 border-t border-sky-900/40">
                <span className="text-slate-400">If ANDAR Wins (1.80x):</span>
                <span className={`font-bold ${(abLive?.profitIfAndarWins || 0) >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  Casino Profit: {(abLive?.profitIfAndarWins || 0) >= 0 ? "+" : ""}₹{(abLive?.profitIfAndarWins || 0).toLocaleString()}
                </span>
              </div>
            </div>

            {/* BAHAR REAL STATS */}
            <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/30 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-amber-400 uppercase">BAHAR (REAL USERS)</span>
                <span className="text-[10px] font-mono text-slate-400">{abLive?.realBaharCount || 0} Real Bets</span>
              </div>
              <div className="text-2xl font-mono font-black text-white">
                ₹{(abLive?.realBahar || 0).toLocaleString()}
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono pt-1 border-t border-amber-900/40">
                <span className="text-slate-400">If BAHAR Wins (1.90x):</span>
                <span className={`font-bold ${(abLive?.profitIfBaharWins || 0) >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  Casino Profit: {(abLive?.profitIfBaharWins || 0) >= 0 ? "+" : ""}₹{(abLive?.profitIfBaharWins || 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Recent Real Bets Ticker */}
          {abLive?.recentBets && abLive.recentBets.length > 0 && (
            <div className="pt-2 border-t border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                ⚡ Active Round Real Player Bets Log:
              </span>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                {abLive.recentBets.map((b: any) => (
                  <span
                    key={b.id}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold border ${
                      b.side === "ANDAR"
                        ? "bg-sky-950/70 border-sky-500/40 text-sky-300"
                        : "bg-amber-950/70 border-amber-500/40 text-amber-300"
                    }`}
                  >
                    {b.username}: ₹{b.amount.toLocaleString()} on {b.side}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 2. Large Force Winner Decision Panels (Live Override) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              ⚡ Instant God Mode Outcome Decision (Active Round & Future)
            </label>
            <span className="text-[10px] text-purple-400 font-mono">
              Overriding now will instantly force the outcome before the result card is revealed!
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* FORCE ANDAR */}
            <button
              type="button"
              onClick={() => handleSetABOverride("ANDAR", Number(abRounds))}
              className={`p-5 rounded-2xl border text-left transition-all group cursor-pointer shadow-xl ${
                abOverride?.forcedWinner === "ANDAR"
                  ? "bg-gradient-to-r from-sky-950/80 to-sky-900/80 border-sky-400 ring-2 ring-sky-500/40"
                  : "bg-slate-900/80 hover:bg-slate-800/80 border-slate-700 hover:border-sky-500/40"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded bg-sky-500/20 text-sky-400 border border-sky-500/30">
                  Left Side (Odd Deals: 1st, 3rd, 5th...)
                </span>
                <span className="text-xs font-mono font-bold text-slate-400">PAYS 1.80x</span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                <span>⚡ FORCE ANDAR WIN</span>
                {abOverride?.forcedWinner === "ANDAR" && (
                  <CheckCircle2 className="w-5 h-5 text-sky-400" />
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Engine will guarantee the matching Joker rank card deals onto ANDAR.
              </p>
            </button>

            {/* FORCE BAHAR */}
            <button
              type="button"
              onClick={() => handleSetABOverride("BAHAR", Number(abRounds))}
              className={`p-5 rounded-2xl border text-left transition-all group cursor-pointer shadow-xl ${
                abOverride?.forcedWinner === "BAHAR"
                  ? "bg-gradient-to-r from-amber-950/80 to-yellow-900/80 border-amber-400 ring-2 ring-amber-500/40"
                  : "bg-slate-900/80 hover:bg-slate-800/80 border-slate-700 hover:border-amber-500/40"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Right Side (Even Deals: 2nd, 4th, 6th...)
                </span>
                <span className="text-xs font-mono font-bold text-slate-400">PAYS 1.90x</span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                <span>⚡ FORCE BAHAR WIN</span>
                {abOverride?.forcedWinner === "BAHAR" && (
                  <CheckCircle2 className="w-5 h-5 text-amber-400" />
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Engine will guarantee the matching Joker rank card deals onto BAHAR.
              </p>
            </button>
          </div>
        </div>

        {/* 3. Rounds Duration & Clear Control */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#07090e] p-4 rounded-2xl border border-slate-800 text-xs">
          <div className="flex items-center gap-3">
            <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">
              Active Duration:
            </span>
            <select
              value={abRounds}
              onChange={(e) => setAbRounds(e.target.value)}
              className="bg-[#0b0f19] border border-slate-700 rounded-xl px-3 py-1.5 text-white font-semibold focus:outline-none focus:border-purple-500 text-xs"
            >
              <option value="1">Next 1 Round Only</option>
              <option value="3">Next 3 Consecutive Rounds</option>
              <option value="5">Next 5 Consecutive Rounds</option>
              <option value="999">Permanent Until Cleared</option>
            </select>
          </div>

          {abOverride?.mode === "FORCED" && (
            <button
              type="button"
              onClick={() => handleClearGame("royal_andarbahar")}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs cursor-pointer"
            >
              Revert Andar Bahar to Auto RNG
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

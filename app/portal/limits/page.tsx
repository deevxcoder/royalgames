"use client";

import React, { useEffect, useState } from "react";
import { PortalNavbar } from "../components/PortalNavbar";
import { PortalSidebar } from "../components/PortalSidebar";
import {
  ShieldCheck,
  Sliders,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  HelpCircle,
  Coins,
  DollarSign,
  TrendingUp,
  Zap,
} from "lucide-react";

interface GameLimitItem {
  gameUid: string;
  name: string;
  category: string;
  minBet: number;
  maxBet: number;
  maxWinCap: number;
  maxRoundLiability: number;
}

export default function OperatorLimitsPage() {
  const [operator, setOperator] = useState<any>(null);
  const [limits, setLimits] = useState<Record<string, GameLimitItem>>({});
  const [loading, setLoading] = useState(true);
  const [savingGame, setSavingGame] = useState<string | null>(null);
  const [savingAll, setSavingAll] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);

  const fetchLimitsData = async () => {
    try {
      const [opRes, limRes] = await Promise.all([
        fetch("/api/operator/me"),
        fetch("/api/operator/limits"),
      ]);
      if (opRes.ok) {
        const opData = await opRes.json();
        if (opData?.operator) setOperator(opData.operator);
      }
      if (limRes.ok) {
        const limData = await limRes.json();
        if (limData?.success && limData?.limits) {
          setLimits(limData.limits);
        }
      }
    } catch (e) {
      console.error("Error loading limits:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLimitsData();
  }, []);

  const handleInputChange = (
    gameUid: string,
    field: "minBet" | "maxBet" | "maxWinCap" | "maxRoundLiability",
    value: number
  ) => {
    setLimits((prev) => {
      const current = prev[gameUid];
      if (!current) return prev;
      return {
        ...prev,
        [gameUid]: {
          ...current,
          [field]: Math.max(0, value),
        },
      };
    });
  };

  const handleSaveSingleGame = async (gameUid: string) => {
    const item = limits[gameUid];
    if (!item) return;
    setSavingGame(gameUid);
    setSuccessToast(null);
    setErrorToast(null);

    try {
      const res = await fetch("/api/operator/limits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          limits: {
            [gameUid]: item,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to save limits");
      }

      setSuccessToast(`Limits for ${item.name} saved and active immediately!`);
      setTimeout(() => setSuccessToast(null), 3500);
    } catch (err: any) {
      setErrorToast(err.message || "Failed to save game limits");
    } finally {
      setSavingGame(null);
    }
  };

  const handleSaveAll = async () => {
    setSavingAll(true);
    setSuccessToast(null);
    setErrorToast(null);

    try {
      const res = await fetch("/api/operator/limits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ limits }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to save all limits");
      }

      setSuccessToast("All game limits and risk parameters saved successfully!");
      setTimeout(() => setSuccessToast(null), 3500);
    } catch (err: any) {
      setErrorToast(err.message || "Failed to save limits");
    } finally {
      setSavingAll(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-white flex flex-col font-sans">
      <PortalNavbar operator={operator} onRefresh={fetchLimitsData} />

      <div className="flex-1 flex">
        <PortalSidebar operator={operator} />

        <main className="flex-1 p-4 sm:p-8 space-y-6 overflow-y-auto max-w-6xl mx-auto">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-[#0c101c] via-[#0f1526] to-[#0c101c] border border-amber-500/30 rounded-3xl p-6 shadow-xl">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 font-bold text-xs mb-2">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>Zero-Code Operator Protection Engine</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
                <Sliders className="w-6 h-6 text-amber-400" />
                <span>Betting & Risk Limits Configuration</span>
              </h1>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                Set custom Min/Max bets, single win payout caps, and maximum round liabilities for your players.
                The Studio engine automatically clamps bets and limits payouts on your live casino.
              </p>
            </div>

            <button
              onClick={handleSaveAll}
              disabled={savingAll || loading}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 transition-all active:scale-95 shrink-0 cursor-pointer"
            >
              {savingAll ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Saving All Limits...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                  <span>Save All Table Limits</span>
                </>
              )}
            </button>
          </div>

          {/* Toast Messages */}
          {successToast && (
            <div className="p-4 bg-emerald-950/60 border border-emerald-500/60 rounded-2xl text-emerald-200 font-bold text-xs flex items-center gap-2.5 shadow-lg animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successToast}</span>
            </div>
          )}

          {errorToast && (
            <div className="p-4 bg-rose-950/60 border border-rose-500/60 rounded-2xl text-rose-200 font-bold text-xs flex items-center gap-2.5 shadow-lg animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorToast}</span>
            </div>
          )}

          {/* Loading Skeleton */}
          {loading ? (
            <div className="grid grid-cols-1 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-64 bg-slate-900/40 rounded-3xl animate-pulse border border-slate-800" />
              ))}
            </div>
          ) : (
            /* Games Limit Cards */
            <div className="space-y-6">
              {Object.values(limits).map((game) => (
                <div
                  key={game.gameUid}
                  className="bg-[#0b0f19] border border-slate-800/90 hover:border-amber-500/40 rounded-3xl p-6 shadow-xl space-y-6 transition-all"
                >
                  {/* Card Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center p-1.5 shrink-0">
                        <img
                          src={`/games/${game.gameUid}.svg`}
                          alt={game.name}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = `http://localhost:3000/games/${game.gameUid}.svg`;
                          }}
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base sm:text-lg font-black text-white">{game.name}</h3>
                          <span className="text-[10px] font-mono font-bold bg-slate-800 text-amber-300 border border-slate-700 px-2.5 py-0.5 rounded-full">
                            {game.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                          UID: <code className="text-slate-300">{game.gameUid}</code>
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleSaveSingleGame(game.gameUid)}
                      disabled={savingGame === game.gameUid}
                      className="px-4 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 hover:text-amber-200 text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
                    >
                      {savingGame === game.gameUid ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      )}
                      <span>Save {game.name} Limits</span>
                    </button>
                  </div>

                  {/* 4-Column Controls Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 text-xs">
                    {/* Control 1: Minimum Bet */}
                    <div className="bg-[#07090e] border border-slate-800/90 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 uppercase font-bold text-[10px] tracking-wider">
                          Minimum Bet
                        </span>
                        <Coins className="w-3.5 h-3.5 text-amber-400" />
                      </div>

                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-slate-500 font-bold font-mono">₹</span>
                        <input
                          type="number"
                          min="1"
                          max="1000"
                          value={game.minBet}
                          onChange={(e) =>
                            handleInputChange(game.gameUid, "minBet", Number(e.target.value))
                          }
                          className="w-full pl-8 pr-3 py-2 bg-[#0c101c] border border-slate-700 rounded-xl text-white font-mono font-bold text-sm focus:border-amber-500 outline-none"
                        />
                      </div>

                      {/* Quick chips */}
                      <div className="flex gap-1.5">
                        {[10, 20, 50, 100].map((val) => (
                          <button
                            key={val}
                            onClick={() => handleInputChange(game.gameUid, "minBet", val)}
                            className={`flex-1 py-1 rounded-lg text-[10px] font-mono font-bold border transition-colors cursor-pointer ${
                              game.minBet === val
                                ? "bg-amber-500/20 text-amber-300 border-amber-500/50"
                                : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                            }`}
                          >
                            ₹{val}
                          </button>
                        ))}
                      </div>
                      <p className="text-[10px] text-slate-500">Player cannot bet below this stake.</p>
                    </div>

                    {/* Control 2: Maximum Bet */}
                    <div className="bg-[#07090e] border border-slate-800/90 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 uppercase font-bold text-[10px] tracking-wider">
                          Maximum Bet (Stake)
                        </span>
                        <Zap className="w-3.5 h-3.5 text-emerald-400" />
                      </div>

                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-slate-500 font-bold font-mono">₹</span>
                        <input
                          type="number"
                          min="100"
                          max="200000"
                          step="1000"
                          value={game.maxBet}
                          onChange={(e) =>
                            handleInputChange(game.gameUid, "maxBet", Number(e.target.value))
                          }
                          className="w-full pl-8 pr-3 py-2 bg-[#0c101c] border border-slate-700 rounded-xl text-white font-mono font-bold text-sm focus:border-amber-500 outline-none"
                        />
                      </div>

                      {/* Quick chips */}
                      <div className="flex gap-1.5">
                        {[5000, 10000, 25000, 50000].map((val) => (
                          <button
                            key={val}
                            onClick={() => handleInputChange(game.gameUid, "maxBet", val)}
                            className={`flex-1 py-1 rounded-lg text-[10px] font-mono font-bold border transition-colors cursor-pointer ${
                              game.maxBet === val
                                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50"
                                : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                            }`}
                          >
                            {val >= 1000 ? `${val / 1000}k` : val}
                          </button>
                        ))}
                      </div>
                      <p className="text-[10px] text-slate-500">Limits high-roller single bet risk.</p>
                    </div>

                    {/* Control 3: Max Single Payout Cap */}
                    <div className="bg-[#07090e] border border-slate-800/90 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 uppercase font-bold text-[10px] tracking-wider">
                          Max Win Payout Cap
                        </span>
                        <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
                      </div>

                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-slate-500 font-bold font-mono">₹</span>
                        <input
                          type="number"
                          min="10000"
                          max="2000000"
                          step="10000"
                          value={game.maxWinCap}
                          onChange={(e) =>
                            handleInputChange(game.gameUid, "maxWinCap", Number(e.target.value))
                          }
                          className="w-full pl-8 pr-3 py-2 bg-[#0c101c] border border-slate-700 rounded-xl text-white font-mono font-bold text-sm focus:border-amber-500 outline-none"
                        />
                      </div>

                      {/* Quick chips */}
                      <div className="flex gap-1.5">
                        {[100000, 250000, 500000, 1000000].map((val) => (
                          <button
                            key={val}
                            onClick={() => handleInputChange(game.gameUid, "maxWinCap", val)}
                            className={`flex-1 py-1 rounded-lg text-[10px] font-mono font-bold border transition-colors cursor-pointer ${
                              game.maxWinCap === val
                                ? "bg-purple-500/20 text-purple-300 border-purple-500/50"
                                : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                            }`}
                          >
                            {val >= 100000 ? `${val / 100000}L` : `${val / 1000}k`}
                          </button>
                        ))}
                      </div>
                      <p className="text-[10px] text-slate-500">Clamps single wins (even on 1,000x).</p>
                    </div>

                    {/* Control 4: Round Safe Liability Limit */}
                    <div className="bg-[#07090e] border border-slate-800/90 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 uppercase font-bold text-[10px] tracking-wider">
                          Round Safe Liability
                        </span>
                        <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
                      </div>

                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-slate-500 font-bold font-mono">₹</span>
                        <input
                          type="number"
                          min="50000"
                          max="5000000"
                          step="25000"
                          value={game.maxRoundLiability}
                          onChange={(e) =>
                            handleInputChange(game.gameUid, "maxRoundLiability", Number(e.target.value))
                          }
                          className="w-full pl-8 pr-3 py-2 bg-[#0c101c] border border-slate-700 rounded-xl text-white font-mono font-bold text-sm focus:border-amber-500 outline-none"
                        />
                      </div>

                      {/* Quick chips */}
                      <div className="flex gap-1.5">
                        {[100000, 250000, 500000, 1000000].map((val) => (
                          <button
                            key={val}
                            onClick={() => handleInputChange(game.gameUid, "maxRoundLiability", val)}
                            className={`flex-1 py-1 rounded-lg text-[10px] font-mono font-bold border transition-colors cursor-pointer ${
                              game.maxRoundLiability === val
                                ? "bg-sky-500/20 text-sky-300 border-sky-500/50"
                                : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                            }`}
                          >
                            {val >= 100000 ? `${val / 100000}L` : `${val / 1000}k`}
                          </button>
                        ))}
                      </div>
                      <p className="text-[10px] text-slate-500">Max net loss casino accepts per round.</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

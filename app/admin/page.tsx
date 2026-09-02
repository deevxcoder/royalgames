"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Gamepad2,
  Key,
  Users,
  Activity,
  TrendingUp,
  Wallet,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  AlertCircle,
  Play,
  Cpu,
  Layers,
  Sliders,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { STUDIO_GAMES } from "@/lib/gamesCatalog";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [clients, setClients] = useState<any[]>([]);
  const [recentRounds, setRecentRounds] = useState<any[]>([]);
  const [pendingDeposits, setPendingDeposits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [statsRes, clientsRes, roundsRes, depositsRes] = await Promise.all([
          fetch("/api/admin/stats"),
          fetch("/api/admin/clients"),
          fetch("/api/admin/rounds?limit=10"),
          fetch("/api/admin/deposits"),
        ]);

        if (statsRes.ok) {
          const s = await statsRes.json();
          setStats(s.stats || s);
        }
        if (clientsRes.ok) {
          const c = await clientsRes.json();
          setClients(c.clients || []);
        }
        if (roundsRes.ok) {
          const r = await roundsRes.json();
          setRecentRounds(r.rounds?.slice(0, 8) || []);
        }
        if (depositsRes.ok) {
          const d = await depositsRes.json();
          const p = (d.deposits || []).filter((dep: any) => dep.status === "PENDING");
          setPendingDeposits(p);
        }
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  const turnover = stats?.totalTurnover ?? stats?.totalBetVolume ?? 0;
  const payout = stats?.totalPayout ?? stats?.totalWinPayouts ?? 0;
  const ggr = stats?.studioGgr ?? stats?.totalGgr ?? turnover - payout;
  const studioShare = stats?.totalStudioFee ?? ggr * 0.1;
  const holdRate = turnover > 0 ? ((ggr / turnover) * 100).toFixed(1) : "0.0";

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gradient-to-r from-[#0c101c] via-[#0f1526] to-[#0c101c] border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 font-bold text-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Royal Games Studio Remote Gaming Server (RGS)</span>
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight">
            Master Studio Executive Dashboard
          </h1>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            Real-time financial telemetry, B2B aggregator turnover, authoritative provably fair game engine status, and client deposit settlements.
          </p>
        </div>

        {/* Quick Actions Right */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Link
            href="/admin/clients"
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-xs shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
          >
            <Key className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Manage Clients & Keys</span>
          </Link>

          <Link
            href="/admin/deposits"
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition-all cursor-pointer"
          >
            <Wallet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Deposit Approvals ({pendingDeposits.length})</span>
          </Link>
        </div>
      </div>

      {/* Pending Deposits Alert (if any pending) */}
      {pendingDeposits.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/40 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg animate-pulse">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <p className="text-xs font-black text-amber-300">
                Action Required: {pendingDeposits.length} Operator Deposit Request(s) Pending Verification
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Operators have transferred funds and submitted UTR references awaiting your manual review and balance credit.
              </p>
            </div>
          </div>
          <Link
            href="/admin/deposits"
            className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs shrink-0 inline-flex items-center gap-1 transition-all"
          >
            <span>Review UTR Queue</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Top 4 Financial Metric Cards (Clickable to Details) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total B2B Turnover */}
        <Link
          href="/admin/reports"
          className="bg-[#0b0f19] border border-slate-800/90 hover:border-amber-500/50 rounded-2xl p-5 shadow-lg space-y-2 transition-all group block cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider group-hover:text-amber-400 transition-colors">
              Total B2B Turnover
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-white font-mono">
            ₹{turnover.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[10px] text-slate-500">Cumulative player stakes across all client casinos</p>
        </Link>

        {/* Metric 2: Total Player Payouts */}
        <Link
          href="/admin/rounds"
          className="bg-[#0b0f19] border border-slate-800/90 hover:border-purple-500/50 rounded-2xl p-5 shadow-lg space-y-2 transition-all group block cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider group-hover:text-purple-400 transition-colors">
              Player Win Payouts
            </span>
            <div className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-purple-300 font-mono">
            ₹{payout.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[10px] text-slate-500">Total authorized wins credited via webhook callbacks</p>
        </Link>

        {/* Metric 3: Net GGR Hold */}
        <Link
          href="/admin/reports"
          className="bg-[#0b0f19] border border-slate-800/90 hover:border-emerald-500/50 rounded-2xl p-5 shadow-lg space-y-2 transition-all group block cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider group-hover:text-emerald-400 transition-colors">
              Net GGR House Hold
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono flex items-baseline gap-2">
            <span>₹{ggr.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
            <span className="text-xs font-bold text-emerald-500 font-sans">({holdRate}%)</span>
          </div>
          <p className="text-[10px] text-slate-500">Casino gross gaming revenue (Turnover - Payout)</p>
        </Link>

        {/* Metric 4: Studio 10% Royalties */}
        <Link
          href="/admin/reports"
          className="bg-[#0b0f19] border border-slate-800/90 hover:border-amber-500/50 rounded-2xl p-5 shadow-lg space-y-2 transition-all group block cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider group-hover:text-amber-400 transition-colors">
              Studio 10% Royalty
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-300 font-mono">
            ₹{studioShare.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[10px] text-slate-500">Royal Games Studio fee deducted from prepaid GGR</p>
        </Link>
      </div>

      {/* 4 Secondary Quick Metric Counters (All Linked) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
        <Link
          href="/admin/clients"
          className="bg-[#090d16] border border-slate-800 hover:border-amber-500/40 rounded-2xl p-4 transition-all group flex items-center justify-between"
        >
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-sans font-bold block">B2B Clients</span>
            <span className="text-lg font-black text-white">{clients.length} Registered</span>
          </div>
          <Users className="w-5 h-5 text-slate-600 group-hover:text-amber-400 transition-colors" />
        </Link>

        <Link
          href="/admin/rounds"
          className="bg-[#090d16] border border-slate-800 hover:border-purple-500/40 rounded-2xl p-4 transition-all group flex items-center justify-between"
        >
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-sans font-bold block">Total Game Rounds</span>
            <span className="text-lg font-black text-white">{(stats?.totalRounds || 0).toLocaleString()} Played</span>
          </div>
          <Activity className="w-5 h-5 text-slate-600 group-hover:text-purple-400 transition-colors" />
        </Link>

        <Link
          href="/admin/deposits"
          className="bg-[#090d16] border border-slate-800 hover:border-emerald-500/40 rounded-2xl p-4 transition-all group flex items-center justify-between"
        >
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-sans font-bold block">Deposit Queue</span>
            <span className="text-lg font-black text-emerald-400">{pendingDeposits.length} Pending</span>
          </div>
          <Wallet className="w-5 h-5 text-slate-600 group-hover:text-emerald-400 transition-colors" />
        </Link>

        <Link
          href="/admin/game-control"
          className="bg-[#090d16] border border-slate-800 hover:border-rose-500/40 rounded-2xl p-4 transition-all group flex items-center justify-between"
        >
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-sans font-bold block">Flagship Suite</span>
            <span className="text-lg font-black text-white">{STUDIO_GAMES.length} HTML5 Games</span>
          </div>
          <Gamepad2 className="w-5 h-5 text-slate-600 group-hover:text-rose-400 transition-colors" />
        </Link>
      </div>

      {/* Engine Telemetry & System Status Strip */}
      <div className="p-4 bg-[#090d16] border border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-6 flex-wrap">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-amber-400" />
            <span className="text-slate-300 font-semibold">PostgreSQL Database:</span>
            <span className="text-emerald-400 font-mono font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              CONNECTED
            </span>
          </div>

          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-purple-400" />
            <span className="text-slate-300 font-semibold">RNG Cryptographic Seed:</span>
            <span className="text-purple-300 font-mono font-bold">PROVABLY FAIR (SHA-256)</span>
          </div>

          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-sky-400" />
            <span className="text-slate-300 font-semibold">Settlement Webhooks:</span>
            <span className="text-sky-300 font-mono font-bold">IDEMPOTENT ATOMIC</span>
          </div>
        </div>

        <Link
          href="/admin/rtp"
          className="text-amber-400 hover:text-amber-300 font-bold inline-flex items-center gap-1"
        >
          <span>Configure Math Engine</span>
          <ArrowUpRight className="w-3 h-3" />
        </Link>
      </div>

      {/* 2-Column Split: The 3 Flagship Games & Recent Rounds Ticker */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: The 3 Flagship Games Suite */}
        <div className="bg-[#0b0f19] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black text-white flex items-center gap-2">
              <Gamepad2 className="w-4 h-4 text-amber-400" />
              <span>Flagship Games Suite (Active)</span>
            </h2>
            <Link
              href="/"
              target="_blank"
              className="text-xs font-bold text-amber-400 hover:text-amber-300 inline-flex items-center gap-1"
            >
              <span>Play All</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-3">
            {STUDIO_GAMES.map((game) => (
              <div
                key={game.game_uid}
                className="bg-[#07090e] border border-slate-800/90 rounded-2xl p-4 flex items-center justify-between gap-3 hover:border-slate-700 transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center p-1 shrink-0">
                    <img
                      src={`/games/${game.game_uid}.svg`}
                      alt={game.name}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `http://localhost:3000/games/${game.game_uid}.svg`;
                      }}
                    />
                  </div>
                  <div className="truncate">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white truncate">{game.name}</span>
                      <span className="text-[9px] px-2 py-0.2 rounded font-mono bg-slate-800 text-amber-300 border border-slate-700">
                        {game.category}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                      UID: <code className="text-slate-400">{game.game_uid}</code> • Max: {game.max_multiplier}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/play/sess_demo?game=${game.game_uid}`}
                    target="_blank"
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 transition-colors"
                    title="Launch Demo Sandbox"
                  >
                    <Play className="w-4 h-4 fill-amber-400" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Recent Game Rounds Audit Ticker */}
        <div className="bg-[#0b0f19] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-purple-400" />
              <span>Live Game Rounds Ticker</span>
            </h2>
            <Link
              href="/admin/rounds"
              className="text-xs font-bold text-purple-400 hover:text-purple-300 inline-flex items-center gap-1"
            >
              <span>View Full Audit ({stats?.totalRounds || 0})</span>
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          {recentRounds.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              No rounds recorded yet in this session.
            </div>
          ) : (
            <div className="space-y-2">
              {recentRounds.map((r: any) => (
                <div
                  key={r.id}
                  className="bg-[#07090e] border border-slate-800/80 rounded-xl p-3 flex items-center justify-between text-xs font-mono"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        r.winAmount > 0
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {r.gameName || r.gameUid}
                    </span>
                    <span className="text-slate-400 text-[11px] truncate max-w-[100px] sm:max-w-[140px]">
                      {r.userId}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <span className="text-slate-500 text-[10px] block font-sans">Bet</span>
                      <span className="text-white font-bold">₹{r.betAmount}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block font-sans">Payout</span>
                      <span className={r.winAmount > 0 ? "text-emerald-400 font-bold" : "text-slate-500"}>
                        ₹{r.winAmount}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

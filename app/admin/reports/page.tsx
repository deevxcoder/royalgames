"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  BarChart3,
  Download,
  Filter,
  RefreshCw,
  TrendingUp,
  Wallet,
  Users,
  Gamepad2,
  Calendar,
} from "lucide-react";
import { STUDIO_GAMES } from "@/lib/gamesCatalog";

export default function AdminReportsPage() {
  const [rounds, setRounds] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedOperator, setSelectedOperator] = useState("all");
  const [selectedGame, setSelectedGame] = useState("all");
  const [selectedDateRange, setSelectedDateRange] = useState("all");

  useEffect(() => {
    async function loadData() {
      try {
        const [rRes, cRes, sRes] = await Promise.all([
          fetch("/api/admin/rounds?limit=500"),
          fetch("/api/admin/clients"),
          fetch("/api/admin/stats"),
        ]);
        if (rRes.ok) {
          const r = await rRes.json();
          setRounds(r.rounds || []);
        }
        if (cRes.ok) {
          const c = await cRes.json();
          setClients(c.clients || []);
        }
        if (sRes.ok) {
          const s = await sRes.json();
          setStats(s.stats);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Filtered rounds
  const filteredRounds = useMemo(() => {
    const now = new Date();
    return rounds.filter((r) => {
      if (selectedGame !== "all" && r.gameUid !== selectedGame) return false;
      if (selectedOperator !== "all" && r.operatorId !== selectedOperator) return false;
      if (selectedDateRange === "today") {
        const d = new Date(r.createdAt);
        if (d.toDateString() !== now.toDateString()) return false;
      } else if (selectedDateRange === "week") {
        const d = new Date(r.createdAt);
        const diffDays = (now.getTime() - d.getTime()) / (1000 * 3600 * 24);
        if (diffDays > 7) return false;
      }
      return true;
    });
  }, [rounds, selectedGame, selectedOperator, selectedDateRange]);

  // Aggregates
  const totalTurnover = filteredRounds.reduce((acc, r) => acc + (r.betAmount || 0), 0);
  const totalPayout = filteredRounds.reduce((acc, r) => acc + (r.winAmount || 0), 0);
  const totalGgr = totalTurnover - totalPayout;
  const studioRoyalty = totalGgr * 0.1;
  const holdRate = totalTurnover > 0 ? ((totalGgr / totalTurnover) * 100).toFixed(1) : "0.0";

  // Breakdown by game
  const gameBreakdown = useMemo(() => {
    const map: Record<string, { name: string; stakes: number; wins: number; count: number }> = {};
    STUDIO_GAMES.forEach((g) => {
      map[g.game_uid] = { name: g.name, stakes: 0, wins: 0, count: 0 };
    });
    filteredRounds.forEach((r) => {
      if (!map[r.gameUid]) {
        map[r.gameUid] = { name: r.gameName || r.gameUid, stakes: 0, wins: 0, count: 0 };
      }
      map[r.gameUid].stakes += r.betAmount || 0;
      map[r.gameUid].wins += r.winAmount || 0;
      map[r.gameUid].count += 1;
    });
    return Object.entries(map).map(([uid, val]) => ({
      uid,
      ...val,
      ggr: val.stakes - val.wins,
      hold: val.stakes > 0 ? (((val.stakes - val.wins) / val.stakes) * 100).toFixed(1) : "0.0",
    }));
  }, [filteredRounds]);

  // Top players leaderboard
  const topPlayers = useMemo(() => {
    const map: Record<string, { stakes: number; wins: number; count: number }> = {};
    filteredRounds.forEach((r) => {
      const u = r.userId || "anonymous";
      if (!map[u]) map[u] = { stakes: 0, wins: 0, count: 0 };
      map[u].stakes += r.betAmount || 0;
      map[u].wins += r.winAmount || 0;
      map[u].count += 1;
    });
    return Object.entries(map)
      .map(([userId, val]) => ({
        userId,
        ...val,
        ggr: val.stakes - val.wins,
      }))
      .sort((a, b) => b.stakes - a.stakes)
      .slice(0, 10);
  }, [filteredRounds]);

  // CSV Export
  const exportCsv = () => {
    const headers = ["Round ID", "Game", "Player ID", "Bet (INR)", "Win (INR)", "GGR Net (INR)", "Timestamp"];
    const rows = filteredRounds.map((r) => [
      r.roundId || r.id,
      r.gameName || r.gameUid,
      r.userId,
      r.betAmount,
      r.winAmount,
      (r.betAmount || 0) - (r.winAmount || 0),
      new Date(r.createdAt).toISOString(),
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `rgs_ggr_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-[#0e1320] via-[#0f172a] to-[#0e1320] border border-amber-500/30 rounded-3xl p-6 shadow-xl">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-amber-400" />
            <span>Financial Analytics & GGR Revenue Reports</span>
          </h2>
          <p className="text-xs text-gray-400 mt-1 max-w-2xl">
            Audit Gross Gaming Revenue (GGR), operator hold percentages, Studio 10% royalties, and export authoritative CSV statements for billing reconciliation.
          </p>
        </div>

        <button
          onClick={exportCsv}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-xs shadow-lg shadow-amber-500/20 cursor-pointer shrink-0"
        >
          <Download className="w-3.5 h-3.5 stroke-[3]" />
          <span>Export CSV Statement</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#0b0f19] border border-slate-800 rounded-2xl p-4 text-xs">
        {/* Filter 1: Operator */}
        <div>
          <label className="text-slate-400 font-bold block mb-1 uppercase tracking-wider text-[10px]">
            B2B Client / Casino
          </label>
          <select
            value={selectedOperator}
            onChange={(e) => setSelectedOperator(e.target.value)}
            className="w-full bg-[#07090e] border border-slate-700 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-amber-500 text-xs"
          >
            <option value="all">All B2B Operators ({clients.length})</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Filter 2: Game */}
        <div>
          <label className="text-slate-400 font-bold block mb-1 uppercase tracking-wider text-[10px]">
            Game Filter
          </label>
          <select
            value={selectedGame}
            onChange={(e) => setSelectedGame(e.target.value)}
            className="w-full bg-[#07090e] border border-slate-700 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-amber-500 text-xs"
          >
            <option value="all">All Flagship Games ({STUDIO_GAMES.length})</option>
            {STUDIO_GAMES.map((g) => (
              <option key={g.game_uid} value={g.game_uid}>
                {g.name}
              </option>
            ))}
          </select>
        </div>

        {/* Filter 3: Date Range */}
        <div>
          <label className="text-slate-400 font-bold block mb-1 uppercase tracking-wider text-[10px]">
            Date Period
          </label>
          <select
            value={selectedDateRange}
            onChange={(e) => setSelectedDateRange(e.target.value)}
            className="w-full bg-[#07090e] border border-slate-700 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-amber-500 text-xs"
          >
            <option value="all">Lifetime History</option>
            <option value="today">Today (Last 24h)</option>
            <option value="week">Past 7 Days</option>
          </select>
        </div>
      </div>

      {/* Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl p-5 space-y-1">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Filtered Turnover</span>
          <div className="text-xl sm:text-2xl font-black text-white font-mono">
            ₹{totalTurnover.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[10px] text-slate-500">{filteredRounds.length} Rounds</p>
        </div>

        <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl p-5 space-y-1">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Player Payouts</span>
          <div className="text-xl sm:text-2xl font-black text-purple-300 font-mono">
            ₹{totalPayout.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[10px] text-slate-500">Authorized Webhooks</p>
        </div>

        <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl p-5 space-y-1">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Net GGR Hold</span>
          <div className={`text-xl sm:text-2xl font-black font-mono ${totalGgr >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
            ₹{totalGgr.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[10px] text-slate-500">Hold Rate: {holdRate}%</p>
        </div>

        <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl p-5 space-y-1">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Studio 10% Royalty</span>
          <div className="text-xl sm:text-2xl font-black text-amber-300 font-mono">
            ₹{studioRoyalty.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[10px] text-slate-500">Auto-billed from Prepaid GGR</p>
        </div>
      </div>

      {/* Game Breakdown Table */}
      <div className="bg-[#0b0f19] border border-slate-800 rounded-3xl p-6 shadow-lg space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Gamepad2 className="w-4 h-4 text-amber-400" />
          <span>Performance by Flagship Title</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="pb-3">Game Title</th>
                <th className="pb-3">Total Rounds</th>
                <th className="pb-3">Total Turnover</th>
                <th className="pb-3">Total Payouts</th>
                <th className="pb-3">Gross Gaming Revenue (GGR)</th>
                <th className="pb-3 text-right">Hold %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {gameBreakdown.map((item) => (
                <tr key={item.uid} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 font-sans font-bold text-white">{item.name}</td>
                  <td className="py-3 text-slate-400">{item.count.toLocaleString()}</td>
                  <td className="py-3 font-bold text-white">₹{item.stakes.toLocaleString("en-IN")}</td>
                  <td className="py-3 font-bold text-purple-300">₹{item.wins.toLocaleString("en-IN")}</td>
                  <td className="py-3 font-bold">
                    <span className={item.ggr >= 0 ? "text-emerald-400" : "text-rose-400"}>
                      ₹{item.ggr.toLocaleString("en-IN")}
                    </span>
                  </td>
                  <td className="py-3 text-right font-bold text-amber-400">{item.hold}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Players Table */}
      <div className="bg-[#0b0f19] border border-slate-800 rounded-3xl p-6 shadow-lg space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Users className="w-4 h-4 text-purple-400" />
          <span>Top Active Players by Turnover</span>
        </h3>

        {topPlayers.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500">No player data in selected range.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="pb-3">Player ID</th>
                  <th className="pb-3">Rounds Played</th>
                  <th className="pb-3">Total Wagered</th>
                  <th className="pb-3">Total Payouts</th>
                  <th className="pb-3 text-right">Net House GGR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {topPlayers.map((p) => (
                  <tr key={p.userId} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 font-sans font-bold text-slate-200 select-all">{p.userId}</td>
                    <td className="py-3 text-slate-400">{p.count}</td>
                    <td className="py-3 font-bold text-white">₹{p.stakes.toLocaleString("en-IN")}</td>
                    <td className="py-3 font-bold text-purple-300">₹{p.wins.toLocaleString("en-IN")}</td>
                    <td className="py-3 text-right font-bold">
                      <span className={p.ggr >= 0 ? "text-emerald-400" : "text-rose-400"}>
                        ₹{p.ggr.toLocaleString("en-IN")}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Activity,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  Copy,
  Check,
  TrendingUp,
  Gamepad2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { STUDIO_GAMES } from "@/lib/gamesCatalog";

export default function AdminRoundsPage() {
  const [rounds, setRounds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGame, setSelectedGame] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Pagination state
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    totalCount: 0,
    totalPages: 1,
    hasPrev: false,
    hasNext: false,
  });
  const [stats, setStats] = useState({
    totalBets: 0,
    totalWins: 0,
    totalGgr: 0,
  });

  const fetchRounds = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "50",
        game: selectedGame,
        search: searchTerm,
      });
      const res = await fetch(`/api/admin/rounds?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setRounds(data.rounds || []);
        if (data.pagination) setPagination(data.pagination);
        if (data.stats) setStats(data.stats);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, selectedGame, searchTerm]);

  useEffect(() => {
    fetchRounds();
  }, [fetchRounds]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleGameChange = (g: string) => {
    setSelectedGame(g);
    setPage(1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  const totalBets = stats.totalBets;
  const totalWins = stats.totalWins;
  const totalGgr = stats.totalGgr;

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-[#0e1320] via-[#0f172a] to-[#0e1320] border border-amber-500/30 rounded-3xl p-6 shadow-xl">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-purple-400" />
            <span>Authoritative Live Game Rounds & Settlement Audit</span>
          </h2>
          <p className="text-xs text-gray-400 mt-1 max-w-2xl">
            Real-time audit log of all bet placements, game outcomes, multipliers, payout settlements, and idempotent webhook notifications delivered to casino aggregators.
          </p>
        </div>

        <button
          onClick={fetchRounds}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 border border-slate-700 cursor-pointer shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Rounds</span>
        </button>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl p-5 space-y-1">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Total Stakes</span>
          <div className="text-2xl font-black text-white font-mono">
            ₹{Number(totalBets || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[10px] text-slate-500">{pagination.totalCount} Total Recorded Rounds</p>
        </div>

        <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl p-5 space-y-1">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Total Payouts</span>
          <div className="text-2xl font-black text-purple-300 font-mono">
            ₹{Number(totalWins || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[10px] text-slate-500">Player Cashouts Settled</p>
        </div>

        <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl p-5 space-y-1">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Net Studio GGR</span>
          <div className={`text-2xl font-black font-mono ${totalGgr >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
            {totalGgr >= 0
              ? `+₹${Number(totalGgr).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
              : `-₹${Math.abs(Number(totalGgr)).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
          </div>
          <p className="text-[10px] text-slate-500">
            Hold Rate: {totalBets > 0 ? ((totalGgr / totalBets) * 100).toFixed(1) : 0}%
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => handleGameChange("all")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedGame === "all"
                  ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                  : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              All Titles
            </button>
            {STUDIO_GAMES.map((g) => (
              <button
                key={g.game_uid}
                onClick={() => handleGameChange(g.game_uid)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedGame === g.game_uid
                    ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                    : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
                }`}
              >
                {g.name}
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search Round ID, Player..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full pl-9 pr-4 py-1.5 bg-[#07090e] border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
          />
        </div>
      </div>

      {/* Rounds Audit Table */}
      <div className="bg-[#0b0f19] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-black text-white">Live Rounds Ledger</h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
              Page {pagination.page} of {pagination.totalPages} ({pagination.totalCount} Total)
            </span>
          </div>
          <span className="text-xs text-slate-500">50 Records Per Page</span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-500 mb-2" />
            <span className="text-xs">Loading authoritative rounds ledger...</span>
          </div>
        ) : rounds.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <Activity className="w-8 h-8 mx-auto text-slate-600 mb-2" />
            <span className="text-xs">No rounds match the selected filter.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="text-slate-500 border-b border-slate-800/60 pb-2">
                  <th className="pb-3 font-semibold">ROUND ID</th>
                  <th className="pb-3 font-semibold">GAME TITLE</th>
                  <th className="pb-3 font-semibold">PLAYER</th>
                  <th className="pb-3 font-semibold">BET STAKE</th>
                  <th className="pb-3 font-semibold">MULTIPLIER</th>
                  <th className="pb-3 font-semibold">PAYOUT</th>
                  <th className="pb-3 font-semibold">STUDIO GGR</th>
                  <th className="pb-3 font-semibold">WEBHOOK</th>
                  <th className="pb-3 font-semibold text-right">TIMESTAMP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {rounds.map((r: any) => {
                  const ggr = Number(r.betAmount || 0) - Number(r.winAmount || 0);

                  return (
                    <tr key={r.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-300 select-all">
                            {r.roundId?.slice(0, 14)}...
                          </span>
                          <button
                            onClick={() => copyToClipboard(r.roundId, r.id)}
                            className="p-1 text-slate-500 hover:text-white"
                            title="Copy Full Round ID"
                          >
                            {copiedId === r.id ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="py-3 font-sans font-bold text-white">
                        <div className="flex items-center gap-1.5">
                          <Gamepad2 className="w-3.5 h-3.5 text-amber-400" />
                          <span>{r.gameName || r.gameUid}</span>
                        </div>
                      </td>
                      <td className="py-3 text-slate-400 select-all font-sans">{r.userId}</td>
                      <td className="py-3 font-bold text-white">₹{Number(r.betAmount || 0).toLocaleString()}</td>
                      <td className="py-3 text-amber-400 font-bold">
                        {r.multiplier != null && !isNaN(Number(r.multiplier))
                          ? `${Number(r.multiplier).toFixed(2)}x`
                          : "—"}
                      </td>
                      <td className="py-3 font-bold">
                        <span className={Number(r.winAmount) > 0 ? "text-emerald-400" : "text-slate-500"}>
                          ₹{Number(r.winAmount || 0).toLocaleString()}
                        </span>
                      </td>
                      <td className="py-3 font-bold">
                        <span className={ggr >= 0 ? "text-emerald-400" : "text-rose-400"}>
                          {ggr >= 0 ? `+₹${ggr.toLocaleString()}` : `-₹${Math.abs(ggr).toLocaleString()}`}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-sans">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>DELIVERED</span>
                        </span>
                      </td>
                      <td className="py-3 text-right text-slate-500 text-[11px] font-sans">
                        {new Date(r.createdAt).toLocaleTimeString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Navigation Footer */}
        {pagination.totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-800/80 text-xs">
            <div className="text-slate-400">
              Showing{" "}
              <span className="text-white font-bold font-mono">
                {(pagination.page - 1) * pagination.limit + 1}
              </span>{" "}
              to{" "}
              <span className="text-white font-bold font-mono">
                {Math.min(pagination.page * pagination.limit, pagination.totalCount)}
              </span>{" "}
              of <span className="text-white font-bold font-mono">{pagination.totalCount}</span> records
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage(1)}
                disabled={!pagination.hasPrev}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white disabled:opacity-40 disabled:hover:text-slate-400 cursor-pointer disabled:cursor-not-allowed"
                title="First Page"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={!pagination.hasPrev}
                className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white disabled:opacity-40 disabled:hover:text-slate-400 flex items-center gap-1 font-bold cursor-pointer disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Prev</span>
              </button>

              {/* Page Number Chips */}
              <div className="flex items-center gap-1 px-1">
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  let pNum = i + 1;
                  if (pagination.totalPages > 5) {
                    if (pagination.page > 3 && pagination.page < pagination.totalPages - 1) {
                      pNum = pagination.page - 2 + i;
                    } else if (pagination.page >= pagination.totalPages - 1) {
                      pNum = pagination.totalPages - 4 + i;
                    }
                  }
                  return (
                    <button
                      key={pNum}
                      onClick={() => setPage(pNum)}
                      className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        pagination.page === pNum
                          ? "bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20"
                          : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      {pNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={!pagination.hasNext}
                className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white disabled:opacity-40 disabled:hover:text-slate-400 flex items-center gap-1 font-bold cursor-pointer disabled:cursor-not-allowed"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setPage(pagination.totalPages)}
                disabled={!pagination.hasNext}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white disabled:opacity-40 disabled:hover:text-slate-400 cursor-pointer disabled:cursor-not-allowed"
                title="Last Page"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

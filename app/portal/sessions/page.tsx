"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { PortalNavbar } from "../components/PortalNavbar";
import { PortalSidebar } from "../components/PortalSidebar";
import {
  Gamepad2,
  RefreshCw,
  Search,
  Activity,
  User,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

export default function OperatorSessionsPage() {
  const router = useRouter();
  const [operator, setOperator] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [rounds, setRounds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Pagination state
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    totalRounds: 0,
    totalPages: 1,
    hasPrev: false,
    hasNext: false,
  });

  const getPlayerName = (round: any) => {
    return round.user?.username || round.userId || round.session?.userId || round.memberAccount || "player_guest";
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "50",
        search: searchQuery,
      });

      const [meRes, sessRes] = await Promise.all([
        fetch("/api/operator/me"),
        fetch(`/api/operator/sessions?${params.toString()}`),
      ]);

      if (meRes.status === 401) {
        router.push("/portal/login");
        return;
      }

      const meJson = await meRes.json();
      const sessJson = await sessRes.json();

      setOperator(meJson.operator);
      setSessions(sessJson.sessions || []);
      setRounds(sessJson.rounds || []);
      if (sessJson.pagination) {
        setPagination(sessJson.pagination);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery, router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-[#07090e] flex flex-col">
      <PortalNavbar operator={operator} onRefresh={fetchData} isRefreshing={loading} />

      <div className="flex-1 flex">
        <PortalSidebar operator={operator} />

        <main className="flex-1 p-8 space-y-8 overflow-y-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-black text-white flex items-center gap-2">
                <Gamepad2 className="w-5 h-5 text-amber-400" />
                Player Game Sessions & Live Rounds
              </h1>
              <p className="text-sm text-slate-400">
                Real-time tracking of all game launches, round bets, wins, and GGR fee deductions.
              </p>
            </div>

            <button
              onClick={fetchData}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 flex items-center gap-2 transition-all self-start sm:self-auto cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh Data
            </button>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl p-5 space-y-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Active Game Sessions
              </span>
              <div className="text-2xl font-bold text-white font-mono">{sessions.length}</div>
              <div className="text-[11px] text-slate-500">Live launch tokens created</div>
            </div>

            <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl p-5 space-y-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Total Settled Rounds
              </span>
              <div className="text-2xl font-bold text-sky-400 font-mono">{pagination.totalRounds}</div>
              <div className="text-[11px] text-slate-500">Provably Fair rounds logged</div>
            </div>

            <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl p-5 space-y-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Total GGR Cut Deducted
              </span>
              <div className="text-2xl font-bold text-amber-400 font-mono">
                ₹{rounds.reduce((acc, r) => acc + (r.ggrFeeDeducted || 0), 0).toFixed(2)}
              </div>
              <div className="text-[11px] text-slate-500">Based on {operator?.ggrRate || 10}% fee rate</div>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search rounds by game, player ID, or serial number..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-2.5 bg-[#0b0f19] border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Settled Rounds Table */}
          <div className="bg-[#0b0f19] border border-slate-800 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                Settled Game Rounds Ledger
              </h3>
              <span className="text-xs text-slate-500 font-mono">
                Page {pagination.page} of {pagination.totalPages} ({pagination.totalRounds} Total)
              </span>
            </div>

            {loading ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-500 mb-2" />
                Loading settled rounds...
              </div>
            ) : rounds.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-xs">
                No game rounds found. Launch games via your API to see player rounds.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="pb-2">Serial Number</th>
                      <th className="pb-2">Game Name & UID</th>
                      <th className="pb-2">Player Account</th>
                      <th className="pb-2">Bet Amount</th>
                      <th className="pb-2">Win Amount</th>
                      <th className="pb-2">GGR Fee Deducted</th>
                      <th className="pb-2">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {rounds.map((round: any) => (
                      <tr key={round.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-2.5 font-mono text-slate-400 select-all">
                          {round.serialNumber}
                        </td>
                        <td className="py-2.5">
                          <div className="font-semibold text-slate-200">
                            {round.gameName || round.gameUid}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">{round.gameUid}</div>
                        </td>
                        <td className="py-2.5 font-mono">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#07090e] border border-slate-800 text-amber-300 text-xs font-semibold">
                            <User className="w-3 h-3 text-amber-400/80" />
                            {getPlayerName(round)}
                          </span>
                        </td>
                        <td className="py-2.5 font-mono text-slate-300">₹{Number(round.betAmount || 0).toLocaleString()}</td>
                        <td className="py-2.5 font-mono text-emerald-400 font-bold">
                          ₹{Number(round.winAmount || 0).toLocaleString()}
                        </td>
                        <td className="py-2.5 font-mono text-amber-400 font-bold">
                          -₹{Number(round.ggrFeeDeducted || 0).toFixed(2)}
                        </td>
                        <td className="py-2.5 text-slate-500">
                          {new Date(round.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
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
                    {Math.min(pagination.page * pagination.limit, pagination.totalRounds)}
                  </span>{" "}
                  of <span className="text-white font-bold font-mono">{pagination.totalRounds}</span> records
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

                  {/* Page Numbers */}
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
        </main>
      </div>
    </div>
  );
}

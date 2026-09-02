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
} from "lucide-react";
import { STUDIO_GAMES } from "@/lib/gamesCatalog";

export default function AdminRoundsPage() {
  const [rounds, setRounds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGame, setSelectedGame] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchRounds = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/rounds?limit=100");
      if (res.ok) {
        const data = await res.json();
        setRounds(data.rounds || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRounds();
  }, [fetchRounds]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filtered = rounds.filter((r) => {
    if (selectedGame !== "all" && r.gameUid !== selectedGame) return false;
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      const matchPlayer = r.userId?.toLowerCase().includes(s);
      const matchSerial = r.roundId?.toLowerCase().includes(s);
      const matchGame = r.gameName?.toLowerCase().includes(s);
      return matchPlayer || matchSerial || matchGame;
    }
    return true;
  });

  const totalBets = filtered.reduce((acc, r) => acc + (r.betAmount || 0), 0);
  const totalWins = filtered.reduce((acc, r) => acc + (r.winAmount || 0), 0);
  const totalGgr = totalBets - totalWins;

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
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Rounds</span>
        </button>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl p-5 space-y-1">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Filtered Stakes</span>
          <div className="text-2xl font-black text-white font-mono">
            ₹{totalBets.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[10px] text-slate-500">{filtered.length} Authoritative Rounds</p>
        </div>

        <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl p-5 space-y-1">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Filtered Payouts</span>
          <div className="text-2xl font-black text-purple-300 font-mono">
            ₹{totalWins.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[10px] text-slate-500">Credited via Webhook Callback</p>
        </div>

        <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl p-5 space-y-1">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Net GGR Hold</span>
          <div className={`text-2xl font-black font-mono ${totalGgr >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
            ₹{totalGgr.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[10px] text-slate-500">Hold Rate: {totalBets > 0 ? ((totalGgr / totalBets) * 100).toFixed(1) : 0}%</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0b0f19] border border-slate-800 rounded-2xl p-3.5 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-slate-400 font-bold text-[11px] mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-amber-400" /> Game:
          </span>
          <button
            onClick={() => setSelectedGame("all")}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              selectedGame === "all" ? "bg-amber-500 text-slate-950" : "bg-slate-900 text-slate-400 hover:text-white"
            }`}
          >
            All Games
          </button>
          {STUDIO_GAMES.map((g) => (
            <button
              key={g.game_uid}
              onClick={() => setSelectedGame(g.game_uid)}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                selectedGame === g.game_uid ? "bg-amber-500 text-slate-950" : "bg-slate-900 text-slate-400 hover:text-white"
              }`}
            >
              {g.name}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by Player ID, Serial..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-[#07090e] border border-slate-700 rounded-xl pl-8 pr-3.5 py-1.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500 text-xs w-full sm:w-64"
          />
        </div>
      </div>

      {/* Rounds Audit Table */}
      <div className="bg-[#0b0f19] border border-slate-800 rounded-3xl p-6 shadow-lg space-y-4">
        {loading ? (
          <div className="text-center py-12 text-slate-500 text-xs">Loading game rounds...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs">
            No game rounds found matching current filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="pb-3">Round ID / Serial</th>
                  <th className="pb-3">Game Title</th>
                  <th className="pb-3">Player ID</th>
                  <th className="pb-3">Bet Stake</th>
                  <th className="pb-3">Multiplier</th>
                  <th className="pb-3">Win Payout</th>
                  <th className="pb-3">GGR Net</th>
                  <th className="pb-3">Webhook Delivery</th>
                  <th className="pb-3 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filtered.map((r) => {
                  const ggr = (r.betAmount || 0) - (r.winAmount || 0);
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
                      <td className="py-3 font-bold text-white">₹{r.betAmount}</td>
                      <td className="py-3 text-amber-400 font-bold">
                        {r.multiplier != null && !isNaN(Number(r.multiplier))
                          ? `${Number(r.multiplier).toFixed(2)}x`
                          : "—"}
                      </td>
                      <td className="py-3 font-bold">
                        <span className={r.winAmount > 0 ? "text-emerald-400" : "text-slate-500"}>
                          ₹{r.winAmount}
                        </span>
                      </td>
                      <td className="py-3 font-bold">
                        <span className={ggr >= 0 ? "text-emerald-400" : "text-rose-400"}>
                          {ggr >= 0 ? `+₹${ggr}` : `-₹${Math.abs(ggr)}`}
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
      </div>
    </div>
  );
}

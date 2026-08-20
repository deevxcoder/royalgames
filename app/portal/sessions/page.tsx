"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PortalNavbar } from "../components/PortalNavbar";
import { PortalSidebar } from "../components/PortalSidebar";
import {
  Gamepad2,
  RefreshCw,
  Search,
  Activity,
} from "lucide-react";

export default function OperatorSessionsPage() {
  const router = useRouter();
  const [operator, setOperator] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [rounds, setRounds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = async () => {
    try {
      const [meRes, sessRes] = await Promise.all([
        fetch("/api/operator/me"),
        fetch("/api/operator/sessions?limit=50"),
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
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const filteredRounds = rounds.filter((r) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.gameUid?.toLowerCase().includes(q) ||
      r.gameName?.toLowerCase().includes(q) ||
      r.memberAccount?.toLowerCase().includes(q) ||
      r.serialNumber?.toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07090e] flex items-center justify-center text-slate-400">
        <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07090e] flex flex-col">
      <PortalNavbar operator={operator} />

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
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 flex items-center gap-2 transition-all self-start sm:self-auto"
            >
              <RefreshCw className="w-3.5 h-3.5" />
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
              <div className="text-2xl font-bold text-sky-400 font-mono">{rounds.length}</div>
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
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#0b0f19] border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Settled Rounds Table */}
          <div className="bg-[#0b0f19] border border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              Settled Game Rounds Ledger
            </h3>

            {filteredRounds.length === 0 ? (
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
                    {filteredRounds.map((round: any) => (
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
                        <td className="py-2.5 font-mono text-slate-300">
                          {round.memberAccount || round.userId}
                        </td>
                        <td className="py-2.5 font-mono text-slate-300">₹{round.betAmount}</td>
                        <td className="py-2.5 font-mono text-emerald-400 font-bold">
                          ₹{round.winAmount}
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
          </div>
        </main>
      </div>
    </div>
  );
}

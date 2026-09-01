"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PortalNavbar } from "../components/PortalNavbar";
import { PortalSidebar } from "../components/PortalSidebar";
import {
  Wallet,
  TrendingUp,
  Activity,
  KeyRound,
  Gamepad2,
  CheckCircle2,
  Sparkles,
  ArrowUpRight,
  User,
} from "lucide-react";

export default function OperatorDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch("/api/operator/me");
      if (res.status === 401) {
        router.push("/portal/login");
        return;
      }
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 8000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07090e] flex items-center justify-center text-slate-400">
        <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const operator = data?.operator;
  const stats = data?.stats || {};
  const recentRounds = data?.recentRounds || [];

  return (
    <div className="min-h-screen bg-[#07090e] flex flex-col" suppressHydrationWarning>
      <PortalNavbar operator={operator} />

      <div className="flex-1 flex">
        <PortalSidebar operator={operator} />

        <main className="flex-1 p-8 space-y-8 overflow-y-auto">
          {/* Banner */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0d121c] via-[#0d121c] to-amber-950/40 border border-slate-800 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1 z-10">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <h1 className="text-xl font-black text-white">
                  Welcome, <span className="text-amber-400">{operator?.companyName}</span>
                </h1>
              </div>
              <p className="text-xs text-slate-400">
                Your Studio RGS Game Gateway is <span className="text-emerald-400 font-semibold">ACTIVE & ONLINE</span>.
              </p>
            </div>

            <div className="flex items-center gap-3 z-10">
              <button
                onClick={() => router.push("/portal/apikeys")}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 flex items-center gap-2 transition-all"
              >
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                API Credentials
              </button>
              <button
                onClick={() => router.push("/portal/wallet")}
                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 text-slate-950 text-xs font-black rounded-xl flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all"
              >
                <Wallet className="w-3.5 h-3.5" />
                Recharge GGR
              </button>
            </div>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold uppercase tracking-wider">Prepaid GGR Balance</span>
                <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400">
                  <Wallet className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-emerald-400 font-mono">
                {operator?.currency} {Number(operator?.balance || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[11px] text-slate-500 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                Auto-deducted on game rounds
              </div>
            </div>

            <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold uppercase tracking-wider">Total Player Turnover</span>
                <div className="p-2 bg-amber-500/10 rounded-xl text-amber-400">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-white font-mono">
                {operator?.currency} {Number(stats?.totalBetVolume || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[11px] text-slate-500">
                Total wagers across all studio games
              </div>
            </div>

            <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold uppercase tracking-wider">GGR Share Rate</span>
                <div className="p-2 bg-purple-500/10 rounded-xl text-purple-400">
                  <Activity className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-purple-300 font-mono">
                {operator?.ggrRate || 10.0}% Hold
              </div>
              <div className="text-[11px] text-slate-500">
                Total GGR cut: {operator?.currency} {Number(stats?.totalGgrFees || 0).toFixed(2)}
              </div>
            </div>

            <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold uppercase tracking-wider">Total Settled Rounds</span>
                <div className="p-2 bg-sky-500/10 rounded-xl text-sky-400">
                  <Gamepad2 className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-sky-300 font-mono">
                {stats?.totalRounds || 0}
              </div>
              <div className="text-[11px] text-slate-500">
                Provably Fair RNG engine
              </div>
            </div>
          </div>

          {/* Recent Rounds Table */}
          <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Gamepad2 className="w-4 h-4 text-amber-400" />
                Recent Studio Game Rounds
              </h3>
              <button
                onClick={() => router.push("/portal/sessions")}
                className="text-xs text-amber-400 hover:underline flex items-center gap-1 font-semibold"
              >
                View All Sessions <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>

            {recentRounds.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-xs">
                No game rounds recorded yet. Launch a game via your API to see player activity!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="pb-2">Game / Serial</th>
                      <th className="pb-2">Player</th>
                      <th className="pb-2">Bet Amount</th>
                      <th className="pb-2">Win Amount</th>
                      <th className="pb-2">GGR Cut Deducted</th>
                      <th className="pb-2">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {recentRounds.map((round: any) => (
                      <tr key={round.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-2.5">
                          <div className="font-semibold text-slate-200">{round.gameName || round.gameUid}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{round.serialNumber}</div>
                        </td>
                        <td className="py-2.5 font-mono">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-[#07090e] border border-slate-800 text-amber-300 text-xs font-semibold">
                            <User className="w-3 h-3 text-amber-400/80" />
                            {round.user?.username || round.userId || round.session?.userId || round.memberAccount || "player_guest"}
                          </span>
                        </td>
                        <td className="py-2.5 font-mono text-slate-300">₹{round.betAmount}</td>
                        <td className="py-2.5 font-mono text-emerald-400 font-semibold">₹{round.winAmount}</td>
                        <td className="py-2.5 font-mono text-amber-400 font-semibold">-₹{round.ggrFeeDeducted}</td>
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

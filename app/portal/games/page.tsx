"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { PortalNavbar } from "../components/PortalNavbar";
import { PortalSidebar } from "../components/PortalSidebar";
import { STUDIO_GAMES } from "@/lib/gamesCatalog";
import {
  Layers,
  Power,
  Play,
  ArrowRight,
  ShieldCheck,
  Search,
  Sparkles,
} from "lucide-react";

export default function OperatorGamesCatalogPage() {
  const [operator, setOperator] = useState<any>(null);
  const [disabledUids, setDisabledUids] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [togglingUid, setTogglingUid] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  useEffect(() => {
    fetch("/api/operator/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.operator) setOperator(data.operator);
      });

    fetch("/api/operator/game-toggle")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.disabledUids) {
          setDisabledUids(new Set(data.disabledUids));
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleToggleGame = async (gameUid: string) => {
    setTogglingUid(gameUid);
    const isCurrentlyDisabled = disabledUids.has(gameUid);
    const newEnabledState = isCurrentlyDisabled; // Enable if disabled

    try {
      const res = await fetch("/api/operator/game-toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameUid,
          isEnabled: newEnabledState,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setDisabledUids((prev) => {
          const next = new Set(prev);
          if (newEnabledState) {
            next.delete(gameUid);
          } else {
            next.add(gameUid);
          }
          return next;
        });
      }
    } catch (err) {
      console.error("Failed to toggle game:", err);
    } finally {
      setTogglingUid(null);
    }
  };

  const filteredGames = STUDIO_GAMES.filter((g) => {
    if (categoryFilter !== "all" && g.category.toLowerCase() !== categoryFilter.toLowerCase()) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return g.name.toLowerCase().includes(q) || g.game_uid.toLowerCase().includes(q);
  });

  return (
    <div className="min-h-screen bg-[#07090e] text-white flex flex-col">
      <PortalNavbar operator={operator} />

      <div className="flex-1 flex">
        <PortalSidebar operator={operator} />

        <main className="flex-1 p-8 space-y-6 overflow-y-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-black text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-amber-400" />
                Studio Games Catalog & Visibility Controls
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Enable or Disable individual game titles for your casino. Disabled games are blocked from launch requests.
              </p>
            </div>

            <Link
              href="/portal/docs"
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition-all self-start sm:self-auto"
            >
              View API Launch Docs →
            </Link>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0b0f19] border border-slate-800 p-4 rounded-2xl">
            <div className="flex items-center gap-2">
              {["all", "crash", "table", "originals"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition-all ${
                    categoryFilter === cat
                      ? "bg-amber-500 text-slate-950 font-black"
                      : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="relative min-w-[240px]">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search studio games..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Games Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredGames.map((game) => {
              const isDisabled = disabledUids.has(game.game_uid);
              const isToggling = togglingUid === game.game_uid;

              return (
                <div
                  key={game.game_uid}
                  className={`rounded-2xl border p-5 flex flex-col justify-between space-y-4 transition-all shadow-xl ${
                    isDisabled
                      ? "bg-[#090d16]/70 border-slate-800/60 opacity-60"
                      : "bg-[#0b0f19] border-slate-800 hover:border-amber-500/40"
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        {game.category}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          isDisabled
                            ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                            : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        }`}
                      >
                        {isDisabled ? "Disabled" : "Live in Casino"}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-white">{game.name}</h3>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">UID: {game.game_uid}</p>
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                      {game.description}
                    </p>

                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-emerald-400 font-bold">RTP: {game.rtp}%</span>
                      <span className="text-purple-400 font-bold">Max: {game.max_multiplier}x</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-2 pt-3 border-t border-slate-800">
                    <button
                      onClick={() => handleToggleGame(game.game_uid)}
                      disabled={isToggling}
                      className={`w-full py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all border ${
                        isDisabled
                          ? "bg-slate-900 hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-400 border-slate-700 hover:border-emerald-500/40"
                          : "bg-emerald-500/10 hover:bg-rose-500/10 text-emerald-400 hover:text-rose-400 border-emerald-500/30 hover:border-rose-500/30"
                      }`}
                    >
                      <Power className={`w-3.5 h-3.5 ${isToggling ? "animate-spin" : ""}`} />
                      {isDisabled ? "Enable Game" : "Enabled (Active)"}
                    </button>

                    {!isDisabled && (
                      <Link
                        href={`/play/demo_session?game=${game.game_uid}`}
                        className="w-full py-1 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[11px] font-bold flex items-center justify-center gap-1 transition-all"
                      >
                        <Play className="w-3 h-3 fill-amber-400" />
                        Play Studio Demo
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
}

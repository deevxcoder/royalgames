import React from "react";
import Link from "next/link";
import { Sparkles, Terminal, Shield, Zap, ArrowRight, Gamepad2, Coins, Trophy, Flame, Key, Layers, Globe, ShieldCheck } from "lucide-react";
import { STUDIO_GAMES } from "@/lib/gamesCatalog";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#07090e] text-gray-100 flex flex-col justify-between" suppressHydrationWarning>
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 w-full bg-[#0c101a]/90 backdrop-blur border-b border-slate-800 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 p-[2px] shadow-lg shadow-amber-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-[#0d121c] rounded-[14px] flex items-center justify-center text-xl">
              👑
            </div>
          </div>
          <div>
            <h1 className="text-base font-black text-white tracking-wider">ROYAL GAMES STUDIO</h1>
            <p className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">Remote Game Server (RGS) Engine</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 text-xs font-bold text-amber-300 hover:text-amber-200 transition-colors"
          >
            <Key className="w-3.5 h-3.5" />
            <span>Studio Admin & API Keys</span>
          </Link>

          <Link
            href="/play/demo_session?game=royal_tigertrail"
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 transition-all"
          >
            <span>Play Games Demo</span>
            <ArrowRight className="w-3.5 h-3.5 stroke-[3]" />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-12 space-y-16">
        <div className="text-center space-y-4 max-w-3xl mx-auto pt-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold text-xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>B2B Remote Gaming Server (RGS) • 100% Native HTML5 Suite</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            Next-Gen <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500">Royal Game Studio</span> Suite
          </h2>

          <p className="text-sm text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Engineered for high player engagement, smooth 60FPS physics, procedural sound synthesizers, and Provably Fair SHA-256 RNG mathematics. Available for integration via our B2B REST API Gateway.
          </p>
        </div>

        {/* Studio Games Grid */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Gamepad2 className="w-5 h-5 text-amber-400" />
              <span>Native Studio Games Suite ({STUDIO_GAMES.length} Titles)</span>
            </h3>
            <span className="text-xs text-amber-400 font-mono font-bold">API & Aggregator Ready</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {STUDIO_GAMES.map((game) => (
              <div
                key={game.game_uid}
                className="bg-[#0b0f19] border border-slate-800/90 rounded-2xl p-5 flex flex-col justify-between space-y-4 hover:border-amber-500/50 hover:shadow-xl hover:shadow-amber-500/10 transition-all group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      {game.category}
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-400">
                      RTP {game.rtp}%
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-white group-hover:text-amber-400 transition-colors">
                    {game.name}
                  </h4>

                  <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">
                    {game.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold text-purple-400">
                    Max: {game.max_multiplier}x
                  </span>
                  <Link
                    href={`/play/demo_session?game=${game.game_uid}`}
                    className="flex items-center gap-1 text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors"
                  >
                    <span>Launch</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-[#07090e] py-6 px-4 text-center text-xs text-gray-500">
        <p>© 2026 Royal Games Studio. All rights reserved. B2B Remote Gaming Server (RGS) Engine.</p>
      </footer>
    </div>
  );
}

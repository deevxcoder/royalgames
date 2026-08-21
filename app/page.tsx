"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  Terminal,
  Shield,
  Zap,
  ArrowRight,
  Gamepad2,
  Coins,
  Trophy,
  Flame,
  Key,
  Layers,
  Globe,
  ShieldCheck,
  Cpu,
  Smartphone,
  Percent,
  CheckCircle2,
  Play,
  ExternalLink,
  Code2,
} from "lucide-react";
import { STUDIO_GAMES } from "@/lib/gamesCatalog";

const CATEGORIES = ["ALL", "SLOTS", "CRASH", "MINES & STEP", "PHYSICS & PLINKO", "FAST & PROBABILITY", "CARDS & WHEEL"];

export default function LandingPage() {
  const [selectedCategory, setSelectedCategory] = useState("ALL");

  const filteredGames = STUDIO_GAMES.filter((game) => {
    if (selectedCategory === "ALL") return true;
    if (selectedCategory === "SLOTS") return game.category.toLowerCase().includes("slot");
    if (selectedCategory === "CRASH") return game.category.toLowerCase().includes("crash");
    if (selectedCategory === "MINES & STEP") return game.category.toLowerCase().includes("mines") || game.category.toLowerCase().includes("step") || game.category.toLowerCase().includes("tower");
    if (selectedCategory === "PHYSICS & PLINKO") return game.category.toLowerCase().includes("plinko") || game.category.toLowerCase().includes("physics");
    if (selectedCategory === "FAST & PROBABILITY") return game.category.toLowerCase().includes("limbo") || game.category.toLowerCase().includes("fast") || game.category.toLowerCase().includes("dice");
    if (selectedCategory === "CARDS & WHEEL") return game.category.toLowerCase().includes("cards") || game.category.toLowerCase().includes("wheel");
    return true;
  });

  return (
    <div className="min-h-screen bg-[#06080e] text-gray-100 flex flex-col justify-between selection:bg-amber-500 selection:text-black">
      {/* Top Studio Navbar */}
      <header className="sticky top-0 z-40 w-full bg-[#0a0d16]/90 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-8 py-3 flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 p-[2px] shadow-lg shadow-amber-500/25 flex items-center justify-center">
            <div className="w-full h-full bg-[#080b13] rounded-[14px] flex items-center justify-center text-xl">
              👑
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black text-white tracking-wider">ROYAL GAMES STUDIO</h1>
              <span className="hidden sm:inline-block text-[9px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 px-2 py-0.2 rounded-full uppercase">
                RGS ENGINE
              </span>
            </div>
            <p className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
              B2B Remote Gaming Server • 100% HTML5 Suite
            </p>
          </div>
        </div>

        {/* Navbar Client Login Button */}
        <div className="flex items-center gap-2.5">
          <Link
            href="/portal/login"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-black font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/25 transition-all active:scale-95 cursor-pointer border border-amber-300/40"
          >
            <Key className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Login</span>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-8 sm:py-12 space-y-12 sm:space-y-16">
        <div className="text-center space-y-4 max-w-3xl mx-auto pt-2 sm:pt-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 font-bold text-xs shadow-lg shadow-amber-500/10">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" style={{ animationDuration: "6s" }} />
            <span>Next-Gen High-Roller iGaming Studio Suite</span>
          </div>

          <h2 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-tight">
            Premium <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500">HTML5 Games</span> Studio
          </h2>

          <p className="text-sm sm:text-base text-gray-400 max-w-2xl mx-auto leading-relaxed">
            High-performance 60FPS physics, procedural audio synthesizers, 100% mobile-first single-screen viewports, and Provably Fair SHA-256 RNG mathematics.
          </p>

          {/* Quick Studio Stats Pill Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 max-w-2xl mx-auto">
            <div className="p-3 bg-[#0a0e1a] border border-slate-800 rounded-2xl text-center">
              <span className="text-lg sm:text-xl font-black font-mono text-amber-400 block">{STUDIO_GAMES.length} Titles</span>
              <span className="text-[10px] uppercase font-bold text-gray-500">Native Suite</span>
            </div>
            <div className="p-3 bg-[#0a0e1a] border border-slate-800 rounded-2xl text-center">
              <span className="text-lg sm:text-xl font-black font-mono text-emerald-400 block">97.0% – 99.0%</span>
              <span className="text-[10px] uppercase font-bold text-gray-500">Provably Fair RTP</span>
            </div>
            <div className="p-3 bg-[#0a0e1a] border border-slate-800 rounded-2xl text-center">
              <span className="text-lg sm:text-xl font-black font-mono text-cyan-400 block">60 FPS</span>
              <span className="text-[10px] uppercase font-bold text-gray-500">Canvas Physics</span>
            </div>
            <div className="p-3 bg-[#0a0e1a] border border-slate-800 rounded-2xl text-center">
              <span className="text-lg sm:text-xl font-black font-mono text-purple-400 block">&lt; 15ms</span>
              <span className="text-[10px] uppercase font-bold text-gray-500">Seamless API</span>
            </div>
          </div>
        </div>

        {/* Interactive Studio Games Suite */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/90 pb-4">
            <div>
              <h3 className="text-xl font-black text-white flex items-center gap-2">
                <Gamepad2 className="w-5 h-5 text-amber-400" />
                <span>Native Game Catalog ({STUDIO_GAMES.length} Titles)</span>
              </h3>
              <p className="text-xs text-gray-400">Available for seamless B2B API integration</p>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? "bg-amber-500 text-black shadow-md shadow-amber-500/25 font-black"
                      : "bg-[#090d16] border border-slate-800 text-gray-400 hover:text-white"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* 10 Game Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredGames.map((game) => (
              <div
                key={game.game_uid}
                className="bg-[#090d16] border border-slate-800/90 hover:border-amber-500/50 rounded-3xl p-3.5 flex flex-col justify-between space-y-3 hover:shadow-2xl hover:shadow-amber-500/10 transition-all group backdrop-blur-md relative overflow-hidden"
              >
                {/* Ambient Top Glow */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-amber-500/15 transition-all" />

                {/* Game Artwork Banner Image */}
                <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-slate-950 border border-slate-800/80 group-hover:border-amber-500/40 transition-all">
                  <img
                    src={game.thumbnail}
                    alt={game.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/80 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/10">
                    <span className="text-[9px] font-bold uppercase text-amber-300 font-mono">
                      {game.category.split("/")[0]}
                    </span>
                  </div>
                  <div className="absolute top-2 right-2 bg-emerald-950/85 backdrop-blur-md border border-emerald-500/40 px-2 py-0.5 rounded-lg">
                    <span className="text-[10px] font-mono font-black text-emerald-300">
                      RTP {game.rtp}%
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 px-1">
                  <h4 className="text-base font-black text-white group-hover:text-amber-400 transition-colors">
                    {game.name}
                  </h4>
                  <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">
                    {game.description}
                  </p>
                </div>

                <div className="pt-2.5 border-t border-slate-800/90 flex items-center justify-between px-1">
                  <div className="flex flex-col">
                    <span className="text-[8px] uppercase font-bold text-gray-500">Max Jackpot</span>
                    <span className="text-xs font-mono font-black text-amber-400">
                      {game.max_multiplier >= 1000 ? `${(game.max_multiplier / 1000).toFixed(0)}k x` : `${game.max_multiplier}x`}
                    </span>
                  </div>

                  <Link
                    href={`/play/demo_session?game=${game.game_uid}`}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-black text-xs uppercase tracking-wider shadow-md shadow-amber-500/20 transition-all active:scale-95 cursor-pointer"
                  >
                    <span>Launch</span>
                    <ArrowRight className="w-3.5 h-3.5 stroke-[3]" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* B2B Developer Architecture & GGR Highlights */}
        <div className="bg-[#090d16] border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <span className="text-xs font-bold text-amber-400 uppercase tracking-widest block">B2B Integration Architecture</span>
              <h3 className="text-xl font-black text-white mt-0.5">Plug & Play Seamless Wallet Integration</h3>
            </div>
            <Link
              href="/portal/login"
              className="flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 underline"
            >
              <span>Client Portal & API Keys</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="p-4 bg-[#05070d] border border-slate-800/80 rounded-2xl space-y-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Code2 className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-white">REST API Gateway</h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                Simple <code className="text-amber-300 font-mono text-[11px]">POST /api/v1/launch</code> endpoint returns an instant secure game URL token for your players.
              </p>
            </div>

            <div className="p-4 bg-[#05070d] border border-slate-800/80 rounded-2xl space-y-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-white">HMAC-SHA256 Webhooks</h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                Every bet resolution sends cryptographically signed HMAC-SHA256 webhook callbacks to your server with replay protection.
              </p>
            </div>

            <div className="p-4 bg-[#05070d] border border-slate-800/80 rounded-2xl space-y-2">
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <Coins className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-white">Prepaid GGR Billing Engine</h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                Automated revenue share calculation with real-time balance deductions, recharge ledgers, and operator analytics.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-[#04060b] py-6 px-4 text-center text-xs text-gray-500 space-y-1">
        <p>© 2026 Royal Games Studio. All rights reserved. B2B Remote Gaming Server (RGS) Engine.</p>
        <p className="text-[11px] text-gray-600">Provably Fair SHA-256 Mathematics • Certified 100% Native HTML5 Suite</p>
      </footer>
    </div>
  );
}

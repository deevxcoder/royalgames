"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Gamepad2,
  Users,
  Play,
  RotateCcw,
  Wallet,
  Zap,
  Activity,
  ShieldCheck,
  Radio,
  ExternalLink,
  ChevronDown,
  Layers,
  Sparkles,
  CheckCircle2,
  Clock,
  ArrowRightLeft,
  Trash2,
} from "lucide-react";
import { STUDIO_GAMES } from "@/lib/gamesCatalog";

interface WebhookLog {
  id: string;
  serialNumber: string;
  memberAccount: string;
  gameUid: string;
  gameName?: string;
  betAmount: number;
  winAmount: number;
  creditAmount: number;
  netChange: number;
  receivedAt: string;
  signature?: string;
  status: string;
}

export default function TestCasinoPage() {
  const [selectedGame, setSelectedGame] = useState<string>("royal_skyrush");
  const [viewMode, setViewMode] = useState<"DUAL" | "PLAYER_1" | "PLAYER_2">("DUAL");

  // Player 1 State
  const [p1Balance, setP1Balance] = useState<number>(5000);
  const [p1LaunchUrl, setP1LaunchUrl] = useState<string>("");
  const [p1Loading, setP1Loading] = useState<boolean>(false);
  const p1IframeRef = useRef<HTMLIFrameElement | null>(null);

  // Player 2 State
  const [p2Balance, setP2Balance] = useState<number>(5000);
  const [p2LaunchUrl, setP2LaunchUrl] = useState<string>("");
  const [p2Loading, setP2Loading] = useState<boolean>(false);
  const p2IframeRef = useRef<HTMLIFrameElement | null>(null);

  // Server Live Telemetry State
  const [serverPhase, setServerPhase] = useState<string>("SYNCING");
  const [serverMultiplier, setServerMultiplier] = useState<number>(1.0);
  const [serverCountdown, setServerCountdown] = useState<number>(10.0);
  const [serverRoundId, setServerRoundId] = useState<string>("");

  // Webhook Logs
  const [webhookLogs, setWebhookLogs] = useState<WebhookLog[]>([]);
  const [isLogsOpen, setIsLogsOpen] = useState<boolean>(true);

  // Launch Player 1 Session
  const launchPlayer1 = async () => {
    setP1Loading(true);
    try {
      const res = await fetch("/api/test-client/launch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerId: "player_rahul",
          gameUid: selectedGame,
          balance: p1Balance,
          currency: "INR",
        }),
      });
      const data = await res.json();
      if (data.success && data.data?.launchUrl) {
        setP1LaunchUrl(data.data.launchUrl);
      }
    } catch (e) {
      console.error("Player 1 launch failed:", e);
    } finally {
      setP1Loading(false);
    }
  };

  // Launch Player 2 Session
  const launchPlayer2 = async () => {
    setP2Loading(true);
    try {
      const res = await fetch("/api/test-client/launch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerId: "player_amit",
          gameUid: selectedGame,
          balance: p2Balance,
          currency: "INR",
        }),
      });
      const data = await res.json();
      if (data.success && data.data?.launchUrl) {
        setP2LaunchUrl(data.data.launchUrl);
      }
    } catch (e) {
      console.error("Player 2 launch failed:", e);
    } finally {
      setP2Loading(false);
    }
  };

  // Launch Both Simultaneously
  const launchBothPlayers = async () => {
    await Promise.all([launchPlayer1(), launchPlayer2()]);
  };

  // Initial Launch on Mount
  useEffect(() => {
    launchBothPlayers();
  }, [selectedGame]);

  // Poll Server Multiplayer Telemetry
  useEffect(() => {
    let isMounted = true;
    const pollTelemetry = async () => {
      try {
        const res = await fetch(`/api/studio/multiplayer/state?game=${selectedGame}&_t=${Date.now()}`, {
          cache: "no-store",
        });
        const data = await res.json();
        if (!isMounted || !data.success) return;

        setServerPhase(data.phase);
        setServerMultiplier(data.currentMultiplier);
        setServerCountdown(data.countdownLeft);
        setServerRoundId(data.roundId);
      } catch (e) {}
    };

    pollTelemetry();
    const interval = setInterval(pollTelemetry, 200);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [selectedGame]);

  // Poll Webhook Callback Logs
  useEffect(() => {
    let isMounted = true;
    const fetchLogs = async () => {
      try {
        const res = await fetch("/api/test-client/callback", { cache: "no-store" });
        const data = await res.json();
        if (!isMounted || !data.success) return;

        if (Array.isArray(data.logs)) {
          setWebhookLogs(data.logs);
        }
        if (data.balances) {
          if (typeof data.balances.player_rahul === "number") {
            setP1Balance(data.balances.player_rahul);
          }
          if (typeof data.balances.player_amit === "number") {
            setP2Balance(data.balances.player_amit);
          }
        }
      } catch (e) {}
    };

    fetchLogs();
    const logInterval = setInterval(fetchLogs, 800);
    return () => {
      isMounted = false;
      clearInterval(logInterval);
    };
  }, []);

  const currentGameMeta = STUDIO_GAMES.find((g) => g.game_uid === selectedGame) || STUDIO_GAMES[0];

  return (
    <div className="min-h-screen bg-[#05070d] text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-black">
      {/* Top Testing Header Bar */}
      <header className="h-16 bg-[#090d16] border-b border-slate-800/90 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Gamepad2 className="w-5 h-5 text-black font-black" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-black text-white tracking-wide uppercase">
                B2B Casino Testbench
              </h1>
              <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Client Mode
              </span>
            </div>
            <p className="text-[10px] text-slate-400 hidden sm:block">
              Simulating external operator integration via Royal Games B2B Launch API & Webhooks
            </p>
          </div>
        </div>

        {/* Center Game Selector */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={selectedGame}
              onChange={(e) => setSelectedGame(e.target.value)}
              className="bg-[#050811] border border-slate-700 text-white font-bold text-xs rounded-xl px-3 py-2 pr-8 appearance-none cursor-pointer hover:border-amber-500/50 transition-colors"
            >
              {STUDIO_GAMES.map((g) => (
                <option key={g.game_uid} value={g.game_uid}>
                  {g.name} ({g.category.toUpperCase()})
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-3 pointer-events-none" />
          </div>

          <button
            onClick={launchBothPlayers}
            className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-xs px-3.5 py-2 rounded-xl shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sync & Reload Both</span>
          </button>
        </div>

        {/* View Layout Controls */}
        <div className="flex items-center gap-1 bg-[#050811] border border-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setViewMode("DUAL")}
            className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
              viewMode === "DUAL" ? "bg-amber-500 text-black shadow-md" : "text-gray-400 hover:text-white"
            }`}
          >
            Split 2P
          </button>
          <button
            onClick={() => setViewMode("PLAYER_1")}
            className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
              viewMode === "PLAYER_1" ? "bg-amber-500 text-black shadow-md" : "text-gray-400 hover:text-white"
            }`}
          >
            P1
          </button>
          <button
            onClick={() => setViewMode("PLAYER_2")}
            className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
              viewMode === "PLAYER_2" ? "bg-amber-500 text-black shadow-md" : "text-gray-400 hover:text-white"
            }`}
          >
            P2
          </button>
        </div>
      </header>

      {/* Global Authoritative Telemetry Strip */}
      <div className="bg-[#0b101d] border-b border-slate-800/80 px-4 py-2 flex items-center justify-between overflow-x-auto text-xs font-mono">
        <div className="flex items-center gap-4 shrink-0">
          <div className="flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span className="text-gray-400 font-bold">RGS Server Clock:</span>
            <span
              className={`px-2 py-0.5 rounded font-black text-[10px] ${
                serverPhase === "COUNTDOWN"
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                  : serverPhase === "FLYING"
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse"
                  : "bg-rose-500/20 text-rose-300 border border-rose-500/40"
              }`}
            >
              {serverPhase}
            </span>
          </div>

          {serverPhase === "COUNTDOWN" && (
            <div className="flex items-center gap-1">
              <span className="text-gray-400">Countdown:</span>
              <span className="text-amber-400 font-black">{serverCountdown.toFixed(1)}s</span>
            </div>
          )}

          {serverPhase === "FLYING" && (
            <div className="flex items-center gap-1">
              <span className="text-gray-400">Live Ascent:</span>
              <span className="text-emerald-400 font-black">{serverMultiplier.toFixed(2)}x</span>
            </div>
          )}

          {serverPhase === "CRASHED" && (
            <div className="flex items-center gap-1">
              <span className="text-gray-400">Busted Multiplier:</span>
              <span className="text-rose-400 font-black">{serverMultiplier.toFixed(2)}x</span>
            </div>
          )}
        </div>

        <div className="text-[10px] text-gray-500 hidden md:block truncate max-w-sm">
          Round ID: {serverRoundId}
        </div>
      </div>

      {/* Main Dual Player Arena */}
      <main className="flex-1 p-3 sm:p-5 flex flex-col gap-4 max-w-[1700px] w-full mx-auto">
        <div
          className={`grid gap-4 w-full ${
            viewMode === "DUAL" ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"
          }`}
        >
          {/* PLAYER 1 CONTAINER */}
          {(viewMode === "DUAL" || viewMode === "PLAYER_1") && (
            <div className="bg-[#0a0e1a] border border-slate-800 rounded-2xl overflow-hidden flex flex-col shadow-2xl">
              {/* Player 1 Header */}
              <div className="p-3 bg-[#060911] border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 font-black text-xs">
                    P1
                  </div>
                  <div>
                    <h2 className="text-xs font-black text-white">Rahul (Player 1)</h2>
                    <span className="text-[9px] text-gray-500 font-mono">UID: player_rahul</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 bg-[#0a0e19] border border-slate-800 px-2.5 py-1 rounded-lg">
                    <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-xs font-black font-mono text-emerald-400">
                      ₹{p1Balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setP1Balance((prev) => prev + 2000);
                      fetch("/api/test-client/callback", {
                        method: "POST",
                        body: JSON.stringify({ member_account: "player_rahul", credit_amount: p1Balance + 2000 }),
                      });
                    }}
                    className="text-[10px] bg-slate-800 hover:bg-slate-700 text-gray-300 px-2 py-1 rounded-lg font-bold transition-colors cursor-pointer"
                    title="Add ₹2,000 Test Credits"
                  >
                    +₹2k
                  </button>

                  <button
                    onClick={launchPlayer1}
                    disabled={p1Loading}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-gray-300 hover:text-white transition-colors cursor-pointer"
                    title="Reload Player 1 Frame"
                  >
                    <RotateCcw className={`w-3.5 h-3.5 ${p1Loading ? "animate-spin text-amber-400" : ""}`} />
                  </button>
                </div>
              </div>

              {/* Player 1 Iframe */}
              <div className="relative w-full h-[580px] bg-[#03060c]">
                {p1LaunchUrl ? (
                  <iframe
                    ref={p1IframeRef}
                    src={p1LaunchUrl}
                    className="w-full h-full border-0"
                    allow="autoplay; fullscreen"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 space-y-2">
                    <div className="w-8 h-8 rounded-full border-2 border-amber-500/40 border-t-amber-500 animate-spin" />
                    <p className="text-xs font-bold">Launching Player 1 Session...</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PLAYER 2 CONTAINER */}
          {(viewMode === "DUAL" || viewMode === "PLAYER_2") && (
            <div className="bg-[#0a0e1a] border border-slate-800 rounded-2xl overflow-hidden flex flex-col shadow-2xl">
              {/* Player 2 Header */}
              <div className="p-3 bg-[#060911] border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 font-black text-xs">
                    P2
                  </div>
                  <div>
                    <h2 className="text-xs font-black text-white">Amit (Player 2)</h2>
                    <span className="text-[9px] text-gray-500 font-mono">UID: player_amit</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 bg-[#0a0e19] border border-slate-800 px-2.5 py-1 rounded-lg">
                    <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-xs font-black font-mono text-emerald-400">
                      ₹{p2Balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setP2Balance((prev) => prev + 2000);
                      fetch("/api/test-client/callback", {
                        method: "POST",
                        body: JSON.stringify({ member_account: "player_amit", credit_amount: p2Balance + 2000 }),
                      });
                    }}
                    className="text-[10px] bg-slate-800 hover:bg-slate-700 text-gray-300 px-2 py-1 rounded-lg font-bold transition-colors cursor-pointer"
                    title="Add ₹2,000 Test Credits"
                  >
                    +₹2k
                  </button>

                  <button
                    onClick={launchPlayer2}
                    disabled={p2Loading}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-gray-300 hover:text-white transition-colors cursor-pointer"
                    title="Reload Player 2 Frame"
                  >
                    <RotateCcw className={`w-3.5 h-3.5 ${p2Loading ? "animate-spin text-amber-400" : ""}`} />
                  </button>
                </div>
              </div>

              {/* Player 2 Iframe */}
              <div className="relative w-full h-[580px] bg-[#03060c]">
                {p2LaunchUrl ? (
                  <iframe
                    ref={p2IframeRef}
                    src={p2LaunchUrl}
                    className="w-full h-full border-0"
                    allow="autoplay; fullscreen"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 space-y-2">
                    <div className="w-8 h-8 rounded-full border-2 border-amber-500/40 border-t-amber-500 animate-spin" />
                    <p className="text-xs font-bold">Launching Player 2 Session...</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Webhook Settlement Real-Time Event Stream */}
        <div className="bg-[#090d18] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
          <div
            onClick={() => setIsLogsOpen(!isLogsOpen)}
            className="p-3.5 bg-[#060810] border-b border-slate-800 flex items-center justify-between cursor-pointer hover:bg-slate-900/60 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-black text-white tracking-wide uppercase">
                Live Webhook Settlement Stream
              </h3>
              <span className="text-[9px] bg-slate-800 text-gray-400 px-2 py-0.5 rounded-full font-mono">
                {webhookLogs.length} Events Received
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-400 font-mono hidden sm:inline">
                Target: /api/test-client/callback
              </span>
              <ChevronDown
                className={`w-4 h-4 text-gray-400 transition-transform ${isLogsOpen ? "rotate-180" : ""}`}
              />
            </div>
          </div>

          {isLogsOpen && (
            <div className="p-3 max-h-64 overflow-y-auto font-mono text-xs">
              {webhookLogs.length === 0 ? (
                <div className="p-6 text-center text-gray-500 text-xs">
                  No round callbacks received yet. Place a bet in either player frame to observe live webhook settlements!
                </div>
              ) : (
                <div className="space-y-1.5">
                  {webhookLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-2.5 rounded-xl bg-[#060911] border border-slate-800 flex items-center justify-between hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                            log.netChange > 0
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              : log.netChange < 0
                              ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                              : "bg-slate-800 text-gray-400"
                          }`}
                        >
                          {log.netChange > 0 ? "WIN" : log.netChange < 0 ? "LOSS" : "DRAW"}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-xs">{log.memberAccount}</span>
                            <span className="text-[10px] text-gray-500">[{log.gameUid}]</span>
                          </div>
                          <span className="text-[9px] text-gray-500">{log.serialNumber}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-right">
                        <div>
                          <div className="text-[11px] font-bold text-gray-300">
                            Bet: ₹{log.betAmount} | Win: ₹{log.winAmount}
                          </div>
                          <div
                            className={`text-[10px] font-black ${
                              log.netChange >= 0 ? "text-emerald-400" : "text-rose-400"
                            }`}
                          >
                            Net: {log.netChange >= 0 ? "+" : ""}₹{log.netChange} (Bal: ₹{log.creditAmount})
                          </div>
                        </div>
                        <span className="text-[9px] text-gray-500 hidden sm:block">{log.receivedAt}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Gamepad2,
  Key,
  ShieldCheck,
  Users,
  Activity,
  Copy,
  Check,
  Plus,
  Trash2,
  RefreshCw,
  Eye,
  EyeOff,
  ExternalLink,
  Lock,
  ArrowUpRight,
  TrendingUp,
  Cpu,
  Globe,
  Sliders,
  Sparkles,
  Layers,
  LogOut,
  AlertCircle,
} from "lucide-react";

export default function StudioAdminPortal() {
  const [authChecking, setAuthChecking] = useState(true);
  const [adminUser, setAdminUser] = useState<any>(null);
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("studio1234");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  // Tabs: overview, clients, games, rounds, docs
  const [activeTab, setActiveTab] = useState<"overview" | "clients" | "games" | "rounds" | "docs">("clients");

  // State
  const [clients, setClients] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [rounds, setRounds] = useState<any[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
  const [revealedSecrets, setRevealedSecrets] = useState<{ [id: string]: boolean }>({});

  // New Client Modal
  const [newClientModalOpen, setNewClientModalOpen] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");
  const [newClientCallback, setNewClientCallback] = useState("http://localhost:3001/api/v1/round/resolve");
  const [newClientIpWhitelist, setNewClientIpWhitelist] = useState("");
  const [creatingClient, setCreatingClient] = useState(false);

  // Check auth
  const checkAuth = useCallback(async () => {
    try {
      setAuthChecking(true);
      const res = await fetch("/api/admin/me");
      const data = await res.json();
      if (data.user) {
        setAdminUser(data.user);
      } else {
        setAdminUser(null);
      }
    } catch {
      setAdminUser(null);
    } finally {
      setAuthChecking(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Fetch Data
  const fetchData = useCallback(async () => {
    if (!adminUser) return;
    try {
      setLoadingClients(true);
      const [clientsRes, statsRes, roundsRes] = await Promise.all([
        fetch("/api/admin/clients"),
        fetch("/api/admin/stats"),
        fetch("/api/admin/rounds"),
      ]);

      const [cData, sData, rData] = await Promise.all([
        clientsRes.json(),
        statsRes.json(),
        roundsRes.json(),
      ]);

      if (cData.clients) setClients(cData.clients);
      if (sData.clientsCount !== undefined) setStats(sData);
      if (rData.rounds) setRounds(rData.rounds);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingClients(false);
    }
  }, [adminUser]);

  useEffect(() => {
    if (adminUser) {
      fetchData();
    }
  }, [adminUser, fetchData]);

  // Login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAdminUser(data.user);
      } else {
        setLoginError(data.error || "Invalid username or password");
      }
    } catch (err: any) {
      setLoginError(err.message || "Failed to login");
    } finally {
      setLoginLoading(false);
    }
  };

  // Logout handler
  const handleLogout = async () => {
    await fetch("/api/admin/me", { method: "POST" });
    setAdminUser(null);
  };

  // Copy helper
  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKeyId(id);
    setTimeout(() => setCopiedKeyId(null), 2500);
  };

  // Create Client
  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName || !newClientEmail) return;
    setCreatingClient(true);
    try {
      const res = await fetch("/api/admin/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newClientName,
          email: newClientEmail,
          callbackUrl: newClientCallback,
          ipWhitelist: newClientIpWhitelist || null,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setNewClientName("");
        setNewClientEmail("");
        setNewClientModalOpen(false);
        fetchData();
      } else {
        alert(data.error || "Failed to register client");
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setCreatingClient(false);
    }
  };

  // Generate new key for client
  const handleGenerateKey = async (clientId: string) => {
    const keyName = prompt("Enter a label for this API key:", "Production Gateway Key");
    if (!keyName) return;

    try {
      const res = await fetch("/api/admin/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, name: keyName }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        fetchData();
      } else {
        alert(data.error || "Failed to generate key");
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Revoke Key
  const handleRevokeKey = async (keyId: string) => {
    if (!confirm("Are you sure you want to revoke this Studio API key? Aggregator requests using it will immediately fail.")) return;
    try {
      const res = await fetch(`/api/admin/keys?id=${keyId}`, { method: "DELETE" });
      if (res.ok) {
        fetchData();
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  if (authChecking) {
    return (
      <div className="min-h-screen bg-[#07090e] text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-amber-500/20 border-t-amber-400 rounded-full animate-spin" />
          <span className="text-xs text-amber-400 font-mono tracking-widest uppercase">Authenticating Studio Admin...</span>
        </div>
      </div>
    );
  }

  // Login View
  if (!adminUser) {
    return (
      <div className="min-h-screen bg-[#07090e] text-white flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#0e121c] border border-amber-500/30 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 text-black">
              <Gamepad2 className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                ROYAL RGS STUDIO
                <span className="text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/40 px-2 py-0.5 rounded-full font-mono">
                  B2B ENGINE
                </span>
              </h1>
              <p className="text-xs text-gray-400">Remote Gaming Server & Client Management</p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {loginError && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{loginError}</span>
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-gray-300 block mb-1.5 uppercase tracking-wider">
                Studio Admin Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-[#080a10] border border-slate-700 focus:border-amber-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none transition-colors"
                placeholder="admin"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-300 block mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#080a10] border border-slate-700 focus:border-amber-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none transition-colors"
                placeholder="studio1234"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full mt-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold py-3 rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 text-sm"
            >
              {loginLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
              <span>Sign In to Studio Portal</span>
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-800 text-center text-xs text-gray-500">
            Default credentials: <span className="text-amber-400 font-mono">admin</span> / <span className="text-amber-400 font-mono">studio1234</span>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated Portal Dashboard
  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-black">
      {/* Top Navbar */}
      <header className="h-16 border-b border-slate-800/80 bg-[#0c101a]/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-black font-black shadow-lg shadow-amber-500/20">
              <Gamepad2 className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-white text-base tracking-tight">ROYAL GAMES STUDIO</span>
                <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold">
                  RGS ADMIN
                </span>
              </div>
              <p className="text-[11px] text-gray-400 leading-none">B2B Game Studio & API Gateway</p>
            </div>
          </div>

          {/* Tab Navigation */}
          <nav className="hidden md:flex items-center gap-1 ml-8 bg-[#07090e] p-1 rounded-xl border border-slate-800">
            {[
              { id: "clients", label: "B2B Clients & API Keys", icon: Key },
              { id: "overview", label: "Studio Overview", icon: Activity },
              { id: "games", label: "Native Games Suite", icon: Gamepad2 },
              { id: "rounds", label: "Round Audit Ledger", icon: Layers },
              { id: "docs", label: "B2B API Integration Docs", icon: Globe },
            ].map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    active
                      ? "bg-amber-500 text-black shadow-md shadow-amber-500/20"
                      : "text-gray-400 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-gray-300 hover:text-white transition-colors"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loadingClients ? "animate-spin text-amber-400" : ""}`} />
          </button>

          <Link
            href="/"
            target="_blank"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 text-xs font-bold text-amber-300 hover:text-amber-200 transition-colors"
          >
            <span>Live Showcase</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-950/30 hover:bg-rose-900/50 border border-rose-500/30 text-rose-300 text-xs font-bold transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        {/* TAB 1: B2B CLIENTS & API KEYS */}
        {activeTab === "clients" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-[#0e1320] via-[#0f172a] to-[#0e1320] border border-amber-500/30 rounded-3xl p-6 shadow-xl">
              <div>
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <Key className="w-5 h-5 text-amber-400" />
                  <span>B2B Aggregator & Client API Key Management</span>
                </h2>
                <p className="text-xs text-gray-400 mt-1 max-w-2xl">
                  Generate secure API Keys (<code className="text-amber-300 font-mono">rgs_live_...</code>) and Secret Keys for external GGR aggregators, casino networks, and white-label platforms to integrate and launch your native HTML5 games.
                </p>
              </div>

              <button
                onClick={() => setNewClientModalOpen(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold px-4 py-2.5 rounded-xl shadow-lg shadow-amber-500/20 text-xs transition-all shrink-0"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Register New Aggregator / Client</span>
              </button>
            </div>

            {/* Clients List */}
            <div className="space-y-4">
              {clients.length === 0 ? (
                <div className="p-12 text-center bg-[#0a0d16] border border-slate-800 rounded-2xl text-gray-400">
                  <p className="text-sm">No external clients registered yet.</p>
                  <button
                    onClick={() => setNewClientModalOpen(true)}
                    className="mt-3 text-xs font-bold text-amber-400 underline hover:text-amber-300"
                  >
                    Register your first B2B Client (e.g. RoyalGGR Provider)
                  </button>
                </div>
              ) : (
                clients.map((client) => (
                  <div
                    key={client.id}
                    className="bg-[#0b0f19] border border-slate-800/90 rounded-2xl p-5 shadow-lg space-y-4 transition-all hover:border-slate-700"
                  >
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold">
                          <Users className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-black text-white">{client.name}</h3>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                client.status === "ACTIVE"
                                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                  : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                              }`}
                            >
                              {client.status}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 font-mono">{client.email}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right hidden sm:block">
                          <span className="text-[10px] text-gray-400 uppercase font-bold block">Lifetime Activity</span>
                          <span className="text-xs font-mono text-amber-400 font-bold">
                            {client.sessionsCount} Sessions • {client.roundsCount} Rounds
                          </span>
                        </div>

                        <button
                          onClick={() => handleGenerateKey(client.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-amber-300 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>New API Key</span>
                        </button>
                      </div>
                    </div>

                    {/* Active API Keys Table */}
                    <div className="space-y-2">
                      <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                        Assigned Studio API Keys & Secrets
                      </span>

                      {client.tokens.map((token: any) => {
                        const isSecretVisible = revealedSecrets[token.id];
                        return (
                          <div
                            key={token.id}
                            className="bg-[#080a10] border border-slate-800/80 rounded-xl p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4"
                          >
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-white">{token.name}</span>
                                <span className="text-[10px] text-gray-500 font-mono">
                                  Created {new Date(token.createdAt).toLocaleDateString()}
                                </span>
                              </div>

                              <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
                                {/* Token */}
                                <div className="flex items-center gap-2 bg-[#0c101a] px-3 py-1 rounded-lg border border-slate-800">
                                  <span className="text-gray-500 text-[10px] font-sans font-bold">API TOKEN:</span>
                                  <span className="text-amber-400 font-bold">{token.token}</span>
                                  <button
                                    onClick={() => copyToClipboard(token.token, `tok_${token.id}`)}
                                    className="text-gray-400 hover:text-white transition-colors"
                                    title="Copy API Token"
                                  >
                                    {copiedKeyId === `tok_${token.id}` ? (
                                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                </div>

                                {/* Secret Key */}
                                <div className="flex items-center gap-2 bg-[#0c101a] px-3 py-1 rounded-lg border border-slate-800">
                                  <span className="text-gray-500 text-[10px] font-sans font-bold">SECRET KEY:</span>
                                  <span className="text-emerald-400">
                                    {isSecretVisible ? token.secretKey : "••••••••••••••••••••••••••••••••"}
                                  </span>
                                  <button
                                    onClick={() =>
                                      setRevealedSecrets((prev) => ({
                                        ...prev,
                                        [token.id]: !prev[token.id],
                                      }))
                                    }
                                    className="text-gray-400 hover:text-white transition-colors"
                                    title={isSecretVisible ? "Hide Secret" : "Reveal Secret"}
                                  >
                                    {isSecretVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                  </button>
                                  <button
                                    onClick={() => copyToClipboard(token.secretKey, `sec_${token.id}`)}
                                    className="text-gray-400 hover:text-white transition-colors"
                                    title="Copy Secret Key"
                                  >
                                    {copiedKeyId === `sec_${token.id}` ? (
                                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                </div>
                              </div>
                            </div>

                            <button
                              onClick={() => handleRevokeKey(token.id)}
                              className="self-end md:self-center p-2 text-gray-500 hover:text-rose-400 transition-colors"
                              title="Revoke Key"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 2: STUDIO OVERVIEW */}
        {activeTab === "overview" && stats && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl p-5 shadow-lg">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Studio Turnover</span>
                <p className="text-2xl font-black text-amber-400 mt-2">
                  ₹{stats.totalTurnover.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </p>
                <span className="text-[11px] text-gray-500 mt-1 block">Total player bets across all aggregators</span>
              </div>

              <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl p-5 shadow-lg">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Game Rounds</span>
                <p className="text-2xl font-black text-white mt-2">{stats.totalRounds.toLocaleString()}</p>
                <span className="text-[11px] text-gray-500 mt-1 block">Executed via RNG math engine</span>
              </div>

              <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl p-5 shadow-lg">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Active B2B Clients</span>
                <p className="text-2xl font-black text-emerald-400 mt-2">{stats.clientsCount}</p>
                <span className="text-[11px] text-gray-500 mt-1 block">Connected aggregators & providers</span>
              </div>

              <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl p-5 shadow-lg">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Studio Actual RTP</span>
                <p className="text-2xl font-black text-purple-400 mt-2">{stats.actualRtp}%</p>
                <span className="text-[11px] text-gray-500 mt-1 block">Provably fair mathematical hold</span>
              </div>
            </div>

            {/* Per-Game Breakdown */}
            <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">Native Game Math & Performance</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {stats.gameStats.map((game: any) => (
                  <div key={game.gameUid} className="bg-[#080a10] border border-slate-800 p-4 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-white">{game.name}</h4>
                      <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded font-mono font-bold">
                        RTP {game.configuredRtp}%
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">{game.category}</p>
                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
                      <span className="text-gray-400">Rounds: {game.rounds}</span>
                      <span className="text-emerald-400 font-bold">Turnover: ₹{game.turnover.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: NATIVE GAMES */}
        {activeTab === "games" && (
          <div className="space-y-6">
            <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl p-6 shadow-lg">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Gamepad2 className="w-5 h-5 text-amber-400" />
                <span>Royal Studio 6-Game Proprietary Suite</span>
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                All games run on local Remote Gaming Server with 60FPS physics, procedural sound synthesizers, and Provably Fair RNG mathematics.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                {[
                  {
                    uid: "royal_coinflip",
                    name: "Coin Flip Royale",
                    cat: "Casual / Instant Win",
                    rtp: "98.5%",
                    max: "100x",
                    desc: "3D physics coin flip with streak multipliers.",
                  },
                  {
                    uid: "royal_andarbahar",
                    name: "Andar Bahar Live",
                    cat: "Table / Live Indian",
                    rtp: "98.0%",
                    max: "25x",
                    desc: "Classic Indian felt table with Joker opening deal.",
                  },
                  {
                    uid: "royal_chickencross",
                    name: "Chicken Road Cross",
                    cat: "Crash / Stepper",
                    rtp: "97.8%",
                    max: "250x",
                    desc: "Multi-lane traffic road stepper crash game.",
                  },
                  {
                    uid: "royal_aviator",
                    name: "Aviator Royale Crash",
                    cat: "Crash / Flash",
                    rtp: "97.0%",
                    max: "1000x",
                    desc: "High-adrenaline ascending multiplier curve.",
                  },
                  {
                    uid: "royal_mines",
                    name: "Mines Gold",
                    cat: "Originals / Instant",
                    rtp: "98.2%",
                    max: "500x",
                    desc: "5x5 minefield grid cashout game.",
                  },
                  {
                    uid: "royal_roulette",
                    name: "European Roulette",
                    cat: "Table / Wheel",
                    rtp: "97.3%",
                    max: "36x",
                    desc: "37-pocket European spinning wheel.",
                  },
                ].map((g) => (
                  <div key={g.uid} className="bg-[#080a10] border border-slate-800 rounded-2xl p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-amber-400 font-bold">{g.uid}</span>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-bold">
                        ACTIVE
                      </span>
                    </div>
                    <h4 className="text-base font-black text-white">{g.name}</h4>
                    <p className="text-xs text-gray-400 leading-relaxed">{g.desc}</p>
                    <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
                      <span className="text-gray-400">RTP: {g.rtp}</span>
                      <span className="text-purple-400 font-bold">Max: {g.max}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: ROUNDS AUDIT */}
        {activeTab === "rounds" && (
          <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-amber-400" />
              <span>Live Game Round Audit Stream</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-gray-400 font-mono uppercase">
                    <th className="py-3 px-3">Serial Number</th>
                    <th className="py-3 px-3">Game</th>
                    <th className="py-3 px-3">Client / Aggregator</th>
                    <th className="py-3 px-3">Player ID</th>
                    <th className="py-3 px-3 text-right">Bet Amount</th>
                    <th className="py-3 px-3 text-right">Win Amount</th>
                    <th className="py-3 px-3 text-right">Multiplier</th>
                    <th className="py-3 px-3 text-right">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {rounds.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-gray-500">
                        No game rounds executed yet.
                      </td>
                    </tr>
                  ) : (
                    rounds.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-800/30">
                        <td className="py-3 px-3 text-amber-400 font-bold">{r.serialNumber}</td>
                        <td className="py-3 px-3 text-white font-bold">{r.gameUid}</td>
                        <td className="py-3 px-3 text-gray-300">{r.clientName}</td>
                        <td className="py-3 px-3 text-gray-400">{r.userId}</td>
                        <td className="py-3 px-3 text-right text-gray-300">₹{r.betAmount}</td>
                        <td className="py-3 px-3 text-right text-emerald-400 font-bold">₹{r.winAmount}</td>
                        <td className="py-3 px-3 text-right text-purple-400">{r.multiplier}</td>
                        <td className="py-3 px-3 text-right text-gray-500">
                          {new Date(r.createdAt).toLocaleTimeString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: B2B INTEGRATION DOCS */}
        {activeTab === "docs" && (
          <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl p-6 shadow-lg space-y-6">
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Globe className="w-5 h-5 text-amber-400" />
                <span>Royal Games Studio — B2B REST API Integration Guide</span>
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                Share these standard HTTP REST specifications with any external iGaming Aggregator or Casino Operator to connect to your studio.
              </p>
            </div>

            {/* Launch Endpoint */}
            <div className="bg-[#080a10] border border-slate-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-2">
                <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-mono font-bold px-2 py-0.5 rounded">
                  POST
                </span>
                <code className="text-sm text-white font-mono font-bold">http://localhost:3002/api/v1/launch</code>
              </div>
              <p className="text-xs text-gray-400">
                Generates an authenticated game session launch URL embedded in an iframe or opened in a new tab.
              </p>

              <div className="bg-[#06080e] p-4 rounded-xl border border-slate-800/80 font-mono text-xs text-gray-300 overflow-x-auto">
                <pre>{`curl -X POST http://localhost:3002/api/v1/launch \\
  -H "Authorization: Bearer rgs_live_YOUR_STUDIO_API_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "user_id": "player_12345",
    "game_uid": "royal_coinflip",
    "balance": 1500.00,
    "currency": "INR",
    "callback_url": "https://your-aggregator.com/api/callback",
    "return_url": "https://your-casino.com/lobby"
  }'`}</pre>
              </div>

              <div className="pt-2">
                <span className="text-[11px] font-bold text-gray-400 uppercase">Response (JSON):</span>
                <div className="bg-[#06080e] p-4 rounded-xl border border-slate-800/80 font-mono text-xs text-emerald-400 mt-1 overflow-x-auto">
                  <pre>{`{
  "status": 1,
  "code": 0,
  "msg": "Royal Studio game session created successfully",
  "data": {
    "session_id": "sess_9b8374d9e037...",
    "game_uid": "royal_coinflip",
    "game_name": "Coin Flip Royale",
    "provider": "Royal Games Studio",
    "launch_url": "http://localhost:3002/play/sess_9b8374d9e037...?token=eyJhbGci...",
    "expires_at": "2026-08-20T19:55:00.000Z"
  }
}`}</pre>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* New Client Modal */}
      {newClientModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0c101c] border border-amber-500/40 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-amber-400" />
                <span>Register Aggregator / Client</span>
              </h3>
              <button
                onClick={() => setNewClientModalOpen(false)}
                className="text-gray-400 hover:text-white text-xs font-bold"
              >
                ✕ Close
              </button>
            </div>

            <form onSubmit={handleCreateClient} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1">Company / Aggregator Name</label>
                <input
                  type="text"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  placeholder="e.g. RoyalGGR Aggregator Network"
                  required
                  className="w-full bg-[#07090e] border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1">Contact Email</label>
                <input
                  type="email"
                  value={newClientEmail}
                  onChange={(e) => setNewClientEmail(e.target.value)}
                  placeholder="operator@royalggr.com"
                  required
                  className="w-full bg-[#07090e] border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1">Callback Settlement Endpoint</label>
                <input
                  type="text"
                  value={newClientCallback}
                  onChange={(e) => setNewClientCallback(e.target.value)}
                  placeholder="http://localhost:3001/api/v1/round/resolve"
                  className="w-full bg-[#07090e] border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1">IP Whitelist (Optional)</label>
                <input
                  type="text"
                  value={newClientIpWhitelist}
                  onChange={(e) => setNewClientIpWhitelist(e.target.value)}
                  placeholder="e.g. 127.0.0.1, 192.168.1.1 or leave blank for open"
                  className="w-full bg-[#07090e] border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setNewClientModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-gray-300 hover:text-white text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingClient}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black text-xs font-extrabold shadow-lg shadow-amber-500/20"
                >
                  {creatingClient ? "Generating Credentials..." : "Generate API Key & Register"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

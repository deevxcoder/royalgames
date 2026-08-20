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
  Play,
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

  // Docs state
  const [docLang, setDocLang] = useState<"curl" | "node" | "php" | "python">("curl");
  const [docSection, setDocSection] = useState<"architecture" | "launch" | "callback" | "games" | "tester">("architecture");
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);

  // Interactive tester state
  const [testerPlayerId, setTesterPlayerId] = useState("player_demo_9921");
  const [testerGameUid, setTesterGameUid] = useState("royal_coinflip");
  const [testerBalance, setTesterBalance] = useState("1500");
  const [testerCurrency, setTesterCurrency] = useState("INR");
  const [testerLoading, setTesterLoading] = useState(false);
  const [testerResult, setTesterResult] = useState<any>(null);

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(id);
    setTimeout(() => setCopiedSnippet(null), 2000);
  };

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

  // Test Launch API call in docs playground
  const handleTestLaunchAPI = async () => {
    setTesterLoading(true);
    setTesterResult(null);
    try {
      const activeClient = clients[0];
      const token = activeClient?.tokens?.[0]?.token || "rgs_live_demo_studio_token";
      const res = await fetch("/api/v1/launch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          user_id: testerPlayerId || "player_demo_9921",
          game_uid: testerGameUid || "royal_coinflip",
          balance: Number(testerBalance) || 1500,
          currency: testerCurrency || "INR",
          callback_url: activeClient?.callbackUrl || "http://localhost:3001/api/v1/round/resolve",
          return_url: "http://localhost:3000/lobby",
        }),
      });
      const data = await res.json();
      setTesterResult(data);
    } catch (e: any) {
      setTesterResult({ error: e.message });
    } finally {
      setTesterLoading(false);
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
          <div className="space-y-6">
            {/* Header & Sub-navigation */}
            <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl p-6 shadow-lg">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                <div>
                  <h3 className="text-lg font-black text-white flex items-center gap-2.5">
                    <Globe className="w-6 h-6 text-amber-400" />
                    <span>Royal Games Studio — Casino Integration API Documentation</span>
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    Complete B2B integration specification for Casino Operators, Aggregators, and White-Label Platforms.
                  </p>
                </div>

                {/* Sub Tab Navigation */}
                <div className="flex items-center gap-1.5 bg-[#07090e] p-1.5 rounded-xl border border-slate-800 overflow-x-auto">
                  {[
                    { id: "architecture", label: "🏗️ Workflow", desc: "Overview" },
                    { id: "launch", label: "🚀 Launch API", desc: "POST /launch" },
                    { id: "callback", label: "🎯 Webhook Spec", desc: "POST /callback" },
                    { id: "games", label: "🎮 Games Catalog", desc: "GET /games" },
                    { id: "tester", label: "⚡ Live Runner", desc: "Playground" },
                  ].map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setDocSection(s.id as any)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                        docSection === s.id
                          ? "bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-md shadow-amber-500/20"
                          : "text-gray-400 hover:text-white hover:bg-slate-800/50"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* SECTION 1: ARCHITECTURE & WORKFLOW */}
              {docSection === "architecture" && (
                <div className="mt-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-[#080a10] border border-amber-500/20 p-5 rounded-2xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl pointer-events-none" />
                      <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-black text-sm mb-3">
                        1
                      </div>
                      <h4 className="text-sm font-bold text-white mb-1">Player Clicks Game</h4>
                      <p className="text-xs text-gray-400 leading-relaxed">
                        Your casino backend calls <code className="text-amber-400 font-mono">POST /api/v1/launch</code> with user ID and balance. Studio returns an authenticated launch URL.
                      </p>
                    </div>

                    <div className="bg-[#080a10] border border-purple-500/20 p-5 rounded-2xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-xl pointer-events-none" />
                      <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 font-black text-sm mb-3">
                        2
                      </div>
                      <h4 className="text-sm font-bold text-white mb-1">Embedded Gameplay</h4>
                      <p className="text-xs text-gray-400 leading-relaxed">
                        Render the launch URL in an <code className="text-purple-400 font-mono">&lt;iframe&gt;</code> or new window. The player plays with ultra-smooth 60fps canvas graphics.
                      </p>
                    </div>

                    <div className="bg-[#080a10] border border-emerald-500/20 p-5 rounded-2xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-black text-sm mb-3">
                        3
                      </div>
                      <h4 className="text-sm font-bold text-white mb-1">Instant Webhook Settlement</h4>
                      <p className="text-xs text-gray-400 leading-relaxed">
                        When a round ends, Studio dispatches an idempotent HTTP POST callback to your <code className="text-emerald-400 font-mono">callback_url</code> to credit/debit player balance.
                      </p>
                    </div>
                  </div>

                  {/* Flow ASCII diagram */}
                  <div className="bg-[#06080e] p-5 rounded-2xl border border-slate-800 font-mono text-xs text-gray-300 overflow-x-auto leading-relaxed">
                    <span className="text-amber-400 font-bold block mb-2">// Complete Interaction Lifecycle:</span>
                    <pre>{`[Player Browser / Casino App] 
          │  1. Click "Play Coin Flip"
          ▼
[Your Casino Backend] ──(POST /api/v1/launch with Bearer Token)──► [Royal Games Studio RGS]
          ▲                                                                 │
          │  2. Return { status: 1, launch_url: "https://studio.../play" }  │
          └─────────────────────────────────────────────────────────────────┘
          │
          │  3. Render Game in <iframe> inside Casino UI
          ▼
[Player Plays Game (Bet ₹100, Win ₹196)] 
          │
          ▼
[Royal Studio Game Engine] ──(Idempotent POST Webhook Callback)──► [Your /api/callback Endpoint]
                                                                        │
                                                               4. Update Player Balance in DB:
                                                                  new_balance = balance - 100 + 196
                                                                  Respond with { status: 1, code: 0 }`}</pre>
                  </div>
                </div>
              )}

              {/* SECTION 2: LAUNCH API */}
              {docSection === "launch" && (
                <div className="mt-6 space-y-6">
                  {/* Language Selector */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-mono font-bold px-2.5 py-1 rounded-lg">
                        POST
                      </span>
                      <code className="text-sm text-white font-mono font-bold">/api/v1/launch</code>
                    </div>

                    <div className="flex items-center gap-1 bg-[#06080e] p-1 rounded-lg border border-slate-800">
                      {(["curl", "node", "php", "python"] as const).map((lang) => (
                        <button
                          key={lang}
                          onClick={() => setDocLang(lang)}
                          className={`px-3 py-1 rounded text-xs font-mono uppercase font-bold transition-all ${
                            docLang === lang
                              ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                              : "text-gray-400 hover:text-white"
                          }`}
                        >
                          {lang}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Code snippet block */}
                  <div className="relative bg-[#06080e] p-5 rounded-2xl border border-slate-800 font-mono text-xs text-gray-300 overflow-x-auto">
                    <button
                      onClick={() => {
                        const token = clients[0]?.tokens[0]?.token || "rgs_live_YOUR_STUDIO_API_TOKEN";
                        const snips: Record<string, string> = {
                          curl: `curl -X POST https://studio.yourdomain.com/api/v1/launch \\\n  -H "Authorization: Bearer ${token}" \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "user_id": "player_12345",\n    "game_uid": "royal_coinflip",\n    "balance": 1500.00,\n    "currency": "INR",\n    "callback_url": "https://your-casino.com/api/callback",\n    "return_url": "https://your-casino.com/lobby"\n  }'`,
                          node: `import axios from "axios";\n\nconst response = await axios.post("https://studio.yourdomain.com/api/v1/launch", {\n  user_id: "player_12345",\n  game_uid: "royal_coinflip",\n  balance: 1500.00,\n  currency: "INR",\n  callback_url: "https://your-casino.com/api/callback",\n  return_url: "https://your-casino.com/lobby"\n}, {\n  headers: {\n    "Authorization": "Bearer ${token}",\n    "Content-Type": "application/json"\n  }\n});\n\nconsole.log("Game URL:", response.data.data.launch_url);`,
                          php: `<?php\n$payload = json_encode([\n    "user_id" => "player_12345",\n    "game_uid" => "royal_coinflip",\n    "balance" => 1500.00,\n    "currency" => "INR",\n    "callback_url" => "https://your-casino.com/api/callback",\n    "return_url" => "https://your-casino.com/lobby"\n]);\n\n$ch = curl_init("https://studio.yourdomain.com/api/v1/launch");\ncurl_setopt($ch, CURLOPT_RETURNTRANSFER, true);\ncurl_setopt($ch, CURLOPT_POST, true);\ncurl_setopt($ch, CURLOPT_HTTPHEADER, [\n    "Authorization: Bearer ${token}",\n    "Content-Type: application/json"\n]);\ncurl_setopt($ch, CURLOPT_POSTFIELDS, $payload);\n\n$res = json_decode(curl_exec($ch), true);\necho "Launch URL: " . $res["data"]["launch_url"];\n?>`,
                          python: `import requests\n\nurl = "https://studio.yourdomain.com/api/v1/launch"\nheaders = {\n    "Authorization": "Bearer ${token}",\n    "Content-Type": "application/json"\n}\npayload = {\n    "user_id": "player_12345",\n    "game_uid": "royal_coinflip",\n    "balance": 1500.00,\n    "currency": "INR",\n    "callback_url": "https://your-casino.com/api/callback",\n    "return_url": "https://your-casino.com/lobby"\n}\n\nres = requests.post(url, json=payload, headers=headers).json()\nprint("Launch URL:", res["data"]["launch_url"])`,
                        };
                        copyText(snips[docLang] || "", "launch_code");
                      }}
                      className="absolute top-4 right-4 bg-slate-800/80 hover:bg-slate-700 text-gray-300 hover:text-white px-2.5 py-1.5 rounded-lg text-xs font-mono flex items-center gap-1.5"
                    >
                      {copiedSnippet === "launch_code" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedSnippet === "launch_code" ? "Copied" : "Copy"}</span>
                    </button>

                    <pre>{docLang === "curl" && `curl -X POST https://studio.yourdomain.com/api/v1/launch \\
  -H "Authorization: Bearer ${clients[0]?.tokens[0]?.token || "rgs_live_YOUR_STUDIO_API_TOKEN"}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "user_id": "player_12345",
    "game_uid": "royal_coinflip",
    "balance": 1500.00,
    "currency": "INR",
    "callback_url": "https://your-casino.com/api/callback",
    "return_url": "https://your-casino.com/lobby"
  }'`}{docLang === "node" && `import axios from "axios";

const response = await axios.post("https://studio.yourdomain.com/api/v1/launch", {
  user_id: "player_12345",
  game_uid: "royal_coinflip",
  balance: 1500.00,
  currency: "INR",
  callback_url: "https://your-casino.com/api/callback",
  return_url: "https://your-casino.com/lobby"
}, {
  headers: {
    "Authorization": "Bearer ${clients[0]?.tokens[0]?.token || "rgs_live_YOUR_STUDIO_API_TOKEN"}",
    "Content-Type": "application/json"
  }
});

console.log("Game URL:", response.data.data.launch_url);`}{docLang === "php" && `<?php
$payload = json_encode([
    "user_id" => "player_12345",
    "game_uid" => "royal_coinflip",
    "balance" => 1500.00,
    "currency" => "INR",
    "callback_url" => "https://your-casino.com/api/callback",
    "return_url" => "https://your-casino.com/lobby"
]);

$ch = curl_init("https://studio.yourdomain.com/api/v1/launch");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Authorization: Bearer ${clients[0]?.tokens[0]?.token || "rgs_live_YOUR_STUDIO_API_TOKEN"}",
    "Content-Type: application/json"
]);
curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);

$res = json_decode(curl_exec($ch), true);
echo "Launch URL: " . $res["data"]["launch_url"];
?>`}{docLang === "python" && `import requests

url = "https://studio.yourdomain.com/api/v1/launch"
headers = {
    "Authorization": "Bearer ${clients[0]?.tokens[0]?.token || "rgs_live_YOUR_STUDIO_API_TOKEN"}",
    "Content-Type": "application/json"
}
payload = {
    "user_id": "player_12345",
    "game_uid": "royal_coinflip",
    "balance": 1500.00,
    "currency": "INR",
    "callback_url": "https://your-casino.com/api/callback",
    "return_url": "https://your-casino.com/lobby"
}

res = requests.post(url, json=payload, headers=headers).json()
print("Launch URL:", res["data"]["launch_url"])`}</pre>
                  </div>

                  {/* Parameters Table */}
                  <div className="bg-[#080a10] border border-slate-800 rounded-2xl p-5 space-y-3">
                    <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider">Request Parameters</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-800 text-gray-400 font-mono">
                            <th className="py-2.5 px-3">Field</th>
                            <th className="py-2.5 px-3">Type</th>
                            <th className="py-2.5 px-3">Required</th>
                            <th className="py-2.5 px-3">Description</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 font-mono text-gray-300">
                          <tr>
                            <td className="py-2.5 px-3 text-amber-400 font-bold">user_id</td>
                            <td className="py-2.5 px-3 text-purple-400">string</td>
                            <td className="py-2.5 px-3 text-emerald-400">YES</td>
                            <td className="py-2.5 px-3 font-sans">Unique player account ID on your casino.</td>
                          </tr>
                          <tr>
                            <td className="py-2.5 px-3 text-amber-400 font-bold">game_uid</td>
                            <td className="py-2.5 px-3 text-purple-400">string</td>
                            <td className="py-2.5 px-3 text-emerald-400">YES</td>
                            <td className="py-2.5 px-3 font-sans">Game identifier e.g. <code className="text-amber-400">royal_coinflip</code>, <code className="text-amber-400">royal_aviator</code>.</td>
                          </tr>
                          <tr>
                            <td className="py-2.5 px-3 text-amber-400 font-bold">balance</td>
                            <td className="py-2.5 px-3 text-purple-400">number</td>
                            <td className="py-2.5 px-3 text-emerald-400">YES</td>
                            <td className="py-2.5 px-3 font-sans">Player's current real-money balance.</td>
                          </tr>
                          <tr>
                            <td className="py-2.5 px-3 text-amber-400 font-bold">currency</td>
                            <td className="py-2.5 px-3 text-purple-400">string</td>
                            <td className="py-2.5 px-3 text-gray-400">NO</td>
                            <td className="py-2.5 px-3 font-sans">3-letter currency code (Default: <code className="text-amber-400">INR</code>).</td>
                          </tr>
                          <tr>
                            <td className="py-2.5 px-3 text-amber-400 font-bold">callback_url</td>
                            <td className="py-2.5 px-3 text-purple-400">string</td>
                            <td className="py-2.5 px-3 text-emerald-400">YES</td>
                            <td className="py-2.5 px-3 font-sans">Your HTTP POST webhook URL for settlement.</td>
                          </tr>
                          <tr>
                            <td className="py-2.5 px-3 text-amber-400 font-bold">return_url</td>
                            <td className="py-2.5 px-3 text-purple-400">string</td>
                            <td className="py-2.5 px-3 text-gray-400">NO</td>
                            <td className="py-2.5 px-3 font-sans">URL redirected when player clicks "Exit Game" button.</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Sample Response */}
                  <div className="bg-[#080a10] border border-slate-800 rounded-2xl p-5 space-y-3">
                    <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider">Success Response (200 OK)</h4>
                    <div className="bg-[#06080e] p-4 rounded-xl border border-slate-800 font-mono text-xs text-emerald-400 overflow-x-auto">
                      <pre>{`{
  "status": 1,
  "code": 0,
  "msg": "Royal Studio game session created successfully",
  "data": {
    "session_id": "sess_39c1b827e01...",
    "game_uid": "royal_coinflip",
    "game_name": "Coin Flip Royale",
    "provider": "Royal Games Studio",
    "launch_url": "https://studio.yourdomain.com/play/sess_39c1b827e01...?token=eyJhbGciOi...",
    "expires_at": "2026-08-21T02:30:00.000Z"
  }
}`}</pre>
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION 3: WEBHOOK SPECIFICATION */}
              {docSection === "callback" && (
                <div className="mt-6 space-y-6">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="bg-purple-500/20 text-purple-400 border border-purple-500/40 text-xs font-mono font-bold px-2.5 py-1 rounded-lg">
                        POST
                      </span>
                      <code className="text-sm text-white font-mono font-bold">Your Casino Webhook Callback (/api/callback)</code>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      After every game round completes, Royal Games Studio sends an authoritative HTTP POST payload to your configured <code className="text-amber-400 font-mono">callback_url</code>.
                    </p>
                  </div>

                  {/* Webhook Payload Example */}
                  <div className="bg-[#080a10] border border-slate-800 rounded-2xl p-5 space-y-3">
                    <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider">Incoming Webhook Payload (JSON)</h4>
                    <div className="bg-[#06080e] p-4 rounded-xl border border-slate-800 font-mono text-xs text-purple-300 overflow-x-auto">
                      <pre>{`{
  "serial_number": "SN_ROYAL_1724183921098_982",  // Unique Idempotency Key
  "session_id": "sess_39c1b827e01...",
  "member_account": "player_12345",
  "game_uid": "royal_coinflip",
  "game_name": "Coin Flip Royale",
  "bet_amount": 100.00,
  "win_amount": 196.00,
  "new_balance": 1596.00,
  "timestamp": 1724183921098,
  "signature": "a8fbc923e819b9..." // SHA256 signature using your Secret Key
}`}</pre>
                    </div>
                  </div>

                  {/* Next.js / Node.js Implementation Example */}
                  <div className="bg-[#080a10] border border-slate-800 rounded-2xl p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider">Example Next.js / Node.js Callback Handler</h4>
                      <button
                        onClick={() => {
                          const code = `// app/api/callback/route.ts (Next.js App Router)
import { NextResponse } from "next/server";
import { db } from "@/lib/db"; // Your database client

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { serial_number, member_account, bet_amount, win_amount } = body;

    // 1. Idempotency check (prevent double processing)
    const existing = await db.transaction.findUnique({ where: { serialNumber: serial_number } });
    if (existing) {
      return NextResponse.json({ status: 1, code: 0, msg: "Already processed" });
    }

    // 2. Settle player wallet in atomic database transaction
    const user = await db.user.findUnique({ where: { id: member_account } });
    if (!user) return NextResponse.json({ status: 0, code: 404, error: "User not found" });

    const newBalance = user.balance - bet_amount + win_amount;
    await db.user.update({
      where: { id: user.id },
      data: { balance: newBalance },
    });

    // 3. Record audit transaction
    await db.transaction.create({
      data: {
        userId: user.id,
        serialNumber: serial_number,
        amount: win_amount - bet_amount,
        balanceAfter: newBalance,
      },
    });

    // 4. Return success response to Studio
    return NextResponse.json({
      status: 1,
      code: 0,
      msg: "Settlement successful",
      data: { new_balance: newBalance }
    });
  } catch (err: any) {
    return NextResponse.json({ status: 0, code: 500, error: err.message }, { status: 500 });
  }
}`;
                          copyText(code, "webhook_sample");
                        }}
                        className="bg-slate-800 hover:bg-slate-700 text-gray-300 hover:text-white px-2.5 py-1 rounded text-xs font-mono flex items-center gap-1"
                      >
                        {copiedSnippet === "webhook_sample" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedSnippet === "webhook_sample" ? "Copied" : "Copy Code"}</span>
                      </button>
                    </div>

                    <div className="bg-[#06080e] p-4 rounded-xl border border-slate-800 font-mono text-xs text-gray-300 overflow-x-auto">
                      <pre>{`// app/api/callback/route.ts (Next.js App Router)
import { NextResponse } from "next/server";
import { db } from "@/lib/db"; // Your database client

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { serial_number, member_account, bet_amount, win_amount } = body;

    // 1. Idempotency check (prevent double processing)
    const existing = await db.transaction.findUnique({ where: { serialNumber: serial_number } });
    if (existing) {
      return NextResponse.json({ status: 1, code: 0, msg: "Already processed" });
    }

    // 2. Settle player wallet in atomic database transaction
    const user = await db.user.findUnique({ where: { id: member_account } });
    if (!user) return NextResponse.json({ status: 0, code: 404, error: "User not found" });

    const newBalance = user.balance - bet_amount + win_amount;
    await db.user.update({
      where: { id: user.id },
      data: { balance: newBalance },
    });

    // 3. Return success response to Studio
    return NextResponse.json({
      status: 1,
      code: 0,
      msg: "Settlement successful",
      data: { new_balance: newBalance }
    });
  } catch (err: any) {
    return NextResponse.json({ status: 0, code: 500, error: err.message }, { status: 500 });
  }
}`}</pre>
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION 4: GAMES CATALOG API */}
              {docSection === "games" && (
                <div className="mt-6 space-y-6">
                  <div className="flex items-center gap-2">
                    <span className="bg-blue-500/20 text-blue-400 border border-blue-500/40 text-xs font-mono font-bold px-2.5 py-1 rounded-lg">
                      GET
                    </span>
                    <code className="text-sm text-white font-mono font-bold">/api/v1/games</code>
                  </div>
                  <p className="text-xs text-gray-400">
                    Returns the list of all available games, categories, math curves, volatility, and direct thumbnail assets.
                  </p>

                  <div className="bg-[#06080e] p-5 rounded-2xl border border-slate-800 font-mono text-xs text-gray-300 overflow-x-auto">
                    <pre>{`curl -X GET https://studio.yourdomain.com/api/v1/games \\
  -H "Authorization: Bearer ${clients[0]?.tokens[0]?.token || "rgs_live_YOUR_STUDIO_API_TOKEN"}"`}</pre>
                  </div>

                  <div className="bg-[#080a10] border border-slate-800 rounded-2xl p-5 space-y-3">
                    <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider">Catalog Response (JSON)</h4>
                    <div className="bg-[#06080e] p-4 rounded-xl border border-slate-800 font-mono text-xs text-cyan-300 overflow-x-auto">
                      <pre>{`{
  "status": 1,
  "code": 0,
  "total": 6,
  "data": [
    {
      "game_uid": "royal_coinflip",
      "name": "Coin Flip Royale",
      "category": "Originals / Table",
      "rtp": 98.0,
      "max_multiplier": "100x",
      "status": "ACTIVE"
    },
    {
      "game_uid": "royal_andarbahar",
      "name": "Andar Bahar Live",
      "category": "Indian Live Felt",
      "rtp": 97.5,
      "max_multiplier": "2.0x",
      "status": "ACTIVE"
    },
    {
      "game_uid": "royal_chickencross",
      "name": "Chicken Road Cross",
      "category": "Crash / Stepper",
      "rtp": 96.8,
      "max_multiplier": "250x",
      "status": "ACTIVE"
    },
    {
      "game_uid": "royal_aviator",
      "name": "Aviator Royale Crash",
      "category": "Crash / Flash",
      "rtp": 97.0,
      "max_multiplier": "1000x",
      "status": "ACTIVE"
    },
    {
      "game_uid": "royal_mines",
      "name": "Mines Gold",
      "category": "Originals / Instant",
      "rtp": 98.2,
      "max_multiplier": "500x",
      "status": "ACTIVE"
    },
    {
      "game_uid": "royal_roulette",
      "name": "European Roulette",
      "category": "Table / Wheel",
      "rtp": 97.3,
      "max_multiplier": "36x",
      "status": "ACTIVE"
    }
  ]
}`}</pre>
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION 5: LIVE TESTER PLAYGROUND */}
              {docSection === "tester" && (
                <div className="mt-6 space-y-6">
                  <div className="border-b border-slate-800 pb-4">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>Live REST API Launch Runner</span>
                    </h4>
                    <p className="text-xs text-gray-400 mt-1">
                      Execute a real-time authenticated launch API call right from this admin portal to test session creation.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-gray-300 block mb-1">Player ID (user_id)</label>
                      <input
                        type="text"
                        value={testerPlayerId}
                        onChange={(e) => setTesterPlayerId(e.target.value)}
                        className="w-full bg-[#07090e] border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-300 block mb-1">Select Game (game_uid)</label>
                      <select
                        value={testerGameUid}
                        onChange={(e) => setTesterGameUid(e.target.value)}
                        className="w-full bg-[#07090e] border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                      >
                        <option value="royal_coinflip">🪙 Coin Flip Royale (royal_coinflip)</option>
                        <option value="royal_andarbahar">🎴 Andar Bahar Live (royal_andarbahar)</option>
                        <option value="royal_chickencross">🐔 Chicken Road Cross (royal_chickencross)</option>
                        <option value="royal_aviator">✈️ Aviator Royale Crash (royal_aviator)</option>
                        <option value="royal_mines">💣 Mines Gold (royal_mines)</option>
                        <option value="royal_roulette">🎡 European Roulette (royal_roulette)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-300 block mb-1">Starting Player Balance</label>
                      <input
                        type="number"
                        value={testerBalance}
                        onChange={(e) => setTesterBalance(e.target.value)}
                        className="w-full bg-[#07090e] border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-300 block mb-1">Currency</label>
                      <input
                        type="text"
                        value={testerCurrency}
                        onChange={(e) => setTesterCurrency(e.target.value)}
                        className="w-full bg-[#07090e] border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      onClick={handleTestLaunchAPI}
                      disabled={testerLoading}
                      className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black text-xs font-extrabold shadow-lg shadow-amber-500/20 flex items-center gap-2"
                    >
                      {testerLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
                      <span>{testerLoading ? "Generating Launch Session..." : "Execute Launch API Test"}</span>
                    </button>
                  </div>

                  {testerResult && (
                    <div className="bg-[#080a10] border border-amber-500/30 rounded-2xl p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                          <Check className="w-4 h-4 text-emerald-400" />
                          <span>Live Response Output</span>
                        </span>
                        {testerResult?.data?.launch_url && (
                          <a
                            href={testerResult.data.launch_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-amber-400 hover:underline flex items-center gap-1 font-mono font-bold"
                          >
                            <span>Open Game Session</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>

                      <div className="bg-[#06080e] p-4 rounded-xl border border-slate-800 font-mono text-xs text-emerald-400 overflow-x-auto">
                        <pre>{JSON.stringify(testerResult, null, 2)}</pre>
                      </div>
                    </div>
                  )}
                </div>
              )}
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

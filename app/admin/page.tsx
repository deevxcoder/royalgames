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
  Minus,
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
  Wallet,
  CheckCircle2,
  XCircle,
  X,
  Send,
  Menu,
  ChevronRight,
  Circle,
  BarChart3,
  Download,
  Calendar,
  Filter,
  ShieldAlert,
  Power,
  AlertTriangle,
} from "lucide-react";
import { STUDIO_GAMES } from "@/lib/gamesCatalog";

export default function StudioAdminPortal() {
  const [authChecking, setAuthChecking] = useState(true);
  const [adminUser, setAdminUser] = useState<any>(null);
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("studio1234");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  // Tabs: overview, clients, deposits, rounds, docs, reports, rtp
  const [activeTab, setActiveTab] = useState<"overview" | "clients" | "deposits" | "rounds" | "docs" | "reports" | "rtp">("clients");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // State
  const [clients, setClients] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [rounds, setRounds] = useState<any[]>([]);
  const [deposits, setDeposits] = useState<any[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);

  // Reports State
  const [reportData, setReportData] = useState<any>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [selectedReportOperator, setSelectedReportOperator] = useState<string>("all");
  const [selectedReportDateRange, setSelectedReportDateRange] = useState<string>("all");
  const [selectedReportGame, setSelectedReportGame] = useState<string>("all");

  // RTP & House Edge Settings State
  const [rtpSettings, setRtpSettings] = useState<any>(null);
  const [rtpLoading, setRtpLoading] = useState(false);
  const [globalRtpInput, setGlobalRtpInput] = useState<number>(96.5);
  const [gameRtpInputs, setGameRtpInputs] = useState<Record<string, number>>({});
  const [savingRtp, setSavingRtp] = useState(false);
  const [rtpSuccessMsg, setRtpSuccessMsg] = useState<string | null>(null);
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
  const [revealedSecrets, setRevealedSecrets] = useState<{ [id: string]: boolean }>({});

  // Balance Adjustment Modal State
  const [adjustModal, setAdjustModal] = useState<{ open: boolean; client: any | null; type: "CREDIT" | "DEBIT" }>({
    open: false,
    client: null,
    type: "CREDIT",
  });
  const [adjAmount, setAdjAmount] = useState("10000");
  const [adjReason, setAdjReason] = useState("");
  const [adjLoading, setAdjLoading] = useState(false);

  // Delete Client Modal State
  const [deleteModal, setDeleteModal] = useState<{
    open: boolean;
    client: any | null;
    deleting: boolean;
  }>({
    open: false,
    client: null,
    deleting: false,
  });

  // Reject deposit modal
  const [rejectModalId, setRejectModalId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectLoading, setRejectLoading] = useState(false);

  // Docs state
  const [docLang, setDocLang] = useState<"curl" | "node" | "php" | "python">("curl");
  const [docSection, setDocSection] = useState<"architecture" | "launch" | "callback" | "games" | "tester">("architecture");
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);

  // Interactive tester state
  const [testerPlayerId, setTesterPlayerId] = useState("player_demo_9921");
  const [testerGameUid, setTesterGameUid] = useState("royal_skyrush");
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
  const [newClientPassword, setNewClientPassword] = useState("Royal@2026!");
  const [showNewClientPassword, setShowNewClientPassword] = useState(true);
  const [newClientCallback, setNewClientCallback] = useState("http://localhost:3001/api/v1/round/resolve");
  const [newClientIpWhitelist, setNewClientIpWhitelist] = useState("");
  const [creatingClient, setCreatingClient] = useState(false);

  // Created Success Modal
  const [createdSuccessModal, setCreatedSuccessModal] = useState<{
    open: boolean;
    credentials: {
      name: string;
      email: string;
      password: string;
      token: string;
      secretKey: string;
      callbackUrl: string;
      portalUrl: string;
      emailResult?: any;
    } | null;
  }>({ open: false, credentials: null });

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
      const [clientsRes, statsRes, roundsRes, depRes] = await Promise.all([
        fetch("/api/admin/clients"),
        fetch("/api/admin/stats"),
        fetch("/api/admin/rounds"),
        fetch("/api/admin/deposits"),
      ]);

      const [cData, sData, rData, dData] = await Promise.all([
        clientsRes.json(),
        statsRes.json(),
        roundsRes.json(),
        depRes.json(),
      ]);

      if (cData.clients) setClients(cData.clients);
      if (sData.clientsCount !== undefined) setStats(sData);
      if (rData.rounds) setRounds(rData.rounds);
      if (dData.deposits) setDeposits(dData.deposits);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingClients(false);
    }
  }, [adminUser]);

  // Fetch Reports
  const fetchReports = useCallback(async () => {
    if (!adminUser) return;
    try {
      setReportLoading(true);
      const params = new URLSearchParams();
      if (selectedReportOperator) params.set("operatorId", selectedReportOperator);
      if (selectedReportDateRange) params.set("dateRange", selectedReportDateRange);
      if (selectedReportGame) params.set("gameUid", selectedReportGame);

      const res = await fetch(`/api/admin/reports?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setReportData(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setReportLoading(false);
    }
  }, [adminUser, selectedReportOperator, selectedReportDateRange, selectedReportGame]);

  useEffect(() => {
    if (adminUser) {
      fetchReports();
    }
  }, [adminUser, fetchReports]);

  // Fetch RTP Settings
  const fetchRtpSettings = useCallback(async () => {
    if (!adminUser) return;
    try {
      setRtpLoading(true);
      const res = await fetch("/api/admin/rtp-settings");
      const data = await res.json();
      if (data.success) {
        setRtpSettings(data);
        setGlobalRtpInput(data.globalRtp);
        const map: Record<string, number> = {};
        data.games.forEach((g: any) => {
          map[g.gameUid] = g.liveRtp;
        });
        setGameRtpInputs(map);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setRtpLoading(false);
    }
  }, [adminUser]);

  useEffect(() => {
    if (adminUser) {
      fetchRtpSettings();
    }
  }, [adminUser, fetchRtpSettings]);

  const handleApplyGlobalRtp = async () => {
    try {
      setSavingRtp(true);
      setRtpSuccessMsg(null);
      const res = await fetch("/api/admin/rtp-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "SET_GLOBAL_ALL", globalRtp: globalRtpInput }),
      });
      const data = await res.json();
      if (data.success) {
        setRtpSuccessMsg(
          `Global RTP of ${globalRtpInput}% (Casino Margin: ${(100 - globalRtpInput).toFixed(2)}%) applied to all 10 games!`
        );
        fetchRtpSettings();
        setTimeout(() => setRtpSuccessMsg(null), 4000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingRtp(false);
    }
  };

  const handleSaveSingleGameRtp = async (gameUid: string) => {
    try {
      setSavingRtp(true);
      setRtpSuccessMsg(null);
      const targetRtp = gameRtpInputs[gameUid] || 96.5;
      const res = await fetch("/api/admin/rtp-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "SET_SINGLE_GAME", gameUid, rtp: targetRtp }),
      });
      const data = await res.json();
      if (data.success) {
        setRtpSuccessMsg(
          `Game RTP updated to ${targetRtp}% (House Edge: ${(100 - targetRtp).toFixed(2)}%) successfully!`
        );
        fetchRtpSettings();
        setTimeout(() => setRtpSuccessMsg(null), 4000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingRtp(false);
    }
  };

  // Export CSV
  const exportReportCSV = () => {
    if (!reportData?.operatorBreakdown) return;
    const headers =
      "Operator Name,Currency,Prepaid Balance,GGR Rate (%),Total Rounds,Active Players,Turnover (INR),Payout (INR),Net GGR (INR),Studio Revenue Share (INR),Hold Margin (%)\n";
    const rows = reportData.operatorBreakdown
      .map(
        (o: any) =>
          `"${o.name}","${o.currency}",${o.balance},${o.ggrRate}%,${o.roundsCount},${o.playersCount},${o.turnover},${o.payout},${o.ggr},${o.studioFee},${o.margin}%`
      )
      .join("\n");

    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Royal_Games_Report_${selectedReportOperator}_${selectedReportDateRange}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    if (adminUser) {
      fetchData();
      const interval = setInterval(() => {
        fetchData();
      }, 4000);
      return () => clearInterval(interval);
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
          password: newClientPassword,
          callbackUrl: newClientCallback,
          ipWhitelist: newClientIpWhitelist || null,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setNewClientModalOpen(false);
        setCreatedSuccessModal({
          open: true,
          credentials: {
            name: newClientName,
            email: newClientEmail,
            password: data.password || newClientPassword,
            token: data.initialKey?.token || "",
            secretKey: data.initialKey?.secretKey || "",
            callbackUrl: newClientCallback,
            portalUrl: typeof window !== "undefined" ? `${window.location.origin}/portal/login` : "http://localhost:3002/portal/login",
            emailResult: data.emailResult,
          },
        });
        setNewClientName("");
        setNewClientEmail("");
        setNewClientPassword(`Royal@${Math.floor(1000 + Math.random() * 9000)}!`);
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
  const handleRevokeKey = async (clientId: string, keyId: string) => {
    if (!confirm("Are you sure you want to revoke this Studio API key? Aggregator requests using it will immediately fail.")) return;
    try {
      // Optimistic update
      setClients((prev) =>
        prev.map((c) =>
          c.id === clientId
            ? { ...c, tokens: c.tokens.filter((t: any) => t.id !== keyId) }
            : c
        )
      );
      const res = await fetch(`/api/admin/keys?id=${keyId}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        fetchData();
      } else {
        alert(data.error || "Failed to revoke key");
        fetchData();
      }
    } catch (e: any) {
      alert(e.message);
      fetchData();
    }
  };

  // Toggle Client Status (ACTIVE <-> SUSPENDED)
  const handleToggleStatus = async (client: any) => {
    const newStatus = client.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    const confirmMsg =
      newStatus === "SUSPENDED"
        ? `Are you sure you want to SUSPEND ${client.name}? Live game sessions for this operator will be temporarily paused.`
        : `Activate ${client.name}? Live game sessions will resume immediately.`;
    if (!confirm(confirmMsg)) return;

    try {
      // Optimistic update
      setClients((prev) =>
        prev.map((c) => (c.id === client.id ? { ...c, status: newStatus } : c))
      );
      const res = await fetch("/api/admin/clients", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: client.id, status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.error || "Failed to update status");
        fetchData();
      }
    } catch (e: any) {
      alert(e.message);
      fetchData();
    }
  };

  // Delete Entire Client / Operator
  const handleDeleteClient = async () => {
    if (!deleteModal.client) return;
    const clientId = deleteModal.client.id;
    setDeleteModal((prev) => ({ ...prev, deleting: true }));
    try {
      const res = await fetch(`/api/admin/clients?id=${clientId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        // Immediate optimistic UI removal
        setClients((prev) => prev.filter((c) => c.id !== clientId));
        setDeleteModal({ open: false, client: null, deleting: false });
        fetchData();
      } else {
        alert(data.error || "Failed to delete client");
        setDeleteModal((prev) => ({ ...prev, deleting: false }));
      }
    } catch (e: any) {
      alert(e.message || "Failed to delete client");
      setDeleteModal((prev) => ({ ...prev, deleting: false }));
    }
  };

  // Deposit Approval
  const handleApproveDeposit = async (depositId: string) => {
    if (!confirm("Are you sure you want to approve this deposit and credit the client's GGR balance?")) return;
    try {
      const res = await fetch("/api/admin/deposits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          depositId,
          action: "APPROVE",
          adminNotes: "Verified and approved by Studio Super Admin",
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(data.message);
        fetchData();
      } else {
        alert(data.error || "Failed to approve deposit");
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Deposit Rejection
  const handleRejectDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectModalId) return;
    setRejectLoading(true);
    try {
      const res = await fetch("/api/admin/deposits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          depositId: rejectModalId,
          action: "REJECT",
          adminNotes: rejectReason.trim() || "Payment not verified / invalid UTR",
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setRejectModalId(null);
        setRejectReason("");
        fetchData();
      } else {
        alert(data.error || "Failed to reject deposit");
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setRejectLoading(false);
    }
  };

  // Client Balance Adjustment
  const handleAdjustBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustModal.client) return;
    setAdjLoading(true);
    const numericAmount = Math.abs(Number(adjAmount)) * (adjustModal.type === "CREDIT" ? 1 : -1);

    try {
      const res = await fetch("/api/admin/operators", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ADJUST_BALANCE",
          targetOperatorId: adjustModal.client.id,
          amount: numericAmount,
          reason: adjReason.trim() || `Manual Admin Balance ${adjustModal.type}`,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAdjustModal({ open: false, client: null, type: "CREDIT" });
        setAdjAmount("10000");
        setAdjReason("");
        fetchData();
      } else {
        alert(data.error || "Failed to adjust balance");
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setAdjLoading(false);
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
          game_uid: testerGameUid || "royal_skyrush",
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
  const pendingDepositsCount = deposits.filter((d: any) => d.status === "PENDING").length;

  const navItems = [
    {
      group: "OPERATOR MANAGEMENT",
      items: [
        { id: "clients", label: "B2B Clients & Keys", desc: "API tokens & IP whitelist", icon: Key, badge: clients.length ? `${clients.length}` : null, badgeColor: "bg-slate-800 text-amber-400" },
        {
          id: "deposits",
          label: "Deposit Approvals",
          desc: "Prepaid GGR recharges",
          icon: Wallet,
          badge: pendingDepositsCount > 0 ? `${pendingDepositsCount} PENDING` : null,
          badgeColor: "bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse",
        },
        { id: "reports", label: "Client & GGR Reports", desc: "Operator financial breakdown", icon: BarChart3, badge: "PRO", badgeColor: "bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono" },
        { id: "overview", label: "Studio Overview", desc: "Turnover, GGR & metrics", icon: Activity, badge: null },
      ],
    },
    {
      group: "ENGINE & AUDIT STREAM",
      items: [
        { id: "rtp", label: "Game RTP & GGR Settings", desc: "House edge & hold margin control", icon: Sliders, badge: "MASTER", badgeColor: "bg-purple-500/20 text-purple-300 border border-purple-500/30 font-mono" },
        { id: "rounds", label: "Round Audit Ledger", desc: "Real-time round telemetry", icon: Layers, badge: "LIVE", badgeColor: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono" },
        { id: "docs", label: "API Integration Docs", desc: "REST specs & cURL SDKs", icon: Globe, badge: null },
      ],
    },
  ];

  const currentTabLabel =
    activeTab === "clients"
      ? "B2B Clients & API Keys"
      : activeTab === "deposits"
      ? "Deposit Approvals"
      : activeTab === "reports"
      ? "Client & Aggregator GGR Reports"
      : activeTab === "rtp"
      ? "Game RTP & GGR Margin Control"
      : activeTab === "overview"
      ? "Studio Overview & Metrics"
      : activeTab === "rounds"
      ? "Round Audit Stream Ledger"
      : "B2B API Integration Documentation";

  return (
    <div className="min-h-screen bg-[#06080e] text-slate-100 flex font-sans selection:bg-amber-500 selection:text-black">
      {/* Mobile Drawer Backdrop */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Left Sidebar (Enterprise Grade - Fixed Full Height Sticky) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-[#090d18] border-r border-slate-800/80 flex flex-col justify-between transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full justify-between min-h-0">
          {/* Top Header & Telemetry */}
          <div className="shrink-0">
            {/* Studio Brand Header */}
            <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 p-[2px] shadow-xl shadow-amber-500/20 flex items-center justify-center">
                  <div className="w-full h-full bg-[#07090e] rounded-[14px] flex items-center justify-center text-xl">
                    👑
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h1 className="text-sm font-black text-white tracking-wider">ROYAL GAMES</h1>
                    <span className="text-[9px] font-mono font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 px-1.5 py-0.2 rounded-md">
                      RGS
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-400 font-medium">B2B Master Admin Engine</p>
                </div>
              </div>

              <button
                onClick={() => setMobileSidebarOpen(false)}
                className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Engine Telemetry Strip */}
            <div className="px-5 py-3 bg-[#06080e]/60 border-b border-slate-800/60 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-[11px] font-mono font-bold text-emerald-400">ONLINE</span>
              </div>
              <span className="text-[10px] font-mono text-gray-400">
                {clients.length} Clients • {STUDIO_GAMES.length} HTML5 Games
              </span>
            </div>
          </div>

          {/* Nav Links (Scrollable Section) */}
          <div className="flex-1 overflow-y-auto min-h-0 px-3 py-4 space-y-6">
            {navItems.map((group, gIdx) => (
              <div key={gIdx} className="space-y-1.5">
                <div className="px-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider font-mono">
                  {group.group}
                </div>
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id as any);
                          setMobileSidebarOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left transition-all group cursor-pointer ${
                          isActive
                            ? "bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-black font-extrabold shadow-lg shadow-amber-500/20"
                            : "text-gray-300 hover:text-white hover:bg-slate-800/60"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Icon
                            className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                              isActive ? "text-black stroke-[2.5]" : "text-amber-400"
                            }`}
                          />
                          <div className="truncate">
                            <div className="text-xs font-bold leading-tight">{item.label}</div>
                            <div
                              className={`text-[10px] leading-tight truncate ${
                                isActive ? "text-black/70 font-semibold" : "text-gray-500"
                              }`}
                            >
                              {item.desc}
                            </div>
                          </div>
                        </div>

                        {item.badge && (
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-md font-mono shrink-0 ml-2 ${
                              isActive ? "bg-black/20 text-black border border-black/30" : item.badgeColor
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Direct Link Section */}
            <div className="space-y-1.5 pt-2 border-t border-slate-800/60">
              <div className="px-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider font-mono">
                EXTERNAL LINK
              </div>
              <Link
                href="/"
                target="_blank"
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-gray-300 hover:text-white hover:bg-slate-800/60 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <Play className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                  <div>
                    <div className="text-xs font-bold text-white">Live Game Suite</div>
                    <div className="text-[10px] text-gray-500">Play full HTML5 catalog</div>
                  </div>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-gray-500 group-hover:text-amber-400" />
              </Link>
            </div>
          </div>

          {/* Admin User Footer Card (Pinned at Screen Bottom) */}
          <div className="shrink-0 p-4 border-t border-slate-800/80 bg-[#07090e]/95 mt-auto">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-sm font-black text-amber-400">
                  👑
                </div>
                <div className="truncate">
                  <div className="text-xs font-bold text-white truncate">{adminUser?.username || "admin"}</div>
                  <div className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Superadmin
                  </div>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="p-2 rounded-xl bg-rose-950/30 hover:bg-rose-900/50 border border-rose-500/30 text-rose-300 hover:text-white transition-colors cursor-pointer"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area (Right of Sidebar) */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top App Header */}
        <header className="h-16 border-b border-slate-800/80 bg-[#090d18]/80 backdrop-blur-md px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-[#06080e] border border-slate-800 text-gray-300 hover:text-white"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-gray-400">
                <span>RGS Admin</span>
                <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
                <span className="text-amber-400 font-bold">{currentTabLabel}</span>
              </div>
              <h2 className="text-sm sm:text-base font-black text-white tracking-tight leading-tight">
                {currentTabLabel}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Live Telemetry Pulse */}
            <div className="hidden sm:flex items-center gap-2 bg-[#06080e] border border-emerald-500/20 px-3 py-1.5 rounded-xl text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-300 font-bold text-[11px]">Live Sync (4s)</span>
            </div>

            <button
              onClick={fetchData}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-gray-300 hover:text-white transition-colors cursor-pointer"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loadingClients ? "animate-spin text-amber-400" : ""}`} />
            </button>

            <Link
              href="/"
              target="_blank"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/30 hover:border-amber-400 text-xs font-bold text-amber-300 hover:text-amber-200 transition-colors"
            >
              <span>Showcase</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
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
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                      <div className="flex items-start sm:items-center gap-3.5">
                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold shrink-0 ${
                          client.status === "ACTIVE"
                            ? "bg-amber-500/10 border border-amber-500/30 text-amber-400"
                            : "bg-rose-500/10 border border-rose-500/30 text-rose-400"
                        }`}>
                          <Users className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-black text-white">{client.name}</h3>
                            {client.isAdmin && (
                              <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40">
                                MASTER ADMIN
                              </span>
                            )}
                            <span
                              className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1 ${
                                client.status === "ACTIVE"
                                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                  : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${client.status === "ACTIVE" ? "bg-emerald-400 animate-pulse" : "bg-rose-400"}`} />
                              <span>{client.status}</span>
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400 mt-1 font-mono">
                            <span>{client.email}</span>
                            {client.callbackUrl && (
                              <span className="text-gray-500 text-[11px] truncate max-w-xs sm:max-w-md">
                                Callback: <code className="text-slate-400">{client.callbackUrl}</code>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Header Actions */}
                      <div className="flex flex-wrap items-center gap-2.5">
                        <div className="text-right mr-2 hidden sm:block">
                          <span className="text-[10px] text-gray-400 uppercase font-bold block">Lifetime Activity</span>
                          <span className="text-xs font-mono text-amber-400 font-bold">
                            {client.sessionsCount} Sessions • {client.roundsCount} Rounds
                          </span>
                        </div>

                        {/* Status Toggle Button */}
                        <button
                          onClick={() => handleToggleStatus(client)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                            client.status === "ACTIVE"
                              ? "bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/30 text-rose-300"
                              : "bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-300"
                          }`}
                          title={client.status === "ACTIVE" ? "Suspend Client" : "Activate Client"}
                        >
                          <Power className="w-3.5 h-3.5" />
                          <span>{client.status === "ACTIVE" ? "Suspend" : "Activate"}</span>
                        </button>

                        {/* New API Key Button */}
                        <button
                          onClick={() => handleGenerateKey(client.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-amber-300 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>New Key</span>
                        </button>

                        {/* Delete Entire Client Button */}
                        {!client.isAdmin && (
                          <button
                            onClick={() => setDeleteModal({ open: true, client, deleting: false })}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-xs font-bold text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
                            title="Delete this client and remove all keys"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete Client</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Prepaid Balance & GGR Controls */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#080a10] p-3.5 rounded-xl border border-slate-800 text-xs">
                      <div className="flex items-center gap-4">
                        <div>
                          <span className="text-[10px] text-gray-400 uppercase font-bold block">Prepaid GGR Balance</span>
                          <span className="text-sm font-bold text-emerald-400 font-mono">
                            ₹{Number(client.balance || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="border-l border-slate-800 pl-4">
                          <span className="text-[10px] text-gray-400 uppercase font-bold block">GGR Hold Share</span>
                          <span className="text-xs font-bold text-purple-300 font-mono">{client.ggrRate || 10.0}% Hold</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setAdjustModal({ open: true, client, type: "CREDIT" });
                            setAdjAmount("10000");
                            setAdjReason("Manual Studio Balance Recharge");
                          }}
                          className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
                        >
                          <Plus className="w-3.5 h-3.5 stroke-[3]" />
                          <span>+ Add Credit</span>
                        </button>
                        <button
                          onClick={() => {
                            setAdjustModal({ open: true, client, type: "DEBIT" });
                            setAdjAmount("5000");
                            setAdjReason("Manual Balance Adjustment");
                          }}
                          className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/40 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
                        >
                          <Minus className="w-3.5 h-3.5 stroke-[3]" />
                          <span>- Deduct Balance</span>
                        </button>
                      </div>
                    </div>

                    {/* Active API Keys Table */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                          Assigned Studio API Keys & Secrets ({client.tokens?.length || 0})
                        </span>
                      </div>

                      {!client.tokens || client.tokens.length === 0 ? (
                        <div className="bg-[#080a10] border border-dashed border-slate-800 rounded-xl p-4 text-center flex flex-col sm:flex-row items-center justify-between gap-3">
                          <p className="text-xs text-gray-400">
                            No active API keys found for this client. API requests cannot authenticate without a key.
                          </p>
                          <button
                            onClick={() => handleGenerateKey(client.id)}
                            className="text-xs font-bold text-amber-400 hover:text-amber-300 underline shrink-0"
                          >
                            + Generate API Key Now
                          </button>
                        </div>
                      ) : (
                        client.tokens.map((token: any) => {
                          const isSecretVisible = revealedSecrets[token.id];
                          return (
                            <div
                              key={token.id}
                              className="bg-[#080a10] border border-slate-800/80 rounded-xl p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4"
                            >
                              <div className="space-y-1.5 flex-1 min-w-0">
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
                                    <span className="text-amber-400 font-bold select-all">{token.token}</span>
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
                                    <span className="text-emerald-400 select-all">
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
                                onClick={() => handleRevokeKey(client.id, token.id)}
                                className="self-end md:self-center p-2 text-gray-500 hover:text-rose-400 transition-colors flex items-center gap-1 text-xs font-semibold"
                                title="Revoke this API Key"
                              >
                                <Trash2 className="w-4 h-4" />
                                <span className="md:hidden">Revoke Key</span>
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB: DEPOSIT APPROVALS */}
        {activeTab === "deposits" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-[#0e1320] via-[#0f172a] to-[#0e1320] border border-amber-500/30 rounded-3xl p-6 shadow-xl">
              <div>
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-emerald-400" />
                  <span>Manual Deposit Approval Queue & GGR Credits</span>
                </h2>
                <p className="text-xs text-gray-400 mt-1 max-w-2xl">
                  Review client deposit requests, verify the UTR / TxHash reference against your bank/crypto wallet, and 1-click Approve to credit their GGR balance.
                </p>
              </div>
            </div>

            <div className="bg-[#0b0f19] border border-slate-800 rounded-3xl p-6 shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Client Deposit Requests ({deposits.length})</span>
                </h3>
              </div>

              {deposits.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs">
                  No deposit requests submitted yet by operators.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400">
                        <th className="pb-3">Client / Operator</th>
                        <th className="pb-3">Amount</th>
                        <th className="pb-3">Method</th>
                        <th className="pb-3">UTR / TxHash Reference</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3">Requested At</th>
                        <th className="pb-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {deposits.map((dep) => (
                        <tr key={dep.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-3">
                            <div className="font-bold text-white">{dep.operator?.companyName || "Unknown"}</div>
                            <div className="text-[10px] text-slate-500 font-mono">{dep.operator?.email}</div>
                          </td>
                          <td className="py-3 font-mono font-bold text-emerald-400 text-sm">
                            ₹{Number(dep.amount).toLocaleString()}
                          </td>
                          <td className="py-3 font-semibold text-slate-300">{dep.paymentMethod}</td>
                          <td className="py-3 font-mono text-slate-300 select-all font-semibold">
                            {dep.transactionRef}
                          </td>
                          <td className="py-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                dep.status === "APPROVED"
                                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                  : dep.status === "REJECTED"
                                  ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                                  : "bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse"
                              }`}
                            >
                              {dep.status}
                            </span>
                          </td>
                          <td className="py-3 text-slate-500 text-[11px]">
                            {new Date(dep.createdAt).toLocaleString()}
                          </td>
                          <td className="py-3 text-right">
                            {dep.status === "PENDING" ? (
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleApproveDeposit(dep.id)}
                                  className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1 shadow-md shadow-emerald-500/20 transition-all"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Approve & Credit</span>
                                </button>
                                <button
                                  onClick={() => {
                                    setRejectModalId(dep.id);
                                    setRejectReason("");
                                  }}
                                  className="px-2.5 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30 rounded-lg text-xs font-bold transition-all"
                                >
                                  Reject
                                </button>
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-500">{dep.adminNotes || "Settled"}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
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

        {/* TAB 5: B2B INTEGRATION DOCS (SINGLE CONTINUOUS SCROLLABLE VIEW) */}
        {activeTab === "docs" && (
          <div className="space-y-6 max-w-6xl mx-auto">
            {/* Top Banner & Quick Actions */}
            <div className="bg-[#0b0f19] border border-amber-500/30 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="bg-amber-500/20 text-amber-400 border border-amber-500/40 text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase">
                    Official B2B Spec v1.0
                  </span>
                  <span className="text-xs text-gray-400 font-mono">• Updated 2026</span>
                </div>
                <h3 className="text-xl font-black text-white flex items-center gap-2.5 mt-1.5">
                  <Globe className="w-6 h-6 text-amber-400" />
                  <span>Casino Site Integration — Master API Documentation</span>
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  Complete single-page guide for Casino Operators, White-Labels, and Aggregators to integrate Royal Games Studio.
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => {
                    const token = clients[0]?.tokens[0]?.token || "rgs_live_YOUR_STUDIO_API_TOKEN";
                    const fullMd = `# 👑 ROYAL GAMES STUDIO — B2B CASINO INTEGRATION MASTER SPECIFICATION

## 1. Architecture Overview
1. **Launch Request**: Casino backend calls \`POST /api/v1/launch\` with player ID & current balance.
2. **Iframe Embed**: Casino embeds the returned \`launch_url\` in an iframe or opens in a webview/new tab.
3. **Webhook Settlement**: When a game round finishes, Studio sends an authoritative \`POST\` webhook to your \`callback_url\` to credit/debit player wallet.

---

## 2. Authentication & Base URL
- **Base URL**: \`https://studio.yourdomain.com/api/v1\`
- **Authentication**: Bearer Token in HTTP Authorization Header
\`\`\`http
Authorization: Bearer ${token}
Content-Type: application/json
\`\`\`

---

## 3. Game Launch Endpoint (POST /api/v1/launch)
Generates an authenticated game session launch URL.

### Request Body (JSON):
\`\`\`json
{
  "user_id": "player_12345",
  "game_uid": "royal_skyrush",
  "balance": 1500.00,
  "currency": "INR",
  "callback_url": "https://your-casino.com/api/callback",
  "return_url": "https://your-casino.com/lobby"
}
\`\`\`

### Request Parameters:
| Field | Type | Required | Description |
|---|---|---|---|
| \`user_id\` | string | Yes | Unique player ID on your casino database |
| \`game_uid\` | string | Yes | Game identifier (e.g. royal_skyrush, royal_cricketblast) |
| \`balance\` | number | Yes | Current real-money wallet balance |
| \`currency\` | string | No | 3-letter currency code (Default: INR) |
| \`callback_url\` | string | Yes | Your casino webhook endpoint for settlement |
| \`return_url\` | string | No | URL to redirect player on game exit |

### Success Response (200 OK):
\`\`\`json
{
  "status": 1,
  "code": 0,
  "msg": "Royal Studio game session created successfully",
  "data": {
    "session_id": "sess_39c1b827e01...",
    "game_uid": "royal_skyrush",
    "game_name": "Sky Rush",
    "provider": "Royal Games Studio",
    "launch_url": "https://studio.yourdomain.com/play/sess_39c1b827e01...?token=eyJhbGciOi...",
    "expires_at": "2026-08-21T02:30:00.000Z"
  }
}
\`\`\`

---

## 4. Code Examples for Launching Game

### cURL:
\`\`\`bash
curl -X POST https://studio.yourdomain.com/api/v1/launch \\
  -H "Authorization: Bearer ${token}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "user_id": "player_12345",
    "game_uid": "royal_skyrush",
    "balance": 1500.00,
    "currency": "INR",
    "callback_url": "https://your-casino.com/api/callback",
    "return_url": "https://your-casino.com/lobby"
  }'
\`\`\`

### Node.js / TypeScript:
\`\`\`typescript
import axios from "axios";

const res = await axios.post("https://studio.yourdomain.com/api/v1/launch", {
  user_id: "player_12345",
  game_uid: "royal_skyrush",
  balance: 1500.00,
  currency: "INR",
  callback_url: "https://your-casino.com/api/callback",
  return_url: "https://your-casino.com/lobby"
}, {
  headers: {
    "Authorization": "Bearer ${token}",
    "Content-Type": "application/json"
  }
});

console.log("Game URL:", res.data.data.launch_url);
\`\`\`

### PHP:
\`\`\`php
<?php
$payload = json_encode([
    "user_id" => "player_12345",
    "game_uid" => "royal_skyrush",
    "balance" => 1500.00,
    "currency" => "INR",
    "callback_url" => "https://your-casino.com/api/callback",
    "return_url" => "https://your-casino.com/lobby"
]);

$ch = curl_init("https://studio.yourdomain.com/api/v1/launch");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Authorization: Bearer ${token}",
    "Content-Type: application/json"
]);
curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
$res = json_decode(curl_exec($ch), true);
echo "Launch URL: " . $res["data"]["launch_url"];
?>
\`\`\`

### Python:
\`\`\`python
import requests

url = "https://studio.yourdomain.com/api/v1/launch"
headers = {
    "Authorization": "Bearer ${token}",
    "Content-Type": "application/json"
}
payload = {
    "user_id": "player_12345",
    "game_uid": "royal_skyrush",
    "balance": 1500.00,
    "currency": "INR",
    "callback_url": "https://your-casino.com/api/callback",
    "return_url": "https://your-casino.com/lobby"
}

res = requests.post(url, json=payload, headers=headers).json()
print("Launch URL:", res["data"]["launch_url"])
\`\`\`

---

## 5. Webhook Settlement Callback (POST /api/callback)
Studio notifies your casino on round completion.

### Incoming Payload:
\`\`\`json
{
  "serial_number": "SN_ROYAL_1724183921098_982",
  "session_id": "sess_39c1b827e01...",
  "member_account": "player_12345",
  "game_uid": "royal_skyrush",
  "game_name": "Sky Rush",
  "bet_amount": 100.00,
  "win_amount": 250.00,
  "new_balance": 1650.00,
  "timestamp": 1724183921098
}
\`\`\`

### Next.js Handler Example:
\`\`\`typescript
// app/api/callback/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { serial_number, member_account, bet_amount, win_amount } = body;

    // 1. Idempotency Check
    const existing = await db.transaction.findUnique({ where: { serialNumber: serial_number } });
    if (existing) {
      return NextResponse.json({ status: 1, code: 0, msg: "Already processed" });
    }

    // 2. Settle Wallet
    const user = await db.user.findUnique({ where: { id: member_account } });
    if (!user) return NextResponse.json({ status: 0, code: 404, error: "User not found" });

    const newBalance = user.balance - bet_amount + win_amount;
    await db.user.update({
      where: { id: user.id },
      data: { balance: newBalance },
    });

    // 3. Record Audit
    await db.transaction.create({
      data: {
        userId: user.id,
        serialNumber: serial_number,
        amount: win_amount - bet_amount,
        balanceAfter: newBalance,
      },
    });

    return NextResponse.json({
      status: 1,
      code: 0,
      msg: "Settlement successful",
      data: { new_balance: newBalance }
    });
  } catch (err: any) {
    return NextResponse.json({ status: 0, code: 500, error: err.message }, { status: 500 });
  }
}
\`\`\`

---

## 6. Games Catalog (GET /api/v1/games)
Returns active games suite:
- \`royal_skyrush\`: Sky Rush (RTP 97.5%, Max 1000x)
- \`royal_tigertrail\`: Tiger Trail (RTP 98.0%, Max 250x)
- \`royal_bombgrid\`: Bomb Grid (RTP 98.5%, Max 500x)
- \`royal_dropx\`: Drop X (RTP 98.2%, Max 1000x)
- \`royal_cricketblast\`: Cricket Blast (RTP 97.6%, Max 500x)
- \`royal_infinityx\`: Infinity X (RTP 98.8%, Max 10000x)
- \`royal_treasuretower\`: Treasure Tower (RTP 98.0%, Max 500x)
- \`royal_dicex\`: Dice X (RTP 99.0%, Max 100x)
- \`royal_cardclimb\`: Card Climb (RTP 97.8%, Max 128x)
- \`royal_luckywheel\`: Lucky Wheel X (RTP 97.0%, Max 50x)
`;
                    copyText(fullMd, "full_doc_md");
                  }}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black text-xs font-extrabold shadow-lg shadow-amber-500/20 flex items-center gap-2 whitespace-nowrap"
                >
                  {copiedSnippet === "full_doc_md" ? <Check className="w-4 h-4 text-black" /> : <Copy className="w-4 h-4 text-black" />}
                  <span>{copiedSnippet === "full_doc_md" ? "Full Document Copied!" : "📋 Copy Full Markdown Doc"}</span>
                </button>
              </div>
            </div>

            {/* SECTION 1: ARCHITECTURE & LIFECYCLE */}
            <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl p-6 shadow-lg space-y-5">
              <h3 className="text-base font-black text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                <span className="text-amber-400 font-mono">01.</span>
                <span>Integration Flow & Architecture</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[#080a10] border border-slate-800 p-4 rounded-xl space-y-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-xs">
                    1
                  </div>
                  <h4 className="text-xs font-bold text-white">Player Clicks Game</h4>
                  <p className="text-[11px] text-gray-400 leading-relaxed">
                    Casino backend calls <code className="text-amber-400 font-mono">POST /api/v1/launch</code> with user ID and balance. Studio returns launch URL.
                  </p>
                </div>

                <div className="bg-[#080a10] border border-slate-800 p-4 rounded-xl space-y-2">
                  <div className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 font-bold text-xs">
                    2
                  </div>
                  <h4 className="text-xs font-bold text-white">Render in Iframe</h4>
                  <p className="text-[11px] text-gray-400 leading-relaxed">
                    Embed the URL in an <code className="text-purple-400 font-mono">&lt;iframe&gt;</code> in your casino modal. Gameplay runs with high-performance 60fps canvas.
                  </p>
                </div>

                <div className="bg-[#080a10] border border-slate-800 p-4 rounded-xl space-y-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-xs">
                    3
                  </div>
                  <h4 className="text-xs font-bold text-white">Webhook Settlement</h4>
                  <p className="text-[11px] text-gray-400 leading-relaxed">
                    Studio dispatches an idempotent HTTP POST callback to your <code className="text-emerald-400 font-mono">callback_url</code> to credit/debit player balance.
                  </p>
                </div>
              </div>

              <div className="bg-[#06080e] p-4 rounded-xl border border-slate-800 font-mono text-xs text-gray-300 overflow-x-auto">
                <pre>{`[Player / App] ────► [Casino Backend] ──(POST /api/v1/launch)──► [Royal Games Studio RGS]
                           ▲                                                │
                           │  ◄── Return { status: 1, launch_url } ─────────┘
                           │
                           ▼ Render <iframe>
[Player Plays Game]
        │
        ▼ (Round Completed)
[Royal Studio] ──(POST Idempotent Webhook)──► [Casino /api/callback] ──► Update Balance in DB`}</pre>
              </div>
            </div>

            {/* SECTION 2: LAUNCH API SPECIFICATION */}
            <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl p-6 shadow-lg space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <span className="text-amber-400 font-mono">02.</span>
                  <span>Game Launch API — POST /api/v1/launch</span>
                </h3>
                <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-mono font-bold px-2 py-0.5 rounded">
                  HTTP POST
                </span>
              </div>

              {/* Parameter Table */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider">Request Parameters</h4>
                <div className="overflow-x-auto border border-slate-800 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-[#080a10] border-b border-slate-800 text-gray-400 font-mono">
                        <th className="py-2.5 px-3">Field</th>
                        <th className="py-2.5 px-3">Type</th>
                        <th className="py-2.5 px-3">Required</th>
                        <th className="py-2.5 px-3">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono text-gray-300 bg-[#06080e]">
                      <tr>
                        <td className="py-2.5 px-3 text-amber-400 font-bold">user_id</td>
                        <td className="py-2.5 px-3 text-purple-400">string</td>
                        <td className="py-2.5 px-3 text-emerald-400">YES</td>
                        <td className="py-2.5 px-3 font-sans">Unique player account ID in your casino database.</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 text-amber-400 font-bold">game_uid</td>
                        <td className="py-2.5 px-3 text-purple-400">string</td>
                        <td className="py-2.5 px-3 text-emerald-400">YES</td>
                        <td className="py-2.5 px-3 font-sans">Identifier e.g. <code className="text-amber-400">royal_skyrush</code>, <code className="text-amber-400">royal_cricketblast</code>.</td>
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
                        <td className="py-2.5 px-3 font-sans">Redirect URL when player exits the game.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Code Snippets (cURL, Node.js, PHP, Python) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider">Code Snippets</h4>
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

                <div className="relative bg-[#06080e] p-4 rounded-xl border border-slate-800 font-mono text-xs text-gray-300 overflow-x-auto">
                  <button
                    onClick={() => {
                      const token = clients[0]?.tokens[0]?.token || "rgs_live_YOUR_STUDIO_API_TOKEN";
                      const snips: Record<string, string> = {
                        curl: `curl -X POST https://studio.yourdomain.com/api/v1/launch \\\n  -H "Authorization: Bearer ${token}" \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "user_id": "player_12345",\n    "game_uid": "royal_skyrush",\n    "balance": 1500.00,\n    "currency": "INR",\n    "callback_url": "https://your-casino.com/api/callback",\n    "return_url": "https://your-casino.com/lobby"\n  }'`,
                        node: `import axios from "axios";\n\nconst response = await axios.post("https://studio.yourdomain.com/api/v1/launch", {\n  user_id: "player_12345",\n  game_uid: "royal_skyrush",\n  balance: 1500.00,\n  currency: "INR",\n  callback_url: "https://your-casino.com/api/callback",\n  return_url: "https://your-casino.com/lobby"\n}, {\n  headers: {\n    "Authorization": "Bearer ${token}",\n    "Content-Type": "application/json"\n  }\n});\n\nconsole.log("Game URL:", response.data.data.launch_url);`,
                        php: `<?php\n$payload = json_encode([\n    "user_id" => "player_12345",\n    "game_uid" => "royal_skyrush",\n    "balance" => 1500.00,\n    "currency" => "INR",\n    "callback_url" => "https://your-casino.com/api/callback",\n    "return_url" => "https://your-casino.com/lobby"\n]);\n\n$ch = curl_init("https://studio.yourdomain.com/api/v1/launch");\ncurl_setopt($ch, CURLOPT_RETURNTRANSFER, true);\ncurl_setopt($ch, CURLOPT_POST, true);\ncurl_setopt($ch, CURLOPT_HTTPHEADER, [\n    "Authorization: Bearer ${token}",\n    "Content-Type: application/json"\n]);\ncurl_setopt($ch, CURLOPT_POSTFIELDS, $payload);\n\n$res = json_decode(curl_exec($ch), true);\necho "Launch URL: " . $res["data"]["launch_url"];\n?>`,
                        python: `import requests\n\nurl = "https://studio.yourdomain.com/api/v1/launch"\nheaders = {\n    "Authorization": "Bearer ${token}",\n    "Content-Type": "application/json"\n}\npayload = {\n    "user_id": "player_12345",\n    "game_uid": "royal_skyrush",\n    "balance": 1500.00,\n    "currency": "INR",\n    "callback_url": "https://your-casino.com/api/callback",\n    "return_url": "https://your-casino.com/lobby"\n}\n\nres = requests.post(url, json=payload, headers=headers).json()\nprint("Launch URL:", res["data"]["launch_url"])`,
                      };
                      copyText(snips[docLang] || "", "launch_snip");
                    }}
                    className="absolute top-3 right-3 bg-slate-800 hover:bg-slate-700 text-gray-300 hover:text-white px-2.5 py-1 rounded text-xs font-mono flex items-center gap-1"
                  >
                    {copiedSnippet === "launch_snip" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSnippet === "launch_snip" ? "Copied" : "Copy"}</span>
                  </button>

                  <pre>{docLang === "curl" && `curl -X POST https://studio.yourdomain.com/api/v1/launch \\
  -H "Authorization: Bearer ${clients[0]?.tokens[0]?.token || "rgs_live_YOUR_STUDIO_API_TOKEN"}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "user_id": "player_12345",
    "game_uid": "royal_skyrush",
    "balance": 1500.00,
    "currency": "INR",
    "callback_url": "https://your-casino.com/api/callback",
    "return_url": "https://your-casino.com/lobby"
  }'`}{docLang === "node" && `import axios from "axios";

const response = await axios.post("https://studio.yourdomain.com/api/v1/launch", {
  user_id: "player_12345",
  game_uid: "royal_skyrush",
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
    "game_uid" => "royal_skyrush",
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
    "game_uid": "royal_skyrush",
    "balance": 1500.00,
    "currency": "INR",
    "callback_url": "https://your-casino.com/api/callback",
    "return_url": "https://your-casino.com/lobby"
}

res = requests.post(url, json=payload, headers=headers).json()
print("Launch URL:", res["data"]["launch_url"])`}</pre>
                </div>
              </div>

              {/* JSON Response Schema */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider">Success Response (200 OK)</h4>
                <div className="bg-[#06080e] p-4 rounded-xl border border-slate-800 font-mono text-xs text-emerald-400 overflow-x-auto">
                  <pre>{`{
  "status": 1,
  "code": 0,
  "msg": "Royal Studio game session created successfully",
  "data": {
    "session_id": "sess_39c1b827e01...",
    "game_uid": "royal_skyrush",
    "game_name": "Sky Rush",
    "provider": "Royal Games Studio",
    "launch_url": "https://studio.yourdomain.com/play/sess_39c1b827e01...?token=eyJhbGciOi...",
    "expires_at": "2026-08-21T02:30:00.000Z"
  }
}`}</pre>
                </div>
              </div>
            </div>

            {/* SECTION 3: WEBHOOK SETTLEMENT SPECIFICATION */}
            <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl p-6 shadow-lg space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <span className="text-amber-400 font-mono">03.</span>
                  <span>Webhook Settlement Specification (Your Casino Endpoint)</span>
                </h3>
                <span className="bg-purple-500/20 text-purple-400 border border-purple-500/40 text-xs font-mono font-bold px-2 py-0.5 rounded">
                  POST /api/callback
                </span>
              </div>
              <p className="text-xs text-gray-400">
                When each game round concludes, Royal Games Studio sends an authoritative HTTP POST payload to your <code className="text-amber-400 font-mono">callback_url</code>.
              </p>

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider">Incoming Webhook Payload (JSON)</h4>
                <div className="bg-[#06080e] p-4 rounded-xl border border-slate-800 font-mono text-xs text-purple-300 overflow-x-auto">
                  <pre>{`{
  "serial_number": "SN_ROYAL_1724183921098_982",  // Unique Idempotency Key
  "session_id": "sess_39c1b827e01...",
  "member_account": "player_12345",
  "game_uid": "royal_skyrush",
  "game_name": "Sky Rush",
  "bet_amount": 100.00,
  "win_amount": 250.00,
  "new_balance": 1650.00,
  "timestamp": 1724183921098
}`}</pre>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider">Complete Next.js / Node.js Route Handler</h4>
                  <button
                    onClick={() => {
                      const code = `// app/api/callback/route.ts (Next.js App Router)
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { serial_number, member_account, bet_amount, win_amount } = body;

    // 1. Idempotency check (prevent double credit/debit)
    const existing = await db.transaction.findUnique({ where: { serialNumber: serial_number } });
    if (existing) {
      return NextResponse.json({ status: 1, code: 0, msg: "Already processed" });
    }

    // 2. Settle player wallet
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
                      copyText(code, "cb_code");
                    }}
                    className="bg-slate-800 hover:bg-slate-700 text-gray-300 hover:text-white px-2.5 py-1 rounded text-xs font-mono flex items-center gap-1"
                  >
                    {copiedSnippet === "cb_code" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSnippet === "cb_code" ? "Copied" : "Copy Code"}</span>
                  </button>
                </div>

                <div className="bg-[#06080e] p-4 rounded-xl border border-slate-800 font-mono text-xs text-gray-300 overflow-x-auto">
                  <pre>{`// app/api/callback/route.ts (Next.js App Router)
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { serial_number, member_account, bet_amount, win_amount } = body;

    // 1. Idempotency check (prevent double credit/debit)
    const existing = await db.transaction.findUnique({ where: { serialNumber: serial_number } });
    if (existing) {
      return NextResponse.json({ status: 1, code: 0, msg: "Already processed" });
    }

    // 2. Settle player wallet
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
}`}</pre>
                </div>
              </div>
            </div>

            {/* SECTION 4: GAMES CATALOG LIST */}
            <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl p-6 shadow-lg space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <span className="text-amber-400 font-mono">04.</span>
                  <span>Games Catalog List (GET /api/v1/games)</span>
                </h3>
                <span className="bg-blue-500/20 text-blue-400 border border-blue-500/40 text-xs font-mono font-bold px-2 py-0.5 rounded">
                  HTTP GET
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {STUDIO_GAMES.map((g) => (
                  <div key={g.game_uid} className="bg-[#080a10] border border-slate-800 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-amber-400 font-bold">{g.game_uid}</span>
                      <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-bold">
                        ACTIVE
                      </span>
                    </div>
                    <div className="text-sm font-bold text-white">{g.name}</div>
                    <p className="text-[11px] text-gray-400 line-clamp-1">{g.category}</p>
                    <div className="flex items-center justify-between text-[11px] font-mono text-gray-400 pt-2 border-t border-slate-800/80">
                      <span>RTP: {g.rtp}%</span>
                      <span className="text-purple-400 font-bold">Max: {g.max_multiplier}x</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SECTION 5: LIVE TEST RUNNER */}
            <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl p-6 shadow-lg space-y-5">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <span className="text-amber-400 font-mono">05.</span>
                  <span>Live Launch API Playground</span>
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  Test a real API call and generate an actual playable session URL right here.
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
                    {STUDIO_GAMES.map((g) => (
                      <option key={g.game_uid} value={g.game_uid}>
                        🎮 {g.name} ({g.game_uid})
                      </option>
                    ))}
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
          </div>
        )}

        {/* TAB 6: CLIENT & AGGREGATOR GGR REPORTS */}
        {activeTab === "reports" && (
          <div className="space-y-6">
            {/* Header & Multi-Filter Control Bar */}
            <div className="bg-[#0b0f19] border border-amber-500/30 rounded-3xl p-6 shadow-2xl space-y-5">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-white flex items-center gap-2.5">
                    <BarChart3 className="w-6 h-6 text-amber-400" />
                    <span>Client & Aggregator Financial Reports</span>
                  </h2>
                  <p className="text-xs text-gray-400 mt-1 max-w-2xl">
                    Filter by specific B2B operator, date range, or game to analyze Gross Gaming Revenue (GGR), turnover, player payouts, and studio revenue share.
                  </p>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <button
                    onClick={fetchReports}
                    className="p-2.5 rounded-xl bg-[#07090e] border border-slate-700 hover:border-amber-400 text-gray-300 hover:text-white transition-colors cursor-pointer"
                    title="Refresh Report Data"
                  >
                    <RefreshCw className={`w-4 h-4 ${reportLoading ? "animate-spin text-amber-400" : ""}`} />
                  </button>
                  <button
                    onClick={exportReportCSV}
                    className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold px-4 py-2.5 rounded-xl text-xs shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
                  >
                    <Download className="w-4 h-4 stroke-[2.5]" />
                    <span>Export CSV Report</span>
                  </button>
                </div>
              </div>

              {/* Filter Controls Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-800/80">
                {/* 1. Client / Operator Selector */}
                <div>
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-amber-400" />
                    <span>Select Client / Aggregator</span>
                  </label>
                  <select
                    value={selectedReportOperator}
                    onChange={(e) => setSelectedReportOperator(e.target.value)}
                    className="w-full bg-[#07090e] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-bold"
                  >
                    <option value="all">🏢 All Operators & Aggregators</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.email})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Date Range Filter */}
                <div>
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Time Window</span>
                  </label>
                  <div className="grid grid-cols-4 gap-1 bg-[#07090e] p-1 rounded-xl border border-slate-700">
                    {[
                      { id: "today", label: "Today" },
                      { id: "7d", label: "7 Days" },
                      { id: "30d", label: "30 Days" },
                      { id: "all", label: "All Time" },
                    ].map((d) => (
                      <button
                        key={d.id}
                        onClick={() => setSelectedReportDateRange(d.id)}
                        className={`py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                          selectedReportDateRange === d.id
                            ? "bg-amber-500 text-black shadow-md shadow-amber-500/20"
                            : "text-gray-400 hover:text-white"
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Game Title Selector */}
                <div>
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                    <Gamepad2 className="w-3.5 h-3.5 text-purple-400" />
                    <span>Game Filter</span>
                  </label>
                  <select
                    value={selectedReportGame}
                    onChange={(e) => setSelectedReportGame(e.target.value)}
                    className="w-full bg-[#07090e] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-bold"
                  >
                    <option value="all">🎮 All 10 HTML5 Games</option>
                    {STUDIO_GAMES.map((g) => (
                      <option key={g.game_uid} value={g.game_uid}>
                        {g.name} ({g.category})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* 6-Card Financial Metrics Strip */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {/* Turnover */}
              <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl p-4 space-y-1">
                <span className="text-[10px] uppercase font-bold text-gray-400">Total Turnover (Bets)</span>
                <div className="text-lg font-black text-amber-400 font-mono truncate">
                  ₹{(reportData?.summary?.totalTurnover || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </div>
                <span className="text-[9px] text-gray-500">Gross Wagers Placed</span>
              </div>

              {/* Total Payout */}
              <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl p-4 space-y-1">
                <span className="text-[10px] uppercase font-bold text-gray-400">Player Winnings</span>
                <div className="text-lg font-black text-purple-400 font-mono truncate">
                  ₹{(reportData?.summary?.totalPayout || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </div>
                <span className="text-[9px] text-gray-500">Total Won by Users</span>
              </div>

              {/* Net GGR */}
              <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl p-4 space-y-1">
                <span className="text-[10px] uppercase font-bold text-gray-400">Gross Gaming Rev (GGR)</span>
                <div
                  className={`text-lg font-black font-mono truncate ${
                    (reportData?.summary?.totalGgr || 0) >= 0 ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {(reportData?.summary?.totalGgr || 0) >= 0 ? "+" : ""}₹
                  {(reportData?.summary?.totalGgr || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </div>
                <span className="text-[9px] text-gray-500">
                  Margin: {reportData?.summary?.holdMargin || 0}%
                </span>
              </div>

              {/* Studio Revenue Share */}
              <div className="bg-[#0b0f19] border border-amber-500/30 rounded-2xl p-4 space-y-1 bg-gradient-to-b from-amber-500/5 to-transparent">
                <span className="text-[10px] uppercase font-bold text-amber-300">Studio Share (10%)</span>
                <div className="text-lg font-black text-amber-400 font-mono truncate">
                  ₹{(reportData?.summary?.totalStudioRevenue || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </div>
                <span className="text-[9px] text-amber-400/70">Prepaid Deductions</span>
              </div>

              {/* Unique Players */}
              <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl p-4 space-y-1">
                <span className="text-[10px] uppercase font-bold text-gray-400">Active Players</span>
                <div className="text-lg font-black text-sky-400 font-mono">
                  {reportData?.summary?.uniquePlayersCount || 0}
                </div>
                <span className="text-[9px] text-gray-500">Unique Player Accounts</span>
              </div>

              {/* Total Rounds */}
              <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl p-4 space-y-1">
                <span className="text-[10px] uppercase font-bold text-gray-400">Rounds Resolved</span>
                <div className="text-lg font-black text-slate-200 font-mono">
                  {reportData?.summary?.totalRounds || 0}
                </div>
                <span className="text-[9px] text-gray-500">Audit Stream Events</span>
              </div>
            </div>

            {/* Operator Financial Comparison Matrix Table */}
            <div className="bg-[#0b0f19] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <Key className="w-4 h-4 text-amber-400" />
                    <span>B2B Client Financial Matrix & GGR Breakdown</span>
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Individual operator performance, active player counts, and billing metrics.
                  </p>
                </div>
                <span className="text-xs font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2.5 py-1 rounded-xl">
                  {reportData?.operatorBreakdown?.length || 0} Operators Listed
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-[10px] font-bold text-gray-500 uppercase tracking-wider font-mono">
                      <th className="py-3 px-3">Client / Aggregator</th>
                      <th className="py-3 px-3">Prepaid Wallet</th>
                      <th className="py-3 px-3">GGR Rate</th>
                      <th className="py-3 px-3">Active Players</th>
                      <th className="py-3 px-3">Rounds</th>
                      <th className="py-3 px-3">Turnover (Bets)</th>
                      <th className="py-3 px-3">Payouts (Wins)</th>
                      <th className="py-3 px-3">Net GGR</th>
                      <th className="py-3 px-3">Studio Fee</th>
                      <th className="py-3 px-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium text-slate-300">
                    {reportData?.operatorBreakdown?.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="py-8 text-center text-gray-500">
                          No operator round records found for selected filter.
                        </td>
                      </tr>
                    ) : (
                      reportData?.operatorBreakdown?.map((op: any) => (
                        <tr key={op.operatorId} className="hover:bg-slate-900/60 transition-colors">
                          <td className="py-3 px-3">
                            <div className="font-bold text-white text-xs">{op.name}</div>
                            <div className="text-[10px] text-gray-500 font-mono truncate max-w-xs">{op.email}</div>
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-emerald-400">
                            ₹{op.balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-amber-400">{op.ggrRate}%</td>
                          <td className="py-3 px-3 font-mono text-sky-300 font-bold">{op.playersCount}</td>
                          <td className="py-3 px-3 font-mono text-slate-300">{op.roundsCount}</td>
                          <td className="py-3 px-3 font-mono font-bold text-white">
                            ₹{op.turnover.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 px-3 font-mono text-purple-300">
                            ₹{op.payout.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </td>
                          <td
                            className={`py-3 px-3 font-mono font-black ${
                              op.ggr >= 0 ? "text-emerald-400" : "text-rose-400"
                            }`}
                          >
                            {op.ggr >= 0 ? "+" : ""}₹
                            {op.ggr.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-amber-400">
                            ₹{op.studioFee.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <span
                              className={`text-[9px] px-2 py-0.5 rounded-full font-bold font-mono ${
                                op.status === "ACTIVE"
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                                  : "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                              }`}
                            >
                              {op.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 2-Column Split: Game Performance & Top Player Leaderboard */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column: Game Performance Breakdown */}
              <div className="bg-[#0b0f19] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <Gamepad2 className="w-4 h-4 text-purple-400" />
                    <span>Game Distribution for Filter</span>
                  </h3>
                  <span className="text-xs text-gray-400 font-mono">Turnover & Payout</span>
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                  {reportData?.gameDistribution?.map((g: any) => (
                    <div
                      key={g.gameUid}
                      className="bg-[#07090e] border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between"
                    >
                      <div className="space-y-0.5">
                        <div className="text-xs font-bold text-white flex items-center gap-2">
                          <span>{g.name}</span>
                          <span className="text-[9px] bg-slate-800 text-gray-400 px-1.5 py-0.2 rounded font-mono">
                            {g.category}
                          </span>
                        </div>
                        <div className="text-[10px] text-gray-500 font-mono">
                          {g.rounds} Rounds • Configured RTP: {g.rtp}%
                        </div>
                      </div>

                      <div className="text-right font-mono space-y-0.5">
                        <div className="text-xs font-bold text-amber-400">
                          ₹{g.turnover.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </div>
                        <div
                          className={`text-[10px] font-bold ${
                            g.ggr >= 0 ? "text-emerald-400" : "text-rose-400"
                          }`}
                        >
                          GGR: {g.ggr >= 0 ? "+" : ""}₹
                          {g.ggr.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Player Leaderboard for Filter */}
              <div className="bg-[#0b0f19] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <Users className="w-4 h-4 text-sky-400" />
                    <span>Top Players Leaderboard</span>
                  </h3>
                  <span className="text-xs text-gray-400 font-mono">Wagers & Net P/L</span>
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                  {reportData?.topPlayers?.length === 0 ? (
                    <div className="py-8 text-center text-gray-500 text-xs">No player activity found.</div>
                  ) : (
                    reportData?.topPlayers?.map((p: any, idx: number) => (
                      <div
                        key={p.userId}
                        className="bg-[#07090e] border border-slate-800 rounded-2xl p-3 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-xl bg-slate-800 flex items-center justify-center font-mono font-black text-xs text-amber-400">
                            #{idx + 1}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-white font-mono">{p.userId}</div>
                            <div className="text-[10px] text-gray-500">{p.operatorName} • {p.rounds} Rounds</div>
                          </div>
                        </div>

                        <div className="text-right font-mono space-y-0.5">
                          <div className="text-xs font-bold text-slate-200">
                            Bet: ₹{p.turnover.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </div>
                          <div
                            className={`text-[10px] font-bold ${
                              p.netPnl >= 0 ? "text-emerald-400" : "text-rose-400"
                            }`}
                          >
                            Player Net: {p.netPnl >= 0 ? "+" : ""}₹
                            {p.netPnl.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: GAME RTP & GGR MARGIN SETTINGS */}
        {activeTab === "rtp" && (
          <div className="space-y-6">
            {/* Success Toast */}
            {rtpSuccessMsg && (
              <div className="bg-emerald-500/10 border border-emerald-500/40 rounded-2xl p-4 flex items-center gap-3 text-emerald-300 font-bold text-xs animate-in fade-in slide-in-from-top-2 shadow-lg shadow-emerald-500/10">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>{rtpSuccessMsg}</span>
              </div>
            )}

            {/* Master Studio RTP Hero Control Card */}
            <div className="bg-[#0b0f19] border border-purple-500/40 rounded-3xl p-6 shadow-2xl space-y-6 relative overflow-hidden bg-gradient-to-br from-purple-500/10 via-transparent to-amber-500/5">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/40 px-2 py-0.5 rounded-md font-mono">
                      Authoritative Math Control
                    </span>
                  </div>
                  <h2 className="text-xl font-black text-white flex items-center gap-2.5">
                    <Sliders className="w-6 h-6 text-purple-400" />
                    <span>Master Studio RTP & House Edge Configuration</span>
                  </h2>
                  <p className="text-xs text-gray-400 mt-1 max-w-2xl">
                    Configure the global Return to Player (RTP) percentage across all 10 HTML5 games. The RNG algorithms dynamically adjust Pareto crash curves, mine safety odds, and multiplier distributions.
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={fetchRtpSettings}
                    className="p-2.5 rounded-xl bg-[#07090e] border border-slate-700 hover:border-purple-400 text-gray-300 hover:text-white transition-colors cursor-pointer"
                    title="Refresh Settings"
                  >
                    <RefreshCw className={`w-4 h-4 ${rtpLoading ? "animate-spin text-purple-400" : ""}`} />
                  </button>
                  <button
                    onClick={handleApplyGlobalRtp}
                    disabled={savingRtp}
                    className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-400 hover:to-purple-500 text-white font-extrabold px-5 py-2.5 rounded-xl text-xs shadow-lg shadow-purple-500/25 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {savingRtp ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    <span>Apply to All 10 Games</span>
                  </button>
                </div>
              </div>

              {/* Master RTP Slider & Live Margin Display */}
              <div className="bg-[#07090e]/90 border border-slate-800 rounded-2xl p-6 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-300 block mb-1">
                      GLOBAL STUDIO RTP PERCENTAGE (PLAYER RETURN)
                    </label>
                    <span className="text-[11px] text-gray-500 font-mono">
                      Recommended Industry Standard: 96.00% – 97.50%
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      step="0.1"
                      min="80.0"
                      max="99.5"
                      value={globalRtpInput}
                      onChange={(e) => setGlobalRtpInput(Number(e.target.value))}
                      className="w-28 bg-[#0c101c] border border-purple-500/50 rounded-xl px-3 py-2 text-center text-lg font-black text-purple-300 font-mono focus:outline-none focus:border-purple-400"
                    />
                    <span className="text-lg font-black text-purple-400 font-mono">%</span>
                  </div>
                </div>

                {/* Range Slider */}
                <input
                  type="range"
                  min="85.0"
                  max="99.0"
                  step="0.1"
                  value={globalRtpInput}
                  onChange={(e) => setGlobalRtpInput(Number(e.target.value))}
                  className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />

                {/* 3-Card Real-Time Math Calculator */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="bg-[#0c101c] border border-slate-800 rounded-xl p-3.5 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-gray-400">Player Return (RTP)</span>
                    <div className="text-base font-black text-purple-300 font-mono">{globalRtpInput.toFixed(2)}%</div>
                    <span className="text-[9px] text-gray-500">Gross Wagers Returned to Players</span>
                  </div>

                  <div className="bg-[#0c101c] border border-emerald-500/30 rounded-xl p-3.5 space-y-1 bg-gradient-to-b from-emerald-500/5 to-transparent">
                    <span className="text-[10px] uppercase font-bold text-emerald-400">Casino House Edge (GGR Margin)</span>
                    <div className="text-base font-black text-emerald-400 font-mono">
                      +{(100 - globalRtpInput).toFixed(2)}%
                    </div>
                    <span className="text-[9px] text-emerald-500/80">Guaranteed Operator Retention</span>
                  </div>

                  <div className="bg-[#0c101c] border border-amber-500/30 rounded-xl p-3.5 space-y-1 bg-gradient-to-b from-amber-500/5 to-transparent">
                    <span className="text-[10px] uppercase font-bold text-amber-300">Studio Share on 1 Cr Vol</span>
                    <div className="text-base font-black text-amber-400 font-mono">
                      ₹{(((100 - globalRtpInput) / 100) * 10000000 * 0.1).toLocaleString("en-IN", {
                        maximumFractionDigits: 0,
                      })}
                    </div>
                    <span className="text-[9px] text-amber-500/80">10% Studio Revenue Share</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Individual Game Fine-Tuning Grid (10 Games) */}
            <div className="bg-[#0b0f19] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <Gamepad2 className="w-4 h-4 text-amber-400" />
                    <span>Game-by-Game RTP Fine-Tuning Matrix</span>
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Customize individual game RTPs to create unique volatility curves for crash, plinko, and mines games.
                  </p>
                </div>
                <span className="text-xs font-mono font-bold bg-slate-800 text-gray-300 border border-slate-700 px-3 py-1 rounded-xl">
                  {STUDIO_GAMES.length} Active Games
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {rtpSettings?.games?.map((g: any) => {
                  const currentInputRtp = gameRtpInputs[g.gameUid] !== undefined ? gameRtpInputs[g.gameUid] : g.liveRtp;
                  const houseEdge = Number((100 - currentInputRtp).toFixed(2));

                  return (
                    <div
                      key={g.gameUid}
                      className="bg-[#07090e] border border-slate-800 hover:border-slate-700 rounded-2xl p-4 space-y-3 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-black text-white flex items-center gap-2">
                            <span>{g.name}</span>
                            <span className="text-[9px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-1.5 py-0.5 rounded font-mono">
                              {g.category}
                            </span>
                          </div>
                          <div className="text-[10px] text-gray-500 font-mono mt-0.5">
                            UID: {g.gameUid} • Max: {g.maxMultiplier}x
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            Edge: +{houseEdge}%
                          </span>
                        </div>
                      </div>

                      {/* Input & Slider Row */}
                      <div className="space-y-2 pt-1">
                        <div className="flex items-center justify-between gap-3">
                          <input
                            type="range"
                            min="85.0"
                            max="99.0"
                            step="0.1"
                            value={currentInputRtp}
                            onChange={(e) =>
                              setGameRtpInputs((prev) => ({
                                ...prev,
                                [g.gameUid]: Number(e.target.value),
                              }))
                            }
                            className="flex-1 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                          />

                          <div className="flex items-center gap-1.5 shrink-0">
                            <input
                              type="number"
                              step="0.1"
                              min="80.0"
                              max="99.5"
                              value={currentInputRtp}
                              onChange={(e) =>
                                setGameRtpInputs((prev) => ({
                                  ...prev,
                                  [g.gameUid]: Number(e.target.value),
                                }))
                              }
                              className="w-20 bg-[#0c101c] border border-slate-700 rounded-lg px-2 py-1 text-center text-xs font-bold text-amber-300 font-mono focus:outline-none focus:border-amber-400"
                            />
                            <span className="text-xs font-bold text-gray-400 font-mono">%</span>
                          </div>

                          <button
                            onClick={() => handleSaveSingleGameRtp(g.gameUid)}
                            disabled={savingRtp}
                            className="bg-amber-500 hover:bg-amber-400 text-black font-extrabold px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
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
                  className="w-full bg-[#07090e] border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              {/* Password Field */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-gray-300">Operator Portal Password</label>
                  <button
                    type="button"
                    onClick={() => setNewClientPassword(`Royal@${Math.floor(1000 + Math.random() * 9000)}!`)}
                    className="text-[11px] text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Auto Generate</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showNewClientPassword ? "text" : "password"}
                    value={newClientPassword}
                    onChange={(e) => setNewClientPassword(e.target.value)}
                    placeholder="Enter password"
                    required
                    className="w-full bg-[#07090e] border border-slate-700 rounded-xl pl-3.5 pr-10 py-2 text-xs text-emerald-400 font-mono focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewClientPassword(!showNewClientPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showNewClientPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="text-[10px] text-gray-500 mt-1">
                  Operator will use this email & password to sign in at <code className="text-slate-400">/portal/login</code>
                </p>
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
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black text-xs font-extrabold shadow-lg shadow-amber-500/20 flex items-center gap-2"
                >
                  {creatingClient ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Creating & Sending Email...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Create Client & Send Email</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Created Client Success Modal */}
      {createdSuccessModal.open && createdSuccessModal.credentials && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0c101c] border border-emerald-500/50 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                <span>Client Account & API Keys Created!</span>
              </h3>
              <button
                onClick={() => setCreatedSuccessModal({ open: false, credentials: null })}
                className="text-gray-400 hover:text-white text-xs font-bold"
              >
                ✕ Close
              </button>
            </div>

            {/* Email dispatch notice */}
            {createdSuccessModal.credentials.emailResult?.success ? (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 flex items-center gap-2.5 text-xs text-emerald-300">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  Welcome email containing login and API credentials was sent to <strong>{createdSuccessModal.credentials.email}</strong>.
                </span>
              </div>
            ) : (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex items-start gap-2.5 text-xs text-amber-300">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Account created in database.</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    SMTP is not configured in .env. You can copy the credentials below and send them directly to the client.
                  </p>
                </div>
              </div>
            )}

            {/* Credentials box */}
            <div className="bg-[#07090e] border border-slate-800 rounded-2xl p-4 space-y-3 text-xs font-mono">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-gray-400 font-sans">Company:</span>
                <span className="font-bold text-white">{createdSuccessModal.credentials.name}</span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-gray-400 font-sans">Portal URL:</span>
                <div className="flex items-center gap-2">
                  <span className="text-sky-400">{createdSuccessModal.credentials.portalUrl}</span>
                  <button
                    onClick={() => copyToClipboard(createdSuccessModal.credentials!.portalUrl, "portal_url")}
                    className="text-gray-400 hover:text-white"
                  >
                    {copiedKeyId === "portal_url" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-gray-400 font-sans">Login Email:</span>
                <div className="flex items-center gap-2">
                  <span className="text-white font-bold">{createdSuccessModal.credentials.email}</span>
                  <button
                    onClick={() => copyToClipboard(createdSuccessModal.credentials!.email, "cred_email")}
                    className="text-gray-400 hover:text-white"
                  >
                    {copiedKeyId === "cred_email" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-gray-400 font-sans">Portal Password:</span>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 font-bold">{createdSuccessModal.credentials.password}</span>
                  <button
                    onClick={() => copyToClipboard(createdSuccessModal.credentials!.password, "cred_pass")}
                    className="text-gray-400 hover:text-white"
                  >
                    {copiedKeyId === "cred_pass" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1 border-b border-slate-800 pb-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 font-sans text-[11px]">API Token:</span>
                  <button
                    onClick={() => copyToClipboard(createdSuccessModal.credentials!.token, "cred_tok")}
                    className="text-gray-400 hover:text-white flex items-center gap-1 text-[11px]"
                  >
                    {copiedKeyId === "cred_tok" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>Copy</span>
                  </button>
                </div>
                <span className="text-amber-400 text-[11px] break-all select-all">{createdSuccessModal.credentials.token}</span>
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 font-sans text-[11px]">Secret Key:</span>
                  <button
                    onClick={() => copyToClipboard(createdSuccessModal.credentials!.secretKey, "cred_sec")}
                    className="text-gray-400 hover:text-white flex items-center gap-1 text-[11px]"
                  >
                    {copiedKeyId === "cred_sec" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>Copy</span>
                  </button>
                </div>
                <span className="text-emerald-400 text-[11px] break-all select-all">{createdSuccessModal.credentials.secretKey}</span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  const creds = createdSuccessModal.credentials!;
                  const summary = `👑 ROYAL GAMES STUDIO - CLIENT CREDENTIALS
Company: ${creds.name}
Portal Login: ${creds.portalUrl}
Email: ${creds.email}
Password: ${creds.password}

API Token: ${creds.token}
Secret Key: ${creds.secretKey}
Callback URL: ${creds.callbackUrl || "N/A"}`;
                  copyToClipboard(summary, "all_creds");
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                {copiedKeyId === "all_creds" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKeyId === "all_creds" ? "Copied All Details!" : "Copy All Credentials"}</span>
              </button>
              <button
                type="button"
                onClick={() => setCreatedSuccessModal({ open: false, credentials: null })}
                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Balance Adjustment Modal */}
      {adjustModal.open && adjustModal.client && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0c101c] border border-amber-500/40 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Wallet className="w-5 h-5 text-amber-400" />
                <span>
                  {adjustModal.type === "CREDIT" ? "Credit GGR Balance" : "Deduct Balance"}: {adjustModal.client.companyName || adjustModal.client.name}
                </span>
              </h3>
              <button
                onClick={() => setAdjustModal({ open: false, client: null, type: "CREDIT" })}
                className="text-gray-400 hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAdjustBalance} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-400 font-semibold block mb-1">
                  Amount to {adjustModal.type === "CREDIT" ? "Credit (+)" : "Deduct (-)"} (INR)
                </label>
                <input
                  type="number"
                  min="1"
                  step="100"
                  required
                  value={adjAmount}
                  onChange={(e) => setAdjAmount(e.target.value)}
                  className="w-full bg-[#07090e] border border-slate-700 rounded-xl px-3.5 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">Audit Ledger Reason / Reference</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Offline bank transfer recharge verified / Correction"
                  value={adjReason}
                  onChange={(e) => setAdjReason(e.target.value)}
                  className="w-full bg-[#07090e] border border-slate-700 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustModal({ open: false, client: null, type: "CREDIT" })}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-gray-300 hover:text-white font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adjLoading}
                  className={`px-5 py-2 rounded-xl font-black text-slate-950 shadow-lg ${
                    adjustModal.type === "CREDIT"
                      ? "bg-emerald-400 hover:bg-emerald-300"
                      : "bg-rose-400 hover:bg-rose-300"
                  }`}
                >
                  {adjLoading ? "Adjusting..." : `Confirm ${adjustModal.type === "CREDIT" ? "Credit" : "Deduction"}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Deposit Modal */}
      {rejectModalId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0c101c] border border-rose-500/40 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-rose-400 flex items-center gap-2">
                <XCircle className="w-5 h-5" />
                <span>Reject Deposit Request</span>
              </h3>
              <button
                onClick={() => setRejectModalId(null)}
                className="text-gray-400 hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRejectDeposit} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-400 font-semibold block mb-1">Reason for Rejection</label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. UTR reference not found in bank account / Mismatched transfer amount"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full bg-[#07090e] border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRejectModalId(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-gray-300 hover:text-white font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={rejectLoading}
                  className="px-5 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 font-black text-white shadow-lg shadow-rose-500/20"
                >
                  {rejectLoading ? "Rejecting..." : "Confirm Rejection"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Client Confirmation Modal */}
      {deleteModal.open && deleteModal.client && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0c101c] border border-rose-500/50 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-rose-400 flex items-center gap-2">
                <Trash2 className="w-5 h-5" />
                <span>Delete B2B Client / Aggregator</span>
              </h3>
              <button
                onClick={() => setDeleteModal({ open: false, client: null, deleting: false })}
                className="text-gray-400 hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-[#080a10] border border-slate-800 rounded-xl p-3.5 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Client Name:</span>
                  <span className="font-bold text-white">{deleteModal.client.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Email:</span>
                  <span className="font-mono text-gray-300">{deleteModal.client.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Prepaid Balance:</span>
                  <span className="font-mono text-emerald-400 font-bold">
                    ₹{Number(deleteModal.client.balance || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Active History:</span>
                  <span className="font-mono text-amber-400 font-bold">
                    {deleteModal.client.sessionsCount || 0} Sessions • {deleteModal.client.roundsCount || 0} Rounds
                  </span>
                </div>
              </div>

              {((deleteModal.client.sessionsCount || 0) > 0 || (deleteModal.client.roundsCount || 0) > 0) && (
                <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 flex items-start gap-2.5 text-rose-300">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <p className="text-[11px] leading-relaxed">
                    <strong>Warning:</strong> This operator has active game sessions and round history. Deleting will permanently remove this client, all assigned API keys, game sessions, and round audit records.
                  </p>
                </div>
              )}

              <p className="text-slate-400 text-xs">
                Are you sure you want to permanently delete <strong className="text-white">{deleteModal.client.name}</strong>? This action cannot be undone.
              </p>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  disabled={deleteModal.deleting}
                  onClick={() => setDeleteModal({ open: false, client: null, deleting: false })}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-gray-300 hover:text-white font-bold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={deleteModal.deleting}
                  onClick={handleDeleteClient}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 font-black text-white shadow-lg shadow-rose-600/30 transition-all flex items-center gap-2"
                >
                  {deleteModal.deleting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Deleting Client...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Confirm Permanent Delete</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

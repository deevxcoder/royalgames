"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PortalNavbar } from "../components/PortalNavbar";
import { PortalSidebar } from "../components/PortalSidebar";
import {
  KeyRound,
  Copy,
  Check,
  ShieldCheck,
  Plus,
  Eye,
  EyeOff,
  Globe,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Radio,
  FileCode,
  Terminal,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
  Server,
  Zap,
} from "lucide-react";

export default function ApiKeysPage() {
  const router = useRouter();
  const [operator, setOperator] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [revealedSecrets, setRevealedSecrets] = useState<{ [id: string]: boolean }>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [newKeyName, setNewKeyName] = useState("Production API Key");
  const [ipInputs, setIpInputs] = useState<{ [id: string]: string }>({});
  const [savingIpId, setSavingIpId] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [detectedIp, setDetectedIp] = useState<string>("127.0.0.1");

  // Callback URL editor state
  const [callbackUrlInput, setCallbackUrlInput] = useState("");
  const [savingCallback, setSavingCallback] = useState(false);
  const [testingWebhook, setTestingWebhook] = useState(false);
  const [testResult, setTestResult] = useState<any | null>(null);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/operator/me");
      if (res.status === 401) {
        router.push("/portal/login");
        return;
      }
      const json = await res.json();
      setOperator(json.operator);
      if (json.operator?.callbackUrl) {
        setCallbackUrlInput(json.operator.callbackUrl);
      }

      const ips: { [id: string]: string } = {};
      json.operator?.tokens?.forEach((t: any) => {
        ips[t.id] = t.ipWhitelist || "";
      });
      setIpInputs(ips);

      // Detect current IP via whoami if available
      try {
        const token = json.operator?.tokens?.[0]?.token;
        if (token) {
          const whoamiRes = await fetch("/api/v1/whoami", {
            headers: { Authorization: `Bearer ${token}` },
          });
          const whoamiData = await whoamiRes.json();
          if (whoamiData?.data?.caller_ip) {
            setDetectedIp(whoamiData.data.caller_ip);
          }
        }
      } catch (e) {
        // ignore
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleGenerateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setStatusMsg(null);

    try {
      const res = await fetch("/api/operator/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newKeyName }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setStatusMsg({ type: "success", text: "New API Key generated successfully!" });
        setNewKeyName("Production API Key");
        await fetchData();
      } else {
        setStatusMsg({ type: "error", text: data.error || "Failed to generate key" });
      }
    } catch (err: any) {
      setStatusMsg({ type: "error", text: err.message || "Failed to generate key" });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveWhitelist = async (tokenId: string) => {
    setSavingIpId(tokenId);
    setStatusMsg(null);

    try {
      const res = await fetch("/api/operator/whitelist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tokenId, ipWhitelist: ipInputs[tokenId] || "" }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setStatusMsg({ type: "success", text: "IP Whitelist firewall updated successfully!" });
        await fetchData();
      } else {
        setStatusMsg({ type: "error", text: data.error || "Failed to update whitelist" });
      }
    } catch (err: any) {
      setStatusMsg({ type: "error", text: err.message || "Failed to update whitelist" });
    } finally {
      setSavingIpId(null);
    }
  };

  const handleSaveCallbackUrl = async () => {
    setSavingCallback(true);
    setStatusMsg(null);
    try {
      const res = await fetch("/api/operator/callback-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ callbackUrl: callbackUrlInput }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStatusMsg({ type: "success", text: "Default Webhook Callback URL updated successfully!" });
        await fetchData();
      } else {
        setStatusMsg({ type: "error", text: data.error || "Failed to update callback URL" });
      }
    } catch (err: any) {
      setStatusMsg({ type: "error", text: err.message || "Failed to update callback URL" });
    } finally {
      setSavingCallback(false);
    }
  };

  const handleTestWebhook = async () => {
    if (!callbackUrlInput.trim()) {
      setStatusMsg({ type: "error", text: "Please enter a valid Webhook Callback URL first." });
      return;
    }

    setTestingWebhook(true);
    setTestResult(null);
    setStatusMsg(null);

    try {
      const res = await fetch("/api/operator/test-webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ callbackUrl: callbackUrlInput.trim() }),
      });
      const data = await res.json();
      setTestResult(data);

      if (data.success) {
        setStatusMsg({
          type: "success",
          text: `Webhook Test Succeeded! HTTP ${data.httpStatus} received from your casino callback endpoint in ${data.latencyMs}ms.`,
        });
      } else {
        setStatusMsg({
          type: "error",
          text: `Webhook Test Alert: HTTP ${data.httpStatus || "Error"} received from ${callbackUrlInput}. Check details below.`,
        });
      }
    } catch (err: any) {
      setStatusMsg({ type: "error", text: err.message || "Failed to send test webhook ping" });
    } finally {
      setTestingWebhook(false);
    }
  };

  const addDetectedIp = (tokenId: string) => {
    const current = ipInputs[tokenId] || "";
    const parts = current ? current.split(",").map((s) => s.trim()) : [];
    if (!parts.includes(detectedIp)) {
      parts.push(detectedIp);
      const newIpStr = parts.filter(Boolean).join(", ");
      setIpInputs({ ...ipInputs, [tokenId]: newIpStr });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07090e] flex items-center justify-center text-slate-400">
        <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const primaryToken = operator?.tokens?.[0]?.token || "rgs_live_your_token";
  const primarySecret = operator?.tokens?.[0]?.secretKey || "rgs_sec_your_secret";
  const baseUrl = typeof window !== "undefined" ? `${window.location.origin}/api/v1` : "http://localhost:3002/api/v1";
  const effectiveCallback = callbackUrlInput || operator?.callbackUrl || "https://yourcasino.com/api/callback";

  const envSnippet = `ROYAL_API_URL=${baseUrl}
ROYAL_API_TOKEN=${primaryToken}
ROYAL_SECRET_KEY=${primarySecret}
ROYAL_CALLBACK_URL=${effectiveCallback}
ROYAL_RETURN_URL=https://yourcasino.com/lobby`;

  return (
    <div className="min-h-screen bg-[#07090e] flex flex-col font-sans">
      <PortalNavbar operator={operator} />

      <div className="flex-1 flex">
        <PortalSidebar operator={operator} />

        <main className="flex-1 p-6 md:p-8 space-y-8 overflow-y-auto max-w-7xl w-full">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Zero-Trust API Security & Gateway Credentials</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                API Credentials & Connection Kit
              </h1>
              <p className="text-xs text-slate-400">
                Manage your Studio Bearer tokens, secret keys, IP firewall whitelist, and connection parameters.
              </p>
            </div>

            <button
              onClick={() => router.push("/portal/docs")}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 text-xs font-black rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-2 hover:opacity-95"
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Interactive API Docs</span>
            </button>
          </div>

          {/* Feedback message */}
          {statusMsg && (
            <div
              className={`p-4 rounded-2xl flex items-center gap-3 text-xs font-medium border ${
                statusMsg.type === "success"
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                  : "bg-rose-500/10 border-rose-500/30 text-rose-300"
              }`}
            >
              {statusMsg.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span>{statusMsg.text}</span>
            </div>
          )}

          {/* TOP SECTION: API CONNECTION PARAMETERS & .ENV GENERATOR */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Quick Connection Details */}
            <div className="lg:col-span-6 bg-[#0b0f19] border border-slate-800/90 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    API Gateway Connection Details
                  </h3>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-mono font-bold border border-emerald-500/20">
                  LIVE GATEWAY
                </span>
              </div>

              {/* Base URL Box */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Base API URL</label>
                <div className="flex items-center gap-2 bg-[#07090e] border border-slate-800 rounded-xl p-2.5">
                  <span className="font-mono text-xs text-amber-400 flex-1 truncate">{baseUrl}</span>
                  <button
                    onClick={() => copyToClipboard(baseUrl, "base_url")}
                    className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 text-[11px] font-bold rounded-lg border border-slate-700 flex items-center gap-1"
                  >
                    {copiedKey === "base_url" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedKey === "base_url" ? "Copied" : "Copy"}</span>
                  </button>
                </div>
              </div>

              {/* Primary Token Box */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Active API Token (Bearer)</label>
                <div className="flex items-center gap-2 bg-[#07090e] border border-slate-800 rounded-xl p-2.5">
                  <span className="font-mono text-xs text-slate-200 flex-1 truncate">{primaryToken}</span>
                  <button
                    onClick={() => copyToClipboard(primaryToken, "prim_token")}
                    className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 text-[11px] font-bold rounded-lg border border-slate-700 flex items-center gap-1"
                  >
                    {copiedKey === "prim_token" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedKey === "prim_token" ? "Copied" : "Copy"}</span>
                  </button>
                </div>
              </div>

              {/* Default Webhook Callback URL */}
              <div className="space-y-2 pt-1 border-t border-slate-800/60">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-amber-400" />
                    <span>Default Webhook Callback URL</span>
                  </label>
                  {operator?.callbackUrl ? (
                    <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      Configured
                    </span>
                  ) : (
                    <span className="text-[10px] text-amber-400 font-mono">Not Set</span>
                  )}
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Your casino settlement endpoint where Royal Studio sends HMAC-signed game round settlements (deductions, wins & balance sync).
                </p>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <input
                    type="url"
                    value={callbackUrlInput}
                    onChange={(e) => setCallbackUrlInput(e.target.value)}
                    placeholder="https://yourcasino.com/api/callback"
                    className="flex-1 bg-[#07090e] border border-slate-800 focus:border-amber-500/60 rounded-xl px-3 py-2.5 text-xs font-mono text-white placeholder-slate-600 focus:outline-none"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSaveCallbackUrl}
                      disabled={savingCallback}
                      className="px-3.5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-1 shrink-0"
                    >
                      {savingCallback ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <span>Save URL</span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={handleTestWebhook}
                      disabled={testingWebhook || !callbackUrlInput}
                      className="px-3 py-2.5 bg-slate-900 hover:bg-slate-800 text-amber-400 hover:text-amber-300 font-bold text-xs rounded-xl border border-amber-500/30 transition-all disabled:opacity-40 flex items-center justify-center gap-1 shrink-0"
                      title="Send a sample signed round_settled POST request to verify your casino callback handler"
                    >
                      {testingWebhook ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                      ) : (
                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                      )}
                      <span>{testingWebhook ? "Pinging..." : "Test Ping"}</span>
                    </button>
                  </div>
                </div>

                {/* Webhook Test Details Inspector */}
                {testResult && (
                  <div className="mt-3 p-3.5 rounded-xl bg-[#07090e] border border-slate-800 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-300 flex items-center gap-1.5">
                        <Radio className="w-3.5 h-3.5 text-amber-400" />
                        Webhook Test Response:
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          testResult.success
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                            : "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                        }`}
                      >
                        HTTP {testResult.httpStatus || "ERR"} ({testResult.latencyMs || 0}ms)
                      </span>
                    </div>

                    <div className="space-y-1 font-mono text-[11px]">
                      <div className="text-slate-400 truncate">
                        <span className="text-slate-500">Endpoint:</span> {testResult.callbackUrl}
                      </div>
                      {testResult.signatureSent && (
                        <div className="text-slate-400 truncate">
                          <span className="text-slate-500">HMAC Sig:</span>{" "}
                          <span className="text-amber-400/90">{testResult.signatureSent}</span>
                        </div>
                      )}
                      {testResult.responseReceived && (
                        <div className="text-slate-400">
                          <span className="text-slate-500">Casino Response:</span>{" "}
                          <span className="text-emerald-400">
                            {typeof testResult.responseReceived === "object"
                              ? JSON.stringify(testResult.responseReceived)
                              : String(testResult.responseReceived)}
                          </span>
                        </div>
                      )}
                      {testResult.error && (
                        <div className="text-rose-400">
                          <span className="text-rose-500">Error:</span> {testResult.error}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right: 1-Click .env Snippet Generator */}
            <div className="lg:col-span-6 bg-[#0b0f19] border border-slate-800/90 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Ready-Made .env Snippet Generator
                  </h3>
                </div>

                <button
                  onClick={() => copyToClipboard(envSnippet, "env_snippet_btn")}
                  className="px-3 py-1.5 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 hover:from-amber-500/30 text-amber-300 text-xs font-bold rounded-xl border border-amber-500/40 flex items-center gap-1.5 transition-all shadow-sm"
                >
                  {copiedKey === "env_snippet_btn" ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copied .env!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>1-Click Copy .env</span>
                    </>
                  )}
                </button>
              </div>

              <p className="text-xs text-slate-400">
                Paste these exact variables directly into your casino backend's <code className="text-amber-400">.env.local</code> file:
              </p>

              <pre className="bg-[#07090e] border border-slate-800 rounded-xl p-4 text-xs font-mono text-amber-300/95 leading-relaxed overflow-x-auto">
                {envSnippet}
              </pre>
            </div>
          </div>

          {/* TOKENS & IP WHITELIST FIREWALL LIST */}
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-amber-400" />
                <h2 className="text-lg font-bold text-white">Active API Keys & Whitelist Firewall</h2>
              </div>

              {/* Generate Key Form */}
              <form onSubmit={handleGenerateKey} className="flex items-center gap-2">
                <input
                  type="text"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="Key label (e.g. Staging Server)"
                  className="bg-[#0e1422] border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/60"
                />
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 text-slate-950 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-amber-500/10 transition-all disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>{isGenerating ? "Generating..." : "New Key"}</span>
                </button>
              </form>
            </div>

            {/* Tokens Grid */}
            <div className="space-y-4">
              {operator?.tokens?.map((tokenItem: any, idx: number) => {
                const isSecretRevealed = !!revealedSecrets[tokenItem.id];
                const isSavingIp = savingIpId === tokenItem.id;

                return (
                  <div
                    key={tokenItem.id}
                    className="bg-[#0b0f19] border border-slate-800/90 rounded-2xl p-6 space-y-6 hover:border-slate-700/80 transition-all"
                  >
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/60 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                          <KeyRound className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-white">{tokenItem.name || `API Token #${idx + 1}`}</h3>
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-mono font-bold border border-emerald-500/20">
                              ACTIVE
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 font-mono">
                            Created: {new Date(tokenItem.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Token & Secret fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Token Box */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-400 flex items-center justify-between">
                          <span>API Token (Public Key)</span>
                          <span className="text-[10px] text-amber-400 font-mono">Bearer Auth</span>
                        </label>
                        <div className="flex items-center gap-2 bg-[#07090e] border border-slate-800 rounded-xl p-2.5">
                          <span className="font-mono text-xs text-white truncate flex-1">{tokenItem.token}</span>
                          <button
                            onClick={() => copyToClipboard(tokenItem.token, `token_${tokenItem.id}`)}
                            className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
                          >
                            {copiedKey === `token_${tokenItem.id}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Secret Key Box */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-400 flex items-center justify-between">
                          <span>Secret Key</span>
                          <span className="text-[10px] text-rose-400 font-mono">Keep Confidential</span>
                        </label>
                        <div className="flex items-center gap-2 bg-[#07090e] border border-slate-800 rounded-xl p-2.5">
                          <span className="font-mono text-xs text-amber-300 truncate flex-1">
                            {isSecretRevealed ? tokenItem.secretKey : "••••••••••••••••••••••••••••••••"}
                          </span>
                          <button
                            onClick={() =>
                              setRevealedSecrets((prev) => ({ ...prev, [tokenItem.id]: !prev[tokenItem.id] }))
                            }
                            className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
                          >
                            {isSecretRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => copyToClipboard(tokenItem.secretKey, `sec_${tokenItem.id}`)}
                            className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
                          >
                            {copiedKey === `sec_${tokenItem.id}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* IP Whitelist Firewall */}
                    <div className="bg-[#0e1422] border border-slate-800/80 rounded-xl p-4 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4 text-amber-400" />
                          <h4 className="text-xs font-bold text-white">IP Whitelist Firewall</h4>
                          <span className="text-[10px] text-slate-500 font-mono">(Comma separated IPs)</span>
                        </div>

                        {detectedIp && (
                          <button
                            type="button"
                            onClick={() => addDetectedIp(tokenItem.id)}
                            className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 self-start sm:self-auto"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Add Detected IP ({detectedIp})</span>
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={ipInputs[tokenItem.id] || ""}
                          onChange={(e) => setIpInputs({ ...ipInputs, [tokenItem.id]: e.target.value })}
                          placeholder="e.g. 192.168.1.1, 103.21.244.0 (Leave empty or '*' for unrestricted dev)"
                          className="flex-1 bg-[#07090e] border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-emerald-400 focus:outline-none focus:border-amber-500/60"
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveWhitelist(tokenItem.id)}
                          disabled={isSavingIp}
                          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 flex items-center gap-1.5 transition-all disabled:opacity-50"
                        >
                          {isSavingIp ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Saving...</span>
                            </>
                          ) : (
                            <>
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Update Firewall</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

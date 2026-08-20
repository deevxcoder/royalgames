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

  const fetchData = async () => {
    try {
      const res = await fetch("/api/operator/me");
      if (res.status === 401) {
        router.push("/portal/login");
        return;
      }
      const json = await res.json();
      setOperator(json.operator);

      const ips: { [id: string]: string } = {};
      json.operator?.tokens?.forEach((t: any) => {
        ips[t.id] = t.ipWhitelist || "";
      });
      setIpInputs(ips);
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
        setStatusMsg({ type: "success", text: "IP Whitelist updated successfully!" });
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
          <div>
            <h1 className="text-xl font-black text-white flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-amber-400" />
              API Credentials & Security Firewall
            </h1>
            <p className="text-sm text-slate-400">
              Manage your Royal Games Studio API tokens, private secret keys, and production server IP firewall.
            </p>
          </div>

          {statusMsg && (
            <div
              className={`p-3.5 rounded-xl text-xs flex items-center gap-2 border ${
                statusMsg.type === "success"
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                  : "bg-rose-500/10 border-rose-500/30 text-rose-400"
              }`}
            >
              {statusMsg.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{statusMsg.text}</span>
            </div>
          )}

          {/* Active Tokens List */}
          <div className="space-y-6">
            {operator?.tokens?.map((token: any, index: number) => {
              const isRevealed = revealedSecrets[token.id];

              return (
                <div
                  key={token.id}
                  className="bg-[#0b0f19] border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-black text-xs">
                        #{index + 1}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white">{token.name}</h3>
                        <p className="text-[10px] text-slate-500 font-mono">
                          Created {new Date(token.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 self-start sm:self-auto">
                      LIVE & ACTIVE
                    </span>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs">
                    {/* Public API Token */}
                    <div className="space-y-1.5">
                      <label className="block text-slate-400 font-semibold uppercase tracking-wider">
                        Public Studio API Token (Bearer)
                      </label>
                      <div className="flex items-center gap-2 bg-slate-950 border border-slate-700 p-2.5 rounded-xl font-mono text-slate-200">
                        <span className="truncate flex-1 select-all">{token.token}</span>
                        <button
                          onClick={() => copyToClipboard(token.token, `tok_${token.id}`)}
                          className="p-1 text-slate-400 hover:text-white transition-colors"
                          title="Copy Token"
                        >
                          {copiedKey === `tok_${token.id}` ? (
                            <Check className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Private Secret Key */}
                    <div className="space-y-1.5">
                      <label className="block text-slate-400 font-semibold uppercase tracking-wider">
                        Private Secret Key (256-bit)
                      </label>
                      <div className="flex items-center gap-2 bg-slate-950 border border-slate-700 p-2.5 rounded-xl font-mono text-amber-300">
                        <span className="truncate flex-1 select-all">
                          {isRevealed ? token.secretKey : "••••••••••••••••••••••••••••••••"}
                        </span>
                        <button
                          onClick={() =>
                            setRevealedSecrets((prev) => ({ ...prev, [token.id]: !prev[token.id] }))
                          }
                          className="p-1 text-slate-400 hover:text-white"
                          title={isRevealed ? "Hide Secret" : "Reveal Secret"}
                        >
                          {isRevealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => copyToClipboard(token.secretKey, `sec_${token.id}`)}
                          className="p-1 text-slate-400 hover:text-white"
                          title="Copy Secret"
                        >
                          {copiedKey === `sec_${token.id}` ? (
                            <Check className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* IP Whitelist Firewall */}
                  <div className="pt-2 border-t border-slate-800 space-y-2">
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-purple-400" />
                      Production Server IP Whitelist Firewall
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g. 103.21.244.0, 185.199.108.153 (Leave empty to allow all)"
                        value={ipInputs[token.id] || ""}
                        onChange={(e) =>
                          setIpInputs((prev) => ({ ...prev, [token.id]: e.target.value }))
                        }
                        className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                      />
                      <button
                        onClick={() => handleSaveWhitelist(token.id)}
                        disabled={savingIpId === token.id}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition-all disabled:opacity-50"
                      >
                        {savingIpId === token.id ? "Saving..." : "Update Firewall"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Generate New Key Box */}
          <div className="bg-[#0b0f19] border border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-amber-400" />
              Generate Additional API Token
            </h3>

            <form onSubmit={handleGenerateKey} className="flex gap-3 text-xs">
              <input
                type="text"
                required
                placeholder="e.g. Staging Server Key / Microservice Gateway"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                className="flex-1 px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
              />
              <button
                type="submit"
                disabled={isGenerating}
                className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 text-slate-950 font-bold rounded-xl shadow transition-all disabled:opacity-50"
              >
                {isGenerating ? "Generating..." : "Generate Key"}
              </button>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}

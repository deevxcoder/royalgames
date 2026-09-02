"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Key,
  Users,
  Plus,
  Minus,
  Trash2,
  RefreshCw,
  Eye,
  EyeOff,
  Copy,
  Check,
  Power,
  Edit3,
  Lock,
  AlertCircle,
  CheckCircle2,
  Send,
  Sliders,
  Wallet,
} from "lucide-react";

export default function AdminClientsPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
  const [revealedSecrets, setRevealedSecrets] = useState<{ [id: string]: boolean }>({});

  // Modals state
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
    credentials: any | null;
  }>({ open: false, credentials: null });

  // Edit Client Modal
  const [editClientModal, setEditClientModal] = useState<{
    open: boolean;
    client: any | null;
    name: string;
    email: string;
    callbackUrl: string;
    ggrRate: number;
    password: string;
    showPassword: boolean;
    saving: boolean;
    error: string | null;
  }>({
    open: false,
    client: null,
    name: "",
    email: "",
    callbackUrl: "",
    ggrRate: 10.0,
    password: "",
    showPassword: true,
    saving: false,
    error: null,
  });

  // Balance Adjustment Modal
  const [adjustModal, setAdjustModal] = useState<{ open: boolean; client: any | null; type: "CREDIT" | "DEBIT" }>({
    open: false,
    client: null,
    type: "CREDIT",
  });
  const [adjAmount, setAdjAmount] = useState("10000");
  const [adjReason, setAdjReason] = useState("");
  const [adjLoading, setAdjLoading] = useState(false);

  // Delete Client Modal
  const [deleteModal, setDeleteModal] = useState<{
    open: boolean;
    client: any | null;
    deleting: boolean;
  }>({
    open: false,
    client: null,
    deleting: false,
  });

  const fetchClients = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/clients");
      if (res.ok) {
        const data = await res.json();
        setClients(data.clients || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKeyId(id);
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  // Create Client Submit
  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
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
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to create client");
      }

      setNewClientModalOpen(false);
      setNewClientName("");
      setNewClientEmail("");
      setNewClientPassword("Royal@2026!");
      setNewClientCallback("http://localhost:3001/api/v1/round/resolve");
      setNewClientIpWhitelist("");

      const origin = window.location.origin;
      setCreatedSuccessModal({
        open: true,
        credentials: {
          name: data.client.companyName,
          email: data.client.email,
          password: data.password,
          token: data.initialKey.token,
          secretKey: data.initialKey.secretKey,
          callbackUrl: data.client.callbackUrl,
          portalUrl: `${origin}/portal/login`,
          emailResult: data.emailResult,
        },
      });

      fetchClients();
    } catch (e: any) {
      alert(e.message || "Failed to create client");
    } finally {
      setCreatingClient(false);
    }
  };

  // Open Edit Modal
  const handleOpenEditClient = (client: any) => {
    setEditClientModal({
      open: true,
      client,
      name: client.name || client.companyName || "",
      email: client.email || "",
      callbackUrl: client.callbackUrl || "",
      ggrRate: client.ggrRate || 10.0,
      password: "",
      showPassword: true,
      saving: false,
      error: null,
    });
  };

  // Save Edit Client
  const handleSaveEditClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editClientModal.client) return;
    setEditClientModal((prev) => ({ ...prev, saving: true, error: null }));
    try {
      const res = await fetch("/api/admin/clients", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editClientModal.client.id,
          name: editClientModal.name,
          email: editClientModal.email,
          callbackUrl: editClientModal.callbackUrl,
          ggrRate: editClientModal.ggrRate,
          password: editClientModal.password?.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to update client details");
      }
      setEditClientModal((prev) => ({ ...prev, open: false, saving: false }));
      fetchClients();
    } catch (err: any) {
      setEditClientModal((prev) => ({ ...prev, saving: false, error: err.message }));
    }
  };

  // Toggle Client Status
  const handleToggleStatus = async (client: any) => {
    const newStatus = client.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    const confirmMsg =
      newStatus === "SUSPENDED"
        ? `Are you sure you want to SUSPEND ${client.name}? Live game sessions for this operator will be paused.`
        : `Activate ${client.name}? Live game sessions will resume immediately.`;
    if (!confirm(confirmMsg)) return;

    try {
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
        fetchClients();
      }
    } catch (e: any) {
      alert(e.message);
      fetchClients();
    }
  };

  // Generate new API Key
  const handleGenerateKey = async (clientId: string) => {
    const keyName = prompt("Enter a label for this API Key (e.g. 'Staging Server Key'):", "Secondary API Key");
    if (!keyName) return;

    try {
      const res = await fetch("/api/admin/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, name: keyName }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        fetchClients();
      } else {
        alert(data.error || "Failed to generate key");
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Revoke Key
  const handleRevokeKey = async (clientId: string, keyId: string) => {
    if (!confirm("Are you sure you want to permanently revoke this API Key? External integrations using this key will immediately fail authentication.")) return;
    try {
      const res = await fetch(`/api/admin/keys?clientId=${clientId}&keyId=${keyId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        fetchClients();
      } else {
        alert(data.error || "Failed to revoke key");
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Adjust Balance
  const handleAdjustBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustModal.client) return;
    setAdjLoading(true);
    try {
      const delta = adjustModal.type === "CREDIT" ? Math.abs(Number(adjAmount)) : -Math.abs(Number(adjAmount));
      const res = await fetch("/api/admin/operators", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operatorId: adjustModal.client.id,
          amountDelta: delta,
          reason: adjReason,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAdjustModal({ open: false, client: null, type: "CREDIT" });
        fetchClients();
      } else {
        alert(data.error || "Failed to adjust balance");
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setAdjLoading(false);
    }
  };

  // Delete Client
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
        setClients((prev) => prev.filter((c) => c.id !== clientId));
        setDeleteModal({ open: false, client: null, deleting: false });
        fetchClients();
      } else {
        alert(data.error || "Failed to delete client");
        setDeleteModal((prev) => ({ ...prev, deleting: false }));
      }
    } catch (e: any) {
      alert(e.message || "Failed to delete client");
      setDeleteModal((prev) => ({ ...prev, deleting: false }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-[#0e1320] via-[#0f172a] to-[#0e1320] border border-amber-500/30 rounded-3xl p-6 shadow-xl">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Key className="w-5 h-5 text-amber-400" />
            <span>B2B Aggregator & Client API Key Management</span>
          </h2>
          <p className="text-xs text-gray-400 mt-1 max-w-2xl">
            Generate secure API Keys (<code className="text-amber-300 font-mono">rgs_live_...</code>) and Secret Keys for external casino operators to integrate and launch native HTML5 games.
          </p>
        </div>

        <button
          onClick={() => setNewClientModalOpen(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold px-4 py-2.5 rounded-xl shadow-lg shadow-amber-500/20 text-xs transition-all shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Register New Aggregator / Client</span>
        </button>
      </div>

      {/* Clients List */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-xs">Loading B2B Clients...</div>
        ) : clients.length === 0 ? (
          <div className="p-12 text-center bg-[#0a0d16] border border-slate-800 rounded-2xl text-gray-400">
            <p className="text-sm">No external clients registered yet.</p>
            <button
              onClick={() => setNewClientModalOpen(true)}
              className="mt-3 text-xs font-bold text-amber-400 underline hover:text-amber-300"
            >
              Register your first B2B Client
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
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      client.status === "ACTIVE"
                        ? "bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/30 text-rose-300"
                        : "bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-300"
                    }`}
                    title={client.status === "ACTIVE" ? "Suspend Client" : "Activate Client"}
                  >
                    <Power className="w-3.5 h-3.5" />
                    <span>{client.status === "ACTIVE" ? "Suspend" : "Activate"}</span>
                  </button>

                  {/* Edit Client & Password Button */}
                  <button
                    onClick={() => handleOpenEditClient(client)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-xs font-bold text-amber-300 transition-colors cursor-pointer shadow-sm"
                    title="Edit client name, email, callback URL and change password"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                    <span>Edit / Password</span>
                  </button>

                  {/* New API Key Button */}
                  <button
                    onClick={() => handleGenerateKey(client.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-amber-300 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>New Key</span>
                  </button>

                  {/* Delete Client Button */}
                  {!client.isAdmin && (
                    <button
                      onClick={() => setDeleteModal({ open: true, client, deleting: false })}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-xs font-bold text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
                      title="Delete this client and remove all keys"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
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
                    <span className="text-xs font-bold text-purple-300 font-mono">{client.ggrRate || 10.0}% Royalty</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setAdjustModal({ open: true, client, type: "CREDIT" });
                      setAdjAmount("10000");
                      setAdjReason("Manual Studio Balance Recharge");
                    }}
                    className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
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
                    className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/40 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5 stroke-[3]" />
                    <span>- Deduct Balance</span>
                  </button>
                </div>
              </div>

              {/* Active API Keys Table */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                  Assigned Studio API Keys & Secrets ({client.tokens?.length || 0})
                </span>

                {!client.tokens || client.tokens.length === 0 ? (
                  <div className="bg-[#080a10] border border-dashed border-slate-800 rounded-xl p-4 text-center text-xs text-gray-400">
                    No active API keys found for this client.
                  </div>
                ) : (
                  client.tokens.map((token: any) => {
                    const isSecretVisible = revealedSecrets[token.id];
                    return (
                      <div
                        key={token.id}
                        className="bg-[#080a10] border border-slate-800/80 rounded-xl p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs font-mono"
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-sans font-bold text-white text-[11px]">{token.name}</span>
                            <span className="text-[9px] px-2 py-0.2 rounded-full font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                              ACTIVE
                            </span>
                            {token.ipWhitelist && (
                              <span className="text-[9px] text-gray-400 bg-slate-800 px-1.5 py-0.2 rounded">
                                IP: {token.ipWhitelist}
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-2 text-[11px]">
                            {/* API Token */}
                            <div className="flex items-center gap-2 bg-[#0c101a] px-3 py-1 rounded-lg border border-slate-800">
                              <span className="text-gray-500 text-[10px] font-sans font-bold">API TOKEN:</span>
                              <span className="text-amber-300 select-all">{token.token}</span>
                              <button
                                onClick={() => copyToClipboard(token.token, `tok_${token.id}`)}
                                className="text-gray-400 hover:text-white"
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
                                className="text-gray-400 hover:text-white"
                              >
                                {isSecretVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                              <button
                                onClick={() => copyToClipboard(token.secretKey, `sec_${token.id}`)}
                                className="text-gray-400 hover:text-white"
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
                          className="self-end md:self-center p-2 text-gray-500 hover:text-rose-400 transition-colors flex items-center gap-1 text-xs font-semibold cursor-pointer"
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

      {/* MODAL 1: Register New Client */}
      {newClientModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0c101c] border border-amber-500/40 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-400" />
                <span>Register B2B Client & Generate Keys</span>
              </h3>
              <button
                onClick={() => setNewClientModalOpen(false)}
                className="text-gray-400 hover:text-white text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateClient} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-300 font-bold block mb-1">Company / Casino Brand Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Royal Games Casino"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  className="w-full bg-[#07090e] border border-slate-700 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Operator Admin Login Email *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. partner@casino.com"
                  value={newClientEmail}
                  onChange={(e) => setNewClientEmail(e.target.value)}
                  className="w-full bg-[#07090e] border border-slate-700 rounded-xl px-3.5 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Portal Login Password *</label>
                <div className="relative flex items-center">
                  <input
                    type={showNewClientPassword ? "text" : "password"}
                    required
                    value={newClientPassword}
                    onChange={(e) => setNewClientPassword(e.target.value)}
                    className="w-full bg-[#07090e] border border-slate-700 rounded-xl pl-3.5 pr-10 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewClientPassword(!showNewClientPassword)}
                    className="absolute right-3 text-gray-400 hover:text-white"
                  >
                    {showNewClientPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Settlement Callback URL (Webhook)</label>
                <input
                  type="url"
                  placeholder="http://localhost:3001/api/callback"
                  value={newClientCallback}
                  onChange={(e) => setNewClientCallback(e.target.value)}
                  className="w-full bg-[#07090e] border border-slate-700 rounded-xl px-3.5 py-2 text-white font-mono focus:outline-none focus:border-amber-500 text-[11px]"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">IP Whitelist (Optional)</label>
                <input
                  type="text"
                  placeholder="Comma separated IPs or empty for open access"
                  value={newClientIpWhitelist}
                  onChange={(e) => setNewClientIpWhitelist(e.target.value)}
                  className="w-full bg-[#07090e] border border-slate-700 rounded-xl px-3.5 py-2 text-white font-mono focus:outline-none focus:border-amber-500 text-[11px]"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setNewClientModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-gray-300 hover:text-white font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingClient}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold shadow-lg shadow-amber-500/20 flex items-center gap-2 cursor-pointer"
                >
                  {creatingClient ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>Create Client & Generate Keys</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Created Success Modal */}
      {createdSuccessModal.open && createdSuccessModal.credentials && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0c101c] border border-emerald-500/50 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-black text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                <span>Client Account & API Keys Created!</span>
              </h3>
              <button
                onClick={() => setCreatedSuccessModal({ open: false, credentials: null })}
                className="text-gray-400 hover:text-white text-xs font-bold cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            <div className="bg-[#07090e] border border-slate-800 rounded-2xl p-4 space-y-3 text-xs font-mono">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-gray-400 font-sans">Company:</span>
                <span className="font-bold text-white">{createdSuccessModal.credentials.name}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-gray-400 font-sans">Portal URL:</span>
                <span className="text-sky-400">{createdSuccessModal.credentials.portalUrl}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-gray-400 font-sans">Login Email:</span>
                <span className="text-white font-bold">{createdSuccessModal.credentials.email}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-gray-400 font-sans">Portal Password:</span>
                <span className="text-emerald-400 font-bold">{createdSuccessModal.credentials.password}</span>
              </div>
              <div className="flex flex-col gap-1 border-b border-slate-800 pb-2">
                <span className="text-gray-400 font-sans text-[11px]">API Token:</span>
                <span className="text-amber-400 text-[11px] break-all select-all">{createdSuccessModal.credentials.token}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-gray-400 font-sans text-[11px]">Secret Key:</span>
                <span className="text-emerald-400 text-[11px] break-all select-all">{createdSuccessModal.credentials.secretKey}</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setCreatedSuccessModal({ open: false, credentials: null })}
                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Edit Client & Change Password Modal */}
      {editClientModal.open && editClientModal.client && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0c101c] border border-amber-500/50 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-amber-400" />
                <span>Edit Client & Password: {editClientModal.client.name || editClientModal.client.companyName}</span>
              </h3>
              <button
                onClick={() => setEditClientModal((prev) => ({ ...prev, open: false, client: null }))}
                className="text-gray-400 hover:text-white text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {editClientModal.error && (
              <div className="p-3 bg-rose-950/50 border border-rose-500/50 rounded-xl text-rose-300 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{editClientModal.error}</span>
              </div>
            )}

            <form onSubmit={handleSaveEditClient} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 font-bold block mb-1 uppercase tracking-wider text-[10px]">
                  Company / Casino Name *
                </label>
                <input
                  type="text"
                  required
                  value={editClientModal.name}
                  onChange={(e) => setEditClientModal((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-[#07090e] border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-500 font-semibold"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1 uppercase tracking-wider text-[10px]">
                  Login Email *
                </label>
                <input
                  type="email"
                  required
                  value={editClientModal.email}
                  onChange={(e) => setEditClientModal((prev) => ({ ...prev, email: e.target.value }))}
                  className="w-full bg-[#07090e] border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1 uppercase tracking-wider text-[10px]">
                  Settlement Webhook Callback URL
                </label>
                <input
                  type="url"
                  value={editClientModal.callbackUrl}
                  onChange={(e) => setEditClientModal((prev) => ({ ...prev, callbackUrl: e.target.value }))}
                  placeholder="http://localhost:3001/api/callback"
                  className="w-full bg-[#07090e] border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-amber-500 text-[11px]"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1 uppercase tracking-wider text-[10px]">
                  Studio Revenue Share Rate (GGR %)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="50"
                    step="0.5"
                    value={editClientModal.ggrRate}
                    onChange={(e) => setEditClientModal((prev) => ({ ...prev, ggrRate: Number(e.target.value) }))}
                    className="w-32 bg-[#07090e] border border-slate-700 rounded-xl px-3.5 py-2 text-white font-mono focus:outline-none focus:border-amber-500 font-bold"
                  />
                  <span className="text-slate-400 font-bold">% Studio Royalty</span>
                </div>
              </div>

              {/* Password Change / Reset Box */}
              <div className="p-4 rounded-2xl bg-[#07090e] border border-amber-500/30 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-amber-400 font-bold flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Change / Reset Password</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const rand = `RGS_${Math.random().toString(36).slice(-6)}!99`;
                      setEditClientModal((prev) => ({ ...prev, password: rand, showPassword: true }));
                    }}
                    className="text-[10px] font-bold text-amber-400 hover:text-amber-300 underline cursor-pointer"
                  >
                    🎲 Generate Random
                  </button>
                </div>

                <div className="relative flex items-center">
                  <input
                    type={editClientModal.showPassword ? "text" : "password"}
                    value={editClientModal.password}
                    onChange={(e) => setEditClientModal((prev) => ({ ...prev, password: e.target.value }))}
                    placeholder="Leave empty to keep existing password"
                    className="w-full bg-[#0a0d16] border border-slate-700 rounded-xl pl-3.5 pr-20 py-2.5 text-white font-mono focus:outline-none focus:border-amber-500 text-xs"
                  />
                  <div className="absolute right-2 flex items-center gap-1">
                    {editClientModal.password && (
                      <button
                        type="button"
                        onClick={() => copyToClipboard(editClientModal.password, "edit_pass")}
                        className="p-1.5 text-gray-400 hover:text-white"
                        title="Copy Password"
                      >
                        {copiedKeyId === "edit_pass" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setEditClientModal((prev) => ({ ...prev, showPassword: !prev.showPassword }))}
                      className="p-1.5 text-gray-400 hover:text-white"
                    >
                      {editClientModal.showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <p className="text-[10px] text-gray-400">
                  Password sirf tab change hoga jab aap yahan nayi password type karenge. Khali chhodne par purana password hi rahega.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditClientModal((prev) => ({ ...prev, open: false, client: null }))}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-gray-300 hover:text-white font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editClientModal.saving}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold shadow-lg shadow-amber-500/20 flex items-center gap-2 cursor-pointer"
                >
                  {editClientModal.saving ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Save Client & Password</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Balance Adjustment Modal */}
      {adjustModal.open && adjustModal.client && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0c101c] border border-amber-500/40 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Wallet className="w-5 h-5 text-amber-400" />
                <span>
                  {adjustModal.type === "CREDIT" ? "Credit GGR Balance" : "Deduct Balance"}: {adjustModal.client.name}
                </span>
              </h3>
              <button
                onClick={() => setAdjustModal({ open: false, client: null, type: "CREDIT" })}
                className="text-gray-400 hover:text-white text-xs font-bold cursor-pointer"
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
                  placeholder="e.g. Offline bank transfer recharge / Correction"
                  value={adjReason}
                  onChange={(e) => setAdjReason(e.target.value)}
                  className="w-full bg-[#07090e] border border-slate-700 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustModal({ open: false, client: null, type: "CREDIT" })}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-gray-300 hover:text-white font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adjLoading}
                  className={`px-5 py-2 rounded-xl font-black text-slate-950 shadow-lg cursor-pointer ${
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

      {/* MODAL 5: Delete Client Confirmation */}
      {deleteModal.open && deleteModal.client && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0c101c] border border-rose-500/50 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-black text-rose-400 flex items-center gap-2">
                <Trash2 className="w-5 h-5" />
                <span>Delete External Client?</span>
              </h3>
              <button
                onClick={() => setDeleteModal({ open: false, client: null, deleting: false })}
                className="text-gray-400 hover:text-white text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-gray-300">
              <p>
                Are you sure you want to permanently delete <strong>{deleteModal.client.name}</strong>?
              </p>
              <div className="bg-rose-950/40 border border-rose-500/30 rounded-xl p-3 text-rose-300 space-y-1 text-[11px]">
                <p className="font-bold">⚠️ Warning: Irreversible Action</p>
                <p>This action will permanently delete all associated API keys, deposit requests, and session records.</p>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteModal({ open: false, client: null, deleting: false })}
                className="px-4 py-2 rounded-xl bg-slate-800 text-gray-300 hover:text-white font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteModal.deleting}
                onClick={handleDeleteClient}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black shadow-lg shadow-rose-600/20 cursor-pointer"
              >
                {deleteModal.deleting ? "Deleting..." : "Permanently Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

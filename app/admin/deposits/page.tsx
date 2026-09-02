"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Wallet,
  CheckCircle2,
  AlertCircle,
  Clock,
  Send,
  Building2,
  RefreshCw,
  Search,
} from "lucide-react";

export default function AdminDepositsPage() {
  const [deposits, setDeposits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectModalId, setRejectModalId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectLoading, setRejectLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  const fetchDeposits = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/deposits");
      if (res.ok) {
        const data = await res.json();
        setDeposits(data.deposits || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDeposits();
  }, [fetchDeposits]);

  // Approve Deposit
  const handleApproveDeposit = async (id: string) => {
    if (!confirm("Approve this deposit? Funds will be credited to the operator's GGR balance immediately.")) return;
    try {
      const res = await fetch("/api/admin/deposits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ depositId: id, action: "APPROVE" }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        fetchDeposits();
      } else {
        alert(data.error || "Failed to approve deposit");
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Reject Deposit
  const handleRejectDeposit = async () => {
    if (!rejectModalId) return;
    setRejectLoading(true);
    try {
      const res = await fetch("/api/admin/deposits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          depositId: rejectModalId,
          action: "REJECT",
          adminNotes: rejectReason || "Rejected: UTR verification failed",
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setRejectModalId(null);
        setRejectReason("");
        fetchDeposits();
      } else {
        alert(data.error || "Failed to reject deposit");
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setRejectLoading(false);
    }
  };

  // Filtered deposits
  const filtered = deposits.filter((d) => {
    if (filterStatus !== "ALL" && d.status !== filterStatus) return false;
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      const matchOp = d.operator?.companyName?.toLowerCase().includes(s);
      const matchEmail = d.operator?.email?.toLowerCase().includes(s);
      const matchRef = d.transactionRef?.toLowerCase().includes(s);
      return matchOp || matchEmail || matchRef;
    }
    return true;
  });

  const pendingCount = deposits.filter((d) => d.status === "PENDING").length;
  const approvedTotal = deposits
    .filter((d) => d.status === "APPROVED")
    .reduce((acc, d) => acc + (d.amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Banner */}
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

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={fetchDeposits}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 border border-slate-700 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Queue</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl p-5 space-y-1">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Pending Action</span>
          <div className="text-2xl font-black text-amber-400 font-mono flex items-center gap-2">
            <span>{pendingCount}</span>
            {pendingCount > 0 && <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-sans">Needs Review</span>}
          </div>
          <p className="text-[10px] text-slate-500">Awaiting UTR bank confirmation</p>
        </div>

        <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl p-5 space-y-1">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Approved Volume</span>
          <div className="text-2xl font-black text-emerald-400 font-mono">
            ₹{approvedTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[10px] text-slate-500">Total credited to client GGR wallets</p>
        </div>

        <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl p-5 space-y-1">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Verification Policy</span>
          <div className="text-sm font-bold text-white flex items-center gap-1.5 pt-1">
            <Building2 className="w-4 h-4 text-purple-400" />
            <span>Manual Bank Statement Match</span>
          </div>
          <p className="text-[10px] text-slate-500">Clients cannot self-credit funds</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0b0f19] border border-slate-800 rounded-2xl p-3.5 text-xs">
        <div className="flex items-center gap-2">
          {(["ALL", "PENDING", "APPROVED", "REJECTED"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                filterStatus === status
                  ? "bg-amber-500 text-slate-950 shadow-md"
                  : "bg-slate-900 text-slate-400 hover:text-white"
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by client, email, UTR..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-[#07090e] border border-slate-700 rounded-xl pl-8 pr-3.5 py-1.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500 text-xs w-full sm:w-64"
          />
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-[#0b0f19] border border-slate-800 rounded-3xl p-6 shadow-lg space-y-4">
        {loading ? (
          <div className="text-center py-12 text-slate-500 text-xs">Loading deposits...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs">
            No deposit requests found matching your filter.
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
                  <th className="pb-3">Admin Notes</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filtered.map((dep) => (
                  <tr key={dep.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3">
                      <div className="font-bold text-white">{dep.operator?.companyName || "Unknown"}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{dep.operator?.email}</div>
                    </td>
                    <td className="py-3 font-mono font-bold text-emerald-400 text-sm">
                      ₹{Number(dep.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
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
                    <td className="py-3 text-slate-400 text-[11px] max-w-[150px] truncate">
                      {dep.adminNotes || "—"}
                    </td>
                    <td className="py-3 text-right">
                      {dep.status === "PENDING" ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleApproveDeposit(dep.id)}
                            className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1 shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Approve & Credit</span>
                          </button>
                          <button
                            onClick={() => {
                              setRejectModalId(dep.id);
                              setRejectReason("");
                            }}
                            className="px-2.5 py-1.5 bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 font-bold rounded-lg text-xs transition-all cursor-pointer"
                          >
                            <span>Reject</span>
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-500 font-mono">
                          {dep.processedBy ? `By: ${dep.processedBy}` : "Completed"}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {rejectModalId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0c101c] border border-rose-500/40 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-black text-rose-400 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                <span>Reject Deposit Request</span>
              </h3>
              <button
                onClick={() => setRejectModalId(null)}
                className="text-gray-400 hover:text-white text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 font-semibold block mb-1">Reason for Rejection *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. UTR reference not found in bank statement / Incorrect amount"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full bg-[#07090e] border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-rose-500 text-xs"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectModalId(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-gray-300 hover:text-white font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={rejectLoading}
                onClick={handleRejectDeposit}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs shadow-lg shadow-rose-600/20 cursor-pointer"
              >
                {rejectLoading ? "Rejecting..." : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PortalNavbar } from "../components/PortalNavbar";
import { PortalSidebar } from "../components/PortalSidebar";
import {
  Wallet,
  CreditCard,
  QrCode,
  CheckCircle2,
  AlertCircle,
  Clock,
  Send,
  Building2,
  Copy,
  Check,
  Coins,
} from "lucide-react";

export default function WalletPage() {
  const router = useRouter();
  const [operator, setOperator] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [depositRequests, setDepositRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [depositAmount, setDepositAmount] = useState("10000");
  const [paymentMethod, setPaymentMethod] = useState<"UPI" | "USDT_TRC20" | "BANK_TRANSFER">("UPI");
  const [transactionRef, setTransactionRef] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [meRes, depRes] = await Promise.all([
        fetch("/api/operator/me"),
        fetch("/api/operator/deposits"),
      ]);

      if (meRes.status === 401) {
        router.push("/portal/login");
        return;
      }

      const meJson = await meRes.json();
      const depJson = await depRes.json();

      setOperator(meJson.operator);
      setTransactions(meJson.recentTransactions || []);
      setDepositRequests(depJson.deposits || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      const res = await fetch("/api/operator/deposits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(depositAmount),
          paymentMethod,
          transactionRef: transactionRef.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSubmitMessage({
          type: "success",
          text: "Deposit request submitted! Studio Super Admin will verify your UTR and credit your GGR balance.",
        });
        setTransactionRef("");
        await fetchData();
      } else {
        setSubmitMessage({
          type: "error",
          text: data.error || "Failed to submit deposit request",
        });
      }
    } catch (e: any) {
      setSubmitMessage({
        type: "error",
        text: e.message || "Failed to submit request",
      });
    } finally {
      setIsSubmitting(false);
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
              <Wallet className="w-5 h-5 text-emerald-400" />
              Prepaid GGR Balance & Deposit Management
            </h1>
            <p className="text-sm text-slate-400">
              Submit manual recharge requests with your payment UTR / TxHash. Studio Super Admin verifies and credits your wallet.
            </p>
          </div>

          {/* Top Balance & Payment Accounts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Balance Overview */}
            <div className="bg-[#0b0f19] border border-slate-800 rounded-3xl p-6 space-y-4 flex flex-col justify-between">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Current Available GGR Credit
                </span>
                <div className="text-3xl font-bold text-emerald-400 font-mono">
                  {operator?.currency || "INR"} {Number(operator?.balance || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </div>
              </div>

              <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Hold / Revenue Share Rate:</span>
                  <span className="font-semibold text-white">{operator?.ggrRate || 10.0}%</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Billing Model:</span>
                  <span className="font-semibold text-amber-400">Auto-deducted on Game Rounds</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Wallet Status:</span>
                  <span className="font-semibold text-emerald-400 font-mono">
                    {Number(operator?.balance || 0) > 0 ? "ACTIVE & READY" : "LOW BALANCE"}
                  </span>
                </div>
              </div>

              {/* Instant Sandbox Demo Recharge Button */}
              <button
                type="button"
                onClick={async () => {
                  try {
                    const res = await fetch("/api/operator/demo-recharge", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ amount: 10000 }),
                    });
                    if (res.ok) {
                      await fetchData();
                      setSubmitMessage({
                        type: "success",
                        text: "🎉 Instant Sandbox Demo Credit added (+ ₹10,000 INR) successfully!",
                      });
                    }
                  } catch (e) {
                    // ignore
                  }
                }}
                className="w-full py-2.5 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 hover:from-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all"
              >
                <Coins className="w-3.5 h-3.5 text-amber-400" />
                <span>+ ₹10,000 Instant Sandbox Recharge</span>
              </button>
            </div>

            {/* Right: Studio Admin Payment Accounts */}
            <div className="lg:col-span-2 bg-[#0b0f19] border border-slate-800 rounded-3xl p-6 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-amber-400" />
                Studio Super Admin Payment Accounts (Transfer Recharge Funds Here)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                {/* UPI QR / VPA */}
                <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between text-amber-400 font-semibold">
                    <span className="flex items-center gap-1.5">
                      <QrCode className="w-3.5 h-3.5" /> Instant UPI
                    </span>
                    <span className="text-[10px] bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                      INR
                    </span>
                  </div>
                  <div className="text-slate-300 font-mono text-[11px] select-all bg-[#0d121c] p-2 rounded-xl border border-slate-800 flex items-center justify-between">
                    <span>royalstudio@upi</span>
                    <button
                      onClick={() => copyToClipboard("royalstudio@upi", "upi")}
                      className="p-1 hover:text-amber-400"
                    >
                      {copiedKey === "upi" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                  <div className="text-[10px] text-slate-400">GPay, PhonePe, Paytm, BHIM</div>
                </div>

                {/* USDT TRC20 */}
                <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between text-emerald-400 font-semibold">
                    <span className="flex items-center gap-1.5">
                      <Coins className="w-3.5 h-3.5" /> USDT Crypto
                    </span>
                    <span className="text-[10px] bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                      TRC-20
                    </span>
                  </div>
                  <div className="text-slate-300 font-mono text-[10px] select-all bg-[#0d121c] p-2 rounded-xl border border-slate-800 flex items-center justify-between truncate">
                    <span className="truncate">TJ8xRoyalStudioWalletOfficialTRC20</span>
                    <button
                      onClick={() => copyToClipboard("TJ8xRoyalStudioWalletOfficialTRC20", "usdt")}
                      className="p-1 hover:text-emerald-400 shrink-0"
                    >
                      {copiedKey === "usdt" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                  <div className="text-[10px] text-slate-400">Network: TRON (TRC20)</div>
                </div>

                {/* Bank Transfer */}
                <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between text-purple-400 font-semibold">
                    <span className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5" /> Bank Transfer
                    </span>
                    <span className="text-[10px] bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20">
                      IMPS / NEFT
                    </span>
                  </div>
                  <div className="text-slate-300 font-mono text-[10px] bg-[#0d121c] p-2 rounded-xl border border-slate-800 space-y-0.5">
                    <div>A/C: 9876543210123</div>
                    <div>IFSC: HDFC0001234</div>
                  </div>
                  <div className="text-[10px] text-slate-400">Royal Games Studio Technologies</div>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Deposit Request Form */}
          <div className="bg-[#0b0f19] border border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Send className="w-4 h-4 text-amber-400" />
              Submit Deposit / Top-up Request
            </h3>

            {submitMessage && (
              <div
                className={`p-3.5 rounded-xl text-xs flex items-center gap-2 border ${
                  submitMessage.type === "success"
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                    : "bg-rose-500/10 border-rose-500/30 text-rose-400"
                }`}
              >
                {submitMessage.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{submitMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleDepositSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1.5 font-semibold uppercase tracking-wider">
                    Deposit Amount ({operator?.currency || "INR"})
                  </label>
                  <input
                    type="number"
                    min="100"
                    step="100"
                    required
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-amber-500"
                  />
                  <div className="flex gap-1.5 mt-2">
                    {["5000", "10000", "25000", "50000"].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setDepositAmount(amt)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-mono border transition-all ${
                          depositAmount === amt
                            ? "bg-amber-500/20 text-amber-400 border-amber-500/40 font-bold"
                            : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                        }`}
                      >
                        ₹{Number(amt).toLocaleString()}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1.5 font-semibold uppercase tracking-wider">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-medium focus:outline-none focus:border-amber-500 text-xs"
                  >
                    <option value="UPI">Instant UPI (GPay / PhonePe / Paytm)</option>
                    <option value="USDT_TRC20">USDT Crypto (TRC-20)</option>
                    <option value="BANK_TRANSFER">Bank Transfer (IMPS / NEFT)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1.5 font-semibold uppercase tracking-wider">
                    Transaction Reference (UTR Number / TxHash)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 412891823901 or 0x48a..."
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-amber-500"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Enter the exact UTR from your bank or crypto transaction.
                  </p>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                {isSubmitting ? "Submitting Request..." : `Submit Deposit Request (₹${Number(depositAmount).toLocaleString()})`}
              </button>
            </form>
          </div>

          {/* Deposit Requests Table */}
          <div className="bg-[#0b0f19] border border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              Your Deposit Requests History
            </h3>

            {depositRequests.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500">
                No deposit requests submitted yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="pb-2">Payment Method</th>
                      <th className="pb-2">Transaction UTR / TxHash</th>
                      <th className="pb-2">Amount</th>
                      <th className="pb-2">Status</th>
                      <th className="pb-2">Admin Notes</th>
                      <th className="pb-2">Submitted Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {depositRequests.map((dep: any) => (
                      <tr key={dep.id} className="hover:bg-slate-800/40">
                        <td className="py-2.5 font-semibold text-slate-200">
                          {dep.paymentMethod}
                        </td>
                        <td className="py-2.5 font-mono text-slate-300 select-all font-semibold">
                          {dep.transactionRef}
                        </td>
                        <td className="py-2.5 font-mono font-bold text-emerald-400">
                          ₹{Number(dep.amount).toLocaleString()}
                        </td>
                        <td className="py-2.5">
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
                        <td className="py-2.5 text-slate-400 text-[11px]">
                          {dep.adminNotes || "—"}
                        </td>
                        <td className="py-2.5 text-slate-500">
                          {new Date(dep.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Transaction Ledger */}
          <div className="bg-[#0b0f19] border border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-purple-400" />
              GGR Billing & Recharge Ledger
            </h3>

            {transactions.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500">
                No transactions recorded yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="pb-2">Type</th>
                      <th className="pb-2">Description / Reference</th>
                      <th className="pb-2">Amount</th>
                      <th className="pb-2">Balance After</th>
                      <th className="pb-2">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {transactions.map((tx: any) => (
                      <tr key={tx.id} className="hover:bg-slate-800/40">
                        <td className="py-2.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              tx.amount > 0
                                ? "bg-emerald-500/20 text-emerald-400"
                                : "bg-rose-500/20 text-rose-400"
                            }`}
                          >
                            {tx.type}
                          </span>
                        </td>
                        <td className="py-2.5 text-slate-300">
                          <div>{tx.description}</div>
                          {tx.referenceId && (
                            <div className="text-[10px] text-slate-500 font-mono">{tx.referenceId}</div>
                          )}
                        </td>
                        <td
                          className={`py-2.5 font-mono font-bold ${
                            tx.amount > 0 ? "text-emerald-400" : "text-rose-400"
                          }`}
                        >
                          {tx.amount > 0 ? `+₹${tx.amount}` : `-₹${Math.abs(tx.amount)}`}
                        </td>
                        <td className="py-2.5 font-mono text-slate-300">₹{tx.balanceAfter}</td>
                        <td className="py-2.5 text-slate-500">
                          {new Date(tx.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

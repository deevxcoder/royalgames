"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Crown, LogOut, Wallet } from "lucide-react";

export function PortalNavbar({ operator }: { operator: any }) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch("/api/operator/logout", { method: "POST" });
      router.push("/portal/login");
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <header className="h-16 bg-[#0c101a]/90 backdrop-blur border-b border-slate-800 px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <Link href="/portal/dashboard" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-600 to-yellow-400 flex items-center justify-center shadow-lg shadow-amber-500/20 text-slate-950 font-black">
            👑
          </div>
          <div>
            <span className="font-bold text-lg tracking-wider text-amber-400 font-mono">
              ROYAL<span className="text-white">STUDIO</span>
            </span>
            <span className="ml-2 text-[10px] uppercase tracking-widest bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30 font-bold">
              Client Portal
            </span>
          </div>
        </Link>
      </div>

      <div className="flex items-center gap-4">
        {operator && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700">
            <Wallet className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-slate-400">Prepaid GGR:</span>
            <span className="text-sm font-bold text-emerald-400 font-mono">
              {operator.currency || "INR"} {Number(operator.balance || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
          </div>
        )}

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400 font-semibold">
              {operator?.companyName ? operator.companyName[0].toUpperCase() : "C"}
            </div>
            <span className="hidden md:inline font-medium">{operator?.companyName || "Client Casino"}</span>
          </div>

          <button
            onClick={handleLogout}
            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}

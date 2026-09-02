"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Crown, LogOut, Wallet, RefreshCw, ExternalLink } from "lucide-react";

interface PortalNavbarProps {
  operator: any;
  onRefresh?: () => void | Promise<void>;
  isRefreshing?: boolean;
}

export function PortalNavbar({ operator, onRefresh, isRefreshing }: PortalNavbarProps) {
  const router = useRouter();
  const [internalRefreshing, setInternalRefreshing] = useState(false);

  const handleLogout = async () => {
    try {
      await fetch("/api/operator/logout", { method: "POST" });
      router.push("/portal/login");
    } catch (e) {
      console.error(e);
    }
  };

  const handleRefreshClick = async () => {
    setInternalRefreshing(true);
    if (onRefresh) {
      try {
        await onRefresh();
      } catch (err) {
        console.error("Refresh error:", err);
      }
    } else {
      router.refresh();
      window.location.reload();
    }
    setTimeout(() => setInternalRefreshing(false), 800);
  };

  const spinning = isRefreshing || internalRefreshing;

  return (
    <header className="h-16 bg-[#0c101a]/90 backdrop-blur border-b border-slate-800 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
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

      <div className="flex items-center gap-2 sm:gap-3.5">
        {/* Live Telemetry Pulse (Admin Match) */}
        <div className="hidden sm:flex items-center gap-2 bg-[#06080e] border border-emerald-500/20 px-3 py-1.5 rounded-xl text-xs font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-emerald-300 font-bold text-[11px]">Live Sync (4s)</span>
        </div>

        {/* Refresh Data Button */}
        <button
          onClick={handleRefreshClick}
          disabled={spinning}
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-gray-300 hover:text-white transition-colors cursor-pointer"
          title="Refresh Data & Balance"
        >
          <RefreshCw className={`w-4 h-4 ${spinning ? "animate-spin text-amber-400" : ""}`} />
        </button>

        {/* Live Game Suite Showcase Link */}
        <Link
          href="/"
          target="_blank"
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/30 hover:border-amber-400 text-xs font-bold text-amber-300 hover:text-amber-200 transition-colors"
        >
          <span>Showcase</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>

        {/* Operator GGR Balance Badge */}
        {operator && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700">
            <Wallet className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-xs text-slate-400 hidden lg:inline">Prepaid GGR:</span>
            <span className="text-sm font-bold text-emerald-400 font-mono">
              {operator.currency || "INR"} {Number(operator.balance || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
          </div>
        )}

        {/* Operator Profile & Logout */}
        <div className="flex items-center gap-2 sm:gap-3 pl-2 border-l border-slate-800/80">
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400 font-semibold shrink-0">
              {operator?.companyName ? operator.companyName[0].toUpperCase() : "C"}
            </div>
            <span className="hidden xl:inline font-medium truncate max-w-[120px]">{operator?.companyName || "Client Casino"}</span>
          </div>

          <button
            onClick={handleLogout}
            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}

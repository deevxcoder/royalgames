"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  ChevronRight,
  RefreshCw,
  ExternalLink,
} from "lucide-react";

interface AdminHeaderProps {
  onOpenMobile?: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

const ROUTE_LABELS: Record<string, string> = {
  "/admin": "Executive Dashboard",
  "/admin/clients": "B2B Clients & API Keys",
  "/admin/deposits": "Deposit Approvals Queue",
  "/admin/rounds": "Live Game Rounds Audit",
  "/admin/reports": "GGR & Financial Reports",
  "/admin/game-control": "Live Game Outcome Control (God Mode)",
  "/admin/rtp": "RTP & House Edge Controls",
  "/admin/docs": "API Docs & Integration Tester",
};

export function AdminHeader({ onOpenMobile, onRefresh, isRefreshing = false }: AdminHeaderProps) {
  const pathname = usePathname();
  const currentTitle = ROUTE_LABELS[pathname] || "Admin Console";

  return (
    <header className="h-16 border-b border-slate-800/80 bg-[#090d18]/80 backdrop-blur-md px-4 sm:px-8 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-3">
        {onOpenMobile && (
          <button
            onClick={onOpenMobile}
            className="lg:hidden p-2 rounded-xl bg-[#06080e] border border-slate-800 text-gray-300 hover:text-white"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-gray-400">
            <span>RGS Super Admin</span>
            <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
            <span className="text-amber-400 font-bold">{currentTitle}</span>
          </div>
          <h1 className="text-sm sm:text-base font-black text-white tracking-tight leading-tight">
            {currentTitle}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Live Telemetry Pulse */}
        <div className="hidden sm:flex items-center gap-2 bg-[#06080e] border border-emerald-500/20 px-3 py-1.5 rounded-xl text-xs font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-emerald-300 font-bold text-[11px]">Live Sync (4s)</span>
        </div>

        {/* Refresh Button */}
        <button
          onClick={onRefresh || (() => window.location.reload())}
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-gray-300 hover:text-white transition-colors cursor-pointer"
          title="Refresh Data"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-amber-400" : ""}`} />
        </button>

        {/* Showcase Link */}
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
  );
}

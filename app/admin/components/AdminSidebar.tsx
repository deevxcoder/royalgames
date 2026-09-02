"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Key,
  Wallet,
  Activity,
  BarChart3,
  Sliders,
  BookOpen,
  Play,
  ExternalLink,
  Crown,
  LogOut,
  X,
  ShieldAlert,
} from "lucide-react";
import { STUDIO_GAMES } from "@/lib/gamesCatalog";

interface AdminSidebarProps {
  clientsCount?: number;
  pendingDepositsCount?: number;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
  adminUser?: any;
  onLogout?: () => void;
}

export function AdminSidebar({
  clientsCount = 0,
  pendingDepositsCount = 0,
  mobileOpen = false,
  onCloseMobile,
  adminUser,
  onLogout,
}: AdminSidebarProps) {
  const pathname = usePathname();

  const navGroups = [
    {
      group: "EXECUTIVE SUITE",
      items: [
        {
          href: "/admin",
          label: "Dashboard",
          desc: "Executive KPIs & telemetry",
          icon: LayoutDashboard,
          badge: null,
          badgeColor: "",
          exact: true,
        },
      ],
    },
    {
      group: "OPERATOR MANAGEMENT",
      items: [
        {
          href: "/admin/clients",
          label: "B2B Clients & Keys",
          desc: "API tokens & credentials",
          icon: Key,
          badge: clientsCount ? `${clientsCount}` : null,
          badgeColor: "bg-slate-800 text-amber-400",
        },
        {
          href: "/admin/deposits",
          label: "Deposit Approvals",
          desc: "Prepaid GGR recharges",
          icon: Wallet,
          badge: pendingDepositsCount > 0 ? `${pendingDepositsCount} PENDING` : null,
          badgeColor: "bg-amber-500 text-black font-extrabold animate-pulse",
        },
      ],
    },
    {
      group: "GAMEPLAY & ANALYTICS",
      items: [
        {
          href: "/admin/rounds",
          label: "Live Game Rounds",
          desc: "Authoritative round audit",
          icon: Activity,
          badge: "60FPS",
          badgeColor: "bg-slate-800 text-purple-400",
        },
        {
          href: "/admin/reports",
          label: "GGR & Reports",
          desc: "Financial billing breakdown",
          icon: BarChart3,
          badge: null,
          badgeColor: "",
        },
      ],
    },
    {
      group: "ENGINE CONTROLS",
      items: [
        {
          href: "/admin/game-control",
          label: "Live Game Control",
          desc: "Manual outcome override (God Mode)",
          icon: ShieldAlert,
          badge: "GOD MODE",
          badgeColor: "bg-rose-500/20 text-rose-300 border border-rose-500/40",
        },
        {
          href: "/admin/rtp",
          label: "RTP & House Edge",
          desc: "Theoretical math sliders",
          icon: Sliders,
          badge: "RNG",
          badgeColor: "bg-slate-800 text-emerald-400",
        },
        {
          href: "/admin/docs",
          label: "API Docs & Tester",
          desc: "Integration & launch tools",
          icon: BookOpen,
          badge: "cURL",
          badgeColor: "bg-slate-800 text-sky-400",
        },
      ],
    },
  ];

  const content = (
    <div className="h-full flex flex-col justify-between bg-[#080b13] border-r border-slate-800 text-white select-none">
      {/* Brand Header */}
      <div className="shrink-0">
        <div className="h-16 border-b border-slate-800 px-5 flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-600 to-yellow-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20">
              👑
            </div>
            <div>
              <div className="text-sm font-black tracking-wider text-amber-400 font-mono flex items-center gap-1.5">
                <span>ROYAL</span>
                <span className="text-white font-extrabold">STUDIO</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                  RGS
                </span>
              </div>
              <p className="text-[10px] text-gray-400">Master Gaming Engine Admin</p>
            </div>
          </Link>

          {mobileOpen && (
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Live Status bar */}
        <div className="px-5 py-2.5 bg-[#06080e]/60 border-b border-slate-800/60 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-[11px] font-mono font-bold text-emerald-400">ENGINE ONLINE</span>
          </div>
          <span className="text-[10px] font-mono text-gray-400">
            {STUDIO_GAMES.length} HTML5 Games
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto min-h-0 px-3 py-4 space-y-5">
        {navGroups.map((group, gIdx) => (
          <div key={gIdx} className="space-y-1.5">
            <div className="px-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider font-mono">
              {group.group}
            </div>
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = (item as any).exact
                  ? pathname === item.href
                  : pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onCloseMobile}
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
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        {/* External Link Section */}
        <div className="space-y-1.5 pt-2 border-t border-slate-800/60">
          <div className="px-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider font-mono">
            EXTERNAL SHOWCASE
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

      {/* Admin User Footer Card */}
      <div className="shrink-0 p-4 border-t border-slate-800/80 bg-[#07090e]/95">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-amber-600 border border-amber-400/40 flex items-center justify-center text-xs font-bold text-black shrink-0">
              SA
            </div>
            <div className="truncate">
              <div className="text-xs font-bold text-white truncate">
                {adminUser?.username || "Studio Super Admin"}
              </div>
              <div className="text-[10px] text-emerald-400 font-mono">Role: Super Admin</div>
            </div>
          </div>

          {onLogout && (
            <button
              onClick={onLogout}
              className="p-1.5 rounded-lg text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Fixed 72 width) */}
      <aside className="hidden lg:block w-72 h-screen sticky top-0 shrink-0 z-30">
        {content}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={onCloseMobile} />
          <div className="relative w-72 max-w-[85vw] h-full z-10 shadow-2xl">
            {content}
          </div>
        </div>
      )}
    </>
  );
}

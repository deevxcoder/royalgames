"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  KeyRound,
  Wallet,
  Activity,
  BookOpen,
  Gamepad2,
  Layers,
  ShieldCheck,
  Rocket,
} from "lucide-react";

export function PortalSidebar({ operator }: { operator?: any }) {
  const pathname = usePathname();

  const operatorNav = [
    { name: "Dashboard", href: "/portal/dashboard", icon: LayoutDashboard },
    { name: "Games Catalog", href: "/portal/games", icon: Layers },
    { name: "Game Sessions", href: "/portal/sessions", icon: Gamepad2 },
    { name: "API Credentials", href: "/portal/apikeys", icon: KeyRound },
    { name: "Prepaid Wallet", href: "/portal/wallet", icon: Wallet },
    { name: "API Documentation", href: "/portal/docs", icon: BookOpen },
  ];

  return (
    <aside className="w-64 bg-[#090d16] border-r border-slate-800 flex flex-col justify-between p-4 min-h-[calc(100vh-4rem)]">
      <div className="space-y-6">
        <div className="space-y-1">
          <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Client Operator Console
          </div>
          {operatorNav.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-amber-500/10 text-amber-400 border border-amber-500/30 shadow-sm font-bold"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-amber-400" : "text-slate-400"}`} />
                {item.name}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="p-3.5 rounded-xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 space-y-2">
        <div className="flex items-center gap-2">
          <Gamepad2 className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-semibold text-slate-200">Royal Games Studio RGS</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Provably Fair RNG Engine • Direct High-Speed REST API.
        </p>
        <div className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          RGS Engine: ONLINE
        </div>
      </div>
    </aside>
  );
}

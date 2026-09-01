"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldCheck, ArrowLeft, Lock } from "lucide-react";

export default function OperatorRegisterPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#07090e] text-white flex items-center justify-center p-4 relative overflow-hidden" suppressHydrationWarning>
      <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-[#0e121c] border border-amber-500/30 rounded-3xl p-8 shadow-2xl relative z-10 space-y-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 mx-auto flex items-center justify-center text-slate-950 font-black text-2xl shadow-lg shadow-amber-500/20">
          👑
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-black tracking-tight text-white">
            Client Onboarding Managed by Studio Admin
          </h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            Public self-registration is closed. Casino operators & aggregators are onboarded directly by the Studio Super Admin with dedicated API keys and prepaid GGR allocations.
          </p>
        </div>

        <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl text-left space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
            <Lock className="w-4 h-4" />
            <span>Private B2B Gateway</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            If you have received your operator credentials from the Super Admin, please sign in through the client portal.
          </p>
        </div>

        <Link
          href="/portal/login"
          className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 stroke-[3]" />
          <span>Return to Client Portal Login</span>
        </Link>
      </div>
    </div>
  );
}

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AdminSidebar } from "./AdminSidebar";
import { AdminHeader } from "./AdminHeader";
import { AlertCircle, Lock, RefreshCw } from "lucide-react";

export function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [authChecking, setAuthChecking] = useState(true);
  const [adminUser, setAdminUser] = useState<any>(null);

  // Login Form State
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("studio1234");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  // Layout State
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [clientsCount, setClientsCount] = useState(0);
  const [pendingDepositsCount, setPendingDepositsCount] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Auth Verification
  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/me");
      if (res.ok) {
        const data = await res.json();
        setAdminUser(data.admin || { username: "admin", role: "STUDIO_SUPER_ADMIN" });
      } else {
        setAdminUser(null);
      }
    } catch {
      setAdminUser(null);
    } finally {
      setAuthChecking(false);
    }
  }, []);

  // Fetch telemetry counts for badges
  const fetchBadgeCounts = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const [clientRes, depRes] = await Promise.all([
        fetch("/api/admin/clients"),
        fetch("/api/admin/deposits"),
      ]);

      if (clientRes.ok) {
        const cData = await clientRes.json();
        if (cData.clients) setClientsCount(cData.clients.length);
      }
      if (depRes.ok) {
        const dData = await depRes.json();
        if (dData.deposits) {
          const pending = dData.deposits.filter((d: any) => d.status === "PENDING").length;
          setPendingDepositsCount(pending);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (adminUser) {
      fetchBadgeCounts();
      const timer = setInterval(fetchBadgeCounts, 15000); // 15s badge polling
      return () => clearInterval(timer);
    }
  }, [adminUser, fetchBadgeCounts]);

  // Login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError(null);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Invalid Studio Super Admin credentials");
      }

      setAdminUser(data.user);
      fetchBadgeCounts();
    } catch (err: any) {
      setLoginError(err.message || "Failed to authenticate");
    } finally {
      setLoginLoading(false);
    }
  };

  // Logout handler
  const handleLogout = async () => {
    try {
      await fetch("/api/admin/login", { method: "DELETE" }).catch(() => {});
      setAdminUser(null);
      router.push("/admin");
    } catch (e) {
      console.error(e);
    }
  };

  // Loading Screen
  if (authChecking) {
    return (
      <div className="min-h-screen bg-[#06080e] flex items-center justify-center text-amber-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-mono tracking-widest uppercase">Authenticating Studio Admin...</span>
        </div>
      </div>
    );
  }

  // Unauthenticated Login Dialog
  if (!adminUser) {
    return (
      <div className="min-h-screen bg-[#06080e] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#0c101a] border border-amber-500/40 rounded-3xl p-8 shadow-2xl space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-600 to-yellow-400 flex items-center justify-center shadow-lg shadow-amber-500/20 text-slate-950 font-black text-xl">
              👑
            </div>
            <div>
              <div className="text-lg font-black tracking-wider text-amber-400 font-mono">
                ROYAL<span className="text-white">STUDIO</span>
                <span className="text-[10px] ml-2 px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                  SUPER ADMIN
                </span>
              </div>
              <p className="text-xs text-gray-400">Remote Gaming Server & Client Management</p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {loginError && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{loginError}</span>
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-gray-300 block mb-1.5 uppercase tracking-wider">
                Studio Admin Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-[#080a10] border border-slate-700 focus:border-amber-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none transition-colors"
                placeholder="admin"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-300 block mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#080a10] border border-slate-700 focus:border-amber-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none transition-colors"
                placeholder="studio1234"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full mt-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold py-3 rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
            >
              {loginLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
              <span>Sign In to Studio Portal</span>
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-800 text-center text-xs text-gray-500">
            Default credentials: <span className="text-amber-400 font-mono">admin</span> / <span className="text-amber-400 font-mono">studio1234</span>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated Admin Workspace
  return (
    <div className="min-h-screen bg-[#07090e] text-white flex font-sans">
      {/* Persistent Left Sidebar */}
      <AdminSidebar
        clientsCount={clientsCount}
        pendingDepositsCount={pendingDepositsCount}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        adminUser={adminUser}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <AdminHeader
          onOpenMobile={() => setMobileSidebarOpen(true)}
          onRefresh={fetchBadgeCounts}
          isRefreshing={isRefreshing}
        />

        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
}

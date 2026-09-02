"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Sliders,
  ShieldCheck,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Percent,
  Gamepad2,
  Save,
  RotateCcw,
} from "lucide-react";
import { STUDIO_GAMES } from "@/lib/gamesCatalog";

export default function AdminRtpPage() {
  const [loading, setLoading] = useState(true);
  const [globalRtp, setGlobalRtp] = useState(96.5);
  const [games, setGames] = useState<any[]>([]);
  const [gameRtpInputs, setGameRtpInputs] = useState<Record<string, number>>({});
  const [savingGlobal, setSavingGlobal] = useState(false);
  const [savingGameUid, setSavingGameUid] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchRtpSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/rtp-settings");
      if (res.ok) {
        const data = await res.json();
        setGlobalRtp(data.globalRtp || 96.5);
        setGames(data.games || []);
        const map: Record<string, number> = {};
        (data.games || []).forEach((g: any) => {
          map[g.gameUid] = g.liveRtp || g.defaultRtp;
        });
        setGameRtpInputs(map);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRtpSettings();
  }, [fetchRtpSettings]);

  const showToast = (type: "success" | "error", text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Save Global RTP
  const handleSaveGlobal = async () => {
    setSavingGlobal(true);
    try {
      const res = await fetch("/api/admin/rtp-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SET_GLOBAL_ALL",
          globalRtp,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast("success", `Global Theoretical RTP updated to ${globalRtp}% across all studio games!`);
        fetchRtpSettings();
      } else {
        showToast("error", data.error || "Failed to update global RTP");
      }
    } catch (err: any) {
      showToast("error", err.message);
    } finally {
      setSavingGlobal(false);
    }
  };

  // Save Single Game RTP
  const handleSaveSingleGame = async (gameUid: string) => {
    setSavingGameUid(gameUid);
    const target = gameRtpInputs[gameUid];
    try {
      const res = await fetch("/api/admin/rtp-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SET_SINGLE_GAME",
          gameUid,
          rtp: target,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast("success", `RTP for ${gameUid} updated to ${target}%!`);
        fetchRtpSettings();
      } else {
        showToast("error", data.error || "Failed to update game RTP");
      }
    } catch (err: any) {
      showToast("error", err.message);
    } finally {
      setSavingGameUid(null);
    }
  };

  const houseEdge = Number((100 - globalRtp).toFixed(2));

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-[#0e1320] via-[#0f172a] to-[#0e1320] border border-amber-500/30 rounded-3xl p-6 shadow-xl">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Sliders className="w-5 h-5 text-emerald-400" />
            <span>Provably Fair RTP & House Edge Math Engine Controls</span>
          </h2>
          <p className="text-xs text-gray-400 mt-1 max-w-2xl">
            Authoritatively govern the theoretical Return-To-Player (RTP) parameters. The SHA-256 crash curve and card distributions will dynamically adjust to guarantee your casino house edge.
          </p>
        </div>

        <button
          onClick={fetchRtpSettings}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 border border-slate-700 cursor-pointer shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Settings</span>
        </button>
      </div>

      {/* Toast */}
      {toastMessage && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2.5 border shadow-lg ${
            toastMessage.type === "success"
              ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
              : "bg-rose-500/15 border-rose-500/40 text-rose-300"
          }`}
        >
          {toastMessage.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Global Master RTP Slider Box */}
      <div className="bg-[#0b0f19] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <Percent className="w-4 h-4 text-amber-400" />
              <span>Global Studio Default RTP</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Sets the baseline math model across all games that do not have custom overrides.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">House Edge Margin</span>
              <span className="text-sm font-bold text-amber-400 font-mono">+{houseEdge}% House Hold</span>
            </div>
            <div className="px-4 py-2 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xl font-black font-mono">
              {globalRtp.toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Interactive Slider */}
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>Tight House Edge (80.0%)</span>
            <span className="text-amber-400 font-bold">Standard Regulated (96.5%)</span>
            <span>Player Friendly (99.5%)</span>
          </div>

          <input
            type="range"
            min="80"
            max="99.5"
            step="0.1"
            value={globalRtp}
            onChange={(e) => setGlobalRtp(Number(e.target.value))}
            className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />

          {/* Quick Presets */}
          <div className="flex items-center gap-2 flex-wrap pt-2">
            <span className="text-xs text-slate-400 font-bold mr-1">Quick Presets:</span>
            {[90.0, 92.5, 94.0, 96.0, 96.5, 97.0, 98.0].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setGlobalRtp(preset)}
                className={`px-3 py-1 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer border ${
                  globalRtp === preset
                    ? "bg-amber-500 text-slate-950 border-amber-500 shadow-md"
                    : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                {preset}%
              </button>
            ))}
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between border-t border-slate-800">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Changes take effect immediately on next launched game round.</span>
          </div>

          <button
            onClick={handleSaveGlobal}
            disabled={savingGlobal}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-xs shadow-lg shadow-amber-500/20 flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
          >
            {savingGlobal ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>Apply Global RTP ({globalRtp}%)</span>
          </button>
        </div>
      </div>

      {/* Per-Game Override Table */}
      <div className="bg-[#0b0f19] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div>
          <h3 className="text-base font-black text-white flex items-center gap-2">
            <Gamepad2 className="w-4 h-4 text-purple-400" />
            <span>Per-Game Mathematical Overrides</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Independently fine-tune crash curves and card settlement math for specific flagship titles.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {games.map((g) => {
            const currentInput = gameRtpInputs[g.gameUid] ?? g.liveRtp ?? 96.5;
            const currentHouse = Number((100 - currentInput).toFixed(2));
            const isSaving = savingGameUid === g.gameUid;

            return (
              <div
                key={g.gameUid}
                className="bg-[#07090e] border border-slate-800 rounded-2xl p-4 space-y-3.5 hover:border-slate-700 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center p-1 shrink-0">
                      <img
                        src={`/games/${g.gameUid}.svg`}
                        alt={g.name}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `http://localhost:3000/games/${g.gameUid}.svg`;
                        }}
                      />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">{g.name}</h4>
                      <span className="text-[10px] text-slate-500 font-mono">{g.category}</span>
                    </div>
                  </div>

                  <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    {currentInput.toFixed(1)}%
                  </span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Target RTP:</span>
                    <span className="font-mono text-emerald-400 font-bold">House Edge: +{currentHouse}%</span>
                  </div>
                  <input
                    type="range"
                    min="80"
                    max="99.5"
                    step="0.1"
                    value={currentInput}
                    onChange={(e) =>
                      setGameRtpInputs((prev) => ({
                        ...prev,
                        [g.gameUid]: Number(e.target.value),
                      }))
                    }
                    className="w-full h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                </div>

                <button
                  onClick={() => handleSaveSingleGame(g.gameUid)}
                  disabled={isSaving}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? <RefreshCw className="w-3 h-3 animate-spin text-amber-400" /> : <Save className="w-3 h-3" />}
                  <span>Save {g.name} ({currentInput}%)</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

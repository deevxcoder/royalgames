"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PortalNavbar } from "../components/PortalNavbar";
import { PortalSidebar } from "../components/PortalSidebar";
import {
  BookOpen,
  Code2,
  Copy,
  Check,
  Send,
  Terminal,
  Layers,
} from "lucide-react";

export default function DocsPage() {
  const router = useRouter();
  const [operator, setOperator] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeLang, setActiveLang] = useState<"curl" | "node" | "php" | "python">("curl");

  // Sandbox tester
  const [testPlayerId, setTestPlayerId] = useState("player_user_1001");
  const [testGameUid, setTestGameUid] = useState("royal_coinflip");
  const [testBalance, setTestBalance] = useState("1000");
  const [testingLaunch, setTestingLaunch] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/operator/me");
      if (res.status === 401) {
        router.push("/portal/login");
        return;
      }
      const json = await res.json();
      setOperator(json.operator);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const copySnippet = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleTestLaunch = async () => {
    const token = operator?.tokens[0]?.token || "rgs_live_demo_studio_token";
    setTestingLaunch(true);
    setTestResult(null);

    try {
      const res = await fetch("/api/v1/launch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          user_id: testPlayerId,
          game_uid: testGameUid,
          balance: Number(testBalance),
          currency: operator?.currency || "INR",
          callback_url: "http://localhost:3000/api/callback",
          return_url: "http://localhost:3000",
        }),
      });

      const json = await res.json();
      setTestResult(json);
    } catch (err: any) {
      setTestResult({ error: err.message });
    } finally {
      setTestingLaunch(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07090e] flex items-center justify-center text-slate-400">
        <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const tokenStr = operator?.tokens[0]?.token || "rgs_live_your_token_here";

  const codeSnippets = {
    curl: `curl -X POST http://localhost:3002/api/v1/launch \\
  -H "Authorization: Bearer ${tokenStr}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "user_id": "player_8872",
    "game_uid": "royal_coinflip",
    "balance": 1500,
    "currency": "INR",
    "callback_url": "https://yourcasino.com/api/callback",
    "return_url": "https://yourcasino.com/lobby"
  }'`,
    node: `// Node.js (axios)
import axios from "axios";

const response = await axios.post("http://localhost:3002/api/v1/launch", {
  user_id: "player_8872",
  game_uid: "royal_coinflip",
  balance: 1500,
  currency: "INR",
  callback_url: "https://yourcasino.com/api/callback",
  return_url: "https://yourcasino.com/lobby"
}, {
  headers: {
    "Authorization": "Bearer ${tokenStr}",
    "Content-Type": "application/json"
  }
});

console.log("Play URL:", response.data.data.launch_url);`,
    php: `<?php
// PHP cURL
$ch = curl_init("http://localhost:3002/api/v1/launch");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Authorization: Bearer ${tokenStr}",
    "Content-Type: application/json"
]);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
    "user_id" => "player_8872",
    "game_uid" => "royal_coinflip",
    "balance" => 1500,
    "currency" => "INR",
    "callback_url" => "https://yourcasino.com/api/callback",
    "return_url" => "https://yourcasino.com/lobby"
]));

$response = curl_exec($ch);
$data = json_decode($response, true);
echo "Launch URL: " . $data["data"]["launch_url"];
?>`,
    python: `# Python (requests)
import requests

url = "http://localhost:3002/api/v1/launch"
headers = {
    "Authorization": "Bearer ${tokenStr}",
    "Content-Type": "application/json"
}
payload = {
    "user_id": "player_8872",
    "game_uid": "royal_coinflip",
    "balance": 1500,
    "currency": "INR",
    "callback_url": "https://yourcasino.com/api/callback",
    "return_url": "https://yourcasino.com/lobby"
}

res = requests.post(url, json=payload, headers=headers)
print("Launch URL:", res.json()["data"]["launch_url"])`,
  };

  return (
    <div className="min-h-screen bg-[#07090e] flex flex-col">
      <PortalNavbar operator={operator} />

      <div className="flex-1 flex">
        <PortalSidebar operator={operator} />

        <main className="flex-1 p-8 space-y-8 overflow-y-auto">
          {/* Header */}
          <div>
            <h1 className="text-xl font-black text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-amber-400" />
              Interactive Studio API Documentation & SDKs
            </h1>
            <p className="text-sm text-slate-400">
              Integrate Royal Games Studio RGS native HTML5 games into your Casino or Aggregator platform.
            </p>
          </div>

          {/* Interactive Code Generator & Tester */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Code Snippet */}
            <div className="bg-[#0b0f19] border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-amber-400" />
                  <span className="text-sm font-bold text-white">POST /api/v1/launch</span>
                </div>

                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                  {(["curl", "node", "php", "python"] as const).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setActiveLang(lang)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold uppercase transition-all ${
                        activeLang === lang
                          ? "bg-amber-500 text-slate-950 font-black"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative">
                <pre className="bg-slate-950 border border-slate-800 p-4 rounded-2xl font-mono text-xs text-amber-300 overflow-x-auto leading-relaxed max-h-72">
                  {codeSnippets[activeLang]}
                </pre>
                <button
                  onClick={() => copySnippet(codeSnippets[activeLang], "code")}
                  className="absolute top-3 right-3 p-1.5 bg-slate-800/80 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white text-xs flex items-center gap-1 transition-colors"
                >
                  {copiedKey === "code" ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Right: Live Interactive Sandbox */}
            <div className="bg-[#0b0f19] border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-bold text-white">Live API Sandbox Tester</span>
                </div>
                <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  Ready
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Select Game</label>
                  <select
                    value={testGameUid}
                    onChange={(e) => setTestGameUid(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs"
                  >
                    <option value="royal_coinflip">Coin Flip Royale (royal_coinflip)</option>
                    <option value="royal_andarbahar">Andar Bahar Live (royal_andarbahar)</option>
                    <option value="royal_chickencross">Chicken Road Cross (royal_chickencross)</option>
                    <option value="royal_aviator">Aviator Royale Crash (royal_aviator)</option>
                    <option value="royal_mines">Mines Gold (royal_mines)</option>
                    <option value="royal_roulette">European Roulette (royal_roulette)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Player User ID</label>
                  <input
                    type="text"
                    value={testPlayerId}
                    onChange={(e) => setTestPlayerId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 text-xs mb-1">Starting Balance</label>
                <input
                  type="number"
                  value={testBalance}
                  onChange={(e) => setTestBalance(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-mono"
                />
              </div>

              <button
                onClick={handleTestLaunch}
                disabled={testingLaunch}
                className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                {testingLaunch ? "Launching..." : "Execute Test Launch"}
              </button>

              {testResult && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-slate-400">Response JSON:</span>
                  <pre className="bg-slate-950 border border-slate-800 p-3 rounded-xl font-mono text-[11px] text-emerald-400 overflow-x-auto max-h-36">
                    {JSON.stringify(testResult, null, 2)}
                  </pre>
                  {testResult?.data?.launch_url && (
                    <a
                      href={testResult.data.launch_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-amber-400 hover:underline font-bold mt-1"
                    >
                      Open Generated Game In New Tab →
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

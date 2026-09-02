"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  BookOpen,
  Code,
  Copy,
  Check,
  Play,
  ExternalLink,
  ShieldCheck,
  Send,
  RefreshCw,
  Terminal,
} from "lucide-react";
import { STUDIO_GAMES } from "@/lib/gamesCatalog";

export default function AdminDocsPage() {
  const [docTab, setDocTab] = useState<"architecture" | "launch" | "callback" | "tester">("architecture");
  const [codeLang, setCodeLang] = useState<"curl" | "node" | "php" | "python">("curl");
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);

  // Interactive Tester State
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClientToken, setSelectedClientToken] = useState("");
  const [selectedGameUid, setSelectedGameUid] = useState("royal_skyrush");
  const [testerPlayerId, setTesterPlayerId] = useState("vip_player_88");
  const [testerBalance, setTesterBalance] = useState("50000");
  const [testResult, setTestResult] = useState<any>(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    fetch("/api/admin/clients")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.clients?.length) {
          setClients(data.clients);
          const firstWithToken = data.clients.find((c: any) => c.tokens?.length > 0);
          if (firstWithToken) {
            setSelectedClientToken(firstWithToken.tokens[0].token);
          }
        }
      })
      .catch((e) => console.error(e));
  }, []);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(id);
    setTimeout(() => setCopiedSnippet(null), 2000);
  };

  const handleRunTester = async (e: React.FormEvent) => {
    e.preventDefault();
    setTesting(true);
    setTestResult(null);

    try {
      const res = await fetch("/api/v1/session/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${selectedClientToken}`,
        },
        body: JSON.stringify({
          game_uid: selectedGameUid,
          user_id: testerPlayerId,
          currency: "INR",
          balance: Number(testerBalance),
          return_url: `${window.location.origin}/admin/docs`,
        }),
      });

      const data = await res.json();
      setTestResult({ status: res.status, data });
    } catch (err: any) {
      setTestResult({ status: 500, data: { error: err.message } });
    } finally {
      setTesting(false);
    }
  };

  // Code Snippets
  const snippets: Record<string, Record<string, string>> = {
    launch: {
      curl: `curl -X POST https://your-rgs-domain.com/api/v1/session/create \\
  -H "Authorization: Bearer rgs_live_YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "game_uid": "royal_skyrush",
    "user_id": "player_9921",
    "currency": "INR",
    "balance": 25000,
    "return_url": "https://yourcasino.com/lobby"
  }'`,
      node: `const axios = require('axios');

const response = await axios.post('https://your-rgs-domain.com/api/v1/session/create', {
  game_uid: 'royal_skyrush',
  user_id: 'player_9921',
  currency: 'INR',
  balance: 25000,
  return_url: 'https://yourcasino.com/lobby'
}, {
  headers: {
    'Authorization': 'Bearer rgs_live_YOUR_TOKEN',
    'Content-Type': 'application/json'
  }
});

const { launch_url, session_id } = response.data;
// Embed launch_url in an iframe or redirect player!`,
      php: `<?php
$ch = curl_init('https://your-rgs-domain.com/api/v1/session/create');
$payload = json_encode([
  'game_uid' => 'royal_skyrush',
  'user_id' => 'player_9921',
  'currency' => 'INR',
  'balance' => 25000,
  'return_url' => 'https://yourcasino.com/lobby'
]);

curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
  'Authorization: Bearer rgs_live_YOUR_TOKEN',
  'Content-Type: application/json'
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$result = curl_exec($ch);
curl_close($ch);
?>`,
      python: `import requests

url = "https://your-rgs-domain.com/api/v1/session/create"
headers = {
    "Authorization": "Bearer rgs_live_YOUR_TOKEN",
    "Content-Type": "application/json"
}
payload = {
    "game_uid": "royal_skyrush",
    "user_id": "player_9921",
    "currency": "INR",
    "balance": 25000,
    "return_url": "https://yourcasino.com/lobby"
}

response = requests.post(url, json=payload, headers=headers)
data = response.json()
launch_url = data.get("launch_url")`,
    },
    callback: {
      curl: `# When a round concludes, Studio POSTs this JSON payload to your Callback URL:
{
  "event": "ROUND_RESOLVE",
  "sessionId": "sess_8a92fb...",
  "gameUid": "royal_skyrush",
  "userId": "player_9921",
  "betAmount": 500,
  "winAmount": 1250,
  "multiplier": 2.50,
  "currency": "INR",
  "roundId": "rnd_c9820f171",
  "signature": "sha256_hmac_signature..."
}

# Your server responds with 200 OK:
{ "success": true, "newBalance": 25750 }`,
      node: `// Express.js Webhook Receiver Example
app.post('/api/callback', (req, res) => {
  const { event, userId, betAmount, winAmount, roundId } = req.body;

  // 1. Credit or debit player balance in your database
  const netDelta = winAmount - betAmount;
  await userWallet.adjustBalance(userId, netDelta);

  // 2. Respond with 200 OK
  return res.json({ success: true, processedRound: roundId });
});`,
      php: `<?php
// PHP Webhook Receiver
$body = file_get_contents('php://input');
$payload = json_decode($body, true);

$userId = $payload['userId'];
$netDelta = $payload['winAmount'] - $payload['betAmount'];

// Update your database balance...
echo json_encode(['success' => true]);
?>`,
      python: `@app.route('/api/callback', methods=['POST'])
def handle_callback():
    data = request.get_json()
    user_id = data.get("userId")
    net_win = data.get("winAmount", 0) - data.get("betAmount", 0)
    
    # Update player balance
    update_user_balance(user_id, net_win)
    return jsonify({"success": True})`,
    },
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-[#0e1320] via-[#0f172a] to-[#0e1320] border border-amber-500/30 rounded-3xl p-6 shadow-xl">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-sky-400" />
            <span>Developer Documentation & Live Session Tester</span>
          </h2>
          <p className="text-xs text-gray-400 mt-1 max-w-2xl">
            Complete technical specification for B2B casino aggregators to launch games via authenticated REST endpoints and receive authoritative settlement callbacks.
          </p>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 bg-[#0b0f19] border border-slate-800 rounded-2xl p-2 text-xs">
        {[
          { id: "architecture", label: "Overview & Architecture" },
          { id: "launch", label: "1. Launch Game API" },
          { id: "callback", label: "2. Settlement Webhook Callback" },
          { id: "tester", label: "⚡ Interactive Session Tester" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setDocTab(t.id as any)}
            className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer ${
              docTab === t.id
                ? "bg-amber-500 text-slate-950 shadow-md"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB 1: Architecture */}
      {docTab === "architecture" && (
        <div className="bg-[#0b0f19] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6 text-xs text-slate-300">
          <div className="space-y-2">
            <h3 className="text-base font-bold text-white">How B2B Integration Works</h3>
            <p className="leading-relaxed text-slate-400">
              Royal Games Studio operates as an authoritative Remote Gaming Server (RGS). Casino operators do not run game logic or calculate odds locally.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-[#07090e] border border-slate-800 space-y-2">
              <span className="text-amber-400 font-mono font-bold">Step 1: Session Creation</span>
              <p className="text-slate-400">
                Your casino backend makes a server-to-server POST to <code className="text-amber-300 font-mono">/api/v1/session/create</code> with the player ID and starting balance.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-[#07090e] border border-slate-800 space-y-2">
              <span className="text-emerald-400 font-mono font-bold">Step 2: HTML5 Launch</span>
              <p className="text-slate-400">
                Studio returns a signed <code className="text-emerald-300 font-mono">launch_url</code>. You embed this URL in an iframe or open it directly in a mobile webview.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-[#07090e] border border-slate-800 space-y-2">
              <span className="text-purple-400 font-mono font-bold">Step 3: Webhook Settlement</span>
              <p className="text-slate-400">
                When the round finishes, Studio fires an idempotent POST webhook to your <code className="text-purple-300 font-mono">callbackUrl</code> with win/loss details.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Launch API */}
      {docTab === "launch" && (
        <div className="bg-[#0b0f19] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono">
                POST /api/v1/session/create
              </span>
              <h3 className="text-base font-bold text-white mt-1">Generate Game Launch Session</h3>
            </div>

            <div className="flex items-center gap-2">
              {(["curl", "node", "php", "python"] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setCodeLang(lang)}
                  className={`px-3 py-1 rounded-lg text-xs font-mono font-bold uppercase transition-all cursor-pointer ${
                    codeLang === lang ? "bg-amber-500 text-slate-950" : "bg-slate-900 text-slate-400 hover:text-white"
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>

          <div className="relative bg-[#07090e] border border-slate-800 rounded-2xl p-4 font-mono text-xs text-slate-300 overflow-x-auto">
            <button
              onClick={() => copyToClipboard(snippets.launch[codeLang], "launch_snip")}
              className="absolute top-3 right-3 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-[10px] font-sans flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copiedSnippet === "launch_snip" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedSnippet === "launch_snip" ? "Copied!" : "Copy Code"}</span>
            </button>
            <pre className="pt-2">{snippets.launch[codeLang]}</pre>
          </div>
        </div>
      )}

      {/* TAB 3: Callback */}
      {docTab === "callback" && (
        <div className="bg-[#0b0f19] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-400 border border-purple-500/30 font-mono">
                POST [Your Callback URL]
              </span>
              <h3 className="text-base font-bold text-white mt-1">Authoritative Settlement Webhook</h3>
            </div>

            <div className="flex items-center gap-2">
              {(["curl", "node", "php", "python"] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setCodeLang(lang)}
                  className={`px-3 py-1 rounded-lg text-xs font-mono font-bold uppercase transition-all cursor-pointer ${
                    codeLang === lang ? "bg-amber-500 text-slate-950" : "bg-slate-900 text-slate-400 hover:text-white"
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>

          <div className="relative bg-[#07090e] border border-slate-800 rounded-2xl p-4 font-mono text-xs text-slate-300 overflow-x-auto">
            <button
              onClick={() => copyToClipboard(snippets.callback[codeLang], "cb_snip")}
              className="absolute top-3 right-3 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-[10px] font-sans flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copiedSnippet === "cb_snip" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedSnippet === "cb_snip" ? "Copied!" : "Copy Code"}</span>
            </button>
            <pre className="pt-2">{snippets.callback[codeLang]}</pre>
          </div>
        </div>
      )}

      {/* TAB 4: Interactive Tester */}
      {docTab === "tester" && (
        <div className="bg-[#0b0f19] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span>Live API Session Generator & Tester</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Simulate an external aggregator launch call and get an instant playable HTML5 URL.
            </p>
          </div>

          <form onSubmit={handleRunTester} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-slate-400 font-bold block mb-1 uppercase tracking-wider text-[10px]">
                  B2B Client API Token
                </label>
                {clients.length === 0 ? (
                  <input
                    type="text"
                    required
                    placeholder="rgs_live_..."
                    value={selectedClientToken}
                    onChange={(e) => setSelectedClientToken(e.target.value)}
                    className="w-full bg-[#07090e] border border-slate-700 rounded-xl px-3.5 py-2 text-white font-mono"
                  />
                ) : (
                  <select
                    value={selectedClientToken}
                    onChange={(e) => setSelectedClientToken(e.target.value)}
                    className="w-full bg-[#07090e] border border-slate-700 rounded-xl px-3.5 py-2 text-white font-mono"
                  >
                    {clients.map((c) =>
                      (c.tokens || []).map((t: any) => (
                        <option key={t.id} value={t.token}>
                          {c.name} - {t.name} ({t.token.slice(0, 16)}...)
                        </option>
                      ))
                    )}
                  </select>
                )}
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1 uppercase tracking-wider text-[10px]">
                  Target Flagship Game
                </label>
                <select
                  value={selectedGameUid}
                  onChange={(e) => setSelectedGameUid(e.target.value)}
                  className="w-full bg-[#07090e] border border-slate-700 rounded-xl px-3.5 py-2 text-white font-semibold"
                >
                  {STUDIO_GAMES.map((g) => (
                    <option key={g.game_uid} value={g.game_uid}>
                      {g.name} ({g.game_uid})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1 uppercase tracking-wider text-[10px]">
                  Player User ID
                </label>
                <input
                  type="text"
                  required
                  value={testerPlayerId}
                  onChange={(e) => setTesterPlayerId(e.target.value)}
                  className="w-full bg-[#07090e] border border-slate-700 rounded-xl px-3.5 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1 uppercase tracking-wider text-[10px]">
                  Initial Balance (INR)
                </label>
                <input
                  type="number"
                  required
                  value={testerBalance}
                  onChange={(e) => setTesterBalance(e.target.value)}
                  className="w-full bg-[#07090e] border border-slate-700 rounded-xl px-3.5 py-2 text-white font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={testing || !selectedClientToken}
              className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
            >
              {testing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              <span>Execute Session Creation Request</span>
            </button>
          </form>

          {/* Test Response */}
          {testResult && (
            <div className="bg-[#07090e] border border-slate-800 rounded-2xl p-4 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-slate-400 font-sans font-bold">API Response Status:</span>
                <span
                  className={`px-2 py-0.5 rounded font-bold ${
                    testResult.status === 200
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-rose-500/20 text-rose-400"
                  }`}
                >
                  HTTP {testResult.status}
                </span>
              </div>

              {testResult.data?.launch_url && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-between gap-3">
                  <div className="truncate">
                    <span className="text-emerald-400 font-bold block text-[11px] font-sans">
                      Playable Session Launch URL:
                    </span>
                    <span className="text-slate-300 text-[11px] truncate block select-all">
                      {testResult.data.launch_url}
                    </span>
                  </div>
                  <Link
                    href={testResult.data.launch_url}
                    target="_blank"
                    className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1 shrink-0"
                  >
                    <span>Play Now</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              )}

              <pre className="text-slate-300 text-[11px] max-h-48 overflow-y-auto">
                {JSON.stringify(testResult.data, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

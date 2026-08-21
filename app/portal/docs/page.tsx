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
  ShieldCheck,
  FileDown,
  Play,
  Key,
  Globe,
  Radio,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  RefreshCw,
  Hash,
  ExternalLink,
  Flame,
  FileText,
  Lock,
} from "lucide-react";
import { STUDIO_GAMES } from "@/lib/gamesCatalog";

type DocSection =
  | "quickstart"
  | "launch"
  | "games"
  | "ggr_balance"
  | "whoami"
  | "session_verify"
  | "webhooks"
  | "errors";

type Lang = "curl" | "node" | "php" | "python" | "go";

export default function DocsPage() {
  const router = useRouter();
  const [operator, setOperator] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"docs" | "sandbox" | "webhook_tester" | "markdown_export">("docs");
  const [activeSection, setActiveSection] = useState<DocSection>("quickstart");
  const [activeLang, setActiveLang] = useState<Lang>("curl");

  // Sandbox Console State
  const [sandboxEndpoint, setSandboxEndpoint] = useState<"launch" | "games" | "ggr_balance" | "whoami" | "session_verify">("launch");
  const [sandboxMethod, setSandboxMethod] = useState<"POST" | "GET">("POST");
  const [sandboxBody, setSandboxBody] = useState(`{
  "user_id": "player_user_1001",
  "game_uid": "royal_skyrush",
  "balance": 1500,
  "currency": "INR",
  "callback_url": "http://localhost:3000/api/callback",
  "return_url": "http://localhost:3000/lobby"
}`);
  const [sandboxLoading, setSandboxLoading] = useState(false);
  const [sandboxResponse, setSandboxResponse] = useState<any>(null);
  const [sandboxStatus, setSandboxStatus] = useState<number | null>(null);
  const [sandboxLatency, setSandboxLatency] = useState<number | null>(null);

  // Webhook Simulator State
  const [whCallbackUrl, setWhCallbackUrl] = useState("http://localhost:3000/api/callback");
  const [whSecret, setWhSecret] = useState("");
  const [whTesting, setWhTesting] = useState(false);
  const [whResult, setWhResult] = useState<any>(null);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/operator/me");
      if (res.status === 401) {
        router.push("/portal/login");
        return;
      }
      const json = await res.json();
      setOperator(json.operator);
      if (json.operator?.tokens?.[0]?.secretKey) {
        setWhSecret(json.operator.tokens[0].secretKey);
      }
      if (json.operator?.callbackUrl) {
        setWhCallbackUrl(json.operator.callbackUrl);
      }
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

  const tokenStr = operator?.tokens?.[0]?.token || "rgs_live_your_token_here";
  const secretKeyStr = operator?.tokens?.[0]?.secretKey || "rgs_sec_your_secret_here";
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "http://localhost:3002";

  // Switch Sandbox Endpoint
  const handleSelectSandboxEndpoint = (ep: "launch" | "games" | "ggr_balance" | "whoami" | "session_verify") => {
    setSandboxEndpoint(ep);
    setSandboxResponse(null);
    setSandboxStatus(null);
    setSandboxLatency(null);

    if (ep === "launch") {
      setSandboxMethod("POST");
      setSandboxBody(JSON.stringify({
        user_id: "player_user_1001",
        game_uid: "royal_skyrush",
        balance: 1500,
        currency: operator?.currency || "INR",
        callback_url: operator?.callbackUrl || "http://localhost:3000/api/callback",
        return_url: "http://localhost:3000/lobby"
      }, null, 2));
    } else if (ep === "games") {
      setSandboxMethod("GET");
      setSandboxBody("");
    } else if (ep === "ggr_balance") {
      setSandboxMethod("GET");
      setSandboxBody("");
    } else if (ep === "whoami") {
      setSandboxMethod("GET");
      setSandboxBody("");
    } else if (ep === "session_verify") {
      setSandboxMethod("POST");
      setSandboxBody(JSON.stringify({
        session_id: "sess_demo_sample_token_123"
      }, null, 2));
    }
  };

  // Run Sandbox Request
  const handleExecuteSandbox = async () => {
    setSandboxLoading(true);
    setSandboxResponse(null);
    setSandboxStatus(null);
    const startTime = Date.now();

    const endpointPaths = {
      launch: "/api/v1/launch",
      games: "/api/v1/games",
      ggr_balance: "/api/v1/ggr-balance",
      whoami: "/api/v1/whoami",
      session_verify: "/api/v1/session/verify",
    };

    const targetUrl = endpointPaths[sandboxEndpoint];

    try {
      const options: RequestInit = {
        method: sandboxMethod,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenStr}`,
        },
      };

      if (sandboxMethod === "POST" && sandboxBody.trim()) {
        options.body = sandboxBody;
      }

      const res = await fetch(targetUrl, options);
      const latency = Date.now() - startTime;
      setSandboxLatency(latency);
      setSandboxStatus(res.status);

      const json = await res.json();
      setSandboxResponse(json);
    } catch (err: any) {
      setSandboxLatency(Date.now() - startTime);
      setSandboxStatus(500);
      setSandboxResponse({ error: err.message || "Failed to execute request" });
    } finally {
      setSandboxLoading(false);
    }
  };

  // Run Webhook Simulation Ping
  const handleTestWebhook = async () => {
    setWhTesting(true);
    setWhResult(null);

    try {
      const res = await fetch("/api/operator/test-webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ callbackUrl: whCallbackUrl }),
      });
      const data = await res.json();
      setWhResult(data);
    } catch (err: any) {
      setWhResult({ success: false, error: err.message });
    } finally {
      setWhTesting(false);
    }
  };

  // Master Markdown Documentation Generation
  const fullMarkdownGuide = `# 👑 ROYAL GAMES STUDIO (RGS) — B2B REST API & WEBHOOK INTEGRATION GUIDE
**Version**: 2.4.0 (Enterprise RGS)  
**Base API URL**: \`${baseUrl}/api/v1\`  
**Authentication**: Bearer Token  
**Provider Name**: \`Royal Games Studio\`  
**Game Suite**: 10 Native HTML5 Instant / Crash / Stepper / Mines Games  

---

## 🔐 1. Authentication & Security

All requests to the Royal Games Studio API require an \`Authorization\` header with your unique **API Token**:

\`\`\`http
Authorization: Bearer ${tokenStr}
Content-Type: application/json
\`\`\`

> **Note**: For production environments, ensure your server's outgoing IP address is added to your IP Whitelist in the [API Keys Portal](${baseUrl}/portal/apikeys).

---

## ⚡ 2. Environment Quickstart (.env)

Add the following variables to your Casino backend:

\`\`\`env
ROYAL_API_URL=${baseUrl}/api/v1
ROYAL_API_TOKEN=${tokenStr}
ROYAL_SECRET_KEY=${secretKeyStr}
ROYAL_CALLBACK_URL=https://yourcasino.com/api/callback
ROYAL_RETURN_URL=https://yourcasino.com/lobby
\`\`\`

---

## 🚀 3. Core API Endpoints

### 3.1. Launch Game Session
Creates an authenticated player session and returns a secure, responsive full-screen HTML5 game launch URL.

* **Method**: \`POST\`
* **Endpoint**: \`${baseUrl}/api/v1/launch\`
* **Headers**:
  * \`Authorization: Bearer ${tokenStr}\`
  * \`Content-Type: application/json\`

#### Request Payload (JSON):
\`\`\`json
{
  "user_id": "player_99120",
  "game_uid": "royal_skyrush",
  "balance": 1500.00,
  "currency": "INR",
  "callback_url": "https://yourcasino.com/api/callback",
  "return_url": "https://yourcasino.com/lobby"
}
\`\`\`

#### Response (200 OK):
\`\`\`json
{
  "status": 1,
  "code": 0,
  "msg": "Royal Studio game session created successfully",
  "data": {
    "session_id": "sess_f8a920b784a9...",
    "game_uid": "royal_skyrush",
    "game_name": "Sky Rush",
    "provider": "Royal Games Studio",
    "launch_url": "${baseUrl}/play/sess_f8a920b784a9...?token=eyJhbGciOi...",
    "client_name": "${operator?.companyName || "Your Company"}",
    "expires_at": "2026-08-21T06:30:00.000Z"
  }
}
\`\`\`

---

### 3.2. Fetch Active Games Catalog
Returns all available native studio games with RTP, max multipliers, categories, and thumbnail URLs.

* **Method**: \`GET\`
* **Endpoint**: \`${baseUrl}/api/v1/games\`
* **Headers**: \`Authorization: Bearer ${tokenStr}\`

#### Response (200 OK):
\`\`\`json
{
  "status": 1,
  "code": 0,
  "msg": "Royal Games Studio Catalog",
  "count": 10,
  "data": {
    "games": [
      {
        "game_id": 88801,
        "game_uid": "royal_skyrush",
        "name": "Sky Rush",
        "category": "Crash / Multiplier",
        "rtp": 97.5,
        "max_multiplier": "1000x",
        "thumbnail": "${baseUrl}/thumbnails/royal_skyrush.webp",
        "description": "Futuristic high-speed aerial flight machine."
      },
      {
        "game_id": 88802,
        "game_uid": "royal_tigertrail",
        "name": "Tiger Trail",
        "category": "Step / Cashout",
        "rtp": 98.0,
        "max_multiplier": "250x",
        "thumbnail": "${baseUrl}/thumbnails/royal_tigertrail.webp",
        "description": "Navigate the jungle stepping stones with the tiger."
      }
    ],
    "total": 10
  }
}
\`\`\`

---

### 3.3. Check Prepaid GGR Balance
Returns the operator's remaining prepaid credit and active revenue share tier.

* **Method**: \`GET\`
* **Endpoint**: \`${baseUrl}/api/v1/ggr-balance\`
* **Headers**: \`Authorization: Bearer ${tokenStr}\`

#### Response (200 OK):
\`\`\`json
{
  "status": 1,
  "code": 0,
  "msg": "Prepaid GGR Balance Retrieved",
  "data": {
    "operator_id": "${operator?.id || "cuid_demo"}",
    "company_name": "${operator?.companyName || "Your Company"}",
    "prepaid_ggr_balance": ${operator?.balance || 10000.0},
    "currency": "${operator?.currency || "INR"}",
    "ggr_revenue_share_rate": "${operator?.ggrRate || 10.0}%",
    "account_status": "ACTIVE"
  }
}
\`\`\`

---

### 3.4. Caller IP & Token Identity Check
Verifies caller IP address and whitelist status.

* **Method**: \`GET\`
* **Endpoint**: \`${baseUrl}/api/v1/whoami\`
* **Headers**: \`Authorization: Bearer ${tokenStr}\`

---

## 🎴 4. Native Studio Games Reference (10 Titles)

| Game UID | Game Name | Category | Base RTP | Max Multiplier |
|---|---|---|---|---|
| \`royal_skyrush\` | Sky Rush | Crash / Multiplier | 97.5% | 1,000.0x |
| \`royal_tigertrail\` | Tiger Trail | Stepper / Cashout | 98.0% | 250.0x |
| \`royal_bombgrid\` | Bomb Grid | 5x5 Mines Grid | 98.5% | 500.0x |
| \`royal_dropx\` | Drop X | Physics / Plinko | 98.2% | 1,000.0x |
| \`royal_cricketblast\` | Cricket Blast | Stadium Crash | 97.6% | 500.0x |
| \`royal_infinityx\` | Infinity X | Limbo Portal | 98.8% | 10,000.0x |
| \`royal_treasuretower\` | Treasure Tower | Level Stepper | 98.0% | 500.0x |
| \`royal_dicex\` | Dice X | Fast Slider Dice | 99.0% | 100.0x |
| \`royal_cardclimb\` | Card Climb | Hi-Lo Card Ladder | 97.8% | 128.0x |
| \`royal_luckywheel\` | Lucky Wheel X | Multiplier Wheel | 97.0% | 50.0x |

---

## 🔔 5. Webhook Settlement & Callback Specification

Upon completion of any bet or game round, Royal Game Studio server immediately dispatches an authoritative HTTP \`POST\` callback to your configured \`callback_url\`.

### Webhook Headers
\`\`\`http
POST /api/callback HTTP/1.1
Host: yourcasino.com
Content-Type: application/json
X-Signature: 8f4a19c490e5f... (HMAC-SHA256 of the JSON body using your Secret Key)
X-Operator-Id: ${operator?.id || "op_id"}
\`\`\`

### Webhook Payload Example:
\`\`\`json
{
  "event": "round_settled",
  "serial_number": "round_sn_99210081",
  "member_account": "player_99120",
  "game_uid": "royal_skyrush",
  "game_name": "Sky Rush",
  "bet_amount": 100.00,
  "win_amount": 250.00,
  "net_result": 150.00,
  "credit_amount": 1650.00,
  "ggr_fee": 15.00,
  "currency": "INR",
  "timestamp": "2026-08-21T02:40:00.000Z"
}
\`\`\`

### Idempotency Rule:
Always check if \`serial_number\` has already been processed in your database before adjusting player wallet balances.

---

## 🛡️ 6. HMAC Signature Verification Code

### Node.js / Express / Next.js:
\`\`\`typescript
import crypto from "crypto";

export function verifyWebhook(rawBody: string, signature: string, secretKey: string): boolean {
  const expectedSignature = crypto
    .createHmac("sha256", secretKey)
    .update(rawBody)
    .digest("hex");
  return crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(signature));
}
\`\`\`

### PHP:
\`\`\`php
$rawBody = file_get_contents('php://input');
$receivedSignature = $_SERVER['HTTP_X_SIGNATURE'] ?? '';
$secretKey = '${secretKeyStr}';

$computedSignature = hash_hmac('sha256', $rawBody, $secretKey);

if (!hash_equals($computedSignature, $receivedSignature)) {
    http_response_code(401);
    echo json_encode(["status" => 0, "error" => "Invalid Webhook Signature"]);
    exit;
}
\`\`\`

### Python:
\`\`\`python
import hmac
import hashlib

def verify_webhook(raw_body: bytes, received_sig: str, secret_key: str) -> bool:
    computed = hmac.new(secret_key.encode(), raw_body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(computed, received_sig)
\`\`\`

---

## ⚠️ 7. Standard Error Codes

| Status Code | Error Key | Description | Solution |
|---|---|---|---|
| \`401\` | \`UNAUTHORIZED\` | Missing or invalid API Token | Check \`Authorization: Bearer <TOKEN>\` header. |
| \`403\` | \`IP_NOT_WHITELISTED\` | Caller IP not authorized | Add server IP to whitelist in developer portal. |
| \`402\` | \`INSUFFICIENT_GGR\` | Prepaid GGR wallet balance is 0 | Recharge GGR credit in portal wallet. |
| \`404\` | \`GAME_NOT_FOUND\` | Unknown \`game_uid\` | Refer to active games catalog list. |
| \`403\` | \`GAME_DISABLED\` | Game toggled off by operator | Enable game in Operator Games catalog. |

---
**© Royal Games Studio** • Enterprise Remote Gaming Server (RGS) Engine
`;

  const downloadMarkdownFile = () => {
    const blob = new Blob([fullMarkdownGuide], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ROYAL_GAMES_API_INTEGRATION_GUIDE.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Code generator snippets
  const getCodeSnippet = (lang: Lang, ep: DocSection) => {
    if (ep === "launch") {
      if (lang === "curl") {
        return `curl -X POST "${baseUrl}/api/v1/launch" \\
  -H "Authorization: Bearer ${tokenStr}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "user_id": "player_8872",
    "game_uid": "royal_skyrush",
    "balance": 1500,
    "currency": "${operator?.currency || "INR"}",
    "callback_url": "https://yourcasino.com/api/callback",
    "return_url": "https://yourcasino.com/lobby"
  }'`;
      }
      if (lang === "node") {
        return `import axios from "axios";

const res = await axios.post("${baseUrl}/api/v1/launch", {
  user_id: "player_8872",
  game_uid: "royal_skyrush",
  balance: 1500,
  currency: "${operator?.currency || "INR"}",
  callback_url: "https://yourcasino.com/api/callback",
  return_url: "https://yourcasino.com/lobby"
}, {
  headers: {
    "Authorization": "Bearer ${tokenStr}",
    "Content-Type": "application/json"
  }
});

console.log("Play Game Launch URL:", res.data.data.launch_url);`;
      }
      if (lang === "php") {
        return `<?php
$ch = curl_init("${baseUrl}/api/v1/launch");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Authorization: Bearer ${tokenStr}",
    "Content-Type: application/json"
]);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
    "user_id" => "player_8872",
    "game_uid" => "royal_skyrush",
    "balance" => 1500,
    "currency" => "${operator?.currency || "INR"}",
    "callback_url" => "https://yourcasino.com/api/callback",
    "return_url" => "https://yourcasino.com/lobby"
]));

$response = curl_exec($ch);
$data = json_decode($response, true);
echo "Launch URL: " . $data["data"]["launch_url"];
?>`;
      }
      if (lang === "python") {
        return `import requests

url = "${baseUrl}/api/v1/launch"
headers = {
    "Authorization": "Bearer ${tokenStr}",
    "Content-Type": "application/json"
}
payload = {
    "user_id": "player_8872",
    "game_uid": "royal_skyrush",
    "balance": 1500,
    "currency": "${operator?.currency || "INR"}",
    "callback_url": "https://yourcasino.com/api/callback",
    "return_url": "https://yourcasino.com/lobby"
}

resp = requests.post(url, json=payload, headers=headers)
print("Launch URL:", resp.json()["data"]["launch_url"])`;
      }
      if (lang === "go") {
        return `package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "net/http"
)

func main() {
    url := "${baseUrl}/api/v1/launch"
    payload := map[string]interface{}{
        "user_id":      "player_8872",
        "game_uid":     "royal_skyrush",
        "balance":      1500,
        "currency":     "${operator?.currency || "INR"}",
        "callback_url": "https://yourcasino.com/api/callback",
        "return_url":   "https://yourcasino.com/lobby",
    }
    jsonData, _ := json.Marshal(payload)

    req, _ := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
    req.Header.Set("Authorization", "Bearer ${tokenStr}")
    req.Header.Set("Content-Type", "application/json")

    client := &http.Client{}
    resp, err := client.Do(req)
    if err != nil {
        panic(err)
    }
    defer resp.Body.Close()
    fmt.Println("Status:", resp.Status)
}`;
      }
    }

    if (ep === "games") {
      if (lang === "curl") {
        return `curl -X GET "${baseUrl}/api/v1/games" \\
  -H "Authorization: Bearer ${tokenStr}"`;
      }
      if (lang === "node") {
        return `import axios from "axios";

const res = await axios.get("${baseUrl}/api/v1/games", {
  headers: { "Authorization": "Bearer ${tokenStr}" }
});
console.log("Total Games:", res.data.count);
console.log("Catalog:", res.data.data.games);`;
      }
      return `curl -X GET "${baseUrl}/api/v1/games" -H "Authorization: Bearer ${tokenStr}"`;
    }

    if (ep === "ggr_balance") {
      return `curl -X GET "${baseUrl}/api/v1/ggr-balance" \\
  -H "Authorization: Bearer ${tokenStr}"`;
    }

    if (ep === "whoami") {
      return `curl -X GET "${baseUrl}/api/v1/whoami" \\
  -H "Authorization: Bearer ${tokenStr}"`;
    }

    if (ep === "session_verify") {
      return `curl -X POST "${baseUrl}/api/v1/session/verify" \\
  -H "Authorization: Bearer ${tokenStr}" \\
  -H "Content-Type: application/json" \\
  -d '{"session_id": "sess_example_id_123"}'`;
    }

    return `curl -X GET "${baseUrl}/api/v1/games" -H "Authorization: Bearer ${tokenStr}"`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07090e] flex items-center justify-center text-slate-400">
        <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07090e] flex flex-col font-sans">
      <PortalNavbar operator={operator} />

      <div className="flex-1 flex">
        <PortalSidebar operator={operator} />

        <main className="flex-1 p-6 md:p-8 space-y-6 overflow-y-auto max-w-7xl w-full">
          {/* Header Banner */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Enterprise B2B RGS Engine • REST API v2.4</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Developer API Documentation & Tools
              </h1>
              <p className="text-xs text-slate-400">
                Complete integration specifications, interactive test consoles, and automated export tools for Casino Platforms.
              </p>
            </div>

            <div className="flex items-center flex-wrap gap-2.5">
              <button
                onClick={() => copySnippet(fullMarkdownGuide, "full_md_btn")}
                className="px-4 py-2 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 hover:from-amber-500/30 text-amber-300 text-xs font-bold rounded-xl border border-amber-500/40 flex items-center gap-2 transition-all shadow-sm"
              >
                {copiedKey === "full_md_btn" ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied Full .MD Guide!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Full Markdown (.md)</span>
                  </>
                )}
              </button>

              <button
                onClick={downloadMarkdownFile}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 flex items-center gap-2 transition-all"
              >
                <FileDown className="w-3.5 h-3.5 text-amber-400" />
                <span>Download .MD File</span>
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab("docs")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === "docs"
                  ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                  : "text-slate-400 hover:text-white hover:bg-slate-900"
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Interactive Documentation</span>
            </button>

            <button
              onClick={() => setActiveTab("sandbox")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === "sandbox"
                  ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                  : "text-slate-400 hover:text-white hover:bg-slate-900"
              }`}
            >
              <Terminal className="w-4 h-4" />
              <span>Live API Sandbox Console</span>
            </button>

            <button
              onClick={() => setActiveTab("webhook_tester")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === "webhook_tester"
                  ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                  : "text-slate-400 hover:text-white hover:bg-slate-900"
              }`}
            >
              <Radio className="w-4 h-4" />
              <span>Webhook Simulator & HMAC</span>
            </button>

            <button
              onClick={() => setActiveTab("markdown_export")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === "markdown_export"
                  ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                  : "text-slate-400 hover:text-white hover:bg-slate-900"
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Full Markdown Viewer</span>
            </button>
          </div>

          {/* TAB 1: INTERACTIVE DOCUMENTATION */}
          {activeTab === "docs" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Sub-Sidebar Menu */}
              <div className="lg:col-span-3 space-y-1.5 bg-[#0b0f19] border border-slate-800/90 rounded-2xl p-3 sticky top-6">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 py-1.5">
                  Integration Sections
                </p>

                {[
                  { id: "quickstart", label: "1. Overview & Setup", icon: Sparkles },
                  { id: "launch", label: "2. POST /api/v1/launch", icon: Play },
                  { id: "games", label: "3. GET /api/v1/games", icon: Layers },
                  { id: "ggr_balance", label: "4. GET /api/v1/ggr-balance", icon: Key },
                  { id: "whoami", label: "5. GET /api/v1/whoami", icon: Globe },
                  { id: "session_verify", label: "6. POST /session/verify", icon: ShieldCheck },
                  { id: "webhooks", label: "7. Webhooks & HMAC", icon: Radio },
                  { id: "errors", label: "8. Error Codes", icon: AlertTriangle },
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = activeSection === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveSection(item.id as DocSection)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                        isActive
                          ? "bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold"
                          : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-3.5 h-3.5 ${isActive ? "text-amber-400" : "text-slate-500"}`} />
                        <span>{item.label}</span>
                      </div>
                      {isActive && <ChevronRight className="w-3.5 h-3.5 text-amber-400" />}
                    </button>
                  );
                })}

                {/* Quick Info Box */}
                <div className="mt-4 pt-4 border-t border-slate-800 px-2 space-y-2">
                  <div className="text-[11px] text-slate-400 flex items-center justify-between">
                    <span>Base URL:</span>
                    <span className="font-mono text-[10px] text-amber-400">{baseUrl}/api/v1</span>
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center justify-between">
                    <span>Auth:</span>
                    <span className="font-mono text-[10px] text-emerald-400">Bearer Token</span>
                  </div>
                </div>
              </div>

              {/* Right Content Pane */}
              <div className="lg:col-span-9 space-y-6">
                {/* SECTION 1: QUICKSTART */}
                {activeSection === "quickstart" && (
                  <div className="space-y-6 bg-[#0b0f19] border border-slate-800/90 rounded-2xl p-6 sm:p-8">
                    <div className="space-y-2 border-b border-slate-800 pb-4">
                      <h2 className="text-xl font-black text-white flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-amber-400" />
                        <span>Quickstart Architecture Overview</span>
                      </h2>
                      <p className="text-xs text-slate-400">
                        Connect your casino platform with Royal Game Studio in 3 simple steps.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-[#0e1422] border border-slate-800 p-4 rounded-xl space-y-2">
                        <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 font-bold text-xs flex items-center justify-center">1</span>
                        <h4 className="text-sm font-bold text-white">Generate Launch URL</h4>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          Call <code className="text-amber-400 font-mono">POST /api/v1/launch</code> with the player ID, selected game, and balance.
                        </p>
                      </div>

                      <div className="bg-[#0e1422] border border-slate-800 p-4 rounded-xl space-y-2">
                        <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 font-bold text-xs flex items-center justify-center">2</span>
                        <h4 className="text-sm font-bold text-white">Embed Fullscreen Game</h4>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          Embed the returned <code className="text-amber-400 font-mono">launch_url</code> inside your player modal or iframe.
                        </p>
                      </div>

                      <div className="bg-[#0e1422] border border-slate-800 p-4 rounded-xl space-y-2">
                        <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 font-bold text-xs flex items-center justify-center">3</span>
                        <h4 className="text-sm font-bold text-white">Receive Callback</h4>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          Studio settles round and fires webhook to your <code className="text-amber-400 font-mono">callback_url</code> with HMAC signature.
                        </p>
                      </div>
                    </div>

                    {/* Environment Config Box */}
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                          Ready-Made Backend Configuration (.env)
                        </h3>
                        <button
                          onClick={() => copySnippet(`ROYAL_API_URL=${baseUrl}/api/v1\nROYAL_API_TOKEN=${tokenStr}\nROYAL_SECRET_KEY=${secretKeyStr}\nROYAL_CALLBACK_URL=https://yourcasino.com/api/callback`, "quick_env")}
                          className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold"
                        >
                          {copiedKey === "quick_env" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedKey === "quick_env" ? "Copied" : "Copy .env"}</span>
                        </button>
                      </div>

                      <div className="bg-[#07090e] border border-slate-800 rounded-xl p-4 font-mono text-xs text-amber-300/90 leading-relaxed overflow-x-auto">
                        <div>ROYAL_API_URL={baseUrl}/api/v1</div>
                        <div>ROYAL_API_TOKEN={tokenStr}</div>
                        <div>ROYAL_SECRET_KEY={secretKeyStr}</div>
                        <div>ROYAL_CALLBACK_URL=https://yourcasino.com/api/callback</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* SECTION 2: LAUNCH ENDPOINT */}
                {activeSection === "launch" && (
                  <div className="space-y-6 bg-[#0b0f19] border border-slate-800/90 rounded-2xl p-6 sm:p-8">
                    <div className="space-y-2 border-b border-slate-800 pb-4">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-mono font-bold">POST</span>
                        <h2 className="text-lg font-black text-white font-mono">/api/v1/launch</h2>
                      </div>
                      <p className="text-xs text-slate-400">
                        Generates an authenticated player session and creates a high-performance responsive game iframe link.
                      </p>
                    </div>

                    {/* Parameters Table */}
                    <div className="space-y-3">
                      <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Request Parameters (JSON Body)</h3>
                      <div className="border border-slate-800 rounded-xl overflow-hidden text-xs">
                        <table className="w-full text-left">
                          <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800">
                            <tr>
                              <th className="p-3 font-semibold">Field</th>
                              <th className="p-3 font-semibold">Type</th>
                              <th className="p-3 font-semibold">Required</th>
                              <th className="p-3 font-semibold">Description</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                            <tr>
                              <td className="p-3 text-amber-400 font-bold">user_id</td>
                              <td className="p-3 text-slate-400">string</td>
                              <td className="p-3 text-rose-400 font-bold">Yes</td>
                              <td className="p-3 font-sans text-slate-300">Unique identifier for the player in your casino.</td>
                            </tr>
                            <tr>
                              <td className="p-3 text-amber-400 font-bold">game_uid</td>
                              <td className="p-3 text-slate-400">string</td>
                              <td className="p-3 text-rose-400 font-bold">Yes</td>
                              <td className="p-3 font-sans text-slate-300">Studio Game identifier (e.g. <code className="text-amber-400">royal_skyrush</code>).</td>
                            </tr>
                            <tr>
                              <td className="p-3 text-amber-400 font-bold">balance</td>
                              <td className="p-3 text-slate-400">number</td>
                              <td className="p-3 text-rose-400 font-bold">Yes</td>
                              <td className="p-3 font-sans text-slate-300">Player's current real money wallet balance.</td>
                            </tr>
                            <tr>
                              <td className="p-3 text-amber-400 font-bold">currency</td>
                              <td className="p-3 text-slate-400">string</td>
                              <td className="p-3 text-slate-500">Optional</td>
                              <td className="p-3 font-sans text-slate-300">Currency code (defaults to INR / USD).</td>
                            </tr>
                            <tr>
                              <td className="p-3 text-amber-400 font-bold">callback_url</td>
                              <td className="p-3 text-slate-400">string</td>
                              <td className="p-3 text-slate-500">Optional</td>
                              <td className="p-3 font-sans text-slate-300">Custom webhook endpoint for this specific session.</td>
                            </tr>
                            <tr>
                              <td className="p-3 text-amber-400 font-bold">return_url</td>
                              <td className="p-3 text-slate-400">string</td>
                              <td className="p-3 text-slate-500">Optional</td>
                              <td className="p-3 font-sans text-slate-300">Lobby exit URL when player closes the game.</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Language Switcher Code Block */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                          {(["curl", "node", "php", "python", "go"] as Lang[]).map((lang) => (
                            <button
                              key={lang}
                              onClick={() => setActiveLang(lang)}
                              className={`px-3 py-1 rounded-lg text-xs font-bold uppercase transition-all ${
                                activeLang === lang
                                  ? "bg-amber-500 text-slate-950"
                                  : "text-slate-400 hover:text-white"
                              }`}
                            >
                              {lang}
                            </button>
                          ))}
                        </div>

                        <button
                          onClick={() => copySnippet(getCodeSnippet(activeLang, "launch"), "launch_snippet")}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold rounded-lg border border-slate-700 flex items-center gap-1.5"
                        >
                          {copiedKey === "launch_snippet" ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                          <span>{copiedKey === "launch_snippet" ? "Copied" : "Copy Code"}</span>
                        </button>
                      </div>

                      <pre className="bg-[#07090e] border border-slate-800 rounded-xl p-4 text-xs font-mono text-amber-300/90 overflow-x-auto leading-relaxed">
                        {getCodeSnippet(activeLang, "launch")}
                      </pre>
                    </div>

                    {/* Response Sample */}
                    <div className="space-y-2">
                      <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Example Success Response (200 OK)</h3>
                      <pre className="bg-[#07090e] border border-slate-800 rounded-xl p-4 text-xs font-mono text-emerald-400/90 overflow-x-auto">
{`{
  "status": 1,
  "code": 0,
  "msg": "Royal Studio game session created successfully",
  "data": {
    "session_id": "sess_f8a920b784a9...",
    "game_uid": "royal_skyrush",
    "game_name": "Sky Rush",
    "provider": "Royal Games Studio",
    "launch_url": "${baseUrl}/play/sess_f8a920b784a9...?token=eyJhbGciOi...",
    "client_name": "${operator?.companyName || "Your Company"}",
    "expires_at": "2026-08-21T06:30:00.000Z"
  }
}`}
                      </pre>
                    </div>
                  </div>
                )}

                {/* SECTION 3: GAMES CATALOG */}
                {activeSection === "games" && (
                  <div className="space-y-6 bg-[#0b0f19] border border-slate-800/90 rounded-2xl p-6 sm:p-8">
                    <div className="space-y-2 border-b border-slate-800 pb-4">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-lg bg-blue-500/20 text-blue-400 text-xs font-mono font-bold">GET</span>
                        <h2 className="text-lg font-black text-white font-mono">/api/v1/games</h2>
                      </div>
                      <p className="text-xs text-slate-400">
                        Fetches the complete catalog of active Native HTML5 Studio games ({STUDIO_GAMES.length} titles).
                      </p>
                    </div>

                    {/* Games Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {STUDIO_GAMES.map((game) => (
                        <div key={game.game_uid} className="bg-[#0e1422] border border-slate-800 p-3.5 rounded-xl flex items-center justify-between">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs font-bold text-white">{game.name}</h4>
                              <span className="text-[10px] text-amber-400 font-mono font-bold">({game.game_uid})</span>
                            </div>
                            <p className="text-[11px] text-slate-400">{game.category} • Max {game.max_multiplier}x</p>
                          </div>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-mono font-bold">
                            RTP {game.rtp}%
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Code Snippet */}
                    <div className="space-y-2">
                      <pre className="bg-[#07090e] border border-slate-800 rounded-xl p-4 text-xs font-mono text-amber-300/90 overflow-x-auto">
                        {`curl -X GET "${baseUrl}/api/v1/games" -H "Authorization: Bearer ${tokenStr}"`}
                      </pre>
                    </div>
                  </div>
                )}

                {/* SECTION 4: GGR BALANCE */}
                {activeSection === "ggr_balance" && (
                  <div className="space-y-6 bg-[#0b0f19] border border-slate-800/90 rounded-2xl p-6 sm:p-8">
                    <div className="space-y-2 border-b border-slate-800 pb-4">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-lg bg-blue-500/20 text-blue-400 text-xs font-mono font-bold">GET</span>
                        <h2 className="text-lg font-black text-white font-mono">/api/v1/ggr-balance</h2>
                      </div>
                      <p className="text-xs text-slate-400">
                        Checks your operator account's current prepaid GGR wallet balance and active commission hold rate.
                      </p>
                    </div>

                    <pre className="bg-[#07090e] border border-slate-800 rounded-xl p-4 text-xs font-mono text-amber-300/90 overflow-x-auto">
                      {`curl -X GET "${baseUrl}/api/v1/ggr-balance" \\
  -H "Authorization: Bearer ${tokenStr}"`}
                    </pre>

                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Example Response</h3>
                    <pre className="bg-[#07090e] border border-slate-800 rounded-xl p-4 text-xs font-mono text-emerald-400/90 overflow-x-auto">
{`{
  "status": 1,
  "code": 0,
  "msg": "Prepaid GGR Balance Retrieved",
  "data": {
    "operator_id": "${operator?.id || "op_1001"}",
    "company_name": "${operator?.companyName || "Your Company"}",
    "prepaid_ggr_balance": ${operator?.balance || 10000.0},
    "currency": "${operator?.currency || "INR"}",
    "ggr_revenue_share_rate": "${operator?.ggrRate || 10.0}%",
    "account_status": "ACTIVE"
  }
}`}
                    </pre>
                  </div>
                )}

                {/* SECTION 5: WHOAMI */}
                {activeSection === "whoami" && (
                  <div className="space-y-6 bg-[#0b0f19] border border-slate-800/90 rounded-2xl p-6 sm:p-8">
                    <div className="space-y-2 border-b border-slate-800 pb-4">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-lg bg-blue-500/20 text-blue-400 text-xs font-mono font-bold">GET</span>
                        <h2 className="text-lg font-black text-white font-mono">/api/v1/whoami</h2>
                      </div>
                      <p className="text-xs text-slate-400">
                        Inspects your outbound server IP and confirms if it is authorized by the firewall.
                      </p>
                    </div>

                    <pre className="bg-[#07090e] border border-slate-800 rounded-xl p-4 text-xs font-mono text-amber-300/90 overflow-x-auto">
                      {`curl -X GET "${baseUrl}/api/v1/whoami" \\
  -H "Authorization: Bearer ${tokenStr}"`}
                    </pre>
                  </div>
                )}

                {/* SECTION 6: SESSION VERIFY */}
                {activeSection === "session_verify" && (
                  <div className="space-y-6 bg-[#0b0f19] border border-slate-800/90 rounded-2xl p-6 sm:p-8">
                    <div className="space-y-2 border-b border-slate-800 pb-4">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-mono font-bold">POST</span>
                        <h2 className="text-lg font-black text-white font-mono">/api/v1/session/verify</h2>
                      </div>
                      <p className="text-xs text-slate-400">
                        Validates if an active game session token is genuine and hasn't expired.
                      </p>
                    </div>

                    <pre className="bg-[#07090e] border border-slate-800 rounded-xl p-4 text-xs font-mono text-amber-300/90 overflow-x-auto">
{`curl -X POST "${baseUrl}/api/v1/session/verify" \\
  -H "Authorization: Bearer ${tokenStr}" \\
  -H "Content-Type: application/json" \\
  -d '{"session_id": "sess_f8a920b784a9"}'`}
                    </pre>
                  </div>
                )}

                {/* SECTION 7: WEBHOOKS & HMAC */}
                {activeSection === "webhooks" && (
                  <div className="space-y-6 bg-[#0b0f19] border border-slate-800/90 rounded-2xl p-6 sm:p-8">
                    <div className="space-y-2 border-b border-slate-800 pb-4">
                      <div className="flex items-center gap-2">
                        <Radio className="w-5 h-5 text-amber-400" />
                        <h2 className="text-lg font-black text-white">Webhook Settlement & HMAC-SHA256</h2>
                      </div>
                      <p className="text-xs text-slate-400">
                        When a player finishes a round (bet or win), Studio calls your callback endpoint with a cryptographic signature.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Incoming Webhook Payload</h3>
                      <pre className="bg-[#07090e] border border-slate-800 rounded-xl p-4 text-xs font-mono text-amber-300/90 overflow-x-auto">
{`{
  "event": "round_settled",
  "serial_number": "round_sn_88200192",
  "member_account": "player_8872",
  "game_uid": "royal_skyrush",
  "game_name": "Sky Rush",
  "bet_amount": 100.0,
  "win_amount": 250.0,
  "net_result": 150.0,
  "credit_amount": 1650.0,
  "ggr_fee": 15.0,
  "currency": "${operator?.currency || "INR"}",
  "timestamp": "2026-08-21T02:45:00.000Z"
}`}
                      </pre>
                    </div>

                    {/* Verification Code */}
                    <div className="space-y-3">
                      <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">HMAC Signature Verification (Node.js)</h3>
                      <pre className="bg-[#07090e] border border-slate-800 rounded-xl p-4 text-xs font-mono text-emerald-400/90 overflow-x-auto">
{`import crypto from "crypto";

export function verifyRoyalWebhook(rawBody: string, receivedSignature: string, secretKey: string): boolean {
  const expectedSig = crypto
    .createHmac("sha256", secretKey)
    .update(rawBody)
    .digest("hex");
  return crypto.timingSafeEqual(Buffer.from(expectedSig), Buffer.from(receivedSignature));
}`}
                      </pre>
                    </div>
                  </div>
                )}

                {/* SECTION 8: ERRORS */}
                {activeSection === "errors" && (
                  <div className="space-y-6 bg-[#0b0f19] border border-slate-800/90 rounded-2xl p-6 sm:p-8">
                    <div className="space-y-2 border-b border-slate-800 pb-4">
                      <h2 className="text-lg font-black text-white flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-amber-400" />
                        <span>API Error Codes Reference</span>
                      </h2>
                      <p className="text-xs text-slate-400">
                        Standard HTTP error responses and resolution steps.
                      </p>
                    </div>

                    <div className="border border-slate-800 rounded-xl overflow-hidden text-xs">
                      <table className="w-full text-left">
                        <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800">
                          <tr>
                            <th className="p-3 font-semibold">HTTP Code</th>
                            <th className="p-3 font-semibold">Error Message</th>
                            <th className="p-3 font-semibold">Probable Cause & Resolution</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                          <tr>
                            <td className="p-3 text-rose-400 font-bold">401</td>
                            <td className="p-3 text-amber-400">Missing/Invalid Token</td>
                            <td className="p-3 font-sans text-slate-300">Ensure <code className="text-amber-400">Authorization: Bearer &lt;TOKEN&gt;</code> is provided.</td>
                          </tr>
                          <tr>
                            <td className="p-3 text-rose-400 font-bold">402</td>
                            <td className="p-3 text-amber-400">Client prepaid GGR credit exhausted</td>
                            <td className="p-3 font-sans text-slate-300">Recharge your GGR wallet in the client portal.</td>
                          </tr>
                          <tr>
                            <td className="p-3 text-rose-400 font-bold">403</td>
                            <td className="p-3 text-amber-400">Client IP not in whitelist</td>
                            <td className="p-3 font-sans text-slate-300">Add your server's public IP to your IP Whitelist.</td>
                          </tr>
                          <tr>
                            <td className="p-3 text-rose-400 font-bold">404</td>
                            <td className="p-3 text-amber-400">Invalid game_uid</td>
                            <td className="p-3 font-sans text-slate-300">Verify game UID against active games catalog.</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: LIVE API SANDBOX CONSOLE */}
          {activeTab === "sandbox" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Request Builder */}
              <div className="lg:col-span-6 bg-[#0b0f19] border border-slate-800/90 rounded-2xl p-6 space-y-5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-5 h-5 text-amber-400" />
                    <h3 className="text-base font-bold text-white">Live Request Builder</h3>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    Live Token Injected
                  </span>
                </div>

                {/* Endpoint Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Target Endpoint</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      { id: "launch", label: "POST /launch", method: "POST" },
                      { id: "games", label: "GET /games", method: "GET" },
                      { id: "ggr_balance", label: "GET /ggr-balance", method: "GET" },
                      { id: "whoami", label: "GET /whoami", method: "GET" },
                      { id: "session_verify", label: "POST /session/verify", method: "POST" },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelectSandboxEndpoint(item.id as any)}
                        className={`px-3 py-2 rounded-xl text-xs font-mono font-bold flex items-center justify-between border transition-all ${
                          sandboxEndpoint === item.id
                            ? "bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm"
                            : "bg-[#0e1422] text-slate-400 border-slate-800 hover:border-slate-700 hover:text-white"
                        }`}
                      >
                        <span>{item.label}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${item.method === "POST" ? "bg-emerald-500/20 text-emerald-400" : "bg-blue-500/20 text-blue-400"}`}>
                          {item.method}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Method & URL Display */}
                <div className="flex items-center gap-2 bg-[#07090e] border border-slate-800 rounded-xl p-3 font-mono text-xs">
                  <span className={`font-bold ${sandboxMethod === "POST" ? "text-emerald-400" : "text-blue-400"}`}>
                    {sandboxMethod}
                  </span>
                  <span className="text-slate-300 truncate">
                    {baseUrl}/api/v1/{sandboxEndpoint === "session_verify" ? "session/verify" : sandboxEndpoint.replace("_", "-")}
                  </span>
                </div>

                {/* JSON Body editor (if POST) */}
                {sandboxMethod === "POST" && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                      <span>Request JSON Body</span>
                      <span className="text-[10px] text-slate-500 font-mono">application/json</span>
                    </label>
                    <textarea
                      rows={8}
                      value={sandboxBody}
                      onChange={(e) => setSandboxBody(e.target.value)}
                      className="w-full bg-[#07090e] border border-slate-800 rounded-xl p-3 text-xs font-mono text-amber-300 focus:outline-none focus:border-amber-500/60 resize-none leading-relaxed"
                    />
                  </div>
                )}

                {/* Execute Button */}
                <button
                  onClick={handleExecuteSandbox}
                  disabled={sandboxLoading}
                  className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50"
                >
                  {sandboxLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Executing API Request...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 stroke-[2.5]" />
                      <span>Send Live Request</span>
                    </>
                  )}
                </button>
              </div>

              {/* Response Inspector */}
              <div className="lg:col-span-6 bg-[#0b0f19] border border-slate-800/90 rounded-2xl p-6 space-y-5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Code2 className="w-5 h-5 text-amber-400" />
                    <span>Live Response Inspector</span>
                  </h3>

                  {sandboxStatus !== null && (
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-400" />
                        {sandboxLatency}ms
                      </span>
                      <span
                        className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full ${
                          sandboxStatus >= 200 && sandboxStatus < 300
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                        }`}
                      >
                        HTTP {sandboxStatus}
                      </span>
                    </div>
                  )}
                </div>

                {sandboxResponse ? (
                  <div className="space-y-3">
                    <pre className="bg-[#07090e] border border-slate-800 rounded-xl p-4 text-xs font-mono text-emerald-400 max-h-[380px] overflow-y-auto leading-relaxed">
                      {JSON.stringify(sandboxResponse, null, 2)}
                    </pre>

                    {sandboxResponse.data?.launch_url && (
                      <a
                        href={sandboxResponse.data.launch_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-500/20 hover:opacity-95"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Launch Session In New Tab</span>
                      </a>
                    )}
                  </div>
                ) : (
                  <div className="h-[280px] flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-800 rounded-xl text-slate-500 space-y-2">
                    <Terminal className="w-8 h-8 text-slate-600" />
                    <p className="text-xs">No request executed yet.</p>
                    <p className="text-[11px] text-slate-600">
                      Select an endpoint and click <strong className="text-slate-400">Send Live Request</strong>.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: WEBHOOK SIMULATOR */}
          {activeTab === "webhook_tester" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Webhook Form */}
              <div className="lg:col-span-6 bg-[#0b0f19] border border-slate-800/90 rounded-2xl p-6 space-y-5">
                <div className="space-y-1 border-b border-slate-800 pb-3">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Radio className="w-5 h-5 text-amber-400" />
                    <span>Webhook Callback Simulator</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Test if your casino server properly receives and verifies round settlement webhooks.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">Your Callback Endpoint URL</label>
                    <input
                      type="url"
                      value={whCallbackUrl}
                      onChange={(e) => setWhCallbackUrl(e.target.value)}
                      placeholder="https://yourcasino.com/api/callback"
                      className="w-full bg-[#07090e] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500/60 font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">Secret Key for HMAC-SHA256 Signature</label>
                    <input
                      type="text"
                      value={whSecret}
                      onChange={(e) => setWhSecret(e.target.value)}
                      className="w-full bg-[#07090e] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-amber-300 focus:outline-none focus:border-amber-500/60 font-mono"
                    />
                  </div>
                </div>

                <button
                  onClick={handleTestWebhook}
                  disabled={whTesting}
                  className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50"
                >
                  {whTesting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Firing Mock Callback...</span>
                    </>
                  ) : (
                    <>
                      <Radio className="w-4 h-4" />
                      <span>Fire Test Callback Event</span>
                    </>
                  )}
                </button>
              </div>

              {/* Webhook Result */}
              <div className="lg:col-span-6 bg-[#0b0f19] border border-slate-800/90 rounded-2xl p-6 space-y-5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="text-base font-bold text-white">Callback Delivery Result</h3>
                  {whResult && (
                    <span
                      className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full ${
                        whResult.success
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                      }`}
                    >
                      HTTP {whResult.httpStatus || 500}
                    </span>
                  )}
                </div>

                {whResult ? (
                  <div className="space-y-3 text-xs">
                    <div className="bg-[#07090e] border border-slate-800 rounded-xl p-4 space-y-2">
                      <div className="flex items-center justify-between text-slate-400">
                        <span>Latency:</span>
                        <span className="font-mono text-amber-400">{whResult.latencyMs} ms</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-400">
                        <span>X-Signature (HMAC-SHA256):</span>
                        <span className="font-mono text-emerald-400 truncate max-w-[240px]">
                          {whResult.signatureSent}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[11px] font-bold text-slate-400 uppercase">Payload Sent:</p>
                      <pre className="bg-[#07090e] border border-slate-800 rounded-xl p-3 text-[11px] font-mono text-amber-300/90 max-h-[160px] overflow-y-auto">
                        {JSON.stringify(whResult.payloadSent, null, 2)}
                      </pre>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[11px] font-bold text-slate-400 uppercase">Response Received from Your Server:</p>
                      <pre className="bg-[#07090e] border border-slate-800 rounded-xl p-3 text-[11px] font-mono text-emerald-400 max-h-[120px] overflow-y-auto">
                        {JSON.stringify(whResult.responseReceived || { error: whResult.error }, null, 2)}
                      </pre>
                    </div>
                  </div>
                ) : (
                  <div className="h-[280px] flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-800 rounded-xl text-slate-500 space-y-2">
                    <Radio className="w-8 h-8 text-slate-600" />
                    <p className="text-xs">No callback fired yet.</p>
                    <p className="text-[11px] text-slate-600">Enter your endpoint and click Fire Test Callback Event.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: FULL MARKDOWN VIEWER */}
          {activeTab === "markdown_export" && (
            <div className="bg-[#0b0f19] border border-slate-800/90 rounded-2xl p-6 sm:p-8 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-lg font-black text-white">Full Markdown Integration File</h2>
                  <p className="text-xs text-slate-400">
                    Ready to copy into your team's internal documentation, Cursor IDE, or share with external developers.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copySnippet(fullMarkdownGuide, "full_md_tab")}
                    className="px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 text-xs font-black rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-1.5"
                  >
                    {copiedKey === "full_md_tab" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === "full_md_tab" ? "Copied!" : "1-Click Copy Full .MD"}</span>
                  </button>
                  <button
                    onClick={downloadMarkdownFile}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 flex items-center gap-1.5"
                  >
                    <FileDown className="w-3.5 h-3.5 text-amber-400" />
                    <span>Download</span>
                  </button>
                </div>
              </div>

              <pre className="bg-[#07090e] border border-slate-800 rounded-xl p-5 text-xs font-mono text-slate-300 overflow-x-auto leading-relaxed max-h-[600px] overflow-y-auto">
                {fullMarkdownGuide}
              </pre>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

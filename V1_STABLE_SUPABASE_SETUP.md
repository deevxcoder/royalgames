# 👑 ROYAL GAMES STUDIO v1.0.0 - STABLE RELEASE & SUPABASE SETUP GUIDE

This document provides complete instructions to set up, deploy, or restore **Royal Games Studio & B2B GGR Aggregator Platform (v1.0.0)** onto any fresh Supabase project or PostgreSQL database.

---

## 📦 What is included in v1.0.0-stable:
1. **11 Native 60FPS HTML5 Studio Games**:
   - 🚀 `royal_skyrush` (Global Synchronized Crash Flight)
   - 🐯 `royal_tigertrail` (Jungle River Multiplier Step)
   - 💣 `royal_bombgrid` (5x5 Laser Energy Mines)
   - 🎯 `royal_dropx` (Precision Physics Galton Plinko)
   - 🏏 `royal_cricketblast` (Stadium Night Hit Crash)
   - ♾️ `royal_infinityx` (Quantum High-Speed Limbo)
   - 🏰 `royal_treasuretower` (8-Floor Temple Risk Tower)
   - 🎲 `royal_dicex` (3D Probability Table Dice)
   - 🃏 `royal_cardclimb` (VIP Felt Table Hi-Lo)
   - 🎡 `royal_luckywheel` (60FPS Multiplier Money Wheel)
   - 👑 `royal_andarbahar` (Global Synchronized Live Multiplayer Cards)
2. **Dynamic Admin RTP & House Edge Engine**:
   - Real-time studio RTP control (95.0% - 98.0%) with zero hardcoded win exploits.
3. **B2B GGR Aggregator Backend**:
   - Full API Gateway (`/api/v1/launch`, `/api/v1/games`, `/api/studio/round`, `/api/studio/session`).
   - Idempotency protection (`SN_ROYAL_...`), IP Whitelisting, and automated webhook callback delivery.
4. **Superadmin & Operator Portal**:
   - Sticky full-height navigation dashboard, client financial reports, and live round telemetry.

---

## 🚀 1-Click Database Setup on Fresh Supabase

### Option A: Via Prisma CLI (Recommended)
1. In your `.env` or Vercel Environment Variables, set:
```env
DATABASE_URL="postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"
NEXT_PUBLIC_APP_URL="https://your-domain.vercel.app"
SUPERADMIN_EMAIL="admin@royalgames.com"
```
2. Push the schema to Supabase:
```bash
npx prisma db push
```
3. Run the automated v1 seeder:
```bash
node scripts/seed_supabase_v1.js
# OR
npx tsx scripts/seed_supabase_v1.ts
```

### Option B: Via Supabase Web Dashboard (SQL Editor)
1. Open your Supabase Dashboard: [https://supabase.com/dashboard](https://supabase.com/dashboard).
2. Go to **SQL Editor** ➔ **New Query**.
3. Copy all contents from [`prisma/supabase_v1_migration.sql`](file:///c:/Users/vikram/Desktop/royalgames-project/royalgames/prisma/supabase_v1_migration.sql) and click **Run**.
4. All tables, indices, and relations will be created instantly.

---

## 🔑 Default Credentials Seeded in v1.0.0

| Role | Username / Email | Password | Production API Key / Details |
|---|---|---|---|
| 👑 **Superadmin** | `superadmin` / `admin@royalgames.com` | `admin123` | Full access to `/admin` dashboard |
| 🏢 **Master B2B Client** | `gateway@royalggr.com` | `royalggr123` | Token: `rgs_live_royalggr_master_2026`<br>Secret: `rgs_sec_royalggr_master_secret_2026` |
| 🎮 **Studio Games** | 11 Titles Active | — | Default RTP: `96.0%` (4.0% House Edge) |

---

## 🔄 How to Rollback to this Stable Milestone:
If future experimental features break anything, you can immediately restore this exact stable snapshot using Git:
```bash
git checkout v1.0.0-stable
```

-- ==============================================================================
-- ROYAL GAMES STUDIO v1.0.0 - COMPLETE SUPABASE POSTGRESQL SCHEMA DUMP
-- Compatible with Supabase SQL Editor & Direct PostgreSQL 14+ Instances
-- ==============================================================================

-- 1. Users & Player Accounts
CREATE TABLE IF NOT EXISTS "users" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT,
    "passwordHash" TEXT NOT NULL,
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 1000.0,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "users_username_key" ON "users"("username");
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");

-- 2. Operators & B2B Aggregator Clients
CREATE TABLE IF NOT EXISTS "operators" (
    "id" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 10000.0,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "ggrRate" DOUBLE PRECISION NOT NULL DEFAULT 10.0,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "callbackUrl" TEXT DEFAULT 'https://ggrcasinotest.vercel.app/api/callback',
    "encryptCallbacks" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "operators_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "operators_email_key" ON "operators"("email");

-- 3. API Keys & Production Secrets
CREATE TABLE IF NOT EXISTS "api_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "secretKey" TEXT,
    "name" TEXT NOT NULL DEFAULT 'Primary Key',
    "operatorId" TEXT NOT NULL,
    "isLive" BOOLEAN NOT NULL DEFAULT true,
    "ipWhitelist" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3),

    CONSTRAINT "api_tokens_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "api_tokens_token_key" ON "api_tokens"("token");
CREATE INDEX IF NOT EXISTS "api_tokens_operatorId_idx" ON "api_tokens"("operatorId");

-- 4. Site Settings & Dynamic Global RTP Config
CREATE TABLE IF NOT EXISTS "site_settings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "siteName" TEXT NOT NULL DEFAULT 'ROYAL GAMES STUDIO',
    "siteSubtitle" TEXT NOT NULL DEFAULT 'Next-Gen iGaming & B2B GGR Aggregator Platform',
    "logoUrl" TEXT,
    "themeColor" TEXT NOT NULL DEFAULT 'gold',
    "callbackUrl" TEXT NOT NULL DEFAULT 'https://ggrcasinotest.vercel.app/api/callback',
    "returnUrl" TEXT NOT NULL DEFAULT 'https://ggrcasinotest.vercel.app',
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "enabledProviders" TEXT,
    "disabledGames" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "site_settings_pkey" PRIMARY KEY ("id")
);

-- 5. Game Sessions (Seamless Token Handshake)
CREATE TABLE IF NOT EXISTS "game_sessions" (
    "id" TEXT NOT NULL,
    "sessionUuid" TEXT NOT NULL,
    "operatorId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "playerName" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "balance" DOUBLE PRECISION NOT NULL,
    "gameUid" TEXT NOT NULL,
    "returnUrl" TEXT,
    "ipAddress" TEXT,
    "isExpired" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "game_sessions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "game_sessions_sessionUuid_key" ON "game_sessions"("sessionUuid");
CREATE INDEX IF NOT EXISTS "game_sessions_operatorId_idx" ON "game_sessions"("operatorId");
CREATE INDEX IF NOT EXISTS "game_sessions_playerId_idx" ON "game_sessions"("playerId");

-- 6. Game Rounds (Idempotent Round Ledger with GGR Accounting)
CREATE TABLE IF NOT EXISTS "game_rounds" (
    "id" TEXT NOT NULL,
    "serialNumber" TEXT NOT NULL,
    "sessionId" TEXT,
    "operatorId" TEXT,
    "memberAccount" TEXT,
    "userId" TEXT,
    "gameId" INTEGER,
    "gameUid" TEXT NOT NULL,
    "gameName" TEXT,
    "gameRound" TEXT,
    "betAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "winAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "creditAmount" DOUBLE PRECISION NOT NULL,
    "ggrFeeDeducted" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "rawPayload" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "game_rounds_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "game_rounds_serialNumber_key" ON "game_rounds"("serialNumber");
CREATE INDEX IF NOT EXISTS "game_rounds_memberAccount_idx" ON "game_rounds"("memberAccount");
CREATE INDEX IF NOT EXISTS "game_rounds_operatorId_idx" ON "game_rounds"("operatorId");

-- 7. External Providers & Games Cache
CREATE TABLE IF NOT EXISTS "external_providers" (
    "id" TEXT NOT NULL,
    "brandId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'ROYAL_NATIVE',
    "apiUrl" TEXT NOT NULL,
    "apiToken" TEXT NOT NULL,
    "apiSecret" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "gameCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "external_providers_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "external_providers_brandId_key" ON "external_providers"("brandId");

CREATE TABLE IF NOT EXISTS "external_games" (
    "id" TEXT NOT NULL,
    "gameId" INTEGER NOT NULL,
    "gameUid" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "brandId" INTEGER NOT NULL,
    "provider" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "rtp" DOUBLE PRECISION NOT NULL DEFAULT 96.0,
    "maxMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 1000.0,
    "thumbnail" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "external_games_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "external_games_gameId_key" ON "external_games"("gameId");
CREATE UNIQUE INDEX IF NOT EXISTS "external_games_gameUid_key" ON "external_games"("gameUid");
CREATE INDEX IF NOT EXISTS "external_games_brandId_idx" ON "external_games"("brandId");

-- 8. Foreign Key Constraints
ALTER TABLE "api_tokens" ADD CONSTRAINT "api_tokens_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "operators"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "game_sessions" ADD CONSTRAINT "game_sessions_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "operators"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "game_rounds" ADD CONSTRAINT "game_rounds_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "game_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "game_rounds" ADD CONSTRAINT "game_rounds_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "operators"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "external_games" ADD CONSTRAINT "external_games_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "external_providers"("brandId") ON DELETE CASCADE ON UPDATE CASCADE;

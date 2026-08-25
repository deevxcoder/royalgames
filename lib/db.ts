import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function getCleanDbUrl(): string {
  let url =
    process.env.DATABASE_URL ||
    "postgresql://postgres.beiinfacldfooypzybrd:ilove%40SB%40143@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true";

  if (!url.includes("connection_limit")) {
    const separator = url.includes("?") ? "&" : "?";
    url = `${url}${separator}connection_limit=5&pool_timeout=10`;
  }
  return url;
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: getCleanDbUrl(),
      },
    },
  });

// Always store on globalThis to avoid opening new connections on every request
globalForPrisma.prisma = db;

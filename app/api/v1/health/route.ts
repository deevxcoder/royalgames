import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: 1,
    service: "Royal Games Studio RGS",
    version: "2.0.0",
    timestamp: new Date().toISOString(),
    games_count: 6,
  });
}

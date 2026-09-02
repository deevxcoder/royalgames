import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyStudioAdminToken } from "@/lib/studioAuth";
import { db } from "@/lib/db";

export async function POST() {
  return NextResponse.json(
    {
      error: "Direct self-recharge is permanently disabled. All deposits must be submitted as a request in the portal and approved manually by Studio Super Admin.",
      success: false,
    },
    { status: 403 }
  );
}

import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  return NextResponse.json(
    {
      error: "Public registration is disabled. Casino operators and aggregators must be onboarded directly by the Studio Super Admin via /admin.",
      success: false,
    },
    { status: 403 }
  );
}

import { NextResponse } from "next/server";
import { getStudioAdmin } from "@/lib/studioAuth";

export async function GET() {
  const admin = await getStudioAdmin();
  if (!admin) {
    return NextResponse.json({ user: null });
  }
  return NextResponse.json({ user: admin });
}

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete("studio_admin_token");
  return response;
}

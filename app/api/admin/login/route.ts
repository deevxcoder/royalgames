import { NextResponse } from "next/server";
import { signStudioAdminToken } from "@/lib/studioAuth";

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    // Default master studio credentials or env
    const validUser = process.env.STUDIO_ADMIN_USER || "admin";
    const validPass = process.env.STUDIO_ADMIN_PASS || "Kali9090";

    if (username === validUser && password === validPass) {
      const token = signStudioAdminToken({ username, role: "STUDIO_SUPER_ADMIN" });
      const response = NextResponse.json({
        success: true,
        user: { username, role: "STUDIO_SUPER_ADMIN" },
      });

      response.cookies.set("studio_admin_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
      });

      return response;
    }

    return NextResponse.json({ error: "Invalid Studio Admin credentials" }, { status: 401 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Login failed" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { authenticateStudioRequest } from "@/lib/studioAuth";

export async function GET(req: NextRequest) {
  try {
    const auth = await authenticateStudioRequest(req);
    if (!auth.valid) {
      return NextResponse.json(
        { status: 0, error: auth.error || "Unauthorized Studio API Access" },
        { status: auth.statusCode || 401 }
      );
    }

    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";

    const allowedIps = auth.tokenRecord?.ipWhitelist
      ? auth.tokenRecord.ipWhitelist.split(",").map((ip: string) => ip.trim())
      : [];

    const isWhitelisted =
      allowedIps.length === 0 ||
      allowedIps.includes("*") ||
      allowedIps.includes(clientIp) ||
      clientIp === "127.0.0.1" ||
      clientIp === "::1" ||
      clientIp === "localhost";

    return NextResponse.json({
      status: 1,
      code: 0,
      msg: "Operator Authentication & Identity Verified",
      data: {
        operator_id: auth.client.id,
        company_name: auth.client.companyName,
        email: auth.client.email,
        token_name: auth.tokenRecord?.name || "Production Key",
        caller_ip: clientIp,
        is_ip_whitelisted: isWhitelisted,
        whitelisted_ips: allowedIps,
        currency: auth.client.currency,
        account_status: auth.client.status,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    return NextResponse.json({ status: 0, error: err.message || "Internal server error" }, { status: 500 });
  }
}

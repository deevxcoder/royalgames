import { NextRequest, NextResponse } from "next/server";
import { authenticateStudioRequest } from "@/lib/studioAuth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const auth = await authenticateStudioRequest(req);
    if (!auth.valid) {
      return NextResponse.json(
        { status: 0, error: auth.error || "Unauthorized Studio API Access" },
        { status: auth.statusCode || 401 }
      );
    }

    const client = await db.operator.findUnique({
      where: { id: auth.client.id },
      select: {
        id: true,
        companyName: true,
        email: true,
        balance: true,
        currency: true,
        ggrRate: true,
        status: true,
        updatedAt: true,
      },
    });

    if (!client) {
      return NextResponse.json({ status: 0, error: "Operator not found" }, { status: 404 });
    }

    return NextResponse.json({
      status: 1,
      code: 0,
      msg: "Prepaid GGR Balance Retrieved",
      data: {
        operator_id: client.id,
        company_name: client.companyName,
        email: client.email,
        prepaid_ggr_balance: client.balance,
        currency: client.currency,
        ggr_revenue_share_rate: `${client.ggrRate}%`,
        account_status: client.status,
        last_updated: client.updatedAt.toISOString(),
      },
    });
  } catch (err: any) {
    return NextResponse.json({ status: 0, error: err.message || "Internal server error" }, { status: 500 });
  }
}

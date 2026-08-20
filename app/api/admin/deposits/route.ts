import { NextRequest, NextResponse } from "next/server";
import { getStudioAdmin } from "@/lib/studioAuth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const admin = await getStudioAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized Studio Admin" }, { status: 401 });
    }

    const deposits = await db.operatorDepositRequest.findMany({
      include: {
        operator: {
          select: { id: true, companyName: true, email: true, balance: true, currency: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({ success: true, deposits });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to load deposit requests" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await getStudioAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized Studio Admin" }, { status: 401 });
    }

    const body = await req.json();
    const { depositId, action, adminNotes } = body;

    if (!depositId || !["APPROVE", "REJECT"].includes(action)) {
      return NextResponse.json({ error: "Invalid action or depositId" }, { status: 400 });
    }

    const deposit = await db.operatorDepositRequest.findUnique({
      where: { id: depositId },
      include: { operator: true },
    });

    if (!deposit) {
      return NextResponse.json({ error: "Deposit request not found" }, { status: 404 });
    }

    if (deposit.status !== "PENDING") {
      return NextResponse.json(
        { error: `Deposit request is already ${deposit.status}` },
        { status: 400 }
      );
    }

    if (action === "REJECT") {
      const updated = await db.operatorDepositRequest.update({
        where: { id: depositId },
        data: {
          status: "REJECTED",
          adminNotes: adminNotes || "Rejected by Studio Admin",
          processedBy: admin.username,
          updatedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        message: "Deposit request rejected",
        deposit: updated,
      });
    }

    // APPROVE Action
    const result = await db.$transaction(async (tx) => {
      const currentOp = await tx.operator.findUnique({
        where: { id: deposit.operatorId },
      });

      if (!currentOp) throw new Error("Target operator not found");

      const newBalance = Number((currentOp.balance + deposit.amount).toFixed(2));

      // 1. Update Operator Balance
      const updatedOperator = await tx.operator.update({
        where: { id: deposit.operatorId },
        data: { balance: newBalance },
      });

      // 2. Create Ledger Transaction
      const ledgerEntry = await tx.operatorTransaction.create({
        data: {
          operatorId: deposit.operatorId,
          type: "DEPOSIT",
          amount: deposit.amount,
          balanceAfter: newBalance,
          referenceId: deposit.transactionRef,
          description: `Manual Deposit Approved: ${deposit.paymentMethod} (Ref: ${deposit.transactionRef})`,
        },
      });

      // 3. Mark Deposit Request Approved
      const updatedDeposit = await tx.operatorDepositRequest.update({
        where: { id: depositId },
        data: {
          status: "APPROVED",
          adminNotes: adminNotes || "Approved and credited by Studio Super Admin",
          processedBy: admin.username,
          updatedAt: new Date(),
        },
      });

      return { updatedOperator, ledgerEntry, updatedDeposit };
    });

    return NextResponse.json({
      success: true,
      message: `Deposit of ₹${deposit.amount} approved and credited to ${deposit.operator.companyName}`,
      deposit: result.updatedDeposit,
      newBalance: result.updatedOperator.balance,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to process deposit" }, { status: 500 });
  }
}

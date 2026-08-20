import { NextRequest, NextResponse } from "next/server";
import { getStudioAdmin } from "@/lib/studioAuth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const admin = await getStudioAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized Studio Admin" }, { status: 401 });
    }

    const body = await req.json();
    const { action, targetOperatorId, amount, reason, ggrRate, status } = body;

    if (!targetOperatorId) {
      return NextResponse.json({ error: "Target operator ID required" }, { status: 400 });
    }

    if (action === "ADJUST_BALANCE") {
      const numAmount = Number(amount);
      if (isNaN(numAmount) || numAmount === 0) {
        return NextResponse.json({ error: "Valid non-zero amount required" }, { status: 400 });
      }

      const result = await db.$transaction(async (tx) => {
        const targetOp = await tx.operator.findUnique({
          where: { id: targetOperatorId },
        });

        if (!targetOp) throw new Error("Operator not found");

        const newBalance = Number((targetOp.balance + numAmount).toFixed(2));

        const updated = await tx.operator.update({
          where: { id: targetOperatorId },
          data: { balance: newBalance },
        });

        const txRecord = await tx.operatorTransaction.create({
          data: {
            operatorId: targetOperatorId,
            type: numAmount > 0 ? "MANUAL_CREDIT" : "MANUAL_DEBIT",
            amount: numAmount,
            balanceAfter: newBalance,
            referenceId: `ADJ_${Date.now()}`,
            description: reason || `Manual Admin Balance Adjustment by ${admin.username}`,
          },
        });

        return { updated, txRecord };
      });

      return NextResponse.json({
        success: true,
        message: `Balance adjusted by ₹${numAmount}. New balance: ₹${result.updated.balance}`,
        operator: result.updated,
      });
    }

    if (action === "UPDATE_SETTINGS") {
      const dataToUpdate: any = {};
      if (ggrRate !== undefined) dataToUpdate.ggrRate = Number(ggrRate);
      if (status !== undefined) dataToUpdate.status = String(status);

      const updated = await db.operator.update({
        where: { id: targetOperatorId },
        data: dataToUpdate,
      });

      return NextResponse.json({
        success: true,
        message: "Operator settings updated successfully",
        operator: updated,
      });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update operator" }, { status: 500 });
  }
}

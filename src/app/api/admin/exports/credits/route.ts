import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { toCsv } from "@/lib/csv";
import { isDatabaseConfigured, prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !["super_admin", "staff"].includes(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isDatabaseConfigured || !prisma) {
    return new NextResponse("", {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="credit-ledger.csv"',
      },
    });
  }

  const entries = await prisma.creditLedger.findMany({
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "export.credit-ledger",
      targetType: "Export",
      targetId: "credit-ledger",
    },
  });

  const rows = entries.map((entry) => ({
    id: entry.id,
    memberName: entry.user.name,
    memberEmail: entry.user.email,
    type: entry.type,
    amount: entry.amount,
    note: entry.note ?? "",
    offeringId: entry.offeringId ?? "",
    reservationId: entry.reservationId ?? "",
    adjustmentReason: entry.adjustmentReason ?? "",
    createdAt: entry.createdAt.toISOString(),
  }));

  return new NextResponse(toCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="credit-ledger.csv"',
    },
  });
}

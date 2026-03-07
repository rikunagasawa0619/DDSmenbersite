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
        "Content-Disposition": 'attachment; filename="reservations.csv"',
      },
    });
  }

  const reservations = await prisma.reservation.findMany({
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
      offering: {
        select: {
          title: true,
          offeringType: true,
          startsAt: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "export.reservations",
      targetType: "Export",
      targetId: "reservations",
    },
  });

  const rows = reservations.map((reservation) => ({
    id: reservation.id,
    offeringTitle: reservation.offering.title,
    offeringType: reservation.offering.offeringType,
    startsAt: reservation.offering.startsAt.toISOString(),
    memberName: reservation.user.name,
    memberEmail: reservation.user.email,
    status: reservation.status,
    reservedAt: reservation.createdAt.toISOString(),
  }));

  return new NextResponse(toCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="reservations.csv"',
    },
  });
}

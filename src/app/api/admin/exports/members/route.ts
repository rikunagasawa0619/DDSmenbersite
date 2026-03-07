import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { toCsv } from "@/lib/csv";
import { isDatabaseConfigured, prisma } from "@/lib/prisma";
import { listMembers } from "@/lib/repository";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !["super_admin", "staff"].includes(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const members = await listMembers();
  const rows = members.map((member) => ({
    id: member.id,
    name: member.name,
    email: member.email,
    role: member.role,
    status: member.status,
    planCode: member.planCode,
    title: member.title,
    company: member.company ?? "",
    segments: member.segmentSlugs.join("|"),
    contractStartAt: member.contractStartAt,
    joinedAt: member.joinedAt,
  }));

  if (isDatabaseConfigured && prisma) {
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "export.members",
        targetType: "Export",
        targetId: "members",
      },
    });
  }

  return new NextResponse(toCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="members.csv"',
    },
  });
}

"use server";

import { clerkClient } from "@clerk/nextjs/server";
import { MembershipPlanCode, UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { buildMonthlyGrantEntry, createBalanceAdjustment, createBonusGrant, createPlanChangeGrant } from "@/lib/credits";
import { processMonthlyCreditGrants } from "@/lib/credit-batch";
import { requireAdmin } from "@/lib/auth";
import { buildAbsoluteUrl } from "@/lib/env";
import { redirectWithFlash } from "@/lib/flash";
import { isClerkServerReady } from "@/lib/config";
import { prisma } from "@/lib/prisma";
import { RateLimitError, assertRateLimit } from "@/lib/rate-limit";
import { getMembershipPlanByCode } from "@/lib/repository";

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function getAdminActorId() {
  const actor = await requireAdmin();

  if (!prisma) {
    return actor.id;
  }

  const persisted = await prisma.user.findFirst({
    where: {
      OR: [{ id: actor.id }, { email: actor.email }],
    },
  });

  return persisted?.id ?? actor.id;
}

async function assertAdminMutationLimit(actorId: string, action: string) {
  try {
    await assertRateLimit(
      { key: `admin:${action}`, limit: 20, windowMs: 60_000 },
      actorId,
    );
  } catch (error) {
    if (error instanceof RateLimitError) {
      await redirectWithFlash(error.message, "error", "/admin");
    }
    throw error;
  }
}

async function ensureWallet(userId: string) {
  if (!prisma) {
    throw new Error("Database is not configured.");
  }

  const existing = await prisma.creditWallet.findUnique({
    where: { userId },
  });

  if (existing) {
    return existing;
  }

  return prisma.creditWallet.create({
    data: {
      userId,
      currentBalance: 0,
    },
  });
}

async function upsertSegmentBySlug(slug: string) {
  if (!prisma) {
    throw new Error("Database is not configured.");
  }

  return prisma.segmentTag.upsert({
    where: { slug },
    update: {},
    create: {
      slug,
      label: slug.startsWith("plan:") ? slug.replace("plan:", "DDS ").toUpperCase() : slug,
      isSystem: slug.startsWith("plan:"),
    },
  });
}

export async function saveThemeSettingsAction(formData: FormData) {
  if (!prisma) {
    await redirectWithFlash("データベース設定後に利用できます。", "error", "/admin/theme");
  }
  const db = prisma!;

  const actorId = await getAdminActorId();
  await assertAdminMutationLimit(actorId, "save-theme");

  const schema = z.object({
    brandName: z.string().min(2),
    heroHeadline: z.string().min(10),
    primaryColor: z.string().min(4),
    accentColor: z.string().min(4),
    surfaceColor: z.string().min(4),
    logoWordmark: z.string().min(1),
    supportEmail: z.string().email(),
    termsNotice: z.string().min(5),
  });

  const values = schema.parse({
    brandName: formData.get("brandName"),
    heroHeadline: formData.get("heroHeadline"),
    primaryColor: formData.get("primaryColor"),
    accentColor: formData.get("accentColor"),
    surfaceColor: formData.get("surfaceColor"),
    logoWordmark: formData.get("logoWordmark"),
    supportEmail: formData.get("supportEmail"),
    termsNotice: formData.get("termsNotice"),
  });

  const existing = await db.themeSettings.findFirst();

  if (existing) {
    await db.themeSettings.update({
      where: { id: existing.id },
      data: values,
    });
  } else {
    await db.themeSettings.create({ data: values });
  }

  revalidatePath("/admin/theme");
  revalidatePath("/app");

  await redirectWithFlash("テーマ設定を更新しました。", "success", "/admin/theme");
}

export async function createAnnouncementAction(formData: FormData) {
  if (!prisma) {
    await redirectWithFlash("データベース設定後に利用できます。", "error", "/admin/content");
  }
  const db = prisma!;

  const actorId = await getAdminActorId();
  await assertAdminMutationLimit(actorId, "create-announcement");
  const schema = z.object({
    title: z.string().min(2),
    summary: z.string().min(2),
    body: z.string().min(2),
    publishAt: z.string().optional(),
  });

  const values = schema.parse({
    title: formData.get("title"),
    summary: formData.get("summary"),
    body: formData.get("body"),
    publishAt: formData.get("publishAt")?.toString() || undefined,
  });

  const planCodes = formData
    .getAll("planCodes")
    .map((value) => value.toString())
    .filter(Boolean) as MembershipPlanCode[];

  const created = await db.announcement.create({
    data: {
      title: values.title,
      summary: values.summary,
      body: values.body,
      publishStatus: "PUBLISHED",
      publishAt: values.publishAt ? new Date(values.publishAt) : new Date(),
      audience: planCodes.length > 0 ? { planCodes } : undefined,
    },
  });

  await db.auditLog.create({
    data: {
      userId: actorId,
      action: "announcement.create",
      targetType: "Announcement",
      targetId: created.id,
      metadata: { planCodes },
    },
  });

  revalidatePath("/admin/content");
  revalidatePath("/app");

  await redirectWithFlash("お知らせを公開しました。", "success", "/admin/content");
}

export async function createBannerAction(formData: FormData) {
  if (!prisma) {
    await redirectWithFlash("データベース設定後に利用できます。", "error", "/admin/content");
  }
  const db = prisma!;

  const actorId = await getAdminActorId();
  await assertAdminMutationLimit(actorId, "create-banner");
  const schema = z.object({
    eyebrow: z.string().min(1),
    title: z.string().min(2),
    subtitle: z.string().min(2),
    ctaLabel: z.string().min(1),
    ctaHref: z.string().min(1),
    accent: z.string().min(4),
  });

  const values = schema.parse({
    eyebrow: formData.get("eyebrow"),
    title: formData.get("title"),
    subtitle: formData.get("subtitle"),
    ctaLabel: formData.get("ctaLabel"),
    ctaHref: formData.get("ctaHref"),
    accent: formData.get("accent"),
  });

  const planCodes = formData
    .getAll("planCodes")
    .map((value) => value.toString())
    .filter(Boolean) as MembershipPlanCode[];

  const created = await db.banner.create({
    data: {
      ...values,
      publishStatus: "PUBLISHED",
      audience: planCodes.length > 0 ? { planCodes } : undefined,
    },
  });

  await db.auditLog.create({
    data: {
      userId: actorId,
      action: "banner.create",
      targetType: "Banner",
      targetId: created.id,
      metadata: { planCodes },
    },
  });

  revalidatePath("/admin/content");
  revalidatePath("/app");

  await redirectWithFlash("バナーを追加しました。", "success", "/admin/content");
}

export async function createOfferingAction(formData: FormData) {
  if (!prisma) {
    await redirectWithFlash("データベース設定後に利用できます。", "error", "/admin/offerings");
  }
  const db = prisma!;

  const actorId = await getAdminActorId();
  await assertAdminMutationLimit(actorId, "create-offering");
  const schema = z.object({
    title: z.string().min(2),
    summary: z.string().min(2),
    description: z.string().min(2),
    offeringType: z.enum(["BOOKING", "EVENT"]),
    startsAt: z.string().min(1),
    endsAt: z.string().min(1),
    locationLabel: z.string().min(1),
    capacity: z.coerce.number().int().positive(),
    creditRequired: z.coerce.number().int().nonnegative(),
    consumptionMode: z.enum(["ON_CONFIRM", "ON_ATTEND"]),
    refundDeadline: z.string().min(1),
    priceLabel: z.string().min(1),
    host: z.string().min(1),
    externalJoinUrl: z.string().optional(),
  });

  const values = schema.parse({
    title: formData.get("title"),
    summary: formData.get("summary"),
    description: formData.get("description"),
    offeringType: formData.get("offeringType"),
    startsAt: formData.get("startsAt"),
    endsAt: formData.get("endsAt"),
    locationLabel: formData.get("locationLabel"),
    capacity: formData.get("capacity"),
    creditRequired: formData.get("creditRequired"),
    consumptionMode: formData.get("consumptionMode"),
    refundDeadline: formData.get("refundDeadline"),
    priceLabel: formData.get("priceLabel"),
    host: formData.get("host"),
    externalJoinUrl: formData.get("externalJoinUrl")?.toString() || undefined,
  });

  const planCodes = formData
    .getAll("planCodes")
    .map((value) => value.toString())
    .filter(Boolean) as MembershipPlanCode[];

  const created = await db.reservableOffering.create({
    data: {
      slug: `${slugify(values.title)}-${Date.now().toString().slice(-6)}`,
      title: values.title,
      summary: values.summary,
      description: values.description,
      offeringType: values.offeringType,
      startsAt: new Date(values.startsAt),
      endsAt: new Date(values.endsAt),
      locationLabel: values.locationLabel,
      capacity: values.capacity,
      creditRequired: values.creditRequired,
      consumptionMode: values.consumptionMode,
      refundDeadline: new Date(values.refundDeadline),
      priceLabel: values.priceLabel,
      host: values.host,
      externalJoinUrl: values.externalJoinUrl || null,
      audience: planCodes.length > 0 ? { planCodes } : undefined,
      waitlistEnabled: formData.get("waitlistEnabled") === "on",
      featured: formData.get("featured") === "on",
    },
  });

  await db.auditLog.create({
    data: {
      userId: actorId,
      action: "offering.create",
      targetType: "ReservableOffering",
      targetId: created.id,
      metadata: { planCodes },
    },
  });

  revalidatePath("/admin/offerings");
  revalidatePath("/app/bookings");
  revalidatePath("/app/events");
  revalidatePath("/app");

  await redirectWithFlash("募集枠を作成しました。", "success", "/admin/offerings");
}

export async function createMemberAction(formData: FormData) {
  if (!prisma) {
    await redirectWithFlash("データベース設定後に利用できます。", "error", "/admin/members");
  }
  const db = prisma!;

  const actorId = await getAdminActorId();
  await assertAdminMutationLimit(actorId, "create-member");
  const schema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    title: z.string().min(1),
    role: z.enum(["SUPER_ADMIN", "STAFF", "STUDENT"]),
    planCode: z.nativeEnum(MembershipPlanCode),
    status: z.enum(["ACTIVE", "INVITED", "SUSPENDED"]).default("INVITED"),
    segmentSlugs: z.string().optional(),
  });

  const values = schema.parse({
    name: formData.get("name"),
    email: formData.get("email"),
    title: formData.get("title"),
    role: formData.get("role"),
    planCode: formData.get("planCode"),
    status: formData.get("status") || "INVITED",
    segmentSlugs: formData.get("segmentSlugs")?.toString() || "",
  });

  const existing = await db.user.findUnique({ where: { email: values.email } });
  if (existing) {
    await redirectWithFlash("同じメールアドレスの会員がすでに存在します。", "error", "/admin/members");
  }

  const plan = await db.membershipPlan.findUniqueOrThrow({
    where: { code: values.planCode },
  });

  const requestedSegments = values.segmentSlugs
    ? values.segmentSlugs.split(",").map((segment) => slugify(segment.trim())).filter(Boolean)
    : [];
  const segmentSlugs = Array.from(
    new Set([`plan:${values.planCode.toLowerCase()}`, ...requestedSegments]),
  );

  const segments = await Promise.all(segmentSlugs.map((slug) => upsertSegmentBySlug(slug)));

  let invitationId: string | undefined;

  if (isClerkServerReady) {
    const clerk = await clerkClient();
    const invitation = await clerk.invitations.createInvitation({
      emailAddress: values.email,
      notify: true,
      ignoreExisting: true,
      redirectUrl: buildAbsoluteUrl("/post-login"),
      publicMetadata: {
        role: values.role,
        planCode: values.planCode,
      },
    });
    invitationId = invitation.id;
  }

  try {
    await db.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: values.name,
          email: values.email,
          title: values.title,
          role: values.role as UserRole,
          status: values.status,
          avatarLabel: values.name.slice(0, 2).toUpperCase(),
          planAssignments: {
            create: {
              startedAt: new Date(),
              isActive: true,
              planId: plan.id,
            },
          },
          wallet: {
            create: {
              currentBalance: plan.unlimitedCredits ? 0 : plan.monthlyCreditGrant,
            },
          },
          segments: {
            create: segments.map((segment) => ({
              segmentId: segment.id,
            })),
          },
        },
      });

      if (!plan.unlimitedCredits) {
        const wallet = await tx.creditWallet.findUniqueOrThrow({
          where: { userId: user.id },
        });
        const grant = buildMonthlyGrantEntry({
          userId: user.id,
          plan: await getMembershipPlanByCode(values.planCode),
          currentBalance: 0,
          now: new Date(),
        });
        await tx.creditLedger.create({
          data: {
            walletId: wallet.id,
            userId: user.id,
            type: "MONTHLY_GRANT",
            amount: grant.amount,
            note: "初回付与",
          },
        });
      }

      await tx.auditLog.create({
        data: {
          userId: actorId,
          action: "member.create",
          targetType: "User",
          targetId: user.id,
          metadata: {
            planCode: values.planCode,
            role: values.role,
            clerkInvitationId: invitationId ?? null,
          },
        },
      });

      return user;
    });

    revalidatePath("/admin/members");

    await redirectWithFlash(
      isClerkServerReady
        ? `会員を追加し、${values.email} に招待メールを送信しました。`
        : `会員を追加しました。Clerk 未設定のため招待メールは送っていません。`,
      "success",
      "/admin/members",
    );
  } catch (error) {
    if (invitationId && isClerkServerReady) {
      try {
        const clerk = await clerkClient();
        await clerk.invitations.revokeInvitation(invitationId);
      } catch (revokeError) {
        console.error("Failed to revoke Clerk invitation after DB failure.", revokeError);
      }
    }
    throw error;
  }
}

export async function updateMemberPlanAction(formData: FormData) {
  if (!prisma) {
    await redirectWithFlash("データベース設定後に利用できます。", "error", "/admin/members");
  }
  const db = prisma!;

  const actorId = await getAdminActorId();
  await assertAdminMutationLimit(actorId, "update-plan");
  const userId = z.string().parse(formData.get("userId"));
  const nextPlanCode = z.nativeEnum(MembershipPlanCode).parse(formData.get("planCode"));

  const [member, nextPlan] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      include: {
        wallet: true,
        planAssignments: {
          where: { isActive: true },
          include: { plan: true },
        },
      },
    }),
    db.membershipPlan.findUniqueOrThrow({ where: { code: nextPlanCode } }),
  ]);

  if (!member) {
    await redirectWithFlash("対象会員が見つかりません。", "error", "/admin/members");
  }
  const targetMember = member!;

  const actorPlan = targetMember.planAssignments[0]?.plan ?? null;
  if (actorPlan?.code === nextPlanCode) {
    await redirectWithFlash("同じプランが選択されています。", "error", "/admin/members");
  }
  const wallet = await ensureWallet(userId);
  const nextPlanShape = await getMembershipPlanByCode(nextPlanCode);
  const planChangeGrant = createPlanChangeGrant({
    userId,
    nextPlan: nextPlanShape,
    now: new Date(),
  });

  const currentBalance = targetMember.wallet?.currentBalance ?? wallet.currentBalance;
  const shouldResetFromUnlimited = actorPlan?.unlimitedCredits && !nextPlan.unlimitedCredits;
  const nextBalance = nextPlan.unlimitedCredits
    ? currentBalance
    : shouldResetFromUnlimited
      ? Math.min(nextPlan.monthlyCreditGrant, nextPlan.rolloverCap)
      : Math.min(currentBalance + (planChangeGrant?.amount ?? 0), nextPlan.rolloverCap);

  const planSegments = await db.segmentTag.findMany({
    where: { slug: { in: ["plan:hobby", "plan:biz", "plan:pro"] } },
  });
  const nextPlanSegment = await upsertSegmentBySlug(`plan:${nextPlanCode.toLowerCase()}`);

  await db.$transaction(async (tx) => {
    await tx.planAssignment.updateMany({
      where: { userId, isActive: true },
      data: {
        isActive: false,
        endedAt: new Date(),
      },
    });

    await tx.planAssignment.create({
      data: {
        userId,
        planId: nextPlan.id,
        startedAt: new Date(),
        isActive: true,
      },
    });

    await tx.userSegment.deleteMany({
      where: {
        userId,
        segmentId: {
          in: planSegments.map((segment) => segment.id),
        },
      },
    });

    await tx.userSegment.upsert({
      where: {
        userId_segmentId: {
          userId,
          segmentId: nextPlanSegment.id,
        },
      },
      create: {
        userId,
        segmentId: nextPlanSegment.id,
      },
      update: {},
    });

    await tx.creditWallet.update({
      where: { userId },
      data: {
        currentBalance: nextBalance,
      },
    });

    if (planChangeGrant && !nextPlan.unlimitedCredits) {
      await tx.creditLedger.create({
        data: {
          walletId: wallet.id,
          userId,
          type: "PLAN_CHANGE_GRANT",
          amount: shouldResetFromUnlimited ? nextPlan.monthlyCreditGrant : planChangeGrant.amount,
          note: `${nextPlan.name} への切替付与`,
        },
      });
    }

    await tx.auditLog.create({
      data: {
        userId: actorId,
        action: "member.plan.update",
        targetType: "User",
        targetId: userId,
        metadata: {
          previousPlan: actorPlan?.code ?? null,
          nextPlan: nextPlan.code,
        },
      },
    });
  });

  revalidatePath("/admin/members");
  revalidatePath("/admin/plans");
  revalidatePath("/app");
  revalidatePath("/app/bookings");

  await redirectWithFlash("プランを更新しました。", "success", "/admin/members");
}

export async function adjustMemberCreditsAction(formData: FormData) {
  if (!prisma) {
    await redirectWithFlash("データベース設定後に利用できます。", "error", "/admin/members");
  }
  const db = prisma!;

  const actorId = await getAdminActorId();
  await assertAdminMutationLimit(actorId, "adjust-credits");
  const schema = z.object({
    userId: z.string().min(1),
    mode: z.enum(["bonus", "adjustment"]),
    amount: z.coerce.number().int(),
    note: z.string().min(2),
  });

  const values = schema.parse({
    userId: formData.get("userId"),
    mode: formData.get("mode"),
    amount: formData.get("amount"),
    note: formData.get("note"),
  });

  if (values.mode === "bonus" && values.amount <= 0) {
    await redirectWithFlash("bonus grant は 1 以上で入力してください。", "error", "/admin/members");
  }

  const wallet = await ensureWallet(values.userId);
  const member = await db.user.findUniqueOrThrow({
    where: { id: values.userId },
    include: {
      planAssignments: {
        where: { isActive: true },
        include: { plan: true },
        take: 1,
      },
    },
  });

  const delta = values.mode === "bonus" ? Math.abs(values.amount) : values.amount;
  const nextBalance = Math.max((wallet.currentBalance ?? 0) + delta, 0);

  await db.$transaction(async (tx) => {
    await tx.creditWallet.update({
      where: { id: wallet.id },
      data: {
        currentBalance: nextBalance,
      },
    });

    const ledger = values.mode === "bonus"
      ? createBonusGrant({
          userId: values.userId,
          amount: Math.abs(values.amount),
          note: values.note,
          now: new Date(),
        })
      : createBalanceAdjustment({
          userId: values.userId,
          delta,
          note: values.note,
          now: new Date(),
        });

    await tx.creditLedger.create({
      data: {
        walletId: wallet.id,
        userId: values.userId,
        type: values.mode === "bonus" ? "BONUS_GRANT" : "BALANCE_ADJUSTMENT",
        amount: ledger.amount,
        note: ledger.note,
        adjustmentReason: values.mode === "adjustment" ? values.note : null,
      },
    });

    await tx.auditLog.create({
      data: {
        userId: actorId,
        action: "member.credits.adjust",
        targetType: "User",
        targetId: values.userId,
        metadata: {
          mode: values.mode,
          delta,
          plan: member.planAssignments[0]?.plan.code ?? null,
        },
      },
    });
  });

  revalidatePath("/admin/members");
  revalidatePath("/admin/plans");
  revalidatePath("/app/bookings");
  revalidatePath("/app");

  await redirectWithFlash("クレジット残高を更新しました。", "success", "/admin/members");
}

export async function runMonthlyCreditGrantAction() {
  if (!prisma) {
    await redirectWithFlash("データベース設定後に利用できます。", "error", "/admin/plans");
  }
  const actorId = await getAdminActorId();
  await assertAdminMutationLimit(actorId, "run-monthly-credit-grants");

  const result = await processMonthlyCreditGrants({
    actorId,
    source: "admin",
  });

  revalidatePath("/admin/plans");
  revalidatePath("/admin/members");
  revalidatePath("/app");
  revalidatePath("/app/bookings");

  await redirectWithFlash(
    `${result.granted}名に月次クレジットを付与しました。未対象 ${result.skipped} 名。`,
    "success",
    "/admin/plans",
  );
}

export async function markReservationStatusAction(formData: FormData) {
  if (!prisma) {
    await redirectWithFlash("データベース設定後に利用できます。", "error", "/admin/offerings");
  }
  const db = prisma!;
  const actorId = await getAdminActorId();
  await assertAdminMutationLimit(actorId, "mark-reservation-status");

  const values = z
    .object({
      reservationId: z.string().min(1),
      status: z.enum(["ATTENDED", "NO_SHOW"]),
    })
    .parse({
      reservationId: formData.get("reservationId"),
      status: formData.get("status"),
    });

  const reservation = await db.reservation.findUnique({
    where: { id: values.reservationId },
    include: {
      offering: true,
      user: {
        include: {
          wallet: true,
          planAssignments: {
            where: { isActive: true },
            include: { plan: true },
            take: 1,
          },
        },
      },
    },
  });

  if (!reservation) {
    await redirectWithFlash("対象予約が見つかりません。", "error", "/admin/offerings");
  }
  const targetReservation = reservation!;

  if (targetReservation.status !== "CONFIRMED") {
    await redirectWithFlash("未確定の予約のみ更新できます。", "error", "/admin/offerings");
  }

  const activePlan = targetReservation.user.planAssignments[0]?.plan;
  const wallet = targetReservation.user.wallet ?? (await ensureWallet(targetReservation.userId));
  const requiresConsumptionNow =
    !activePlan?.unlimitedCredits &&
    targetReservation.offering.consumptionMode === "ON_ATTEND" &&
    targetReservation.offering.creditRequired > 0;

  if (requiresConsumptionNow && wallet.currentBalance < targetReservation.offering.creditRequired) {
    await redirectWithFlash(
      "残高不足のため出席確定できません。先にクレジットを補正してください。",
      "error",
      "/admin/offerings",
    );
  }

  await db.$transaction(async (tx) => {
    await tx.reservation.update({
      where: { id: targetReservation.id },
      data: {
        status: values.status,
      },
    });

    if (requiresConsumptionNow) {
      await tx.creditWallet.update({
        where: { id: wallet.id },
        data: {
          currentBalance: {
            decrement: targetReservation.offering.creditRequired,
          },
        },
      });

      await tx.creditLedger.create({
        data: {
          walletId: wallet.id,
          userId: targetReservation.userId,
          type: "CONSUMED",
          amount: targetReservation.offering.creditRequired * -1,
          note:
            values.status === "ATTENDED"
              ? `${targetReservation.offering.title} を参加済みに更新`
              : `${targetReservation.offering.title} を欠席処理`,
          offeringId: targetReservation.offeringId,
          reservationId: targetReservation.id,
        },
      });
    }

    await tx.auditLog.create({
      data: {
        userId: actorId,
        action: "reservation.status.update",
        targetType: "Reservation",
        targetId: targetReservation.id,
        metadata: {
          status: values.status,
          offeringId: targetReservation.offeringId,
        },
      },
    });
  });

  revalidatePath("/admin/offerings");
  revalidatePath("/app");
  revalidatePath("/app/bookings");
  revalidatePath("/app/events");

  await redirectWithFlash(
    values.status === "ATTENDED" ? "参加済みに更新しました。" : "欠席として処理しました。",
    "success",
    "/admin/offerings",
  );
}

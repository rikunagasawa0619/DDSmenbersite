"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireUser } from "@/lib/auth";
import { parseOrRedirect } from "@/lib/action-form";
import { lockCreditWallet, isRetryableTransactionError } from "@/lib/credit-wallet";
import { canRefundCredit, createConsumptionEntry, createRefundEntry } from "@/lib/credits";
import {
  sendReservationCancelledEmail,
  sendReservationConfirmedEmail,
} from "@/lib/email";
import { redirectWithFlash } from "@/lib/flash";
import { prisma } from "@/lib/prisma";
import { RateLimitError, assertRateLimit } from "@/lib/rate-limit";

async function ensureDbUser(email: string, fallbackId: string) {
  if (!prisma) {
    return null;
  }

  return prisma.user.findFirst({
    where: {
      OR: [{ email }, { id: fallbackId }],
    },
    include: {
      wallet: true,
      segments: {
        include: {
          segment: true,
        },
      },
      planAssignments: {
        where: { isActive: true },
        include: { plan: true },
        take: 1,
      },
    },
  });
}

function isEligibleForAudience(
  audience: { planCodes?: string[]; segmentSlugs?: string[]; excludeSegmentSlugs?: string[] } | null,
  dbUser: NonNullable<Awaited<ReturnType<typeof ensureDbUser>>>,
  currentPlanCode: string,
) {
  if (!audience) {
    return true;
  }

  if (audience.planCodes?.length && !audience.planCodes.includes(currentPlanCode)) {
    return false;
  }

  const segmentSlugs = dbUser.segments.map((segment) => segment.segment.slug);

  if (audience.segmentSlugs?.length) {
    const hasAll = audience.segmentSlugs.every((segment) => segmentSlugs.includes(segment));
    if (!hasAll) {
      return false;
    }
  }

  if (audience.excludeSegmentSlugs?.length) {
    const blocked = audience.excludeSegmentSlugs.some((segment) => segmentSlugs.includes(segment));
    if (blocked) {
      return false;
    }
  }

  return true;
}

async function handleMemberInput<TSchema extends z.ZodType>(
  schema: TSchema,
  input: unknown,
  fallbackPath: string,
) {
  return parseOrRedirect(schema, input, fallbackPath);
}

async function handleMemberTransaction<T>(
  action: () => Promise<T>,
  fallbackPath: string,
) {
  try {
    return await action();
  } catch (error) {
    if (isRetryableTransactionError(error)) {
      await redirectWithFlash(
        "操作が重なったため完了できませんでした。もう一度お試しください。",
        "error",
        fallbackPath,
      );
    }
    throw error;
  }
}

export async function bookOfferingAction(formData: FormData) {
  const db = prisma!;
  if (!db) {
    await redirectWithFlash("データベース設定後に利用できます。", "error", "/app/bookings");
  }

  const user = await requireUser();
  const offeringId = await handleMemberInput(
    z.string().min(1, "募集枠が見つかりません。"),
    formData.get("offeringId"),
    "/app/bookings",
  );
  const dbUser = await ensureDbUser(user.email, user.id);

  if (!dbUser) {
    await redirectWithFlash("会員情報が見つかりません。", "error", "/app/bookings");
  }
  const targetUser = dbUser!;

  const currentPlan = targetUser.planAssignments[0]?.plan;
  if (!currentPlan) {
    await redirectWithFlash("現在のプラン情報を取得できません。", "error", "/app/bookings");
  }

  try {
    await assertRateLimit(
      { key: "member:book-offering", limit: 8, windowMs: 60_000 },
      targetUser.id,
    );
  } catch (error) {
    if (error instanceof RateLimitError) {
      await redirectWithFlash(error.message, "error", "/app/bookings");
    }
    throw error;
  }

  const bookingOutcome = await handleMemberTransaction(
    () =>
      db.$transaction(
        async (tx) => {
      const [offering] = await tx.$queryRaw<
        Array<{
          id: string;
          title: string;
          starts_at: Date;
          location_label: string | null;
          capacity: number;
          waitlist_enabled: boolean;
          credit_required: number;
          consumption_mode: "ON_CONFIRM" | "ON_ATTEND";
          external_join_url: string | null;
          audience: unknown;
        }>
      >(
        Prisma.sql`
          SELECT
            id,
            title,
            "startsAt" as starts_at,
            "locationLabel" as location_label,
            capacity,
            "waitlistEnabled" as waitlist_enabled,
            "creditRequired" as credit_required,
            "consumptionMode" as consumption_mode,
            "externalJoinUrl" as external_join_url,
            audience
          FROM "ReservableOffering"
          WHERE id = ${offeringId}
          FOR UPDATE
        `,
      );

      if (!offering) {
        await redirectWithFlash("対象の募集枠が見つかりません。", "error", "/app/bookings");
      }

      const audience = offering.audience as
        | { planCodes?: string[]; segmentSlugs?: string[]; excludeSegmentSlugs?: string[] }
        | null;

      if (!isEligibleForAudience(audience, targetUser, currentPlan.code)) {
        await redirectWithFlash("現在のプランではこの募集枠に参加できません。", "error", "/app/bookings");
      }

      const existingReservation = await tx.reservation.findFirst({
        where: {
          offeringId,
          userId: targetUser.id,
          status: { in: ["CONFIRMED", "ATTENDED"] },
        },
      });
      const existingWaitlist = await tx.waitlistEntry.findFirst({
        where: { offeringId, userId: targetUser.id },
      });

      if (existingReservation || existingWaitlist) {
        await redirectWithFlash("すでに申込済みです。", "error", "/app/bookings");
      }

      const confirmedCount = await tx.reservation.count({
        where: { offeringId, status: { in: ["CONFIRMED", "ATTENDED"] } },
      });

      if (confirmedCount >= offering.capacity) {
        if (!offering.waitlist_enabled) {
          await redirectWithFlash("満席のため申込できません。", "error", "/app/bookings");
        }

        await tx.waitlistEntry.create({
          data: { offeringId, userId: targetUser.id },
        });

        return {
          type: "waitlist",
          title: offering.title,
          startsAt: offering.starts_at.toISOString(),
          locationLabel: offering.location_label ?? "Online",
          joinUrl: null,
        };
      }

      const requiresCreditOnConfirm =
        !currentPlan.unlimitedCredits &&
        offering.credit_required > 0 &&
        offering.consumption_mode === "ON_CONFIRM";

      const wallet = requiresCreditOnConfirm
        ? await lockCreditWallet(tx, targetUser.id)
        : null;

      if (requiresCreditOnConfirm && (wallet?.currentBalance ?? 0) < offering.credit_required) {
        await redirectWithFlash("クレジット残高が不足しています。", "error", "/app/bookings");
      }

      const reservation = await tx.reservation.create({
        data: { offeringId, userId: targetUser.id, status: "CONFIRMED" },
      });

      if (requiresCreditOnConfirm && wallet) {
        const entry = createConsumptionEntry({
          userId: targetUser.id,
          amount: offering.credit_required,
          note: `${offering.title} を予約`,
          offeringId,
          now: new Date(),
        });

        await tx.creditWallet.update({
          where: { id: wallet.id },
          data: { currentBalance: { decrement: offering.credit_required } },
        });

        await tx.creditLedger.create({
          data: {
            walletId: wallet.id,
            userId: targetUser.id,
            type: "CONSUMED",
            amount: entry.amount,
            note: entry.note,
            offeringId,
            reservationId: reservation.id,
          },
        });
      }

      return {
        type: "confirmed",
        title: offering.title,
        startsAt: offering.starts_at.toISOString(),
        locationLabel: offering.location_label ?? "Online",
        joinUrl: offering.external_join_url,
      };
        },
        { isolationLevel: "Serializable" },
      ),
    "/app/bookings",
  );

  try {
    await sendReservationConfirmedEmail({
      to: targetUser.email,
      name: targetUser.name,
      title: bookingOutcome.title,
      startsAt: bookingOutcome.startsAt,
      locationLabel: bookingOutcome.locationLabel,
      joinUrl: bookingOutcome.joinUrl,
      waitlist: bookingOutcome.type === "waitlist",
    });
  } catch (error) {
    console.error("Failed to send booking email.", error);
  }

  revalidatePath("/app");
  revalidatePath("/app/bookings");
  revalidatePath("/app/events");

  await redirectWithFlash(
    bookingOutcome.type === "waitlist" ? "待機申込を受け付けました。" : "予約が確定しました。",
    "success",
    "/app/bookings",
  );
}

export async function cancelReservationAction(formData: FormData) {
  const db = prisma!;
  if (!db) {
    await redirectWithFlash("データベース設定後に利用できます。", "error", "/app/bookings");
  }

  const user = await requireUser();
  const reservationId = await handleMemberInput(
    z.string().min(1, "予約情報が見つかりません。"),
    formData.get("reservationId"),
    "/app/bookings",
  );
  const dbUser = await ensureDbUser(user.email, user.id);

  if (!dbUser) {
    await redirectWithFlash("会員情報が見つかりません。", "error", "/app/bookings");
  }
  const targetUser = dbUser!;

  try {
    await assertRateLimit(
      { key: "member:cancel-reservation", limit: 8, windowMs: 60_000 },
      targetUser.id,
    );
  } catch (error) {
    if (error instanceof RateLimitError) {
      await redirectWithFlash(error.message, "error", "/app/bookings");
    }
    throw error;
  }

  const reservation = await db.reservation.findUnique({
    where: { id: reservationId },
    include: { offering: true },
  });

  if (!reservation || reservation.userId !== targetUser.id) {
    await redirectWithFlash("予約情報が見つかりません。", "error", "/app/bookings");
  }
  const activeReservation = reservation!;

  if (activeReservation.status !== "CONFIRMED") {
    await redirectWithFlash("この予約はキャンセルできません。", "error", "/app/bookings");
  }

  const wallet = targetUser.wallet;
  const currentPlan = targetUser.planAssignments[0]?.plan;
  const refundable =
    activeReservation.offering.refundDeadline &&
    canRefundCredit(activeReservation.offering.refundDeadline.toISOString(), new Date());

  let promotedUserEmail: string | undefined;
  let promotedUserName: string | undefined;

  await handleMemberTransaction(
    () =>
      db.$transaction(
        async (tx) => {
      const cancelled = await tx.reservation.updateMany({
        where: {
          id: activeReservation.id,
          userId: targetUser.id,
          status: "CONFIRMED",
        },
        data: {
          status: "CANCELLED",
        },
      });

      if (cancelled.count === 0) {
        await redirectWithFlash("この予約はすでにキャンセル済みです。", "error", "/app/bookings");
      }

      if (
        wallet &&
        currentPlan &&
        !currentPlan.unlimitedCredits &&
        activeReservation.offering.consumptionMode === "ON_CONFIRM" &&
        refundable
      ) {
        const lockedWallet = await lockCreditWallet(tx, targetUser.id);
        const refund = createRefundEntry({
          userId: targetUser.id,
          amount: activeReservation.offering.creditRequired,
          note: `${activeReservation.offering.title} をキャンセル`,
          offeringId: activeReservation.offeringId,
          now: new Date(),
        });

        await tx.creditWallet.update({
          where: { id: lockedWallet.id },
          data: {
            currentBalance: {
              increment: activeReservation.offering.creditRequired,
            },
          },
        });

        await tx.creditLedger.create({
          data: {
            walletId: lockedWallet.id,
            userId: targetUser.id,
            type: "REFUNDED",
            amount: refund.amount,
            note: refund.note,
            offeringId: activeReservation.offeringId,
            reservationId: activeReservation.id,
          },
        });
      }

      const nextWaitlist = await tx.waitlistEntry.findFirst({
        where: { offeringId: activeReservation.offeringId },
        orderBy: { createdAt: "asc" },
        include: {
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

      if (!nextWaitlist) {
        return;
      }

      const nextPlan = nextWaitlist.user.planAssignments[0]?.plan;
      const requiresCreditOnPromotion =
        !nextPlan?.unlimitedCredits &&
        activeReservation.offering.creditRequired > 0 &&
        activeReservation.offering.consumptionMode === "ON_CONFIRM";
      const nextWallet = requiresCreditOnPromotion
        ? await lockCreditWallet(tx, nextWaitlist.userId)
        : nextWaitlist.user.wallet;
      const canPromote =
        nextPlan &&
        (!requiresCreditOnPromotion ||
          (nextWallet?.currentBalance ?? 0) >= activeReservation.offering.creditRequired);

      if (!canPromote) {
        return;
      }

      const promoted = await tx.reservation.create({
        data: {
          offeringId: activeReservation.offeringId,
          userId: nextWaitlist.userId,
          status: "CONFIRMED",
        },
      });

      await tx.waitlistEntry.delete({
        where: { id: nextWaitlist.id },
      });

      promotedUserEmail = nextWaitlist.user.email;
      promotedUserName = nextWaitlist.user.name;

      if (requiresCreditOnPromotion && nextPlan && nextWallet) {
        const entry = createConsumptionEntry({
          userId: nextWaitlist.userId,
          amount: activeReservation.offering.creditRequired,
          note: `${activeReservation.offering.title} を待機繰上げで確定`,
          offeringId: activeReservation.offeringId,
          now: new Date(),
        });

        await tx.creditWallet.update({
          where: { id: nextWallet.id },
          data: {
            currentBalance: {
              decrement: activeReservation.offering.creditRequired,
            },
          },
        });

        await tx.creditLedger.create({
          data: {
            walletId: nextWallet.id,
            userId: nextWaitlist.userId,
            type: "CONSUMED",
            amount: entry.amount,
            note: entry.note,
            offeringId: activeReservation.offeringId,
            reservationId: promoted.id,
          },
        });
      }
        },
        { isolationLevel: "Serializable" },
      ),
    "/app/bookings",
  );

  try {
    await sendReservationCancelledEmail({
      to: targetUser.email,
      name: targetUser.name,
      title: activeReservation.offering.title,
      refunded: Boolean(refundable),
    });
  } catch (error) {
    console.error("Failed to send cancellation email.", error);
  }

  if (promotedUserEmail && promotedUserName) {
    try {
      await sendReservationConfirmedEmail({
        to: promotedUserEmail,
        name: promotedUserName,
        title: activeReservation.offering.title,
        startsAt: activeReservation.offering.startsAt.toISOString(),
        locationLabel: activeReservation.offering.locationLabel ?? "Online",
        joinUrl: activeReservation.offering.externalJoinUrl,
      });
    } catch (error) {
      console.error("Failed to send promotion email.", error);
    }
  }

  revalidatePath("/app");
  revalidatePath("/app/bookings");
  revalidatePath("/app/events");

  await redirectWithFlash("予約をキャンセルしました。", "success", "/app/bookings");
}

export async function markLessonCompleteAction(formData: FormData) {
  const db = prisma!;
  if (!db) {
    await redirectWithFlash("データベース設定後に利用できます。", "error", "/app/courses");
  }

  const user = await requireUser();
  const lessonId = await handleMemberInput(
    z.string().min(1, "講義情報が見つかりません。"),
    formData.get("lessonId"),
    "/app/courses",
  );
  const dbUser = await ensureDbUser(user.email, user.id);

  if (!dbUser) {
    await redirectWithFlash("会員情報が見つかりません。", "error", "/app/courses");
  }
  const targetUser = dbUser!;

  try {
    await assertRateLimit(
      { key: "member:complete-lesson", limit: 20, windowMs: 60_000 },
      targetUser.id,
    );
  } catch (error) {
    if (error instanceof RateLimitError) {
      await redirectWithFlash(error.message, "error", "/app/courses");
    }
    throw error;
  }

  await db.lessonProgress.upsert({
    where: {
      userId_lessonId: {
        userId: targetUser.id,
        lessonId,
      },
    },
    create: {
      userId: targetUser.id,
      lessonId,
      completedAt: new Date(),
    },
    update: {
      completedAt: new Date(),
    },
  });

  revalidatePath("/app");
  revalidatePath("/app/courses");

  await redirectWithFlash("学習進捗を保存しました。", "success", "/app/courses");
}

export async function updateProfileAction(formData: FormData) {
  const db = prisma!;
  if (!db) {
    await redirectWithFlash("データベース設定後に利用できます。", "error", "/app/profile");
  }

  const user = await requireUser();
  const dbUser = await ensureDbUser(user.email, user.id);

  if (!dbUser) {
    await redirectWithFlash("会員情報が見つかりません。", "error", "/app/profile");
  }
  const targetUser = dbUser!;

  const values = z
    .object({
      name: z.string().trim().min(2),
      title: z.string().trim().min(1),
      company: z.string().trim().max(120).optional(),
    })
    ;
  const parsedValues = await handleMemberInput(
    values,
    {
      name: formData.get("name"),
      title: formData.get("title"),
      company: formData.get("company")?.toString() || undefined,
    },
    "/app/profile",
  );

  try {
    await assertRateLimit(
      { key: "member:update-profile", limit: 6, windowMs: 60_000 },
      targetUser.id,
    );
  } catch (error) {
    if (error instanceof RateLimitError) {
      await redirectWithFlash(error.message, "error", "/app/profile");
    }
    throw error;
  }

  await db.user.update({
    where: { id: targetUser.id },
    data: {
      name: parsedValues.name,
      title: parsedValues.title,
      company: parsedValues.company || null,
      avatarLabel: parsedValues.name.slice(0, 2).toUpperCase(),
    },
  });

  revalidatePath("/app");
  revalidatePath("/app/profile");

  await redirectWithFlash("プロフィールを更新しました。", "success", "/app/profile");
}

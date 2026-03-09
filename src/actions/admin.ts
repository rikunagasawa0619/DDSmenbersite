"use server";

import { clerkClient } from "@clerk/nextjs/server";
import { Prisma, MemberStatus, MembershipPlanCode, PublishStatus, UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { deliverCampaign } from "@/lib/campaigns";
import { parseOrRedirect } from "@/lib/action-form";
import { bannerAccentValues, normalizeBannerAccent } from "@/lib/banner-accent";
import { lockCreditWallet, isRetryableTransactionError } from "@/lib/credit-wallet";
import { buildMonthlyGrantEntry, createBalanceAdjustment, createBonusGrant, createPlanChangeGrant } from "@/lib/credits";
import { processMonthlyCreditGrants } from "@/lib/credit-batch";
import { requireAdmin } from "@/lib/auth";
import { buildAbsoluteUrl } from "@/lib/env";
import { redirectWithFlash } from "@/lib/flash";
import { isClerkServerReady } from "@/lib/config";
import { prisma } from "@/lib/prisma";
import { RateLimitError, assertRateLimit } from "@/lib/rate-limit";
import { getMembershipPlanByCode } from "@/lib/repository";
import { assertImageFile, isStorageConfigured, uploadImageFile } from "@/lib/storage";
import type { LessonBlock, MembershipPlanCode as MembershipPlanCodeType } from "@/lib/types";

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeOptionalText(value: FormDataEntryValue | null) {
  const text = value?.toString().trim();
  return text ? text : undefined;
}

function expandMinimumPlanCode(
  minimumPlanCode?: MembershipPlanCodeType | null,
): MembershipPlanCode[] | undefined {
  if (!minimumPlanCode) {
    return undefined;
  }

  if (minimumPlanCode === "HOBBY") {
    return ["HOBBY", "BIZ", "PRO"];
  }

  if (minimumPlanCode === "BIZ") {
    return ["BIZ", "PRO"];
  }

  return ["PRO"];
}

function parseAudienceFromForm(
  formData: FormData,
): { planCodes?: MembershipPlanCode[] } | undefined {
  const minimumPlanCode = normalizeOptionalText(
    formData.get("minimumPlanCode"),
  ) as MembershipPlanCodeType | undefined;
  const planCodes = expandMinimumPlanCode(minimumPlanCode);
  return planCodes ? { planCodes } : undefined;
}

function buildVersionMetadata(
  snapshot: Record<string, unknown>,
  extra: Record<string, unknown> = {},
) {
  return JSON.parse(
    JSON.stringify({
      version: 1,
      snapshot,
      ...extra,
    }),
  ) as Prisma.InputJsonValue;
}

function buildLessonBlocksFromForm(values: {
  title: string;
  summary: string;
  lessonType: "VIDEO" | "ARTICLE" | "PODCAST";
  mediaUrl?: string;
  duration?: string;
  body?: string;
  checklist?: string;
  ctaLabel?: string;
  ctaHref?: string;
  ctaBody?: string;
}) {
  const blocks: LessonBlock[] = [
    {
      id: `hero-${Date.now()}`,
      type: "hero",
      eyebrow:
        values.lessonType === "VIDEO"
          ? "動画講義"
          : values.lessonType === "PODCAST"
            ? "ポッドキャスト"
            : "記事講義",
      title: values.title,
      body: values.summary,
    },
  ];

  if (values.mediaUrl) {
    blocks.push({
      id: `media-${Date.now() + 1}`,
      type: values.lessonType === "PODCAST" ? "embed_audio" : "embed_video",
      title: values.title,
      url: values.mediaUrl,
      duration: values.duration || "約10分",
    });
  }

  if (values.body) {
    blocks.push({
      id: `body-${Date.now() + 2}`,
      type: "rich_text",
      title: "講義内容",
      body: values.body,
    });
  }

  if (values.checklist) {
    const items = values.checklist
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);
    if (items.length > 0) {
      blocks.push({
        id: `checklist-${Date.now() + 3}`,
        type: "checklist",
        title: "確認ポイント",
        items,
      });
    }
  }

  if (values.ctaLabel && values.ctaHref) {
    blocks.push({
      id: `cta-${Date.now() + 4}`,
      type: "cta",
      title: "次のアクション",
      body: values.ctaBody || "講義を終えたら次のアクションへ進んでください。",
      label: values.ctaLabel,
      href: values.ctaHref,
    });
  }

  return blocks;
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

async function handleAdminInput<TSchema extends z.ZodType>(
  schema: TSchema,
  input: unknown,
  fallbackPath: string,
) {
  return parseOrRedirect(schema, input, fallbackPath);
}

async function handleAdminTransaction<T>(
  action: () => Promise<T>,
  fallbackPath: string,
) {
  try {
    return await action();
  } catch (error) {
    if (isRetryableTransactionError(error)) {
      await redirectWithFlash(
        "別の操作と競合したため完了できませんでした。もう一度お試しください。",
        "error",
        fallbackPath,
      );
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

async function persistUploadedImage(params: {
  file: File | null;
  folder: string;
  alt: string;
  redirectPath: string;
}) {
  if (!params.file || params.file.size === 0) {
    return undefined;
  }

  if (!prisma) {
    throw new Error("Database is not configured.");
  }

  if (!isStorageConfigured()) {
    await redirectWithFlash(
      "画像アップロードを使うには R2 の設定が必要です。",
      "error",
      params.redirectPath,
    );
  }

  let uploaded: Awaited<ReturnType<typeof uploadImageFile>> | undefined;
  try {
    assertImageFile(params.file);
    uploaded = await uploadImageFile({
      file: params.file,
      folder: params.folder,
      alt: params.alt,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "画像アップロードに失敗しました。";
    await redirectWithFlash(message, "error", params.redirectPath);
  }

  if (!uploaded) {
    return undefined;
  }

  const asset = await prisma.asset.create({
    data: {
      id: uploaded.id,
      storageKey: uploaded.storageKey,
      fileName: uploaded.fileName,
      fileType: "IMAGE",
      mimeType: uploaded.mimeType,
      sizeBytes: uploaded.sizeBytes,
      url: uploaded.url,
      alt: uploaded.alt,
    },
  });

  return asset.url;
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

  const values = await handleAdminInput(schema, {
    brandName: formData.get("brandName"),
    heroHeadline: formData.get("heroHeadline"),
    primaryColor: formData.get("primaryColor"),
    accentColor: formData.get("accentColor"),
    surfaceColor: formData.get("surfaceColor"),
    logoWordmark: formData.get("logoWordmark"),
    supportEmail: formData.get("supportEmail"),
    termsNotice: formData.get("termsNotice"),
  }, "/admin/theme");

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
    publishStatus: z.nativeEnum(PublishStatus).optional(),
  });

  const values = await handleAdminInput(schema, {
    title: formData.get("title"),
    summary: formData.get("summary"),
    body: formData.get("body"),
    publishAt: formData.get("publishAt")?.toString() || undefined,
    publishStatus: formData.get("publishStatus")?.toString() || "PUBLISHED",
  }, "/admin/content");
  const audience = parseAudienceFromForm(formData);

  const created = await db.announcement.create({
    data: {
      title: values.title,
      summary: values.summary,
      body: values.body,
      publishStatus: values.publishStatus ?? "PUBLISHED",
      publishAt: values.publishAt ? new Date(values.publishAt) : new Date(),
      audience,
    },
  });

  await db.auditLog.create({
    data: {
      userId: actorId,
      action: "announcement.create",
      targetType: "Announcement",
      targetId: created.id,
      metadata: buildVersionMetadata(
        {
          title: created.title,
          summary: created.summary,
          publishStatus: created.publishStatus,
          publishAt: created.publishAt?.toISOString() ?? null,
        },
        { audience: audience ?? {} },
      ),
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
    imageUrl: z.string().optional(),
    ctaLabel: z.string().min(1),
    ctaHref: z.string().min(1),
    accent: z.enum(bannerAccentValues),
    publishStatus: z.nativeEnum(PublishStatus).optional(),
  });

  const values = await handleAdminInput(schema, {
    eyebrow: formData.get("eyebrow"),
    title: formData.get("title"),
    subtitle: formData.get("subtitle"),
    imageUrl: normalizeOptionalText(formData.get("imageUrl")),
    ctaLabel: formData.get("ctaLabel"),
    ctaHref: formData.get("ctaHref"),
    accent: formData.get("accent"),
    publishStatus: formData.get("publishStatus")?.toString() || "PUBLISHED",
  }, "/admin/content");
  const audience = parseAudienceFromForm(formData);
  const uploadedImageUrl = await persistUploadedImage({
    file: formData.get("imageFile") instanceof File ? (formData.get("imageFile") as File) : null,
    folder: "banners",
    alt: values.title,
    redirectPath: "/admin/content",
  });

  const created = await db.banner.create({
    data: {
      eyebrow: values.eyebrow,
      title: values.title,
      subtitle: values.subtitle,
      imageUrl: uploadedImageUrl ?? values.imageUrl,
      ctaLabel: values.ctaLabel,
      ctaHref: values.ctaHref,
      accent: normalizeBannerAccent(values.accent),
      publishStatus: values.publishStatus ?? "PUBLISHED",
      audience,
    },
  });

  await db.auditLog.create({
    data: {
      userId: actorId,
      action: "banner.create",
      targetType: "Banner",
      targetId: created.id,
      metadata: buildVersionMetadata(
        {
          eyebrow: created.eyebrow,
          title: created.title,
          accent: created.accent,
          publishStatus: created.publishStatus,
        },
        { audience: audience ?? {} },
      ),
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
    thumbnailUrl: z.string().optional(),
    offeringType: z.enum(["BOOKING", "EVENT"]),
    startsAt: z.string().min(1),
    endsAt: z.string().optional(),
    locationLabel: z.string().min(1),
    capacity: z.coerce.number().int().positive(),
    creditRequired: z.coerce.number().int().nonnegative(),
    consumptionMode: z.enum(["ON_CONFIRM", "ON_ATTEND"]),
    refundDeadline: z.string().optional(),
    priceLabel: z.string().min(1),
    host: z.string().min(1),
    externalJoinUrl: z.string().optional(),
  });

  const values = await handleAdminInput(schema, {
    title: formData.get("title"),
    summary: formData.get("summary"),
    description: formData.get("description"),
    thumbnailUrl: normalizeOptionalText(formData.get("thumbnailUrl")),
    offeringType: formData.get("offeringType"),
    startsAt: formData.get("startsAt"),
    endsAt: formData.get("endsAt")?.toString() || undefined,
    locationLabel: formData.get("locationLabel"),
    capacity: formData.get("capacity"),
    creditRequired: formData.get("creditRequired"),
    consumptionMode: formData.get("consumptionMode"),
    refundDeadline: formData.get("refundDeadline")?.toString() || undefined,
    priceLabel: formData.get("priceLabel"),
    host: formData.get("host"),
    externalJoinUrl: formData.get("externalJoinUrl")?.toString() || undefined,
  }, "/admin/offerings");
  const audience = parseAudienceFromForm(formData);
  const uploadedThumbnailUrl = await persistUploadedImage({
    file:
      formData.get("thumbnailFile") instanceof File
        ? (formData.get("thumbnailFile") as File)
        : null,
    folder: "offerings",
    alt: values.title,
    redirectPath: "/admin/offerings",
  });
  const startsAt = new Date(values.startsAt);
  const endsAt = values.endsAt ? new Date(values.endsAt) : new Date(startsAt.getTime() + 60 * 60 * 1000);
  const refundDeadline = values.refundDeadline ? new Date(values.refundDeadline) : startsAt;

  const created = await db.reservableOffering.create({
    data: {
      slug: `${slugify(values.title)}-${Date.now().toString().slice(-6)}`,
      title: values.title,
      summary: values.summary,
      description: values.description,
      thumbnailUrl: uploadedThumbnailUrl ?? values.thumbnailUrl ?? null,
      offeringType: values.offeringType,
      startsAt,
      endsAt,
      locationLabel: values.locationLabel,
      capacity: values.capacity,
      creditRequired: values.creditRequired,
      consumptionMode: values.consumptionMode,
      refundDeadline,
      priceLabel: values.priceLabel,
      host: values.host,
      externalJoinUrl: values.externalJoinUrl || null,
      audience,
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
      metadata: audience ?? {},
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
    company: z.string().optional(),
    role: z.enum(["SUPER_ADMIN", "STAFF", "STUDENT"]),
    planCode: z.nativeEnum(MembershipPlanCode),
    status: z.enum(["ACTIVE", "INVITED", "PAUSED", "WITHDRAWN", "SUSPENDED"]).default("INVITED"),
    creditGrantBaseDate: z.string().optional(),
    segmentSlugs: z.string().optional(),
  });

  const values = await handleAdminInput(schema, {
    name: formData.get("name"),
    email: formData.get("email"),
    title: formData.get("title"),
    company: formData.get("company")?.toString() || undefined,
    role: formData.get("role"),
    planCode: formData.get("planCode"),
    status: formData.get("status") || "INVITED",
    creditGrantBaseDate: formData.get("creditGrantBaseDate")?.toString() || undefined,
    segmentSlugs: formData.get("segmentSlugs")?.toString() || "",
  }, "/admin/members");

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
  const creditGrantDay =
    values.creditGrantBaseDate && !Number.isNaN(new Date(values.creditGrantBaseDate).getTime())
      ? new Date(values.creditGrantBaseDate).getDate()
      : null;

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
          company: values.company || null,
          role: values.role as UserRole,
          status: values.status as MemberStatus,
          avatarLabel: values.name.slice(0, 2).toUpperCase(),
          creditGrantDay,
          planAssignments: {
            create: {
              startedAt: new Date(),
              isActive: true,
              planId: plan.id,
            },
          },
          wallet: {
            create: {
              currentBalance:
                !plan.unlimitedCredits && ["ACTIVE", "INVITED"].includes(values.status)
                  ? plan.monthlyCreditGrant
                  : 0,
            },
          },
          segments: {
            create: segments.map((segment) => ({
              segmentId: segment.id,
            })),
          },
        },
      });

      if (!plan.unlimitedCredits && ["ACTIVE", "INVITED"].includes(values.status)) {
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

export async function updateMemberSettingsAction(formData: FormData) {
  if (!prisma) {
    await redirectWithFlash("データベース設定後に利用できます。", "error", "/admin/members");
  }
  const db = prisma!;

  const actorId = await getAdminActorId();
  await assertAdminMutationLimit(actorId, "update-member-settings");

  const values = z
    .object({
      userId: z.string().min(1),
      name: z.string().min(2),
      title: z.string().min(1),
      company: z.string().optional(),
      role: z.enum(["SUPER_ADMIN", "STAFF", "STUDENT"]),
      status: z.enum(["ACTIVE", "INVITED", "PAUSED", "WITHDRAWN", "SUSPENDED"]),
      creditGrantBaseDate: z.string().optional(),
    });
  const parsedValues = await handleAdminInput(values, {
      userId: formData.get("userId"),
      name: formData.get("name"),
      title: formData.get("title"),
      company: formData.get("company")?.toString() || undefined,
      role: formData.get("role"),
      status: formData.get("status"),
      creditGrantBaseDate: formData.get("creditGrantBaseDate")?.toString() || undefined,
    }, "/admin/members");

  const creditGrantDay =
    parsedValues.creditGrantBaseDate && !Number.isNaN(new Date(parsedValues.creditGrantBaseDate).getTime())
      ? new Date(parsedValues.creditGrantBaseDate).getDate()
      : null;

  const updated = await db.user.update({
    where: { id: parsedValues.userId },
    data: {
      name: parsedValues.name,
      title: parsedValues.title,
      company: parsedValues.company || null,
      role: parsedValues.role as UserRole,
      status: parsedValues.status as MemberStatus,
      creditGrantDay,
      avatarLabel: parsedValues.name.slice(0, 2).toUpperCase(),
    },
  });

  await db.auditLog.create({
    data: {
        userId: actorId,
        action: "member.settings.update",
        targetType: "User",
        targetId: updated.id,
        metadata: {
          role: parsedValues.role,
          status: parsedValues.status,
          creditGrantDay,
        },
      },
  });

  revalidatePath("/admin/members");
  revalidatePath("/admin/plans");
  revalidatePath("/app");

  await redirectWithFlash("会員設定を更新しました。", "success", "/admin/members");
}

export async function bulkUpdateMemberStatusAction(formData: FormData) {
  if (!prisma) {
    await redirectWithFlash("データベース設定後に利用できます。", "error", "/admin/members");
  }
  const db = prisma!;

  const actorId = await getAdminActorId();
  await assertAdminMutationLimit(actorId, "bulk-update-member-status");

  const schema = z.object({
    memberIds: z.array(z.string().min(1)).min(1, "会員を1件以上選択してください。"),
    status: z.enum(["ACTIVE", "INVITED", "PAUSED", "WITHDRAWN", "SUSPENDED"]),
  });

  const values = await handleAdminInput(
    schema,
    {
      memberIds: formData.getAll("memberIds"),
      status: formData.get("status"),
    },
    "/admin/members",
  );

  const updated = await db.user.updateMany({
    where: {
      id: { in: values.memberIds },
    },
    data: {
      status: values.status as MemberStatus,
    },
  });

  await db.auditLog.create({
    data: {
      userId: actorId,
      action: "member.status.bulk-update",
      targetType: "UserCollection",
      targetId: values.memberIds.join(","),
      metadata: {
        count: updated.count,
        status: values.status,
      },
    },
  });

  revalidatePath("/admin/members");
  revalidatePath("/admin/plans");
  revalidatePath("/app");

  await redirectWithFlash(`${updated.count}名のステータスを更新しました。`, "success", "/admin/members");
}

export async function savePlanSettingsAction(formData: FormData) {
  if (!prisma) {
    await redirectWithFlash("データベース設定後に利用できます。", "error", "/admin/plans");
  }
  const db = prisma!;

  const actorId = await getAdminActorId();
  await assertAdminMutationLimit(actorId, "save-plan-settings");

  const values = z
    .object({
      planCode: z.nativeEnum(MembershipPlanCode),
      name: z.string().min(2),
      heroLabel: z.string().min(2),
      description: z.string().min(5),
      monthlyCreditGrant: z.coerce.number().int().nonnegative(),
      rolloverCap: z.coerce.number().int().nonnegative(),
      cycleBasis: z.enum(["CALENDAR_MONTH", "CONTRACT_DATE"]),
    });
  const parsedValues = await handleAdminInput(values, {
      planCode: formData.get("planCode"),
      name: formData.get("name"),
      heroLabel: formData.get("heroLabel"),
      description: formData.get("description"),
      monthlyCreditGrant: formData.get("monthlyCreditGrant"),
      rolloverCap: formData.get("rolloverCap"),
      cycleBasis: formData.get("cycleBasis"),
    }, "/admin/plans");

  const updated = await db.membershipPlan.update({
    where: { code: parsedValues.planCode },
    data: {
      name: parsedValues.name,
      heroLabel: parsedValues.heroLabel,
      description: parsedValues.description,
      monthlyCreditGrant: parsedValues.monthlyCreditGrant,
      rolloverCap: parsedValues.rolloverCap,
      cycleBasis: parsedValues.cycleBasis,
    },
  });

  await db.auditLog.create({
    data: {
      userId: actorId,
      action: "plan.update",
      targetType: "MembershipPlan",
      targetId: updated.id,
      metadata: {
        code: updated.code,
        monthlyCreditGrant: updated.monthlyCreditGrant,
        rolloverCap: updated.rolloverCap,
        cycleBasis: updated.cycleBasis,
      },
    },
  });

  revalidatePath("/admin/plans");
  revalidatePath("/admin/members");
  revalidatePath("/app");

  await redirectWithFlash("プラン設定を更新しました。", "success", "/admin/plans");
}

export async function createDealAction(formData: FormData) {
  if (!prisma) {
    await redirectWithFlash("データベース設定後に利用できます。", "error", "/admin/content");
  }
  const db = prisma!;

  const actorId = await getAdminActorId();
  await assertAdminMutationLimit(actorId, "create-deal");

  const values = z
    .object({
      title: z.string().min(2),
      summary: z.string().min(2),
      body: z.string().min(2),
      badge: z.string().optional(),
      offer: z.string().optional(),
      ctaLabel: z.string().optional(),
      ctaHref: z.string().optional(),
      publishStatus: z.nativeEnum(PublishStatus).optional(),
    });
  const parsedValues = await handleAdminInput(values, {
      title: formData.get("title"),
      summary: formData.get("summary"),
      body: formData.get("body"),
      badge: formData.get("badge")?.toString() || undefined,
      offer: formData.get("offer")?.toString() || undefined,
      ctaLabel: formData.get("ctaLabel")?.toString() || undefined,
      ctaHref: formData.get("ctaHref")?.toString() || undefined,
      publishStatus: formData.get("publishStatus")?.toString() || "PUBLISHED",
    }, "/admin/content");

  const audience = parseAudienceFromForm(formData);
  const created = await db.deal.create({
    data: {
      title: parsedValues.title,
      summary: parsedValues.summary,
      body: parsedValues.body,
      badge: parsedValues.badge || null,
      offer: parsedValues.offer || null,
      ctaLabel: parsedValues.ctaLabel || null,
      ctaHref: parsedValues.ctaHref || null,
      publishStatus: parsedValues.publishStatus ?? "PUBLISHED",
      audience,
    },
  });

  await db.auditLog.create({
    data: {
      userId: actorId,
      action: "deal.create",
      targetType: "Deal",
      targetId: created.id,
      metadata: buildVersionMetadata(
        {
          title: created.title,
          badge: created.badge,
          offer: created.offer,
          publishStatus: created.publishStatus,
        },
        { audience: audience ?? {} },
      ),
    },
  });

  revalidatePath("/admin/content");
  revalidatePath("/app/deals");
  revalidatePath("/app");

  await redirectWithFlash("お得情報を追加しました。", "success", "/admin/content");
}

export async function createToolItemAction(formData: FormData) {
  if (!prisma) {
    await redirectWithFlash("データベース設定後に利用できます。", "error", "/admin/content");
  }
  const db = prisma!;

  const actorId = await getAdminActorId();
  await assertAdminMutationLimit(actorId, "create-tool");

  const values = z
    .object({
      title: z.string().min(2),
      summary: z.string().min(2),
      body: z.string().min(2),
      href: z.string().optional(),
      publishStatus: z.nativeEnum(PublishStatus).optional(),
    });
  const parsedValues = await handleAdminInput(values, {
      title: formData.get("title"),
      summary: formData.get("summary"),
      body: formData.get("body"),
      href: formData.get("href")?.toString() || undefined,
      publishStatus: formData.get("publishStatus")?.toString() || "PUBLISHED",
    }, "/admin/content");

  const audience = parseAudienceFromForm(formData);
  const created = await db.toolItem.create({
    data: {
      title: parsedValues.title,
      summary: parsedValues.summary,
      body: parsedValues.body,
      href: parsedValues.href || null,
      publishStatus: parsedValues.publishStatus ?? "PUBLISHED",
      audience,
    },
  });

  await db.auditLog.create({
    data: {
      userId: actorId,
      action: "tool.create",
      targetType: "ToolItem",
      targetId: created.id,
      metadata: buildVersionMetadata(
        {
          title: created.title,
          href: created.href,
          publishStatus: created.publishStatus,
        },
        { audience: audience ?? {} },
      ),
    },
  });

  revalidatePath("/admin/content");
  revalidatePath("/app/tools");
  revalidatePath("/app");

  await redirectWithFlash("ツール情報を追加しました。", "success", "/admin/content");
}

export async function createFaqAction(formData: FormData) {
  if (!prisma) {
    await redirectWithFlash("データベース設定後に利用できます。", "error", "/admin/content");
  }
  const db = prisma!;

  const actorId = await getAdminActorId();
  await assertAdminMutationLimit(actorId, "create-faq");

  const values = z
    .object({
      category: z.string().min(1),
      question: z.string().min(2),
      answer: z.string().min(2),
      publishStatus: z.nativeEnum(PublishStatus).optional(),
    });
  const parsedValues = await handleAdminInput(values, {
      category: formData.get("category"),
      question: formData.get("question"),
      answer: formData.get("answer"),
      publishStatus: formData.get("publishStatus")?.toString() || "PUBLISHED",
    }, "/admin/content");

  const audience = parseAudienceFromForm(formData);
  const created = await db.faqItem.create({
    data: {
      category: parsedValues.category,
      question: parsedValues.question,
      answer: parsedValues.answer,
      publishStatus: parsedValues.publishStatus ?? "PUBLISHED",
      audience,
    },
  });

  await db.auditLog.create({
    data: {
      userId: actorId,
      action: "faq.create",
      targetType: "FaqItem",
      targetId: created.id,
      metadata: buildVersionMetadata(
        {
          category: created.category,
          question: created.question,
          publishStatus: created.publishStatus,
        },
        { audience: audience ?? {} },
      ),
    },
  });

  revalidatePath("/admin/content");
  revalidatePath("/app/faq");
  revalidatePath("/app");

  await redirectWithFlash("FAQ を追加しました。", "success", "/admin/content");
}

export async function createCourseAction(formData: FormData) {
  if (!prisma) {
    await redirectWithFlash("データベース設定後に利用できます。", "error", "/admin/content");
  }
  const db = prisma!;

  const actorId = await getAdminActorId();
  await assertAdminMutationLimit(actorId, "create-course");

  const values = z
    .object({
      title: z.string().min(2),
      slug: z.string().optional(),
      summary: z.string().min(2),
      heroNote: z.string().min(1),
      estimatedHours: z.string().min(1),
      thumbnailUrl: z.string().optional(),
      publishStatus: z.nativeEnum(PublishStatus).optional(),
    });
  const parsedValues = await handleAdminInput(values, {
      title: formData.get("title"),
      slug: formData.get("slug")?.toString() || undefined,
      summary: formData.get("summary"),
      heroNote: formData.get("heroNote"),
      estimatedHours: formData.get("estimatedHours"),
      thumbnailUrl: normalizeOptionalText(formData.get("thumbnailUrl")),
      publishStatus: formData.get("publishStatus")?.toString() || "PUBLISHED",
    }, "/admin/content");

  const audience = parseAudienceFromForm(formData);
  const uploadedThumbnailUrl = await persistUploadedImage({
    file:
      formData.get("thumbnailFile") instanceof File
        ? (formData.get("thumbnailFile") as File)
        : null,
    folder: "courses",
    alt: parsedValues.title,
    redirectPath: "/admin/content",
  });
  const created = await db.course.create({
    data: {
      slug: slugify(parsedValues.slug || parsedValues.title),
      title: parsedValues.title,
      summary: parsedValues.summary,
      heroNote: parsedValues.heroNote,
      estimatedHours: parsedValues.estimatedHours,
      thumbnailUrl: uploadedThumbnailUrl ?? parsedValues.thumbnailUrl ?? null,
      publishStatus: parsedValues.publishStatus ?? "PUBLISHED",
      audience,
    },
  });

  await db.auditLog.create({
    data: {
      userId: actorId,
      action: "course.create",
      targetType: "Course",
      targetId: created.id,
      metadata: buildVersionMetadata(
        {
          title: created.title,
          slug: created.slug,
          estimatedHours: created.estimatedHours,
          publishStatus: created.publishStatus,
        },
        { audience: audience ?? {} },
      ),
    },
  });

  revalidatePath("/admin/content");
  revalidatePath("/app/courses");
  revalidatePath("/app");

  await redirectWithFlash("教材コースを追加しました。", "success", "/admin/content");
}

export async function createCourseModuleAction(formData: FormData) {
  if (!prisma) {
    await redirectWithFlash("データベース設定後に利用できます。", "error", "/admin/content");
  }
  const db = prisma!;

  const actorId = await getAdminActorId();
  await assertAdminMutationLimit(actorId, "create-course-module");

  const values = z
    .object({
      courseId: z.string().min(1),
      title: z.string().min(2),
      sortOrder: z.coerce.number().int().nonnegative().optional(),
    });
  const parsedValues = await handleAdminInput(values, {
      courseId: formData.get("courseId"),
      title: formData.get("title"),
      sortOrder: formData.get("sortOrder")?.toString() || undefined,
    }, "/admin/content");

  const created = await db.module.create({
    data: {
      courseId: parsedValues.courseId,
      title: parsedValues.title,
      sortOrder: parsedValues.sortOrder ?? 0,
    },
  });

  await db.auditLog.create({
    data: {
      userId: actorId,
      action: "course.module.create",
      targetType: "Module",
      targetId: created.id,
      metadata: buildVersionMetadata({
        title: created.title,
        courseId: created.courseId,
        sortOrder: created.sortOrder,
      }),
    },
  });

  revalidatePath("/admin/content");
  revalidatePath("/app/courses");

  await redirectWithFlash("章を追加しました。", "success", "/admin/content");
}

export async function createCourseLessonAction(formData: FormData) {
  if (!prisma) {
    await redirectWithFlash("データベース設定後に利用できます。", "error", "/admin/content");
  }
  const db = prisma!;

  const actorId = await getAdminActorId();
  await assertAdminMutationLimit(actorId, "create-course-lesson");

  const values = z
    .object({
      moduleId: z.string().min(1),
      title: z.string().min(2),
      slug: z.string().optional(),
      summary: z.string().min(2),
      lessonType: z.enum(["VIDEO", "ARTICLE", "PODCAST"]),
      duration: z.string().optional(),
      mediaUrl: z.string().optional(),
      body: z.string().optional(),
      checklist: z.string().optional(),
      ctaLabel: z.string().optional(),
      ctaHref: z.string().optional(),
      ctaBody: z.string().optional(),
      sortOrder: z.coerce.number().int().nonnegative().optional(),
    });
  const parsedValues = await handleAdminInput(values, {
      moduleId: formData.get("moduleId"),
      title: formData.get("title"),
      slug: formData.get("slug")?.toString() || undefined,
      summary: formData.get("summary"),
      lessonType: formData.get("lessonType"),
      duration: formData.get("duration")?.toString() || undefined,
      mediaUrl: formData.get("mediaUrl")?.toString() || undefined,
      body: formData.get("body")?.toString() || undefined,
      checklist: formData.get("checklist")?.toString() || undefined,
      ctaLabel: formData.get("ctaLabel")?.toString() || undefined,
      ctaHref: formData.get("ctaHref")?.toString() || undefined,
      ctaBody: formData.get("ctaBody")?.toString() || undefined,
      sortOrder: formData.get("sortOrder")?.toString() || undefined,
    }, "/admin/content");

  const blocks = buildLessonBlocksFromForm(parsedValues);

  const created = await db.lesson.create({
    data: {
      moduleId: parsedValues.moduleId,
      slug: slugify(parsedValues.slug || parsedValues.title),
      title: parsedValues.title,
      summary: parsedValues.summary,
      lessonType: parsedValues.lessonType,
      duration: parsedValues.duration || null,
      sortOrder: parsedValues.sortOrder ?? 0,
      body: blocks as unknown as Prisma.InputJsonValue,
    },
  });

  await db.auditLog.create({
    data: {
      userId: actorId,
      action: "course.lesson.create",
      targetType: "Lesson",
      targetId: created.id,
      metadata: buildVersionMetadata({
        title: created.title,
        slug: created.slug,
        lessonType: parsedValues.lessonType,
        moduleId: created.moduleId,
        sortOrder: created.sortOrder,
      }),
    },
  });

  revalidatePath("/admin/content");
  revalidatePath("/app/courses");

  await redirectWithFlash("講義を追加しました。", "success", "/admin/content");
}

export async function createCampaignAction(formData: FormData) {
  if (!prisma) {
    await redirectWithFlash("データベース設定後に利用できます。", "error", "/admin/campaigns");
  }
  const db = prisma!;

  const actorId = await getAdminActorId();
  await assertAdminMutationLimit(actorId, "create-campaign");

  const values = z
    .object({
      title: z.string().min(2),
      subject: z.string().min(2),
      previewText: z.string().optional(),
      bodyHtml: z.string().min(2),
      scheduledAt: z.string().optional(),
    });
  const parsedValues = await handleAdminInput(values, {
      title: formData.get("title"),
      subject: formData.get("subject"),
      previewText: formData.get("previewText")?.toString() || undefined,
      bodyHtml: formData.get("bodyHtml"),
      scheduledAt: formData.get("scheduledAt")?.toString() || undefined,
    }, "/admin/campaigns");

  const targetJson = parseAudienceFromForm(formData) ?? {};
  const created = await db.emailCampaign.create({
    data: {
      title: parsedValues.title,
      subject: parsedValues.subject,
      previewText: parsedValues.previewText || null,
      bodyHtml: parsedValues.bodyHtml,
      targetJson,
      status: parsedValues.scheduledAt ? "SCHEDULED" : "DRAFT",
      scheduledAt: parsedValues.scheduledAt ? new Date(parsedValues.scheduledAt) : null,
    },
  });

  await db.auditLog.create({
    data: {
      userId: actorId,
      action: "campaign.create",
      targetType: "EmailCampaign",
      targetId: created.id,
      metadata: buildVersionMetadata(
        {
          title: created.title,
          subject: created.subject,
          status: created.status,
          scheduledAt: created.scheduledAt?.toISOString() ?? null,
        },
        { audience: targetJson },
      ),
    },
  });

  revalidatePath("/admin/campaigns");

  await redirectWithFlash("配信設定を保存しました。", "success", "/admin/campaigns");
}

export async function sendCampaignNowAction(formData: FormData) {
  if (!prisma) {
    await redirectWithFlash("データベース設定後に利用できます。", "error", "/admin/campaigns");
  }

  const actorId = await getAdminActorId();
  await assertAdminMutationLimit(actorId, "send-campaign");
  const campaignId = await handleAdminInput(
    z.string().min(1, "配信情報が見つかりません。"),
    formData.get("campaignId"),
    "/admin/campaigns",
  );
  let result: Awaited<ReturnType<typeof deliverCampaign>> | undefined;
  try {
    result = await deliverCampaign({
      campaignId,
      actorId,
      source: "admin",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "配信に失敗しました。メール設定を確認してください。";
    await redirectWithFlash(message, "error", "/admin/campaigns");
  }

  if (!result) {
    await redirectWithFlash("配信に失敗しました。", "error", "/admin/campaigns");
  }
  const finalResult = result as NonNullable<typeof result>;

  revalidatePath("/admin/campaigns");

  if (finalResult.skipped) {
    await redirectWithFlash("この配信はすでに送信済みです。", "success", "/admin/campaigns");
  }

  await redirectWithFlash(
    `${finalResult.deliveredCount} 件の会員メールに配信しました。`,
    "success",
    "/admin/campaigns",
  );
}

export async function updateMemberPlanAction(formData: FormData) {
  if (!prisma) {
    await redirectWithFlash("データベース設定後に利用できます。", "error", "/admin/members");
  }
  const db = prisma!;

  const actorId = await getAdminActorId();
  await assertAdminMutationLimit(actorId, "update-plan");
  const userId = await handleAdminInput(
    z.string().min(1, "対象会員が見つかりません。"),
    formData.get("userId"),
    "/admin/members",
  );
  const nextPlanCode = await handleAdminInput(
    z.nativeEnum(MembershipPlanCode),
    formData.get("planCode"),
    "/admin/members",
  );

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

  await handleAdminTransaction(() => db.$transaction(async (tx) => {
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
  }), "/admin/members");

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

  const values = await handleAdminInput(schema, {
    userId: formData.get("userId"),
    mode: formData.get("mode"),
    amount: formData.get("amount"),
    note: formData.get("note"),
  }, "/admin/members");

  if (values.mode === "bonus" && values.amount <= 0) {
    await redirectWithFlash("手動付与は 1 以上で入力してください。", "error", "/admin/members");
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
    });
  const parsedValues = await handleAdminInput(values, {
      reservationId: formData.get("reservationId"),
      status: formData.get("status"),
    }, "/admin/offerings");

  const reservation = await db.reservation.findUnique({
    where: { id: parsedValues.reservationId },
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
  const requiresConsumptionNow =
    !activePlan?.unlimitedCredits &&
    targetReservation.offering.consumptionMode === "ON_ATTEND" &&
    targetReservation.offering.creditRequired > 0;

  await handleAdminTransaction(
    () =>
      db.$transaction(async (tx) => {
        const lockedWallet = requiresConsumptionNow
          ? await lockCreditWallet(tx, targetReservation.userId)
          : null;

        if (
          requiresConsumptionNow &&
          (lockedWallet?.currentBalance ?? 0) < targetReservation.offering.creditRequired
        ) {
          await redirectWithFlash(
            "残高不足のため出席確定できません。先にクレジットを補正してください。",
            "error",
            "/admin/offerings",
          );
        }

        await tx.reservation.update({
          where: { id: targetReservation.id },
          data: {
            status: parsedValues.status,
          },
        });

        if (requiresConsumptionNow && lockedWallet) {
          await tx.creditWallet.update({
            where: { id: lockedWallet.id },
            data: {
              currentBalance: {
                decrement: targetReservation.offering.creditRequired,
              },
            },
          });

          await tx.creditLedger.create({
            data: {
              walletId: lockedWallet.id,
              userId: targetReservation.userId,
              type: "CONSUMED",
              amount: targetReservation.offering.creditRequired * -1,
              note:
                parsedValues.status === "ATTENDED"
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
              status: parsedValues.status,
              offeringId: targetReservation.offeringId,
            },
          },
        });
      }, { isolationLevel: "Serializable" }),
    "/admin/offerings",
  );

  revalidatePath("/admin/offerings");
  revalidatePath("/app");
  revalidatePath("/app/bookings");
  revalidatePath("/app/events");

  await redirectWithFlash(
    parsedValues.status === "ATTENDED" ? "参加済みに更新しました。" : "欠席として処理しました。",
    "success",
    "/admin/offerings",
  );
}

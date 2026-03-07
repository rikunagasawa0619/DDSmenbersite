import { Prisma, PrismaClient, PublishStatus } from "@prisma/client";

import {
  sampleAnnouncements,
  sampleBanners,
  sampleCampaigns,
  sampleCourses,
  sampleDeals,
  sampleFaqs,
  sampleMembershipPlans,
  sampleOfferings,
  sampleReservations,
  sampleSegments,
  sampleThemeSettings,
  sampleTools,
  sampleUsers,
  sampleWaitlistEntries,
  sampleWallets,
} from "../src/lib/sample-data";

const prisma = new PrismaClient();

function asJson(value: unknown) {
  return value as Prisma.InputJsonValue | undefined;
}

async function resetDatabase() {
  await prisma.auditLog.deleteMany();
  await prisma.lessonProgress.deleteMany();
  await prisma.waitlistEntry.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.creditLedger.deleteMany();
  await prisma.creditWallet.deleteMany();
  await prisma.userSegment.deleteMany();
  await prisma.planAssignment.deleteMany();
  await prisma.user.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.module.deleteMany();
  await prisma.course.deleteMany();
  await prisma.banner.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.deal.deleteMany();
  await prisma.toolItem.deleteMany();
  await prisma.faqItem.deleteMany();
  await prisma.reservableOffering.deleteMany();
  await prisma.emailCampaign.deleteMany();
  await prisma.themeSettings.deleteMany();
  await prisma.segmentTag.deleteMany();
  await prisma.membershipPlan.deleteMany();
}

async function seedPlansAndSegments() {
  for (const plan of sampleMembershipPlans) {
    await prisma.membershipPlan.create({
      data: {
        code: plan.code,
        name: plan.name,
        heroLabel: plan.heroLabel,
        description: plan.description,
        monthlyCreditGrant: plan.monthlyCreditGrant,
        rolloverCap: plan.rolloverCap,
        unlimitedCredits: plan.unlimitedCredits,
        cycleBasis: plan.cycleBasis === "calendar_month" ? "CALENDAR_MONTH" : "CONTRACT_DATE",
      },
    });
  }

  for (const segment of sampleSegments) {
    await prisma.segmentTag.create({
      data: {
        id: segment.id,
        slug: segment.slug,
        label: segment.label,
        description: segment.description,
        isSystem: segment.isSystem ?? false,
      },
    });
  }
}

async function seedUsers() {
  const planMap = new Map(
    (await prisma.membershipPlan.findMany()).map((plan) => [plan.code, plan.id]),
  );
  const segmentMap = new Map(
    (await prisma.segmentTag.findMany()).map((segment) => [segment.slug, segment.id]),
  );

  for (const user of sampleUsers) {
    await prisma.user.create({
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        title: user.title,
        company: user.company,
        avatarLabel: user.avatarLabel,
        role:
          user.role === "super_admin"
            ? "SUPER_ADMIN"
            : user.role === "staff"
              ? "STAFF"
              : "STUDENT",
        status:
          user.status === "active"
            ? "ACTIVE"
            : user.status === "invited"
              ? "INVITED"
              : "SUSPENDED",
        contractStartAt: new Date(user.contractStartAt),
        createdAt: new Date(user.joinedAt),
      },
    });

    await prisma.planAssignment.create({
      data: {
        userId: user.id,
        planId: planMap.get(user.planCode)!,
        startedAt: new Date(user.contractStartAt),
        isActive: true,
      },
    });

    for (const slug of user.segmentSlugs) {
      await prisma.userSegment.create({
        data: {
          userId: user.id,
          segmentId: segmentMap.get(slug)!,
        },
      });
    }
  }
}

async function seedWallets() {
  for (const wallet of sampleWallets) {
    const createdWallet = await prisma.creditWallet.create({
      data: {
        userId: wallet.userId,
        currentBalance: wallet.currentBalance,
      },
    });

    for (const ledger of wallet.ledger) {
      await prisma.creditLedger.create({
        data: {
          id: ledger.id,
          walletId: createdWallet.id,
          userId: wallet.userId,
          type: ledger.type.toUpperCase() as never,
          amount: ledger.amount,
          note: ledger.note,
          offeringId: ledger.offeringId,
          createdAt: new Date(ledger.createdAt),
        },
      });
    }
  }
}

async function seedContent() {
  await prisma.themeSettings.create({
    data: sampleThemeSettings,
  });

  for (const banner of sampleBanners) {
    await prisma.banner.create({
      data: {
        id: banner.id,
        eyebrow: banner.eyebrow,
        title: banner.title,
        subtitle: banner.subtitle,
        ctaLabel: banner.ctaLabel,
        ctaHref: banner.ctaHref,
        accent: banner.accent,
        publishStatus: PublishStatus.PUBLISHED,
        audience: asJson(banner.audience),
      },
    });
  }

  for (const announcement of sampleAnnouncements) {
    await prisma.announcement.create({
      data: {
        id: announcement.id,
        title: announcement.title,
        summary: announcement.summary,
        body: announcement.body,
        publishStatus: PublishStatus.PUBLISHED,
        publishAt: new Date(announcement.publishedAt),
        audience: asJson(announcement.audience),
      },
    });
  }

  for (const deal of sampleDeals) {
    await prisma.deal.create({
      data: {
        id: deal.id,
        title: deal.title,
        summary: deal.summary,
        body: deal.summary,
        badge: deal.badge,
        offer: deal.offer,
        ctaLabel: deal.ctaLabel,
        ctaHref: deal.ctaHref,
        publishStatus: PublishStatus.PUBLISHED,
        audience: asJson(deal.audience),
      },
    });
  }

  for (const tool of sampleTools) {
    await prisma.toolItem.create({
      data: {
        id: tool.id,
        title: tool.title,
        summary: tool.summary,
        body: tool.body,
        href: tool.href,
        publishStatus: PublishStatus.PUBLISHED,
        audience: asJson(tool.audience),
      },
    });
  }

  for (const faq of sampleFaqs) {
    await prisma.faqItem.create({
      data: {
        id: faq.id,
        category: faq.category,
        question: faq.question,
        answer: faq.answer,
        publishStatus: PublishStatus.PUBLISHED,
        audience: asJson(faq.audience),
      },
    });
  }

  for (const course of sampleCourses) {
    await prisma.course.create({
      data: {
        id: course.id,
        slug: course.slug,
        title: course.title,
        summary: course.summary,
        heroNote: course.heroNote,
        estimatedHours: course.estimatedHours,
        publishStatus: PublishStatus.PUBLISHED,
        audience: asJson(course.audience),
        modules: {
          create: course.modules.map((module, moduleIndex) => ({
            id: module.id,
            title: module.title,
            sortOrder: moduleIndex,
            lessons: {
              create: module.lessons.map((lesson, lessonIndex) => ({
                id: lesson.id,
                slug: lesson.slug,
                title: lesson.title,
                summary: lesson.summary,
                lessonType: lesson.type.toUpperCase() as "VIDEO" | "ARTICLE" | "PODCAST",
                duration: lesson.duration,
                sortOrder: lessonIndex,
                body: asJson(lesson.blocks) ?? Prisma.JsonNull,
              })),
            },
          })),
        },
      },
    });
  }

  for (const offering of sampleOfferings) {
    await prisma.reservableOffering.create({
      data: {
        id: offering.id,
        slug: offering.slug,
        title: offering.title,
        summary: offering.summary,
        description: offering.description,
        offeringType: offering.offeringType.toUpperCase() as never,
        startsAt: new Date(offering.startsAt),
        endsAt: new Date(offering.endsAt),
        locationLabel: offering.locationLabel,
        capacity: offering.capacity,
        waitlistEnabled: offering.waitlistEnabled,
        creditRequired: offering.creditRequired,
        consumptionMode: offering.consumptionMode.toUpperCase() as never,
        refundDeadline: new Date(offering.refundDeadline),
        priceLabel: offering.priceLabel,
        host: offering.host,
        featured: offering.featured,
        externalJoinUrl: offering.externalJoinUrl,
        audience: asJson(offering.audience),
      },
    });
  }

  for (const campaign of sampleCampaigns) {
    await prisma.emailCampaign.create({
      data: {
        id: campaign.id,
        title: campaign.title,
        subject: campaign.subject,
        targetJson: asJson(campaign.audience) ?? {},
        status: campaign.status.toUpperCase() as never,
        scheduledAt: campaign.scheduledAt ? new Date(campaign.scheduledAt) : null,
      },
    });
  }
}

async function seedReservationsAndProgress() {
  for (const reservation of sampleReservations) {
    await prisma.reservation.create({
      data: {
        id: reservation.id,
        offeringId: reservation.offeringId,
        userId: reservation.userId,
        status: reservation.status.toUpperCase() as never,
        createdAt: new Date(reservation.createdAt),
      },
    });
  }

  for (const entry of sampleWaitlistEntries) {
    await prisma.waitlistEntry.create({
      data: {
        id: entry.id,
        offeringId: entry.offeringId,
        userId: entry.userId,
        createdAt: new Date(entry.createdAt),
      },
    });
  }

  await prisma.lessonProgress.createMany({
    data: [
      { userId: "user-hobby", lessonId: "les-01", completedAt: new Date("2026-03-05T12:00:00+09:00") },
      { userId: "user-biz", lessonId: "les-01", completedAt: new Date("2026-03-05T12:00:00+09:00") },
      { userId: "user-biz", lessonId: "les-02", completedAt: new Date("2026-03-06T12:00:00+09:00") },
      { userId: "user-pro", lessonId: "les-01", completedAt: new Date("2026-03-01T12:00:00+09:00") },
      { userId: "user-pro", lessonId: "les-02", completedAt: new Date("2026-03-02T12:00:00+09:00") },
      { userId: "user-pro", lessonId: "les-03", completedAt: new Date("2026-03-03T12:00:00+09:00") },
    ],
  });
}

async function main() {
  const dbUrl = process.env.DATABASE_URL ?? "";
  const normalizedDbUrl = dbUrl.toLowerCase();
  const looksLocalDatabase =
    normalizedDbUrl.includes("localhost") ||
    normalizedDbUrl.includes("127.0.0.1") ||
    normalizedDbUrl.includes("host.docker.internal");
  const isProduction =
    process.env.NODE_ENV === "production" || (Boolean(dbUrl) && !looksLocalDatabase);

  if (isProduction && !process.env.SEED_FORCE) {
    console.error(
      "ERROR: Seed script refused to run — DATABASE_URL looks like production.\n" +
        "Set SEED_FORCE=1 to override (this will DELETE ALL DATA).",
    );
    process.exit(1);
  }

  if (process.env.SEED_FORCE) {
    console.warn("WARNING: SEED_FORCE is set. All existing data will be deleted.");
  }

  await resetDatabase();
  await seedPlansAndSegments();
  await seedUsers();
  await seedWallets();
  await seedContent();
  await seedReservationsAndProgress();

  console.log("Seed completed.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

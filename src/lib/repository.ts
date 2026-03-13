import type { Prisma } from "@prisma/client";
import {
  CreditConsumptionMode,
  EmailCampaignStatus,
  MembershipPlanCode,
  OfferingType,
  PlanCycleBasis,
  ReservationStatus,
} from "@prisma/client";
import { startOfWeek } from "date-fns";

import { getCycleRange, getNextGrantDate } from "@/lib/credits";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import {
  sampleAdminStats,
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
} from "@/lib/sample-data";
import type {
  AdminStat,
  Announcement,
  AuditLogEntry,
  AudienceRule,
  Banner,
  Course,
  CreditLedgerEntry,
  CreditWallet,
  Deal,
  EmailCampaign,
  FaqItem,
  LessonBlock,
  MemberProfile,
  MembershipPlan,
  ReservableOffering,
  Reservation,
  SegmentTag,
  ThemeSettings,
  ToolItem,
  WaitlistEntry,
} from "@/lib/types";

type MemberListPageParams = {
  query?: string;
  planCode?: MembershipPlanCode | "ALL";
  status?: MemberProfile["status"] | "ALL";
  sort?: "recent" | "oldest" | "name" | "plan" | "status";
  page?: number;
  pageSize?: number;
};

type PaginatedResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type OfferingCountSummary = {
  confirmed: number;
  waitlist: number;
};

function mapAudience(value: Prisma.JsonValue | null | undefined): AudienceRule | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  return value as unknown as AudienceRule;
}

function toUserRole(value: string) {
  return value.toLowerCase() as MemberProfile["role"];
}

function toMemberStatus(value: string) {
  return value.toLowerCase() as MemberProfile["status"];
}

function toPlanCode(value: string) {
  return value as MembershipPlanCode;
}

function toPlanCycleBasis(value: string) {
  return value.toLowerCase() as MembershipPlan["cycleBasis"];
}

function toOfferingType(value: string) {
  return value.toLowerCase() as ReservableOffering["offeringType"];
}

function toConsumptionMode(value: string) {
  return value.toLowerCase() as ReservableOffering["consumptionMode"];
}

function toLessonType(value: string) {
  return value.toLowerCase() as Course["modules"][number]["lessons"][number]["type"];
}

function toLedgerType(value: string) {
  return value.toLowerCase() as CreditLedgerEntry["type"];
}

function toReservationStatus(value: string) {
  return value.toLowerCase() as Reservation["status"];
}

function sortPlans(plans: MembershipPlan[]) {
  const order = { HOBBY: 0, BIZ: 1, PRO: 2 } satisfies Record<MembershipPlanCode, number>;
  return plans.sort((a, b) => order[a.code] - order[b.code]);
}

function fallbackValue<T>(value: T, fallback: T) {
  if (Array.isArray(value) && value.length === 0) {
    return fallback;
  }

  if (value === null || value === undefined) {
    return fallback;
  }

  return value;
}

async function safeQuery<T>(query: () => Promise<T>, fallback: T): Promise<T> {
  if (!isDatabaseConfigured || !prisma) {
    return fallback;
  }

  try {
    const result = await query();
    if (process.env.NODE_ENV === "production") {
      return result;
    }
    return fallbackValue(result, fallback);
  } catch (error) {
    console.error("Repository query failed.", error);
    if (process.env.NODE_ENV === "production") {
      throw error;
    }
    return fallback;
  }
}

const userInclude = {
  planAssignments: {
    where: { isActive: true },
    include: { plan: true },
    orderBy: { startedAt: "desc" },
    take: 1,
  },
  segments: {
    include: { segment: true },
  },
} satisfies Prisma.UserInclude;

function mapPlanRow(row: {
  code: MembershipPlanCode;
  name: string;
  heroLabel: string | null;
  description: string | null;
  monthlyCreditGrant: number;
  rolloverCap: number;
  unlimitedCredits: boolean;
  cycleBasis: PlanCycleBasis;
}): MembershipPlan {
  return {
    code: toPlanCode(row.code),
    name: row.name,
    heroLabel: row.heroLabel ?? row.name,
    description: row.description ?? "",
    monthlyCreditGrant: row.monthlyCreditGrant,
    rolloverCap: row.rolloverCap,
    unlimitedCredits: row.unlimitedCredits,
    cycleBasis: toPlanCycleBasis(row.cycleBasis),
  };
}

function mapMemberRow(
  row: Prisma.UserGetPayload<{ include: typeof userInclude }>,
): MemberProfile {
  const activePlan = row.planAssignments[0]?.plan;
  const planCode = activePlan?.code ?? MembershipPlanCode.HOBBY;

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: toUserRole(row.role),
    status: toMemberStatus(row.status),
    planCode: toPlanCode(planCode),
    segmentSlugs: row.segments.map((item) => item.segment.slug),
    joinedAt: row.createdAt.toISOString(),
    contractStartAt: row.contractStartAt.toISOString(),
    creditGrantDay: row.creditGrantDay ?? undefined,
    title: row.title ?? "DDS Member",
    company: row.company ?? undefined,
    avatarLabel: row.avatarLabel ?? row.name.slice(0, 2).toUpperCase(),
  };
}

function mapBannerRow(row: {
  id: string;
  eyebrow: string | null;
  title: string;
  subtitle: string | null;
  imageUrl: string | null;
  ctaLabel: string | null;
  ctaHref: string | null;
  accent: string | null;
  audience: Prisma.JsonValue | null;
}): Banner {
  return {
    id: row.id,
    eyebrow: row.eyebrow ?? "Latest",
    title: row.title,
    subtitle: row.subtitle ?? "",
    imageUrl: row.imageUrl ?? undefined,
    ctaLabel: row.ctaLabel ?? "詳しく見る",
    ctaHref: row.ctaHref ?? "#",
    accent: row.accent ?? "from-sky-200 via-blue-100 to-indigo-200",
    audience: mapAudience(row.audience),
  };
}

function mapAnnouncementRow(row: {
  id: string;
  title: string;
  summary: string;
  body: string;
  publishAt: Date | null;
  createdAt: Date;
  audience: Prisma.JsonValue | null;
}): Announcement {
  return {
    id: row.id,
    title: row.title,
    summary: row.summary,
    body: row.body,
    publishedAt: (row.publishAt ?? row.createdAt).toISOString(),
    audience: mapAudience(row.audience),
  };
}

function mapDealRow(row: {
  id: string;
  title: string;
  summary: string;
  badge: string | null;
  body: string;
  offer: string | null;
  ctaLabel: string | null;
  ctaHref: string | null;
  audience: Prisma.JsonValue | null;
}): Deal {
  return {
    id: row.id,
    title: row.title,
    summary: row.summary,
    badge: row.badge ?? "特典",
    offer: row.offer ?? row.body,
    ctaLabel: row.ctaLabel ?? "詳細を見る",
    ctaHref: row.ctaHref ?? "#",
    audience: mapAudience(row.audience),
  };
}

function mapToolRow(row: {
  id: string;
  title: string;
  summary: string;
  body: string;
  href: string | null;
  audience: Prisma.JsonValue | null;
}): ToolItem {
  return {
    id: row.id,
    title: row.title,
    summary: row.summary,
    body: row.body,
    href: row.href ?? "#",
    audience: mapAudience(row.audience),
  };
}

function mapFaqRow(row: {
  id: string;
  category: string;
  question: string;
  answer: string;
  audience: Prisma.JsonValue | null;
}): FaqItem {
  return {
    id: row.id,
    category: row.category,
    question: row.question,
    answer: row.answer,
    audience: mapAudience(row.audience),
  };
}

function mapCourseRow(
  row: Prisma.CourseGetPayload<{
    include: { modules: { include: { lessons: true }; orderBy: { sortOrder: "asc" } } };
  }>,
): Course {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    heroNote: row.heroNote ?? "",
    estimatedHours: row.estimatedHours ?? "",
    thumbnailUrl: row.thumbnailUrl ?? undefined,
    audience: mapAudience(row.audience),
    modules: row.modules.map((module) => ({
      id: module.id,
      title: module.title,
      lessons: module.lessons
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((lesson) => ({
          id: lesson.id,
          slug: lesson.slug,
          title: lesson.title,
          summary: lesson.summary,
          type: toLessonType(lesson.lessonType),
          duration: lesson.duration ?? "",
          blocks: lesson.body as unknown as LessonBlock[],
        })),
    })),
  };
}

function mapCourseCatalogRow(row: {
  id: string;
  slug: string;
  title: string;
  summary: string;
  heroNote: string | null;
  estimatedHours: string | null;
  thumbnailUrl: string | null;
  audience: Prisma.JsonValue | null;
}): Course {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    heroNote: row.heroNote ?? "",
    estimatedHours: row.estimatedHours ?? "",
    thumbnailUrl: row.thumbnailUrl ?? undefined,
    audience: mapAudience(row.audience),
    modules: [],
  };
}

function mapCourseStructureRow(row: {
  id: string;
  slug: string;
  title: string;
  summary: string;
  heroNote: string | null;
  estimatedHours: string | null;
  thumbnailUrl: string | null;
  audience: Prisma.JsonValue | null;
  modules: Array<{
    id: string;
    title: string;
    lessons: Array<{
      id: string;
      slug: string;
      title: string;
      summary: string;
      lessonType: string;
      duration: string | null;
    }>;
  }>;
}): Course {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    heroNote: row.heroNote ?? "",
    estimatedHours: row.estimatedHours ?? "",
    thumbnailUrl: row.thumbnailUrl ?? undefined,
    audience: mapAudience(row.audience),
    modules: row.modules.map((module) => ({
      id: module.id,
      title: module.title,
      lessons: module.lessons.map((lesson) => ({
        id: lesson.id,
        slug: lesson.slug,
        title: lesson.title,
        summary: lesson.summary,
        type: toLessonType(lesson.lessonType),
        duration: lesson.duration ?? "",
        blocks: [],
      })),
    })),
  };
}

function mapOfferingRow(row: {
  id: string;
  slug: string;
  title: string;
  summary: string;
  description: string | null;
  thumbnailUrl: string | null;
  offeringType: OfferingType;
  startsAt: Date;
  endsAt: Date;
  locationLabel: string | null;
  capacity: number;
  waitlistEnabled: boolean;
  creditRequired: number;
  consumptionMode: CreditConsumptionMode;
  refundDeadline: Date | null;
  externalJoinUrl: string | null;
  audience: Prisma.JsonValue | null;
  priceLabel: string | null;
  host: string | null;
  featured: boolean;
}): ReservableOffering {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    description: row.description ?? row.summary,
    thumbnailUrl: row.thumbnailUrl ?? undefined,
    offeringType: toOfferingType(row.offeringType),
    startsAt: row.startsAt.toISOString(),
    endsAt: row.endsAt.toISOString(),
    locationLabel: row.locationLabel ?? "Online",
    capacity: row.capacity,
    waitlistEnabled: row.waitlistEnabled,
    creditRequired: row.creditRequired,
    consumptionMode: toConsumptionMode(row.consumptionMode),
    refundDeadline: (row.refundDeadline ?? row.startsAt).toISOString(),
    externalJoinUrl: row.externalJoinUrl ?? undefined,
    audience: mapAudience(row.audience),
    priceLabel: row.priceLabel ?? "",
    host: row.host ?? "DDS Staff",
    featured: row.featured,
  };
}

function mapReservationRow(row: {
  id: string;
  offeringId: string;
  userId: string;
  status: ReservationStatus;
  createdAt: Date;
}): Reservation {
  return {
    id: row.id,
    offeringId: row.offeringId,
    userId: row.userId,
    status: toReservationStatus(row.status),
    createdAt: row.createdAt.toISOString(),
  };
}

function mapWaitlistRow(row: {
  id: string;
  offeringId: string;
  userId: string;
  createdAt: Date;
}): WaitlistEntry {
  return {
    id: row.id,
    offeringId: row.offeringId,
    userId: row.userId,
    createdAt: row.createdAt.toISOString(),
  };
}

function mapCampaignRow(row: {
  id: string;
  title: string;
  subject: string;
  previewText: string | null;
  bodyHtml: string | null;
  status: EmailCampaignStatus;
  scheduledAt: Date | null;
  targetJson: Prisma.JsonValue;
}): EmailCampaign {
  return {
    id: row.id,
    title: row.title,
    subject: row.subject,
    previewText: row.previewText ?? undefined,
    bodyHtml: row.bodyHtml ?? undefined,
    status: row.status.toLowerCase() as EmailCampaign["status"],
    scheduledAt: row.scheduledAt?.toISOString(),
    audience: mapAudience(row.targetJson) ?? {},
  };
}

function mapThemeRow(row: {
  brandName: string;
  heroHeadline: string;
  primaryColor: string;
  accentColor: string;
  surfaceColor: string;
  logoWordmark: string;
  supportEmail: string;
  termsNotice: string;
}): ThemeSettings {
  return {
    brandName: row.brandName,
    heroHeadline: row.heroHeadline,
    primaryColor: row.primaryColor,
    accentColor: row.accentColor,
    surfaceColor: row.surfaceColor,
    logoWordmark: row.logoWordmark,
    supportEmail: row.supportEmail,
    termsNotice: row.termsNotice,
  };
}

function mapAuditLogRow(row: {
  id: string;
  userId: string;
  action: string;
  targetType: string;
  targetId: string;
  metadata: Prisma.JsonValue | null;
  createdAt: Date;
  user: {
    name: string;
    email: string;
  };
}): AuditLogEntry {
  return {
    id: row.id,
    userId: row.userId,
    actorName: row.user.name,
    actorEmail: row.user.email,
    action: row.action,
    targetType: row.targetType,
    targetId: row.targetId,
    metadata:
      row.metadata && typeof row.metadata === "object"
        ? (row.metadata as Record<string, unknown>)
        : undefined,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function listMembershipPlans(): Promise<MembershipPlan[]> {
  const plans = await safeQuery(
    async () =>
      (await prisma!.membershipPlan.findMany()).map(mapPlanRow),
    sampleMembershipPlans,
  );

  return sortPlans([...plans]);
}

export async function getMembershipPlanByCode(
  code: MembershipPlanCode | MemberProfile["planCode"],
): Promise<MembershipPlan> {
  const plans = await listMembershipPlans();
  return plans.find((plan) => plan.code === code)!;
}

export async function listSegments(): Promise<SegmentTag[]> {
  return safeQuery(
    async () =>
      (await prisma!.segmentTag.findMany({ orderBy: [{ isSystem: "desc" }, { label: "asc" }] })).map(
        (segment) => ({
          id: segment.id,
          slug: segment.slug,
          label: segment.label,
          description: segment.description ?? undefined,
          isSystem: segment.isSystem,
        }),
      ),
    sampleSegments,
  );
}

export async function getMemberById(id: string): Promise<MemberProfile | null> {
  return safeQuery(
    async () => {
      const row = await prisma!.user.findUnique({
        where: { id },
        include: userInclude,
      });
      return row ? mapMemberRow(row) : null;
    },
    sampleUsers.find((user) => user.id === id) ?? null,
  );
}

export async function getMemberByEmail(email: string): Promise<MemberProfile | null> {
  return safeQuery(
    async () => {
      const row = await prisma!.user.findUnique({
        where: { email },
        include: userInclude,
      });
      return row ? mapMemberRow(row) : null;
    },
    sampleUsers.find((user) => user.email === email) ?? null,
  );
}

export async function listMembers(): Promise<MemberProfile[]> {
  return safeQuery(
    async () =>
      (await prisma!.user.findMany({
        include: userInclude,
        orderBy: { createdAt: "desc" },
      })).map(mapMemberRow),
    sampleUsers,
  );
}

function sortMemberProfiles(
  members: MemberProfile[],
  sort: NonNullable<MemberListPageParams["sort"]>,
) {
  return [...members].sort((a, b) => {
    if (sort === "name") return a.name.localeCompare(b.name, "ja");
    if (sort === "plan") return a.planCode.localeCompare(b.planCode);
    if (sort === "status") return a.status.localeCompare(b.status);
    if (sort === "oldest") return a.joinedAt.localeCompare(b.joinedAt);
    return b.joinedAt.localeCompare(a.joinedAt);
  });
}

function paginateItems<T>(items: T[], page: number, pageSize: number): PaginatedResult<T> {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const start = (safePage - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    total,
    page: safePage,
    pageSize,
    totalPages,
  };
}

export async function listMembersPage(
  params: MemberListPageParams = {},
): Promise<PaginatedResult<MemberProfile>> {
  const query = params.query?.trim().toLowerCase() ?? "";
  const planCode = params.planCode ?? "ALL";
  const status = params.status ?? "ALL";
  const sort = params.sort ?? "recent";
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 20;

  if (!isDatabaseConfigured || !prisma) {
    const filtered = sortMemberProfiles(
      sampleUsers.filter((member) => {
        const matchesQuery =
          !query ||
          member.name.toLowerCase().includes(query) ||
          member.email.toLowerCase().includes(query) ||
          member.company?.toLowerCase().includes(query);
        const matchesPlan = planCode === "ALL" || member.planCode === planCode;
        const matchesStatus = status === "ALL" || member.status === status;
        return matchesQuery && matchesPlan && matchesStatus;
      }),
      sort,
    );
    return paginateItems(filtered, page, pageSize);
  }

  const where: Prisma.UserWhereInput = {
    ...(query
      ? {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } },
            { company: { contains: query, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(status !== "ALL" ? { status: status.toUpperCase() as never } : {}),
    ...(planCode !== "ALL"
      ? {
          planAssignments: {
            some: {
              isActive: true,
              plan: { code: planCode },
            },
          },
        }
      : {}),
  };

  const orderBy: Prisma.UserOrderByWithRelationInput[] =
    sort === "name"
      ? [{ name: "asc" }]
      : sort === "oldest"
        ? [{ createdAt: "asc" }]
        : sort === "status"
          ? [{ status: "asc" }, { createdAt: "desc" }]
          : [{ createdAt: "desc" }];

  if (sort === "plan") {
    const profiles = await listMembers();
    const filtered = profiles.filter((member) => {
      const matchesQuery =
        !query ||
        member.name.toLowerCase().includes(query) ||
        member.email.toLowerCase().includes(query) ||
        member.company?.toLowerCase().includes(query);
      const matchesPlan = planCode === "ALL" || member.planCode === planCode;
      const matchesStatus = status === "ALL" || member.status === status;
      return matchesQuery && matchesPlan && matchesStatus;
    });
    return paginateItems(sortMemberProfiles(filtered, sort), page, pageSize);
  }

  const [rows, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: userInclude,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.user.count({ where }),
  ]);

  return {
    items: rows.map(mapMemberRow),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getMemberStatusCounts() {
  if (!isDatabaseConfigured || !prisma) {
    return {
      active: sampleUsers.filter((member) => member.status === "active").length,
      invited: sampleUsers.filter((member) => member.status === "invited").length,
      paused: sampleUsers.filter((member) => member.status === "paused").length,
      withdrawn: sampleUsers.filter((member) => member.status === "withdrawn").length,
      suspended: sampleUsers.filter((member) => member.status === "suspended").length,
    };
  }

  const grouped = await prisma.user.groupBy({
    by: ["status"],
    _count: { _all: true },
  });
  const counts = {
    active: 0,
    invited: 0,
    paused: 0,
    withdrawn: 0,
    suspended: 0,
  };

  for (const entry of grouped) {
    const key = entry.status.toLowerCase() as keyof typeof counts;
    counts[key] = entry._count._all;
  }

  return counts;
}

export async function getWalletByUserId(
  userId: string,
  plan: MembershipPlan,
  contractStartAt: string,
  creditGrantDay?: number,
): Promise<CreditWallet> {
  const fallback =
    sampleWallets.find((wallet) => wallet.userId === userId) ?? {
      userId,
      currentBalance: plan.unlimitedCredits ? 999 : 0,
      thisCycleGranted: 0,
      thisCycleConsumed: 0,
      carriedOver: 0,
      nextGrantAt: plan.unlimitedCredits ? "常時" : new Date().toISOString(),
      ledger: [],
    };

  return safeQuery(
    async () => {
      const wallet = await prisma!.creditWallet.findUnique({
        where: { userId },
        include: {
          ledger: {
            orderBy: { createdAt: "desc" },
          },
        },
      });

      if (!wallet) {
        return fallback;
      }

      const ledger: CreditLedgerEntry[] = wallet.ledger.map((entry) => ({
        id: entry.id,
        userId: entry.userId,
        type: toLedgerType(entry.type),
        amount: entry.amount,
        createdAt: entry.createdAt.toISOString(),
        note: entry.note ?? "",
        offeringId: entry.offeringId ?? undefined,
      }));

      const { start, end } = getCycleRange(plan, new Date(), contractStartAt, creditGrantDay);
      const cycleEntries = wallet.ledger.filter(
        (entry) => entry.createdAt >= start && entry.createdAt <= end,
      );
      const thisCycleGranted = cycleEntries
        .filter((entry) => entry.amount > 0)
        .reduce((sum, entry) => sum + entry.amount, 0);
      const thisCycleConsumed = Math.abs(
        cycleEntries
          .filter((entry) => entry.amount < 0)
          .reduce((sum, entry) => sum + entry.amount, 0),
      );
      const carriedOver = plan.unlimitedCredits
        ? 0
        : Math.max(wallet.currentBalance - Math.max(thisCycleGranted - thisCycleConsumed, 0), 0);

      return {
        userId,
        currentBalance: plan.unlimitedCredits ? 999 : wallet.currentBalance,
        thisCycleGranted,
        thisCycleConsumed,
        carriedOver,
        nextGrantAt: getNextGrantDate(plan, contractStartAt, new Date(), creditGrantDay),
        ledger,
      };
    },
    fallback,
  );
}

export async function getThemeSettings(): Promise<ThemeSettings> {
  return safeQuery(
    async () => {
      const row = await prisma!.themeSettings.findFirst({
        orderBy: { updatedAt: "desc" },
      });
      return row ? mapThemeRow(row) : sampleThemeSettings;
    },
    sampleThemeSettings,
  );
}

export async function listBanners(includeAll = false): Promise<Banner[]> {
  return safeQuery(
    async () =>
      (await prisma!.banner.findMany({
        where: includeAll ? undefined : { publishStatus: "PUBLISHED" },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      })).map(mapBannerRow),
    sampleBanners,
  );
}

export async function listAnnouncements(includeAll = false): Promise<Announcement[]> {
  return safeQuery(
    async () =>
      (await prisma!.announcement.findMany({
        where: includeAll ? undefined : { publishStatus: "PUBLISHED" },
        orderBy: [{ publishAt: "desc" }, { createdAt: "desc" }],
      })).map(mapAnnouncementRow),
    sampleAnnouncements,
  );
}

export async function listDeals(includeAll = false): Promise<Deal[]> {
  return safeQuery(
    async () =>
      (await prisma!.deal.findMany({
        where: includeAll ? undefined : { publishStatus: "PUBLISHED" },
        orderBy: { createdAt: "desc" },
      })).map(mapDealRow),
    sampleDeals,
  );
}

export async function listTools(includeAll = false): Promise<ToolItem[]> {
  return safeQuery(
    async () =>
      (await prisma!.toolItem.findMany({
        where: includeAll ? undefined : { publishStatus: "PUBLISHED" },
        orderBy: { createdAt: "desc" },
      })).map(mapToolRow),
    sampleTools,
  );
}

export async function listFaqs(includeAll = false): Promise<FaqItem[]> {
  return safeQuery(
    async () =>
      (await prisma!.faqItem.findMany({
        where: includeAll ? undefined : { publishStatus: "PUBLISHED" },
        orderBy: [{ category: "asc" }, { createdAt: "desc" }],
      })).map(mapFaqRow),
    sampleFaqs,
  );
}

export async function listCourses(includeAll = false): Promise<Course[]> {
  return safeQuery(
    async () =>
      (await prisma!.course.findMany({
        where: includeAll ? undefined : { publishStatus: "PUBLISHED" },
        include: {
          modules: {
            include: { lessons: true },
            orderBy: { sortOrder: "asc" },
          },
        },
        orderBy: { createdAt: "asc" },
      })).map(mapCourseRow),
    sampleCourses,
  );
}

export async function listCourseStructure(includeAll = false): Promise<Course[]> {
  return safeQuery(
    async () =>
      (await prisma!.course.findMany({
        where: includeAll ? undefined : { publishStatus: "PUBLISHED" },
        select: {
          id: true,
          slug: true,
          title: true,
          summary: true,
          heroNote: true,
          estimatedHours: true,
          thumbnailUrl: true,
          audience: true,
          modules: {
            select: {
              id: true,
              title: true,
              lessons: {
                select: {
                  id: true,
                  slug: true,
                  title: true,
                  summary: true,
                  lessonType: true,
                  duration: true,
                },
                orderBy: { sortOrder: "asc" },
              },
            },
            orderBy: { sortOrder: "asc" },
          },
        },
        orderBy: { createdAt: "asc" },
      })).map(mapCourseStructureRow),
    sampleCourses.map((course) => ({
      ...course,
      modules: course.modules.map((module) => ({
        ...module,
        lessons: module.lessons.map((lesson) => ({
          ...lesson,
          blocks: [],
        })),
      })),
    })),
  );
}

export async function listCourseCatalog(includeAll = false): Promise<Course[]> {
  return safeQuery(
    async () =>
      (await prisma!.course.findMany({
        where: includeAll ? undefined : { publishStatus: "PUBLISHED" },
        select: {
          id: true,
          slug: true,
          title: true,
          summary: true,
          heroNote: true,
          estimatedHours: true,
          thumbnailUrl: true,
          audience: true,
        },
        orderBy: { createdAt: "asc" },
      })).map(mapCourseCatalogRow),
    sampleCourses.map((course) => ({
      ...course,
      modules: [],
    })),
  );
}

export async function getCourseBySlug(
  slug: string,
  includeAll = false,
): Promise<Course | null> {
  return safeQuery(
    async () => {
      const row = await prisma!.course.findFirst({
        where: {
          slug,
          ...(includeAll ? {} : { publishStatus: "PUBLISHED" }),
        },
        include: {
          modules: {
            include: { lessons: true },
            orderBy: { sortOrder: "asc" },
          },
        },
      });

      return row ? mapCourseRow(row) : null;
    },
    sampleCourses.find((course) => course.slug === slug) ?? null,
  );
}

export async function listOfferings(): Promise<ReservableOffering[]> {
  return safeQuery(
    async () =>
      (await prisma!.reservableOffering.findMany({
        orderBy: [{ startsAt: "asc" }, { createdAt: "desc" }],
      })).map(mapOfferingRow),
    sampleOfferings,
  );
}

export async function listReservations(userId?: string): Promise<Reservation[]> {
  return safeQuery(
    async () =>
      (await prisma!.reservation.findMany({
        where: userId ? { userId } : undefined,
        orderBy: { createdAt: "desc" },
      })).map(mapReservationRow),
    userId
      ? sampleReservations.filter((reservation) => reservation.userId === userId)
      : sampleReservations,
  );
}

export async function listWaitlistEntries(userId?: string): Promise<WaitlistEntry[]> {
  return safeQuery(
    async () =>
      (await prisma!.waitlistEntry.findMany({
        where: userId ? { userId } : undefined,
        orderBy: { createdAt: "desc" },
      })).map(mapWaitlistRow),
    userId
      ? sampleWaitlistEntries.filter((entry) => entry.userId === userId)
      : sampleWaitlistEntries,
  );
}

export async function getOfferingCountMap(): Promise<Record<string, OfferingCountSummary>> {
  if (!isDatabaseConfigured || !prisma) {
    const counts: Record<string, OfferingCountSummary> = {};

    for (const reservation of sampleReservations) {
      if (!["confirmed", "attended"].includes(reservation.status)) continue;
      counts[reservation.offeringId] ??= { confirmed: 0, waitlist: 0 };
      counts[reservation.offeringId].confirmed += 1;
    }

    for (const entry of sampleWaitlistEntries) {
      counts[entry.offeringId] ??= { confirmed: 0, waitlist: 0 };
      counts[entry.offeringId].waitlist += 1;
    }

    return counts;
  }

  const [confirmedRows, waitlistRows] = await Promise.all([
    prisma.reservation.groupBy({
      by: ["offeringId"],
      where: {
        status: {
          in: [ReservationStatus.CONFIRMED, ReservationStatus.ATTENDED],
        },
      },
      _count: { _all: true },
    }),
    prisma.waitlistEntry.groupBy({
      by: ["offeringId"],
      _count: { _all: true },
    }),
  ]);

  const counts: Record<string, OfferingCountSummary> = {};

  for (const row of confirmedRows) {
    counts[row.offeringId] ??= { confirmed: 0, waitlist: 0 };
    counts[row.offeringId].confirmed = row._count._all;
  }

  for (const row of waitlistRows) {
    counts[row.offeringId] ??= { confirmed: 0, waitlist: 0 };
    counts[row.offeringId].waitlist = row._count._all;
  }

  return counts;
}

export async function listCampaigns(): Promise<EmailCampaign[]> {
  return safeQuery(
    async () =>
      (await prisma!.emailCampaign.findMany({
        orderBy: [{ scheduledAt: "asc" }, { createdAt: "desc" }],
      })).map(mapCampaignRow),
    sampleCampaigns,
  );
}

export async function listAuditLogs(limit = 100): Promise<AuditLogEntry[]> {
  return safeQuery(
    async () =>
      (await prisma!.auditLog.findMany({
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      })).map(mapAuditLogRow),
    [],
  );
}

export async function listContentVersionFeed(limit = 12): Promise<AuditLogEntry[]> {
  const targetTypes = [
    "Announcement",
    "Banner",
    "Deal",
    "ToolItem",
    "FaqItem",
    "Course",
    "Module",
    "Lesson",
    "EmailCampaign",
  ];

  const logs = await listAuditLogs(Math.max(limit * 3, limit));
  return logs
    .filter(
      (entry) =>
        targetTypes.includes(entry.targetType) &&
        typeof entry.metadata?.version === "number" &&
        typeof entry.metadata?.snapshot === "object",
    )
    .slice(0, limit);
}

export async function listAuditLogsPage(
  page = 1,
  pageSize = 40,
): Promise<PaginatedResult<AuditLogEntry>> {
  if (!isDatabaseConfigured || !prisma) {
    return paginateItems([], page, pageSize);
  }

  const [rows, total] = await Promise.all([
    prisma.auditLog.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.auditLog.count(),
  ]);

  return {
    items: rows.map(mapAuditLogRow),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getCourseProgressMap(userId: string): Promise<Record<string, number>> {
  return safeQuery(
    async () => {
      const [courses, progress] = await Promise.all([
        prisma!.course.findMany({
          include: {
            modules: {
              include: { lessons: { select: { id: true } } },
            },
          },
        }),
        prisma!.lessonProgress.findMany({
          where: {
            userId,
            completedAt: { not: null },
          },
          include: {
            lesson: {
              include: {
                module: {
                  select: { courseId: true },
                },
              },
            },
          },
        }),
      ]);

      if (courses.length === 0) {
        return {};
      }

      return Object.fromEntries(
        courses.map((course) => {
          const totalLessons = course.modules.reduce(
            (sum, module) => sum + module.lessons.length,
            0,
          );
          const completed = progress.filter(
            (entry) => entry.lesson.module.courseId === course.id,
          ).length;

          return [
            course.id,
            totalLessons === 0 ? 0 : Math.round((completed / totalLessons) * 100),
          ];
        }),
      );
    },
    {},
  );
}

export async function getAdminStats(): Promise<AdminStat[]> {
  return safeQuery(
    async () => {
      const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
      const [activeMembers, reservations, waitlist, publishedCourses, draftCourses, scheduledCampaigns] =
        await Promise.all([
          prisma!.user.count({ where: { status: "ACTIVE" } }),
          prisma!.reservation.count({ where: { createdAt: { gte: weekStart } } }),
          prisma!.waitlistEntry.count({ where: { createdAt: { gte: weekStart } } }),
          prisma!.course.count({ where: { publishStatus: "PUBLISHED" } }),
          prisma!.course.count({ where: { publishStatus: "DRAFT" } }),
          prisma!.emailCampaign.count({ where: { status: "SCHEDULED" } }),
        ]);

      return [
        { label: "有効会員", value: String(activeMembers), note: "本番DB集計" },
        { label: "今週の予約数", value: String(reservations), note: `待機 ${waitlist}件` },
        { label: "公開教材", value: String(publishedCourses), note: `下書き ${draftCourses}本` },
        { label: "配信予定メール", value: String(scheduledCampaigns), note: "予約配信を含む" },
      ];
    },
    sampleAdminStats,
  );
}

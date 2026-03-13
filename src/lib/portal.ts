import { filterVisibleItems } from "@/lib/access";
import { getPlanForUser, getWalletForUser } from "@/lib/auth";
import {
  getAdminStats,
  getCourseProgressMap,
  getCourseBySlug,
  getOfferingCountMap,
  getThemeSettings,
  listAnnouncements,
  listBanners,
  listCampaigns,
  listCourseCatalog,
  listCourses,
  listDeals,
  listFaqs,
  listOfferings,
  listReservations,
  listWaitlistEntries,
  listTools,
} from "@/lib/repository";
import {
  canUserApplyToOfferingWithCounts,
  getOfferingCountsFromSummary,
} from "@/lib/reservations";
import type { MemberProfile } from "@/lib/types";

const demoCourseProgress: Record<string, Record<string, number>> = {
  "user-hobby": {
    "course-01": 33,
    "course-02": 0,
    "course-03": 0,
  },
  "user-biz": {
    "course-01": 66,
    "course-02": 25,
    "course-03": 0,
  },
  "user-pro": {
    "course-01": 100,
    "course-02": 50,
    "course-03": 16,
  },
};

async function getResolvedPlanWallet(user: MemberProfile) {
  const plan = await getPlanForUser(user);
  const wallet = await getWalletForUser(user, plan);
  return { plan, wallet };
}

function resolveCourseProgress(
  user: MemberProfile,
  courseProgress: Record<string, number>,
) {
  return process.env.NODE_ENV !== "production" && Object.keys(courseProgress).length === 0
    ? demoCourseProgress[user.id] ?? {}
    : courseProgress;
}

async function getVisibleOfferingsData(user: MemberProfile) {
  const [{ plan, wallet }, allOfferings, offeringCountMap, userReservations, userWaitlistEntries] = await Promise.all([
    getResolvedPlanWallet(user),
    listOfferings(),
    getOfferingCountMap(),
    listReservations(user.id),
    listWaitlistEntries(user.id),
  ]);

  const visibleOfferings = filterVisibleItems(user, allOfferings).map((offering) => {
    const counts = getOfferingCountsFromSummary(offering, offeringCountMap[offering.id]);
    const eligibility = canUserApplyToOfferingWithCounts({
      user,
      plan,
      wallet,
      offering,
      counts,
      reservations: userReservations,
      waitlistEntries: userWaitlistEntries,
    });

    return {
      ...offering,
      counts,
      eligibility,
    };
  });

  return {
    plan,
    wallet,
    offerings: visibleOfferings,
    reservations: userReservations,
  };
}

export async function getPortalSnapshot(user: MemberProfile) {
  const [{ plan, wallet }, theme, allCourses, allAnnouncements, allBanners, allDeals, allFaqs, allTools, allOfferings, offeringCountMap, userReservations, userWaitlistEntries, courseProgress] =
    await Promise.all([
      getResolvedPlanWallet(user),
      getThemeSettings(),
      listCourses(),
      listAnnouncements(),
      listBanners(),
      listDeals(),
      listFaqs(),
      listTools(),
      listOfferings(),
      getOfferingCountMap(),
      listReservations(user.id),
      listWaitlistEntries(user.id),
      getCourseProgressMap(user.id),
    ]);
  const visibleCourses = filterVisibleItems(user, allCourses);
  const visibleAnnouncements = filterVisibleItems(user, allAnnouncements);
  const visibleBanners = filterVisibleItems(user, allBanners);
  const visibleDeals = filterVisibleItems(user, allDeals);
  const visibleFaqs = filterVisibleItems(user, allFaqs);
  const visibleTools = filterVisibleItems(user, allTools);
  const visibleOfferings = filterVisibleItems(user, allOfferings).map((offering) => {
    const counts = getOfferingCountsFromSummary(offering, offeringCountMap[offering.id]);
    const eligibility = canUserApplyToOfferingWithCounts({
      user,
      plan,
      wallet,
      offering,
      counts,
      reservations: userReservations,
      waitlistEntries: userWaitlistEntries,
    });

    return {
      ...offering,
      counts,
      eligibility,
    };
  });

  return {
    user,
    plan,
    wallet,
    theme,
    banners: visibleBanners,
    announcements: visibleAnnouncements,
    deals: visibleDeals,
    tools: visibleTools,
    faqs: visibleFaqs,
    courses: visibleCourses,
    offerings: visibleOfferings,
    reservations: userReservations,
    courseProgress: resolveCourseProgress(user, courseProgress),
  };
}

export async function getPortalHomeSnapshot(user: MemberProfile) {
  const [{ plan, wallet }, theme, allCourses, allAnnouncements, allBanners, allOfferings, offeringCountMap, userReservations, userWaitlistEntries, courseProgress] =
    await Promise.all([
      getResolvedPlanWallet(user),
      getThemeSettings(),
      listCourseCatalog(),
      listAnnouncements(),
      listBanners(),
      listOfferings(),
      getOfferingCountMap(),
      listReservations(user.id),
      listWaitlistEntries(user.id),
      getCourseProgressMap(user.id),
    ]);

  const offerings = filterVisibleItems(user, allOfferings).map((offering) => {
    const counts = getOfferingCountsFromSummary(offering, offeringCountMap[offering.id]);
    const eligibility = canUserApplyToOfferingWithCounts({
      user,
      plan,
      wallet,
      offering,
      counts,
      reservations: userReservations,
      waitlistEntries: userWaitlistEntries,
    });

    return { ...offering, counts, eligibility };
  });

  return {
    user,
    plan,
    wallet,
    theme,
    banners: filterVisibleItems(user, allBanners),
    announcements: filterVisibleItems(user, allAnnouncements),
    courses: filterVisibleItems(user, allCourses),
    offerings,
    reservations: userReservations,
    courseProgress: resolveCourseProgress(user, courseProgress),
  };
}

export async function getPortalDealsSnapshot(user: MemberProfile) {
  return {
    deals: filterVisibleItems(user, await listDeals()),
  };
}

export async function getPortalToolsSnapshot(user: MemberProfile) {
  return {
    tools: filterVisibleItems(user, await listTools()),
  };
}

export async function getPortalFaqSnapshot(user: MemberProfile) {
  return {
    faqs: filterVisibleItems(user, await listFaqs()),
  };
}

export async function getPortalCoursesSnapshot(user: MemberProfile) {
  const [allCourses, courseProgress] = await Promise.all([
    listCourseCatalog(),
    getCourseProgressMap(user.id),
  ]);

  return {
    courses: filterVisibleItems(user, allCourses),
    courseProgress: resolveCourseProgress(user, courseProgress),
  };
}

export async function getPortalCourseDetailSnapshot(user: MemberProfile, courseSlug: string) {
  const [course, courseProgress] = await Promise.all([
    getCourseBySlug(courseSlug),
    getCourseProgressMap(user.id),
  ]);

  if (!course) {
    return {
      course: null,
      courseProgress: resolveCourseProgress(user, courseProgress),
    };
  }

  const visibleCourse = filterVisibleItems(user, [course])[0] ?? null;

  return {
    course: visibleCourse,
    courseProgress: resolveCourseProgress(user, courseProgress),
  };
}

export async function getPortalBookingsSnapshot(user: MemberProfile) {
  return getVisibleOfferingsData(user);
}

export async function getPortalEventsSnapshot(user: MemberProfile) {
  const snapshot = await getVisibleOfferingsData(user);
  return {
    ...snapshot,
    events: snapshot.offerings.filter((offering) => offering.offeringType === "event"),
  };
}

export async function getAdminSnapshot() {
  const [stats, campaigns, announcements, offerings, theme] = await Promise.all([
    getAdminStats(),
    listCampaigns(),
    listAnnouncements(true),
    listOfferings(),
    getThemeSettings(),
  ]);

  return {
    stats,
    campaigns,
    announcements,
    offerings,
    theme,
  };
}

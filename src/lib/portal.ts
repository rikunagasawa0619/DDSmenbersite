import { filterVisibleItems } from "@/lib/access";
import { getPlanForUser, getWalletForUser } from "@/lib/auth";
import {
  getAdminStats,
  getCourseProgressMap,
  getThemeSettings,
  listAnnouncements,
  listBanners,
  listCampaigns,
  listCourses,
  listDeals,
  listFaqs,
  listMembers,
  listOfferings,
  listReservations,
  listWaitlistEntries,
  listTools,
} from "@/lib/repository";
import { sampleUsers } from "@/lib/sample-data";
import { canUserApplyToOffering, getOfferingCounts } from "@/lib/reservations";
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

export async function getPortalSnapshot(user: MemberProfile) {
  const [plan, theme, allCourses, allAnnouncements, allBanners, allDeals, allFaqs, allTools, allOfferings, allReservations, allWaitlistEntries, courseProgress] =
    await Promise.all([
      getPlanForUser(user),
      getThemeSettings(),
      listCourses(),
      listAnnouncements(),
      listBanners(),
      listDeals(),
      listFaqs(),
      listTools(),
      listOfferings(),
      listReservations(),
      listWaitlistEntries(),
      getCourseProgressMap(user.id),
    ]);
  const wallet = await getWalletForUser(user, plan);
  const visibleCourses = filterVisibleItems(user, allCourses);
  const visibleAnnouncements = filterVisibleItems(user, allAnnouncements);
  const visibleBanners = filterVisibleItems(user, allBanners);
  const visibleDeals = filterVisibleItems(user, allDeals);
  const visibleFaqs = filterVisibleItems(user, allFaqs);
  const visibleTools = filterVisibleItems(user, allTools);
  const visibleOfferings = filterVisibleItems(user, allOfferings).map((offering) => {
    const counts = getOfferingCounts(offering, allReservations, allWaitlistEntries);
    const eligibility = canUserApplyToOffering({
      user,
      plan,
      wallet,
      offering,
      reservations: allReservations,
      waitlistEntries: allWaitlistEntries,
    });

    return {
      ...offering,
      counts,
      eligibility,
    };
  });

  const myReservations = allReservations.filter(
    (reservation) => reservation.userId === user.id,
  );

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
    reservations: myReservations,
    courseProgress:
      process.env.NODE_ENV !== "production" &&
      Object.keys(courseProgress).length === 0
        ? demoCourseProgress[user.id] ?? {}
        : courseProgress,
  };
}

export async function getAdminSnapshot() {
  const [stats, members, campaigns, announcements, offerings, theme] = await Promise.all([
    getAdminStats(),
    listMembers(),
    listCampaigns(),
    listAnnouncements(true),
    listOfferings(),
    getThemeSettings(),
  ]);

  return {
    stats,
    members:
      process.env.NODE_ENV !== "production" && members.length === 0
        ? sampleUsers
        : members,
    campaigns,
    announcements,
    offerings,
    theme,
  };
}

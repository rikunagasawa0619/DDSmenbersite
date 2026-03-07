import type { AudienceRule, MemberProfile, MembershipPlanCode } from "@/lib/types";

function includesPlan(targetPlan: MembershipPlanCode, audience?: AudienceRule) {
  if (!audience?.planCodes || audience.planCodes.length === 0) {
    return true;
  }

  return audience.planCodes.includes(targetPlan);
}

export function canAccessAudience(user: MemberProfile, audience?: AudienceRule) {
  if (!audience) {
    return true;
  }

  if (!includesPlan(user.planCode, audience)) {
    return false;
  }

  if (audience.segmentSlugs?.length) {
    const matchesRequired = audience.segmentSlugs.every((segment) =>
      user.segmentSlugs.includes(segment),
    );

    if (!matchesRequired) {
      return false;
    }
  }

  if (audience.excludeSegmentSlugs?.length) {
    const blocked = audience.excludeSegmentSlugs.some((segment) =>
      user.segmentSlugs.includes(segment),
    );

    if (blocked) {
      return false;
    }
  }

  return true;
}

export function filterVisibleItems<T extends { audience?: AudienceRule }>(
  user: MemberProfile,
  items: T[],
) {
  return items.filter((item) => canAccessAudience(user, item.audience));
}

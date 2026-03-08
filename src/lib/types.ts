export type UserRole = "super_admin" | "staff" | "student";

export type MembershipPlanCode = "HOBBY" | "BIZ" | "PRO";

export type PlanCycleBasis = "calendar_month" | "contract_date";

export type MemberStatus =
  | "active"
  | "invited"
  | "paused"
  | "withdrawn"
  | "suspended";

export type PublishStatus = "draft" | "published" | "archived";

export type LessonType = "video" | "article" | "podcast";

export type OfferingType = "booking" | "event";

export type CreditConsumptionMode = "on_confirm" | "on_attend";

export type ReservationStatus =
  | "confirmed"
  | "waitlisted"
  | "cancelled"
  | "attended"
  | "no_show";

export type CreditLedgerType =
  | "monthly_grant"
  | "bonus_grant"
  | "balance_adjustment"
  | "plan_change_grant"
  | "consumed"
  | "refunded";

export interface AudienceRule {
  planCodes?: MembershipPlanCode[];
  segmentSlugs?: string[];
  excludeSegmentSlugs?: string[];
}

export interface ThemeSettings {
  brandName: string;
  heroHeadline: string;
  primaryColor: string;
  accentColor: string;
  surfaceColor: string;
  logoWordmark: string;
  supportEmail: string;
  termsNotice: string;
}

export interface SegmentTag {
  id: string;
  slug: string;
  label: string;
  description?: string;
  isSystem?: boolean;
}

export interface MembershipPlan {
  code: MembershipPlanCode;
  name: string;
  monthlyCreditGrant: number;
  rolloverCap: number;
  unlimitedCredits: boolean;
  cycleBasis: PlanCycleBasis;
  heroLabel: string;
  description: string;
}

export interface MemberProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: MemberStatus;
  planCode: MembershipPlanCode;
  segmentSlugs: string[];
  joinedAt: string;
  contractStartAt: string;
  creditGrantDay?: number;
  title: string;
  company?: string;
  avatarLabel: string;
  demoPassword?: string;
}

export interface Banner {
  id: string;
  title: string;
  subtitle: string;
  eyebrow: string;
  imageUrl?: string;
  ctaLabel: string;
  ctaHref: string;
  accent: string;
  audience?: AudienceRule;
}

export interface Announcement {
  id: string;
  title: string;
  summary: string;
  body: string;
  publishedAt: string;
  audience?: AudienceRule;
}

export interface Deal {
  id: string;
  title: string;
  summary: string;
  badge: string;
  offer: string;
  ctaLabel: string;
  ctaHref: string;
  audience?: AudienceRule;
}

export interface ToolItem {
  id: string;
  title: string;
  summary: string;
  body: string;
  href: string;
  audience?: AudienceRule;
}

export interface FaqItem {
  id: string;
  category: string;
  question: string;
  answer: string;
  audience?: AudienceRule;
}

export interface CourseLessonBlockBase {
  id: string;
  type:
    | "hero"
    | "rich_text"
    | "embed_video"
    | "embed_audio"
    | "checklist"
    | "accordion"
    | "cta"
    | "download"
    | "custom_html";
}

export type LessonBlock =
  | (CourseLessonBlockBase & {
      type: "hero";
      title: string;
      eyebrow?: string;
      body: string;
    })
  | (CourseLessonBlockBase & {
      type: "rich_text";
      title?: string;
      body: string;
    })
  | (CourseLessonBlockBase & {
      type: "embed_video";
      title: string;
      url: string;
      duration: string;
    })
  | (CourseLessonBlockBase & {
      type: "embed_audio";
      title: string;
      url: string;
      duration: string;
    })
  | (CourseLessonBlockBase & {
      type: "checklist";
      title: string;
      items: string[];
    })
  | (CourseLessonBlockBase & {
      type: "accordion";
      title: string;
      items: Array<{ title: string; body: string }>;
    })
  | (CourseLessonBlockBase & {
      type: "cta";
      title: string;
      body: string;
      label: string;
      href: string;
    })
  | (CourseLessonBlockBase & {
      type: "download";
      title: string;
      description: string;
      href: string;
    })
  | (CourseLessonBlockBase & {
      type: "custom_html";
      html: string;
    });

export interface Lesson {
  id: string;
  slug: string;
  title: string;
  summary: string;
  type: LessonType;
  duration: string;
  blocks: LessonBlock[];
}

export interface CourseModule {
  id: string;
  title: string;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  slug: string;
  title: string;
  summary: string;
  heroNote: string;
  estimatedHours: string;
  thumbnailUrl?: string;
  audience?: AudienceRule;
  modules: CourseModule[];
}

export interface CreditLedgerEntry {
  id: string;
  userId: string;
  type: CreditLedgerType;
  amount: number;
  createdAt: string;
  note: string;
  offeringId?: string;
}

export interface CreditWallet {
  userId: string;
  currentBalance: number;
  thisCycleGranted: number;
  thisCycleConsumed: number;
  carriedOver: number;
  nextGrantAt: string;
  ledger: CreditLedgerEntry[];
}

export interface ReservableOffering {
  id: string;
  slug: string;
  title: string;
  summary: string;
  description: string;
  thumbnailUrl?: string;
  offeringType: OfferingType;
  startsAt: string;
  endsAt: string;
  locationLabel: string;
  capacity: number;
  waitlistEnabled: boolean;
  creditRequired: number;
  consumptionMode: CreditConsumptionMode;
  refundDeadline: string;
  externalJoinUrl?: string;
  audience?: AudienceRule;
  priceLabel: string;
  host: string;
  featured: boolean;
}

export interface Reservation {
  id: string;
  offeringId: string;
  userId: string;
  status: ReservationStatus;
  createdAt: string;
}

export interface WaitlistEntry {
  id: string;
  offeringId: string;
  userId: string;
  createdAt: string;
}

export interface EmailCampaign {
  id: string;
  title: string;
  subject: string;
  previewText?: string;
  bodyHtml?: string;
  status: "draft" | "scheduled" | "sent";
  scheduledAt?: string;
  audience: AudienceRule;
}

export interface AdminStat {
  label: string;
  value: string;
  note: string;
}

export interface AuditLogEntry {
  id: string;
  userId: string;
  actorName: string;
  actorEmail: string;
  action: string;
  targetType: string;
  targetId: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

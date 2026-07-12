// Domain types for the Tenure prototype.
// These shapes mirror the planned Postgres schema so fixtures look like real rows
// and the MockAPI can be swapped for a SupabaseAPI behind the same PlatformAPI.

export type Role = 'volunteer' | 'org_admin' | 'mentor'
export type Locale = 'en' | 'fr'

/** User-facing text that exists in both official languages. */
export interface Bilingual {
  en: string
  fr: string
}

export interface Account {
  id: string
  name: string
  /** Lite proof-of-personhood: a verified human can have credits minted. */
  personhoodVerified: boolean
  avatarInitials: string
}

export interface Org {
  id: string
  name: string
  blurb: Bilingual
  /** Per-month minting budget, anchored externally (not org-reported volume). */
  mintCapPerMonth: number
  mintedThisMonth: number
  /** YYYY-MM the counter applies to; rolls the counter over at month boundaries. */
  mintMonth: string
}

export interface Opportunity {
  id: string
  orgId: string
  title: Bilingual
  description: Bilingual
  category: 'shelter' | 'food' | 'youth' | 'environment' | 'seniors' | 'admin'
  skills: string[]
  locationLabel: string
  distanceKm: number
  languages: Locale[]
  geofenceRadiusM: number
}

export interface Shift {
  id: string
  opportunityId: string
  orgId: string
  /** ISO date string. */
  date: string
  startTime: string
  endTime: string
  hours: number
  capacity: number
  filled: number
  /** Credits this shift can mint per volunteer once verified. */
  creditsAward: number
  supervisorName: string
}

export type CheckInStatus =
  | 'registered' // signed up, not on-site yet
  | 'inside_geofence' // simulated arrival, within the fence
  | 'awaiting_signoff' // checked out, waiting for the supervisor
  | 'approved' // supervisor confirmed, hours logged
  | 'rejected'

export interface Registration {
  id: string
  shiftId: string
  accountId: string
  status: CheckInStatus
  insideGeofence: boolean
  /** An independent confirmation the org does not control. */
  secondKeyConfirmed: boolean
  signoffNote?: string
  contributionMeaningful?: boolean
}

export interface IntegrityComponents {
  continuity: number // 0..100
  corroboration: number
  attestation: number
  depth: number
  followThrough: number
  reliability: number
  hours: number
}

export interface IntegrityScore {
  accountId: string
  score: number // 0..100 weighted
  components: IntegrityComponents
}

/** A volunteer's relationship with one org, the unit continuity is measured on. */
export interface ServiceRelationship {
  accountId: string
  orgId: string
  approvedShifts: number
  distinctServiceWeeks: number
  /** ISO week keys already counted in distinctServiceWeeks (lazy-initialized). */
  weekKeys?: string[]
  totalHours: number
  firstDate: string
  lastDate: string
  roleProgression: string // e.g. "Greeter → Move lead"
  secondKeyConfirmed: boolean
  recurrence: string // human label, e.g. "Every other Saturday"
  /** Tier 2 (Verified Service Record) unlocks at the continuity-plus-depth bar. */
  tier: 1 | 2
}

export type LedgerEntryType = 'mint' | 'spend'

export interface CreditLedgerEntry {
  id: string
  accountId: string
  orgId?: string
  type: LedgerEntryType
  amount: number // mint > 0, spend < 0
  /** Minted credits sit in escrow until the continuity threshold + hold clears. */
  vested: boolean
  sourceKind: 'hour_log' | 'mentor_session'
  label: Bilingual
  date: string
}

export type RewardKind = 'mentorship' | 'group' | 'workshop' | 'career'

export interface RewardOffer {
  id: string
  mentorId: string
  mentorName: string
  mentorTitle: Bilingual
  kind: RewardKind
  title: Bilingual
  blurb: Bilingual
  creditCost: number
  /** Premium 1:1 named-mentor access requires sustained vesting, not a one-time unlock. */
  requiresSustained: boolean
}

export interface Booking {
  id: string
  offerId: string
  volunteerId: string
  status: 'requested' | 'confirmed' | 'completed'
  date: string
}

export interface MentorProfile {
  accountId: string
  name: string
  title: Bilingual
  bio: Bilingual
  skills: string[]
  sessionsDelivered: number
}

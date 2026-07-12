import type {
  Account,
  Booking,
  Bilingual,
  CheckInStatus,
  CreditLedgerEntry,
  IntegrityScore,
  Opportunity,
  Org,
  RewardOffer,
  ServiceRelationship,
  Shift,
} from './types'

// The continuity-plus-depth bar that gates BOTH the Tier 2 Verified Service Record
// and credit vesting. Same threshold for both, by design.
export const TIER2_MIN_SHIFTS = 4
export const TIER2_MIN_WEEKS = 3

// ---- View models returned to the UI (resolved + computed) ----

export interface VolunteerHome {
  account: Account
  integrity: IntegrityScore
  creditsAvailable: number
  creditsEscrow: number
  attendanceHours: number
  verifiedRecords: number
  nextShift?: {
    registrationId: string
    status: CheckInStatus
    shift: Shift
    opportunity: Opportunity
    org: Org
  }
}

export interface RelationshipView extends ServiceRelationship {
  orgName: string
  meetsThreshold: boolean
}

export interface PassportView {
  account: Account
  integrity: IntegrityScore
  relationships: RelationshipView[]
  attendanceHours: number // Tier 1: total verified presence hours
  verifiedRecords: RelationshipView[] // Tier 2 records only
}

export interface CreditsView {
  available: number
  escrow: number
  spent: number
  ledger: CreditLedgerEntry[]
  offers: (RewardOffer & { locked: boolean; lockReason?: Bilingual })[]
  bookings: (Booking & { offerTitle: Bilingual })[]
}

export interface OpportunityCard {
  opportunity: Opportunity
  org: Org
  shifts: Shift[]
}

export interface CheckInView {
  registrationId: string
  status: CheckInStatus
  shift: Shift
  opportunity: Opportunity
  org: Org
}

export interface OrgDashboard {
  org: Org
  activeVolunteers: number
  hoursLogged: number
  pendingSignoffs: number
  tier2Volunteers: number
}

export interface RosterRow {
  account: Account
  relationship: RelationshipView
  integrity?: IntegrityScore
}

export interface SignoffItem {
  registrationId: string
  account: Account
  shift: Shift
  opportunity: Opportunity
  insideGeofence: boolean
  secondKeyConfirmed: boolean
}

export interface ReportRow {
  account: Account
  approvedShifts: number
  totalHours: number
  tier: 1 | 2
}

export interface MentorWorkspace {
  profile: { name: string; title: Bilingual; bio: Bilingual; sessionsDelivered: number }
  offers: RewardOffer[]
  incoming: (Booking & { offerTitle: Bilingual; volunteerName: string })[]
}

export interface ApproveResult {
  mintedCredits: number
  crossedThreshold: boolean
  capExceeded: boolean
}

/**
 * The single seam between the app and its data.
 * R0 ships MockAPI; the MVP swaps in SupabaseAPI behind this exact interface.
 */
export interface PlatformAPI {
  // Volunteer
  getVolunteerHome(accountId: string): Promise<VolunteerHome>
  getPassport(accountId: string): Promise<PassportView>
  getCredits(accountId: string): Promise<CreditsView>
  listOpportunities(filter?: { category?: string; language?: string }): Promise<OpportunityCard[]>
  getOpportunity(opportunityId: string): Promise<OpportunityCard>
  registerForShift(accountId: string, shiftId: string): Promise<string>
  getCheckIn(registrationId: string): Promise<CheckInView | null>
  simulateArrival(registrationId: string): Promise<void>
  checkOut(registrationId: string): Promise<void>
  /** Returns false when the offer is locked or the balance cannot cover it. */
  redeemReward(accountId: string, offerId: string): Promise<boolean>

  // Org
  getOrgDashboard(orgId: string): Promise<OrgDashboard>
  getRoster(orgId: string): Promise<RosterRow[]>
  getSignoffQueue(orgId: string): Promise<SignoffItem[]>
  approveCheckIn(
    registrationId: string,
    opts: { meaningful: boolean; note: string },
  ): Promise<ApproveResult>
  rejectCheckIn(registrationId: string): Promise<void>
  getReports(orgId: string): Promise<ReportRow[]>
  createShift(input: {
    opportunityId: string
    date: string
    startTime: string
    endTime: string
    capacity: number
    supervisorName: string
  }): Promise<string>
  listOrgOpportunities(orgId: string): Promise<Opportunity[]>
  listOrgShifts(orgId: string): Promise<(Shift & { opportunityTitle: Bilingual })[]>

  // Mentor
  getMentorWorkspace(mentorId: string): Promise<MentorWorkspace>
  confirmBooking(bookingId: string): Promise<void>
}

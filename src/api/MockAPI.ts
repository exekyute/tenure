import { buildInitialState, type PlatformState } from './mockData'
import {
  TIER2_MIN_SHIFTS,
  TIER2_MIN_WEEKS,
  type ApproveResult,
  type CreditsView,
  type MentorWorkspace,
  type OpportunityCard,
  type OrgDashboard,
  type PassportView,
  type PlatformAPI,
  type RelationshipView,
  type ReportRow,
  type RosterRow,
  type SignoffItem,
  type VolunteerHome,
} from './PlatformAPI'
import type { IntegrityScore, Opportunity, ServiceRelationship } from './types'

const STORAGE_KEY = 'tenure.state.v2'

// Weights for the Volunteer Integrity score (sum to 1.0).
const WEIGHTS = {
  continuity: 0.3,
  corroboration: 0.2,
  attestation: 0.15,
  depth: 0.12,
  followThrough: 0.1,
  reliability: 0.08,
  hours: 0.05,
}

function isoWeekKey(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7))
  const week1 = new Date(d.getFullYear(), 0, 4)
  const weekNo =
    1 +
    Math.round(
      ((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7,
    )
  return `${d.getFullYear()}-${weekNo}`
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)))
}

/** Collision-proof id (performance.now() repeats across page reloads). */
function uid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
}

export class MockAPI implements PlatformAPI {
  private state: PlatformState

  constructor() {
    const saved = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
    const parsed = saved ? this.tryParse(saved) : null
    if (parsed) {
      this.state = parsed
    } else {
      this.state = buildInitialState()
      this.recomputeAllIntegrity()
      this.persist()
    }
  }

  /** A corrupt or structurally stale saved state falls back to a fresh seed. */
  private tryParse(saved: string): PlatformState | null {
    try {
      const s = JSON.parse(saved) as PlatformState
      const shapeOk =
        Array.isArray(s?.accounts) &&
        Array.isArray(s?.shifts) &&
        Array.isArray(s?.registrations) &&
        Array.isArray(s?.relationships) &&
        Array.isArray(s?.ledger)
      return shapeOk ? s : null
    } catch {
      return null
    }
  }

  /** Wipe persisted state and reseed. Used by the demo reset control. */
  reset(): void {
    this.state = buildInitialState()
    this.recomputeAllIntegrity()
    this.persist()
  }

  private persist(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state))
    }
  }

  private clone<T>(v: T): T {
    return JSON.parse(JSON.stringify(v)) as T
  }

  // ---- compute helpers ----

  private relFor(accountId: string, orgId: string): ServiceRelationship | undefined {
    return this.state.relationships.find((r) => r.accountId === accountId && r.orgId === orgId)
  }

  private meetsThreshold(r: ServiceRelationship): boolean {
    return (
      r.approvedShifts >= TIER2_MIN_SHIFTS &&
      r.distinctServiceWeeks >= TIER2_MIN_WEEKS &&
      r.secondKeyConfirmed
    )
  }

  private recomputeAllIntegrity(): void {
    const ids = new Set(this.state.relationships.map((r) => r.accountId))
    ids.forEach((id) => this.recomputeIntegrity(id))
  }

  private recomputeIntegrity(accountId: string): void {
    const rels = this.state.relationships.filter((r) => r.accountId === accountId)
    const primary =
      rels.slice().sort((a, b) => b.approvedShifts - a.approvedShifts)[0] ?? undefined

    const weeks = primary?.distinctServiceWeeks ?? 0
    const shifts = primary?.approvedShifts ?? 0
    const totalHours = rels.reduce((s, r) => s + r.totalHours, 0)
    const roles = primary ? primary.roleProgression.split('→').length : 0
    const secondKey = primary?.secondKeyConfirmed ?? false
    const completedBookings = this.state.bookings.filter(
      (b) => b.volunteerId === accountId && b.status !== 'requested',
    ).length

    // Convex-but-saturating continuity in distinct service weeks.
    const continuity = clamp(100 * (1 - Math.exp(-weeks / 4)))
    const corroboration = secondKey ? clamp(shifts * 20) : clamp(shifts * 3)
    const attestation = clamp(shifts * 18)
    const depth = clamp((roles - 1) * 30 + shifts * 5)
    const followThrough = clamp(completedBookings * 30)
    const reliability = shifts >= 3 ? clamp(55 + shifts * 4) : clamp(shifts * 12)
    const hours = clamp((totalHours / 30) * 100)

    const components = {
      continuity,
      corroboration,
      attestation,
      depth,
      followThrough,
      reliability,
      hours,
    }
    const score = clamp(
      components.continuity * WEIGHTS.continuity +
        components.corroboration * WEIGHTS.corroboration +
        components.attestation * WEIGHTS.attestation +
        components.depth * WEIGHTS.depth +
        components.followThrough * WEIGHTS.followThrough +
        components.reliability * WEIGHTS.reliability +
        components.hours * WEIGHTS.hours,
    )

    const existing = this.state.integrity.find((i) => i.accountId === accountId)
    const next: IntegrityScore = { accountId, score, components }
    if (existing) Object.assign(existing, next)
    else this.state.integrity.push(next)
  }

  private relView(r: ServiceRelationship): RelationshipView {
    const org = this.state.orgs.find((o) => o.id === r.orgId)
    return { ...r, orgName: org?.name ?? r.orgId, meetsThreshold: this.meetsThreshold(r) }
  }

  private creditTotals(accountId: string) {
    const entries = this.state.ledger.filter((l) => l.accountId === accountId)
    const available = entries
      .filter((l) => (l.type === 'mint' && l.vested) || l.type === 'spend')
      .reduce((s, l) => s + l.amount, 0)
    const escrow = entries
      .filter((l) => l.type === 'mint' && !l.vested)
      .reduce((s, l) => s + l.amount, 0)
    const spent = -entries.filter((l) => l.type === 'spend').reduce((s, l) => s + l.amount, 0)
    return { available, escrow, spent }
  }

  // ---- Volunteer ----

  async getVolunteerHome(accountId: string): Promise<VolunteerHome> {
    const account = this.state.accounts.find((a) => a.id === accountId)!
    const integrity = this.state.integrity.find((i) => i.accountId === accountId)!
    const { available, escrow } = this.creditTotals(accountId)
    const rels = this.state.relationships.filter((r) => r.accountId === accountId)
    const attendanceHours = rels.reduce((s, r) => s + r.totalHours, 0)
    const verifiedRecords = rels.filter((r) => this.meetsThreshold(r)).length

    const upcoming = this.state.registrations
      .filter((r) => r.accountId === accountId && (r.status === 'registered' || r.status === 'inside_geofence' || r.status === 'awaiting_signoff'))
      .map((r) => {
        const shift = this.state.shifts.find((s) => s.id === r.shiftId)!
        const opportunity = this.state.opportunities.find((o) => o.id === shift.opportunityId)!
        const org = this.state.orgs.find((o) => o.id === shift.orgId)!
        return { registrationId: r.id, status: r.status, shift, opportunity, org }
      })
      .sort((a, b) => a.shift.date.localeCompare(b.shift.date))

    return {
      account: this.clone(account),
      integrity: this.clone(integrity),
      creditsAvailable: available,
      creditsEscrow: escrow,
      attendanceHours,
      verifiedRecords,
      nextShift: upcoming[0],
    }
  }

  async getPassport(accountId: string): Promise<PassportView> {
    const account = this.state.accounts.find((a) => a.id === accountId)!
    const integrity = this.state.integrity.find((i) => i.accountId === accountId)!
    const relationships = this.state.relationships
      .filter((r) => r.accountId === accountId)
      .map((r) => this.relView(r))
    const attendanceHours = relationships.reduce((s, r) => s + r.totalHours, 0)
    const verifiedRecords = relationships.filter((r) => r.meetsThreshold)
    return {
      account: this.clone(account),
      integrity: this.clone(integrity),
      relationships,
      attendanceHours,
      verifiedRecords,
    }
  }

  async getCredits(accountId: string): Promise<CreditsView> {
    const { available, escrow, spent } = this.creditTotals(accountId)
    const ledger = this.state.ledger
      .filter((l) => l.accountId === accountId)
      .slice()
      .sort((a, b) => b.date.localeCompare(a.date))
    const hasTier2 = this.state.relationships.some(
      (r) => r.accountId === accountId && this.meetsThreshold(r),
    )
    const offers = this.state.offers.map((o) => {
      const locked = o.requiresSustained && !hasTier2
      return {
        ...o,
        locked,
        lockReason: locked
          ? {
              en: 'Unlocks after a Verified Service Record',
              fr: 'Se débloque après un dossier de service vérifié',
            }
          : undefined,
      }
    })
    const bookings = this.state.bookings
      .filter((b) => b.volunteerId === accountId)
      .map((b) => {
        const offer = this.state.offers.find((o) => o.id === b.offerId)!
        return { ...b, offerTitle: offer.title }
      })
    return { available, escrow, spent, ledger: this.clone(ledger), offers, bookings }
  }

  async listOpportunities(filter?: {
    category?: string
    language?: string
  }): Promise<OpportunityCard[]> {
    return this.state.opportunities
      .filter((o) => !filter?.category || filter.category === 'all' || o.category === filter.category)
      .filter((o) => !filter?.language || o.languages.includes(filter.language as 'en' | 'fr'))
      .map((o) => this.cardFor(o))
  }

  private cardFor(o: Opportunity): OpportunityCard {
    const org = this.state.orgs.find((g) => g.id === o.orgId)!
    const shifts = this.state.shifts
      .filter((s) => s.opportunityId === o.id && s.filled < s.capacity)
      .sort((a, b) => a.date.localeCompare(b.date))
    return { opportunity: this.clone(o), org: this.clone(org), shifts: this.clone(shifts) }
  }

  async getOpportunity(opportunityId: string): Promise<OpportunityCard> {
    const o = this.state.opportunities.find((x) => x.id === opportunityId)!
    const org = this.state.orgs.find((g) => g.id === o.orgId)!
    const shifts = this.state.shifts
      .filter((s) => s.opportunityId === o.id)
      .sort((a, b) => a.date.localeCompare(b.date))
    return { opportunity: this.clone(o), org: this.clone(org), shifts: this.clone(shifts) }
  }

  async registerForShift(accountId: string, shiftId: string): Promise<string> {
    // A rejected registration does not block signing up again for the same shift.
    const existing = this.state.registrations.find(
      (r) => r.accountId === accountId && r.shiftId === shiftId && r.status !== 'rejected',
    )
    if (existing) return existing.id
    const id = uid('reg')
    this.state.registrations.push({
      id,
      shiftId,
      accountId,
      status: 'registered',
      insideGeofence: false,
      secondKeyConfirmed: false,
    })
    const shift = this.state.shifts.find((s) => s.id === shiftId)
    if (shift && shift.filled < shift.capacity) shift.filled += 1
    this.persist()
    return id
  }

  async getCheckIn(registrationId: string) {
    const r = this.state.registrations.find((x) => x.id === registrationId)
    if (!r) return null
    const shift = this.state.shifts.find((s) => s.id === r.shiftId)!
    const opportunity = this.state.opportunities.find((o) => o.id === shift.opportunityId)!
    const org = this.state.orgs.find((o) => o.id === shift.orgId)!
    return {
      registrationId: r.id,
      status: r.status,
      shift: this.clone(shift),
      opportunity: this.clone(opportunity),
      org: this.clone(org),
    }
  }

  async simulateArrival(registrationId: string): Promise<void> {
    const r = this.state.registrations.find((x) => x.id === registrationId)
    if (r) {
      r.status = 'inside_geofence'
      r.insideGeofence = true
      // In the prototype the simulated on-site check doubles as the independent
      // second key; without it no live registration could ever reach Tier 2.
      r.secondKeyConfirmed = true
    }
    this.persist()
  }

  async checkOut(registrationId: string): Promise<void> {
    const r = this.state.registrations.find((x) => x.id === registrationId)
    if (r) r.status = 'awaiting_signoff'
    this.persist()
  }

  async redeemReward(accountId: string, offerId: string): Promise<boolean> {
    const offer = this.state.offers.find((o) => o.id === offerId)
    if (!offer) return false
    const hasTier2 = this.state.relationships.some(
      (r) => r.accountId === accountId && this.meetsThreshold(r),
    )
    if (offer.requiresSustained && !hasTier2) return false
    const { available } = this.creditTotals(accountId)
    if (available < offer.creditCost) return false
    this.state.ledger.push({
      id: uid('led'),
      accountId,
      type: 'spend',
      amount: -offer.creditCost,
      vested: true,
      sourceKind: 'mentor_session',
      label: offer.title,
      date: new Date().toISOString().slice(0, 10),
    })
    this.state.bookings.push({
      id: uid('bk'),
      offerId,
      volunteerId: accountId,
      status: 'requested',
      date: new Date().toISOString().slice(0, 10),
    })
    this.recomputeIntegrity(accountId)
    this.persist()
    return true
  }

  // ---- Org ----

  async getOrgDashboard(orgId: string): Promise<OrgDashboard> {
    const org = this.state.orgs.find((o) => o.id === orgId)!
    const rels = this.state.relationships.filter((r) => r.orgId === orgId)
    const activeVolunteers = rels.length
    const hoursLogged = rels.reduce((s, r) => s + r.totalHours, 0)
    const pendingSignoffs = this.state.registrations.filter((r) => {
      const shift = this.state.shifts.find((s) => s.id === r.shiftId)
      return shift?.orgId === orgId && r.status === 'awaiting_signoff'
    }).length
    const tier2Volunteers = rels.filter((r) => this.meetsThreshold(r)).length
    return { org: this.clone(org), activeVolunteers, hoursLogged, pendingSignoffs, tier2Volunteers }
  }

  async getRoster(orgId: string): Promise<RosterRow[]> {
    return this.state.relationships
      .filter((r) => r.orgId === orgId)
      .map((r) => {
        const account = this.state.accounts.find((a) => a.id === r.accountId)!
        const integrity = this.state.integrity.find((i) => i.accountId === r.accountId)
        return { account: this.clone(account), relationship: this.relView(r), integrity }
      })
      .sort((a, b) => b.relationship.approvedShifts - a.relationship.approvedShifts)
  }

  async getSignoffQueue(orgId: string): Promise<SignoffItem[]> {
    return this.state.registrations
      .filter((r) => {
        const shift = this.state.shifts.find((s) => s.id === r.shiftId)
        return shift?.orgId === orgId && r.status === 'awaiting_signoff'
      })
      .map((r) => {
        const shift = this.state.shifts.find((s) => s.id === r.shiftId)!
        const opportunity = this.state.opportunities.find((o) => o.id === shift.opportunityId)!
        const account = this.state.accounts.find((a) => a.id === r.accountId)!
        return {
          registrationId: r.id,
          account: this.clone(account),
          shift: this.clone(shift),
          opportunity: this.clone(opportunity),
          insideGeofence: r.insideGeofence,
          secondKeyConfirmed: r.secondKeyConfirmed,
        }
      })
  }

  async approveCheckIn(
    registrationId: string,
    opts: { meaningful: boolean; note: string },
  ): Promise<ApproveResult> {
    const r = this.state.registrations.find((x) => x.id === registrationId)
    if (!r) return { mintedCredits: 0, crossedThreshold: false, capExceeded: false }
    const shift = this.state.shifts.find((s) => s.id === r.shiftId)!
    const org = this.state.orgs.find((o) => o.id === shift.orgId)!

    // Per-org minting cap check (externally anchored budget), reset at month boundaries.
    const month = new Date().toISOString().slice(0, 7)
    if (org.mintMonth !== month) {
      org.mintMonth = month
      org.mintedThisMonth = 0
    }
    const capExceeded = org.mintedThisMonth + shift.creditsAward > org.mintCapPerMonth
    r.status = 'approved'
    r.contributionMeaningful = opts.meaningful
    r.signoffNote = opts.note

    // Update or create the service relationship.
    let rel = this.relFor(r.accountId, org.id)
    if (!rel) {
      rel = {
        accountId: r.accountId,
        orgId: org.id,
        approvedShifts: 0,
        distinctServiceWeeks: 0,
        weekKeys: [],
        totalHours: 0,
        firstDate: shift.date,
        lastDate: shift.date,
        roleProgression: 'Volunteer',
        secondKeyConfirmed: r.secondKeyConfirmed,
        recurrence: 'One-time',
        tier: 1,
      }
      this.state.relationships.push(rel)
    }
    const wasTier2 = this.meetsThreshold(rel)

    // Count distinct ISO service weeks by key, not week-to-week transitions,
    // so out-of-order or same-week approvals cannot inflate the count.
    // Seeded relationships lazily start their key set from the last counted week.
    if (!rel.weekKeys) rel.weekKeys = rel.approvedShifts > 0 ? [isoWeekKey(rel.lastDate)] : []
    const weekKey = isoWeekKey(shift.date)
    if (!rel.weekKeys.includes(weekKey)) {
      rel.weekKeys.push(weekKey)
      rel.distinctServiceWeeks += 1
    }
    rel.approvedShifts += 1
    rel.totalHours += shift.hours
    if (shift.date > rel.lastDate) rel.lastDate = shift.date
    if (shift.date < rel.firstDate) rel.firstDate = shift.date
    if (r.secondKeyConfirmed) rel.secondKeyConfirmed = true

    let mintedCredits = 0
    if (!capExceeded) {
      mintedCredits = shift.creditsAward
      org.mintedThisMonth += shift.creditsAward
      this.state.ledger.push({
        id: uid('led'),
        accountId: r.accountId,
        orgId: org.id,
        type: 'mint',
        amount: shift.creditsAward,
        vested: false,
        sourceKind: 'hour_log',
        label: {
          en: `Verified shift, ${shift.date}`,
          fr: `Quart vérifié, ${shift.date}`,
        },
        date: shift.date,
      })
    }

    const isTier2 = this.meetsThreshold(rel)
    const crossedThreshold = !wasTier2 && isTier2
    rel.tier = isTier2 ? 2 : 1

    // At or past the threshold, every mint for this relationship vests: the crossing
    // back-vests the escrow, and later shifts vest as they are approved.
    if (isTier2) {
      this.state.ledger
        .filter((l) => l.accountId === r.accountId && l.orgId === org.id && l.type === 'mint')
        .forEach((l) => {
          l.vested = true
        })
    }

    this.recomputeIntegrity(r.accountId)
    this.persist()
    return { mintedCredits, crossedThreshold, capExceeded }
  }

  async rejectCheckIn(registrationId: string): Promise<void> {
    const r = this.state.registrations.find((x) => x.id === registrationId)
    if (r) r.status = 'rejected'
    this.persist()
  }

  async getReports(orgId: string): Promise<ReportRow[]> {
    return this.state.relationships
      .filter((r) => r.orgId === orgId)
      .map((r) => {
        const account = this.state.accounts.find((a) => a.id === r.accountId)!
        return {
          account: this.clone(account),
          approvedShifts: r.approvedShifts,
          totalHours: r.totalHours,
          tier: (this.meetsThreshold(r) ? 2 : 1) as 1 | 2,
        }
      })
      .sort((a, b) => b.totalHours - a.totalHours)
  }

  async createShift(input: {
    opportunityId: string
    date: string
    startTime: string
    endTime: string
    capacity: number
    supervisorName: string
  }): Promise<string> {
    const opp = this.state.opportunities.find((o) => o.id === input.opportunityId)!
    const id = uid('shift')
    const start = Number(input.startTime.slice(0, 2)) + Number(input.startTime.slice(3)) / 60
    const end = Number(input.endTime.slice(0, 2)) + Number(input.endTime.slice(3)) / 60
    const hours = Math.max(0.5, Math.round((end - start) * 2) / 2)
    this.state.shifts.push({
      id,
      opportunityId: input.opportunityId,
      orgId: opp.orgId,
      date: input.date,
      startTime: input.startTime,
      endTime: input.endTime,
      hours,
      capacity: input.capacity,
      filled: 0,
      creditsAward: Math.max(4, Math.round(hours * 2.5)),
      supervisorName: input.supervisorName,
    })
    this.persist()
    return id
  }

  async listOrgOpportunities(orgId: string): Promise<Opportunity[]> {
    return this.clone(this.state.opportunities.filter((o) => o.orgId === orgId))
  }

  async listOrgShifts(orgId: string) {
    return this.state.shifts
      .filter((s) => s.orgId === orgId)
      .map((s) => {
        const opp = this.state.opportunities.find((o) => o.id === s.opportunityId)!
        return { ...this.clone(s), opportunityTitle: this.clone(opp.title) }
      })
      .sort((a, b) => b.date.localeCompare(a.date))
  }

  // ---- Mentor ----

  async getMentorWorkspace(mentorId: string): Promise<MentorWorkspace> {
    const profile = this.state.mentors.find((m) => m.accountId === mentorId)!
    const offers = this.state.offers.filter((o) => o.mentorId === mentorId)
    const offerIds = new Set(offers.map((o) => o.id))
    const incoming = this.state.bookings
      .filter((b) => offerIds.has(b.offerId))
      .map((b) => {
        const offer = this.state.offers.find((o) => o.id === b.offerId)!
        const volunteer = this.state.accounts.find((a) => a.id === b.volunteerId)
        return { ...b, offerTitle: offer.title, volunteerName: volunteer?.name ?? b.volunteerId }
      })
    return {
      profile: {
        name: profile.name,
        title: profile.title,
        bio: profile.bio,
        sessionsDelivered: profile.sessionsDelivered,
      },
      offers: this.clone(offers),
      incoming,
    }
  }

  async confirmBooking(bookingId: string): Promise<void> {
    const b = this.state.bookings.find((x) => x.id === bookingId)
    if (b) {
      b.status = 'confirmed'
      // Growth follow-through feeds the volunteer's integrity score.
      this.recomputeIntegrity(b.volunteerId)
    }
    this.persist()
  }
}

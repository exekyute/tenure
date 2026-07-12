import type {
  Account,
  Booking,
  CreditLedgerEntry,
  IntegrityScore,
  MentorProfile,
  Opportunity,
  Org,
  Registration,
  RewardOffer,
  ServiceRelationship,
  Shift,
} from './types'

export interface PlatformState {
  accounts: Account[]
  orgs: Org[]
  opportunities: Opportunity[]
  shifts: Shift[]
  registrations: Registration[]
  relationships: ServiceRelationship[]
  integrity: IntegrityScore[]
  ledger: CreditLedgerEntry[]
  offers: RewardOffer[]
  bookings: Booking[]
  mentors: MentorProfile[]
}

// The signed-in demo identities for each role view.
export const DEMO = {
  volunteerId: 'acc_maya',
  orgId: 'org_shelter',
  mentorId: 'acc_sofia',
}

/** Local-timezone ISO date n days from today, so fixtures stay fresh whenever the demo runs. */
function daysFromNow(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() + n)
  const p = (x: number) => String(x).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

function addDays(iso: string, n: number): string {
  const d = new Date(iso + 'T00:00:00')
  d.setDate(d.getDate() + n)
  const p = (x: number) => String(x).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

/** The next Saturday strictly after today. */
function nextSaturday(): string {
  const d = new Date()
  return daysFromNow(((6 - d.getDay() + 7) % 7) || 7)
}

function currentMonth(): string {
  return daysFromNow(0).slice(0, 7)
}

export function buildInitialState(): PlatformState {
  // Maya's move-crew rhythm: every other Saturday, with the featured demo shift
  // on the coming Saturday. All other fixture dates hang off these anchors.
  const demoSaturday = nextSaturday()
  const mayaShift1 = addDays(demoSaturday, -42)
  const mayaShift2 = addDays(demoSaturday, -28)
  const mayaShift3 = addDays(demoSaturday, -14)
  const lastSaturday = addDays(demoSaturday, -7)
  const month = currentMonth()

  const accounts: Account[] = [
    { id: 'acc_maya', name: 'Maya Chen', personhoodVerified: true, avatarInitials: 'MC' },
    { id: 'acc_jordan', name: 'Jordan Lee', personhoodVerified: true, avatarInitials: 'JL' },
    { id: 'acc_aisha', name: 'Aisha Okafor', personhoodVerified: true, avatarInitials: 'AO' },
    { id: 'acc_sofia', name: 'Sofia Marchetti', personhoodVerified: true, avatarInitials: 'SM' },
    { id: 'acc_raj', name: 'Raj Banerjee', personhoodVerified: true, avatarInitials: 'RB' },
    { id: 'acc_lena', name: 'Lena Fortin', personhoodVerified: true, avatarInitials: 'LF' },
  ]

  const orgs: Org[] = [
    {
      id: 'org_shelter',
      name: 'Shelter Movers Halifax',
      blurb: {
        en: 'We move people fleeing abuse to safety, at no cost, with volunteer crews.',
        fr: 'Nous déplaçons gratuitement les personnes fuyant la violence vers un lieu sûr, avec des équipes bénévoles.',
      },
      mintCapPerMonth: 600,
      mintedThisMonth: 184,
      mintMonth: month,
    },
    {
      id: 'org_food',
      name: 'Feed Nova Scotia',
      blurb: {
        en: 'A provincial food bank network sorting and distributing donated food.',
        fr: 'Un réseau provincial de banques alimentaires qui trie et distribue les dons.',
      },
      mintCapPerMonth: 400,
      mintedThisMonth: 96,
      mintMonth: month,
    },
    {
      id: 'org_youth',
      name: 'Big Brothers Big Sisters',
      blurb: {
        en: 'Mentoring relationships for young people who need a steady adult.',
        fr: 'Des relations de mentorat pour les jeunes qui ont besoin d\'un adulte fiable.',
      },
      mintCapPerMonth: 300,
      mintedThisMonth: 41,
      mintMonth: month,
    },
  ]

  const opportunities: Opportunity[] = [
    {
      id: 'opp_move',
      orgId: 'org_shelter',
      title: { en: 'Saturday move crew', fr: 'Équipe de déménagement du samedi' },
      description: {
        en: 'Help a family move their belongings to a safe new home. Lifting involved, training provided.',
        fr: 'Aidez une famille à déménager ses biens vers un nouveau foyer sûr. Levage requis, formation fournie.',
      },
      category: 'shelter',
      skills: ['Lifting', 'Driving', 'Teamwork'],
      locationLabel: 'Dartmouth, NS',
      distanceKm: 4.2,
      languages: ['en', 'fr'],
      geofenceRadiusM: 150,
    },
    {
      id: 'opp_intake',
      orgId: 'org_shelter',
      title: { en: 'Intake desk support', fr: 'Soutien à l\'accueil' },
      description: {
        en: 'Greet families, log belongings, and keep the intake calm and organized.',
        fr: 'Accueillez les familles, consignez les biens et gardez l\'accueil calme et organisé.',
      },
      category: 'admin',
      skills: ['Organization', 'Calm', 'Bilingual'],
      locationLabel: 'Halifax, NS',
      distanceKm: 2.1,
      languages: ['en', 'fr'],
      geofenceRadiusM: 120,
    },
    {
      id: 'opp_sort',
      orgId: 'org_food',
      title: { en: 'Food sorting shift', fr: 'Quart de tri alimentaire' },
      description: {
        en: 'Sort and box donated food for distribution to member agencies.',
        fr: 'Triez et emballez les dons alimentaires pour les organismes membres.',
      },
      category: 'food',
      skills: ['Sorting', 'Standing', 'Detail'],
      locationLabel: 'Halifax, NS',
      distanceKm: 6.8,
      languages: ['en'],
      geofenceRadiusM: 200,
    },
    {
      id: 'opp_reading',
      orgId: 'org_youth',
      title: { en: 'After-school reading buddy', fr: 'Compagnon de lecture parascolaire' },
      description: {
        en: 'Read with a child once a week and help build their confidence.',
        fr: 'Lisez avec un enfant une fois par semaine et aidez-le à prendre confiance.',
      },
      category: 'youth',
      skills: ['Reading', 'Patience', 'Reliability'],
      locationLabel: 'Bedford, NS',
      distanceKm: 9.1,
      languages: ['en', 'fr'],
      geofenceRadiusM: 100,
    },
  ]

  // Maya's history at Shelter Movers: 3 approved shifts across 3 distinct weeks,
  // plus one upcoming shift that, once verified, crosses the Tier 2 + vesting threshold.
  const shifts: Shift[] = [
    {
      id: 'shift_m1',
      opportunityId: 'opp_move',
      orgId: 'org_shelter',
      date: mayaShift1,
      startTime: '09:00',
      endTime: '12:00',
      hours: 3,
      capacity: 6,
      filled: 6,
      creditsAward: 8,
      supervisorName: 'Dana R.',
    },
    {
      id: 'shift_m2',
      opportunityId: 'opp_move',
      orgId: 'org_shelter',
      date: mayaShift2,
      startTime: '09:00',
      endTime: '12:00',
      hours: 3,
      capacity: 6,
      filled: 6,
      creditsAward: 8,
      supervisorName: 'Dana R.',
    },
    {
      id: 'shift_m3',
      opportunityId: 'opp_move',
      orgId: 'org_shelter',
      date: mayaShift3,
      startTime: '09:00',
      endTime: '12:00',
      hours: 3,
      capacity: 6,
      filled: 6,
      creditsAward: 8,
      supervisorName: 'Dana R.',
    },
    {
      id: 'shift_m4',
      opportunityId: 'opp_move',
      orgId: 'org_shelter',
      date: demoSaturday,
      startTime: '09:00',
      endTime: '12:00',
      hours: 3,
      capacity: 6,
      filled: 4,
      creditsAward: 8,
      supervisorName: 'Dana R.',
    },
    // Last Saturday's move crew: the shift Jordan is waiting on in the sign-off queue.
    {
      id: 'shift_j1',
      opportunityId: 'opp_move',
      orgId: 'org_shelter',
      date: lastSaturday,
      startTime: '09:00',
      endTime: '12:00',
      hours: 3,
      capacity: 6,
      filled: 6,
      creditsAward: 8,
      supervisorName: 'Dana R.',
    },
    // Open upcoming shifts for the discovery + registration demo.
    {
      id: 'shift_intake',
      opportunityId: 'opp_intake',
      orgId: 'org_shelter',
      date: daysFromNow(3),
      startTime: '13:00',
      endTime: '16:00',
      hours: 3,
      capacity: 3,
      filled: 1,
      creditsAward: 7,
      supervisorName: 'Priya S.',
    },
    {
      id: 'shift_sort',
      opportunityId: 'opp_sort',
      orgId: 'org_food',
      date: daysFromNow(5),
      startTime: '10:00',
      endTime: '13:00',
      hours: 3,
      capacity: 12,
      filled: 5,
      creditsAward: 6,
      supervisorName: 'Tom H.',
    },
    {
      id: 'shift_reading',
      opportunityId: 'opp_reading',
      orgId: 'org_youth',
      date: daysFromNow(6),
      startTime: '15:30',
      endTime: '17:00',
      hours: 1.5,
      capacity: 4,
      filled: 2,
      creditsAward: 5,
      supervisorName: 'Marie C.',
    },
  ]

  const registrations: Registration[] = [
    { id: 'reg_m1', shiftId: 'shift_m1', accountId: 'acc_maya', status: 'approved', insideGeofence: true, secondKeyConfirmed: true, contributionMeaningful: true, signoffNote: 'Calm and dependable.' },
    { id: 'reg_m2', shiftId: 'shift_m2', accountId: 'acc_maya', status: 'approved', insideGeofence: true, secondKeyConfirmed: true, contributionMeaningful: true, signoffNote: 'Took the lead packing.' },
    { id: 'reg_m3', shiftId: 'shift_m3', accountId: 'acc_maya', status: 'approved', insideGeofence: true, secondKeyConfirmed: true, contributionMeaningful: true, signoffNote: 'Trained a newcomer.' },
    // Maya's 4th shift: registered, not yet checked in (the live demo path).
    { id: 'reg_m4', shiftId: 'shift_m4', accountId: 'acc_maya', status: 'registered', insideGeofence: false, secondKeyConfirmed: false },
    // Jordan: a single first shift last Saturday, awaiting sign-off, in the org queue.
    { id: 'reg_j1', shiftId: 'shift_j1', accountId: 'acc_jordan', status: 'awaiting_signoff', insideGeofence: true, secondKeyConfirmed: false },
    // Aisha: a long-standing volunteer (history summarized in relationships).
    { id: 'reg_a1', shiftId: 'shift_intake', accountId: 'acc_aisha', status: 'registered', insideGeofence: false, secondKeyConfirmed: false },
  ]

  const relationships: ServiceRelationship[] = [
    {
      accountId: 'acc_maya',
      orgId: 'org_shelter',
      approvedShifts: 3,
      distinctServiceWeeks: 3,
      totalHours: 9,
      firstDate: mayaShift1,
      lastDate: mayaShift3,
      roleProgression: 'Greeter → Move crew',
      secondKeyConfirmed: true,
      recurrence: 'Every other Saturday',
      tier: 1,
    },
    {
      accountId: 'acc_maya',
      orgId: 'org_food',
      approvedShifts: 1,
      distinctServiceWeeks: 1,
      totalHours: 3,
      firstDate: addDays(demoSaturday, -63),
      lastDate: addDays(demoSaturday, -63),
      roleProgression: 'Sorter',
      secondKeyConfirmed: true,
      recurrence: 'One-time',
      tier: 1,
    },
    {
      accountId: 'acc_jordan',
      orgId: 'org_shelter',
      approvedShifts: 0,
      distinctServiceWeeks: 0,
      totalHours: 0,
      firstDate: lastSaturday,
      lastDate: lastSaturday,
      roleProgression: 'Greeter',
      secondKeyConfirmed: false,
      recurrence: 'One-time',
      tier: 1,
    },
    {
      accountId: 'acc_aisha',
      orgId: 'org_shelter',
      approvedShifts: 9,
      distinctServiceWeeks: 8,
      totalHours: 31,
      firstDate: addDays(demoSaturday, -175),
      lastDate: lastSaturday,
      roleProgression: 'Greeter → Move lead → Trainer',
      secondKeyConfirmed: true,
      recurrence: 'Weekly',
      tier: 2,
    },
  ]

  const integrity: IntegrityScore[] = [
    {
      accountId: 'acc_maya',
      score: 64,
      components: { continuity: 72, corroboration: 80, attestation: 75, depth: 55, followThrough: 40, reliability: 70, hours: 35 },
    },
    {
      accountId: 'acc_jordan',
      score: 16,
      components: { continuity: 5, corroboration: 0, attestation: 10, depth: 5, followThrough: 0, reliability: 0, hours: 12 },
    },
    {
      accountId: 'acc_aisha',
      score: 88,
      components: { continuity: 95, corroboration: 90, attestation: 92, depth: 88, followThrough: 80, reliability: 95, hours: 60 },
    },
  ]

  // Maya's escrowed credits from her 3 verified shifts (not yet vested: she has not
  // crossed the continuity-plus-depth threshold).
  const ledger: CreditLedgerEntry[] = [
    { id: 'led_1', accountId: 'acc_maya', orgId: 'org_shelter', type: 'mint', amount: 8, vested: false, sourceKind: 'hour_log', label: { en: `Move crew, ${mayaShift1}`, fr: `Équipe de déménagement, ${mayaShift1}` }, date: mayaShift1 },
    { id: 'led_2', accountId: 'acc_maya', orgId: 'org_shelter', type: 'mint', amount: 8, vested: false, sourceKind: 'hour_log', label: { en: `Move crew, ${mayaShift2}`, fr: `Équipe de déménagement, ${mayaShift2}` }, date: mayaShift2 },
    { id: 'led_3', accountId: 'acc_maya', orgId: 'org_shelter', type: 'mint', amount: 8, vested: false, sourceKind: 'hour_log', label: { en: `Move crew, ${mayaShift3}`, fr: `Équipe de déménagement, ${mayaShift3}` }, date: mayaShift3 },
  ]

  const mentors: MentorProfile[] = [
    {
      accountId: 'acc_sofia',
      name: 'Sofia Marchetti',
      title: { en: 'Senior UX Designer', fr: 'Designer UX senior' },
      bio: {
        en: 'Twelve years in product design. I mentor because someone once did it for me.',
        fr: 'Douze ans en design de produit. Je fais du mentorat parce qu\'on l\'a fait pour moi.',
      },
      skills: ['UX', 'Portfolio', 'Career'],
      sessionsDelivered: 38,
    },
    {
      accountId: 'acc_raj',
      name: 'Raj Banerjee',
      title: { en: 'Data Analytics Lead', fr: 'Responsable analytique de données' },
      bio: {
        en: 'I help people break into analytics without a fancy degree.',
        fr: 'J\'aide les gens à percer en analytique sans diplôme prestigieux.',
      },
      skills: ['SQL', 'Analytics', 'Interviews'],
      sessionsDelivered: 21,
    },
    {
      accountId: 'acc_lena',
      name: 'Lena Fortin',
      title: { en: 'Nonprofit Operations Director', fr: 'Directrice des opérations à but non lucratif' },
      bio: {
        en: 'Twenty years running programs. Ask me anything about working in the sector.',
        fr: 'Vingt ans à gérer des programmes. Posez-moi vos questions sur le secteur.',
      },
      skills: ['Nonprofit', 'Operations', 'Grants'],
      sessionsDelivered: 15,
    },
  ]

  const offers: RewardOffer[] = [
    {
      id: 'off_resume',
      mentorId: 'acc_lena',
      mentorName: 'Lena Fortin',
      mentorTitle: { en: 'Nonprofit Operations Director', fr: 'Directrice des opérations' },
      kind: 'workshop',
      title: { en: 'Resume lab (group)', fr: 'Atelier CV (groupe)' },
      blurb: {
        en: 'A 90-minute group session to sharpen your resume with real feedback.',
        fr: 'Une session de groupe de 90 minutes pour améliorer votre CV avec de vrais retours.',
      },
      creditCost: 15,
      requiresSustained: false,
    },
    {
      id: 'off_interview',
      mentorId: 'acc_raj',
      mentorName: 'Raj Banerjee',
      mentorTitle: { en: 'Data Analytics Lead', fr: 'Responsable analytique' },
      kind: 'career',
      title: { en: 'Mock interview (group)', fr: 'Entrevue simulée (groupe)' },
      blurb: {
        en: 'Practice common interview questions and get coached on your answers.',
        fr: 'Pratiquez les questions d\'entrevue courantes et soyez coaché sur vos réponses.',
      },
      creditCost: 18,
      requiresSustained: false,
    },
    {
      id: 'off_ux',
      mentorId: 'acc_sofia',
      mentorName: 'Sofia Marchetti',
      mentorTitle: { en: 'Senior UX Designer', fr: 'Designer UX senior' },
      kind: 'mentorship',
      title: { en: '1:1 with a UX lead', fr: 'Tête-à-tête avec une responsable UX' },
      blurb: {
        en: 'A private 45-minute mentorship session tailored to your goals.',
        fr: 'Une session de mentorat privée de 45 minutes adaptée à vos objectifs.',
      },
      creditCost: 30,
      requiresSustained: true,
    },
    {
      id: 'off_data',
      mentorId: 'acc_raj',
      mentorName: 'Raj Banerjee',
      mentorTitle: { en: 'Data Analytics Lead', fr: 'Responsable analytique' },
      kind: 'mentorship',
      title: { en: '1:1 analytics career chat', fr: 'Tête-à-tête carrière en analytique' },
      blurb: {
        en: 'A private 45-minute session on breaking into data work.',
        fr: 'Une session privée de 45 minutes pour percer dans les données.',
      },
      creditCost: 30,
      requiresSustained: true,
    },
  ]

  const bookings: Booking[] = []

  return {
    accounts,
    orgs,
    opportunities,
    shifts,
    registrations,
    relationships,
    integrity,
    ledger,
    offers,
    bookings,
    mentors,
  }
}

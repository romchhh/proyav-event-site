import type { TicketTierId, TicketWave } from '@/lib/tickets'

export type ScheduleItem = {
  time: string
  title: string
  details?: string
  note?: string
}

export type FaqItem = {
  question: string
  answer: string
}

export type SpeakerItem = {
  id: string
  name: string
  role: string
  bio: string
  photo?: string
  isOpenSlot?: boolean
}

export type OrganizerProfile = {
  name: string
  role: string
  bio: string
}

export type FeatureItem = {
  title: string
  desc: string
}

export type TicketFeature = {
  text: string
  included: boolean
}

export type TicketTierContent = {
  id: TicketTierId
  emoji: string
  name: string
  featured: boolean
  limitNote: string
  features: TicketFeature[]
  tagline?: string
}

export type PricingMatrix = Record<TicketTierId, Record<TicketWave, number>>
export type CapacityMatrix = Record<TicketTierId, Record<TicketWave, number>>

export type SiteContent = {
  event: {
    name: string
    date: string
    dateShort: string
    time: string
    venueUa: string
    venueEn: string
    venueFull: string
  }
  links: {
    instagram: string
    threads: string
    telegram: string
    maps: string
    email: string
    privacy: string
    terms: string
    telebots: string
    becomeSpeaker: string
    becomePartner: string
  }
  assets: {
    logo: string
    heroDesktop: string
    heroMobile: string
    organizers: string
    social: { threads: string }
  }
  metadata: {
    title: string
    description: string
  }
  hero: {
    headlineLine1: string
    headlineLine2: string
    headlineAccent: string
    descriptionBrand: string
    descriptionBefore: string
    descriptionHighlight: string
    descriptionAfter: string
    badgeVenue: string
    badgeTime: string
    cta: string
  }
  about: {
    heading: string
    lead: string
    locationsTitle: string
    locationsLead: string
    locationsList: string[]
    locationsClosing: string
    features: FeatureItem[]
  }
  organizers: {
    heading: string
    intro: string[]
    namesHeading: string
    photoAlt: string
    profiles: OrganizerProfile[]
    quote: string[]
  }
  gallery: {
    heading: string
    subheading: string
    images: string[]
  }
  schedule: {
    heading: string
    items: ScheduleItem[]
  }
  speakers: {
    heading: string
    subheading: string
    items: SpeakerItem[]
    emptySlotTitle: string
    emptySlotBio: string
    emptySlotCta: string
  }
  partners: {
    heading: string
    subheading: string
    cta: string
  }
  tickets: {
    heading: string
    tiers: TicketTierContent[]
    waveLabels: Record<TicketWave, string>
    priceMatrix: PricingMatrix
    capacityMatrix: CapacityMatrix
    waveWindows: Record<TicketWave, { start: string; end: string }>
    promoCodes: Record<string, number>
  }
  venue: {
    heading: string
    subheading: string
    description: string
    mapsEmbedUrl: string
  }
  faq: {
    heading: string
    items: FaqItem[]
  }
  social: {
    heading: string
    subheading: string
    items: Array<{ label: string; handle: string; href: string }>
  }
  footer: {
    tagline: string
    brand: string
    credit: string
  }
  navbar: {
    links: Array<{ href: string; label: string }>
  }
}

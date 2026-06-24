import { getSiteContent } from '@/lib/site-content'
import type { SiteContent } from '@/lib/site-content/types'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import AboutSection from './components/AboutSection'
import OrganizersSection from './components/OrganizersSection'
import GallerySection from './components/GallerySection'
import ScheduleSection from './components/ScheduleSection'
import SpeakersSection from './components/SpeakersSection'
import PartnersSection from './components/PartnersSection'
import TicketsSection from './components/TicketsSection'
import VenueSection from './components/VenueSection'
import FAQSection from './components/FAQSection'
import SocialSection from './components/SocialSection'
import Footer from './components/Footer'

export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  const content = await getSiteContent()
  return {
    title: content.metadata.title,
    description: content.metadata.description,
    openGraph: {
      title: content.metadata.title,
      description: content.metadata.description,
    },
    twitter: {
      title: content.metadata.title,
      description: content.metadata.description,
    },
  }
}

export default async function Home() {
  const content = await getSiteContent()

  return (
    <>
      <Navbar transparent content={content} />
      <main>
        <Hero content={content} />
        <AboutSection content={content} />
        <OrganizersSection content={content} />
        <GallerySection content={content} />
        <ScheduleSection content={content} />
        <SpeakersSection content={content} />
        <PartnersSection content={content} />
        <TicketsSection content={content} />
        <VenueSection content={content} />
        <FAQSection content={content} />
        <SocialSection content={content} />
      </main>
      <Footer content={content} />
    </>
  )
}

export type { SiteContent }

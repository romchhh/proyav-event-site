import type { Metadata } from 'next'
import CheckoutShell from './components/checkout/CheckoutShell'
import MetaPixel from '@/components/MetaPixel'
import './globals.css'
import './proyav.css'
import { ASSETS } from './constants'
import { getSiteContent } from '@/lib/site-content'
import { getSiteUrl } from '@/lib/site-url'

const siteUrl = getSiteUrl()

export async function generateMetadata(): Promise<Metadata> {
  const content = await getSiteContent()

  return {
    metadataBase: new URL(siteUrl),
    title: content.metadata.title,
    description: content.metadata.description,
    icons: {
      icon: content.assets.logo || ASSETS.logo,
      apple: content.assets.logo || ASSETS.logo,
    },
    openGraph: {
      type: 'website',
      locale: 'uk_UA',
      url: siteUrl,
      siteName: content.event.name,
      title: content.metadata.title,
      description: content.metadata.description,
      images: [
        {
          url: content.assets.logo || ASSETS.logo,
          alt: content.event.name,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: content.metadata.title,
      description: content.metadata.description,
      images: [content.assets.logo || ASSETS.logo],
    },
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <MetaPixel />
        <div className="proyav-page">
          <CheckoutShell>{children}</CheckoutShell>
        </div>
      </body>
    </html>
  )
}

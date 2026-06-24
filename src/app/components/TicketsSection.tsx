'use client'

import { useEffect, useState } from 'react'
import type { SiteContent } from '@/lib/site-content/types'
import type { TicketTierId, TicketWave } from '@/lib/tickets'
import MarkdownContent from '@/components/MarkdownContent'
import OpenCheckoutButton from './checkout/OpenCheckoutButton'
import styles from './TicketsSection.module.css'

type TierPricing = {
  id: TicketTierId
  price: number
  wave: TicketWave
  remaining: number
  available: boolean
}

function formatPrice(amount: number) {
  return new Intl.NumberFormat('uk-UA').format(amount)
}

export default function TicketsSection({ content }: { content: SiteContent }) {
  const { tickets, event } = content
  const [pricing, setPricing] = useState<TierPricing[]>([])
  const [dateWave, setDateWave] = useState<TicketWave>('early')
  const [waveLabels, setWaveLabels] = useState(content.tickets.waveLabels)

  useEffect(() => {
    fetch('/api/tickets/pricing')
      .then((response) => response.json())
      .then((data: { tiers: TierPricing[]; dateWave: TicketWave; waveLabels: Record<TicketWave, string> }) => {
        setPricing(data.tiers)
        setDateWave(data.dateWave)
        setWaveLabels(data.waveLabels)
      })
      .catch(() => {})
  }, [])

  const getPrice = (tierId: TicketTierId) =>
    pricing.find((item) => item.id === tierId)?.price ?? null

  const isAvailable = (tierId: TicketTierId) =>
    pricing.find((item) => item.id === tierId)?.available ?? true

  return (
    <section id="kvitky" className={styles.section}>
      <div className={`sectionInner ${styles.inner}`}>
        <div className={styles.header}>
          <h2 className="sectionHeading">{tickets.heading}</h2>
          <p className={styles.meta}>
            {event.dateShort} <span className={styles.dot} aria-hidden="true" /> {event.venueFull}
          </p>
          <p className={styles.waveBadge}>{waveLabels[dateWave]}</p>
        </div>

        <div className={styles.grid}>
          {tickets.tiers.map((tier) => {
            const price = getPrice(tier.id)
            const available = isAvailable(tier.id)

            return (
              <article
                key={tier.id}
                className={`${styles.card} ${tier.featured ? styles.featured : ''} ${tier.id === 'golden' ? styles.golden : ''} ${tier.id === 'vip' ? styles.vip : ''}`}
              >
                {tier.featured && <span className={styles.badge}>Популярний</span>}
                <div className={styles.tierHead}>
                  <span className={styles.tierEmoji} aria-hidden="true">{tier.emoji}</span>
                  <h3 className={styles.tierName}>{tier.name}</h3>
                </div>
                <p className={styles.price}>
                  {price ? (
                    <>
                      <span className={styles.priceFrom}>від</span>
                      <span className={styles.priceValue}>{formatPrice(price)}</span>
                      <span className={styles.priceCurrency}>грн</span>
                    </>
                  ) : (
                    <span className={styles.priceLoading}>...</span>
                  )}
                </p>
                <div className={styles.tierNote}>
                  ⚠️ <MarkdownContent inline>{tier.limitNote}</MarkdownContent>
                </div>
                <ul className={styles.features}>
                  {tier.features.map((feature, index) => (
                    <li
                      key={`${tier.id}-feature-${index}`}
                      className={feature.included ? styles.featureIncluded : styles.featureOptional}
                    >
                      <MarkdownContent inline>{feature.text}</MarkdownContent>
                    </li>
                  ))}
                </ul>
                {tier.tagline && (
                  <div className={styles.tagline}>
                    <MarkdownContent inline>{tier.tagline}</MarkdownContent>
                  </div>
                )}
                <OpenCheckoutButton tierId={tier.id} className={styles.buy} disabled={!available}>
                  {available ? 'Оплатити' : 'Немає в наявності'}
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M2 14 L14 2 M6 2 H14 V10"/>
                  </svg>
                </OpenCheckoutButton>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}

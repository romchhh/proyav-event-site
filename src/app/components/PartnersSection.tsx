import Image from 'next/image'
import type { SiteContent } from '@/lib/site-content/types'
import MarkdownContent from '@/components/MarkdownContent'
import styles from './PartnersSection.module.css'

export default function PartnersSection({ content }: { content: SiteContent }) {
  const { partners, links } = content
  const items = partners.items ?? []

  return (
    <section id="partnery" className={styles.section}>
      <div className={`sectionInner ${styles.inner}`}>
        <div className={styles.card}>
          <h2 className={styles.heading}>{partners.heading}</h2>
          <div className={styles.text}>
            <MarkdownContent>{partners.subheading}</MarkdownContent>
          </div>

          {items.length > 0 && (
            <ul className={styles.logos}>
              {items.map((partner) => {
                const logo = (
                  <span className={styles.logoFrame}>
                    <Image
                      src={partner.logo}
                      alt={partner.name}
                      fill
                      sizes="160px"
                      className={styles.logoImage}
                    />
                  </span>
                )

                return (
                  <li key={partner.id} className={styles.logoItem}>
                    {partner.href ? (
                      <a
                        href={partner.href}
                        className={styles.logoLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={partner.name}
                      >
                        {logo}
                      </a>
                    ) : (
                      logo
                    )}
                    <span className={styles.logoName}>{partner.name}</span>
                  </li>
                )
              })}
            </ul>
          )}

          <a href={links.becomePartner} className={styles.cta}>
            <span className={styles.ctaPlus} aria-hidden="true">+</span>
            {partners.cta}
          </a>
          <a href={`mailto:${links.email}`} className={styles.email}>
            {links.email}
          </a>
        </div>
      </div>
    </section>
  )
}

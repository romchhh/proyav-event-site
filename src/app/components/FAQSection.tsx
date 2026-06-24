'use client'

import { useState } from 'react'
import type { SiteContent } from '@/lib/site-content/types'
import MarkdownContent from '@/components/MarkdownContent'
import styles from './FAQSection.module.css'

export default function FAQSection({ content }: { content: SiteContent }) {
  const { faq } = content
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section id="faq" className={styles.section}>
      <div className={`sectionInner ${styles.inner}`}>
        <div className={styles.header}>
          <h2 className="sectionHeading">{faq.heading}</h2>
        </div>

        <div className={styles.list}>
          {faq.items.map((item, index) => {
            const isOpen = openIndex === index

            return (
              <div key={item.question} className={`${styles.item} ${isOpen ? styles.open : ''}`}>
                <button
                  type="button"
                  className={styles.question}
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  aria-expanded={isOpen}
                >
                  <span>{item.question}</span>
                  <span className={styles.icon} aria-hidden="true">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                      <path d="M7 2 V12 M2 7 H12" />
                    </svg>
                  </span>
                </button>
                {isOpen && (
                  <div className={styles.answer}>
                    <MarkdownContent>{item.answer}</MarkdownContent>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

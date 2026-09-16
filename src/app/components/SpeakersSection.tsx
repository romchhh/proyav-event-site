'use client'

import Image from 'next/image'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { SiteContent } from '@/lib/site-content/types'
import MarkdownContent from '@/components/MarkdownContent'
import styles from './SpeakersSection.module.css'

const EMPTY_SLOTS = 1

function ArrowIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 3 L13 9 L7 15" />
    </svg>
  )
}

export default function SpeakersSection({ content }: { content: SiteContent }) {
  const { speakers, links } = content
  const slideCount = speakers.items.length + EMPTY_SLOTS
  const trackRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  const updateActiveIndex = useCallback(() => {
    const track = trackRef.current
    if (!track) return

    const cards = Array.from(track.children) as HTMLElement[]
    if (!cards.length) return

    const trackLeft = track.scrollLeft
    let closest = 0
    let minDist = Infinity

    cards.forEach((card, index) => {
      const dist = Math.abs(card.offsetLeft - trackLeft)
      if (dist < minDist) {
        minDist = dist
        closest = index
      }
    })

    setActiveIndex(closest)
  }, [])

  useEffect(() => {
    const track = trackRef.current
    if (!track) return

    updateActiveIndex()
    track.addEventListener('scroll', updateActiveIndex, { passive: true })
    window.addEventListener('resize', updateActiveIndex)

    return () => {
      track.removeEventListener('scroll', updateActiveIndex)
      window.removeEventListener('resize', updateActiveIndex)
    }
  }, [updateActiveIndex])

  const scrollToIndex = (index: number) => {
    const track = trackRef.current
    if (!track) return

    const card = track.children[index] as HTMLElement | undefined
    card?.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' })
    setActiveIndex(index)
  }

  const scrollByDirection = (direction: -1 | 1) => {
    scrollToIndex(Math.max(0, Math.min(slideCount - 1, activeIndex + direction)))
  }

  return (
    <section id="spikery" className={styles.section}>
      <div className={`sectionInner ${styles.inner}`}>
        <div className={styles.header}>
          <h2 className="sectionHeading">{speakers.heading}</h2>
          <div className="sectionSubheading">
            <MarkdownContent>{speakers.subheading}</MarkdownContent>
          </div>
        </div>

        <div className={styles.carousel}>
          <div className={styles.trackWrap}>
            <div className={styles.track} ref={trackRef}>
              {speakers.items.map((speaker, index) => (
                <article key={speaker.id} className={styles.card}>
                  <div className={styles.photo}>
                    {speaker.photo ? (
                      <Image
                        src={speaker.photo}
                        alt={speaker.name}
                        width={640}
                        height={800}
                        sizes="(max-width: 900px) 78vw, 320px"
                        className={styles.photoImage}
                      />
                    ) : (
                      <span>{index + 1}</span>
                    )}
                  </div>
                  <div className={styles.body}>
                    <h3>{speaker.name}</h3>
                    <p className={styles.role}>{speaker.role}</p>
                    <div className={styles.bio}>
                      <MarkdownContent>{speaker.bio}</MarkdownContent>
                    </div>
                  </div>
                </article>
              ))}

              <article className={`${styles.card} ${styles.empty}`}>
                <div className={styles.photoEmpty}>
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                    <circle cx="16" cy="12" r="5" />
                    <path d="M6 28c0-5.5 4.5-10 10-10s10 4.5 10 10" />
                  </svg>
                </div>
                <div className={styles.body}>
                  <h3>{speakers.emptySlotTitle}</h3>
                  <div className={styles.bio}>
                    <MarkdownContent>{speakers.emptySlotBio}</MarkdownContent>
                  </div>
                  <div className={styles.ctaWrap}>
                    <a
                      href={links.becomeSpeaker}
                      className={`btnGhost ${styles.cta}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <span className={styles.ctaPlus} aria-hidden="true">+</span>
                      {speakers.emptySlotCta}
                    </a>
                    <a href={`mailto:${links.email}`} className={styles.ctaEmail}>
                      {links.email}
                    </a>
                  </div>
                </div>
              </article>
            </div>
          </div>

          <div className={styles.nav}>
            <button type="button" className={styles.arrow} onClick={() => scrollByDirection(-1)} disabled={activeIndex === 0} aria-label="Попередній спікер">
              <span className={styles.arrowPrev}><ArrowIcon /></span>
            </button>

            <div className={styles.dots} role="tablist" aria-label="Навігація спікерами">
              {Array.from({ length: slideCount }).map((_, index) => (
                <button
                  key={index}
                  type="button"
                  role="tab"
                  className={`${styles.dot} ${index === activeIndex ? styles.dotActive : ''}`}
                  onClick={() => scrollToIndex(index)}
                  aria-label={`Спікер ${index + 1}`}
                  aria-selected={index === activeIndex}
                />
              ))}
            </div>

            <button type="button" className={styles.arrow} onClick={() => scrollByDirection(1)} disabled={activeIndex === slideCount - 1} aria-label="Наступний спікер">
              <ArrowIcon />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

'use client'

import Image from 'next/image'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { SiteContent } from '@/lib/site-content/types'
import MarkdownContent from '@/components/MarkdownContent'
import styles from './GallerySection.module.css'

function CloseIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
      <path d="M4 4 L18 18 M18 4 L4 18" />
    </svg>
  )
}

function ArrowIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M8 4 L16 11 L8 18" />
    </svg>
  )
}

export default function GallerySection({ content }: { content: SiteContent }) {
  const images = content.gallery.images
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const lightboxTrackRef = useRef<HTMLDivElement>(null)
  const wasLightboxOpenRef = useRef(false)

  const closeLightbox = useCallback(() => {
    setActiveIndex(null)
  }, [])

  const openLightbox = (index: number) => {
    setActiveIndex(index)
  }

  const scrollToIndex = useCallback((index: number, behavior: ScrollBehavior = 'smooth') => {
    const track = lightboxTrackRef.current
    if (!track) return

    const slide = track.children[index] as HTMLElement | undefined
    slide?.scrollIntoView({ behavior, inline: 'center', block: 'nearest' })
    setActiveIndex(index)
  }, [])

  const goToPrev = useCallback(() => {
    if (activeIndex === null) return
    scrollToIndex(Math.max(0, activeIndex - 1))
  }, [activeIndex, scrollToIndex])

  const goToNext = useCallback(() => {
    if (activeIndex === null) return
    scrollToIndex(Math.min(images.length - 1, activeIndex + 1))
  }, [activeIndex, scrollToIndex])

  const updateIndexFromScroll = useCallback(() => {
    const track = lightboxTrackRef.current
    if (!track) return

    const slides = Array.from(track.children) as HTMLElement[]
    if (!slides.length) return

    const trackCenter = track.scrollLeft + track.clientWidth / 2
    let closest = 0
    let minDist = Infinity

    slides.forEach((slide, index) => {
      const slideCenter = slide.offsetLeft + slide.offsetWidth / 2
      const dist = Math.abs(slideCenter - trackCenter)
      if (dist < minDist) {
        minDist = dist
        closest = index
      }
    })

    setActiveIndex(closest)
  }, [])

  useEffect(() => {
    const isOpen = activeIndex !== null

    if (isOpen) {
      document.body.style.overflow = 'hidden'
      if (!wasLightboxOpenRef.current && activeIndex !== null) {
        requestAnimationFrame(() => {
          scrollToIndex(activeIndex, 'instant')
        })
      }
    } else {
      document.body.style.overflow = ''
    }

    wasLightboxOpenRef.current = isOpen
  }, [activeIndex, scrollToIndex])

  useEffect(() => {
    if (activeIndex === null) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeLightbox()
      if (event.key === 'ArrowLeft') goToPrev()
      if (event.key === 'ArrowRight') goToNext()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [activeIndex, closeLightbox, goToPrev, goToNext])

  return (
    <section id="galereya" className={styles.section}>
      <div className={`sectionInner ${styles.inner}`}>
        <div className={styles.header}>
          <h2 className="sectionHeading">{content.gallery.heading}</h2>
          <div className="sectionSubheading">
            <MarkdownContent>{content.gallery.subheading}</MarkdownContent>
          </div>
        </div>

        <div className={styles.trackWrap}>
          <div className={styles.track}>
            {images.map((src, index) => (
              <button
                key={src}
                type="button"
                className={styles.item}
                onClick={() => openLightbox(index)}
                aria-label={`Відкрити фото ${index + 1}`}
              >
                <Image
                  src={src}
                  alt={`PROяв івент — фото ${index + 1}`}
                  fill
                  sizes="280px"
                  className={styles.image}
                />
              </button>
            ))}
          </div>
        </div>
      </div>

      {activeIndex !== null && (
        <div
          className={styles.lightbox}
          role="dialog"
          aria-modal="true"
          aria-label="Галерея PROяв івент"
          onClick={closeLightbox}
        >
          <div className={styles.lightboxTop}>
            <p className={styles.lightboxCounter}>
              {activeIndex + 1} / {images.length}
            </p>
            <button
              type="button"
              className={styles.lightboxClose}
              onClick={closeLightbox}
              aria-label="Закрити галерею"
            >
              <CloseIcon />
            </button>
          </div>

          <button
            type="button"
            className={`${styles.lightboxArrow} ${styles.lightboxArrowPrev}`}
            onClick={(event) => {
              event.stopPropagation()
              goToPrev()
            }}
            disabled={activeIndex === 0}
            aria-label="Попереднє фото"
          >
            <span className={styles.lightboxArrowFlip}>
              <ArrowIcon />
            </span>
          </button>

          <div
            className={styles.lightboxTrack}
            ref={lightboxTrackRef}
            onClick={(event) => event.stopPropagation()}
            onScroll={updateIndexFromScroll}
          >
            {images.map((src, index) => (
              <figure key={src} className={styles.lightboxSlide}>
                <Image
                  src={src}
                  alt={`PROяв івент — фото ${index + 1}`}
                  fill
                  sizes="(max-width: 900px) 100vw, 90vw"
                  className={styles.lightboxImage}
                  priority={index === activeIndex}
                />
              </figure>
            ))}
          </div>

          <button
            type="button"
            className={`${styles.lightboxArrow} ${styles.lightboxArrowNext}`}
            onClick={(event) => {
              event.stopPropagation()
              goToNext()
            }}
            disabled={activeIndex === images.length - 1}
            aria-label="Наступне фото"
          >
            <ArrowIcon />
          </button>
        </div>
      )}
    </section>
  )
}

import { cache } from 'react'
import { unstable_noStore as noStore } from 'next/cache'
import { getStoredSiteContentJson, saveStoredSiteContentJson } from '../db'
import { DEFAULT_SITE_CONTENT } from './defaults'
import type { SiteContent } from './types'

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function mergeContent(base: SiteContent, patch: Partial<SiteContent>): SiteContent {
  const result: SiteContent = { ...base }

  for (const key of Object.keys(patch) as Array<keyof SiteContent>) {
    const value = patch[key]
    if (value === undefined) continue

    const current = base[key]

    if (Array.isArray(value)) {
      ;(result as Record<keyof SiteContent, SiteContent[keyof SiteContent]>)[key] = value as SiteContent[typeof key]
      continue
    }

    if (isPlainObject(value) && isPlainObject(current)) {
      ;(result as Record<keyof SiteContent, SiteContent[keyof SiteContent]>)[key] = {
        ...current,
        ...value,
      } as SiteContent[typeof key]
      continue
    }

    ;(result as Record<keyof SiteContent, SiteContent[keyof SiteContent]>)[key] = value as SiteContent[typeof key]
  }

  return result
}

function normalizeStoredContent(stored: Partial<SiteContent>): Partial<SiteContent> {
  const normalized: Partial<SiteContent> = { ...stored }

  if (Array.isArray(stored.schedule)) {
    normalized.schedule = {
      heading: DEFAULT_SITE_CONTENT.schedule.heading,
      items: stored.schedule,
    }
  }

  if (Array.isArray(stored.faq)) {
    normalized.faq = {
      heading: DEFAULT_SITE_CONTENT.faq.heading,
      items: stored.faq,
    }
  }

  if (stored.gallery && typeof stored.gallery === 'object' && !('heading' in stored.gallery)) {
    const legacyGallery = stored.gallery as { subheading?: string; images?: string[] }
    normalized.gallery = {
      heading: DEFAULT_SITE_CONTENT.gallery.heading,
      subheading: legacyGallery.subheading ?? DEFAULT_SITE_CONTENT.gallery.subheading,
      images: legacyGallery.images ?? DEFAULT_SITE_CONTENT.gallery.images,
    }
  }

  return normalized
}

export const getSiteContent = cache(async (): Promise<SiteContent> => {
  noStore()

  const stored = getStoredSiteContentJson()
  if (!stored) return DEFAULT_SITE_CONTENT
  return mergeContent(DEFAULT_SITE_CONTENT, normalizeStoredContent(stored))
})

export async function saveSiteContent(patch: Partial<SiteContent>) {
  const stored = getStoredSiteContentJson()
  const base = stored
    ? mergeContent(DEFAULT_SITE_CONTENT, normalizeStoredContent(stored))
    : DEFAULT_SITE_CONTENT
  const next = mergeContent(base, patch)
  saveStoredSiteContentJson(next)
  return next
}

export { DEFAULT_SITE_CONTENT }

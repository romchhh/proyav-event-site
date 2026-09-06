'use client'

import { useRef, useState, type DragEvent, type ReactNode } from 'react'
import type { SiteContent } from '@/lib/site-content/types'
import MarkdownContent from '@/components/MarkdownContent'

export function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
}

export async function uploadImage(file: File) {
  const formData = new FormData()
  formData.append('file', file)
  const response = await fetch('/api/admin/upload', { method: 'POST', body: formData })
  const data = (await response.json()) as { url?: string; error?: string }
  if (!response.ok || !data.url) throw new Error(data.error ?? 'Upload failed')
  return data.url
}

async function uploadImages(files: File[]) {
  const images = files.filter((file) => file.type.startsWith('image/'))
  if (images.length === 0) throw new Error('Оберіть зображення')
  const urls: string[] = []
  for (const file of images) {
    urls.push(await uploadImage(file))
  }
  return urls
}

type FieldProps = {
  label: string
  value: string
  onChange: (value: string) => void
  multiline?: boolean
  markdown?: boolean
}

export function Field({ label, value, onChange, multiline, markdown }: FieldProps) {
  if (multiline && markdown) {
    return (
      <div className="adminField adminMarkdownField">
        <span>{label}</span>
        <p className="adminHint">
          Markdown: **жирний**, *курсив*, [посилання](https://), списки, &gt; цитата
        </p>
        <textarea rows={5} value={value} onChange={(event) => onChange(event.target.value)} />
        <div className="adminMarkdownPreview">
          <span className="adminMarkdownPreviewLabel">Перегляд</span>
          {value.trim() ? <MarkdownContent>{value}</MarkdownContent> : <p className="adminHint">Тут зʼявиться відформатований текст</p>}
        </div>
      </div>
    )
  }

  return (
    <label className="adminField">
      <span>{label}</span>
      {multiline ? (
        <textarea rows={3} value={value} onChange={(event) => onChange(event.target.value)} />
      ) : (
        <input type="text" value={value} onChange={(event) => onChange(event.target.value)} />
      )}
    </label>
  )
}

type ImageFieldProps = {
  label: string
  value: string
  onChange: (value: string) => void
}

export function ImageField({ label, value, onChange }: ImageFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState('')

  const handleFiles = async (files: FileList | File[] | null) => {
    const file = files?.[0]
    if (!file) return

    setUploading(true)
    setError('')
    try {
      const url = await uploadImage(file)
      onChange(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося завантажити зображення')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const onDrop = async (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setDragOver(false)
    await handleFiles(event.dataTransfer.files)
  }

  return (
    <div className="adminImageField">
      <span className="adminImageLabel">{label}</span>

      <div
        className={`adminDropZone${dragOver ? ' adminDropZoneActive' : ''}${value ? ' adminDropZoneFilled' : ''}`}
        onDragEnter={(event) => {
          event.preventDefault()
          setDragOver(true)
        }}
        onDragOver={(event) => {
          event.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={(event) => {
          event.preventDefault()
          setDragOver(false)
        }}
        onDrop={(event) => void onDrop(event)}
        onClick={() => !uploading && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            inputRef.current?.click()
          }
        }}
      >
        {value ? (
          <div className="adminDropPreviewWrap">
            <img src={value} alt="" className="adminDropPreview" />
            <div className="adminDropPreviewMeta">
              <p className="adminDropTitle">{uploading ? 'Завантажуємо…' : 'Перетягніть нове фото сюди'}</p>
              <p className="adminDropHint">або натисніть, щоб обрати файл</p>
            </div>
          </div>
        ) : (
          <div className="adminDropEmpty">
            <p className="adminDropTitle">{uploading ? 'Завантажуємо…' : 'Перетягніть фото сюди'}</p>
            <p className="adminDropHint">JPG, PNG, WEBP, GIF · до 8 МБ</p>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          hidden
          disabled={uploading}
          onChange={(event) => void handleFiles(event.target.files)}
        />
      </div>

      <div className="adminImageActions">
        <button
          type="button"
          className="adminGhostBtn"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? 'Завантажуємо…' : value ? 'Замінити' : 'Обрати файл'}
        </button>
        {value ? (
          <button type="button" className="adminDangerBtn" disabled={uploading} onClick={() => onChange('')}>
            Очистити
          </button>
        ) : null}
      </div>

      {value ? (
        <label className="adminField">
          <span>URL</span>
          <input type="text" value={value} onChange={(event) => onChange(event.target.value)} />
        </label>
      ) : null}

      {error ? <p className="adminImageError">{error}</p> : null}
    </div>
  )
}

type GalleryImagesFieldProps = {
  images: string[]
  onChange: (images: string[]) => void
}

export function GalleryImagesField({ images, onChange }: GalleryImagesFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null)
  const [error, setError] = useState('')

  const addFiles = async (files: FileList | File[] | null) => {
    if (!files || files.length === 0) return
    setUploading(true)
    setError('')
    try {
      const urls = await uploadImages(Array.from(files))
      onChange([...images, ...urls])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося завантажити зображення')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const moveImage = (from: number, to: number) => {
    if (from === to || to < 0 || to >= images.length) return
    const next = [...images]
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item)
    onChange(next)
  }

  return (
    <div className="adminGalleryField">
      <div
        className={`adminDropZone adminGalleryDropZone${dragOver ? ' adminDropZoneActive' : ''}`}
        onDragEnter={(event) => {
          event.preventDefault()
          setDragOver(true)
        }}
        onDragOver={(event) => {
          event.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={(event) => {
          event.preventDefault()
          setDragOver(false)
        }}
        onDrop={(event) => {
          event.preventDefault()
          setDragOver(false)
          void addFiles(event.dataTransfer.files)
        }}
        onClick={() => !uploading && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            inputRef.current?.click()
          }
        }}
      >
        <p className="adminDropTitle">{uploading ? 'Завантажуємо…' : 'Перетягніть кілька фото сюди'}</p>
        <p className="adminDropHint">можна додати одразу багато файлів · JPG, PNG, WEBP, GIF</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          disabled={uploading}
          onChange={(event) => void addFiles(event.target.files)}
        />
      </div>

      {error ? <p className="adminImageError">{error}</p> : null}

      <div className="adminGalleryGrid">
        {images.map((image, index) => (
          <article
            key={`${image}-${index}`}
            className={`adminGalleryCard${draggingIndex === index ? ' adminGalleryCardDragging' : ''}`}
            draggable
            onDragStart={() => setDraggingIndex(index)}
            onDragEnd={() => setDraggingIndex(null)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault()
              if (draggingIndex === null) return
              moveImage(draggingIndex, index)
              setDraggingIndex(null)
            }}
          >
            <img src={image} alt="" className="adminGalleryThumb" />
            <div className="adminGalleryCardActions">
              <button type="button" className="adminGhostBtn" onClick={() => moveImage(index, index - 1)} disabled={index === 0}>
                ↑
              </button>
              <button type="button" className="adminGhostBtn" onClick={() => moveImage(index, index + 1)} disabled={index === images.length - 1}>
                ↓
              </button>
              <button
                type="button"
                className="adminDangerBtn"
                onClick={() => onChange(images.filter((_, i) => i !== index))}
              >
                Видалити
              </button>
            </div>
            <p className="adminGalleryCardIndex">Фото {index + 1}</p>
            <input
              className="adminGalleryUrl"
              type="text"
              value={image}
              onChange={(event) => {
                const next = [...images]
                next[index] = event.target.value
                onChange(next)
              }}
            />
          </article>
        ))}
      </div>
    </div>
  )
}

export function Section({
  title,
  children,
  defaultOpen = false,
}: {
  title: string
  children: ReactNode
  defaultOpen?: boolean
}) {
  return (
    <details className="adminSection" open={defaultOpen}>
      <summary>{title}</summary>
      <div className="adminSectionBody">{children}</div>
    </details>
  )
}

export type ContentEditorProps = {
  content: SiteContent
  onChange: (next: SiteContent) => void
}

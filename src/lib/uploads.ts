import { randomBytes } from 'crypto'
import { mkdir, readFile, writeFile } from 'fs/promises'
import path from 'path'
import { existsSync } from 'fs'

export const UPLOAD_URL_PREFIX = '/images/uploads'
/** Soft app limit — keep nginx `client_max_body_size` at least this high */
export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024
export const MAX_UPLOAD_LABEL = '20 МБ'

const DATA_UPLOADS_DIR = path.join(process.cwd(), 'data', 'uploads')
const LEGACY_UPLOADS_DIR = path.join(process.cwd(), 'public', 'images', 'uploads')

const MIME_BY_EXT: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
}

export function getUploadMimeType(filename: string) {
  const ext = path.extname(filename).replace('.', '').toLowerCase()
  return MIME_BY_EXT[ext] ?? 'application/octet-stream'
}

export function isSafeUploadFilename(filename: string) {
  return /^[a-zA-Z0-9._-]+$/.test(filename) && !filename.includes('..')
}

export async function ensureUploadsDir() {
  await mkdir(DATA_UPLOADS_DIR, { recursive: true })
  return DATA_UPLOADS_DIR
}

export async function saveUploadedFile(file: File) {
  const allowed = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
  if (!allowed.has(file.type)) {
    throw new Error('Дозволені лише JPG, PNG, WEBP, GIF')
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error(`Максимальний розмір — ${MAX_UPLOAD_LABEL}`)
  }

  const ext = file.type.split('/')[1]?.replace('jpeg', 'jpg') ?? 'bin'
  const filename = `${Date.now()}-${randomBytes(4).toString('hex')}.${ext}`
  const dir = await ensureUploadsDir()
  const buffer = Buffer.from(await file.arrayBuffer())
  await writeFile(path.join(dir, filename), buffer)

  return {
    filename,
    url: `${UPLOAD_URL_PREFIX}/${filename}`,
  }
}

export async function readUploadedFile(filename: string) {
  if (!isSafeUploadFilename(filename)) return null

  const dataPath = path.join(DATA_UPLOADS_DIR, filename)
  if (existsSync(dataPath)) {
    return {
      buffer: await readFile(dataPath),
      contentType: getUploadMimeType(filename),
    }
  }

  const legacyPath = path.join(LEGACY_UPLOADS_DIR, filename)
  if (existsSync(legacyPath)) {
    return {
      buffer: await readFile(legacyPath),
      contentType: getUploadMimeType(filename),
    }
  }

  return null
}

import fs from 'fs/promises'
import path from 'path'
import sharp from 'sharp'

export const TICKET_HEADER_PATH = '/images/ticket/ticket-header.png'
export const TICKET_HEADER_NATIVE_WIDTH = 1171
export const TICKET_HEADER_NATIVE_HEIGHT = 298
export const TICKET_HEADER_ASPECT = TICKET_HEADER_NATIVE_HEIGHT / TICKET_HEADER_NATIVE_WIDTH

export const TICKET_CARD_X = 48
export const TICKET_CARD_WIDTH = 984
export const TICKET_FONT_FAMILY = 'Montserrat, Arial, sans-serif'

const FONT_FILES: Record<number, string> = {
  400: 'Montserrat-Regular.ttf',
  600: 'Montserrat-SemiBold.ttf',
  700: 'Montserrat-Bold.ttf',
}

let montserratFontFaces: string | null = null

export function getTicketHeaderHeight(width = TICKET_CARD_WIDTH): number {
  return Math.round(width * TICKET_HEADER_ASPECT)
}

async function readHeaderFile(): Promise<Buffer> {
  const fullPath = path.join(process.cwd(), 'public', TICKET_HEADER_PATH.replace(/^\//, ''))
  return fs.readFile(fullPath)
}

export async function loadTicketHeaderImage(targetWidth = TICKET_CARD_WIDTH): Promise<Buffer> {
  const raw = await readHeaderFile()
  const targetHeight = getTicketHeaderHeight(targetWidth)
  return sharp(raw)
    .resize(targetWidth, targetHeight, { fit: 'cover', position: 'centre' })
    .png()
    .toBuffer()
}

export async function getTicketHeaderBase64(targetWidth = TICKET_CARD_WIDTH): Promise<string> {
  const buffer = await loadTicketHeaderImage(targetWidth)
  return buffer.toString('base64')
}

export async function getTicketMontserratFontFaces(): Promise<string> {
  if (montserratFontFaces) return montserratFontFaces

  const faces = await Promise.all(
    Object.entries(FONT_FILES).map(async ([weight, filename]) => {
      const fontPath = path.join(process.cwd(), 'public/fonts', filename)
      const buffer = await fs.readFile(fontPath)
      const base64 = buffer.toString('base64')
      return `@font-face{font-family:'Montserrat';src:url('data:font/ttf;base64,${base64}') format('truetype');font-weight:${weight};font-style:normal;}`
    }),
  )

  montserratFontFaces = faces.join('')
  return montserratFontFaces
}

export async function buildTicketHeaderSvg(headerBase64: string, width = TICKET_CARD_WIDTH): Promise<string> {
  const x = TICKET_CARD_X
  const height = getTicketHeaderHeight(width)
  const titleY = x + height + 58
  const fontFace = await getTicketMontserratFontFaces()

  return `
  <defs>
    <style>${fontFace}</style>
    <clipPath id="ticketHeaderClip">
      <rect x="${x}" y="${x}" width="${width}" height="${height}" rx="48" ry="48"/>
    </clipPath>
  </defs>
  <image
    x="${x}"
    y="${x}"
    width="${width}"
    height="${height}"
    href="data:image/png;base64,${headerBase64}"
    clip-path="url(#ticketHeaderClip)"
    preserveAspectRatio="xMidYMid slice"
  />
  <text x="${x + width / 2}" y="${titleY}" text-anchor="middle" fill="#3d2e26" font-family="${TICKET_FONT_FAMILY}" font-size="38" font-weight="700">Твій квиток на PROяв івент</text>
  <rect x="${x + width / 2 - 60}" y="${titleY + 18}" width="120" height="6" rx="3" fill="url(#accent)"/>`
}

export function getTicketContentStartY(width = TICKET_CARD_WIDTH): number {
  return TICKET_CARD_X + getTicketHeaderHeight(width) + 108
}

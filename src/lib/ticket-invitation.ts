import QRCode from 'qrcode'
import sharp from 'sharp'
import {
  TICKET_FONT_FAMILY,
  buildTicketHeaderSvg,
  getTicketContentStartY,
  getTicketHeaderBase64,
  getTicketMontserratFontFaces,
} from '@/lib/ticket-branding'
import { getSiteContent } from '@/lib/site-content'
import { getSiteUrl } from '@/lib/site-url'
import type { StoredOrder } from './store'
import type { OrderTicket } from './order-tickets'
import { getTicketQrScanValue } from './order-tickets'
import type { TicketTierId } from '@/lib/tickets'

const TIER_ACCENT: Record<TicketTierId, string> = {
  standard: '#6b8f71',
  golden: '#c9a227',
  vip: '#9a7858',
}

const FONT = TICKET_FONT_FAMILY

function escapeXml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

function wrapText(value: string, maxChars: number) {
  if (value.length <= maxChars) return [value]
  const words = value.split(' ')
  const lines: string[] = []
  let current = ''

  for (const word of words) {
    const next = current ? `${current} ${word}` : word
    if (next.length > maxChars && current) {
      lines.push(current)
      current = word
    } else {
      current = next
    }
  }

  if (current) lines.push(current)
  return lines.slice(0, 2)
}

export function getTicketQrPayload(orderReference: string, ticketCode?: string) {
  if (ticketCode) return getTicketQrScanValue(ticketCode)
  const siteUrl = getSiteUrl()
  return `${siteUrl}/payment/success?orderReference=${encodeURIComponent(orderReference)}`
}

export function getTicketFilename(orderReference: string, ticketCode?: string) {
  if (ticketCode) {
    const safe = ticketCode.replace(/[^a-zA-Z0-9-]/g, '')
    return `PROyav-kvitok-${safe}.png`
  }
  const safe = orderReference.replace(/[^a-zA-Z0-9-]/g, '')
  return `PROyav-kvitok-${safe}.png`
}

export async function generateTicketInvitationPng(
  order: StoredOrder,
  ticket?: OrderTicket,
): Promise<Buffer> {
  const ticketCode = ticket?.ticketCode ?? order.ticketCode ?? order.orderReference
  const content = await getSiteContent()
  const { event } = content
  const qrPayload = getTicketQrPayload(order.orderReference, ticket?.ticketCode ?? order.ticketCode)
  const qrBuffer = await QRCode.toBuffer(qrPayload, {
    margin: 1,
    width: 520,
    color: { dark: '#1a1210', light: '#ffffff' },
  })
  const qrBase64 = qrBuffer.toString('base64')
  const headerBase64 = await getTicketHeaderBase64()
  const headerSvg = await buildTicketHeaderSvg(headerBase64)
  const fontFaces = await getTicketMontserratFontFaces()
  const contentY = getTicketContentStartY()
  const accent = TIER_ACCENT[order.tierId]
  const tierLines = wrapText(order.tierName, 28)
  const nameLines = wrapText(order.name, 22)
  const quantityLabel =
    order.quantity > 1 && ticket
      ? `<text x="80" y="${contentY - 8}" fill="#7a6d62" font-family="${FONT}" font-size="28" font-weight="600">Квиток ${ticket.sequence} з ${order.quantity}</text>`
      : ''

  const tierText = tierLines
    .map((line, index) => `<tspan x="80" dy="${index === 0 ? 0 : 38}">${escapeXml(line)}</tspan>`)
    .join('')

  const nameText = nameLines
    .map((line, index) => `<tspan x="80" dy="${index === 0 ? 0 : 46}">${escapeXml(line)}</tspan>`)
    .join('')

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1080" height="${contentY + 1450}" viewBox="0 0 1080 ${contentY + 1450}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>${fontFaces}</style>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${accent}"/>
      <stop offset="100%" stop-color="#dcc4a8"/>
    </linearGradient>
  </defs>

  <rect width="1080" height="${contentY + 1450}" fill="#faf6f1"/>
  <rect x="48" y="48" width="984" height="${contentY + 1354}" rx="48" fill="#ffffff"/>
  ${headerSvg}
  ${quantityLabel}

  <text x="80" y="${contentY + 36}" fill="#7a6d62" font-family="${FONT}" font-size="32" font-weight="600" letter-spacing="0.04em">Учасник</text>
  <text x="80" y="${contentY + 100}" fill="#1a1210" font-family="${FONT}" font-size="50" font-weight="700">${nameText}</text>

  <text x="80" y="${contentY + 190}" fill="#7a6d62" font-family="${FONT}" font-size="32" font-weight="600" letter-spacing="0.04em">Тариф</text>
  <text x="80" y="${contentY + 252}" fill="#1a1210" font-family="${FONT}" font-size="42" font-weight="700">${tierText}</text>

  <text x="80" y="${contentY + 352}" fill="#7a6d62" font-family="${FONT}" font-size="32" font-weight="600" letter-spacing="0.04em">Дата та час</text>
  <text x="80" y="${contentY + 406}" fill="#1a1210" font-family="${FONT}" font-size="36" font-weight="700">${escapeXml(event.dateShort)}</text>
  <text x="80" y="${contentY + 454}" fill="#1a1210" font-family="${FONT}" font-size="32" font-weight="600">${escapeXml(event.time)}</text>

  <text x="80" y="${contentY + 534}" fill="#7a6d62" font-family="${FONT}" font-size="32" font-weight="600" letter-spacing="0.04em">Локація</text>
  <text x="80" y="${contentY + 588}" fill="#1a1210" font-family="${FONT}" font-size="34" font-weight="600">${escapeXml(event.venueFull)}</text>

  <text x="80" y="${contentY + 668}" fill="#7a6d62" font-family="${FONT}" font-size="32" font-weight="600" letter-spacing="0.04em">Код квитка</text>
  <text x="80" y="${contentY + 722}" fill="#9a7858" font-family="${FONT}" font-size="34" font-weight="700" letter-spacing="0.08em">${escapeXml(ticketCode)}</text>

  <rect x="220" y="${contentY + 762}" width="640" height="640" rx="36" fill="#faf6f1" stroke="#e8ddd2" stroke-width="2"/>
  <image x="300" y="${contentY + 802}" width="480" height="480" href="data:image/png;base64,${qrBase64}"/>
  <text x="540" y="${contentY + 1322}" text-anchor="middle" fill="#5c4a40" font-family="${FONT}" font-size="24" font-weight="400">Покажи QR-код на реєстрації</text>
  <text x="540" y="${contentY + 1362}" text-anchor="middle" fill="#7a6d62" font-family="${FONT}" font-size="22" font-weight="600">Номер замовлення</text>
  <text x="540" y="${contentY + 1400}" text-anchor="middle" fill="#9a7858" font-family="${FONT}" font-size="28" font-weight="700" letter-spacing="0.04em">${escapeXml(order.orderReference)}</text>
</svg>`

  return sharp(Buffer.from(svg)).png({ quality: 95 }).toBuffer()
}

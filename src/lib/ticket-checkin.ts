import type { StoredOrder } from './store'
import type { OrderTicket } from './order-tickets'

export type CheckInStatus = 'none' | 'admitted' | 'rejected'

export type TicketVerdict = 'valid' | 'already_used' | 'not_paid' | 'not_found' | 'rejected'

export type TicketLookup =
  | { type: 'orderReference'; value: string }
  | { type: 'ticketCode'; value: string }

export function parseTicketLookupQuery(raw: string): TicketLookup | null {
  const trimmed = raw.trim()
  if (!trimmed) return null

  if (/^PRO-[A-Z0-9]{6}$/i.test(trimmed)) {
    return { type: 'ticketCode', value: trimmed.toUpperCase() }
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      const url = new URL(trimmed)
      const orderReference = url.searchParams.get('orderReference')?.trim()
      if (orderReference) {
        return { type: 'orderReference', value: orderReference }
      }
    } catch {
      return null
    }
  }

  if (trimmed.length >= 6) {
    return { type: 'orderReference', value: trimmed }
  }

  return null
}

export const CHECK_IN_LABELS: Record<CheckInStatus, string> = {
  none: 'Не перевірено',
  admitted: 'Допущено',
  rejected: 'Відхилено',
}

export const VERDICT_LABELS: Record<TicketVerdict, string> = {
  valid: 'OK',
  already_used: 'Повтор',
  not_paid: 'Не оплачено',
  not_found: 'Не знайдено',
  rejected: 'Відхилено',
}

export const UPGRADED_TICKET_MESSAGE =
  'Гість оновив тариф — цей QR недійсний. Попросіть знайти новий квиток на email (перевірити «Спам»).'

export function evaluateTicket(order: StoredOrder | null, ticket?: OrderTicket | null) {
  if (!order) {
    return {
      verdict: 'not_found' as const,
      ok: false,
      title: 'Не OK',
      message: 'Квиток не знайдено',
    }
  }

  if (order.status !== 'paid') {
    return {
      verdict: 'not_paid' as const,
      ok: false,
      title: 'Не OK',
      message:
        order.status === 'upgraded'
          ? UPGRADED_TICKET_MESSAGE
          : order.status === 'pending'
            ? 'Оплата ще в обробці'
            : 'Квиток не оплачений',
    }
  }

  const checkInStatus = ticket?.checkInStatus ?? order.checkInStatus

  if (checkInStatus === 'admitted') {
    return {
      verdict: 'already_used' as const,
      ok: false,
      title: 'Не OK',
      message: 'Повторне сканування — гість уже пройшов',
    }
  }

  if (checkInStatus === 'rejected') {
    return {
      verdict: 'rejected' as const,
      ok: false,
      title: 'Не OK',
      message: 'Вхід раніше відхилено',
    }
  }

  return {
    verdict: 'valid' as const,
    ok: true,
    title: 'OK',
    message: 'Квиток дійсний — можна допустити',
  }
}

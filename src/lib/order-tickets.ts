import type { CheckInStatus } from './ticket-checkin'

export type OrderTicket = {
  id: number
  orderReference: string
  ticketCode: string
  sequence: number
  checkInStatus: CheckInStatus
  checkedInAt?: string
  checkInNote?: string
}

export const MAX_TICKETS_PER_ORDER = 10

export function getTicketQrScanValue(ticketCode: string) {
  return ticketCode.toUpperCase()
}

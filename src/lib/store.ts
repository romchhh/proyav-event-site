import { getDb } from './db'
import type { TicketTierId, TicketWave } from './tickets'
import { EMPTY_SALES, type SalesCounts } from './ticket-pricing'
import type { CheckInStatus } from './ticket-checkin'
import { parseTicketLookupQuery, evaluateTicket, CHECK_IN_LABELS, UPGRADED_TICKET_MESSAGE, type TicketVerdict } from './ticket-checkin'
import { isActivePaidOrder, normalizeEmail } from './tier-upgrade'

export type StoredOrder = {
  orderReference: string
  ticketCode?: string
  name: string
  email: string
  phone: string
  tierId: TicketTierId
  tierName: string
  wave: TicketWave
  amount: number
  promoCode?: string
  status: 'pending' | 'paid' | 'failed' | 'upgraded'
  emailSent: boolean
  createdAt: string
  paidAt?: string
  checkInStatus: CheckInStatus
  checkedInAt?: string
  checkInNote?: string
  upgradedFromOrderReference?: string
  upgradedToOrderReference?: string
  upgradeCredit?: number
}

type OrderRow = {
  order_reference: string
  ticket_code: string | null
  name: string
  email: string
  phone: string
  tier_id: TicketTierId
  tier_name: string
  wave: TicketWave
  amount: number
  promo_code: string | null
  status: StoredOrder['status']
  email_sent: number
  created_at: string
  paid_at: string | null
  check_in_status: CheckInStatus
  checked_in_at: string | null
  check_in_note: string | null
  upgraded_from_order: string | null
  upgraded_to_order: string | null
  upgrade_credit: number | null
}

function rowToOrder(row: OrderRow): StoredOrder {
  return {
    orderReference: row.order_reference,
    ticketCode: row.ticket_code ?? undefined,
    name: row.name,
    email: row.email,
    phone: row.phone,
    tierId: row.tier_id,
    tierName: row.tier_name,
    wave: row.wave,
    amount: row.amount,
    promoCode: row.promo_code ?? undefined,
    status: row.status,
    emailSent: row.email_sent === 1,
    createdAt: row.created_at,
    paidAt: row.paid_at ?? undefined,
    checkInStatus: row.check_in_status ?? 'none',
    checkedInAt: row.checked_in_at ?? undefined,
    checkInNote: row.check_in_note ?? undefined,
    upgradedFromOrderReference: row.upgraded_from_order ?? undefined,
    upgradedToOrderReference: row.upgraded_to_order ?? undefined,
    upgradeCredit: row.upgrade_credit ?? undefined,
  }
}

function orderToParams(order: StoredOrder) {
  return {
    orderReference: order.orderReference,
    ticketCode: order.ticketCode ?? null,
    name: order.name,
    email: order.email,
    phone: order.phone,
    tierId: order.tierId,
    tierName: order.tierName,
    wave: order.wave,
    amount: order.amount,
    promoCode: order.promoCode ?? null,
    status: order.status,
    emailSent: order.emailSent ? 1 : 0,
    createdAt: order.createdAt,
    paidAt: order.paidAt ?? null,
    checkInStatus: order.checkInStatus ?? 'none',
    checkedInAt: order.checkedInAt ?? null,
    checkInNote: order.checkInNote ?? null,
    upgradedFromOrder: order.upgradedFromOrderReference ?? null,
    upgradedToOrder: order.upgradedToOrderReference ?? null,
    upgradeCredit: order.upgradeCredit ?? null,
  }
}

export async function getSalesCounts(): Promise<SalesCounts> {
  const db = getDb()
  const rows = db
    .prepare('SELECT tier_id, wave, count FROM sales')
    .all() as { tier_id: TicketTierId; wave: TicketWave; count: number }[]

  const sales: SalesCounts = {
    standard: { ...EMPTY_SALES.standard },
    golden: { ...EMPTY_SALES.golden },
    vip: { ...EMPTY_SALES.vip },
  }

  for (const row of rows) {
    if (sales[row.tier_id]?.[row.wave] !== undefined) {
      sales[row.tier_id][row.wave] = row.count
    }
  }

  return sales
}

export async function incrementSale(tierId: TicketTierId, wave: TicketWave) {
  const db = getDb()
  db.prepare(`
    INSERT INTO sales (tier_id, wave, count)
    VALUES (?, ?, 1)
    ON CONFLICT(tier_id, wave) DO UPDATE SET count = count + 1
  `).run(tierId, wave)

  return getSalesCounts()
}

export async function decrementSale(tierId: TicketTierId, wave: TicketWave) {
  const db = getDb()
  db.prepare(`
    UPDATE sales
    SET count = CASE WHEN count > 0 THEN count - 1 ELSE 0 END
    WHERE tier_id = ? AND wave = ?
  `).run(tierId, wave)

  return getSalesCounts()
}

export async function getActivePaidOrderByEmail(email: string) {
  const db = getDb()
  const normalized = normalizeEmail(email)
  const rows = db
    .prepare(`
      SELECT * FROM orders
      WHERE LOWER(email) = ?
        AND status = 'paid'
      ORDER BY paid_at DESC, created_at DESC
    `)
    .all(normalized) as OrderRow[]

  for (const row of rows) {
    const order = rowToOrder(row)
    if (isActivePaidOrder(order)) {
      return order
    }
  }

  return null
}

export async function saveOrder(order: StoredOrder) {
  const db = getDb()
  db.prepare(`
    INSERT INTO orders (
      order_reference, ticket_code, name, email, phone,
      tier_id, tier_name, wave, amount, promo_code,
      status, email_sent, created_at, paid_at,
      check_in_status, checked_in_at, check_in_note,
      upgraded_from_order, upgraded_to_order, upgrade_credit
    ) VALUES (
      @orderReference, @ticketCode, @name, @email, @phone,
      @tierId, @tierName, @wave, @amount, @promoCode,
      @status, @emailSent, @createdAt, @paidAt,
      @checkInStatus, @checkedInAt, @checkInNote,
      @upgradedFromOrder, @upgradedToOrder, @upgradeCredit
    )
    ON CONFLICT(order_reference) DO UPDATE SET
      ticket_code = excluded.ticket_code,
      name = excluded.name,
      email = excluded.email,
      phone = excluded.phone,
      tier_id = excluded.tier_id,
      tier_name = excluded.tier_name,
      wave = excluded.wave,
      amount = excluded.amount,
      promo_code = excluded.promo_code,
      status = excluded.status,
      email_sent = excluded.email_sent,
      created_at = excluded.created_at,
      paid_at = excluded.paid_at,
      check_in_status = excluded.check_in_status,
      checked_in_at = excluded.checked_in_at,
      check_in_note = excluded.check_in_note,
      upgraded_from_order = excluded.upgraded_from_order,
      upgraded_to_order = excluded.upgraded_to_order,
      upgrade_credit = excluded.upgrade_credit
  `).run(orderToParams(order))
}

export async function getOrder(orderReference: string) {
  const db = getDb()
  const row = db
    .prepare('SELECT * FROM orders WHERE order_reference = ?')
    .get(orderReference) as OrderRow | undefined

  return row ? rowToOrder(row) : null
}

export async function updateOrder(orderReference: string, patch: Partial<StoredOrder>) {
  const current = await getOrder(orderReference)
  if (!current) return null

  const next = { ...current, ...patch }
  await saveOrder(next)
  return next
}

export async function getAllOrders(): Promise<StoredOrder[]> {
  const db = getDb()
  const rows = db
    .prepare('SELECT * FROM orders ORDER BY created_at DESC')
    .all() as OrderRow[]

  return rows.map(rowToOrder)
}

export async function getOrderByTicketCode(ticketCode: string) {
  const db = getDb()
  const row = db
    .prepare('SELECT * FROM orders WHERE UPPER(ticket_code) = UPPER(?)')
    .get(ticketCode) as OrderRow | undefined

  return row ? rowToOrder(row) : null
}

export async function lookupTicketOrder(query: string) {
  const parsed = parseTicketLookupQuery(query)
  if (!parsed) return null

  if (parsed.type === 'ticketCode') {
    return getOrderByTicketCode(parsed.value)
  }

  return getOrder(parsed.value)
}

export type CheckInAction = 'admit' | 'reject'

export type CheckInResult =
  | { ok: true; order: StoredOrder }
  | { ok: false; code: 'not_found' | 'not_paid' | 'already_used' | 'invalid_action'; message: string; order?: StoredOrder }

export async function processTicketCheckIn(
  query: string,
  action: CheckInAction,
  note?: string,
): Promise<CheckInResult> {
  const order = await lookupTicketOrder(query)
  if (!order) {
    return { ok: false, code: 'not_found', message: 'Квиток не знайдено' }
  }

  if (order.status !== 'paid') {
    return {
      ok: false,
      code: 'not_paid',
      message:
        order.status === 'upgraded'
          ? UPGRADED_TICKET_MESSAGE
          : 'Квиток не оплачений',
      order,
    }
  }

  if (action === 'admit' && order.checkInStatus === 'admitted') {
    return {
      ok: false,
      code: 'already_used',
      message: 'Цей квиток уже використано на вході',
      order,
    }
  }

  const nextStatus: CheckInStatus = action === 'admit' ? 'admitted' : 'rejected'
  const updated = await updateOrder(order.orderReference, {
    checkInStatus: nextStatus,
    checkedInAt: new Date().toISOString(),
    checkInNote: note?.trim() || undefined,
  })

  if (!updated) {
    return { ok: false, code: 'not_found', message: 'Не вдалося оновити квиток' }
  }

  return { ok: true, order: updated }
}

export type TicketScanRecord = {
  id: number
  orderReference?: string
  ticketCode?: string
  guestName?: string
  tierName?: string
  result: TicketVerdict
  message: string
  scannedAt: string
}

export async function logTicketScan(input: {
  orderReference?: string
  ticketCode?: string
  guestName?: string
  tierName?: string
  result: TicketVerdict
  message: string
}) {
  const db = getDb()
  db.prepare(`
    INSERT INTO ticket_scans (
      order_reference, ticket_code, guest_name, tier_name, result, message, scanned_at
    ) VALUES (
      @orderReference, @ticketCode, @guestName, @tierName, @result, @message, @scannedAt
    )
  `).run({
    orderReference: input.orderReference ?? null,
    ticketCode: input.ticketCode ?? null,
    guestName: input.guestName ?? null,
    tierName: input.tierName ?? null,
    result: input.result,
    message: input.message,
    scannedAt: new Date().toISOString(),
  })
}

export async function getRecentTicketScans(limit = 30): Promise<TicketScanRecord[]> {
  const db = getDb()
  const rows = db
    .prepare('SELECT * FROM ticket_scans ORDER BY scanned_at DESC LIMIT ?')
    .all(limit) as {
      id: number
      order_reference: string | null
      ticket_code: string | null
      guest_name: string | null
      tier_name: string | null
      result: TicketVerdict
      message: string
      scanned_at: string
    }[]

  return rows.map((row) => ({
    id: row.id,
    orderReference: row.order_reference ?? undefined,
    ticketCode: row.ticket_code ?? undefined,
    guestName: row.guest_name ?? undefined,
    tierName: row.tier_name ?? undefined,
    result: row.result,
    message: row.message,
    scannedAt: row.scanned_at,
  }))
}

export async function getTicketScanStats(orderReference: string) {
  const db = getDb()
  const row = db
    .prepare('SELECT COUNT(*) AS count FROM ticket_scans WHERE order_reference = ?')
    .get(orderReference) as { count: number }

  return { totalScans: row.count }
}

export async function lookupAndEvaluateTicket(query: string) {
  const order = await lookupTicketOrder(query)
  const evaluation = evaluateTicket(order)

  await logTicketScan({
    orderReference: order?.orderReference,
    ticketCode: order?.ticketCode,
    guestName: order?.name,
    tierName: order?.tierName,
    result: evaluation.verdict,
    message: evaluation.message,
  })

  const scanStats = order ? await getTicketScanStats(order.orderReference) : { totalScans: 0 }

  return {
    found: Boolean(order),
    order: order ?? undefined,
    ...evaluation,
    canAdmit: evaluation.verdict === 'valid',
    scanCount: scanStats.totalScans,
    isRepeatScan: evaluation.verdict === 'already_used' || scanStats.totalScans > 1,
    paymentLabel: order
      ? order.status === 'paid'
        ? 'Оплачено'
        : order.status === 'pending'
          ? 'В обробці'
          : 'Не оплачено'
      : undefined,
    checkInLabel: order ? CHECK_IN_LABELS[order.checkInStatus] : undefined,
  }
}

export async function getCheckInDashboard() {
  const orders = await getAllOrders()
  const paidOrders = orders.filter((order) => order.status === 'paid' && !order.upgradedToOrderReference)

  return {
    stats: {
      purchased: paidOrders.length,
      waiting: paidOrders.filter((order) => order.checkInStatus === 'none').length,
      admitted: paidOrders.filter((order) => order.checkInStatus === 'admitted').length,
      rejected: paidOrders.filter((order) => order.checkInStatus === 'rejected').length,
      pendingPayment: orders.filter((order) => order.status === 'pending').length,
      failedPayment: orders.filter((order) => order.status === 'failed').length,
    },
    waiting: paidOrders
      .filter((order) => order.checkInStatus === 'none')
      .sort((a, b) => new Date(b.paidAt ?? b.createdAt).getTime() - new Date(a.paidAt ?? a.createdAt).getTime()),
    admitted: paidOrders
      .filter((order) => order.checkInStatus === 'admitted')
      .sort((a, b) => new Date(b.checkedInAt ?? b.paidAt ?? b.createdAt).getTime() - new Date(a.checkedInAt ?? a.paidAt ?? a.createdAt).getTime()),
    rejected: paidOrders.filter((order) => order.checkInStatus === 'rejected'),
    recentScans: await getRecentTicketScans(40),
  }
}

export function generateTicketCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let suffix = ''
  for (let i = 0; i < 6; i += 1) {
    suffix += chars[Math.floor(Math.random() * chars.length)]
  }
  return `PRO-${suffix}`
}

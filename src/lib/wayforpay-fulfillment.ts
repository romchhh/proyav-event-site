import { sendTicketEmail } from '@/lib/ticket-email'
import {
  decrementSale,
  ensureOrderTickets,
  getOrder,
  incrementSale,
  updateOrder,
} from '@/lib/store'
import {
  amountsMatch,
  verifyWayForPayCallback,
  type WayForPayCallbackBody,
} from '@/lib/wayforpay'

function getSecretKey() {
  return process.env.WAYFORPAY_SECRET_KEY?.trim() ?? ''
}

function getMerchantAccount() {
  return process.env.WAYFORPAY_MERCHANT_ACCOUNT?.trim() ?? ''
}

export async function fulfillApprovedPayment(body: WayForPayCallbackBody) {
  const secretKey = getSecretKey()
  const merchantAccount = getMerchantAccount()
  const orderReference = body.orderReference?.trim() ?? ''

  if (!secretKey || !merchantAccount) {
    return { ok: false as const, reason: 'not_configured' }
  }

  if (!orderReference) {
    return { ok: false as const, reason: 'missing_order_reference' }
  }

  if (body.transactionStatus !== 'Approved') {
    return { ok: false as const, reason: 'not_approved', orderReference }
  }

  if (!verifyWayForPayCallback(body, secretKey)) {
    return { ok: false as const, reason: 'invalid_signature', orderReference }
  }

  if (body.merchantAccount && body.merchantAccount !== merchantAccount) {
    return { ok: false as const, reason: 'invalid_merchant', orderReference }
  }

  const order = await getOrder(orderReference)
  if (!order) {
    return { ok: false as const, reason: 'order_not_found', orderReference }
  }

  if (order.status === 'paid') {
    await ensureOrderTickets(orderReference, order.quantity || 1)
    if (!order.emailSent) {
      const emailResult = await sendTicketEmail(order)
      if (!emailResult.success) {
        console.error('[wayforpay] Ticket email resend failed:', orderReference, emailResult.error)
      } else {
        await updateOrder(orderReference, { emailSent: true })
      }
    }
    return { ok: true as const, orderReference, alreadyPaid: true }
  }

  if (!amountsMatch(order.amount, body.amount)) {
    console.error(
      '[wayforpay] Amount mismatch for',
      orderReference,
      'expected',
      order.amount,
      'got',
      body.amount,
    )
    return { ok: false as const, reason: 'amount_mismatch', orderReference }
  }

  const paidOrder = await updateOrder(orderReference, {
    status: 'paid',
    paidAt: new Date().toISOString(),
  })

  if (!paidOrder) {
    return { ok: false as const, reason: 'update_failed', orderReference }
  }

  const quantity = paidOrder.quantity || 1
  await ensureOrderTickets(orderReference, quantity)

  if (paidOrder.upgradedFromOrderReference) {
    const previousOrder = await getOrder(paidOrder.upgradedFromOrderReference)
    if (previousOrder && previousOrder.status === 'paid' && !previousOrder.upgradedToOrderReference) {
      await updateOrder(previousOrder.orderReference, {
        status: 'upgraded',
        upgradedToOrderReference: orderReference,
      })
      await decrementSale(previousOrder.tierId, previousOrder.wave, previousOrder.quantity || 1)
    }
  }

  await incrementSale(paidOrder.tierId, paidOrder.wave, quantity)

  const fulfilledOrder = await getOrder(orderReference)
  if (fulfilledOrder && !fulfilledOrder.emailSent) {
    const emailResult = await sendTicketEmail(fulfilledOrder)
    if (!emailResult.success) {
      console.error('[wayforpay] Ticket email failed:', orderReference, emailResult.error)
    }
    await updateOrder(orderReference, { emailSent: emailResult.success })
  }

  return { ok: true as const, orderReference, alreadyPaid: false }
}

export async function ensureTicketEmail(orderReference: string) {
  const order = await getOrder(orderReference)
  if (!order || order.status !== 'paid' || order.emailSent) {
    return { sent: false, reason: 'not_eligible' as const }
  }

  await ensureOrderTickets(orderReference, order.quantity || 1)
  const emailResult = await sendTicketEmail(order)
  if (!emailResult.success) {
    console.error('[ticket-email] Ensure send failed:', orderReference, emailResult.error)
    return { sent: false, reason: 'send_failed' as const, error: emailResult.error }
  }

  await updateOrder(orderReference, { emailSent: true })
  return { sent: true as const }
}

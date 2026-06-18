import { NextResponse } from 'next/server'
import { applyDiscount, validatePromoCode } from '@/lib/promo'
import { getPricingConfigFromContent, getTierPrice, isTierAvailable } from '@/lib/ticket-pricing'
import { getActivePaidOrderByEmail, getSalesCounts, saveOrder } from '@/lib/store'
import { getSiteContent } from '@/lib/site-content'
import type { TicketTierId } from '@/lib/tickets'
import { buildUpgradeQuote, normalizeEmail } from '@/lib/tier-upgrade'
import { createOrderReference, createWayForPayInvoice } from '@/lib/wayforpay'
import { getSiteUrl } from '@/lib/site-url'

type CheckoutBody = {
  tierId?: TicketTierId
  name?: string
  email?: string
  phone?: string
  promoCode?: string
}

function normalizePhone(phone: string) {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('380')) return digits
  if (digits.startsWith('0')) return `38${digits}`
  if (digits.length === 9) return `380${digits}`
  return digits
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CheckoutBody
    const content = await getSiteContent()
    const pricingConfig = getPricingConfigFromContent(content.tickets)
    const tier = body.tierId
      ? content.tickets.tiers.find((item) => item.id === body.tierId)
      : undefined
    const name = body.name?.trim() ?? ''
    const email = body.email?.trim() ?? ''
    const phone = normalizePhone(body.phone?.trim() ?? '')
    const promoCode = body.promoCode?.trim() ?? ''

    if (!tier || !body.tierId) {
      return NextResponse.json({ error: 'Оберіть тариф квитка' }, { status: 400 })
    }

    if (name.length < 2) {
      return NextResponse.json({ error: 'Вкажіть імʼя' }, { status: 400 })
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Вкажіть коректну email-адресу' }, { status: 400 })
    }

    if (phone.length < 12) {
      return NextResponse.json({ error: 'Вкажіть коректний номер телефону' }, { status: 400 })
    }

    const sales = await getSalesCounts()
    if (!isTierAvailable(body.tierId, sales, pricingConfig)) {
      return NextResponse.json({ error: 'Квитки цього тарифу вже розкуплені' }, { status: 409 })
    }

    const pricing = getTierPrice(body.tierId, sales, pricingConfig)
    const existingOrder = await getActivePaidOrderByEmail(normalizeEmail(email))
    const upgradeQuote = buildUpgradeQuote(existingOrder, body.tierId, tier.name, pricing.price)

    if (upgradeQuote.kind === 'blocked') {
      return NextResponse.json({ error: upgradeQuote.message }, { status: 409 })
    }

    let amount = pricing.price
    let discountPercent = 0
    let upgradeCredit = 0
    let upgradedFromOrderReference: string | undefined

    if (promoCode) {
      const promo = await validatePromoCode(promoCode)
      if (!promo.valid || promo.percent === undefined) {
        return NextResponse.json({ error: promo.message }, { status: 400 })
      }
      discountPercent = promo.percent
      amount = applyDiscount(pricing.price, promo.percent)
    }

    if (upgradeQuote.kind === 'upgrade') {
      upgradeCredit = upgradeQuote.credit
      upgradedFromOrderReference = upgradeQuote.fromOrderReference
      amount = Math.max(0, amount - upgradeCredit)
    }

    if (amount < 1) {
      return NextResponse.json(
        { error: 'Сума до оплати занадто мала. Напишіть нам на proYav.event@gmail.com' },
        { status: 400 },
      )
    }

    const siteUrl = getSiteUrl()
    const orderReference = createOrderReference()
    const orderDate = Math.floor(Date.now() / 1000)

    await saveOrder({
      orderReference,
      name,
      email,
      phone,
      tierId: body.tierId,
      tierName: tier.name,
      wave: pricing.wave,
      amount,
      promoCode: promoCode || undefined,
      status: 'pending',
      emailSent: false,
      createdAt: new Date().toISOString(),
      checkInStatus: 'none',
      upgradedFromOrderReference,
      upgradeCredit: upgradeCredit || undefined,
    })

    const invoice = await createWayForPayInvoice({
      orderReference,
      orderDate,
      amount,
      productName: `PROяв івент — ${tier.name}`,
      clientFirstName: name,
      clientEmail: email,
      clientPhone: phone,
      returnUrl: `${siteUrl}/api/wayforpay/return?orderReference=${encodeURIComponent(orderReference)}`,
      serviceUrl: `${siteUrl}/api/wayforpay/callback`,
    })

    if (!invoice.ok) {
      return NextResponse.json({ error: invoice.reason }, { status: 502 })
    }

    return NextResponse.json({
      paymentUrl: invoice.invoiceUrl,
      amount,
      originalAmount: pricing.price,
      discountPercent,
      upgradeCredit: upgradeCredit || undefined,
      tierName: tier.name,
      orderReference,
    })
  } catch {
    return NextResponse.json({ error: 'Не вдалося оформити оплату' }, { status: 500 })
  }
}

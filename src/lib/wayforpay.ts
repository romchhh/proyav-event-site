import { createHmac } from 'crypto'
import { getSiteUrl } from './site-url'

const API_URL = 'https://api.wayforpay.com/api'

type CreateInvoiceInput = {
  orderReference: string
  orderDate: number
  amount: number
  unitPrice?: number
  quantity?: number
  productName: string
  clientFirstName: string
  clientEmail: string
  clientPhone: string
  returnUrl: string
  serviceUrl?: string
}

type CreateInvoiceResult =
  | { ok: true; invoiceUrl: string }
  | { ok: false; reason: string }

function getMerchantAccount() {
  return process.env.WAYFORPAY_MERCHANT_ACCOUNT?.trim() ?? ''
}

function getSecretKey() {
  return process.env.WAYFORPAY_SECRET_KEY?.trim() ?? ''
}

function getMerchantDomain() {
  try {
    return new URL(getSiteUrl()).hostname
  } catch {
    return 'proyav.ua'
  }
}

function buildSignature(fields: {
  merchantAccount: string
  merchantDomainName: string
  orderReference: string
  orderDate: number
  amount: number
  currency: string
  productName: string[]
  productCount: number[]
  productPrice: number[]
}) {
  const secretKey = getSecretKey()
  const parts = [
    fields.merchantAccount,
    fields.merchantDomainName,
    fields.orderReference,
    String(fields.orderDate),
    String(fields.amount),
    fields.currency,
    fields.productName.join(';'),
    fields.productCount.join(';'),
    fields.productPrice.map(String).join(';'),
  ]

  return createHmac('md5', secretKey).update(parts.join(';'), 'utf8').digest('hex')
}

export async function createWayForPayInvoice(
  input: CreateInvoiceInput,
): Promise<CreateInvoiceResult> {
  const merchantAccount = getMerchantAccount()
  const secretKey = getSecretKey()

  if (!merchantAccount || !secretKey) {
    return { ok: false, reason: 'Платіжна система тимчасово недоступна' }
  }

  const merchantDomainName = getMerchantDomain()
  const currency = 'UAH'
  const quantity = Math.max(1, input.quantity ?? 1)
  const unitPrice = input.unitPrice ?? input.amount
  const amount = unitPrice * quantity
  const productName = [input.productName]
  const productCount = [quantity]
  const productPrice = [unitPrice]

  const payload = {
    transactionType: 'CREATE_INVOICE',
    merchantAccount,
    merchantDomainName,
    apiVersion: 1,
    language: 'UA',
    orderReference: input.orderReference,
    orderDate: input.orderDate,
    amount: input.amount,
    currency,
    productName,
    productCount,
    productPrice,
    clientFirstName: input.clientFirstName,
    clientEmail: input.clientEmail,
    clientPhone: input.clientPhone,
    returnUrl: input.returnUrl,
    serviceUrl: input.serviceUrl,
    paymentSystems: 'card;googlePay;applePay;privat24',
    merchantSignature: buildSignature({
      merchantAccount,
      merchantDomainName,
      orderReference: input.orderReference,
      orderDate: input.orderDate,
      amount: input.amount,
      currency,
      productName,
      productCount,
      productPrice,
    }),
  }

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json;charset=utf-8' },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    return { ok: false, reason: 'Не вдалося створити рахунок для оплати' }
  }

  const data = (await response.json()) as {
    reasonCode?: number
    reason?: string
    invoiceUrl?: string
  }

  if (data.reasonCode === 1100 && data.invoiceUrl) {
    return { ok: true, invoiceUrl: data.invoiceUrl }
  }

  return {
    ok: false,
    reason: data.reason ?? 'WayForPay відхилив створення рахунку',
  }
}

export function createOrderReference() {
  const stamp = Date.now()
  const random = Math.random().toString(36).slice(2, 8).toUpperCase()
  return `PROYAV-${stamp}-${random}`
}

export type WayForPayCallbackBody = {
  merchantAccount?: string
  orderReference?: string
  amount?: number | string
  currency?: string
  authCode?: string
  cardPan?: string
  transactionStatus?: string
  reasonCode?: number | string
  merchantSignature?: string
}

function hmacMd5(value: string, secretKey: string) {
  return createHmac('md5', secretKey).update(value, 'utf8').digest('hex')
}

export function buildWayForPayIncomingSignature(body: WayForPayCallbackBody, secretKey: string) {
  const signatureString = [
    body.merchantAccount ?? '',
    body.orderReference ?? '',
    String(body.amount ?? ''),
    body.currency ?? '',
    body.authCode ?? '',
    body.cardPan ?? '',
    body.transactionStatus ?? '',
    String(body.reasonCode ?? ''),
  ].join(';')

  return hmacMd5(signatureString, secretKey)
}

export function verifyWayForPayCallback(body: WayForPayCallbackBody, secretKey: string) {
  if (!body.merchantSignature) return false
  return buildWayForPayIncomingSignature(body, secretKey) === body.merchantSignature
}

export function buildWayForPayAcceptResponse(
  orderReference: string,
  secretKey: string,
  time = Math.floor(Date.now() / 1000),
) {
  return {
    orderReference,
    status: 'accept' as const,
    time,
    signature: hmacMd5(`${orderReference};accept;${time}`, secretKey),
  }
}

export function parseWayForPayCallbackBody(raw: string, contentType: string) {
  const trimmed = raw.trim()
  if (!trimmed) return null

  if (trimmed.startsWith('{')) {
    try {
      return JSON.parse(trimmed) as WayForPayCallbackBody
    } catch {
      // fall through to form parsing
    }
  }

  const isForm =
    contentType.includes('application/x-www-form-urlencoded') ||
    contentType.includes('multipart/form-data') ||
    (!contentType.includes('json') && trimmed.includes('='))

  if (isForm) {
    const params = new URLSearchParams(trimmed)
    const body: WayForPayCallbackBody = {}
    for (const [key, value] of Array.from(params.entries())) {
      if (key === 'amount' || key === 'reasonCode') {
        const numeric = Number(value)
        body[key] = Number.isFinite(numeric) ? numeric : value
      } else {
        body[key as keyof WayForPayCallbackBody] = value
      }
    }
    return Object.keys(body).length > 0 ? body : null
  }

  try {
    return JSON.parse(trimmed) as WayForPayCallbackBody
  } catch {
    return null
  }
}

export function amountsMatch(expected: number, received: number | string | undefined) {
  const actual = typeof received === 'string' ? Number(received) : received ?? NaN
  if (!Number.isFinite(actual)) return false
  return Math.abs(expected - actual) < 0.01
}

'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { EVENT, LINKS } from '@/app/constants'
import styles from './page.module.css'

type OrderTicket = {
  ticketCode: string
  sequence: number
  checkInStatus: string
}

type OrderStatus = {
  found: boolean
  status?: 'pending' | 'paid' | 'failed' | 'unknown'
  emailSent?: boolean
  tierName?: string
  name?: string
  amount?: number
  quantity?: number
  tickets?: OrderTicket[]
}

function ticketPreviewUrl(orderReference: string, ticketCode?: string) {
  const params = new URLSearchParams({ orderReference })
  if (ticketCode) params.set('ticketCode', ticketCode)
  return `/api/orders/ticket?${params.toString()}`
}

function ticketDownloadUrl(orderReference: string, ticketCode?: string) {
  const params = new URLSearchParams({ orderReference, download: '1' })
  if (ticketCode) params.set('ticketCode', ticketCode)
  return `/api/orders/ticket?${params.toString()}`
}

function SuccessContent() {
  const searchParams = useSearchParams()
  const orderReference = searchParams.get('orderReference')?.trim() ?? ''
  const [orderStatus, setOrderStatus] = useState<OrderStatus | null>(null)
  const [hasChecked, setHasChecked] = useState(false)
  const [shareError, setShareError] = useState<string | null>(null)
  const [isSharing, setIsSharing] = useState(false)
  const [sharingTicketCode, setSharingTicketCode] = useState<string | null>(null)

  useEffect(() => {
    if (!orderReference) {
      setOrderStatus({ found: false, status: 'unknown' })
      setHasChecked(true)
      return
    }

    let attempts = 0
    let cancelled = false

    const poll = async () => {
      const response = await fetch(`/api/orders/status?orderReference=${encodeURIComponent(orderReference)}`)
      const data = (await response.json()) as OrderStatus
      if (cancelled) return

      setOrderStatus(data)
      setHasChecked(true)

      if (!data.found) return

      if (data.status === 'paid' && data.emailSent === false) {
        await fetch('/api/orders/ensure-ticket', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderReference }),
        })
        const refreshed = await fetch(`/api/orders/status?orderReference=${encodeURIComponent(orderReference)}`)
        const refreshedData = (await refreshed.json()) as OrderStatus
        if (!cancelled) setOrderStatus(refreshedData)
      }

      if (data.found && data.status !== 'paid' && data.status !== 'failed' && attempts < 8) {
        attempts += 1
        window.setTimeout(poll, 2500)
      }
    }

    poll()

    return () => {
      cancelled = true
    }
  }, [orderReference])

  const isNotFound = hasChecked && (!orderReference || orderStatus?.found === false)
  const isPaid = orderStatus?.found === true && orderStatus.status === 'paid'
  const isFailed = orderStatus?.found === true && orderStatus.status === 'failed'
  const isPending =
    orderStatus?.found === true &&
    (orderStatus.status === 'pending' || orderStatus.status === 'unknown' || !orderStatus.status)

  const tickets = useMemo(() => {
    if (!isPaid || !orderReference) return []
    if (orderStatus?.tickets?.length) {
      return orderStatus.tickets
    }
    return [{ ticketCode: '', sequence: 1, checkInStatus: 'none' }]
  }, [isPaid, orderReference, orderStatus?.tickets])

  const handleShare = useCallback(async (ticketCode?: string) => {
    if (!orderReference) return

    const downloadUrl = ticketDownloadUrl(orderReference, ticketCode || undefined)
    setShareError(null)
    setIsSharing(true)
    setSharingTicketCode(ticketCode ?? '')

    try {
      const response = await fetch(downloadUrl)
      if (!response.ok) throw new Error('download-failed')

      const blob = await response.blob()
      const suffix = ticketCode ? `-${ticketCode}` : ''
      const file = new File([blob], `PROyav-kvitok${suffix}.png`, { type: 'image/png' })
      const shareData = {
        title: 'Мій квиток на PROяв івент',
        text: `Квиток на PROяв івент — ${EVENT.dateShort}, ${EVENT.venueFull}`,
        files: [file],
      }

      if (navigator.canShare?.(shareData)) {
        await navigator.share(shareData)
        return
      }

      if (navigator.share) {
        await navigator.share({
          title: shareData.title,
          text: shareData.text,
          url: window.location.href,
        })
        return
      }

      setShareError('Поділитися не вдалося — завантаж файл і надішли вручну.')
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
      setShareError('Поділитися не вдалося — спробуй завантажити квиток.')
    } finally {
      setIsSharing(false)
      setSharingTicketCode(null)
    }
  }, [orderReference])

  if (!hasChecked) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <p className={styles.eyebrow}>PROяв івент</p>
          <h1 className={styles.title}>Перевіряємо оплату…</h1>
          <p className={styles.lead}>Зачекай кілька секунд.</p>
        </div>
      </div>
    )
  }

  if (isNotFound) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <p className={styles.eyebrow}>PROяв івент</p>
          <h1 className={styles.title}>Оплату не знайдено</h1>
          <p className={styles.lead}>
            Ми не знайшли замовлення за цим посиланням. Перевір номер замовлення в листі від WayForPay
            або звернись до нас — допоможемо знайти квиток.
          </p>

          {orderReference && (
            <div className={styles.details}>
              <p><span>Замовлення:</span> {orderReference}</p>
            </div>
          )}

          <p className={styles.note}>
            Напиши нам на{' '}
            <a href={`mailto:${LINKS.email}`}>{LINKS.email}</a>
            {' '}або в{' '}
            <a href={LINKS.telegram} target="_blank" rel="noopener noreferrer">Telegram-чат</a>.
          </p>

          <div className={styles.actions}>
            <Link href="/#kvitky" className={styles.primary}>
              Купити квиток
            </Link>
            <Link href="/" className={styles.secondary}>
              На головну
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <p className={styles.eyebrow}>PROяв івент</p>
        <h1 className={styles.title}>
          {isPaid ? 'Оплату підтверджено!' : isFailed ? 'Оплату не підтверджено' : 'Дякуємо! Оплата в обробці'}
        </h1>
        <p className={styles.lead}>
          {isPaid
            ? tickets.length > 1
              ? `Квитки (${tickets.length}) надіслано на email. Можеш зберегти або поділитися кожним тут.`
              : 'Квиток надіслано на email як файл-запрошення з QR-кодом. Можеш також зберегти або поділитися ним тут.'
            : isFailed
              ? 'Платіж не пройшов або був відхилений. Спробуй оформити квиток ще раз або напиши нам.'
              : 'Зачекай кілька секунд — ми підтверджуємо платіж. Лист із файлом квитка прийде автоматично.'}
        </p>

        {isPaid && tickets.length > 0 && (
          <div className={styles.ticketGrid}>
            {tickets.map((ticket) => {
              const previewUrl = ticketPreviewUrl(orderReference, ticket.ticketCode || undefined)
              const downloadUrl = ticketDownloadUrl(orderReference, ticket.ticketCode || undefined)
              const label = tickets.length > 1 ? `Квиток ${ticket.sequence}` : 'Твій квиток'

              return (
                <div key={ticket.ticketCode || ticket.sequence} className={styles.ticketBlock}>
                  {tickets.length > 1 && <p className={styles.ticketLabel}>{label}</p>}
                  <img
                    src={previewUrl}
                    alt={`Запрошення на PROяв івент — ${label}`}
                    className={styles.ticketPreview}
                  />
                  <div className={styles.ticketActions}>
                    <a href={downloadUrl} download className={styles.download}>
                      Завантажити
                    </a>
                    <button
                      type="button"
                      className={styles.share}
                      onClick={() => void handleShare(ticket.ticketCode || undefined)}
                      disabled={isSharing && sharingTicketCode === (ticket.ticketCode ?? '')}
                    >
                      {isSharing && sharingTicketCode === (ticket.ticketCode ?? '') ? 'Готуємо…' : 'Поділитися'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
        {shareError && <p className={styles.shareError}>{shareError}</p>}

        <div className={styles.details}>
          <p><span>Дата:</span> {EVENT.dateShort}</p>
          <p><span>Локація:</span> {EVENT.venueFull}</p>
          {orderStatus?.tierName && <p><span>Тариф:</span> {orderStatus.tierName}</p>}
          {orderStatus?.quantity && orderStatus.quantity > 1 && (
            <p><span>Кількість:</span> {orderStatus.quantity} квитків</p>
          )}
          {orderReference && <p><span>Замовлення:</span> {orderReference}</p>}
          {orderStatus?.amount ? <p><span>Сума:</span> {orderStatus.amount.toLocaleString('uk-UA')} ₴</p> : null}
        </div>

        {isPending && (
          <p className={styles.note}>
            Якщо лист не прийшов протягом 10 хвилин — перевір «Спам» або напиши нам на{' '}
            <a href={`mailto:${LINKS.email}`}>{LINKS.email}</a>.
          </p>
        )}

        {isPaid && orderStatus?.emailSent === false && (
          <p className={styles.note}>
            Платіж підтверджено. Лист із квитком надсилається — перевір пошту за кілька хвилин.
          </p>
        )}

        {isPaid && (
          <div className={styles.telegramBlock}>
            <p className={styles.telegramTitle}>Приєднуйся до чату PROяв: знайомства</p>
            <p className={styles.telegramText}>
              Там збираються учасниці події з Тернополя та інших міст — оновлення, знайомства та атмосфера перед івентом.
            </p>
            <a href={LINKS.telegram} target="_blank" rel="noopener noreferrer" className={styles.telegramBtn}>
              Перейти в чат
            </a>
          </div>
        )}

        <div className={styles.actions}>
          {isPaid ? (
            <Link href="/#kvitky" className={styles.secondary}>
              На головну
            </Link>
          ) : (
            <>
              {!isFailed && (
                <a href={LINKS.telegram} target="_blank" rel="noopener noreferrer" className={styles.primary}>
                  Перейти в чат
                </a>
              )}
              {isFailed && (
                <Link href="/#kvitky" className={styles.primary}>
                  Спробувати ще раз
                </Link>
              )}
              <Link href="/" className={styles.secondary}>
                На головну
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div className={styles.page}><div className={styles.card}>Завантаження...</div></div>}>
      <SuccessContent />
    </Suspense>
  )
}

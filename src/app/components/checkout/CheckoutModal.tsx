'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { TicketTierId } from '@/lib/tickets'
import type { UpgradeQuote } from '@/lib/tier-upgrade'
import { LINKS } from '@/app/constants'
import { useCheckout } from './CheckoutContext'
import styles from './CheckoutModal.module.css'

function formatPrice(amount: number) {
  return new Intl.NumberFormat('uk-UA').format(amount)
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

export default function CheckoutModal() {
  const { isOpen, tierId, closeCheckout } = useCheckout()
  const [selectedTierId, setSelectedTierId] = useState<TicketTierId>('standard')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [promoOpen, setPromoOpen] = useState(false)
  const [promoCode, setPromoCode] = useState('')
  const [promoPercent, setPromoPercent] = useState(0)
  const [promoMessage, setPromoMessage] = useState('')
  const [promoStatus, setPromoStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [submitError, setSubmitError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCheckingPromo, setIsCheckingPromo] = useState(false)
  const [tierName, setTierName] = useState('')
  const [tierPrice, setTierPrice] = useState(0)
  const [quote, setQuote] = useState<UpgradeQuote>({ kind: 'new' })
  const [isCheckingQuote, setIsCheckingQuote] = useState(false)

  useEffect(() => {
    if (isOpen && tierId) {
      setSelectedTierId(tierId)
    }
  }, [isOpen, tierId])

  useEffect(() => {
    if (!isOpen) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeCheckout()
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [isOpen, closeCheckout])

  const checkUpgradeQuote = useCallback(async () => {
    if (!isOpen) return

    setIsCheckingQuote(true)
    setSubmitError('')

    try {
      const response = await fetch('/api/checkout/upgrade-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tierId: selectedTierId,
          email: isValidEmail(email) ? email.trim() : '',
        }),
      })
      const data = (await response.json()) as {
        quote?: UpgradeQuote
        tierName?: string
        tierPrice?: number
        error?: string
      }

      if (!response.ok) {
        setSubmitError(data.error ?? 'Не вдалося перевірити тариф')
        return
      }

      setQuote(data.quote ?? { kind: 'new' })
      setTierName(data.tierName ?? '')
      setTierPrice(data.tierPrice ?? 0)
    } catch {
      setSubmitError('Не вдалося перевірити тариф')
    } finally {
      setIsCheckingQuote(false)
    }
  }, [email, isOpen, selectedTierId])

  useEffect(() => {
    if (!isOpen) return
    const timer = window.setTimeout(() => {
      void checkUpgradeQuote()
    }, 300)
    return () => window.clearTimeout(timer)
  }, [checkUpgradeQuote, isOpen, selectedTierId])

  const resetPromo = () => {
    setPromoPercent(0)
    setPromoMessage('')
    setPromoStatus('idle')
  }

  const applyPromo = async () => {
    if (!promoCode.trim()) {
      resetPromo()
      return
    }

    setIsCheckingPromo(true)
    setSubmitError('')

    try {
      const response = await fetch('/api/promo/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: promoCode }),
      })
      const data = (await response.json()) as {
        valid: boolean
        percent?: number
        message: string
      }

      if (data.valid && data.percent !== undefined) {
        setPromoPercent(data.percent)
        setPromoMessage(data.message)
        setPromoStatus('success')
      } else {
        setPromoPercent(0)
        setPromoMessage(data.message)
        setPromoStatus('error')
      }
    } catch {
      setPromoPercent(0)
      setPromoMessage('Не вдалося перевірити промокод')
      setPromoStatus('error')
    } finally {
      setIsCheckingPromo(false)
    }
  }

  const pricing = useMemo(() => {
    const basePrice = tierPrice
    const discountedPrice = promoPercent ? Math.round(basePrice * (1 - promoPercent / 100)) : basePrice
    const upgradeCredit = quote.kind === 'upgrade' ? quote.credit : 0
    const amountDue = Math.max(0, discountedPrice - upgradeCredit)

    return {
      basePrice,
      discountedPrice,
      upgradeCredit,
      amountDue,
    }
  }, [promoPercent, quote, tierPrice])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitError('')

    if (quote.kind === 'blocked') {
      setSubmitError(quote.message)
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tierId: selectedTierId,
          name,
          email,
          phone,
          promoCode: promoPercent ? promoCode : '',
        }),
      })

      const data = (await response.json()) as {
        paymentUrl?: string
        error?: string
      }

      if (!response.ok || !data.paymentUrl) {
        setSubmitError(data.error ?? 'Не вдалося створити посилання на оплату')
        return
      }

      window.location.href = data.paymentUrl
    } catch {
      setSubmitError('Не вдалося створити посилання на оплату')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className={styles.overlay} onClick={closeCheckout} role="presentation">
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="checkout-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.header}>
          <div>
            <h2 id="checkout-title" className={styles.title}>Оплата квитка</h2>
            <p className={styles.subtitle}>
              Заповни дані — запрошення надійде на email після оплати.
            </p>
          </div>
          <button type="button" className={styles.close} onClick={closeCheckout} aria-label="Закрити">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
              <path d="M4 4 L14 14 M14 4 L4 14" />
            </svg>
          </button>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="checkout-name">Імʼя</label>
            <input
              id="checkout-name"
              className={styles.input}
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Як до вас звертатись"
              required
              autoComplete="name"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="checkout-email">Email</label>
            <input
              id="checkout-email"
              className={styles.input}
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              onBlur={() => void checkUpgradeQuote()}
              placeholder="На цю адресу надійде запрошення"
              required
              autoComplete="email"
            />
            {quote.kind === 'upgrade' && (
              <p className={styles.upgradeNote}>
                Знайдено квиток «{quote.fromTierName}». До оплати буде зараховано {formatPrice(quote.credit)} ₴.
              </p>
            )}
            {quote.kind === 'blocked' && (
              <p className={styles.upgradeBlocked}>{quote.message}</p>
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="checkout-phone">Телефон</label>
            <input
              id="checkout-phone"
              className={styles.input}
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="+380 XX XXX XX XX"
              required
              autoComplete="tel"
            />
          </div>

          {!promoOpen ? (
            <button
              type="button"
              className={styles.promoToggle}
              onClick={() => setPromoOpen(true)}
            >
              Є промокод?
            </button>
          ) : (
            <div className={styles.field}>
              <label className={styles.label} htmlFor="checkout-promo">Промокод</label>
              <div className={styles.promoRow}>
                <input
                  id="checkout-promo"
                  className={styles.input}
                  type="text"
                  value={promoCode}
                  onChange={(event) => {
                    setPromoCode(event.target.value.toUpperCase())
                    if (promoStatus !== 'idle') resetPromo()
                  }}
                  placeholder="Для спікерів та блогерів"
                />
                <button
                  type="button"
                  className={styles.promoApply}
                  onClick={applyPromo}
                  disabled={isCheckingPromo}
                >
                  {isCheckingPromo ? '...' : 'Застосувати'}
                </button>
              </div>
              {promoMessage && (
                <p className={`${styles.promoMessage} ${promoStatus === 'success' ? styles.promoSuccess : styles.promoError}`}>
                  {promoMessage}
                </p>
              )}
            </div>
          )}

          {tierPrice > 0 && (
            <div className={styles.summary}>
              <div className={styles.summaryRow}>
                <span>{tierName || 'Тариф'}</span>
                <span>{formatPrice(pricing.basePrice)} ₴</span>
              </div>
              {promoPercent > 0 && (
                <div className={styles.summaryRow}>
                  <span>Промокод −{promoPercent}%</span>
                  <span>{formatPrice(pricing.discountedPrice)} ₴</span>
                </div>
              )}
              {pricing.upgradeCredit > 0 && (
                <div className={styles.summaryRow}>
                  <span>Зараховано за попередній квиток</span>
                  <span>−{formatPrice(pricing.upgradeCredit)} ₴</span>
                </div>
              )}
              <div className={`${styles.summaryRow} ${styles.summaryTotal}`}>
                <span>До оплати</span>
                <span>{isCheckingQuote ? '...' : `${formatPrice(pricing.amountDue)} ₴`}</span>
              </div>
            </div>
          )}

          {submitError && <p className={styles.error}>{submitError}</p>}

          <button
            type="submit"
            className={styles.submit}
            disabled={isSubmitting || isCheckingQuote || quote.kind === 'blocked'}
          >
            {isSubmitting ? 'Створюємо оплату...' : 'Перейти до оплати'}
          </button>

          <p className={styles.hint}>
            Оплата проходить через WayForPay. Оформлюючи замовлення, ви погоджуєтесь з{' '}
            <a href={LINKS.terms} target="_blank" rel="noopener noreferrer">умовами продажу та повернення</a>.
            Після оплати ви отримаєте запрошення на email та зможете долучитись до{' '}
            <a href={LINKS.telegram} target="_blank" rel="noopener noreferrer">Telegram-чату події</a>.
          </p>
        </form>
      </div>
    </div>
  )
}

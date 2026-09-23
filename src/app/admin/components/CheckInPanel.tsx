'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { StoredOrder, TicketScanRecord } from '@/lib/store'
import { VERDICT_LABELS, type TicketVerdict } from '@/lib/ticket-checkin'

type DashboardStats = {
  purchased: number
  waiting: number
  admitted: number
  rejected: number
  pendingPayment: number
  failedPayment: number
}

type LookupResult = {
  found: boolean
  ok: boolean
  title: string
  message: string
  verdict: TicketVerdict
  order?: StoredOrder
  canAdmit?: boolean
  scanCount?: number
  isRepeatScan?: boolean
  paymentLabel?: string
  checkInLabel?: string
}

type DashboardData = {
  stats: DashboardStats
  waiting: StoredOrder[]
  admitted: StoredOrder[]
  rejected: StoredOrder[]
  recentScans: TicketScanRecord[]
}

type ListFilter = 'waiting' | 'admitted' | 'rejected' | 'scans' | null

function formatWhen(value?: string) {
  if (!value) return '—'
  return new Date(value).toLocaleString('uk-UA')
}

function OrderMiniCard({ order }: { order: StoredOrder }) {
  return (
    <article className="adminTicketCard adminTicketCardCompact">
      <div className="adminTicketHead">
        <div>
          <p className="adminTicketCode">{order.ticketCode ?? '—'}</p>
          <h3>{order.name}</h3>
        </div>
        <span className="adminCheckInTier">{order.tierName}</span>
      </div>
      <div className="adminTicketMeta">
        <p><span>Email</span>{order.email}</p>
        <p><span>Телефон</span>{order.phone}</p>
        <p><span>Промокод</span>{order.promoCode || '—'}</p>
        <p><span>Сума</span>{order.amount.toLocaleString('uk-UA')} ₴</p>
        {order.checkedInAt && <p><span>Вхід</span>{formatWhen(order.checkedInAt)}</p>}
      </div>
    </article>
  )
}

export default function CheckInPanel() {
  const [query, setQuery] = useState('')
  const [result, setResult] = useState<LookupResult | null>(null)
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [listFilter, setListFilter] = useState<ListFilter>(null)
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [scannerOn, setScannerOn] = useState(false)
  const [scannerError, setScannerError] = useState('')
  const scannerRef = useRef<{ stop: () => Promise<void> } | null>(null)
  const lastScanRef = useRef({ value: '', at: 0 })

  const loadDashboard = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/tickets/check-in-dashboard')
      const data = (await response.json()) as DashboardData
      setDashboard(data)
    } catch {
      // keep previous dashboard data
    }
  }, [])

  useEffect(() => {
    void loadDashboard()
  }, [loadDashboard])

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop()
      } catch {
        // scanner may already be stopped
      }
      scannerRef.current = null
    }
    setScannerOn(false)
  }, [])

  useEffect(() => () => {
    void stopScanner()
  }, [stopScanner])

  const runLookup = useCallback(async (value: string) => {
    const trimmed = value.trim()
    if (!trimmed) return

    setLoading(true)
    try {
      const response = await fetch('/api/admin/tickets/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: trimmed }),
      })
      const data = (await response.json()) as LookupResult
      setResult(data)
      await loadDashboard()
    } catch {
      setResult({
        found: false,
        ok: false,
        title: 'Не OK',
        message: 'Помилка перевірки',
        verdict: 'not_found',
      })
    } finally {
      setLoading(false)
    }
  }, [loadDashboard])

  const handleScan = useCallback((decoded: string) => {
    if (!decoded) return
    const now = Date.now()
    if (decoded === lastScanRef.current.value && now - lastScanRef.current.at < 1200) return
    lastScanRef.current = { value: decoded, at: now }
    setQuery(decoded)
    void runLookup(decoded)
  }, [runLookup])

  useEffect(() => {
    if (!scannerOn) return undefined

    let cancelled = false

    const startScanner = async () => {
      setScannerError('')
      try {
        const { Html5Qrcode } = await import('html5-qrcode')
        if (cancelled) return

        const scanner = new Html5Qrcode('admin-qr-reader')
        scannerRef.current = scanner

        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 260, height: 260 } },
          (text) => handleScan(text),
          () => undefined,
        )
      } catch {
        if (!cancelled) {
          setScannerError('Не вдалося увімкнути камеру. Дозвольте доступ або введіть код вручну.')
          setScannerOn(false)
        }
      }
    }

    void startScanner()

    return () => {
      cancelled = true
      void stopScanner()
    }
  }, [scannerOn, handleScan, stopScanner])

  const handleCheckIn = async (action: 'admit' | 'reject') => {
    const trimmed = query.trim()
    if (!trimmed) return

    setLoading(true)
    try {
      const response = await fetch('/api/admin/tickets/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: trimmed, action, note }),
      })
      const data = (await response.json()) as LookupResult & { order?: StoredOrder }
      setResult(data)
      if (action === 'admit') setNote('')
      await loadDashboard()
    } catch {
      setResult({
        found: false,
        ok: false,
        title: 'Не OK',
        message: 'Помилка збереження',
        verdict: 'not_found',
      })
    } finally {
      setLoading(false)
    }
  }

  const order = result?.order
  const stats = dashboard?.stats

  const filteredOrders =
    listFilter === 'waiting'
      ? dashboard?.waiting ?? []
      : listFilter === 'admitted'
        ? dashboard?.admitted ?? []
        : listFilter === 'rejected'
          ? dashboard?.rejected ?? []
          : []

  const listTitles: Record<Exclude<ListFilter, null>, string> = {
    waiting: 'Очікують на вхід',
    admitted: 'Використані квитки',
    rejected: 'Відхилені',
    scans: 'Журнал сканувань',
  }

  return (
    <div className="adminCheckIn">
      {stats && (
        <div className="adminCheckInStats">
          <button type="button" className="adminCheckInStat" onClick={() => setListFilter(listFilter === 'waiting' ? null : 'waiting')}>
            <strong>{stats.waiting}</strong>
            <span>Очікують</span>
          </button>
          <button type="button" className="adminCheckInStat" onClick={() => setListFilter(listFilter === 'admitted' ? null : 'admitted')}>
            <strong>{stats.admitted}</strong>
            <span>Використані</span>
          </button>
          <button type="button" className="adminCheckInStat adminCheckInStatAccent">
            <strong>{stats.purchased}</strong>
            <span>Придбані</span>
          </button>
          <button type="button" className="adminCheckInStat" onClick={() => setListFilter(listFilter === 'rejected' ? null : 'rejected')}>
            <strong>{stats.rejected}</strong>
            <span>Відхилені</span>
          </button>
          <button type="button" className="adminCheckInStat" onClick={() => setListFilter(listFilter === 'scans' ? null : 'scans')}>
            <strong>{dashboard?.recentScans.length ?? 0}</strong>
            <span>Сканування</span>
          </button>
        </div>
      )}

      <button
        type="button"
        className={scannerOn ? 'adminCheckInScanBtn adminCheckInScanBtnActive' : 'adminCheckInScanBtn'}
        onClick={() => {
          if (scannerOn) void stopScanner()
          else setScannerOn(true)
        }}
      >
        <span className="adminCheckInScanBtnIcon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <path d="M14 14h2v2h-2zM18 14h3v3h-3zM14 18h2v3h-2zM18 21h3v-3" />
          </svg>
        </span>
        <span className="adminCheckInScanBtnText">
          {scannerOn ? 'Зупинити сканування' : 'Відсканувати QR'}
        </span>
        {!scannerOn && <span className="adminCheckInScanBtnHint">Наведіть камеру на код з квитка</span>}
      </button>

      {scannerOn && (
        <div className="adminQrReaderWrap">
          <div id="admin-qr-reader" className="adminQrReader" />
        </div>
      )}

      <div className="adminCheckInToolbar">
        <input
          type="search"
          placeholder="PRO-XXXXXX або QR з квитка"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') void runLookup(query)
          }}
        />
        <button type="button" className="adminGhostBtn" onClick={() => void runLookup(query)} disabled={loading}>
          Перевірити
        </button>
      </div>
      {scannerError && <p className="adminCheckInError">{scannerError}</p>}

      {result && (
        <div className={`adminVerdict adminVerdict-${result.verdict} ${result.ok ? 'adminVerdict-ok' : 'adminVerdict-bad'}`}>
          <div className="adminVerdictTop">
            <span className="adminVerdictBadge">{result.title}</span>
            <span className="adminVerdictCode">{VERDICT_LABELS[result.verdict]}</span>
          </div>

          {order ? (
            <>
              <p className="adminVerdictName">{order.name}</p>
              <p className="adminVerdictTier">{order.tierName}</p>
              <p className="adminVerdictMeta">
                {order.ticketCode ?? 'Без коду'}
                {result.paymentLabel ? ` · ${result.paymentLabel}` : ''}
                {result.checkInLabel ? ` · ${result.checkInLabel}` : ''}
              </p>
              {order.promoCode ? (
                <p className="adminVerdictPromo">
                  Промокод: <strong>{order.promoCode}</strong>
                  {order.amount < 1 ? ' · безкоштовний квиток' : ''}
                </p>
              ) : (
                <p className="adminVerdictPromo adminVerdictPromoMuted">Промокод не використовувався</p>
              )}
              <p className="adminVerdictMeta">
                Сума: {order.amount.toLocaleString('uk-UA')} ₴
                {(order.quantity || 1) > 1 ? ` · квитків у замовленні: ${order.quantity}` : ''}
              </p>
            </>
          ) : (
            <p className="adminVerdictName">Квиток не знайдено</p>
          )}

          <p className="adminVerdictMessage">{result.message}</p>

          {result.isRepeatScan && (
            <p className="adminVerdictRepeat">
              Повторне сканування
              {typeof result.scanCount === 'number' ? ` · спроб: ${result.scanCount}` : ''}
              {order?.checkedInAt ? ` · перший вхід: ${formatWhen(order.checkedInAt)}` : ''}
            </p>
          )}

          {order && result.canAdmit && (
            <div className="adminCheckInActions">
              <button
                type="button"
                className="adminCheckInAdmit"
                disabled={loading}
                onClick={() => void handleCheckIn('admit')}
              >
                Підтвердити вхід
              </button>
              <button
                type="button"
                className="adminCheckInReject"
                disabled={loading}
                onClick={() => void handleCheckIn('reject')}
              >
                Відхилити
              </button>
            </div>
          )}
        </div>
      )}

      {listFilter && listFilter !== 'scans' && (
        <section className="adminCheckInListSection">
          <h3 className="adminCheckInListTitle">{listTitles[listFilter]}</h3>
          <div className="adminTicketList">
            {filteredOrders.length === 0 ? (
              <p className="adminHint">Порожньо</p>
            ) : (
              filteredOrders.map((item) => <OrderMiniCard key={item.orderReference} order={item} />)
            )}
          </div>
        </section>
      )}

      {listFilter === 'scans' && dashboard && (
        <section className="adminCheckInListSection">
          <h3 className="adminCheckInListTitle">{listTitles.scans}</h3>
          <div className="adminScanFeed">
            {dashboard.recentScans.length === 0 ? (
              <p className="adminHint">Сканувань ще не було</p>
            ) : (
              dashboard.recentScans.map((scan) => (
                <article key={scan.id} className={`adminScanItem adminScanItem-${scan.result}`}>
                  <div className="adminScanItemHead">
                    <strong>{scan.guestName ?? 'Невідомий квиток'}</strong>
                    <span className={scan.result === 'valid' ? 'adminScanOk' : 'adminScanBad'}>
                      {scan.result === 'valid' ? 'OK' : 'Не OK'}
                    </span>
                  </div>
                  <p className="adminScanItemTier">{scan.tierName ?? '—'}</p>
                  <p className="adminScanItemMeta">
                    {scan.ticketCode ?? scan.orderReference ?? '—'} · {VERDICT_LABELS[scan.result]} · {formatWhen(scan.scannedAt)}
                  </p>
                  <p className="adminScanItemMessage">{scan.message}</p>
                </article>
              ))
            )}
          </div>
        </section>
      )}

      {!listFilter && dashboard && dashboard.recentScans.length > 0 && (
        <section className="adminCheckInListSection">
          <h3 className="adminCheckInListTitle">Останні сканування</h3>
          <div className="adminScanFeed">
            {dashboard.recentScans.slice(0, 8).map((scan) => (
              <article key={scan.id} className={`adminScanItem adminScanItem-${scan.result}`}>
                <div className="adminScanItemHead">
                  <strong>{scan.guestName ?? 'Невідомий квиток'}</strong>
                  <span className={scan.result === 'valid' ? 'adminScanOk' : 'adminScanBad'}>
                    {scan.result === 'valid' ? 'OK' : 'Не OK'}
                  </span>
                </div>
                <p className="adminScanItemTier">{scan.tierName ?? '—'}</p>
                <p className="adminScanItemMeta">
                  {scan.ticketCode ?? '—'} · {formatWhen(scan.scannedAt)}
                </p>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

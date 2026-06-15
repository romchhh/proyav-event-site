'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { StoredOrder } from '@/lib/store'
import type { TicketTierId } from '@/lib/tickets'

type PreviewMode = 'sample' | 'order'

type OrdersResponse = {
  orders: StoredOrder[]
}

const TIER_OPTIONS: { id: TicketTierId; label: string }[] = [
  { id: 'standard', label: 'Стандарт' },
  { id: 'golden', label: 'Golden' },
  { id: 'vip', label: 'VIP' },
]

export default function TicketPreviewTab() {
  const [mode, setMode] = useState<PreviewMode>('sample')
  const [name, setName] = useState('Олена Коваленко')
  const [tierId, setTierId] = useState<TicketTierId>('standard')
  const [orderReference, setOrderReference] = useState('')
  const [orders, setOrders] = useState<StoredOrder[]>([])
  const [loadingOrders, setLoadingOrders] = useState(true)
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [previewKey, setPreviewKey] = useState(0)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadOrders = async () => {
      setLoadingOrders(true)
      try {
        const response = await fetch('/api/admin/tickets?status=paid')
        const data = (await response.json()) as OrdersResponse
        setOrders(data.orders)
        if (data.orders[0]) {
          setOrderReference((current) => current || data.orders[0].orderReference)
        }
      } catch {
        setError('Не вдалося завантажити замовлення')
      } finally {
        setLoadingOrders(false)
      }
    }

    void loadOrders()
  }, [])

  const previewUrl = useMemo(() => {
    const params = new URLSearchParams()
    if (mode === 'order' && orderReference) {
      params.set('orderReference', orderReference)
    } else {
      params.set('name', name)
      params.set('tierId', tierId)
    }
    params.set('t', String(previewKey))
    return `/api/admin/tickets/preview?${params.toString()}`
  }, [mode, name, tierId, orderReference, previewKey])

  const refreshPreview = useCallback(() => {
    setError('')
    setLoadingPreview(true)
    setPreviewKey((current) => current + 1)
  }, [])

  useEffect(() => {
    if (mode === 'order' && !orderReference) return
    refreshPreview()
  }, [mode, tierId, orderReference, refreshPreview])

  const selectedOrder = orders.find((order) => order.orderReference === orderReference)

  return (
    <div className="adminTicketPreview">
      <div className="adminTicketPreviewIntro">
        <h2 className="adminBlockTitle">Вигляд квитка</h2>
        <p className="adminHint">
          Превʼю PNG-запрошення, яке отримує гість у листі після оплати. Зміни в контенті події та банері відображаються тут одразу.
        </p>
      </div>

      <div className="adminTicketPreviewControls">
        <div className="adminTicketPreviewModes">
          <button
            type="button"
            className={mode === 'sample' ? 'adminTicketsViewActive' : 'adminTicketsView'}
            onClick={() => setMode('sample')}
          >
            Тестові дані
          </button>
          <button
            type="button"
            className={mode === 'order' ? 'adminTicketsViewActive' : 'adminTicketsView'}
            onClick={() => setMode('order')}
          >
            Реальне замовлення
          </button>
        </div>

        {mode === 'sample' ? (
          <div className="adminTicketPreviewFields">
            <label className="adminField">
              <span>Імʼя на квитку</span>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                onBlur={refreshPreview}
              />
            </label>
            <label className="adminField">
              <span>Тариф</span>
              <select value={tierId} onChange={(event) => setTierId(event.target.value as TicketTierId)}>
                {TIER_OPTIONS.map((tier) => (
                  <option key={tier.id} value={tier.id}>{tier.label}</option>
                ))}
              </select>
            </label>
          </div>
        ) : (
          <div className="adminTicketPreviewFields">
            <label className="adminField">
              <span>Оплачене замовлення</span>
              <select
                value={orderReference}
                onChange={(event) => setOrderReference(event.target.value)}
                disabled={loadingOrders || orders.length === 0}
              >
                {orders.length === 0 ? (
                  <option value="">Немає оплачених замовлень</option>
                ) : (
                  orders.map((order) => (
                    <option key={order.orderReference} value={order.orderReference}>
                      {order.name} · {order.tierName} · {order.ticketCode ?? order.orderReference}
                    </option>
                  ))
                )}
              </select>
            </label>
            {selectedOrder && (
              <p className="adminHint">
                {selectedOrder.email} · {selectedOrder.amount} ₴ · {selectedOrder.orderReference}
              </p>
            )}
          </div>
        )}

        <div className="adminTicketPreviewActions">
          <button type="button" className="adminGhostBtn" onClick={refreshPreview} disabled={loadingPreview}>
            {loadingPreview ? 'Оновлюємо…' : 'Оновити превʼю'}
          </button>
          <a
            href={previewUrl}
            className="adminCheckInAdmit adminTicketPreviewDownload"
            download="proyav-ticket-preview.png"
          >
            Завантажити PNG
          </a>
        </div>
      </div>

      {error && <p className="adminCheckInError">{error}</p>}

      <div className="adminTicketPreviewFrame">
        {(mode === 'sample' || orderReference) ? (
          <img
            key={previewKey}
            src={previewUrl}
            alt="Превʼю квитка PROяв івент"
            className="adminTicketPreviewImage"
            onLoad={() => setLoadingPreview(false)}
            onError={() => {
              setLoadingPreview(false)
              setError('Не вдалося завантажити превʼю квитка')
            }}
          />
        ) : (
          <p className="adminHint">Оберіть замовлення для перегляду</p>
        )}
        {loadingPreview && <p className="adminTicketPreviewLoading">Генеруємо квиток…</p>}
      </div>
    </div>
  )
}

'use client'

import { useEffect, useMemo, useState } from 'react'
import type { TicketTierId } from '@/lib/tickets'

type PromoItem = {
  code: string
  percent: number
  tierId: TicketTierId | null
  tierLabel: string | null
  maxUses: number | null
  label: string | null
  usedCount: number
  exhausted: boolean
}

type DraftPromo = {
  code: string
  percent: string
  tierId: '' | TicketTierId
  maxUses: string
}

function generatePromoCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let suffix = ''
  for (let i = 0; i < 6; i += 1) {
    suffix += chars[Math.floor(Math.random() * chars.length)]
  }
  return `PRO${suffix}`
}

export default function PromoTab() {
  const [items, setItems] = useState<PromoItem[]>([])
  const [draft, setDraft] = useState<DraftPromo>({
    code: '',
    percent: '15',
    tierId: '',
    maxUses: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [seeding, setSeeding] = useState(false)
  const [message, setMessage] = useState('')
  const [dirty, setDirty] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/promo')
      const data = (await response.json()) as { promoCodes: PromoItem[] }
      setItems(data.promoCodes)
      setDirty(false)
    } catch {
      setMessage('Не вдалося завантажити промокоди')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const promoMap = useMemo(() => {
    const map: Record<string, { percent: number; tierId?: TicketTierId; maxUses?: number; label?: string }> = {}
    for (const item of items) {
      map[item.code] = {
        percent: item.percent,
        ...(item.tierId ? { tierId: item.tierId } : {}),
        ...(item.maxUses ? { maxUses: item.maxUses } : {}),
        ...(item.label ? { label: item.label } : {}),
      }
    }
    return map
  }, [items])

  const handleSave = async () => {
    setSaving(true)
    setMessage('')
    try {
      const response = await fetch('/api/admin/promo', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ promoCodes: promoMap }),
      })
      if (!response.ok) throw new Error('save failed')
      setDirty(false)
      setMessage('Промокоди збережено')
      await load()
    } catch {
      setMessage('Помилка збереження')
    } finally {
      setSaving(false)
    }
  }

  const seedPresets = async () => {
    setSeeding(true)
    setMessage('')
    try {
      const response = await fetch('/api/admin/promo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'seed-presets' }),
      })
      const data = (await response.json()) as { message?: string; error?: string }
      if (!response.ok) throw new Error(data.error ?? 'seed failed')
      setMessage(data.message ?? 'Пресет-коди додано')
      await load()
    } catch {
      setMessage('Не вдалося додати пресет-коди')
    } finally {
      setSeeding(false)
    }
  }

  const addPromo = () => {
    const code = draft.code.trim().toUpperCase()
    const percent = Number(draft.percent)
    const maxUses = draft.maxUses.trim() ? Number(draft.maxUses) : null

    if (!/^[A-Z0-9_-]{3,32}$/.test(code)) {
      setMessage('Код: 3–32 символи, латиниця, цифри, _ або -')
      return
    }
    if (!Number.isFinite(percent) || percent < 1 || percent > 100) {
      setMessage('Знижка має бути від 1% до 100%')
      return
    }
    if (maxUses !== null && (!Number.isFinite(maxUses) || maxUses < 1)) {
      setMessage('Ліміт використань має бути ≥ 1 або порожнім (безліміт)')
      return
    }
    if (items.some((item) => item.code === code)) {
      setMessage('Такий промокод уже є')
      return
    }

    const tierId = draft.tierId || null
    setItems((current) =>
      [
        ...current,
        {
          code,
          percent,
          tierId,
          tierLabel: tierId === 'vip' ? 'VIP' : tierId === 'golden' ? 'Золотий' : tierId === 'standard' ? 'Стандарт' : null,
          maxUses,
          label: null,
          usedCount: 0,
          exhausted: false,
        },
      ].sort((a, b) => a.code.localeCompare(b.code, 'uk')),
    )
    setDraft({ code: '', percent: draft.percent, tierId: draft.tierId, maxUses: draft.maxUses })
    setDirty(true)
    setMessage('')
  }

  const updatePercent = (code: string, percentRaw: string) => {
    const percent = Number(percentRaw)
    if (!Number.isFinite(percent) || percent < 1 || percent > 100) return
    setItems((current) => current.map((item) => (item.code === code ? { ...item, percent } : item)))
    setDirty(true)
  }

  const removePromo = (code: string) => {
    setItems((current) => current.filter((item) => item.code !== code))
    setDirty(true)
  }

  return (
    <div className="adminPromoPage">
      <div className="adminPromoIntro">
        <h2 className="adminBlockTitle">Промокоди</h2>
        <p className="adminHint">
          Коди застосовуються в checkout на сайті (не в кабінеті WayForPay). Можна обмежити тариф і кількість використань.
        </p>
      </div>

      <div className="adminPromoSeed">
        <div>
          <p className="adminPromoSeedTitle">Пресет організаторів і спікерів</p>
          <p className="adminHint">
            FOUNDER (−15%, безліміт), 30 одноразових org-кодів (VIP / Золотий / Стандарт по 100%),
            STOROZH / TKACH / MELI / KRAFT (−15%, безліміт). Існуючі коди не видаляються — лише додаються або оновлюються.
          </p>
        </div>
        <button type="button" className="adminCheckInAdmit" onClick={() => void seedPresets()} disabled={seeding}>
          {seeding ? 'Додаємо…' : 'Додати всі пресет-коди'}
        </button>
      </div>

      <div className="adminPromoCreate">
        <label className="adminField">
          <span>Новий код</span>
          <input
            type="text"
            value={draft.code}
            onChange={(event) => setDraft((current) => ({ ...current, code: event.target.value.toUpperCase() }))}
            placeholder="Напр. SPEAKER10"
          />
        </label>
        <label className="adminField">
          <span>Знижка, %</span>
          <input
            type="number"
            min={1}
            max={100}
            value={draft.percent}
            onChange={(event) => setDraft((current) => ({ ...current, percent: event.target.value }))}
          />
        </label>
        <label className="adminField">
          <span>Тариф</span>
          <select
            value={draft.tierId}
            onChange={(event) =>
              setDraft((current) => ({ ...current, tierId: event.target.value as DraftPromo['tierId'] }))
            }
          >
            <option value="">Усі тарифи</option>
            <option value="standard">Стандарт</option>
            <option value="golden">Золотий</option>
            <option value="vip">VIP</option>
          </select>
        </label>
        <label className="adminField">
          <span>Ліміт використань</span>
          <input
            type="number"
            min={1}
            value={draft.maxUses}
            onChange={(event) => setDraft((current) => ({ ...current, maxUses: event.target.value }))}
            placeholder="Порожньо = безліміт"
          />
        </label>
        <div className="adminPromoCreateActions">
          <button type="button" className="adminGhostBtn" onClick={() => setDraft((current) => ({ ...current, code: generatePromoCode() }))}>
            Згенерувати код
          </button>
          <button type="button" className="adminCheckInAdmit" onClick={addPromo}>
            Додати
          </button>
        </div>
      </div>

      <div className="adminPromoToolbar">
        {dirty && <span className="adminDirtyInline">Є незбережені зміни</span>}
        <button type="button" className="adminSaveInline" onClick={() => void handleSave()} disabled={!dirty || saving}>
          {saving ? 'Зберігаємо…' : 'Зберегти промокоди'}
        </button>
      </div>

      {message && <p className="adminCheckInMessage">{message}</p>}

      {loading ? (
        <p className="adminHint">Завантаження…</p>
      ) : items.length === 0 ? (
        <p className="adminHint">Промокодів ще немає. Натисни «Додати всі пресет-коди» або створи вручну.</p>
      ) : (
        <div className="adminPromoList">
          {items.map((item) => (
            <article key={item.code} className={`adminPromoCard${item.exhausted ? ' adminPromoCardExhausted' : ''}`}>
              <div className="adminPromoCardHead">
                <div>
                  <p className="adminPromoCode">{item.code}</p>
                  {item.label && <p className="adminHint">{item.label}</p>}
                </div>
                <button type="button" className="adminDangerBtn" onClick={() => removePromo(item.code)}>
                  Видалити
                </button>
              </div>
              <div className="adminPromoCardBody">
                <label className="adminField">
                  <span>Знижка, %</span>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={item.percent}
                    onChange={(event) => updatePercent(item.code, event.target.value)}
                  />
                </label>
                <div className="adminPromoStats">
                  <p>
                    <span>Тариф</span>
                    <strong>{item.tierLabel ?? 'Усі'}</strong>
                  </p>
                  <p>
                    <span>Використано</span>
                    <strong>
                      {item.usedCount}
                      {item.maxUses ? ` / ${item.maxUses}` : ''}
                    </strong>
                  </p>
                  {item.exhausted && (
                    <p>
                      <span>Статус</span>
                      <strong>Вичерпано</strong>
                    </p>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

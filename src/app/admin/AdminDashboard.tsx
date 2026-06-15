'use client'

import { useEffect, useState } from 'react'
import type { SiteContent } from '@/lib/site-content/types'
import ContentTab from './components/ContentTab'
import AnalyticsTab from './components/AnalyticsTab'
import TicketsTab from './components/TicketsTab'
import PromoTab from './components/PromoTab'
import TicketPreviewTab from './components/TicketPreviewTab'
import { CONTENT_BLOCKS, type ContentBlockId } from './components/content-blocks'
import styles from './dashboard.module.css'

type TabId = 'dashboard' | 'content' | 'tickets' | 'promo' | 'ticket-preview'

export default function AdminDashboard() {
  const [tab, setTab] = useState<TabId>('dashboard')
  const [contentBlock, setContentBlock] = useState<ContentBlockId>('hero')
  const [content, setContent] = useState<SiteContent | null>(null)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetch('/api/admin/content')
      .then((response) => response.json())
      .then((data: SiteContent) => setContent(data))
      .catch(() => setMessage('Не вдалося завантажити контент'))
  }, [])

  const handleSave = async () => {
    if (!content) return
    setSaving(true)
    setMessage('')
    try {
      const response = await fetch('/api/admin/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(content),
      })
      if (!response.ok) throw new Error('save failed')
      setDirty(false)
      setMessage('Збережено')
    } catch {
      setMessage('Помилка збереження')
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' })
    window.location.href = '/admin/login'
  }

  return (
    <div className={styles.shell}>
      <div className={styles.stickyTop}>
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>PROяв івент</p>
            <h1 className={styles.title}>Адмін-панель</h1>
          </div>
          <div className={styles.headerActions}>
            {tab === 'content' && (
              <>
                {dirty && <span className={styles.dirtyBadge}>Є зміни</span>}
                <button type="button" className={styles.saveBtn} onClick={handleSave} disabled={!dirty || saving}>
                  {saving ? 'Зберігаємо…' : 'Зберегти'}
                </button>
              </>
            )}
            <a href="/" target="_blank" rel="noopener noreferrer" className={styles.linkBtn}>Сайт</a>
            <button type="button" className={styles.linkBtn} onClick={handleLogout}>Вийти</button>
          </div>
        </header>

        <nav className={styles.tabs} aria-label="Розділи адмінки">
          <button type="button" className={tab === 'dashboard' ? styles.tabActive : styles.tab} onClick={() => setTab('dashboard')}>Дашборд</button>
          <button type="button" className={tab === 'content' ? styles.tabActive : styles.tab} onClick={() => setTab('content')}>Контент сайту</button>
          <button type="button" className={tab === 'tickets' ? styles.tabActive : styles.tab} onClick={() => setTab('tickets')}>Квитки</button>
          <button type="button" className={tab === 'ticket-preview' ? styles.tabActive : styles.tab} onClick={() => setTab('ticket-preview')}>Вигляд квитка</button>
          <button type="button" className={tab === 'promo' ? styles.tabActive : styles.tab} onClick={() => setTab('promo')}>Промокоди</button>
        </nav>

        {tab === 'content' && (
          <nav className={styles.contentBlocks} aria-label="Блоки контенту">
            {CONTENT_BLOCKS.map((block) => (
              <button
                key={block.id}
                type="button"
                className={contentBlock === block.id ? styles.contentBlockActive : styles.contentBlock}
                onClick={() => setContentBlock(block.id)}
              >
                {block.label}
              </button>
            ))}
          </nav>
        )}

        {message && <p className={styles.message}>{message}</p>}
      </div>

      <main className={styles.main}>
        {tab === 'dashboard' && <AnalyticsTab />}
        {tab === 'content' && content && (
          <ContentTab
            activeBlock={contentBlock}
            content={content}
            onChange={(next) => {
              setContent(next)
              setDirty(true)
            }}
          />
        )}
        {tab === 'content' && !content && <p className={styles.loading}>Завантаження контенту…</p>}
        {tab === 'tickets' && <TicketsTab />}
        {tab === 'ticket-preview' && <TicketPreviewTab />}
        {tab === 'promo' && <PromoTab />}
      </main>
    </div>
  )
}

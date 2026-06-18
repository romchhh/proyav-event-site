import Database from 'better-sqlite3'
import { existsSync, mkdirSync, readFileSync } from 'fs'
import path from 'path'
import type { TicketTierId, TicketWave } from './tickets'
import { EMPTY_SALES } from './ticket-pricing'
import type { SiteContent } from './site-content/types'

type LegacyStoredOrder = {
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
  status: 'pending' | 'paid' | 'failed'
  emailSent: boolean
  createdAt: string
  paidAt?: string
}

const DATA_DIR = path.join(process.cwd(), 'data')
const DEFAULT_DB_PATH = path.join(DATA_DIR, 'proyav.db')

type OrdersMap = Record<string, LegacyStoredOrder>

declare global {
  // eslint-disable-next-line no-var
  var __proyavSqlite: Database.Database | undefined
}

function getDbPath() {
  return process.env.SQLITE_PATH?.trim() || DEFAULT_DB_PATH
}

function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true })
  }
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      order_reference TEXT PRIMARY KEY,
      ticket_code TEXT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      tier_id TEXT NOT NULL,
      tier_name TEXT NOT NULL,
      wave TEXT NOT NULL,
      amount REAL NOT NULL,
      promo_code TEXT,
      status TEXT NOT NULL,
      email_sent INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      paid_at TEXT,
      check_in_status TEXT NOT NULL DEFAULT 'none',
      checked_in_at TEXT,
      check_in_note TEXT
    );

    CREATE TABLE IF NOT EXISTS sales (
      tier_id TEXT NOT NULL,
      wave TEXT NOT NULL,
      count INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (tier_id, wave)
    );

    CREATE TABLE IF NOT EXISTS site_content (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      content_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ticket_scans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_reference TEXT,
      ticket_code TEXT,
      guest_name TEXT,
      tier_name TEXT,
      result TEXT NOT NULL,
      message TEXT NOT NULL,
      scanned_at TEXT NOT NULL
    );
  `)

  migrateOrdersCheckIn(db)
  migrateOrdersUpgrade(db)
  migrateTicketScans(db)

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
    CREATE INDEX IF NOT EXISTS idx_orders_email ON orders(email);
    CREATE INDEX IF NOT EXISTS idx_orders_ticket_code ON orders(ticket_code);
    CREATE INDEX IF NOT EXISTS idx_orders_check_in_status ON orders(check_in_status);
    CREATE INDEX IF NOT EXISTS idx_ticket_scans_order ON ticket_scans(order_reference);
    CREATE INDEX IF NOT EXISTS idx_ticket_scans_at ON ticket_scans(scanned_at);
  `)
}

function migrateOrdersCheckIn(db: Database.Database) {
  const columns = db.prepare('PRAGMA table_info(orders)').all() as { name: string }[]
  const names = new Set(columns.map((column) => column.name))

  if (!names.has('check_in_status')) {
    db.exec(`ALTER TABLE orders ADD COLUMN check_in_status TEXT NOT NULL DEFAULT 'none'`)
  }
  if (!names.has('checked_in_at')) {
    db.exec('ALTER TABLE orders ADD COLUMN checked_in_at TEXT')
  }
  if (!names.has('check_in_note')) {
    db.exec('ALTER TABLE orders ADD COLUMN check_in_note TEXT')
  }
}

function migrateOrdersUpgrade(db: Database.Database) {
  const columns = db.prepare('PRAGMA table_info(orders)').all() as { name: string }[]
  const names = new Set(columns.map((column) => column.name))

  if (!names.has('upgraded_from_order')) {
    db.exec('ALTER TABLE orders ADD COLUMN upgraded_from_order TEXT')
  }
  if (!names.has('upgraded_to_order')) {
    db.exec('ALTER TABLE orders ADD COLUMN upgraded_to_order TEXT')
  }
  if (!names.has('upgrade_credit')) {
    db.exec('ALTER TABLE orders ADD COLUMN upgrade_credit REAL')
  }
}

function migrateTicketScans(db: Database.Database) {
  const table = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='ticket_scans'")
    .get()

  if (!table) {
    db.exec(`
      CREATE TABLE ticket_scans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_reference TEXT,
        ticket_code TEXT,
        guest_name TEXT,
        tier_name TEXT,
        result TEXT NOT NULL,
        message TEXT NOT NULL,
        scanned_at TEXT NOT NULL
      );
    `)
  }
}

function readJsonFile<T>(filename: string): T | null {
  const filePath = path.join(DATA_DIR, filename)
  if (!existsSync(filePath)) return null

  try {
    return JSON.parse(readFileSync(filePath, 'utf8')) as T
  } catch {
    return null
  }
}

function migrateFromJsonFiles(db: Database.Database) {
  const orderCount = db.prepare('SELECT COUNT(*) AS count FROM orders').get() as { count: number }
  if (orderCount.count === 0) {
    const orders = readJsonFile<OrdersMap>('orders.json')
    if (orders) {
      const insert = db.prepare(`
        INSERT OR IGNORE INTO orders (
          order_reference, ticket_code, name, email, phone,
          tier_id, tier_name, wave, amount, promo_code,
          status, email_sent, created_at, paid_at,
          check_in_status, checked_in_at, check_in_note
        ) VALUES (
          @orderReference, @ticketCode, @name, @email, @phone,
          @tierId, @tierName, @wave, @amount, @promoCode,
          @status, @emailSent, @createdAt, @paidAt,
          'none', NULL, NULL
        )
      `)

      const insertMany = db.transaction((items: LegacyStoredOrder[]) => {
        for (const order of items) {
          insert.run({
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
          })
        }
      })

      insertMany(Object.values(orders))
    }
  }

  const salesCount = db.prepare('SELECT COUNT(*) AS count FROM sales').get() as { count: number }
  if (salesCount.count === 0) {
    const sales = readJsonFile<Partial<Record<TicketTierId, Partial<Record<TicketWave, number>>>>>(
      'ticket-sales.json',
    )

    if (sales) {
      const insert = db.prepare(`
        INSERT OR IGNORE INTO sales (tier_id, wave, count)
        VALUES (@tierId, @wave, @count)
      `)

      const insertMany = db.transaction(() => {
        for (const tierId of Object.keys(EMPTY_SALES) as TicketTierId[]) {
          for (const wave of Object.keys(EMPTY_SALES[tierId]) as TicketWave[]) {
            const count = sales[tierId]?.[wave] ?? 0
            if (count > 0) {
              insert.run({ tierId, wave, count })
            }
          }
        }
      })

      insertMany()
    }
  }

  const contentRow = db.prepare('SELECT id FROM site_content WHERE id = 1').get()
  if (!contentRow) {
    const content = readJsonFile<Partial<SiteContent>>('site-content.json')
    if (content) {
      db.prepare(`
        INSERT OR IGNORE INTO site_content (id, content_json, updated_at)
        VALUES (1, @contentJson, @updatedAt)
      `).run({
        contentJson: JSON.stringify(content),
        updatedAt: new Date().toISOString(),
      })
    }
  }
}

function openDatabase(): Database.Database {
  ensureDataDir()
  const dbPath = getDbPath()
  const maxAttempts = 8

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      const db = new Database(dbPath, { timeout: 10000 })
      db.pragma('journal_mode = WAL')
      db.pragma('foreign_keys = ON')
      initSchema(db)
      migrateFromJsonFiles(db)
      return db
    } catch (error) {
      const sqliteError = error as { code?: string }
      if (sqliteError.code !== 'SQLITE_BUSY' || attempt === maxAttempts - 1) {
        throw error
      }

      const delayMs = 25 * (attempt + 1)
      const start = Date.now()
      while (Date.now() - start < delayMs) {
        // busy-wait briefly before retrying
      }
    }
  }

  throw new Error('Failed to open SQLite database')
}

export function getDb() {
  if (!global.__proyavSqlite) {
    global.__proyavSqlite = openDatabase()
  }

  return global.__proyavSqlite
}

export function getStoredSiteContentJson(): Partial<SiteContent> | null {
  const row = getDb()
    .prepare('SELECT content_json FROM site_content WHERE id = 1')
    .get() as { content_json: string } | undefined

  if (!row) return null

  try {
    return JSON.parse(row.content_json) as Partial<SiteContent>
  } catch {
    return null
  }
}

export function saveStoredSiteContentJson(content: SiteContent) {
  const updatedAt = new Date().toISOString()
  getDb()
    .prepare(`
      INSERT INTO site_content (id, content_json, updated_at)
      VALUES (1, @contentJson, @updatedAt)
      ON CONFLICT(id) DO UPDATE SET
        content_json = excluded.content_json,
        updated_at = excluded.updated_at
    `)
    .run({
      contentJson: JSON.stringify(content),
      updatedAt,
    })
}

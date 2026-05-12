import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(process.cwd(), 'distribution.db');

export const db = new Database(dbPath);
db.pragma('foreign_keys = ON');

export function initDb() {
  db.exec(`
    -- 1. Routes
    CREATE TABLE IF NOT EXISTS routes (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      name      TEXT NOT NULL
    );

    -- 2. Shops
    CREATE TABLE IF NOT EXISTS shops (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      name      TEXT NOT NULL,
      address   TEXT,
      route_id  INTEGER NOT NULL REFERENCES routes(id) ON DELETE RESTRICT
    );

    -- 3. Invoices
    CREATE TABLE IF NOT EXISTS invoices (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      number       TEXT NOT NULL UNIQUE,
      shop_id      INTEGER NOT NULL REFERENCES shops(id) ON DELETE RESTRICT,
      date         TEXT NOT NULL,
      total_amount REAL NOT NULL,
      paid         REAL NOT NULL DEFAULT 0,
      status       TEXT NOT NULL CHECK (status IN ('settled','credit')) DEFAULT 'credit',
      remarks      TEXT,
      updated_at   DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 4. Payments
    CREATE TABLE IF NOT EXISTS payments (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id  INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
      amount      REAL NOT NULL,
      type        TEXT NOT NULL CHECK (type IN ('cash','cheque')),
      date        TEXT NOT NULL,
      cheque_id   INTEGER REFERENCES cheques(id) ON DELETE SET NULL
    );

    -- 5. Cheques
    CREATE TABLE IF NOT EXISTS cheques (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id     INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
      cheque_no      TEXT NOT NULL,
      bank           TEXT,
      amount         REAL NOT NULL,
      date_received  TEXT NOT NULL,
      due_date       TEXT,
      cleared_date   TEXT,
      status         TEXT NOT NULL CHECK (status IN ('pending','paid','returned')) DEFAULT 'pending',
      return_reason  TEXT,
      updated_at     DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Indexes
    CREATE INDEX IF NOT EXISTS idx_invoices_shop   ON invoices(shop_id);
    CREATE INDEX IF NOT EXISTS idx_invoices_date   ON invoices(date);
    CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
    CREATE INDEX IF NOT EXISTS idx_payments_inv    ON payments(invoice_id);
    CREATE INDEX IF NOT EXISTS idx_cheques_inv     ON cheques(invoice_id);
    CREATE INDEX IF NOT EXISTS idx_cheques_status  ON cheques(status);
  `);
}

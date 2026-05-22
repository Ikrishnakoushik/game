import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '..', 'karmacoins.db');

const db = new DatabaseSync(DB_PATH);

// Enable WAL mode for better concurrent read performance
db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT    NOT NULL,
    email      TEXT    NOT NULL UNIQUE,
    password   TEXT    NOT NULL,
    avatar     TEXT    NOT NULL DEFAULT '',
    coins      INTEGER NOT NULL DEFAULT 0,
    is_pro     INTEGER NOT NULL DEFAULT 0,
    streak     INTEGER NOT NULL DEFAULT 0,
    created_at TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS karmas (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    owner_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name        TEXT    NOT NULL,
    days        INTEGER NOT NULL DEFAULT 30,
    done        INTEGER NOT NULL DEFAULT 0,
    mode        TEXT    NOT NULL DEFAULT 'coins',
    coin_rate   INTEGER NOT NULL DEFAULT 50,
    donate_amt  INTEGER NOT NULL DEFAULT 0,
    charity     TEXT    NOT NULL DEFAULT '',
    created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS karma_members (
    karma_id  INTEGER NOT NULL REFERENCES karmas(id) ON DELETE CASCADE,
    user_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (karma_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS checkins (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    karma_id     INTEGER NOT NULL REFERENCES karmas(id) ON DELETE CASCADE,
    user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date         TEXT    NOT NULL DEFAULT (date('now')),
    coins_earned INTEGER NOT NULL DEFAULT 0,
    UNIQUE (karma_id, user_id, date)
  );

  CREATE TABLE IF NOT EXISTS friendships (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    requester   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    addressee   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status      TEXT    NOT NULL DEFAULT 'pending',
    created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
    UNIQUE (requester, addressee)
  );

  CREATE TABLE IF NOT EXISTS payments (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id             INTEGER NOT NULL REFERENCES users(id),
    razorpay_order_id   TEXT    NOT NULL UNIQUE,
    razorpay_payment_id TEXT,
    type                TEXT    NOT NULL,
    amount_paise        INTEGER NOT NULL,
    coins_granted       INTEGER NOT NULL DEFAULT 0,
    status              TEXT    NOT NULL DEFAULT 'created',
    created_at          TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS subscriptions (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL UNIQUE REFERENCES users(id),
    status     TEXT    NOT NULL DEFAULT 'active',
    started_at TEXT    NOT NULL DEFAULT (datetime('now')),
    expires_at TEXT    NOT NULL
  );
`);

export default db;

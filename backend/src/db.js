import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '..', 'habitcoins.db');

const db = new DatabaseSync(DB_PATH);

// Enable WAL mode for better concurrent read performance
db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    name      TEXT    NOT NULL,
    email     TEXT    NOT NULL UNIQUE,
    password  TEXT    NOT NULL,
    avatar    TEXT    NOT NULL DEFAULT '',
    coins     INTEGER NOT NULL DEFAULT 0,
    is_pro    INTEGER NOT NULL DEFAULT 0,
    streak    INTEGER NOT NULL DEFAULT 0,
    created_at TEXT   NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS habits (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    owner_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name        TEXT    NOT NULL,
    days        INTEGER NOT NULL DEFAULT 30,
    done        INTEGER NOT NULL DEFAULT 0,
    mode        TEXT    NOT NULL DEFAULT 'coins',  -- coins | donate | sub
    coin_rate   INTEGER NOT NULL DEFAULT 50,
    donate_amt  INTEGER NOT NULL DEFAULT 0,
    charity     TEXT    NOT NULL DEFAULT '',
    created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS habit_members (
    habit_id  INTEGER NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
    user_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (habit_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS checkins (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    habit_id   INTEGER NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date       TEXT    NOT NULL DEFAULT (date('now')),
    coins_earned INTEGER NOT NULL DEFAULT 0,
    UNIQUE (habit_id, user_id, date)
  );

  CREATE TABLE IF NOT EXISTS friendships (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    requester   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    addressee   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status      TEXT    NOT NULL DEFAULT 'pending',  -- pending | accepted
    created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
    UNIQUE (requester, addressee)
  );
`);

export default db;

-- schema.sql
-- Minimal relational schema for TrackEasy. Written for SQLite (easy to run
-- with zero setup: `sqlite3 trackeasy.db < schema.sql`), using only
-- standard SQL so it ports to Postgres/MySQL with minimal changes.

CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT NOT NULL,
    email         TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,        -- never store plaintext passwords
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS categories (
    id   INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS transactions (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL REFERENCES users(id),
    category_id INTEGER NOT NULL REFERENCES categories(id),
    name        TEXT NOT NULL,
    amount      REAL NOT NULL,          -- positive = income, negative = expense
    tx_date     TEXT NOT NULL,          -- ISO date, e.g. '2026-08-14'
    note        TEXT,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS budgets (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL REFERENCES users(id),
    category_id INTEGER NOT NULL REFERENCES categories(id),
    monthly_limit REAL NOT NULL,
    UNIQUE (user_id, category_id)
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, tx_date);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);

-- Seed categories used throughout the app
INSERT OR IGNORE INTO categories (name) VALUES
    ('Dining'), ('Groceries'), ('Utilities'), ('Income'),
    ('Shopping'), ('Entertainment'), ('Transport'), ('Health');

-- One demo user (password_hash is a placeholder, not a real hash)
INSERT OR IGNORE INTO users (id, name, email, password_hash)
VALUES (1, 'Demo User', 'demo@trackeasy.app', 'placeholder_hash_do_not_use');

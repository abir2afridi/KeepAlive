import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(path.join(dbDir, 'uptime.db'));

db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    plan TEXT DEFAULT 'free',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS monitors (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    type TEXT NOT NULL,
    interval INTEGER NOT NULL,
    method TEXT NOT NULL,
    headers TEXT,
    body TEXT,
    keep_alive INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active',
    last_pinged_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS pings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    monitor_id TEXT NOT NULL,
    status_code INTEGER,
    response_time INTEGER,
    is_up INTEGER NOT NULL,
    error_message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (monitor_id) REFERENCES monitors(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS alert_channels (
    id TEXT PRIMARY KEY,
    monitor_id TEXT NOT NULL,
    type TEXT NOT NULL,
    destination TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (monitor_id) REFERENCES monitors(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS incidents (
    id TEXT PRIMARY KEY,
    monitor_id TEXT NOT NULL,
    status TEXT NOT NULL,
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    resolved_at DATETIME,
    error_message TEXT,
    FOREIGN KEY (monitor_id) REFERENCES monitors(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS password_resets (
    token TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    expires_at DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS ping_aggregates_hourly (
    monitor_id TEXT NOT NULL,
    hour TEXT NOT NULL, -- Format: YYYY-MM-DD HH:00:00
    avg_response_time INTEGER,
    uptime_percent REAL,
    ping_count INTEGER,
    PRIMARY KEY (monitor_id, hour),
    FOREIGN KEY (monitor_id) REFERENCES monitors(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS ping_aggregates_daily (
    monitor_id TEXT NOT NULL,
    day TEXT NOT NULL, -- Format: YYYY-MM-DD
    avg_response_time INTEGER,
    uptime_percent REAL,
    ping_count INTEGER,
    PRIMARY KEY (monitor_id, day),
    FOREIGN KEY (monitor_id) REFERENCES monitors(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_pings_monitor_created ON pings(monitor_id, created_at);
  CREATE INDEX IF NOT EXISTS idx_monitors_user ON monitors(user_id);
  CREATE INDEX IF NOT EXISTS idx_aggregates_hourly_time ON ping_aggregates_hourly(hour);
  CREATE INDEX IF NOT EXISTS idx_aggregates_daily_time ON ping_aggregates_daily(day);
`);

// Migrations
try {
  const columns = db.prepare('PRAGMA table_info(monitors)').all() as any[];
  
  if (!columns.some(c => c.name === 'user_id')) {
    db.exec('ALTER TABLE monitors ADD COLUMN user_id TEXT REFERENCES users(id) ON DELETE CASCADE');
  }
  
  if (!columns.some(c => c.name === 'expected_status')) {
    db.exec('ALTER TABLE monitors ADD COLUMN expected_status INTEGER DEFAULT 200');
  }

  const userCols = db.prepare('PRAGMA table_info(users)').all() as any[];
  if (!userCols.some(c => c.name === 'status_slug')) {
    // Add column first without UNIQUE constraint to avoid collision with existing NULLs
    // Then add index separately if needed, but for SQLite simple ALTER is usually preferred.
    // However, SQLite allows multiple NULLs in UNIQUE columns, so this should work.
    try {
      db.exec('ALTER TABLE users ADD COLUMN status_slug TEXT');
      db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_users_status_slug ON users(status_slug)');
    } catch (e: any) {
      if (!e.message.includes('duplicate column name')) throw e;
    }
  }

  const pingCols = db.prepare('PRAGMA table_info(pings)').all() as any[];
  if (!pingCols.some(c => c.name === 'error_message')) {
    db.exec('ALTER TABLE pings ADD COLUMN error_message TEXT');
  }

  const incidentCols = db.prepare('PRAGMA table_info(incidents)').all() as any[];
  if (!incidentCols.some(c => c.name === 'error_message')) {
    db.exec('ALTER TABLE incidents ADD COLUMN error_message TEXT');
  }
} catch (error) {
  console.error('Database migration check failed (non-critical):', error);
}

export default db;

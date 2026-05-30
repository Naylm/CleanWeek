import Database from 'better-sqlite3'
import { mkdirSync } from 'fs'
import { dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DB_PATH = process.env.DB_PATH || `${__dirname}/../data/cleanweek.db`

mkdirSync(dirname(DB_PATH), { recursive: true })

const db = new Database(DB_PATH)
db.pragma('journal_mode = WAL')

// Init tables
function init() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      name TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'autre',
      frequency TEXT NOT NULL DEFAULT 'weekly',
      custom_interval_enabled INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER DEFAULT (unixepoch() * 1000)
    );

    CREATE TABLE IF NOT EXISTS completions (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      completed_by TEXT,
      completed_at TEXT NOT NULL DEFAULT (date('now')),
      created_at INTEGER DEFAULT (unixepoch() * 1000),
      UNIQUE(task_id, completed_at)
    );

    CREATE TABLE IF NOT EXISTS shopping_items (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      name TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'autre',
      checked INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER DEFAULT (unixepoch() * 1000)
    );

    CREATE TABLE IF NOT EXISTS meal_plans (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      date TEXT NOT NULL,
      meal TEXT NOT NULL,
      content TEXT NOT NULL DEFAULT '',
      notes TEXT,
      shopping_done INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER DEFAULT (unixepoch() * 1000),
      UNIQUE(date, meal)
    );

    CREATE TABLE IF NOT EXISTS week_settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      start_day_of_week INTEGER NOT NULL DEFAULT 5,
      week_start_date TEXT,
      current_week_offset INTEGER NOT NULL DEFAULT 0,
      updated_at INTEGER DEFAULT (unixepoch() * 1000)
    );

    CREATE TABLE IF NOT EXISTS task_intervals (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      interval_type TEXT NOT NULL DEFAULT 'frequency',
      days_of_week TEXT,
      month_interval INTEGER,
      created_at INTEGER DEFAULT (unixepoch() * 1000),
      UNIQUE(task_id)
    );
  `)

  // Insert default week settings if none exist
  const weekSettingsCount = db.prepare('SELECT count(*) as c FROM week_settings').get().c
  if (weekSettingsCount === 0) {
    db.prepare('INSERT INTO week_settings (id, start_day_of_week, current_week_offset) VALUES (1, 5, 0)').run()
  }

  // Insert default tasks if none exist
  const count = db.prepare('SELECT count(*) as c FROM tasks').get().c
  if (count === 0) {
    const tStmt = db.prepare('INSERT INTO tasks (name, category, frequency) VALUES (?, ?, ?)')
    const defaultTasks = [
      ['Enlever la poussiere', 'salon', 'weekly'],
      ['Aspirer le sol', 'salon', 'weekly'],
      ['Nettoyer sous le lit', 'chambre', 'weekly'],
      ['Nettoyer les tables de chevet', 'chambre', 'weekly'],
      ['Changer les draps', 'chambre', 'biweekly'],
      ['Ranger la garde-robe', 'chambre', 'monthly'],
      ['Rangement global', 'salon', 'monthly'],
    ]
    for (const t of defaultTasks) tStmt.run(...t)
  }
}

init()

export default db

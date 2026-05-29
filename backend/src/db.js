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
    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      display_name TEXT NOT NULL DEFAULT 'Utilisateur',
      avatar_color TEXT NOT NULL DEFAULT '#6C63FF',
      created_at INTEGER DEFAULT (unixepoch() * 1000)
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      name TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'autre',
      frequency TEXT NOT NULL DEFAULT 'weekly',
      assigned_to TEXT,
      created_at INTEGER DEFAULT (unixepoch() * 1000)
    );

    CREATE TABLE IF NOT EXISTS completions (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      completed_by TEXT NOT NULL,
      completed_at TEXT NOT NULL DEFAULT (date('now')),
      created_at INTEGER DEFAULT (unixepoch() * 1000),
      UNIQUE(task_id, completed_at)
    );

    CREATE TABLE IF NOT EXISTS push_subscriptions (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      user_id TEXT NOT NULL UNIQUE,
      subscription TEXT NOT NULL,
      created_at INTEGER DEFAULT (unixepoch() * 1000)
    );

    CREATE TABLE IF NOT EXISTS reactions (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      completion_id TEXT NOT NULL REFERENCES completions(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL,
      emoji TEXT NOT NULL,
      created_at INTEGER DEFAULT (unixepoch() * 1000),
      UNIQUE(completion_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS shopping_items (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      name TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'autre',
      checked INTEGER NOT NULL DEFAULT 0,
      added_by TEXT,
      created_at INTEGER DEFAULT (unixepoch() * 1000)
    );

    CREATE TABLE IF NOT EXISTS meal_plans (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      date TEXT NOT NULL,
      meal TEXT NOT NULL,
      content TEXT NOT NULL DEFAULT '',
      notes TEXT,
      created_by TEXT,
      created_at INTEGER DEFAULT (unixepoch() * 1000),
      UNIQUE(date, meal)
    );
  `)

  // Insert default profiles if not exists
  const profiles = [
    ['a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Laura', '#FF6584'],
    ['b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Melvin', '#6C63FF'],
  ]
  const stmt = db.prepare('INSERT OR IGNORE INTO profiles (id, display_name, avatar_color) VALUES (?, ?, ?)')
  for (const p of profiles) stmt.run(...p)

  // Insert default tasks if none exist
  const count = db.prepare('SELECT count(*) as c FROM tasks').get().c
  if (count === 0) {
    const tStmt = db.prepare('INSERT INTO tasks (name, category, frequency, assigned_to) VALUES (?, ?, ?, ?)')
    const defaultTasks = [
      ["Passer l'aspirateur", 'salon', 'weekly', 'both'],
      ['Faire la vaisselle', 'cuisine', 'daily', 'both'],
      ['Nettoyer les toilettes', 'salle_de_bain', 'weekly', 'both'],
      ['Faire la lessive', 'linge', 'weekly', 'both'],
      ['Sortir les poubelles', 'exterieur', 'weekly', 'both'],
      ['Nettoyer le sol cuisine', 'cuisine', 'weekly', 'both'],
      ['Changer les draps', 'chambre', 'biweekly', 'both'],
    ]
    for (const t of defaultTasks) tStmt.run(...t)
  }
}

init()

export default db

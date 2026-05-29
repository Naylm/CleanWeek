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
  `)

  // Insert default tasks if none exist
  const count = db.prepare('SELECT count(*) as c FROM tasks').get().c
  if (count === 0) {
    const tStmt = db.prepare('INSERT INTO tasks (name, category, frequency) VALUES (?, ?, ?)')
    const defaultTasks = [
      ["Passer l'aspirateur", 'salon', 'weekly'],
      ['Faire la vaisselle', 'cuisine', 'daily'],
      ['Nettoyer les toilettes', 'salle_de_bain', 'weekly'],
      ['Faire la lessive', 'linge', 'weekly'],
      ['Sortir les poubelles', 'exterieur', 'weekly'],
      ['Nettoyer le sol cuisine', 'cuisine', 'weekly'],
      ['Changer les draps', 'chambre', 'biweekly'],
    ]
    for (const t of defaultTasks) tStmt.run(...t)
  }
}

init()

export default db

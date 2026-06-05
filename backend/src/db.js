import Database from 'better-sqlite3'
import { mkdirSync } from 'fs'
import { dirname } from 'path'
import { fileURLToPath } from 'url'
import { FOODS_DATABASE } from './foods_data.js'

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
      quantity_number REAL,
      quantity_unit TEXT DEFAULT 'unit',
      sort_order INTEGER DEFAULT 0,
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

    -- User features configuration (activable features)
    CREATE TABLE IF NOT EXISTS user_features (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      shopping_page_enabled INTEGER DEFAULT 0,
      offline_mode_enabled INTEGER DEFAULT 0,
      reminders_enabled INTEGER DEFAULT 0,
      updated_at INTEGER DEFAULT (unixepoch() * 1000)
    );

    -- Reminder slots for scheduled notifications
    CREATE TABLE IF NOT EXISTS reminder_slots (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      label TEXT NOT NULL,
      time TEXT NOT NULL,
      days_of_week TEXT,
      enabled INTEGER DEFAULT 1,
      message_template TEXT DEFAULT 'Il reste {remaining} tâches',
      created_at INTEGER DEFAULT (unixepoch() * 1000)
    );

    -- Food database for autocomplete
    CREATE TABLE IF NOT EXISTS food_items (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      name TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'autre',
      keywords TEXT,
      created_at INTEGER DEFAULT (unixepoch() * 1000)
    );

    -- Custom shopping categories
    CREATE TABLE IF NOT EXISTS shop_categories (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      value TEXT NOT NULL UNIQUE,
      label TEXT NOT NULL,
      emoji TEXT NOT NULL DEFAULT '📦',
      sort_order INTEGER DEFAULT 0,
      created_at INTEGER DEFAULT (unixepoch() * 1000)
    );

    -- Index for fast search
    CREATE INDEX IF NOT EXISTS idx_food_name ON food_items(name);
    CREATE INDEX IF NOT EXISTS idx_food_keywords ON food_items(keywords);
  `)

  // Insert default week settings if none exist
  const weekSettingsCount = db.prepare('SELECT count(*) as c FROM week_settings').get().c
  if (weekSettingsCount === 0) {
    db.prepare('INSERT INTO week_settings (id, start_day_of_week, current_week_offset) VALUES (1, 5, 0)').run()
  }

  // Insert default user features if none exist
  const userFeaturesCount = db.prepare('SELECT count(*) as c FROM user_features').get().c
  if (userFeaturesCount === 0) {
    db.prepare('INSERT INTO user_features DEFAULT VALUES').run()
  }

  // Insert default reminder slots if none exist
  const reminderCount = db.prepare('SELECT count(*) as c FROM reminder_slots').get().c
  if (reminderCount === 0) {
    db.prepare(`INSERT INTO reminder_slots (label, time, days_of_week, message_template) VALUES
      ('Bonjour', '09:00', '[0,1,2,3,4,5,6]', 'Aujourd''hui : {count} tâches'),
      ('Soirée', '20:00', '[0,1,2,3,4,5,6]', 'Il reste {remaining} tâches !')`).run()
  }

  // Insert food database if empty
  const foodCount = db.prepare('SELECT count(*) as c FROM food_items').get().c
  if (foodCount === 0) {
    const foodStmt = db.prepare('INSERT INTO food_items (name, category, keywords) VALUES (?, ?, ?)')
    for (const food of FOODS_DATABASE) {
      foodStmt.run(food.name, food.category, food.keywords)
    }
    console.log(`✅ ${FOODS_DATABASE.length} aliments importés dans la base de données`)
  }

  // Insert default shopping categories if none exist
  const shopCatCount = db.prepare('SELECT count(*) as c FROM shop_categories').get().c
  if (shopCatCount === 0) {
    const catStmt = db.prepare('INSERT INTO shop_categories (value, label, emoji, sort_order) VALUES (?, ?, ?, ?)')
    const defaultCats = [
      ['fruits_legumes', 'Fruits & Légumes', '🥬', 0],
      ['viandes', 'Viandes & Poissons', '🥩', 1],
      ['epicerie', 'Épicerie', '🥫', 2],
      ['laitages', 'Laitages & Œufs', '🧀', 3],
      ['boulangerie', 'Boulangerie', '🥖', 4],
      ['surgeles', 'Surgelés', '❄️', 5],
      ['boissons', 'Boissons', '🥤', 6],
      ['hygiene', 'Hygiène', '🧴', 7],
      ['autre', 'Autre', '📦', 99],
    ]
    for (const c of defaultCats) catStmt.run(...c)
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

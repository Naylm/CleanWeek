import express from 'express'
import cors from 'cors'
import path from 'path'
import { randomUUID } from 'crypto'
import { fileURLToPath } from 'url'
import db from './db.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = 3001

app.use(cors({ origin: true, credentials: true }))
app.use(express.json())

const FRONTEND_DIR = process.env.FRONTEND_DIR || path.join(__dirname, '../../frontend/dist')
app.use(express.static(FRONTEND_DIR))

// ============ API ============
app.get('/api/health', (_req, res) => res.json({ ok: true }))

app.get('/api/tasks', (_req, res) => {
  const tasks = db.prepare('SELECT * FROM tasks ORDER BY created_at').all()
  const completions = db.prepare(`
    SELECT c.id, c.task_id, c.completed_by, c.completed_at
    FROM completions c
    ORDER BY c.completed_at DESC
  `).all()
  const intervals = db.prepare('SELECT * FROM task_intervals').all()
  res.json(tasks.map(t => ({
    ...t,
    completions: completions.filter(c => c.task_id === t.id),
    customInterval: intervals.find(i => i.task_id === t.id) || null
  })))
})

app.post('/api/tasks', (req, res) => {
  const { name, category, frequency, customInterval } = req.body
  if (!name?.trim()) return res.status(400).json({ error: 'name required' })
  const id = randomUUID()
  const customIntervalEnabled = customInterval && customInterval.enabled ? 1 : 0
  db.prepare('INSERT INTO tasks (id, name, category, frequency, custom_interval_enabled) VALUES (?, ?, ?, ?, ?)')
    .run(id, name.trim(), category, frequency, customIntervalEnabled)

  // Save custom interval if enabled
  if (customIntervalEnabled && customInterval) {
    const intervalId = randomUUID()
    db.prepare('INSERT INTO task_intervals (id, task_id, interval_type, days_of_week, month_interval) VALUES (?, ?, ?, ?, ?)')
      .run(intervalId, id, customInterval.intervalType || 'frequency',
        customInterval.daysOfWeek ? JSON.stringify(customInterval.daysOfWeek) : null,
        customInterval.monthInterval || null)
  }

  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id)
  res.status(201).json(task)
})

app.patch('/api/tasks/:id', (req, res) => {
  const { name, category, frequency, customInterval } = req.body
  const customIntervalEnabled = customInterval && customInterval.enabled ? 1 : 0

  db.prepare('UPDATE tasks SET name = COALESCE(?, name), category = COALESCE(?, category), frequency = COALESCE(?, frequency), custom_interval_enabled = COALESCE(?, custom_interval_enabled) WHERE id = ?')
    .run(name, category, frequency, customIntervalEnabled, req.params.id)

  // Update or insert custom interval
  if (customInterval) {
    const existing = db.prepare('SELECT * FROM task_intervals WHERE task_id = ?').get(req.params.id)
    if (existing) {
      db.prepare('UPDATE task_intervals SET interval_type = COALESCE(?, interval_type), days_of_week = COALESCE(?, days_of_week), month_interval = COALESCE(?, month_interval) WHERE task_id = ?')
        .run(customInterval.intervalType,
          customInterval.daysOfWeek ? JSON.stringify(customInterval.daysOfWeek) : null,
          customInterval.monthInterval || null,
          req.params.id)
    } else if (customIntervalEnabled) {
      const intervalId = randomUUID()
      db.prepare('INSERT INTO task_intervals (id, task_id, interval_type, days_of_week, month_interval) VALUES (?, ?, ?, ?, ?)')
        .run(intervalId, req.params.id, customInterval.intervalType || 'frequency',
          customInterval.daysOfWeek ? JSON.stringify(customInterval.daysOfWeek) : null,
          customInterval.monthInterval || null)
    }
  }

  res.json({ ok: true })
})

app.delete('/api/tasks/:id', (req, res) => {
  db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id)
  res.json({ ok: true })
})

app.post('/api/completions', (req, res) => {
  const { task_id, completed_by, completed_at } = req.body
  try {
    db.prepare('INSERT INTO completions (task_id, completed_by, completed_at) VALUES (?, ?, ?)')
      .run(task_id, completed_by || null, completed_at)
    res.status(201).json({ ok: true })
  } catch (err) {
    res.status(400).json({ error: 'Already completed today' })
  }
})

app.delete('/api/completions/:id', (req, res) => {
  db.prepare('DELETE FROM completions WHERE id = ?').run(req.params.id)
  res.json({ ok: true })
})

// Snooze a task (postpone)
app.post('/api/tasks/:id/snooze', (req, res) => {
  const { days } = req.body
  const snoozeDays = days || 1

  // Create a completion entry for today to mark it as "done for now"
  const today = new Date().toISOString().split('T')[0]
  const completionId = randomUUID()

  try {
    db.prepare('INSERT INTO completions (id, task_id, completed_at) VALUES (?, ?, ?)')
      .run(completionId, req.params.id, today)
    res.json({ ok: true, snoozed: today, days: snoozeDays })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// ============ WEEK SETTINGS ============
app.get('/api/week-settings', (_req, res) => {
  const settings = db.prepare('SELECT * FROM week_settings WHERE id = 1').get()
  if (!settings) {
    db.prepare('INSERT INTO week_settings (id, start_day_of_week, current_week_offset) VALUES (1, 5, 0)').run()
    const newSettings = db.prepare('SELECT * FROM week_settings WHERE id = 1').get()
    return res.json(newSettings)
  }
  res.json(settings)
})

app.patch('/api/week-settings', (req, res) => {
  const { startDayOfWeek, weekStartDate, currentWeekOffset } = req.body
  db.prepare(`
    UPDATE week_settings
    SET start_day_of_week = COALESCE(?, start_day_of_week),
        week_start_date = COALESCE(?, week_start_date),
        current_week_offset = COALESCE(?, current_week_offset),
        updated_at = (unixepoch() * 1000)
    WHERE id = 1
  `).run(
    startDayOfWeek !== undefined ? startDayOfWeek : null,
    weekStartDate || null,
    currentWeekOffset !== undefined ? currentWeekOffset : null
  )
  const settings = db.prepare('SELECT * FROM week_settings WHERE id = 1').get()
  res.json(settings)
})

// ============ SHOPPING ============
app.get('/api/shopping', (_req, res) => {
  const rows = db.prepare('SELECT * FROM shopping_items ORDER BY checked, created_at DESC').all()
  res.json(rows)
})

app.post('/api/shopping', (req, res) => {
  const { name, category } = req.body
  if (!name?.trim()) return res.status(400).json({ error: 'name required' })
  const id = randomUUID()
  db.prepare('INSERT INTO shopping_items (id, name, category) VALUES (?, ?, ?)')
    .run(id, name.trim(), category || 'autre')
  const item = db.prepare('SELECT * FROM shopping_items WHERE id = ?').get(id)
  res.status(201).json(item)
})

app.patch('/api/shopping/:id', (req, res) => {
  const { checked } = req.body
  db.prepare('UPDATE shopping_items SET checked = COALESCE(?, checked) WHERE id = ?')
    .run(checked !== undefined ? (checked ? 1 : 0) : undefined, req.params.id)
  res.json({ ok: true })
})

app.delete('/api/shopping/:id', (req, res) => {
  db.prepare('DELETE FROM shopping_items WHERE id = ?').run(req.params.id)
  res.json({ ok: true })
})

// ============ MEAL PLANS ============
app.get('/api/meals', (_req, res) => {
  const rows = db.prepare('SELECT * FROM meal_plans ORDER BY date, meal').all()
  res.json(rows)
})

app.post('/api/meals', (req, res) => {
  const { date, meal, content, notes } = req.body
  if (!date || !meal) return res.status(400).json({ error: 'date and meal required' })
  const id = randomUUID()
  db.prepare('INSERT INTO meal_plans (id, date, meal, content, notes) VALUES (?, ?, ?, ?, ?)')
    .run(id, date, meal, content || '', notes || null)
  const item = db.prepare('SELECT * FROM meal_plans WHERE id = ?').get(id)
  res.status(201).json(item)
})

app.patch('/api/meals/:id', (req, res) => {
  const { content, notes, shopping_done } = req.body
  db.prepare('UPDATE meal_plans SET content = COALESCE(?, content), notes = COALESCE(?, notes), shopping_done = COALESCE(?, shopping_done) WHERE id = ?')
    .run(content, notes, shopping_done !== undefined ? (shopping_done ? 1 : 0) : undefined, req.params.id)
  res.json({ ok: true })
})

app.delete('/api/meals/:id', (req, res) => {
  db.prepare('DELETE FROM meal_plans WHERE id = ?').run(req.params.id)
  res.json({ ok: true })
})

app.post('/api/meals/swap', (req, res) => {
  const { id1, id2 } = req.body
  if (!id1 || !id2) return res.status(400).json({ error: 'missing ids' })

  const m1 = db.prepare('SELECT * FROM meal_plans WHERE id = ?').get(id1)
  const m2 = db.prepare('SELECT * FROM meal_plans WHERE id = ?').get(id2)
  if (!m1 || !m2) return res.status(404).json({ error: 'not found' })

  db.prepare('UPDATE meal_plans SET content = ?, notes = ? WHERE id = ?')
    .run(m2.content, m2.notes, m1.id)
  db.prepare('UPDATE meal_plans SET content = ?, notes = ? WHERE id = ?')
    .run(m1.content, m1.notes, m2.id)

  res.json({ ok: true })
})

// Catch-all: serve React app
app.use((_req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, 'index.html'))
})

app.listen(PORT, () => {
  console.log(`CleanWeek backend running on port ${PORT}`)
})

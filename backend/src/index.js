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

const FRONTEND_DIR = process.env.FRONTEND_DIR || path.join(__dirname, '../frontend/dist')
app.use(express.static(FRONTEND_DIR))

// ============ API ============
app.get('/api/health', (_req, res) => res.json({ ok: true }))

app.get('/api/profiles', (_req, res) => {
  const rows = db.prepare('SELECT * FROM profiles').all()
  res.json(rows)
})

app.patch('/api/profiles/:id', (req, res) => {
  const { display_name, avatar_color } = req.body
  db.prepare('UPDATE profiles SET display_name = COALESCE(?, display_name), avatar_color = COALESCE(?, avatar_color) WHERE id = ?')
    .run(display_name, avatar_color, req.params.id)
  res.json({ ok: true })
})

app.get('/api/tasks', (_req, res) => {
  const tasks = db.prepare('SELECT * FROM tasks ORDER BY created_at').all()
  const completions = db.prepare(`
    SELECT c.id, c.task_id, c.completed_by, c.completed_at,
           p.display_name, p.avatar_color
    FROM completions c
    JOIN profiles p ON p.id = c.completed_by
    ORDER BY c.completed_at DESC
  `).all()
  const reactions = db.prepare(`
    SELECT r.id, r.completion_id, r.user_id, r.emoji,
           p.display_name, p.avatar_color
    FROM reactions r
    JOIN profiles p ON p.id = r.user_id
  `).all()
  res.json(tasks.map(t => ({
    ...t,
    completions: completions.filter(c => c.task_id === t.id).map(c => ({
      ...c,
      reactions: reactions.filter(r => r.completion_id === c.id)
    }))
  })))
})

app.post('/api/tasks', (req, res) => {
  const { name, category, frequency, assigned_to } = req.body
  if (!name?.trim()) return res.status(400).json({ error: 'name required' })
  const id = randomUUID()
  db.prepare('INSERT INTO tasks (id, name, category, frequency, assigned_to) VALUES (?, ?, ?, ?, ?)')
    .run(id, name.trim(), category, frequency, assigned_to)
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id)
  res.status(201).json(task)
})

app.patch('/api/tasks/:id', (req, res) => {
  const { name, category, frequency, assigned_to } = req.body
  db.prepare('UPDATE tasks SET name = COALESCE(?, name), category = COALESCE(?, category), frequency = COALESCE(?, frequency), assigned_to = COALESCE(?, assigned_to) WHERE id = ?')
    .run(name, category, frequency, assigned_to, req.params.id)
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
      .run(task_id, completed_by, completed_at)
    res.status(201).json({ ok: true })
  } catch (err) {
    res.status(400).json({ error: 'Already completed today' })
  }
})

app.delete('/api/completions/:id', (req, res) => {
  db.prepare('DELETE FROM completions WHERE id = ?').run(req.params.id)
  res.json({ ok: true })
})

app.post('/api/reactions', (req, res) => {
  const { completion_id, user_id, emoji } = req.body
  if (!completion_id || !user_id || !emoji) {
    return res.status(400).json({ error: 'missing fields' })
  }
  try {
    db.prepare('INSERT INTO reactions (completion_id, user_id, emoji) VALUES (?, ?, ?)')
      .run(completion_id, user_id, emoji)
    res.status(201).json({ ok: true })
  } catch (err) {
    res.status(409).json({ error: 'Already reacted' })
  }
})

app.delete('/api/reactions', (req, res) => {
  const { completion_id, user_id } = req.body
  if (!completion_id || !user_id) {
    return res.status(400).json({ error: 'missing fields' })
  }
  db.prepare('DELETE FROM reactions WHERE completion_id = ? AND user_id = ?')
    .run(completion_id, user_id)
  res.json({ ok: true })
})

app.post('/api/push/subscribe', (req, res) => {
  const { subscription, userId } = req.body
  db.prepare('INSERT OR REPLACE INTO push_subscriptions (user_id, subscription) VALUES (?, ?)')
    .run(userId, JSON.stringify(subscription))
  res.json({ ok: true })
})

// Catch-all: serve React app
app.use((_req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, 'index.html'))
})

app.listen(PORT, () => {
  console.log(`CleanWeek backend running on port ${PORT}`)
})

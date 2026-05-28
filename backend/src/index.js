import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import cron from 'node-cron'
import webpush from 'web-push'
import db from './db.js'

const app = express()
const PORT = process.env.PORT || 3001

webpush.setVapidDetails(
  `mailto:${process.env.VAPID_EMAIL || 'admin@localhost'}`,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
)

app.use(cors({
  origin: true,
  credentials: true,
}))
app.use(express.json())

// ============ PROFILES ============
app.get('/api/profiles', (_req, res) => {
  const rows = db.prepare('SELECT * FROM profiles').all()
  res.json(rows)
})

app.patch('/api/profiles/:id', (req, res) => {
  const { display_name, avatar_color } = req.body
  const stmt = db.prepare('UPDATE profiles SET display_name = COALESCE(?, display_name), avatar_color = COALESCE(?, avatar_color) WHERE id = ?')
  stmt.run(display_name, avatar_color, req.params.id)
  res.json({ ok: true })
})

// ============ TASKS ============
app.get('/api/tasks', (_req, res) => {
  const tasks = db.prepare('SELECT * FROM tasks ORDER BY created_at').all()
  const completions = db.prepare(`
    SELECT c.id, c.task_id, c.completed_by, c.completed_at,
           p.display_name, p.avatar_color
    FROM completions c
    JOIN profiles p ON p.id = c.completed_by
    ORDER BY c.completed_at DESC
  `).all()

  const tasksWithCompletions = tasks.map(t => ({
    ...t,
    completions: completions.filter(c => c.task_id === t.id),
  }))

  res.json(tasksWithCompletions)
})

app.post('/api/tasks', (req, res) => {
  const { name, category, frequency, assigned_to } = req.body
  const stmt = db.prepare('INSERT INTO tasks (name, category, frequency, assigned_to) VALUES (?, ?, ?, ?)')
  const result = stmt.run(name, category, frequency, assigned_to)
  res.status(201).json({ id: result.lastInsertRowid })
})

app.patch('/api/tasks/:id', (req, res) => {
  const { name, category, frequency, assigned_to } = req.body
  const stmt = db.prepare('UPDATE tasks SET name = COALESCE(?, name), category = COALESCE(?, category), frequency = COALESCE(?, frequency), assigned_to = COALESCE(?, assigned_to) WHERE id = ?')
  stmt.run(name, category, frequency, assigned_to, req.params.id)
  res.json({ ok: true })
})

app.delete('/api/tasks/:id', (req, res) => {
  db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id)
  res.json({ ok: true })
})

// ============ COMPLETIONS ============
app.post('/api/completions', (req, res) => {
  const { task_id, completed_by, completed_at } = req.body
  try {
    const stmt = db.prepare('INSERT INTO completions (task_id, completed_by, completed_at) VALUES (?, ?, ?)')
    stmt.run(task_id, completed_by, completed_at)
    res.status(201).json({ ok: true })
  } catch (err) {
    res.status(400).json({ error: 'Already completed today' })
  }
})

app.delete('/api/completions/:id', (req, res) => {
  db.prepare('DELETE FROM completions WHERE id = ?').run(req.params.id)
  res.json({ ok: true })
})

// ============ PUSH ============
app.post('/api/push/subscribe', (req, res) => {
  const { subscription, userId } = req.body
  db.prepare('INSERT OR REPLACE INTO push_subscriptions (user_id, subscription) VALUES (?, ?)')
    .run(userId, JSON.stringify(subscription))
  res.json({ ok: true })
})

app.post('/api/push/test', (req, res) => {
  const { userId } = req.body
  const row = db.prepare('SELECT subscription FROM push_subscriptions WHERE user_id = ?').get(userId)
  if (!row) return res.status(404).json({ error: 'No subscription' })

  webpush.sendNotification(
    JSON.parse(row.subscription),
    JSON.stringify({
      title: 'CleanWeek 🧹',
      body: 'Les notifications fonctionnent !',
      icon: '/icons/icon-192.png',
      url: '/',
    })
  ).then(() => res.json({ ok: true })).catch(err => res.status(500).json({ error: err.message }))
})

// ============ HEALTH ============
app.get('/api/health', (_req, res) => res.json({ ok: true }))

// ============ STATIC FRONTEND ============
const FRONTEND_DIR = process.env.FRONTEND_DIR || '../frontend/dist'
app.use(express.static(FRONTEND_DIR))
app.get('*', (_req, res) => {
  res.sendFile(new URL(`${FRONTEND_DIR}/index.html`, import.meta.url).pathname)
})

// ============ CRON : daily push at 8h ============
cron.schedule('0 8 * * *', () => {
  console.log('[CRON] Sending daily reminders...')
  const today = new Date().toISOString().split('T')[0]
  const subs = db.prepare('SELECT * FROM push_subscriptions').all()
  if (!subs.length) return

  const tasks = db.prepare('SELECT * FROM tasks').all()
  const completions = db.prepare('SELECT task_id, completed_at FROM completions WHERE completed_at = ?').all(today)
  const completedIds = new Set(completions.map(c => c.task_id))

  for (const sub of subs) {
    const userTasks = tasks.filter(t => {
      if (t.assigned_to && t.assigned_to !== sub.user_id && t.assigned_to !== 'both') return false
      return !completedIds.has(t.id)
    })
    if (userTasks.length === 0) continue

    webpush.sendNotification(
      JSON.parse(sub.subscription),
      JSON.stringify({
        title: 'CleanWeek 🧹',
        body: `Tu as ${userTasks.length} tâche${userTasks.length > 1 ? 's' : ''} à faire aujourd'hui !`,
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        url: '/',
      })
    ).catch(() => {
      // Ignore expired subscriptions
    })
  }
}, { timezone: 'Europe/Paris' })

app.listen(PORT, () => {
  console.log(`CleanWeek backend running on port ${PORT}`)
})

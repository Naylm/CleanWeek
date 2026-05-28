import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import cron from 'node-cron'
import { createClient } from '@supabase/supabase-js'
import webpush from 'web-push'
import tasksRouter from './routes/tasks.js'
import pushRouter from './routes/push.js'

const app = express()
const PORT = process.env.PORT || 3001

// Config web-push
webpush.setVapidDetails(
  `mailto:${process.env.VAPID_EMAIL}`,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
)

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}))
app.use(express.json())

// Routes
app.use('/api/tasks', tasksRouter)
app.use('/api/push', pushRouter)

app.get('/api/health', (_req, res) => res.json({ ok: true }))

// Cron job : notification chaque matin à 8h
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)

cron.schedule('0 8 * * *', async () => {
  console.log('[CRON] Envoi des rappels matinaux...')
  try {
    const today = new Date().toISOString().split('T')[0]
    const { data: subs } = await supabase.from('push_subscriptions').select('*')
    if (!subs?.length) return

    const { data: tasks } = await supabase
      .from('tasks')
      .select('*, completions(completed_at)')

    if (!tasks?.length) return

    for (const sub of subs) {
      const userTasks = tasks.filter(t => {
        if (t.assigned_to && t.assigned_to !== sub.user_id && t.assigned_to !== 'both') return false
        const lastDone = t.completions?.sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at))[0]
        if (!lastDone) return true
        // Simplification : on notifie si pas fait aujourd'hui
        return lastDone.completed_at !== today
      })

      if (userTasks.length === 0) continue

      try {
        await webpush.sendNotification(
          JSON.parse(sub.subscription),
          JSON.stringify({
            title: 'CleanWeek 🧹',
            body: `Tu as ${userTasks.length} tâche${userTasks.length > 1 ? 's' : ''} à faire aujourd'hui !`,
            icon: '/icons/icon-192.png',
            badge: '/icons/icon-192.png',
            url: '/',
          })
        )
      } catch (err) {
        if (err.statusCode === 410) {
          // Subscription expirée, la supprimer
          await supabase.from('push_subscriptions').delete().eq('id', sub.id)
        }
      }
    }
    console.log('[CRON] Rappels envoyés.')
  } catch (err) {
    console.error('[CRON] Erreur:', err)
  }
}, { timezone: 'Europe/Paris' })

app.listen(PORT, () => {
  console.log(`Backend CleanWeek en écoute sur le port ${PORT}`)
})

import { Router } from 'express'
import { createClient } from '@supabase/supabase-js'
import webpush from 'web-push'

const router = Router()

function getSupabase() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
}

// POST /api/push/subscribe
router.post('/subscribe', async (req, res) => {
  const { subscription, userId } = req.body
  if (!subscription || !userId) return res.status(400).json({ error: 'missing fields' })

  const supabase = getSupabase()

  // Upsert la subscription
  const { error } = await supabase
    .from('push_subscriptions')
    .upsert({ user_id: userId, subscription: JSON.stringify(subscription) }, { onConflict: 'user_id' })

  if (error) return res.status(500).json({ error: error.message })
  res.json({ ok: true })
})

// POST /api/push/send-test
router.post('/send-test', async (req, res) => {
  const { userId } = req.body
  const supabase = getSupabase()

  const { data: sub } = await supabase
    .from('push_subscriptions')
    .select('subscription')
    .eq('user_id', userId)
    .single()

  if (!sub) return res.status(404).json({ error: 'Subscription not found' })

  try {
    await webpush.sendNotification(
      JSON.parse(sub.subscription),
      JSON.stringify({
        title: 'CleanWeek 🧹',
        body: 'Les notifications fonctionnent !',
        icon: '/icons/icon-192.png',
        url: '/',
      })
    )
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router

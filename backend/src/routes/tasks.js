import { Router } from 'express'
import { createClient } from '@supabase/supabase-js'

const router = Router()

function getSupabase() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
}

// GET /api/tasks
router.get('/', async (req, res) => {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('tasks')
    .select('*, completions(*)')
    .order('created_at', { ascending: true })

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

// POST /api/tasks
router.post('/', async (req, res) => {
  const supabase = getSupabase()
  const { name, category, frequency, assigned_to } = req.body
  if (!name) return res.status(400).json({ error: 'name required' })

  const { data, error } = await supabase
    .from('tasks')
    .insert({ name, category, frequency, assigned_to })
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.status(201).json(data)
})

// DELETE /api/tasks/:id
router.delete('/:id', async (req, res) => {
  const supabase = getSupabase()
  const { error } = await supabase.from('tasks').delete().eq('id', req.params.id)
  if (error) return res.status(500).json({ error: error.message })
  res.json({ ok: true })
})

export default router

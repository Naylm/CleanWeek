import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useTasks(userId) {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchTasks = useCallback(async () => {
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        completions (
          id,
          completed_by,
          completed_at,
          profiles (display_name, avatar_color)
        )
      `)
      .order('created_at', { ascending: true })

    if (!error && data) setTasks(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchTasks()

    const channel = supabase
      .channel('tasks-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, fetchTasks)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'completions' }, fetchTasks)
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [fetchTasks])

  async function completeTask(taskId) {
    const today = new Date().toISOString().split('T')[0]
    const { error } = await supabase.from('completions').insert({
      task_id: taskId,
      completed_by: userId,
      completed_at: today,
    })
    if (!error) fetchTasks()
    return !error
  }

  async function uncompleteTask(completionId) {
    const { error } = await supabase.from('completions').delete().eq('id', completionId)
    if (!error) fetchTasks()
    return !error
  }

  async function addTask(task) {
    const { error } = await supabase.from('tasks').insert(task)
    if (!error) fetchTasks()
    return !error
  }

  async function updateTask(id, updates) {
    const { error } = await supabase.from('tasks').update(updates).eq('id', id)
    if (!error) fetchTasks()
    return !error
  }

  async function deleteTask(id) {
    const { error } = await supabase.from('tasks').delete().eq('id', id)
    if (!error) fetchTasks()
    return !error
  }

  return { tasks, loading, completeTask, uncompleteTask, addTask, updateTask, deleteTask, refetch: fetchTasks }
}

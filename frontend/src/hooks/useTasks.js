import { useState, useEffect, useCallback } from 'react'

const API_URL = import.meta.env.VITE_API_URL || ''

export function useTasks() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/tasks`)
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setTasks(data)
    } catch (err) {
      console.error('Error fetching tasks:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  const addTask = useCallback(async (taskData) => {
    const res = await fetch(`${API_URL}/api/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taskData),
    })
    if (!res.ok) throw new Error('Failed to add task')
    await fetchTasks()
  }, [fetchTasks])

  const updateTask = useCallback(async (id, updates) => {
    const res = await fetch(`${API_URL}/api/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    if (!res.ok) throw new Error('Failed to update task')
    await fetchTasks()
  }, [fetchTasks])

  const deleteTask = useCallback(async (id) => {
    const res = await fetch(`${API_URL}/api/tasks/${id}`, {
      method: 'DELETE',
    })
    if (!res.ok) throw new Error('Failed to delete task')
    await fetchTasks()
  }, [fetchTasks])

  const completeTask = useCallback(async (taskId) => {
    const today = new Date().toISOString().split('T')[0]
    const res = await fetch(`${API_URL}/api/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task_id: taskId, completed_at: today }),
    })
    if (!res.ok) throw new Error('Failed to complete task')
    await fetchTasks()
  }, [fetchTasks])

  const uncompleteTask = useCallback(async (completionId) => {
    const res = await fetch(`${API_URL}/api/completions/${completionId}`, {
      method: 'DELETE',
    })
    if (!res.ok) throw new Error('Failed to uncomplete task')
    await fetchTasks()
  }, [fetchTasks])

  // Snooze (postpone) a task
  const snoozeTask = useCallback(async (taskId, days = 1) => {
    const res = await fetch(`${API_URL}/api/tasks/${taskId}/snooze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ days }),
    })
    if (!res.ok) throw new Error('Failed to snooze task')
    await fetchTasks()
  }, [fetchTasks])

  return {
    tasks,
    loading,
    addTask,
    updateTask,
    deleteTask,
    completeTask,
    uncompleteTask,
    snoozeTask,
    refresh: fetchTasks,
  }
}

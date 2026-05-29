import { useState, useEffect, useCallback } from 'react'
import { api } from '../lib/api'

export function useTasks() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchTasks = useCallback(async () => {
    try {
      const data = await api.get('/tasks')
      setTasks(data)
    } catch (err) {
      console.error('Failed to fetch tasks:', err)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchTasks()
    const interval = setInterval(fetchTasks, 30000)
    return () => clearInterval(interval)
  }, [fetchTasks])

  async function completeTask(taskId) {
    const today = new Date().toISOString().split('T')[0]
    try {
      await api.post('/completions', { task_id: taskId, completed_at: today })
      fetchTasks()
      return true
    } catch (err) {
      console.error('Failed to complete task:', err)
      return false
    }
  }

  async function uncompleteTask(completionId) {
    try {
      await api.del(`/completions/${completionId}`)
      fetchTasks()
      return true
    } catch (err) {
      console.error('Failed to uncomplete task:', err)
      return false
    }
  }

  async function addTask(task) {
    try {
      await api.post('/tasks', task)
      fetchTasks()
      return true
    } catch (err) {
      console.error('Failed to add task:', err)
      return false
    }
  }

  async function updateTask(id, updates) {
    try {
      await api.patch(`/tasks/${id}`, updates)
      fetchTasks()
      return true
    } catch (err) {
      console.error('Failed to update task:', err)
      return false
    }
  }

  async function deleteTask(id) {
    try {
      await api.del(`/tasks/${id}`)
      fetchTasks()
      return true
    } catch (err) {
      console.error('Failed to delete task:', err)
      return false
    }
  }

  return { tasks, loading, completeTask, uncompleteTask, addTask, updateTask, deleteTask, refetch: fetchTasks }
}

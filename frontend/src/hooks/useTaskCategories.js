import { useState, useEffect, useCallback } from 'react'
import { onRefresh } from '../lib/events'

const API_URL = import.meta.env.VITE_API_URL || ''

export function useTaskCategories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/task-categories`)
      if (!res.ok) throw new Error('Failed to fetch task categories')
      const data = await res.json()
      setCategories(data)
    } catch (err) {
      console.error('Error fetching task categories:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCategories()
    const unsub1 = onRefresh((type) => {
      if (type === 'task_category_added' || type === 'task_category_updated' || type === 'task_category_deleted') {
        fetchCategories()
      }
    })
    return unsub1
  }, [fetchCategories])

  async function addCategory(category) {
    const res = await fetch(`${API_URL}/api/task-categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(category),
    })
    if (!res.ok) throw new Error(await res.text())
    const newCat = await res.json()
    setCategories(prev => [...prev, newCat].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.label.localeCompare(b.label)))
    return newCat
  }

  async function updateCategory(id, updates) {
    const res = await fetch(`${API_URL}/api/task-categories/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    if (!res.ok) throw new Error(await res.text())
    setCategories(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.label.localeCompare(b.label)))
  }

  async function deleteCategory(id) {
    const res = await fetch(`${API_URL}/api/task-categories/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error(await res.text())
    setCategories(prev => prev.filter(c => c.id !== id))
  }

  return {
    categories,
    loading,
    addCategory,
    updateCategory,
    deleteCategory,
    refresh: fetchCategories,
  }
}

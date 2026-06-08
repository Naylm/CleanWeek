import { useState, useEffect, useCallback } from 'react'
import { onRefresh } from '../lib/events'

export function useShopCategories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/shop-categories', { cache: 'no-store' })
      const data = await res.json()
      setCategories(data)
    } catch (err) {
      console.error('Error fetching shop categories:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const t = setTimeout(fetchCategories, 0)
    const onVisible = () => {
      if (document.visibilityState === 'visible') fetchCategories()
    }
    window.addEventListener('focus', fetchCategories)
    document.addEventListener('visibilitychange', onVisible)
    const unsub1 = onRefresh((type) => {
      if (type === 'shop-categories') {
        fetchCategories()
      }
    })
    return () => {
      clearTimeout(t)
      window.removeEventListener('focus', fetchCategories)
      document.removeEventListener('visibilitychange', onVisible)
      unsub1()
    }
  }, [fetchCategories])

  async function addCategory(category) {
    const res = await fetch('/api/shop-categories', {
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
    const res = await fetch(`/api/shop-categories/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    if (!res.ok) throw new Error(await res.text())
    setCategories(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.label.localeCompare(b.label)))
  }

  async function deleteCategory(id) {
    const res = await fetch(`/api/shop-categories/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error(await res.text())
    setCategories(prev => prev.filter(c => c.id !== id))
  }

  return {
    categories,
    loading,
    addCategory,
    updateCategory,
    deleteCategory,
  }
}

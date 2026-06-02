import { useState, useEffect, useCallback } from 'react'
import { api } from '../lib/api'

export function useShopping() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchItems = useCallback(async () => {
    try {
      const data = await api.get('/shopping')
      setItems(data)
    } catch (err) {
      console.error('Failed to fetch shopping items:', err)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    const t = setTimeout(fetchItems, 0)
    const interval = setInterval(fetchItems, 30000)
    return () => {
      clearTimeout(t)
      clearInterval(interval)
    }
  }, [fetchItems])

  async function addItem(item) {
    try {
      await api.post('/shopping', item)
      fetchItems()
      return true
    } catch (err) {
      console.error('Failed to add item:', err)
      return false
    }
  }

  async function toggleItem(id, checked) {
    try {
      await api.patch(`/shopping/${id}`, { checked: !checked })
      fetchItems()
      return true
    } catch (err) {
      console.error('Failed to toggle item:', err)
      return false
    }
  }

  async function deleteItem(id) {
    try {
      await api.del(`/shopping/${id}`)
      fetchItems()
      return true
    } catch (err) {
      console.error('Failed to delete item:', err)
      return false
    }
  }

  return { items, loading, addItem, toggleItem, deleteItem, refetch: fetchItems }
}

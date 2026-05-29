import { useState, useEffect, useCallback } from 'react'
import { api } from '../lib/api'

const MEALS = [
  { value: 'lunch', label: 'Déjeuner' },
  { value: 'dinner', label: 'Dîner' },
]

export function useMeals() {
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchPlans = useCallback(async () => {
    try {
      const data = await api.get('/meals')
      setPlans(data)
    } catch (err) {
      console.error('Failed to fetch meal plans:', err)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchPlans()
    const interval = setInterval(fetchPlans, 30000)
    return () => clearInterval(interval)
  }, [fetchPlans])

  async function setMeal({ date, meal, content, notes, created_by }) {
    try {
      await api.post('/meals', { date, meal, content, notes, created_by })
      fetchPlans()
      return true
    } catch (err) {
      console.error('Failed to set meal:', err)
      return false
    }
  }

  async function updateMeal(id, { content, notes }) {
    try {
      await api.patch(`/meals/${id}`, { content, notes })
      fetchPlans()
      return true
    } catch (err) {
      console.error('Failed to update meal:', err)
      return false
    }
  }

  async function deleteMeal(id) {
    try {
      await api.del(`/meals/${id}`)
      fetchPlans()
      return true
    } catch (err) {
      console.error('Failed to delete meal:', err)
      return false
    }
  }

  async function toggleShoppingDone(id, done) {
    try {
      await api.patch(`/meals/${id}`, { shopping_done: done })
      fetchPlans()
      return true
    } catch (err) {
      console.error('Failed to toggle shopping_done:', err)
      return false
    }
  }

  return { plans, loading, setMeal, updateMeal, deleteMeal, toggleShoppingDone, MEALS, refetch: fetchPlans }
}

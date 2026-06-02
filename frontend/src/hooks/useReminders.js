import { useState, useEffect, useCallback } from 'react'

const API_URL = import.meta.env.VITE_API_URL || ''

export function useReminders() {
  const [slots, setSlots] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchSlots = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/reminders`)
      if (!res.ok) throw new Error('Failed to fetch reminders')
      const data = await res.json()
      setSlots(data.map(slot => ({
        ...slot,
        enabled: slot.enabled === 1,
        days_of_week: slot.days_of_week ? JSON.parse(slot.days_of_week) : null,
      })))
    } catch (err) {
      console.error('Error fetching reminders:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSlots()
  }, [fetchSlots])

  const addSlot = useCallback(async (slotData) => {
    try {
      const res = await fetch(`${API_URL}/api/reminders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(slotData),
      })
      if (!res.ok) throw new Error('Failed to add reminder')
      await fetchSlots()
      return true
    } catch (err) {
      console.error('Error adding reminder:', err)
      return false
    }
  }, [fetchSlots])

  const updateSlot = useCallback(async (id, updates) => {
    try {
      const res = await fetch(`${API_URL}/api/reminders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (!res.ok) throw new Error('Failed to update reminder')
      await fetchSlots()
      return true
    } catch (err) {
      console.error('Error updating reminder:', err)
      return false
    }
  }, [fetchSlots])

  const deleteSlot = useCallback(async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/reminders/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete reminder')
      await fetchSlots()
      return true
    } catch (err) {
      console.error('Error deleting reminder:', err)
      return false
    }
  }, [fetchSlots])

  return {
    slots,
    loading,
    addSlot,
    updateSlot,
    deleteSlot,
    refresh: fetchSlots,
  }
}

import { useState, useEffect, useCallback } from 'react'
import { api } from '../lib/api'

export function useWeekSettings() {
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchSettings = useCallback(async () => {
    try {
      const data = await api.get('/week-settings')
      setSettings(data)
    } catch (err) {
      console.error('Failed to fetch week settings:', err)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    const t = setTimeout(fetchSettings, 0)
    return () => clearTimeout(t)
  }, [fetchSettings])

  async function updateSettings(updates) {
    try {
      const data = await api.patch('/week-settings', updates)
      setSettings(data)
      return true
    } catch (err) {
      console.error('Failed to update week settings:', err)
      return false
    }
  }

  async function setStartDayOfWeek(day) {
    return updateSettings({ startDayOfWeek: day })
  }

  async function setCurrentWeekOffset(offset) {
    return updateSettings({ currentWeekOffset: offset })
  }

  async function goToPreviousWeek() {
    const newOffset = (settings?.current_week_offset || 0) - 1
    return setCurrentWeekOffset(newOffset)
  }

  async function goToNextWeek() {
    const newOffset = (settings?.current_week_offset || 0) + 1
    return setCurrentWeekOffset(newOffset)
  }

  async function goToCurrentWeek() {
    return setCurrentWeekOffset(0)
  }

  // Calculer les dates de la semaine en cours basé sur les paramètres
  const getWeekDays = useCallback((daysCount = 9) => {
    if (!settings) return []

    const today = new Date()
    const startDayOfWeek = settings.start_day_of_week || 5 // Vendredi par défaut
    const weekOffset = settings.current_week_offset || 0

    // Trouver le debut de la semaine (jour configurable, par défaut vendredi)
    const currentDay = today.getDay()
    const diffToStart = (currentDay - startDayOfWeek + 7) % 7
    const weekStart = new Date(today)
    weekStart.setDate(today.getDate() - diffToStart + (weekOffset * 7))

    const days = []
    for (let i = 0; i < daysCount; i++) {
      const d = new Date(weekStart)
      d.setDate(weekStart.getDate() + i)
      days.push({
        date: d.toISOString().split('T')[0],
        label: d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' }),
        isToday: i === diffToStart && weekOffset === 0,
      })
    }
    return days
  }, [settings])

  // Obtenir le label de la periode actuelle
  const getPeriodLabel = useCallback(() => {
    if (!settings) return 'Chargement...'

    const weekOffset = settings.current_week_offset || 0
    if (weekOffset === 0) return "Cette semaine"
    if (weekOffset === -1) return "Semaine dernière"
    if (weekOffset === 1) return "Semaine prochaine"
    if (weekOffset < 0) return `Il y a ${Math.abs(weekOffset)} semaines`
    return `Dans ${weekOffset} semaines`
  }, [settings])

  return {
    settings,
    loading,
    getWeekDays,
    getPeriodLabel,
    setStartDayOfWeek,
    setCurrentWeekOffset,
    goToPreviousWeek,
    goToNextWeek,
    goToCurrentWeek,
    refresh: fetchSettings,
  }
}

import { startOfDay, addDays, addWeeks, addMonths, isSameDay, isAfter, isBefore } from 'date-fns'

/**
 * Calcule si une tâche est due aujourd'hui en fonction de sa dernière complétion et sa fréquence.
 */
export function isTaskDueToday(task) {
  const today = startOfDay(new Date())
  const nextDue = getNextDueDate(task)
  return isSameDay(nextDue, today) || isBefore(nextDue, today)
}

/**
 * Calcule la prochaine date d'échéance d'une tâche.
 */
export function getNextDueDate(task) {
  const lastCompletion = task.completions?.length
    ? task.completions.reduce((latest, c) => {
        const d = new Date(c.completed_at)
        return d > latest ? d : latest
      }, new Date(0))
    : null

  const createdAt = startOfDay(new Date(task.created_at))

  if (!lastCompletion || lastCompletion.getTime() === 0) {
    return createdAt
  }

  const last = startOfDay(lastCompletion)

  switch (task.frequency) {
    case 'daily':
      return addDays(last, 1)
    case 'weekly':
      return addWeeks(last, 1)
    case 'biweekly':
      return addWeeks(last, 2)
    case 'monthly':
      return addMonths(last, 1)
    default:
      return addWeeks(last, 1)
  }
}

export const FREQUENCIES = [
  { value: 'daily', label: 'Chaque jour' },
  { value: 'weekly', label: 'Chaque semaine' },
  { value: 'biweekly', label: 'Toutes les 2 semaines' },
  { value: 'monthly', label: 'Chaque mois' },
]

export const CATEGORIES = [
  { value: 'cuisine', label: 'Cuisine', icon: '🍳' },
  { value: 'salon', label: 'Salon', icon: '🛋️' },
  { value: 'chambre', label: 'Chambre', icon: '🛏️' },
  { value: 'salle_de_bain', label: 'Salle de bain', icon: '🚿' },
  { value: 'linge', label: 'Linge', icon: '👕' },
  { value: 'courses', label: 'Courses', icon: '🛒' },
  { value: 'exterieur', label: 'Extérieur', icon: '🌿' },
  { value: 'autre', label: 'Autre', icon: '📋' },
]

export function getCategoryIcon(category) {
  return CATEGORIES.find(c => c.value === category)?.icon || '📋'
}

export function formatNextDue(task) {
  const next = getNextDueDate(task)
  const today = startOfDay(new Date())
  const tomorrow = addDays(today, 1)

  if (isSameDay(next, today) || isBefore(next, today)) return 'Aujourd\'hui'
  if (isSameDay(next, tomorrow)) return 'Demain'

  const diff = Math.ceil((next - today) / (1000 * 60 * 60 * 24))
  if (diff <= 7) return `Dans ${diff} jours`
  return next.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

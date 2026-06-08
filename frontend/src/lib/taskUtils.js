import { startOfDay, addDays, addWeeks, addMonths, isSameDay, isBefore, getDay, differenceInDays } from 'date-fns'

/**
 * Calcule si une tache est due aujourd'hui en fonction de sa derniere completion et sa frequence.
 */
export function isTaskDueToday(task, referenceDate = new Date()) {
  const today = startOfDay(referenceDate)
  const nextDue = getNextDueDate(task, referenceDate)
  return isSameDay(nextDue, today) || isBefore(nextDue, today)
}

/**
 * Verifie si une tache est due a une date specifique.
 */
export function isTaskDueOnDate(task, date, referenceDate = new Date()) {
  const checkDate = startOfDay(date)
  const nextDue = getNextDueDate(task, referenceDate)
  return isSameDay(nextDue, checkDate) || isBefore(nextDue, checkDate)
}

/**
 * Calcule la prochaine date d'echeance d'une tache.
 */
export function getNextDueDate(task, referenceDate = new Date()) {
  // Si un intervalle personnalise est active
  if (task.custom_interval_enabled && task.customInterval) {
    return getNextDueDateCustom(task, referenceDate)
  }

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

/**
 * Calcule la prochaine date d'echeance avec un intervalle personnalise.
 */
function getNextDueDateCustom(task, referenceDate = new Date()) {
  const interval = task.customInterval
  if (!interval) return startOfDay(new Date(task.created_at))

  const lastCompletion = task.completions?.length
    ? task.completions.reduce((latest, c) => {
        const d = new Date(c.completed_at)
        return d > latest ? d : latest
      }, new Date(0))
    : null

  const createdAt = startOfDay(new Date(task.created_at))
  const today = startOfDay(referenceDate)

  if (!lastCompletion || lastCompletion.getTime() === 0) {
    // Premiere execution - trouver le prochain jour convenable
    if (interval.interval_type === 'days_of_week' && interval.days_of_week) {
      const days = JSON.parse(interval.days_of_week)
      return findNextDayOfWeek(today, days)
    }
    return createdAt
  }

  const last = startOfDay(lastCompletion)

  // Intervalle par jours de la semaine (ex: tous les lundis et jeudis)
  if (interval.interval_type === 'days_of_week' && interval.days_of_week) {
    const days = JSON.parse(interval.days_of_week)
    return findNextDayOfWeek(addDays(last, 1), days)
  }

  // Intervalle par mois (ex: tous les 2 mois, 3 mois)
  if (interval.interval_type === 'month_interval' && interval.month_interval) {
    return addMonths(last, parseInt(interval.month_interval))
  }

  // Fallback sur la frequence standard
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

/**
 * Trouve le prochain jour de la semaine parmi une liste de jours.
 * days: array de nombres 0-6 (dimanche = 0, lundi = 1, etc.)
 */
function findNextDayOfWeek(fromDate, days) {
  if (!days || days.length === 0) return fromDate

  const fromDay = getDay(fromDate)

  // Trouver le prochain jour dans la semaine courante
  for (let i = 0; i < 7; i++) {
    const checkDay = (fromDay + i) % 7
    if (days.includes(checkDay)) {
      return addDays(fromDate, i)
    }
  }

  // Si aucun jour trouve, prendre le premier jour de la liste (semaine suivante)
  const firstDay = days.sort((a, b) => a - b)[0]
  const daysUntil = (7 - fromDay + firstDay) % 7 || 7
  return addDays(fromDate, daysUntil)
}

/**
 * Recupere tous les jours ou la tache doit etre effectuee dans une periode.
 */
export function getDueDatesInRange(task, startDate, endDate) {
  const dates = []
  let current = startOfDay(startDate)
  const end = startOfDay(endDate)

  // Si intervalle personnalise par jours de la semaine
  if (task.custom_interval_enabled && task.customInterval?.interval_type === 'days_of_week' && task.customInterval.days_of_week) {
    const days = JSON.parse(task.customInterval.days_of_week)
    while (current <= end) {
      if (days.includes(getDay(current))) {
        dates.push(new Date(current))
      }
      current = addDays(current, 1)
    }
    return dates
  }

  // Pour les autres types, calculer base sur la prochaine echeance
  const nextDue = getNextDueDate(task)
  if (nextDue >= current && nextDue <= end) {
    dates.push(nextDue)
  }

  return dates
}

export const FREQUENCIES = [
  { value: 'daily', label: 'Chaque jour' },
  { value: 'weekly', label: 'Chaque semaine' },
  { value: 'biweekly', label: 'Toutes les 2 semaines' },
  { value: 'monthly', label: 'Chaque mois' },
]

export const DAYS_OF_WEEK = [
  { value: 1, label: 'Lundi', short: 'Lu' },
  { value: 2, label: 'Mardi', short: 'Ma' },
  { value: 3, label: 'Mercredi', short: 'Me' },
  { value: 4, label: 'Jeudi', short: 'Je' },
  { value: 5, label: 'Vendredi', short: 'Ve' },
  { value: 6, label: 'Samedi', short: 'Sa' },
  { value: 0, label: 'Dimanche', short: 'Di' },
]

export const MONTH_INTERVALS = [
  { value: 1, label: 'Tous les mois' },
  { value: 2, label: 'Tous les 2 mois' },
  { value: 3, label: 'Tous les 3 mois' },
  { value: 4, label: 'Tous les 4 mois' },
  { value: 6, label: 'Tous les 6 mois' },
  { value: 12, label: 'Une fois par an' },
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

export function getCategoryIconDynamic(category, categories) {
  if (!categories || categories.length === 0) {
    return CATEGORIES.find(c => c.value === category)?.icon || '📋'
  }
  return categories.find(c => c.value === category)?.icon || '📋'
}

export function formatNextDue(task, referenceDate = new Date()) {
  const next = getNextDueDate(task, referenceDate)
  const today = startOfDay(referenceDate)
  const tomorrow = addDays(today, 1)

  if (isSameDay(next, today) || isBefore(next, today)) return "Aujourd'hui"
  if (isSameDay(next, tomorrow)) return 'Demain'

  const diff = Math.ceil((next - today) / (1000 * 60 * 60 * 24))
  if (diff <= 7) return `Dans ${diff} jours`
  return next.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

export function getIntervalLabel(task) {
  if (!task.custom_interval_enabled || !task.customInterval) {
    return FREQUENCIES.find(f => f.value === task.frequency)?.label || task.frequency
  }

  const interval = task.customInterval

  if (interval.interval_type === 'days_of_week' && interval.days_of_week) {
    const days = JSON.parse(interval.days_of_week)
    const dayLabels = days.map(d => DAYS_OF_WEEK.find(dw => dw.value === d)?.short).join(', ')
    return `Les ${dayLabels}`
  }

  if (interval.interval_type === 'month_interval' && interval.month_interval) {
    return MONTH_INTERVALS.find(m => m.value === parseInt(interval.month_interval))?.label || `Tous les ${interval.month_interval} mois`
  }

  return FREQUENCIES.find(f => f.value === task.frequency)?.label || task.frequency
}

/**
 * Calcule le nombre de jours ecoules depuis la derniere execution d'une tache.
 * Retourne 0 si jamais fait.
 */
export function getDaysSinceLastDone(task, referenceDate = new Date()) {
  const lastCompletion = task.completions?.length
    ? task.completions.reduce((latest, c) => {
        const d = new Date(c.completed_at)
        return d > latest ? d : latest
      }, new Date(0))
    : null

  if (!lastCompletion || lastCompletion.getTime() === 0) {
    // Jamais fait - considerer comme "fraichement cree" ou calculer depuis creation
    const createdAt = new Date(task.created_at)
    return Math.max(0, differenceInDays(startOfDay(referenceDate), startOfDay(createdAt)))
  }

  return Math.max(0, differenceInDays(startOfDay(referenceDate), startOfDay(lastCompletion)))
}

/**
 * Retourne l'intervalle en jours pour une tache selon sa frequence.
 */
export function getTaskIntervalDays(task) {
  // Si intervalle personnalise
  if (task.custom_interval_enabled && task.customInterval) {
    const interval = task.customInterval

    if (interval.interval_type === 'days_of_week' && interval.days_of_week) {
      const days = JSON.parse(interval.days_of_week)
      // Calculer l'intervalle moyen entre les jours selectionnes
      if (days.length === 1) return 7 // Une fois par semaine
      if (days.length === 2) return 3 // Deux fois par semaine ~ tous les 3-4 jours
      if (days.length >= 3) return 2 // Plusieurs fois par semaine
      return 7
    }

    if (interval.interval_type === 'month_interval' && interval.month_interval) {
      return parseInt(interval.month_interval) * 30 // Approximation en jours
    }
  }

  // Frequence standard
  switch (task.frequency) {
    case 'daily':
      return 1
    case 'weekly':
      return 7
    case 'biweekly':
      return 14
    case 'monthly':
      return 30
    default:
      return 7
  }
}

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useTaskCategories } from '../hooks/useTaskCategories'
import { FREQUENCIES, DAYS_OF_WEEK, MONTH_INTERVALS } from '../lib/taskUtils'
import './AddTaskModal.css'

export default function AddTaskModal({ onAdd, onClose, initialTask = null }) {
  const isEditing = !!initialTask
  const { categories: taskCategories, loading: categoriesLoading } = useTaskCategories()

  const [name, setName] = useState(initialTask?.name || '')
  const [category, setCategory] = useState(initialTask?.category || 'autre')
  const [frequency, setFrequency] = useState(initialTask?.frequency || 'weekly')

  // Custom interval state
  const hasCustomInterval = initialTask?.custom_interval_enabled && initialTask?.customInterval
  const [useCustomInterval, setUseCustomInterval] = useState(!!hasCustomInterval)
  const [intervalType, setIntervalType] = useState(initialTask?.customInterval?.interval_type || 'days_of_week')
  const [selectedDays, setSelectedDays] = useState(
    initialTask?.customInterval?.days_of_week
      ? JSON.parse(initialTask.customInterval.days_of_week)
      : [1] // Lundi par défaut
  )
  const [monthInterval, setMonthInterval] = useState(
    initialTask?.customInterval?.month_interval || 2
  )

  const [loading, setLoading] = useState(false)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  function toggleDay(day) {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter(d => d !== day))
    } else {
      setSelectedDays([...selectedDays, day].sort((a, b) => a - b))
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)

    const taskData = {
      name: name.trim(),
      category,
      frequency,
    }

    // Ajouter l'intervalle personnalise si active
    if (useCustomInterval) {
      taskData.customInterval = {
        enabled: true,
        intervalType,
      }

      if (intervalType === 'days_of_week') {
        taskData.customInterval.daysOfWeek = selectedDays.length > 0 ? selectedDays : [1]
      } else if (intervalType === 'month_interval') {
        taskData.customInterval.monthInterval = parseInt(monthInterval)
      }
    }

    await onAdd(taskData, initialTask?.id)
    setLoading(false)
    onClose()
  }

  return createPortal(
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2>{isEditing ? 'Modifier la tâche' : 'Nouvelle tâche'}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="field">
            <label>Nom de la tâche</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ex : Passer l'aspirateur"
              autoFocus
              required
            />
          </div>

          <div className="field">
            <label>Catégorie</label>
            {categoriesLoading ? (
              <span>Chargement...</span>
            ) : (
              <div className="icon-grid">
                {taskCategories.map(cat => (
                  <button
                    key={cat.value}
                    type="button"
                    className={`icon-btn${category === cat.value ? ' active' : ''}`}
                    onClick={() => setCategory(cat.value)}
                  >
                    <span>{cat.icon}</span>
                    <span className="icon-btn-label">{cat.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="field">
            <label>Intervalle personnalisé</label>
            <div className="custom-interval-toggle">
              <button
                type="button"
                className={`select-btn${!useCustomInterval ? ' active' : ''}`}
                onClick={() => setUseCustomInterval(false)}
              >
                Fréquence standard
              </button>
              <button
                type="button"
                className={`select-btn${useCustomInterval ? ' active' : ''}`}
                onClick={() => setUseCustomInterval(true)}
              >
                Personnalisé
              </button>
            </div>
          </div>

          {!useCustomInterval ? (
            <div className="field">
              <label>Fréquence</label>
              <div className="select-group">
                {FREQUENCIES.map(f => (
                  <button
                    key={f.value}
                    type="button"
                    className={`select-btn${frequency === f.value ? ' active' : ''}`}
                    onClick={() => setFrequency(f.value)}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div className="field">
                <label>Type d'intervalle</label>
                <div className="select-group">
                  <button
                    type="button"
                    className={`select-btn${intervalType === 'days_of_week' ? ' active' : ''}`}
                    onClick={() => setIntervalType('days_of_week')}
                  >
                    Jours de la semaine
                  </button>
                  <button
                    type="button"
                    className={`select-btn${intervalType === 'month_interval' ? ' active' : ''}`}
                    onClick={() => setIntervalType('month_interval')}
                  >
                    Intervalle en mois
                  </button>
                </div>
              </div>

              {intervalType === 'days_of_week' && (
                <div className="field">
                  <label>Jours sélectionnés</label>
                  <div className="days-selector">
                    {DAYS_OF_WEEK.map(day => (
                      <button
                        key={day.value}
                        type="button"
                        className={`day-btn${selectedDays.includes(day.value) ? ' active' : ''}`}
                        onClick={() => toggleDay(day.value)}
                        title={day.label}
                      >
                        {day.short}
                      </button>
                    ))}
                  </div>
                  <p className="field-hint">
                    La tâche sera due les jours sélectionnés
                  </p>
                </div>
              )}

              {intervalType === 'month_interval' && (
                <div className="field">
                  <label>Tous les combien de mois ?</label>
                  <div className="select-group vertical">
                    {MONTH_INTERVALS.map(m => (
                      <button
                        key={m.value}
                        type="button"
                        className={`select-btn${monthInterval === m.value ? ' active' : ''}`}
                        onClick={() => setMonthInterval(m.value)}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Annuler</button>
            <button type="submit" className="btn-primary" disabled={loading || !name.trim()}>
              {loading ? <span className="btn-spinner" /> : (isEditing ? 'Enregistrer' : 'Créer la tâche')}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}

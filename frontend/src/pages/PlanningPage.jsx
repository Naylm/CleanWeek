import { useState, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useMeals } from '../hooks/useMeals'
import { useWeekSettings } from '../hooks/useWeekSettings'
import './PlanningPage.css'

const MEAL_LABELS = {
  lunch: 'Déjeuner',
  dinner: 'Dîner',
}

export default function PlanningPage() {
  const { plans, loading: loadingMeals, setMeal, updateMeal, deleteMeal, toggleShoppingDone, swapMeals, MEALS } = useMeals()
  const { settings, loading: loadingSettings, getWeekDays, getPeriodLabel, goToPreviousWeek, goToNextWeek, goToCurrentWeek } = useWeekSettings()

  const [addingMeal, setAddingMeal] = useState(null) // { date, meal }
  const [mealContent, setMealContent] = useState('')
  const [mealNotes, setMealNotes] = useState('')
  const [swappingMealId, setSwappingMealId] = useState(null)

  // Utiliser les jours de semaine depuis les paramètres
  const weekDays = useMemo(() => {
    if (loadingSettings || !settings) return []
    return getWeekDays(9)
  }, [settings, getWeekDays, loadingSettings])

  async function handleSetMeal(date, meal) {
    if (!mealContent.trim()) return
    const existing = plans.find(p => p.date === date && p.meal === meal)
    if (existing) {
      await updateMeal(existing.id, { content: mealContent.trim(), notes: mealNotes.trim() || undefined })
    } else {
      await setMeal({ date, meal, content: mealContent.trim(), notes: mealNotes.trim() || undefined })
    }
    setAddingMeal(null)
    setMealContent('')
    setMealNotes('')
  }

  function getMeal(date, meal) {
    return plans.find(p => p.date === date && p.meal === meal)
  }

  if (loadingMeals || loadingSettings) {
    return <div className="page-loading"><div className="spinner" /></div>
  }

  return (
    <div className="planning-page">
      <header className="planning-header">
        <h1>Menu</h1>
        <div className="week-navigation">
          <button className="week-nav-btn" onClick={goToPreviousWeek} title="Semaine précédente">←</button>
          <button className="week-current-btn" onClick={goToCurrentWeek}>
            {getPeriodLabel()}
          </button>
          <button className="week-nav-btn" onClick={goToNextWeek} title="Semaine suivante">→</button>
        </div>
      </header>

      <div className="meals-section">
          <div className="week-grid">
            {weekDays.map(day => (
              <div key={day.date} className={`day-card${day.isToday ? ' today' : ''}`}>
                <div className="day-header">
                  <span className="day-label">{day.label}</span>
                  {day.isToday && <span className="day-badge">Aujourd'hui</span>}
                </div>
                <div className="meals-list">
                  {MEALS.map(meal => {
                    const m = getMeal(day.date, meal.value)
                    const isAdding = addingMeal?.date === day.date && addingMeal?.meal === meal.value
                    return (
                      <div key={meal.value} className="meal-slot">
                        <span className="meal-label">{meal.label}</span>
                        {isAdding ? (
                          <div className="meal-form">
                            <input
                              autoFocus
                              placeholder="Qu'est-ce qu'on mange ?"
                              value={mealContent}
                              onChange={e => setMealContent(e.target.value)}
                              onKeyDown={e => e.key === 'Enter' && handleSetMeal(day.date, meal.value)}
                            />
                            <input
                              placeholder="Notes (optionnel)"
                              value={mealNotes}
                              onChange={e => setMealNotes(e.target.value)}
                            />
                            <div className="meal-form-actions">
                              <button onClick={() => { setAddingMeal(null); setMealContent(''); setMealNotes('') }}>Annuler</button>
                              <button className="btn-save" onClick={() => handleSetMeal(day.date, meal.value)}>OK</button>
                            </div>
                          </div>
                        ) : m ? (
                          <div className={`meal-content${m.shopping_done ? ' shopping-done' : ''}`}>
                            <p className="meal-text">{m.content}</p>
                            {m.notes && <p className="meal-notes">{m.notes}</p>}
                            <div className="meal-actions">
                              <button
                                className={`meal-shopping-btn${m.shopping_done ? ' done' : ''}`}
                                onClick={() => toggleShoppingDone(m.id, !m.shopping_done)}
                                title={m.shopping_done ? 'Courses faites' : 'Courses à faire'}
                              >
                                {m.shopping_done ? '🛒 ✓' : '🛒'}
                              </button>
                              <button
                                className="meal-swap-btn"
                                onClick={() => setSwappingMealId(m.id)}
                                title="Échanger avec un autre jour"
                              >
                                🔄
                              </button>
                              <button
                                className="meal-edit-btn"
                                onClick={() => {
                                  setAddingMeal({ date: day.date, meal: meal.value })
                                  setMealContent(m.content)
                                  setMealNotes(m.notes || '')
                                }}
                              >
                                ✎
                              </button>
                              <button
                                className="meal-delete-btn"
                                onClick={() => { if (confirm('Supprimer ce repas ?')) deleteMeal(m.id) }}
                                title="Supprimer"
                              >
                                🗑
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button className="meal-add-btn" onClick={() => setAddingMeal({ date: day.date, meal: meal.value })}>
                            + Ajouter
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

      {/* Modal d'échange de repas */}
      {swappingMealId && createPortal(
        <div className="modal-overlay" onClick={() => setSwappingMealId(null)}>
          <div className="modal">
            <div className="modal-header">
              <h3>Échanger avec...</h3>
              <button className="modal-close" onClick={() => setSwappingMealId(null)}>✕</button>
            </div>
            <div className="swap-list">
              {plans.filter(p => p.id !== swappingMealId).map(p => {
                const dayLabel = weekDays.find(d => d.date === p.date)?.label || p.date
                return (
                  <button
                    key={p.id}
                    className="swap-item"
                    onClick={() => { swapMeals(swappingMealId, p.id); setSwappingMealId(null) }}
                  >
                    <span>{dayLabel} - {MEAL_LABELS[p.meal]}</span>
                    <span className="swap-content">{p.content}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

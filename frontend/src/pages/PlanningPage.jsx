import { useState, useMemo } from 'react'
import { useShopping } from '../hooks/useShopping'
import { useMeals } from '../hooks/useMeals'
import { useWeekSettings } from '../hooks/useWeekSettings'
import { useFeatures } from '../hooks/FeaturesProvider.jsx'
import './PlanningPage.css'

const SHOP_CATEGORIES = [
  { value: 'fruits_legumes', label: '🥬 Fruits & Légumes' },
  { value: 'viandes', label: '🥩 Viandes & Poissons' },
  { value: 'epicerie', label: '🥫 Épicerie' },
  { value: 'laitages', label: '🧀 Laitages & Œufs' },
  { value: 'boulangerie', label: '🥖 Boulangerie' },
  { value: 'surgeles', label: '❄️ Surgelés' },
  { value: 'boissons', label: '🥤 Boissons' },
  { value: 'hygiene', label: '🧴 Hygiène' },
  { value: 'autre', label: '📦 Autre' },
]

const MEAL_LABELS = {
  lunch: 'Déjeuner',
  dinner: 'Dîner',
}

export default function PlanningPage() {
  const { items, loading: loadingShop, addItem, toggleItem, deleteItem } = useShopping()
  const { plans, loading: loadingMeals, setMeal, updateMeal, deleteMeal, toggleShoppingDone, swapMeals, MEALS } = useMeals()
  const { settings, loading: loadingSettings, getWeekDays, getPeriodLabel, goToPreviousWeek, goToNextWeek, goToCurrentWeek } = useWeekSettings()
  const { features } = useFeatures()
  const [activeTab, setActiveTab] = useState('meals')

  const [newItemName, setNewItemName] = useState('')
  const [newItemCategory, setNewItemCategory] = useState('autre')
  const [addingMeal, setAddingMeal] = useState(null) // { date, meal }
  const [mealContent, setMealContent] = useState('')
  const [mealNotes, setMealNotes] = useState('')
  const [swappingMealId, setSwappingMealId] = useState(null)

  // Utiliser les jours de semaine depuis les paramètres
  const weekDays = useMemo(() => {
    if (loadingSettings || !settings) return []
    return getWeekDays(9)
  }, [settings, getWeekDays, loadingSettings])

  const groupedItems = useMemo(() => {
    const byCat = {}
    SHOP_CATEGORIES.forEach(c => { byCat[c.value] = { label: c.label, items: [] } })
    items.forEach(item => {
      const cat = byCat[item.category] ? item.category : 'autre'
      byCat[cat].items.push(item)
    })
    return byCat
  }, [items])

  async function handleAddItem(e) {
    e.preventDefault()
    if (!newItemName.trim()) return
    const ok = await addItem({ name: newItemName.trim(), category: newItemCategory })
    if (ok) { setNewItemName(''); setNewItemCategory('autre') }
  }

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

  if (loadingShop || loadingMeals || loadingSettings) {
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
        <div className={`planning-tabs ${features.shopping_page_enabled ? 'single-tab' : ''}`}>
          <button className={activeTab === 'meals' ? 'active' : ''} onClick={() => setActiveTab('meals')}>
            Menus 🍽️
          </button>
          {!features.shopping_page_enabled && (
            <button className={activeTab === 'shopping' ? 'active' : ''} onClick={() => setActiveTab('shopping')}>
              Courses 🛒
            </button>
          )}
        </div>
      </header>

      {activeTab === 'meals' && (
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
      )}

      {activeTab === 'shopping' && (
        <div className="shopping-section">
          {/* Repas à prévoir */}
          {(() => {
            const pendingMeals = weekDays.flatMap(day =>
              MEALS.map(meal => {
                const m = getMeal(day.date, meal.value)
                return m && !m.shopping_done ? { ...m, dayLabel: day.label, isToday: day.isToday, mealLabel: meal.label } : null
              }).filter(Boolean)
            ).slice(0, 3)

            if (pendingMeals.length === 0) return null

            return (
              <div className="shop-meals-banner">
                <span>🍽️ À prévoir :</span>
                <div className="shop-meals-list">
                  {pendingMeals.map((m, i) => (
                    <span key={i} className={m.isToday ? 'today' : ''}>
                      {m.dayLabel} {m.mealLabel.toLowerCase()}: <strong>{m.content}</strong>
                    </span>
                  ))}
                </div>
              </div>
            )
          })()}

          {/* Formulaire d'ajout */}
          <form className="shop-form" onSubmit={handleAddItem}>
            <input
              value={newItemName}
              onChange={e => setNewItemName(e.target.value)}
              placeholder="Ajouter un article..."
            />
            <select value={newItemCategory} onChange={e => setNewItemCategory(e.target.value)}>
              {SHOP_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            <button type="submit" disabled={!newItemName.trim()}>Ajouter</button>
          </form>

          {/* Liste par catégorie */}
          <div className="shop-list">
            {SHOP_CATEGORIES.map(cat => {
              const { label, items } = groupedItems[cat.value]
              if (items.length === 0) return null
              return (
                <div key={cat.value} className="shop-cat">
                  <h4>{label}</h4>
                  <ul>
                    {items.map(item => (
                      <li key={item.id} className={item.checked ? 'checked' : ''}>
                        <label>
                          <input
                            type="checkbox"
                            checked={item.checked}
                            onChange={() => toggleItem(item.id, !item.checked)}
                          />
                          <span>{item.name}</span>
                        </label>
                        <button className="shop-delete-btn" onClick={() => deleteItem(item.id)}>✕</button>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Modal d'échange de repas */}
      {swappingMealId && (
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
        </div>
      )}
    </div>
  )
}

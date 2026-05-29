import { useState, useMemo } from 'react'
import { useCurrentUser } from '../hooks/useCurrentUser'
import { useShopping } from '../hooks/useShopping'
import { useMeals } from '../hooks/useMeals'
import './PlanningPage.css'

const SHOP_CATEGORIES = [
  { value: 'fruits_legumes', label: '🥬 Fruits & Légumes' },
  { value: 'viandes', label: '🥩 Viandes & Poissons' },
  { value: 'epicerie', label: '🥫 Épicerie' },
  { value: 'laitages', label: '🧀 Laitages & Œufs' },
  { value: 'boulangerie', label: '🥖 Boulangerie' },
  { value: 'boissons', label: '🥤 Boissons' },
  { value: 'hygiene', label: '🧴 Hygiène' },
  { value: 'autre', label: '📦 Autre' },
]

const MEAL_LABELS = {
  lunch: 'Déjeuner',
  dinner: 'Dîner',
}

export default function PlanningPage() {
  const { user } = useCurrentUser()
  const { items, loading: loadingShop, addItem, toggleItem, deleteItem } = useShopping(user.id)
  const { plans, loading: loadingMeals, setMeal, updateMeal, deleteMeal, toggleShoppingDone, swapMeals, MEALS } = useMeals()
  const [activeTab, setActiveTab] = useState('meals')

  const [newItemName, setNewItemName] = useState('')
  const [newItemCategory, setNewItemCategory] = useState('autre')
  const [addingMeal, setAddingMeal] = useState(null) // { date, meal }
  const [mealContent, setMealContent] = useState('')
  const [mealNotes, setMealNotes] = useState('')
  const [swappingMealId, setSwappingMealId] = useState(null)

  const weekDays = useMemo(() => {
    const days = []
    for (let i = 0; i < 9; i++) {
      const d = new Date()
      d.setDate(d.getDate() + i)
      days.push({
        date: d.toISOString().split('T')[0],
        label: d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' }),
        isToday: i === 0,
      })
    }
    return days
  }, [])

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
      await setMeal({ date, meal, content: mealContent.trim(), notes: mealNotes.trim() || undefined, created_by: user.id })
    }
    setAddingMeal(null)
    setMealContent('')
    setMealNotes('')
  }

  function getMeal(date, meal) {
    return plans.find(p => p.date === date && p.meal === meal)
  }

  if (loadingShop || loadingMeals) {
    return <div className="page-loading"><div className="spinner" /></div>
  }

  return (
    <div className="planning-page">
      <header className="planning-header">
        <h1>Planning</h1>
        <div className="planning-tabs">
          <button className={activeTab === 'meals' ? 'active' : ''} onClick={() => setActiveTab('meals')}>
            Menus 🍽️
          </button>
          <button className={activeTab === 'shopping' ? 'active' : ''} onClick={() => setActiveTab('shopping')}>
            Courses 🛒
          </button>
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
            const todayStr = new Date().toISOString().split('T')[0]
            const pendingMeals = weekDays.flatMap(day =>
              MEALS.map(meal => {
                const m = getMeal(day.date, meal.value)
                return m && !m.shopping_done ? { ...m, dayLabel: day.label, isToday: day.isToday, mealLabel: meal.label } : null
              }).filter(Boolean)
            )
            if (pendingMeals.length === 0) return null
            return (
              <div className="pending-meals">
                <h3 className="pending-meals-title">Repas à prévoir 🍽️</h3>
                <div className="pending-meals-list">
                  {pendingMeals.map(m => (
                    <div key={m.id} className={`pending-meal${m.isToday ? ' urgent' : ''}`}>
                      <div className="pending-meal-info">
                        <span className="pending-meal-day">{m.dayLabel} — {m.mealLabel}</span>
                        <span className="pending-meal-content">{m.content}</span>
                        {m.notes && <span className="pending-meal-notes">{m.notes}</span>}
                      </div>
                      {m.isToday && <span className="urgent-badge">Ce soir</span>}
                    </div>
                  ))}
                </div>
              </div>
            )
          })()}

          <form className="shop-add-form" onSubmit={handleAddItem}>
            <input
              type="text"
              placeholder="Ajouter un article..."
              value={newItemName}
              onChange={e => setNewItemName(e.target.value)}
              autoFocus
            />
            <select value={newItemCategory} onChange={e => setNewItemCategory(e.target.value)}>
              {SHOP_CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            <button type="submit" className="btn-primary-sm">+</button>
          </form>

          {Object.entries(groupedItems).map(([catKey, group]) => {
            if (group.items.length === 0) return null
            const allChecked = group.items.every(i => i.checked)
            return (
              <div key={catKey} className={`shop-category${allChecked ? ' all-checked' : ''}`}>
                <h3 className="shop-cat-title">{group.label}</h3>
                <div className="shop-items">
                  {group.items.map(item => (
                    <label key={item.id} className={`shop-item${item.checked ? ' checked' : ''}`}>
                      <input
                        type="checkbox"
                        checked={item.checked}
                        onChange={() => toggleItem(item.id, item.checked)}
                      />
                      <span className="shop-item-name">{item.name}</span>
                      <button
                        className="shop-item-delete"
                        onClick={(e) => { e.preventDefault(); deleteItem(item.id) }}
                        title="Supprimer"
                      >
                        ✕
                      </button>
                    </label>
                  ))}
                </div>
              </div>
            )
          })}

          {items.length === 0 && (
            <div className="empty-state">
              <span>🛒</span>
              <p>La liste de courses est vide</p>
            </div>
          )}
        </div>
      )}

      {/* Swap modal */}
      {swappingMealId && (
        <div className="swap-modal-overlay" onClick={e => e.target === e.currentTarget && setSwappingMealId(null)}>
          <div className="swap-modal">
            <div className="swap-modal-header">
              <h3>Échanger avec...</h3>
              <button onClick={() => setSwappingMealId(null)}>✕</button>
            </div>
            <div className="swap-modal-list">
              {plans
                .filter(p => p.id !== swappingMealId && p.content)
                .sort((a, b) => a.date.localeCompare(b.date) || a.meal.localeCompare(b.meal))
                .map(p => {
                  const day = weekDays.find(d => d.date === p.date)
                  const mealLabel = MEALS.find(m => m.value === p.meal)?.label || p.meal
                  return (
                    <button
                      key={p.id}
                      className="swap-option"
                      onClick={() => {
                        swapMeals(swappingMealId, p.id)
                        setSwappingMealId(null)
                      }}
                    >
                      <span className="swap-day">{day?.label || p.date} — {mealLabel}</span>
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

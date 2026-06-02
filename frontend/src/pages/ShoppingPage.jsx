import { useState, useMemo } from 'react'
import { useShopping } from '../hooks/useShopping'
import FoodAutocomplete from '../components/FoodAutocomplete'
import './ShoppingPage.css'

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

const QUANTITY_UNITS = [
  { value: 'unit', label: 'unité' },
  { value: 'g', label: 'g' },
  { value: 'kg', label: 'kg' },
  { value: 'ml', label: 'ml' },
  { value: 'cl', label: 'cl' },
  { value: 'l', label: 'L' },
  { value: 'pc', label: 'pc' },
  { value: 'bouteille', label: 'bouteille' },
  { value: 'boite', label: 'boîte' },
  { value: 'paquet', label: 'paquet' },
]

export default function ShoppingPage() {
  const { items, loading, addItem, toggleItem, deleteItem, updateItem } = useShopping()
  const [storeMode, setStoreMode] = useState(false)
  const [newItemName, setNewItemName] = useState('')
  const [newItemCategory, setNewItemCategory] = useState('autre')
  const [newItemQty, setNewItemQty] = useState('')
  const [newItemUnit, setNewItemUnit] = useState('unit')
  const [editingItem, setEditingItem] = useState(null)

  const groupedItems = useMemo(() => {
    const byCat = {}
    SHOP_CATEGORIES.forEach(c => { byCat[c.value] = { label: c.label, items: [] } })
    items.forEach(item => {
      const cat = byCat[item.category] ? item.category : 'autre'
      byCat[cat].items.push(item)
    })
    return byCat
  }, [items])

  const uncheckedCount = items.filter(i => !i.checked).length
  const checkedCount = items.filter(i => i.checked).length
  const totalCount = items.length
  const progressPercent = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0

  async function handleAdd(e) {
    e.preventDefault()
    if (!newItemName.trim()) return
    
    await addItem({
      name: newItemName,
      category: newItemCategory,
      quantity_number: newItemQty ? parseFloat(newItemQty) : null,
      quantity_unit: newItemQty ? newItemUnit : 'unit',
    })
    
    setNewItemName('')
    setNewItemQty('')
    setNewItemUnit('unit')
  }

  function formatQuantity(item) {
    if (!item.quantity_number) return ''
    const unitLabel = QUANTITY_UNITS.find(u => u.value === item.quantity_unit)?.label || item.quantity_unit
    return `${item.quantity_number} ${unitLabel}`
  }

  if (loading) {
    return <div className="page-loading"><div className="spinner" /></div>
  }

  return (
    <div className={`shopping-page ${storeMode ? 'store-mode' : ''}`}>
      <header className="shopping-header">
        <div>
          {storeMode ? (
            <div className="store-counter">
              <span className="store-counter-number">{uncheckedCount}</span>
              <span className="store-counter-label">article{uncheckedCount > 1 ? 's' : ''} restant{uncheckedCount > 1 ? 's' : ''}</span>
            </div>
          ) : (
            <>
              <p className="shopping-subtitle">{uncheckedCount} article{uncheckedCount > 1 ? 's' : ''} à acheter</p>
              <h1>Courses 🛒</h1>
            </>
          )}
        </div>
        {/* FAB avec anneau de progression */}
        <button 
          className={`store-mode-fab ${storeMode ? 'active' : ''}`}
          onClick={() => setStoreMode(!storeMode)}
          title={storeMode ? 'Mode normal' : 'Mode magasin'}
        >
          <svg className="fab-progress-ring" viewBox="0 0 56 56">
            <circle
              className="fab-progress-bg"
              cx="28"
              cy="28"
              r="24"
            />
            <circle
              className="fab-progress-fill"
              cx="28"
              cy="28"
              r="24"
              strokeDasharray={`${2 * Math.PI * 24}`}
              strokeDashoffset={`${2 * Math.PI * 24 * (1 - progressPercent / 100)}`}
            />
          </svg>
          <span className="fab-icon">{storeMode ? '🏪' : '🛍️'}</span>
          <span className="fab-count">{uncheckedCount}</span>
        </button>
      </header>

      {/* Liste des courses */}
      <div className="shopping-content">
        {items.length === 0 ? (
          <div className="empty-state">
            <span>🛒</span>
            <p>Liste vide</p>
            <p className="empty-hint">Ajoute des articles ci-dessous</p>
          </div>
        ) : (
          <div className="shopping-categories">
            {SHOP_CATEGORIES.map(cat => {
              const { items: catItems } = groupedItems[cat.value]
              const visibleItems = storeMode 
                ? catItems.filter(i => !i.checked)
                : catItems
              
              if (visibleItems.length === 0) return null
              
              return (
                <div key={cat.value} className="shop-category">
                  <h3 className="shop-cat-title">{cat.label}</h3>
                  <ul className="shop-items">
                    {visibleItems.map(item => (
                      <li 
                        key={item.id} 
                        className={`shop-item ${item.checked ? 'checked' : ''} ${editingItem?.id === item.id ? 'editing' : ''}`}
                      >
                        {editingItem?.id === item.id ? (
                          <div className="shop-item-edit">
                            <input
                              value={editingItem.name}
                              onChange={e => setEditingItem({ ...editingItem, name: e.target.value })}
                              onBlur={async () => {
                                await updateItem(item.id, { 
                                  name: editingItem.name,
                                  quantity_number: editingItem.quantity_number,
                                  quantity_unit: editingItem.quantity_unit,
                                })
                                setEditingItem(null)
                              }}
                              onKeyDown={e => {
                                if (e.key === 'Enter') {
                                  updateItem(item.id, { 
                                    name: editingItem.name,
                                    quantity_number: editingItem.quantity_number,
                                    quantity_unit: editingItem.quantity_unit,
                                  })
                                  setEditingItem(null)
                                }
                              }}
                              autoFocus
                            />
                            <div className="qty-edit-row">
                              <input
                                type="number"
                                value={editingItem.quantity_number || ''}
                                onChange={e => setEditingItem({ ...editingItem, quantity_number: e.target.value ? parseFloat(e.target.value) : null })}
                                placeholder="Qté"
                                className="qty-input-small"
                              />
                              <select
                                value={editingItem.quantity_unit || 'unit'}
                                onChange={e => setEditingItem({ ...editingItem, quantity_unit: e.target.value })}
                              >
                                {QUANTITY_UNITS.map(u => (
                                  <option key={u.value} value={u.value}>{u.label}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div 
                              className="shop-item-content"
                              onClick={() => !editingItem && toggleItem(item.id, item.checked)}
                            >
                              <span className={`shop-checkbox ${item.checked ? 'checked' : ''}`}></span>
                              <span className="shop-item-name">{item.name}</span>
                              {item.quantity_number && (
                                <span className="shop-item-qty">{formatQuantity(item)}</span>
                              )}
                            </div>
                            <div className="shop-item-actions">
                              <button 
                                className="shop-edit-btn"
                                onClick={() => setEditingItem(item)}
                              >
                                ✎
                              </button>
                              <button 
                                className="shop-delete-btn"
                                onClick={() => deleteItem(item.id)}
                              >
                                ✕
                              </button>
                            </div>
                          </>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>
        )}

        {/* Articles cochés (affichés seulement hors mode magasin) */}
        {!storeMode && checkedCount > 0 && (
          <div className="shop-checked-section">
            <button 
              className="shop-toggle-checked"
              onClick={() => {/* TODO: toggle visibility */}}
            >
              {checkedCount} article{checkedCount > 1 ? 's' : ''} coché{checkedCount > 1 ? 's' : ''}
            </button>
          </div>
        )}
      </div>

      {/* Barre d'ajout fixe en bas */}
      <form className="shopping-add-bar" onSubmit={handleAdd}>
        <div className="add-bar-row add-bar-row-search">
          <FoodAutocomplete
            value={newItemName}
            onChange={setNewItemName}
            onSelect={(food) => {
              setNewItemName(food.name)
              setNewItemCategory(food.category)
            }}
            placeholder="Chercher un aliment..."
            className="shop-autocomplete"
          />
          <button 
            type="submit" 
            className="shop-add-btn"
            disabled={!newItemName.trim()}
            aria-label="Ajouter"
          >
            +
          </button>
        </div>
        <div className="add-bar-row add-bar-row-options">
          <input
            type="number"
            value={newItemQty}
            onChange={e => setNewItemQty(e.target.value)}
            placeholder="Qté"
            className="shop-qty-input"
            step="0.1"
            min="0"
          />
          <select
            value={newItemUnit}
            onChange={e => setNewItemUnit(e.target.value)}
            className="shop-unit-select"
          >
            {QUANTITY_UNITS.map(u => (
              <option key={u.value} value={u.value}>{u.label}</option>
            ))}
          </select>
          <select
            value={newItemCategory}
            onChange={e => setNewItemCategory(e.target.value)}
            className="shop-cat-select"
          >
            {SHOP_CATEGORIES.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
      </form>
    </div>
  )
}

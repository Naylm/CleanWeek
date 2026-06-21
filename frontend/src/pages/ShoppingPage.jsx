import { useState, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useShopping } from '../hooks/useShopping'
import { useShopCategories } from '../hooks/useShopCategories'
import FoodAutocomplete from '../components/FoodAutocomplete'
import './ShoppingPage.css'

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
  const { categories: shopCategories } = useShopCategories()
  const [storeMode, setStoreMode] = useState(false)
  const [newItemName, setNewItemName] = useState('')
  const [newItemCategory, setNewItemCategory] = useState('autre')
  const [newItemQty, setNewItemQty] = useState('')
  const [newItemUnit, setNewItemUnit] = useState('unit')
  const [editingItem, setEditingItem] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)

  const categoryMap = useMemo(() => {
    const map = {}
    shopCategories.forEach(c => { map[c.value] = c })
    return map
  }, [shopCategories])

  const groupedItems = useMemo(() => {
    const byCat = {}
    shopCategories.forEach(c => { byCat[c.value] = { label: `${c.emoji} ${c.label}`, items: [] } })
    if (!byCat['autre']) byCat['autre'] = { label: '📦 Autre', items: [] }
    items.forEach(item => {
      const cat = byCat[item.category] ? item.category : 'autre'
      byCat[cat].items.push(item)
    })
    return byCat
  }, [items, shopCategories])

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
    setShowAddModal(false)
  }

  async function handleSaveEdit(id) {
    if (!editingItem) return
    await updateItem(id, {
      name: editingItem.name,
      quantity_number: editingItem.quantity_number,
      quantity_unit: editingItem.quantity_unit,
    })
    setEditingItem(null)
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
            {shopCategories.map(cat => {
              const { items: catItems } = groupedItems[cat.value]
              const visibleItems = storeMode 
                ? catItems.filter(i => !i.checked)
                : catItems
              
              if (visibleItems.length === 0) return null
              
              return (
                <div key={cat.value} className="shop-category">
                  <h3 className="shop-cat-title">{cat.emoji} {cat.label}</h3>
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
                              onKeyDown={e => {
                                if (e.key === 'Enter') {
                                  handleSaveEdit(item.id)
                                } else if (e.key === 'Escape') {
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
                              <button
                                type="button"
                                className="shop-edit-save"
                                onClick={() => handleSaveEdit(item.id)}
                                title="Enregistrer"
                              >
                                ✓
                              </button>
                              <button
                                type="button"
                                className="shop-edit-cancel"
                                onClick={() => setEditingItem(null)}
                                title="Annuler"
                              >
                                ✕
                              </button>
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

      {/* Bouton + flottant */}
      {!storeMode && (
        <button
          className="add-item-fab"
          onClick={() => setShowAddModal(true)}
          aria-label="Ajouter un article"
        >
          +
        </button>
      )}

      {/* Modal d'ajout */}
      {showAddModal && createPortal(
        <div className="shop-modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="shop-modal" onClick={e => e.stopPropagation()}>
            <div className="shop-modal-header">
              <h3>Ajouter un article</h3>
              <button className="shop-modal-close" onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            <form className="shop-modal-form" onSubmit={handleAdd}>
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
              <div className="shop-modal-row">
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
                  {shopCategories.map(c => (
                    <option key={c.value} value={c.value}>{c.emoji} {c.label}</option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                className="shop-modal-submit"
                disabled={!newItemName.trim()}
              >
                Ajouter
              </button>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

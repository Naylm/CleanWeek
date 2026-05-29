import { useState } from 'react'
import { CATEGORIES, FREQUENCIES } from '../lib/taskUtils'
import './AddTaskModal.css'

export default function AddTaskModal({ onAdd, onClose }) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState('autre')
  const [frequency, setFrequency] = useState('weekly')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    await onAdd({
      name: name.trim(),
      category,
      frequency,
    })
    setLoading(false)
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2>Nouvelle tâche</h2>
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
            <div className="icon-grid">
              {CATEGORIES.map(cat => (
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
          </div>

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

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Annuler</button>
            <button type="submit" className="btn-primary" disabled={loading || !name.trim()}>
              {loading ? <span className="btn-spinner" /> : 'Créer la tâche'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

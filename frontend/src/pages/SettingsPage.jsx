import { useState } from 'react'
import { useCurrentUser } from '../hooks/useCurrentUser'
import { useWeekSettings } from '../hooks/useWeekSettings'
import { useFeatures } from '../hooks/FeaturesProvider.jsx'
import { useReminders } from '../hooks/useReminders'
import { useShopCategories } from '../hooks/useShopCategories'
import { useTaskCategories } from '../hooks/useTaskCategories'
import { DAYS_OF_WEEK } from '../lib/taskUtils'
import EmojiPicker from '../components/EmojiPicker'
import './SettingsPage.css'

const THEMES = [
  { key: 'rose', label: 'Rose', color: '#FF9E97', preview: '🌸' },
  { key: 'bleu', label: 'Bleu', color: '#6FA8FF', preview: '🦋' },
  { key: 'vert', label: 'Vert', color: '#5BBF97', preview: '🌿' },
  { key: 'jaune', label: 'Jaune', color: '#F2C14E', preview: '🌻' },
  { key: 'lavande', label: 'Lavande', color: '#B398FF', preview: '💜' },
]

const FEATURES_LIST = [
  {
    key: 'offline_mode_enabled',
    label: 'Mode hors ligne',
    description: 'Fonctionne sans connexion, synchro différée',
    icon: '📡',
  },
  {
    key: 'reminders_enabled',
    label: 'Rappels programmés',
    description: 'Notifications à heures fixes',
    icon: '⏰',
  },
]

const DAYS_SHORT = ['D', 'L', 'M', 'M', 'J', 'V', 'S']

function toCategoryValue(label) {
  return label
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

export default function SettingsPage() {
  const { theme, setTheme } = useCurrentUser()
  const { settings, loading, setStartDayOfWeek, goToCurrentWeek } = useWeekSettings()
  const { features, loading: featuresLoading, toggleFeature } = useFeatures()
  const { slots, loading: remindersLoading, addSlot, updateSlot, deleteSlot } = useReminders()
  const { categories: shopCategories, addCategory, updateCategory, deleteCategory } = useShopCategories()
  const { categories: taskCategories, addCategory: addTaskCategory, updateCategory: updateTaskCategory, deleteCategory: deleteTaskCategory } = useTaskCategories()

  const [addingReminder, setAddingReminder] = useState(false)
  const [newReminder, setNewReminder] = useState({
    label: '',
    time: '09:00',
    days_of_week: [0, 1, 2, 3, 4, 5, 6],
    message_template: 'Il reste {remaining} tâches',
  })

  const [editingCat, setEditingCat] = useState(null)
  const [newCatLabel, setNewCatLabel] = useState('')
  const [newCatEmoji, setNewCatEmoji] = useState('📦')

  const [editingTaskCat, setEditingTaskCat] = useState(null)
  const [newTaskCatLabel, setNewTaskCatLabel] = useState('')
  const [newTaskCatIcon, setNewTaskCatIcon] = useState('🏠')

  const startDay = settings?.start_day_of_week ?? 5

  async function handleAddReminder(e) {
    e.preventDefault()
    if (!newReminder.label.trim()) return
    
    const success = await addSlot(newReminder)
    if (success) {
      setAddingReminder(false)
      setNewReminder({
        label: '',
        time: '09:00',
        days_of_week: [0, 1, 2, 3, 4, 5, 6],
        message_template: 'Il reste {remaining} tâches',
      })
    }
  }

  function toggleDay(slotId, currentDays, dayIndex) {
    const newDays = currentDays.includes(dayIndex)
      ? currentDays.filter(d => d !== dayIndex)
      : [...currentDays, dayIndex].sort()
    updateSlot(slotId, { days_of_week: newDays })
  }

  return (
    <div className="settings-page">
      <header className="settings-header">
        <div>
          <p className="settings-subtitle">Personnalise ton CleanWeek</p>
          <h1>Réglages</h1>
        </div>
        <div className="settings-mascot">🧺</div>
      </header>

      <div className="settings-card">
        <h2 className="settings-section-title">Semaine</h2>
        <p className="settings-hint">Choisis le jour de début de ta semaine</p>
        <div className="settings-days">
          {loading ? (
            <span>Chargement...</span>
          ) : (
            DAYS_OF_WEEK.map(day => (
              <button
                key={day.value}
                className={`settings-day-btn${startDay === day.value ? ' active' : ''}`}
                onClick={() => setStartDayOfWeek(day.value)}
              >
                {day.short}
              </button>
            ))
          )}
        </div>
        <button className="settings-current-week" onClick={goToCurrentWeek}>
          Retour à la semaine en cours
        </button>
      </div>

      <div className="settings-card">
        <h2 className="settings-section-title">Thème</h2>
        <div className="settings-themes">
          {THEMES.map(t => (
            <button
              key={t.key}
              className={`settings-theme-btn${theme === t.key ? ' active' : ''}`}
              onClick={() => setTheme(t.key)}
              style={{ '--theme-color': t.color }}
            >
              <span className="theme-preview" style={{ background: t.color }}>{t.preview}</span>
              <span className="theme-label">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Fonctionnalités activables */}
      <div className="settings-card">
        <h2 className="settings-section-title">Fonctionnalités</h2>
        {featuresLoading ? (
          <span>Chargement...</span>
        ) : (
          <div className="features-list">
            {FEATURES_LIST.map(feature => (
              <div key={feature.key} className="feature-toggle">
                <div className="feature-info">
                  <span className="feature-icon">{feature.icon}</span>
                  <div className="feature-text">
                    <span className="feature-label">{feature.label}</span>
                    <span className="feature-desc">{feature.description}</span>
                  </div>
                </div>
                <button
                  className={`toggle-switch ${features[feature.key] ? 'on' : 'off'}`}
                  onClick={() => toggleFeature(feature.key)}
                >
                  <span className="toggle-knob" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Catégories de courses */}
      <div className="settings-card">
        <div className="settings-section-header">
          <h2 className="settings-section-title">Catégories de courses</h2>
        </div>
        <ul className="shop-cat-list">
          {shopCategories.map(cat => (
            <li key={cat.id} className="shop-cat-row">
              {editingCat?.id === cat.id ? (
                <>
                  <EmojiPicker
                    value={editingCat.emoji}
                    onChange={emoji => setEditingCat({ ...editingCat, emoji })}
                  />
                  <input
                    value={editingCat.label}
                    onChange={e => setEditingCat({ ...editingCat, label: e.target.value })}
                    className="shop-cat-label-input"
                  />
                  <input
                    type="number"
                    value={editingCat.sort_order ?? 0}
                    onChange={e => setEditingCat({ ...editingCat, sort_order: parseInt(e.target.value) || 0 })}
                    className="shop-cat-order-input"
                  />
                  <button
                    type="button"
                    className="shop-edit-save"
                    onClick={() => {
                      updateCategory(cat.id, {
                        label: editingCat.label,
                        emoji: editingCat.emoji,
                        sort_order: editingCat.sort_order,
                      })
                      setEditingCat(null)
                    }}
                  >
                    ✓
                  </button>
                  <button
                    type="button"
                    className="shop-edit-cancel"
                    onClick={() => setEditingCat(null)}
                  >
                    ✕
                  </button>
                </>
              ) : (
                <>
                  <span className="shop-cat-emoji">{cat.emoji}</span>
                  <span className="shop-cat-name">{cat.label}</span>
                  <button
                    type="button"
                    className="shop-edit-btn"
                    onClick={() => setEditingCat(cat)}
                  >
                    ✎
                  </button>
                  <button
                    type="button"
                    className="shop-delete-btn"
                    onClick={() => deleteCategory(cat.id)}
                  >
                    ✕
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
        <div className="shop-cat-add-row">
          <EmojiPicker
            value={newCatEmoji}
            onChange={setNewCatEmoji}
          />
          <input
            value={newCatLabel}
            onChange={e => setNewCatLabel(e.target.value)}
            placeholder="Nom de la catégorie"
            className="shop-cat-label-input"
          />
          <button
            type="button"
            className="shop-add-btn-small"
            disabled={!toCategoryValue(newCatLabel)}
            onClick={async () => {
              await addCategory({
                value: toCategoryValue(newCatLabel),
                label: newCatLabel,
                emoji: newCatEmoji,
              })
              setNewCatLabel('')
              setNewCatEmoji('📦')
            }}
          >
            +
          </button>
        </div>
      </div>

      {/* Catégories de tâches (Pièces) */}
      <div className="settings-card">
        <div className="settings-section-header">
          <h2 className="settings-section-title">Pièces de la maison</h2>
        </div>
        <ul className="shop-cat-list">
          {taskCategories.map(cat => (
            <li key={cat.id} className="shop-cat-row">
              {editingTaskCat?.id === cat.id ? (
                <>
                  <EmojiPicker
                    value={editingTaskCat.icon}
                    onChange={icon => setEditingTaskCat({ ...editingTaskCat, icon })}
                  />
                  <input
                    value={editingTaskCat.label}
                    onChange={e => setEditingTaskCat({ ...editingTaskCat, label: e.target.value })}
                    className="shop-cat-label-input"
                  />
                  <input
                    type="number"
                    value={editingTaskCat.sort_order ?? 0}
                    onChange={e => setEditingTaskCat({ ...editingTaskCat, sort_order: parseInt(e.target.value) || 0 })}
                    className="shop-cat-order-input"
                  />
                  <button
                    type="button"
                    className="shop-edit-save"
                    onClick={() => {
                      updateTaskCategory(cat.id, {
                        label: editingTaskCat.label,
                        icon: editingTaskCat.icon,
                        sort_order: editingTaskCat.sort_order,
                      })
                      setEditingTaskCat(null)
                    }}
                  >
                    ✓
                  </button>
                  <button
                    type="button"
                    className="shop-edit-cancel"
                    onClick={() => setEditingTaskCat(null)}
                  >
                    ✕
                  </button>
                </>
              ) : (
                <>
                  <span className="shop-cat-emoji">{cat.icon}</span>
                  <span className="shop-cat-name">{cat.label}</span>
                  <button
                    type="button"
                    className="shop-edit-btn"
                    onClick={() => setEditingTaskCat(cat)}
                  >
                    ✎
                  </button>
                  <button
                    type="button"
                    className="shop-delete-btn"
                    onClick={() => deleteTaskCategory(cat.id)}
                  >
                    ✕
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
        <div className="shop-cat-add-row">
          <EmojiPicker
            value={newTaskCatIcon}
            onChange={setNewTaskCatIcon}
          />
          <input
            value={newTaskCatLabel}
            onChange={e => setNewTaskCatLabel(e.target.value)}
            placeholder="Nom de la pièce (ex: Bureau)"
            className="shop-cat-label-input"
          />
          <button
            type="button"
            className="shop-add-btn-small"
            disabled={!toCategoryValue(newTaskCatLabel)}
            onClick={async () => {
              await addTaskCategory({
                value: toCategoryValue(newTaskCatLabel),
                label: newTaskCatLabel,
                icon: newTaskCatIcon,
              })
              setNewTaskCatLabel('')
              setNewTaskCatIcon('🏠')
            }}
          >
            +
          </button>
        </div>
      </div>

      {/* Rappels programmés */}
      {features.reminders_enabled && (
        <div className="settings-card">
          <div className="settings-section-header">
            <h2 className="settings-section-title">Rappels programmés</h2>
            <button 
              className="btn-add-small"
              onClick={() => setAddingReminder(true)}
            >
              + Ajouter
            </button>
          </div>
          
          {remindersLoading ? (
            <span>Chargement...</span>
          ) : (
            <div className="reminders-list">
              {slots.map(slot => (
                <div key={slot.id} className={`reminder-slot ${!slot.enabled ? 'disabled' : ''}`}>
                  <div className="reminder-header">
                    <div className="reminder-time">{slot.time}</div>
                    <div className="reminder-label">{slot.label}</div>
                    <div className="reminder-actions">
                      <button
                        className={`toggle-switch small ${slot.enabled ? 'on' : 'off'}`}
                        onClick={() => updateSlot(slot.id, { enabled: !slot.enabled })}
                      >
                        <span className="toggle-knob" />
                      </button>
                      <button 
                        className="reminder-delete"
                        onClick={() => deleteSlot(slot.id)}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                  <div className="reminder-days">
                    {DAYS_SHORT.map((day, idx) => (
                      <button
                        key={idx}
                        className={`day-btn ${slot.days_of_week?.includes(idx) ? 'active' : ''}`}
                        onClick={() => toggleDay(slot.id, slot.days_of_week || [], idx)}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                  <div className="reminder-message">{slot.message_template}</div>
                </div>
              ))}
              
              {slots.length === 0 && !addingReminder && (
                <p className="empty-hint">Aucun rappel configuré</p>
              )}
            </div>
          )}
          
          {/* Formulaire d'ajout */}
          {addingReminder && (
            <form className="reminder-form" onSubmit={handleAddReminder}>
              <div className="reminder-form-row">
                <input
                  type="text"
                  value={newReminder.label}
                  onChange={e => setNewReminder({ ...newReminder, label: e.target.value })}
                  placeholder="Nom du rappel (ex: Matin)"
                  className="reminder-input"
                />
                <input
                  type="time"
                  value={newReminder.time}
                  onChange={e => setNewReminder({ ...newReminder, time: e.target.value })}
                  className="reminder-time-input"
                />
              </div>
              <div className="reminder-days-selector">
                {DAYS_SHORT.map((day, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`day-btn ${newReminder.days_of_week.includes(idx) ? 'active' : ''}`}
                    onClick={() => {
                      const newDays = newReminder.days_of_week.includes(idx)
                        ? newReminder.days_of_week.filter(d => d !== idx)
                        : [...newReminder.days_of_week, idx].sort()
                      setNewReminder({ ...newReminder, days_of_week: newDays })
                    }}
                  >
                    {day}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={newReminder.message_template}
                onChange={e => setNewReminder({ ...newReminder, message_template: e.target.value })}
                placeholder="Message ({count} tâches, {remaining} restantes)"
                className="reminder-input"
              />
              <div className="reminder-form-actions">
                <button type="button" onClick={() => setAddingReminder(false)}>Annuler</button>
                <button type="submit" className="btn-primary">Ajouter</button>
              </div>
            </form>
          )}
        </div>
      )}

      <div className="settings-card settings-about">
        <span className="settings-about-emoji">🏠</span>
        <div>
          <p className="settings-about-title">CleanWeek</p>
          <p className="settings-text">La maison ensemble, tout en douceur. Données partagées entre tous les appareils.</p>
        </div>
      </div>
    </div>
  )
}

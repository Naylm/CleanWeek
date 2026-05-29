import { useMemo, useState } from 'react'
import { getCategoryIcon, formatNextDue, isTaskDueToday } from '../lib/taskUtils'
import './TaskCard.css'

const REACTION_EMOJIS = ['🔥', '👏', '❤️', '💪', '🙏']

export default function TaskCard({ task, userId, allProfiles, onComplete, onUncomplete, onReact, onUnreact, upcoming = false }) {
  const todayStr = new Date().toISOString().split('T')[0]

  const todayCompletion = useMemo(() => {
    return task.completions?.find(c => c.completed_at === todayStr) || null
  }, [task.completions, todayStr])

  const isDone = !!todayCompletion
  const assignedProfile = allProfiles.find(p => p.id === task.assigned_to)
  const doneByMe = todayCompletion?.completed_by === userId

  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

  async function handleToggle() {
    if (isDone) {
      await onUncomplete(todayCompletion.id)
    } else {
      await onComplete(task.id)
    }
  }

  async function handleReact(emoji) {
    setShowEmojiPicker(false)
    if (todayCompletion) await onReact?.(todayCompletion.id, emoji)
  }

  async function handleUnreact() {
    if (todayCompletion) await onUnreact?.(todayCompletion.id)
  }

  const myReaction = todayCompletion?.reactions?.find(r => r.user_id === userId)

  return (
    <div className={`task-card${isDone ? ' done' : ''}${upcoming ? ' upcoming' : ''}`}>
      <button
        className={`task-check${isDone ? ' checked' : ''}`}
        onClick={handleToggle}
        aria-label={isDone ? 'Marquer non fait' : 'Marquer fait'}
        disabled={upcoming}
      >
        {isDone && <CheckIcon />}
      </button>

      <div className="task-info">
        <div className="task-name-row">
          <span className="task-category-icon">{getCategoryIcon(task.category)}</span>
          <span className={`task-name${isDone ? ' task-name-done' : ''}`}>{task.name}</span>
        </div>
        <div className="task-meta">
          {upcoming ? (
            <span className="task-due">{formatNextDue(task)}</span>
          ) : (
            <span className={`task-freq ${task.frequency}`}>{getFreqLabel(task.frequency)}</span>
          )}
          {assignedProfile && (
            <span className="task-assignee" style={{ color: assignedProfile.avatar_color }}>
              {assignedProfile.display_name}
            </span>
          )}
        </div>
      </div>

      {isDone && todayCompletion?.display_name && (
        <div className="task-done-section">
          <div
            className="task-done-avatar"
            style={{ background: todayCompletion.avatar_color || '#6C63FF' }}
            title={todayCompletion.display_name}
          >
            {todayCompletion.display_name?.slice(0, 1)?.toUpperCase()}
          </div>

          {!doneByMe && (
            <div className="task-reactions">
              {todayCompletion.reactions?.map(r => (
                <span key={r.id} className="task-reaction" title={r.display_name}>
                  {r.emoji}
                </span>
              ))}
              {myReaction ? (
                <button className="reaction-btn active" onClick={handleUnreact} title="Retirer">
                  {myReaction.emoji}
                </button>
              ) : (
                <div className="reaction-picker-wrap">
                  <button className="reaction-btn" onClick={() => setShowEmojiPicker(v => !v)} title="Réagir">
                    +
                  </button>
                  {showEmojiPicker && (
                    <div className="emoji-picker">
                      {REACTION_EMOJIS.map(emoji => (
                        <button key={emoji} onClick={() => handleReact(emoji)}>
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function getFreqLabel(f) {
  const map = { daily: 'Quotidien', weekly: 'Hebdo', biweekly: '2 semaines', monthly: 'Mensuel' }
  return map[f] || f
}

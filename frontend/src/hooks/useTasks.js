import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'

// Données de démonstration pour le mode hors ligne
const DEMO_TASKS = [
  {
    id: 'demo-1',
    title: 'Faire la vaisselle',
    description: 'Laver la vaisselle du repas',
    frequency: 'daily',
    assigned_to: 'both',
    created_at: new Date().toISOString(),
    completions: []
  },
  {
    id: 'demo-2', 
    title: 'Passer l\'aspirateur',
    description: 'Aspirer le salon et les chambres',
    frequency: 'weekly',
    assigned_to: 'both',
    created_at: new Date().toISOString(),
    completions: []
  },
  {
    id: 'demo-3',
    title: 'Sortir les poubelles',
    description: 'Vider les poubelles de la cuisine',
    frequency: 'daily',
    assigned_to: 'both',
    created_at: new Date().toISOString(),
    completions: []
  }
]

// Helper pour timeout rapide sur les requêtes
function withTimeout(promise, ms = 800) {
  return Promise.race([
    promise,
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), ms)
    )
  ])
}

export function useTasks(userId) {
  const [tasks, setTasks] = useState(DEMO_TASKS) // Chargement immédiat des données démo
  const [loading, setLoading] = useState(false) // Pas de loading initial
  const [isOffline, setIsOffline] = useState(true) // Par défaut offline pour éviter les attentes
  const hasCheckedRef = useRef(false) // Pour éviter les doubles appels

  const fetchTasks = useCallback(async () => {
    if (hasCheckedRef.current) return
    hasCheckedRef.current = true

    try {
      const { data, error } = await withTimeout(
        supabase
          .from('tasks')
          .select(`
            *,
            completions (
              id,
              completed_by,
              completed_at,
              profiles (display_name, avatar_color)
            )
          `)
          .order('created_at', { ascending: true }),
        800
      )

      if (!error && data) {
        setTasks(data)
        setIsOffline(false)
      } else {
        throw new Error(error?.message || 'Erreur')
      }
    } catch (error) {
      // Garde les données démo déjà chargées
      setIsOffline(true)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    // Différer la vérification après le premier rendu pour affichage instantané
    const timer = setTimeout(() => {
      fetchTasks()
    }, 0)

    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function completeTask(taskId) {
    if (isOffline) {
      // Mode dégradé : simulation locale
      setTasks(prev => prev.map(task => 
        task.id === taskId 
          ? {
              ...task,
              completions: [...(task.completions || []), {
                id: `demo-${Date.now()}`,
                completed_by: userId,
                completed_at: new Date().toISOString().split('T')[0],
                profiles: { display_name: 'Utilisateur', avatar_color: '#6C63FF' }
              }]
            }
          : task
      ))
      return true
    }

    try {
      const today = new Date().toISOString().split('T')[0]
      const { error } = await supabase.from('completions').insert({
        task_id: taskId,
        completed_by: userId,
        completed_at: today,
      })
      if (!error) fetchTasks()
      return !error
    } catch (error) {
      console.log('🔍 DEBUG: Erreur lors de la complétion de tâche:', error)
      return false
    }
  }

  async function uncompleteTask(completionId) {
    if (isOffline) {
      // Mode dégradé : simulation locale
      setTasks(prev => prev.map(task => ({
        ...task,
        completions: (task.completions || []).filter(c => c.id !== completionId)
      })))
      return true
    }

    try {
      const { error } = await supabase.from('completions').delete().eq('id', completionId)
      if (!error) fetchTasks()
      return !error
    } catch (error) {
      console.log('🔍 DEBUG: Erreur lors de l\'annulation de tâche:', error)
      return false
    }
  }

  async function addTask(task) {
    if (isOffline) {
      // Mode dégradé : simulation locale
      const newTask = {
        ...task,
        id: `demo-${Date.now()}`,
        created_at: new Date().toISOString(),
        completions: []
      }
      setTasks(prev => [...prev, newTask])
      return true
    }

    try {
      const { error } = await supabase.from('tasks').insert(task)
      if (!error) fetchTasks()
      return !error
    } catch (error) {
      console.log('🔍 DEBUG: Erreur lors de l\'ajout de tâche:', error)
      return false
    }
  }

  async function updateTask(id, updates) {
    if (isOffline) {
      // Mode dégradé : simulation locale
      setTasks(prev => prev.map(task => 
        task.id === id ? { ...task, ...updates } : task
      ))
      return true
    }

    try {
      const { error } = await supabase.from('tasks').update(updates).eq('id', id)
      if (!error) fetchTasks()
      return !error
    } catch (error) {
      console.log('🔍 DEBUG: Erreur lors de la mise à jour de tâche:', error)
      return false
    }
  }

  async function deleteTask(id) {
    if (isOffline) {
      // Mode dégradé : simulation locale
      setTasks(prev => prev.filter(task => task.id !== id))
      return true
    }

    try {
      const { error } = await supabase.from('tasks').delete().eq('id', id)
      if (!error) fetchTasks()
      return !error
    } catch (error) {
      console.log('🔍 DEBUG: Erreur lors de la suppression de tâche:', error)
      return false
    }
  }

  return { tasks, loading, isOffline, completeTask, uncompleteTask, addTask, updateTask, deleteTask, refetch: fetchTasks }
}

import { useState, useEffect, useCallback } from 'react'
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

export function useTasks(userId) {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [isOffline, setIsOffline] = useState(false)

  const fetchTasks = useCallback(async () => {
    try {
      console.log('🔍 DEBUG: Tentative de connexion à Supabase pour les tâches...')
      const { data, error } = await supabase
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
        .order('created_at', { ascending: true })

      if (!error && data) {
        console.log('🔍 DEBUG: Tâches chargées depuis Supabase:', data.length)
        setTasks(data)
        setIsOffline(false)
      } else {
        throw new Error(error?.message || 'Erreur Supabase')
      }
    } catch (error) {
      console.log('🔍 DEBUG: Erreur Supabase, utilisation du mode dégradé:', error.message)
      setTasks(DEMO_TASKS)
      setIsOffline(true)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchTasks()

    // Ne pas créer de canal si nous sommes en mode dégradé
    if (!isOffline) {
      try {
        const channel = supabase
          .channel('tasks-changes')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, fetchTasks)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'completions' }, fetchTasks)
          .subscribe()

        return () => {
          try {
            supabase.removeChannel(channel)
          } catch (error) {
            console.log('🔍 DEBUG: Erreur lors de la suppression du canal:', error)
          }
        }
      } catch (error) {
        console.log('🔍 DEBUG: Impossible de créer le canal WebSocket:', error)
      }
    }
  }, [fetchTasks, isOffline])

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

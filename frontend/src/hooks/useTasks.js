import { useState } from 'react'

const DEMO_TASKS = [
  { id: 'demo-1', title: 'Faire la vaisselle', description: 'Laver la vaisselle du repas', frequency: 'daily', assigned_to: 'both', created_at: new Date().toISOString(), completions: [] },
  { id: 'demo-2', title: 'Passer l\'aspirateur', description: 'Aspirer le salon et les chambres', frequency: 'weekly', assigned_to: 'both', created_at: new Date().toISOString(), completions: [] },
  { id: 'demo-3', title: 'Sortir les poubelles', description: 'Vider les poubelles de la cuisine', frequency: 'daily', assigned_to: 'both', created_at: new Date().toISOString(), completions: [] }
]

export function useTasks() {
  const [tasks] = useState(DEMO_TASKS)
  return { tasks, loading: false, isOffline: true, completeTask: () => true, uncompleteTask: () => true, addTask: () => true, updateTask: () => true, deleteTask: () => true }
}

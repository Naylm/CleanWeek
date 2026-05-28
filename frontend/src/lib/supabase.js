import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Configuration pour limiter les reconnexions et éviter la lenteur
const options = {
  realtime: {
    params: {
      eventsPerSecond: 1,
    },
    timeout: 5000,
    reconnectAfterMs: (attempts) => {
      // Limiter les tentatives de reconnexion : max 3 tentatives avec délai croissant
      if (attempts > 3) {
        console.log('🔍 DEBUG: Max reconnexion atteinte, arrêt des tentatives')
        return 999999999 // Très grand nombre pour arrêter les reconnexions
      }
      return Math.min(attempts * 2000, 10000) // Max 10 secondes entre tentatives
    },
  },
  global: {
    headers: {
      'x-application-name': 'cleanweek',
    },
  },
  // Désactiver le fetch automatique si l'URL n'est pas configurée
  ...(supabaseUrl ? {} : { autoRefreshToken: false, persistSession: false }),
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  options
)

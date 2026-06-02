import { useState, useCallback, useRef } from 'react'

const API_URL = import.meta.env.VITE_API_URL || ''

export function useFoodSearch() {
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef(null)

  const searchFoods = useCallback(async (query) => {
    if (!query || query.trim().length < 2) {
      setSuggestions([])
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/foods/search?q=${encodeURIComponent(query)}&limit=8`)
      if (!res.ok) throw new Error('Search failed')
      const data = await res.json()
      setSuggestions(data)
    } catch (err) {
      console.error('Food search error:', err)
      setSuggestions([])
    } finally {
      setLoading(false)
    }
  }, [])

  const debouncedSearch = useCallback((query) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    debounceRef.current = setTimeout(() => {
      searchFoods(query)
    }, 150) // 150ms debounce
  }, [searchFoods])

  const clearSuggestions = useCallback(() => {
    setSuggestions([])
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
  }, [])

  return {
    suggestions,
    loading,
    searchFoods: debouncedSearch,
    clearSuggestions,
  }
}

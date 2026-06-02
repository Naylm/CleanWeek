import { useState, useRef, useEffect } from 'react'
import { useFoodSearch } from '../hooks/useFoodSearch'
import './FoodAutocomplete.css'

const CATEGORY_LABELS = {
  fruits_legumes: '🥬 Fruits & Légumes',
  viandes: '🥩 Viandes & Poissons',
  epicerie: '🥫 Épicerie',
  laitages: '🧀 Laitages',
  boulangerie: '🥖 Boulangerie',
  boissons: '🥤 Boissons',
  hygiene: '🧴 Hygiène',
  surgeles: '❄️ Surgelés',
  autre: '📦 Autre',
}

export default function FoodAutocomplete({ 
  value, 
  onChange, 
  onSelect,
  placeholder = "Chercher un aliment...",
  className = ""
}) {
  const { suggestions, loading, searchFoods, clearSuggestions } = useFoodSearch()
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const inputRef = useRef(null)
  const containerRef = useRef(null)

  // Handle input change
  function handleInputChange(e) {
    const newValue = e.target.value
    onChange(newValue)
    
    if (newValue.trim().length >= 2) {
      searchFoods(newValue)
      setIsOpen(true)
    } else {
      clearSuggestions()
      setIsOpen(false)
    }
  }

  // Handle selection
  function handleSelect(food) {
    onSelect(food)
    clearSuggestions()
    setIsOpen(false)
    inputRef.current?.focus()
  }

  // Keyboard navigation
  function handleKeyDown(e) {
    if (!isOpen || suggestions.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : 0)
        break
      case 'Enter':
        e.preventDefault()
        if (highlightedIndex >= 0) {
          handleSelect(suggestions[highlightedIndex])
        }
        break
      case 'Escape':
        setIsOpen(false)
        clearSuggestions()
        break
    }
  }

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false)
        clearSuggestions()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [clearSuggestions])

  // Reset highlight when suggestions change
  useEffect(() => {
    setHighlightedIndex(-1)
  }, [suggestions])

  return (
    <div ref={containerRef} className={`food-autocomplete ${className}`}>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (value.trim().length >= 2 && suggestions.length > 0) {
            setIsOpen(true)
          }
        }}
        placeholder={placeholder}
        className="autocomplete-input"
        autoComplete="off"
      />
      
      {loading && (
        <div className="autocomplete-spinner">
          <div className="spinner-small" />
        </div>
      )}
      
      {isOpen && suggestions.length > 0 && (
        <ul className="autocomplete-dropdown">
          {suggestions.map((food, index) => (
            <li
              key={food.id}
              className={`autocomplete-item ${index === highlightedIndex ? 'highlighted' : ''}`}
              onClick={() => handleSelect(food)}
              onMouseEnter={() => setHighlightedIndex(index)}
            >
              <span className="food-name">{food.name}</span>
              <span className="food-category">
                {CATEGORY_LABELS[food.category] || food.category}
              </span>
            </li>
          ))}
        </ul>
      )}
      
      {isOpen && !loading && value.trim().length >= 2 && suggestions.length === 0 && (
        <div className="autocomplete-dropdown empty">
          <span>Aucun aliment trouvé</span>
        </div>
      )}
    </div>
  )
}

// components/FilterGroup.tsx
import type { FC } from 'react'

interface FilterGroupProps {
  label: string
  value: string
  onChange: (value: string) => void
  options?: string[]
  type?: 'text' | 'number' | 'select'
  placeholder?: string
}

export const FilterGroup: FC<FilterGroupProps> = ({
  label,
  value,
  onChange,
  options = [],
  type = 'text',
  placeholder
}) => {
      console.log('🔄 FilterGroup props:', { 
    label, 
    value, 
    options: options.length,
    type 
  })
  return (
    <div className="filter-group">
      <label>{label}</label>
      {type === 'select' ? (
        <select 
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">Все</option>
          {options.map(option => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      ) : (
        <input 
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  )
}
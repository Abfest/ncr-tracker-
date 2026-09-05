'use client'

import { useState, useRef, useEffect } from 'react'
import { useTaxonomy } from '@/components/TaxonomyProvider'

interface Props {
  selected: string[]
  onChange: (types: string[]) => void
  darkBg?: boolean
}

export default function DefectTypeSelector({ selected, onChange, darkBg = true }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { taxonomy } = useTaxonomy()
  const issueTypes = taxonomy.issueTypes

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function toggle(type: string) {
    if (selected.includes(type)) {
      onChange(selected.filter(t => t !== type))
    } else {
      onChange([...selected, type])
    }
  }

  function remove(e: React.MouseEvent, type: string) {
    e.preventDefault()
    e.stopPropagation()
    onChange(selected.filter(t => t !== type))
  }

  const bg = darkBg ? '#070D17' : '#0F1C30'

  return (
    <div ref={ref} style={{ position: 'relative', zIndex: open ? 100 : 1 }}>
      <div
        onMouseDown={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setOpen(!open)
        }}
        style={{
          minHeight: '42px',
          padding: '6px 12px',
          borderRadius: 8,
          background: bg,
          border: open ? '1px solid #00B2FF' : '1px solid rgba(38,132,255,0.2)',
          boxShadow: open ? '0 0 0 2px rgba(0,178,255,0.15)' : 'none',
          cursor: 'pointer',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 6,
          alignItems: 'center',
          transition: 'border-color 0.15s',
          userSelect: 'none',
        }}
      >
        {selected.length === 0 && (
          <span style={{ fontSize: 14, color: '#475569', fontFamily: "'Poppins', sans-serif", pointerEvents: 'none' }}>
            Select {taxonomy.issueTypeLabel.toLowerCase()}s…
          </span>
        )}
        {selected.map(type => (
          <span
            key={type}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '3px 8px',
              borderRadius: 6,
              background: 'rgba(0,178,255,0.15)',
              border: '1px solid rgba(0,178,255,0.3)',
              color: '#00B2FF',
              fontSize: 12,
              fontFamily: "'Poppins', sans-serif",
              fontWeight: 500,
            }}
          >
            {type}
            <span
              onMouseDown={(e) => remove(e, type)}
              style={{
                cursor: 'pointer',
                color: '#00B2FF',
                fontSize: 14,
                lineHeight: 1,
                padding: '0 2px',
              }}
            >
              ×
            </span>
          </span>
        ))}
        <span style={{ marginLeft: 'auto', color: '#475569', fontSize: 12, pointerEvents: 'none' }}>
          {open ? '▲' : '▼'}
        </span>
      </div>

      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 4px)',
          left: 0,
          right: 0,
          background: '#0F1C30',
          border: '1px solid rgba(38,132,255,0.2)',
          borderRadius: 8,
          zIndex: 9999,
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          overflow: 'hidden',
        }}>
          {issueTypes.map(type => {
            const isSelected = selected.includes(type)
            return (
              <div
                key={type}
                onMouseDown={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  toggle(type)
                }}
                style={{
                  padding: '10px 14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  background: isSelected ? 'rgba(0,178,255,0.08)' : 'transparent',
                  fontFamily: "'Poppins', sans-serif",
                  fontSize: 13,
                  color: isSelected ? '#00B2FF' : '#cbd5e1',
                  borderBottom: '1px solid rgba(38,132,255,0.06)',
                  userSelect: 'none',
                }}
              >
                <div style={{
                  width: 16,
                  height: 16,
                  borderRadius: 4,
                  border: isSelected ? '2px solid #00B2FF' : '2px solid rgba(38,132,255,0.3)',
                  background: isSelected ? '#00B2FF' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {isSelected && (
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5l2.5 2.5L8 3" stroke="#0B1320" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                {type}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

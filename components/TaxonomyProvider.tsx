'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { getTaxonomySettings, saveTaxonomySettings, TaxonomySettings } from '@/lib/settings-service'
import { DEPARTMENTS, DEFECT_TYPES, SUPPLIERS, ASSIGNEES } from '@/lib/constants'

const FALLBACK: TaxonomySettings = {
  presetId: 'manufacturing',
  issueTypeLabel: 'Defect Type',
  vendorLabel: 'Supplier',
  departments: [...DEPARTMENTS],
  issueTypes: [...DEFECT_TYPES],
  vendors: [...SUPPLIERS],
  assignees: [...ASSIGNEES],
}

interface TaxonomyContextValue {
  taxonomy: TaxonomySettings
  loading: boolean
  refresh: () => Promise<void>
  save: (next: TaxonomySettings) => Promise<void>
}

const TaxonomyContext = createContext<TaxonomyContextValue>({
  taxonomy: FALLBACK,
  loading: true,
  refresh: async () => {},
  save: async () => {},
})

export function TaxonomyProvider({ children }: { children: React.ReactNode }) {
  const [taxonomy, setTaxonomy] = useState<TaxonomySettings>(FALLBACK)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const settings = await getTaxonomySettings()
      setTaxonomy(settings)
    } finally {
      setLoading(false)
    }
  }, [])

  const save = useCallback(async (next: TaxonomySettings) => {
    await saveTaxonomySettings(next)
    setTaxonomy(next)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return (
    <TaxonomyContext.Provider value={{ taxonomy, loading, refresh, save }}>
      {children}
    </TaxonomyContext.Provider>
  )
}

export function useTaxonomy() {
  return useContext(TaxonomyContext)
}

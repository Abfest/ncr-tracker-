import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { DEPARTMENTS, DEFECT_TYPES, SUPPLIERS, ASSIGNEES } from '@/lib/constants'
import { INDUSTRY_PRESETS, DEFAULT_PRESET_ID } from '@/lib/industry-presets'

const DOC_PATH = ['app_settings', 'taxonomy'] as const

export interface TaxonomySettings {
  presetId: string
  issueTypeLabel: string
  vendorLabel: string
  departments: string[]
  issueTypes: string[]
  vendors: string[]
  assignees: string[]
}

function defaultSettings(): TaxonomySettings {
  return {
    presetId: DEFAULT_PRESET_ID,
    issueTypeLabel: 'Defect Type',
    vendorLabel: 'Supplier',
    departments: [...DEPARTMENTS],
    issueTypes: [...DEFECT_TYPES],
    vendors: [...SUPPLIERS],
    assignees: [...ASSIGNEES],
  }
}

export async function getTaxonomySettings(): Promise<TaxonomySettings> {
  try {
    const ref = doc(db, ...DOC_PATH)
    const snap = await getDoc(ref)
    if (!snap.exists()) {
      return defaultSettings()
    }
    const data = snap.data()
    return {
      presetId: data.presetId ?? DEFAULT_PRESET_ID,
      issueTypeLabel: data.issueTypeLabel ?? 'Defect Type',
      vendorLabel: data.vendorLabel ?? 'Supplier',
      departments: Array.isArray(data.departments) && data.departments.length > 0 ? data.departments : [...DEPARTMENTS],
      issueTypes: Array.isArray(data.issueTypes) && data.issueTypes.length > 0 ? data.issueTypes : [...DEFECT_TYPES],
      vendors: Array.isArray(data.vendors) && data.vendors.length > 0 ? data.vendors : [...SUPPLIERS],
      assignees: Array.isArray(data.assignees) && data.assignees.length > 0 ? data.assignees : [...ASSIGNEES],
    }
  } catch (err) {
    console.error('Failed to load taxonomy settings, falling back to defaults:', err)
    return defaultSettings()
  }
}

export async function saveTaxonomySettings(settings: TaxonomySettings): Promise<void> {
  const ref = doc(db, ...DOC_PATH)
  await setDoc(ref, { ...settings, updatedAt: serverTimestamp() }, { merge: true })
}

export function applyPreset(presetId: string): TaxonomySettings | null {
  const preset = INDUSTRY_PRESETS.find(p => p.id === presetId)
  if (!preset) return null
  return {
    presetId: preset.id,
    issueTypeLabel: preset.issueTypeLabel,
    vendorLabel: preset.vendorLabel,
    departments: [...preset.departments],
    issueTypes: [...preset.issueTypes],
    vendors: [...preset.vendors],
    assignees: [...preset.assignees],
  }
}

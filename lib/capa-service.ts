import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  query,
  where,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore'
import { db, auth } from '@/lib/firebase'
import { CAPA, CreateCAPAInput, UpdateCAPAInput, CAPAStatus } from '@/types/capa'
import { updateNCR } from '@/lib/ncr-service'

const COLLECTION = 'v2_capas'

function toDate(v: unknown): Date | undefined {
  if (!v) return undefined
  if (v instanceof Timestamp) return v.toDate()
  if (v instanceof Date) return v
  if (typeof v === 'string' || typeof v === 'number') {
    const d = new Date(v)
    return isNaN(d.getTime()) ? undefined : d
  }
  return undefined
}

function docToCAPA(id: string, data: Record<string, unknown>): CAPA {
  return {
    id,
    ncrId: String(data.ncrId ?? ''),
    ncrNumber: String(data.ncrNumber ?? ''),
    rootCause: String(data.rootCause ?? ''),
    correctiveAction: String(data.correctiveAction ?? ''),
    preventiveAction: String(data.preventiveAction ?? ''),
    owner: String(data.owner ?? ''),
    dueDate: toDate(data.dueDate),
    verificationMethod: String(data.verificationMethod ?? ''),
    verificationDate: toDate(data.verificationDate),
    verifiedBy: data.verifiedBy ? String(data.verifiedBy) : undefined,
    status: (data.status as CAPAStatus) ?? 'open',
    createdAt: toDate(data.createdAt) ?? new Date(),
    updatedAt: toDate(data.updatedAt) ?? new Date(),
    createdBy: String(data.createdBy ?? ''),
  }
}

export async function getCAPAByNCRId(ncrId: string): Promise<CAPA | null> {
  const q = query(collection(db, COLLECTION), where('ncrId', '==', ncrId))
  const snapshot = await getDocs(q)
  if (snapshot.empty) return null
  const d = snapshot.docs[0]
  return docToCAPA(d.id, d.data())
}

export async function getCAPAById(id: string): Promise<CAPA | null> {
  const ref = doc(db, COLLECTION, id)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  return docToCAPA(snap.id, snap.data())
}

export async function getAllCAPAs(): Promise<CAPA[]> {
  const snapshot = await getDocs(collection(db, COLLECTION))
  return snapshot.docs.map((d) => docToCAPA(d.id, d.data()))
}

export async function createCAPA(input: CreateCAPAInput): Promise<string> {
  const user = auth.currentUser
  if (!user) throw new Error('Must be signed in')

  const payload: Record<string, unknown> = {
    ncrId: input.ncrId,
    ncrNumber: input.ncrNumber,
    rootCause: input.rootCause,
    correctiveAction: input.correctiveAction,
    preventiveAction: input.preventiveAction,
    owner: input.owner,
    verificationMethod: input.verificationMethod,
    status: 'open' as CAPAStatus,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: user.email ?? user.uid,
  }

  if (input.dueDate) {
    payload.dueDate = Timestamp.fromDate(new Date(input.dueDate))
  }

  const ref = await addDoc(collection(db, COLLECTION), payload)
  return ref.id
}

export async function updateCAPA(id: string, input: UpdateCAPAInput): Promise<void> {
  const ref = doc(db, COLLECTION, id)
  const payload: Record<string, unknown> = { updatedAt: serverTimestamp() }

  if (input.rootCause !== undefined) payload.rootCause = input.rootCause
  if (input.correctiveAction !== undefined) payload.correctiveAction = input.correctiveAction
  if (input.preventiveAction !== undefined) payload.preventiveAction = input.preventiveAction
  if (input.owner !== undefined) payload.owner = input.owner
  if (input.verificationMethod !== undefined) payload.verificationMethod = input.verificationMethod
  if (input.verifiedBy !== undefined) payload.verifiedBy = input.verifiedBy
  if (input.status !== undefined) payload.status = input.status
  if (input.dueDate !== undefined) {
    payload.dueDate = input.dueDate ? Timestamp.fromDate(new Date(input.dueDate)) : null
  }
  if (input.verificationDate !== undefined) {
    payload.verificationDate = input.verificationDate ? Timestamp.fromDate(new Date(input.verificationDate)) : null
  }

  await updateDoc(ref, payload)

  // Keep the parent NCR in sync: once its CAPA is fully closed, the NCR
  // itself should reflect that — otherwise it keeps counting as open and
  // overdue everywhere (dashboard, analytics KPIs, supplier scorecard)
  // even though the corrective action has already been resolved.
  if (input.status === 'closed') {
    const capa = await getCAPAById(id)
    if (capa?.ncrId) {
      try {
        await updateNCR(capa.ncrId, { status: 'closed' })
      } catch (err) {
        // Don't let a failed NCR sync block the CAPA update itself —
        // surface it so it isn't silently swallowed.
        console.error(`Failed to sync NCR ${capa.ncrId} to closed after CAPA ${id} was closed:`, err)
      }
    }
  }
}

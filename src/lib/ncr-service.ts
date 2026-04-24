import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore'
import { db, auth } from '@/lib/firebase'
import { NCR, CreateNCRInput, UpdateNCRInput, NCRStatus } from '@/types/ncr'

const COLLECTION = 'ncrs'

// Convert Firestore document to NCR object
function docToNCR(id: string, data: Record<string, unknown>): NCR {
  const toDate = (v: unknown): Date | undefined => {
    if (!v) return undefined
    if (v instanceof Timestamp) return v.toDate()
    if (v instanceof Date) return v
    if (typeof v === 'string' || typeof v === 'number') {
      const d = new Date(v)
      return isNaN(d.getTime()) ? undefined : d
    }
    return undefined
  }

  return {
    id,
    ncrNumber: String(data.ncrNumber ?? ''),
    title: String(data.title ?? ''),
    description: String(data.description ?? ''),
    status: (data.status as NCRStatus) ?? 'open',
    priority: (data.priority as NCR['priority']) ?? 'medium',
    department: String(data.department ?? ''),
    assignee: String(data.assignee ?? ''),
    reportedBy: String(data.reportedBy ?? ''),
    createdAt: toDate(data.createdAt) ?? new Date(),
    updatedAt: toDate(data.updatedAt) ?? new Date(),
    dueDate: toDate(data.dueDate),
    closedAt: toDate(data.closedAt),
  }
}

// Generate next NCR number (e.g., NCR-2026-0001)
async function generateNCRNumber(): Promise<string> {
  const year = new Date().getFullYear()
  const snapshot = await getDocs(collection(db, COLLECTION))
  const count = snapshot.size + 1
  return `NCR-${year}-${String(count).padStart(4, '0')}`
}

// Get all NCRs, newest first
export async function getAllNCRs(): Promise<NCR[]> {
  const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((d) => docToNCR(d.id, d.data()))
}

// Get a single NCR by ID
export async function getNCRById(id: string): Promise<NCR | null> {
  const ref = doc(db, COLLECTION, id)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  return docToNCR(snap.id, snap.data())
}

// Create a new NCR
export async function createNCR(input: CreateNCRInput): Promise<string> {
  const user = auth.currentUser
  if (!user) throw new Error('Must be signed in to create an NCR')

  const ncrNumber = await generateNCRNumber()

  const payload: Record<string, unknown> = {
    ncrNumber,
    title: input.title,
    description: input.description,
    status: 'open' as NCRStatus,
    priority: input.priority,
    department: input.department,
    assignee: input.assignee,
    reportedBy: user.email ?? user.uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }

  if (input.dueDate) {
    payload.dueDate = Timestamp.fromDate(new Date(input.dueDate))
  }

  const ref = await addDoc(collection(db, COLLECTION), payload)
  return ref.id
}

// Update an existing NCR
export async function updateNCR(id: string, input: UpdateNCRInput): Promise<void> {
  const ref = doc(db, COLLECTION, id)
  const payload: Record<string, unknown> = {
    updatedAt: serverTimestamp(),
  }

  if (input.title !== undefined) payload.title = input.title
  if (input.description !== undefined) payload.description = input.description
  if (input.status !== undefined) {
    payload.status = input.status
    if (input.status === 'closed') {
      payload.closedAt = serverTimestamp()
    }
  }
  if (input.priority !== undefined) payload.priority = input.priority
  if (input.department !== undefined) payload.department = input.department
  if (input.assignee !== undefined) payload.assignee = input.assignee
  if (input.dueDate !== undefined) {
    payload.dueDate = input.dueDate ? Timestamp.fromDate(new Date(input.dueDate)) : null
  }

  await updateDoc(ref, payload)
}

// Delete an NCR
export async function deleteNCR(id: string): Promise<void> {
  const ref = doc(db, COLLECTION, id)
  await deleteDoc(ref)
}

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
  arrayUnion,
} from 'firebase/firestore'
import { db, auth } from '@/lib/firebase'
import {
  NCR,
  CreateNCRInput,
  UpdateNCRInput,
  NCRStatus,
  ActivityEntry,
  ActivityType,
} from '@/types/ncr'

const COLLECTION = 'ncrs'

// ============================================================
// Helpers
// ============================================================

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

function generateActivityId(): string {
  return `act_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

function getCurrentUserEmail(): string {
  const u = auth.currentUser
  return u?.email ?? u?.uid ?? 'unknown'
}

function buildActivityEntry(
  type: ActivityType,
  options: { fromValue?: string; toValue?: string; message?: string } = {}
): ActivityEntry {
  return {
    id: generateActivityId(),
    type,
    timestamp: new Date(),
    userEmail: getCurrentUserEmail(),
    ...options,
  }
}

// Convert Firestore activity entry to JS type
function parseActivity(raw: unknown): ActivityEntry | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  const ts = toDate(r.timestamp)
  if (!ts) return null
  return {
    id: String(r.id ?? generateActivityId()),
    type: (r.type as ActivityType) ?? 'comment',
    timestamp: ts,
    userEmail: String(r.userEmail ?? 'unknown'),
    fromValue: r.fromValue ? String(r.fromValue) : undefined,
    toValue: r.toValue ? String(r.toValue) : undefined,
    message: r.message ? String(r.message) : undefined,
  }
}

// Convert Firestore document to NCR object
function docToNCR(id: string, data: Record<string, unknown>): NCR {
  const rawActivity = Array.isArray(data.activity) ? data.activity : []
  const activity = rawActivity
    .map(parseActivity)
    .filter((a): a is ActivityEntry => a !== null)
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

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
    isArchived: Boolean(data.isArchived),
    archivedAt: toDate(data.archivedAt),
    activity,
  }
}

// Generate next NCR number (e.g., NCR-2026-0001)
async function generateNCRNumber(): Promise<string> {
  const year = new Date().getFullYear()
  const snapshot = await getDocs(collection(db, COLLECTION))
  const count = snapshot.size + 1
  return `NCR-${year}-${String(count).padStart(4, '0')}`
}

// Format an activity entry to Firestore-friendly object
function activityToFirestore(entry: ActivityEntry): Record<string, unknown> {
  const out: Record<string, unknown> = {
    id: entry.id,
    type: entry.type,
    timestamp: Timestamp.fromDate(entry.timestamp),
    userEmail: entry.userEmail,
  }
  if (entry.fromValue !== undefined) out.fromValue = entry.fromValue
  if (entry.toValue !== undefined) out.toValue = entry.toValue
  if (entry.message !== undefined) out.message = entry.message
  return out
}

// ============================================================
// Read operations
// ============================================================

// Get all non-archived NCRs, newest first
export async function getAllNCRs(): Promise<NCR[]> {
  const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'))
  const snapshot = await getDocs(q)
  return snapshot.docs
    .map((d) => docToNCR(d.id, d.data()))
    .filter((n) => !n.isArchived)
}

// Get all archived NCRs (recycle bin), most recently archived first
export async function getArchivedNCRs(): Promise<NCR[]> {
  const snapshot = await getDocs(collection(db, COLLECTION))
  return snapshot.docs
    .map((d) => docToNCR(d.id, d.data()))
    .filter((n) => n.isArchived)
    .sort((a, b) => {
      const ta = a.archivedAt?.getTime() ?? 0
      const tb = b.archivedAt?.getTime() ?? 0
      return tb - ta
    })
}

// Get a single NCR by ID
export async function getNCRById(id: string): Promise<NCR | null> {
  const ref = doc(db, COLLECTION, id)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  return docToNCR(snap.id, snap.data())
}

// ============================================================
// Write operations (with auto-logging)
// ============================================================

// Create a new NCR
export async function createNCR(input: CreateNCRInput): Promise<string> {
  const user = auth.currentUser
  if (!user) throw new Error('Must be signed in to create an NCR')

  const ncrNumber = await generateNCRNumber()
  const initialActivity = buildActivityEntry('created', {
    message: `Created NCR ${ncrNumber}`,
  })

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
    isArchived: false,
    activity: [activityToFirestore(initialActivity)],
  }

  if (input.dueDate) {
    payload.dueDate = Timestamp.fromDate(new Date(input.dueDate))
  }

  const ref = await addDoc(collection(db, COLLECTION), payload)
  return ref.id
}

// Update an existing NCR (auto-logs every change)
export async function updateNCR(id: string, input: UpdateNCRInput): Promise<void> {
  // Fetch current state to compare
  const current = await getNCRById(id)
  if (!current) throw new Error('NCR not found')

  const ref = doc(db, COLLECTION, id)
  const payload: Record<string, unknown> = {
    updatedAt: serverTimestamp(),
  }
  const newActivities: ActivityEntry[] = []

  if (input.title !== undefined && input.title !== current.title) {
    payload.title = input.title
    newActivities.push(
      buildActivityEntry('title_updated', {
        fromValue: current.title,
        toValue: input.title,
      })
    )
  }
  if (input.description !== undefined && input.description !== current.description) {
    payload.description = input.description
    newActivities.push(buildActivityEntry('description_updated'))
  }
  if (input.status !== undefined && input.status !== current.status) {
    payload.status = input.status
    if (input.status === 'closed') {
      payload.closedAt = serverTimestamp()
    }
    newActivities.push(
      buildActivityEntry('status_changed', {
        fromValue: current.status,
        toValue: input.status,
      })
    )
  }
  if (input.priority !== undefined && input.priority !== current.priority) {
    payload.priority = input.priority
    newActivities.push(
      buildActivityEntry('priority_changed', {
        fromValue: current.priority,
        toValue: input.priority,
      })
    )
  }
  if (input.department !== undefined && input.department !== current.department) {
    payload.department = input.department
    newActivities.push(
      buildActivityEntry('department_updated', {
        fromValue: current.department,
        toValue: input.department,
      })
    )
  }
  if (input.assignee !== undefined && input.assignee !== current.assignee) {
    payload.assignee = input.assignee
    newActivities.push(
      buildActivityEntry('assignee_changed', {
        fromValue: current.assignee,
        toValue: input.assignee,
      })
    )
  }
  if (input.dueDate !== undefined) {
    const newDue = input.dueDate ? new Date(input.dueDate).toDateString() : ''
    const oldDue = current.dueDate ? current.dueDate.toDateString() : ''
    if (newDue !== oldDue) {
      payload.dueDate = input.dueDate
        ? Timestamp.fromDate(new Date(input.dueDate))
        : null
      newActivities.push(
        buildActivityEntry('due_date_changed', {
          fromValue: oldDue || 'none',
          toValue: newDue || 'none',
        })
      )
    }
  }

  // Append new activity entries to the array
  if (newActivities.length > 0) {
    payload.activity = arrayUnion(...newActivities.map(activityToFirestore))
  }

  await updateDoc(ref, payload)
}

// Add a manual comment to an NCR
export async function addComment(id: string, message: string): Promise<void> {
  if (!message.trim()) throw new Error('Comment cannot be empty')
  const ref = doc(db, COLLECTION, id)
  const entry = buildActivityEntry('comment', { message: message.trim() })
  await updateDoc(ref, {
    updatedAt: serverTimestamp(),
    activity: arrayUnion(activityToFirestore(entry)),
  })
}

// Move NCR to recycle bin (soft delete)
export async function archiveNCR(id: string): Promise<void> {
  const ref = doc(db, COLLECTION, id)
  const entry = buildActivityEntry('archived')
  await updateDoc(ref, {
    isArchived: true,
    archivedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    activity: arrayUnion(activityToFirestore(entry)),
  })
}

// Restore NCR from recycle bin
export async function restoreNCR(id: string): Promise<void> {
  const ref = doc(db, COLLECTION, id)
  const entry = buildActivityEntry('restored')
  await updateDoc(ref, {
    isArchived: false,
    archivedAt: null,
    updatedAt: serverTimestamp(),
    activity: arrayUnion(activityToFirestore(entry)),
  })
}

// Permanently delete an NCR (only from recycle bin)
export async function permanentlyDeleteNCR(id: string): Promise<void> {
  const ref = doc(db, COLLECTION, id)
  await deleteDoc(ref)
}

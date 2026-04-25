'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getNCRById, updateNCR, archiveNCR } from '@/lib/ncr-service';
import { NCR, NCRStatus, NCRPriority } from '@/types/ncr';
import BrandHeader from '../../../components/BrandHeader';
import BrandFooter from '../../../components/BrandFooter';

const STATUS_STYLES: Record<NCRStatus, string> = {
  'open': 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  'in-progress': 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  'closed': 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
};

const STATUS_BUTTON_STYLES: Record<NCRStatus, string> = {
  'open': 'bg-sky-500 hover:bg-sky-400 text-slate-950 shadow-sky-500/30',
  'in-progress': 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/30',
  'closed': 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/30',
};

const STATUS_LABELS: Record<NCRStatus, string> = {
  'open': 'Open',
  'in-progress': 'In Progress',
  'closed': 'Closed',
};

const PRIORITY_STYLES: Record<NCRPriority, string> = {
  'low': 'bg-slate-500/15 text-slate-300 border-slate-500/30',
  'medium': 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  'high': 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  'critical': 'bg-rose-500/15 text-rose-300 border-rose-500/30',
};

const PRIORITY_LABELS: Record<NCRPriority, string> = {
  'low': 'Low',
  'medium': 'Medium',
  'high': 'High',
  'critical': 'Critical',
};

function formatDateTime(value: Date | undefined): string {
  if (!value) return '—';
  try {
    const d = value instanceof Date ? value : new Date(value as unknown as string);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch { return '—'; }
}

function formatDate(value: Date | undefined): string {
  if (!value) return '—';
  try {
    const d = value instanceof Date ? value : new Date(value as unknown as string);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  } catch { return '—'; }
}

function toDateInput(value: Date | undefined): string {
  if (!value) return '';
  try {
    const d = value instanceof Date ? value : new Date(value as unknown as string);
    if (isNaN(d.getTime())) return '';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  } catch { return ''; }
}

export default function NCRDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const [ncr, setNcr] = useState<NCR | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [archiving, setArchiving] = useState(false);

  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPriority, setEditPriority] = useState<NCRPriority>('medium');
  const [editDepartment, setEditDepartment] = useState('');
  const [editAssignee, setEditAssignee] = useState('');
  const [editDueDate, setEditDueDate] = useState('');

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) router.push('/login');
      else setUser(u);
      setAuthChecked(true);
    });
    return () => unsub();
  }, [router]);

  useEffect(() => {
    if (!user || !id) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const data = await getNCRById(id);
        if (!cancelled) {
          if (!data) setError('NCR not found');
          else setNcr(data);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load NCR');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user, id]);

  function startEditing() {
    if (!ncr) return;
    setEditTitle(ncr.title);
    setEditDescription(ncr.description);
    setEditPriority(ncr.priority);
    setEditDepartment(ncr.department);
    setEditAssignee(ncr.assignee);
    setEditDueDate(toDateInput(ncr.dueDate));
    setIsEditing(true);
  }

  async function saveChanges() {
    if (!ncr) return;
    if (!editTitle.trim() || !editDescription.trim() || !editDepartment.trim() || !editAssignee.trim()) {
      setError('All required fields must be filled');
      return;
    }
    try {
      setSaving(true);
      setError(null);
      await updateNCR(ncr.id, {
        title: editTitle.trim(),
        description: editDescription.trim(),
        priority: editPriority,
        department: editDepartment.trim(),
        assignee: editAssignee.trim(),
        dueDate: editDueDate || undefined,
      });
      const refreshed = await getNCRById(ncr.id);
      if (refreshed) setNcr(refreshed);
      setIsEditing(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(newStatus: NCRStatus) {
    if (!ncr || ncr.status === newStatus) return;
    try {
      setSaving(true);
      setError(null);
      await updateNCR(ncr.id, { status: newStatus });
      const refreshed = await getNCRById(ncr.id);
      if (refreshed) setNcr(refreshed);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update status');
    } finally {
      setSaving(false);
    }
  }

  async function handleArchive() {
    if (!ncr) return;
    try {
      setArchiving(true);
      await archiveNCR(ncr.id);
      router.push('/dashboard');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to archive');
      setArchiving(false);
      setShowArchiveConfirm(false);
    }
  }

  if (!authChecked || loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400">Loading…</div>
      </div>
    );
  }

  if (error && !ncr) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        <BrandHeader userEmail={user?.email} showActions={false} backHref="/dashboard" maxWidth="max-w-4xl" />
        <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="p-6 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300">{error}</div>
        </main>
        <BrandFooter />
      </div>
    );
  }

  if (!ncr) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <BrandHeader userEmail={user?.email} showActions={false} backHref="/dashboard" maxWidth="max-w-4xl" />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="font-mono text-2xl text-sky-300">{ncr.ncrNumber}</div>
            <p className="text-xs text-slate-500 mt-1">Created {formatDateTime(ncr.createdAt)}</p>
          </div>
          {!isEditing && (
            <div className="flex items-center gap-2">
              <button onClick={startEditing} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 text-sm font-medium transition-colors">
                <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                  <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
                </svg>
                Edit
              </button>
              <button onClick={() => setShowArchiveConfirm(true)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-sm font-medium transition-colors">
                <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Move to Bin
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">{error}</div>
        )}

        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
          <div className="text-xs text-slate-400 uppercase tracking-wide mb-3">Status</div>
          <div className="flex flex-wrap gap-2">
            {(['open', 'in-progress', 'closed'] as NCRStatus[]).map((s) => {
              const isActive = ncr.status === s;
              return (
                <button
                  key={s}
                  onClick={() => changeStatus(s)}
                  disabled={saving || isActive}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive ? `${STATUS_BUTTON_STYLES[s]} shadow-lg` : 'bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-50'
                  }`}
                >
                  {isActive && (
                    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                  {STATUS_LABELS[s]}
                </button>
              );
            })}
          </div>
          {ncr.status === 'closed' && ncr.closedAt && (
            <p className="text-xs text-emerald-400 mt-3">✓ Closed on {formatDateTime(ncr.closedAt)}</p>
          )}
        </div>

        {isEditing ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 space-y-5">
            <Field label="Title" required>
              <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="input" maxLength={200} />
            </Field>
            <Field label="Description" required>
              <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={5} className="input resize-y" />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field label="Department" required>
                <input type="text" value={editDepartment} onChange={(e) => setEditDepartment(e.target.value)} className="input" />
              </Field>
              <Field label="Priority" required>
                <select value={editPriority} onChange={(e) => setEditPriority(e.target.value as NCRPriority)} className="input">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </Field>
              <Field label="Assignee" required>
                <input type="text" value={editAssignee} onChange={(e) => setEditAssignee(e.target.value)} className="input" />
              </Field>
              <Field label="Due Date">
                <input type="date" value={editDueDate} onChange={(e) => setEditDueDate(e.target.value)} className="input" />
              </Field>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button onClick={saveChanges} disabled={saving} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-slate-950 font-medium transition-colors shadow-lg shadow-sky-500/20">
                {saving ? 'Saving…' : 'Save changes'}
              </button>
              <button onClick={() => setIsEditing(false)} disabled={saving} className="px-4 py-2.5 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-slate-800 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 space-y-5">
            <div>
              <div className="text-xs text-slate-400 uppercase tracking-wide mb-1.5">Title</div>
              <h2 className="text-2xl font-semibold text-slate-100">{ncr.title}</h2>
            </div>
            <div>
              <div className="text-xs text-slate-400 uppercase tracking-wide mb-1.5">Description</div>
              <p className="text-slate-200 whitespace-pre-wrap leading-relaxed">{ncr.description}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
              <DetailField label="Department" value={ncr.department} />
              <DetailField label="Priority">
                <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-medium border ${PRIORITY_STYLES[ncr.priority]}`}>
                  {PRIORITY_LABELS[ncr.priority]}
                </span>
              </DetailField>
              <DetailField label="Assignee" value={ncr.assignee} />
              <DetailField label="Due Date">
                <span className="text-slate-200">{formatDate(ncr.dueDate)}</span>
              </DetailField>
              <DetailField label="Reported By" value={ncr.reportedBy} />
              <DetailField label="Current Status">
                <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-medium border ${STATUS_STYLES[ncr.status]}`}>
                  {STATUS_LABELS[ncr.status]}
                </span>
              </DetailField>
            </div>
          </div>
        )}

        <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-5 text-xs text-slate-500 space-y-1">
          <div>Created: {formatDateTime(ncr.createdAt)}</div>
          <div>Last updated: {formatDateTime(ncr.updatedAt)}</div>
          {ncr.closedAt && <div>Closed: {formatDateTime(ncr.closedAt)}</div>}
        </div>
      </main>

      <BrandFooter />

      {showArchiveConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-slate-100 mb-2">Move to Recycle Bin?</h3>
            <p className="text-sm text-slate-400 mb-5">
              This NCR will be moved to the Recycle Bin. You can restore it or permanently delete it from there.
            </p>
            <div className="flex items-center gap-3 justify-end">
              <button onClick={() => setShowArchiveConfirm(false)} disabled={archiving} className="px-4 py-2 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-slate-800 transition-colors">Cancel</button>
              <button onClick={handleArchive} disabled={archiving} className="px-4 py-2 rounded-lg bg-rose-500 hover:bg-rose-400 disabled:opacity-50 text-white text-sm font-medium transition-colors">
                {archiving ? 'Moving…' : 'Move to Bin'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .input {
          width: 100%;
          padding: 0.625rem 0.875rem;
          border-radius: 0.5rem;
          background-color: rgb(15 23 42);
          border: 1px solid rgb(30 41 59);
          color: rgb(241 245 249);
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .input::placeholder { color: rgb(100 116 139); }
        .input:focus {
          outline: none;
          border-color: rgb(14 165 233);
          box-shadow: 0 0 0 1px rgb(14 165 233);
        }
      `}</style>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-slate-300 mb-1.5">
        {label}
        {required && <span className="text-sky-400 ml-0.5">*</span>}
      </span>
      {children}
    </label>
  );
}

function DetailField({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-slate-400 uppercase tracking-wide mb-1.5">{label}</div>
      {children ?? <div className="text-slate-200">{value || '—'}</div>}
    </div>
  );
}

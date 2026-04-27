'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getNCRById, updateNCR, archiveNCR, addComment } from '@/lib/ncr-service';
import { NCR, NCRStatus, NCRPriority, ActivityEntry, ActivityType } from '@/types/ncr';
import { DEPARTMENTS, ASSIGNEES } from '@/lib/constants';
import BrandHeader from '@/components/BrandHeader';
import BrandFooter from '@/components/BrandFooter';

const STATUS_STYLES: Record<NCRStatus, string> = {
  'open': 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  'in-progress': 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  'closed': 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
};

const STATUS_BUTTON_ACTIVE: Record<NCRStatus, string> = {
  'open': 'background: #00B2FF; color: #0B1320; box-shadow: 0 0 16px rgba(0,178,255,0.4);',
  'in-progress': 'background: #f59e0b; color: #0B1320; box-shadow: 0 0 16px rgba(245,158,11,0.4);',
  'closed': 'background: #10b981; color: #0B1320; box-shadow: 0 0 16px rgba(16,185,129,0.4);',
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
  'low': 'Low', 'medium': 'Medium', 'high': 'High', 'critical': 'Critical',
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

function relativeTime(date: Date): string {
  const diff = Date.now() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 7) return formatDateTime(date);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'just now';
}

function describeActivity(entry: ActivityEntry): { icon: string; text: React.ReactNode; color: string } {
  const sl = (v: string) => STATUS_LABELS[v as NCRStatus] || v;
  const pl = (v: string) => PRIORITY_LABELS[v as NCRPriority] || v;
  switch (entry.type) {
    case 'created': return { icon: '✨', text: <>created this NCR</>, color: 'text-sky-300' };
    case 'status_changed': return {
      icon: '🔄',
      text: <> changed status from <strong className="text-slate-200">{sl(entry.fromValue ?? '')}</strong> to <strong className="text-slate-200">{sl(entry.toValue ?? '')}</strong></>,
      color: 'text-amber-300',
    };
    case 'priority_changed': return {
      icon: '⚡',
      text: <> changed priority from <strong className="text-slate-200">{pl(entry.fromValue ?? '')}</strong> to <strong className="text-slate-200">{pl(entry.toValue ?? '')}</strong></>,
      color: 'text-amber-300',
    };
    case 'assignee_changed': return {
      icon: '👤',
      text: <> changed assignee from <strong className="text-slate-200">{entry.fromValue || 'unassigned'}</strong> to <strong className="text-slate-200">{entry.toValue}</strong></>,
      color: 'text-sky-300',
    };
    case 'due_date_changed': return {
      icon: '📅',
      text: <> updated due date to <strong className="text-slate-200">{entry.toValue}</strong></>,
      color: 'text-sky-300',
    };
    case 'department_updated': return {
      icon: '🏭',
      text: <> changed department to <strong className="text-slate-200">{entry.toValue}</strong></>,
      color: 'text-slate-300',
    };
    case 'title_updated': return { icon: '✏️', text: <> updated the title</>, color: 'text-slate-300' };
    case 'description_updated': return { icon: '✏️', text: <> updated the description</>, color: 'text-slate-300' };
    case 'archived': return { icon: '🗑️', text: <> moved to recycle bin</>, color: 'text-rose-300' };
    case 'restored': return { icon: '♻️', text: <> restored from recycle bin</>, color: 'text-emerald-300' };
    case 'comment': return { icon: '💬', text: <> commented</>, color: 'text-sky-300' };
    default: return { icon: '•', text: <> made an update</>, color: 'text-slate-400' };
  }
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

  // Edit form state
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPriority, setEditPriority] = useState<NCRPriority>('medium');
  const [editDepartment, setEditDepartment] = useState('');
  const [editAssignee, setEditAssignee] = useState('');
  const [editDueDate, setEditDueDate] = useState('');

  // Comment state
  const [commentText, setCommentText] = useState('');
  const [postingComment, setPostingComment] = useState(false);

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

  async function refresh() {
    const refreshed = await getNCRById(id);
    if (refreshed) setNcr(refreshed);
  }

  function startEditing() {
    if (!ncr) return;
    setEditTitle(ncr.title);
    setEditDescription(ncr.description);
    setEditPriority(ncr.priority);
    // For department: if existing value matches a dropdown option use it, else default to first or blank
    setEditDepartment(ncr.department);
    setEditAssignee(ncr.assignee);
    setEditDueDate(toDateInput(ncr.dueDate));
    setIsEditing(true);
  }

  async function saveChanges() {
    if (!ncr) return;
    if (!editTitle.trim() || !editDescription.trim() || !editDepartment || !editAssignee) {
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
        department: editDepartment,
        assignee: editAssignee,
        dueDate: editDueDate || undefined,
      });
      await refresh();
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
      await refresh();
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

  async function handlePostComment() {
    if (!ncr || !commentText.trim()) return;
    try {
      setPostingComment(true);
      await addComment(ncr.id, commentText);
      setCommentText('');
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to post comment');
    } finally {
      setPostingComment(false);
    }
  }

  if (!authChecked || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0B1320' }}>
        <div style={{ color: '#A8B3C7', fontFamily: "'Poppins', sans-serif" }}>Loading…</div>
      </div>
    );
  }

  if (error && !ncr) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: '#0B1320' }}>
        <BrandHeader userEmail={user?.email} showActions={false} backHref="/dashboard" />
        <main className="flex-1 max-w-4xl mx-auto px-6 py-8 w-full">
          <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-sm">{error}</div>
        </main>
        <BrandFooter />
      </div>
    );
  }

  if (!ncr) return null;

  const activity = [...(ncr.activity ?? [])].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0B1320', fontFamily: "'Poppins', sans-serif" }}>
      <BrandHeader userEmail={user?.email} showActions={false} backHref="/dashboard" maxWidth="max-w-4xl" />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-5">

        {/* NCR number + actions */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div style={{ fontFamily: "'Poppins', monospace", fontSize: 22, fontWeight: 700, color: '#00B2FF' }}>{ncr.ncrNumber}</div>
            <p style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Created {formatDateTime(ncr.createdAt)}</p>
          </div>
          {!isEditing && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={startEditing}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, background: '#0F1C30', border: '1px solid rgba(38,132,255,0.2)', color: '#f1f5f9', fontSize: 13, fontFamily: "'Poppins', sans-serif", cursor: 'pointer', fontWeight: 500 }}
              >
                <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                  <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
                </svg>
                Edit
              </button>
              <button
                onClick={() => setShowArchiveConfirm(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)', color: '#fca5a5', fontSize: 13, fontFamily: "'Poppins', sans-serif", cursor: 'pointer', fontWeight: 500 }}
              >
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

        {/* Status buttons */}
        <div className="rounded-xl p-5 space-y-3" style={{ background: '#0F1C30', border: '1px solid rgba(38,132,255,0.15)' }}>
          <div style={{ fontSize: 11, color: '#94a3b8', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600 }}>Status</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {(['open', 'in-progress', 'closed'] as NCRStatus[]).map((s) => {
              const isActive = ncr.status === s;
              return (
                <button
                  key={s}
                  onClick={() => changeStatus(s)}
                  disabled={saving || isActive}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '8px 16px', borderRadius: 8,
                    fontSize: 13, fontWeight: 600,
                    fontFamily: "'Poppins', sans-serif",
                    cursor: isActive ? 'default' : 'pointer',
                    transition: 'all 0.2s',
                    ...(isActive ? {
                      background: s === 'open' ? '#00B2FF' : s === 'in-progress' ? '#f59e0b' : '#10b981',
                      color: '#0B1320',
                      border: 'none',
                      boxShadow: s === 'open' ? '0 0 16px rgba(0,178,255,0.4)' : s === 'in-progress' ? '0 0 16px rgba(245,158,11,0.4)' : '0 0 16px rgba(16,185,129,0.4)',
                    } : {
                      background: '#1A2E4A',
                      color: '#94a3b8',
                      border: '1px solid rgba(38,132,255,0.2)',
                    })
                  }}
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
            <p style={{ fontSize: 12, color: '#34d399', marginTop: 8 }}>✓ Closed on {formatDateTime(ncr.closedAt)}</p>
          )}
        </div>

        {/* Main NCR content — view or edit */}
        {isEditing ? (
          <div className="rounded-xl p-6 space-y-5" style={{ background: '#0F1C30', border: '1px solid rgba(38,132,255,0.15)' }}>
            <Field label="Title" required>
              <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="sqs-input" maxLength={200} />
            </Field>
            <Field label="Description" required>
              <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={5} className="sqs-input resize-y" />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Department dropdown in edit mode */}
              <Field label="Department" required>
                <select value={editDepartment} onChange={(e) => setEditDepartment(e.target.value)} className="sqs-input">
                  <option value="">Select department…</option>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </Field>
              <Field label="Priority" required>
                <select value={editPriority} onChange={(e) => setEditPriority(e.target.value as NCRPriority)} className="sqs-input">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </Field>
              {/* Assignee dropdown in edit mode */}
              <Field label="Assignee" required>
                <select value={editAssignee} onChange={(e) => setEditAssignee(e.target.value)} className="sqs-input">
                  <option value="">Select assignee…</option>
                  {ASSIGNEES.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </Field>
              <Field label="Due Date">
                <input type="date" value={editDueDate} onChange={(e) => setEditDueDate(e.target.value)} className="sqs-input" />
              </Field>
            </div>
            <div style={{ display: 'flex', gap: 10, paddingTop: 8 }}>
              <button
                onClick={saveChanges}
                disabled={saving}
                style={{ padding: '10px 20px', borderRadius: 8, background: 'linear-gradient(135deg, #00B2FF 0%, #2684FF 100%)', color: '#0B1320', fontFamily: "'Poppins', sans-serif", fontSize: 14, fontWeight: 600, border: 'none', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1 }}
              >
                {saving ? 'Saving…' : 'Save changes'}
              </button>
              <button
                onClick={() => setIsEditing(false)}
                disabled={saving}
                style={{ padding: '10px 16px', borderRadius: 8, background: 'transparent', color: '#94a3b8', fontFamily: "'Poppins', sans-serif", fontSize: 14, border: 'none', cursor: 'pointer' }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-xl p-6 space-y-5" style={{ background: '#0F1C30', border: '1px solid rgba(38,132,255,0.15)' }}>
            <div>
              <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Title</div>
              <h2 style={{ fontSize: 22, fontWeight: 600, color: '#f1f5f9' }}>{ncr.title}</h2>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Description</div>
              <p style={{ fontSize: 14, color: '#cbd5e1', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{ncr.description}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
              <DetailField label="Department" value={ncr.department} />
              <DetailField label="Priority">
                <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-medium border ${PRIORITY_STYLES[ncr.priority]}`}>
                  {PRIORITY_LABELS[ncr.priority]}
                </span>
              </DetailField>
              <DetailField label="Assignee" value={ncr.assignee} />
              <DetailField label="Due Date" value={formatDate(ncr.dueDate)} />
              <DetailField label="Reported By" value={ncr.reportedBy} />
              <DetailField label="Status">
                <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-medium border ${STATUS_STYLES[ncr.status]}`}>
                  {STATUS_LABELS[ncr.status]}
                </span>
              </DetailField>
            </div>
          </div>
        )}

        {/* Photo attachment placeholder — ready for Firebase Storage */}
        <div className="rounded-xl p-5" style={{ background: '#0F1C30', border: '1px solid rgba(38,132,255,0.15)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg className="w-5 h-5" style={{ color: '#00B2FF' }} viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
              <span style={{ fontSize: 15, fontWeight: 600, color: '#f1f5f9' }}>Photos & Attachments</span>
            </div>
            <span style={{
              fontSize: 10, fontWeight: 600, color: '#00B2FF',
              background: 'rgba(0,178,255,0.1)', border: '1px solid rgba(0,178,255,0.3)',
              padding: '3px 10px', borderRadius: 20, letterSpacing: '0.1em',
            }}>
              COMING SOON
            </span>
          </div>
          <div style={{
            border: '2px dashed rgba(38,132,255,0.2)',
            borderRadius: 10,
            padding: '28px 20px',
            textAlign: 'center',
            cursor: 'not-allowed',
            opacity: 0.6,
          }}>
            <svg className="w-10 h-10 mx-auto mb-3" style={{ color: '#475569' }} viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
            <p style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>Attach photos, inspection reports, or documents</p>
            <p style={{ fontSize: 11, color: '#475569' }}>Photo attachments will be available in the next release</p>
          </div>
        </div>

        {/* Activity log + comments */}
        <div className="rounded-xl p-6" style={{ background: '#0F1C30', border: '1px solid rgba(38,132,255,0.15)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <svg className="w-5 h-5" style={{ color: '#00B2FF' }} viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: '#f1f5f9' }}>Activity</h3>
            <span style={{ fontSize: 12, color: '#64748b' }}>({activity.length})</span>
          </div>

          {/* Comment composer */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && commentText.trim()) {
                  e.preventDefault();
                  handlePostComment();
                }
              }}
              placeholder="Add a comment…"
              disabled={postingComment}
              className="sqs-input"
              style={{ flex: 1 }}
            />
            <button
              onClick={handlePostComment}
              disabled={postingComment || !commentText.trim()}
              style={{
                padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                fontFamily: "'Poppins', sans-serif", border: 'none', cursor: 'pointer',
                background: commentText.trim() ? 'linear-gradient(135deg, #00B2FF 0%, #2684FF 100%)' : '#1A2E4A',
                color: commentText.trim() ? '#0B1320' : '#475569',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s',
              }}
            >
              {postingComment ? 'Posting…' : 'Post'}
            </button>
          </div>

          {/* Activity feed */}
          {activity.length === 0 ? (
            <p style={{ fontSize: 13, color: '#475569', textAlign: 'center', padding: '16px 0', fontStyle: 'italic' }}>No activity yet</p>
          ) : (
            <div className="space-y-1">
              {activity.map((entry, idx) => {
                const desc = describeActivity(entry);
                const isComment = entry.type === 'comment';
                return (
                  <div key={entry.id} style={{ position: 'relative', paddingLeft: 32, paddingTop: 8, paddingBottom: 8 }}>
                    {idx < activity.length - 1 && (
                      <div style={{ position: 'absolute', left: 14, top: 32, bottom: 0, width: 1, background: '#1A2E4A' }} />
                    )}
                    <div style={{
                      position: 'absolute', left: 0, top: 8,
                      width: 28, height: 28, borderRadius: '50%',
                      background: '#1A2E4A', border: '1px solid rgba(38,132,255,0.2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12,
                    }}>
                      {desc.icon}
                    </div>
                    <div style={{ fontSize: 13 }}>
                      <span style={{ fontWeight: 600, color: '#f1f5f9' }}>{entry.userEmail}</span>
                      <span style={{ color: '#94a3b8' }}>{desc.text}</span>
                      <span style={{ color: '#475569', fontSize: 11, marginLeft: 8 }}>· {relativeTime(entry.timestamp)}</span>
                    </div>
                    {isComment && entry.message && (
                      <div style={{
                        marginTop: 6, padding: '8px 12px', borderRadius: 8,
                        background: 'rgba(38,132,255,0.06)', border: '1px solid rgba(38,132,255,0.15)',
                        fontSize: 13, color: '#cbd5e1', whiteSpace: 'pre-wrap', lineHeight: 1.6,
                      }}>
                        {entry.message}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Timestamps */}
        <div className="rounded-xl p-4" style={{ background: 'rgba(15,28,48,0.5)', border: '1px solid rgba(38,132,255,0.08)' }}>
          <div style={{ fontSize: 11, color: '#475569', display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            <span>Created: {formatDateTime(ncr.createdAt)}</span>
            <span>Updated: {formatDateTime(ncr.updatedAt)}</span>
            {ncr.closedAt && <span>Closed: {formatDateTime(ncr.closedAt)}</span>}
          </div>
        </div>

      </main>

      <BrandFooter />

      {/* Archive confirm modal */}
      {showArchiveConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 50 }}>
          <div style={{ background: '#0F1C30', border: '1px solid rgba(38,132,255,0.2)', borderRadius: 16, maxWidth: 420, width: '100%', padding: 24 }}>
            <h3 style={{ fontSize: 17, fontWeight: 600, color: '#f1f5f9', marginBottom: 8 }}>Move to Recycle Bin?</h3>
            <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 20 }}>
              This NCR will be moved to the Recycle Bin. You can restore it or permanently delete it from there.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowArchiveConfirm(false)} disabled={archiving} style={{ padding: '8px 16px', borderRadius: 8, background: 'transparent', color: '#94a3b8', fontFamily: "'Poppins', sans-serif", fontSize: 13, border: 'none', cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={handleArchive} disabled={archiving} style={{ padding: '8px 16px', borderRadius: 8, background: '#e11d48', color: '#fff', fontFamily: "'Poppins', sans-serif", fontSize: 13, fontWeight: 600, border: 'none', cursor: archiving ? 'not-allowed' : 'pointer', opacity: archiving ? 0.6 : 1 }}>
                {archiving ? 'Moving…' : 'Move to Bin'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .sqs-input {
          width: 100%;
          padding: 0.625rem 0.875rem;
          border-radius: 0.5rem;
          background: #070D17;
          border: 1px solid rgba(38,132,255,0.2);
          color: #f1f5f9;
          font-family: 'Poppins', sans-serif;
          font-size: 0.875rem;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .sqs-input::placeholder { color: #475569; }
        .sqs-input:focus {
          border-color: #00B2FF;
          box-shadow: 0 0 0 2px rgba(0,178,255,0.15);
        }
        .sqs-input option { background: #0F1C30; }
      `}</style>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label style={{ display: 'block' }}>
      <span style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#cbd5e1', marginBottom: 6 }}>
        {label}{required && <span style={{ color: '#00B2FF', marginLeft: 2 }}>*</span>}
      </span>
      {children}
    </label>
  );
}

function DetailField({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>{label}</div>
      {children ?? <div style={{ fontSize: 14, color: '#cbd5e1' }}>{value || '—'}</div>}
    </div>
  );
}

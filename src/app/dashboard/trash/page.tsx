'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getArchivedNCRs, restoreNCR, permanentlyDeleteNCR } from '@/lib/ncr-service';
import { NCR, NCRStatus, NCRPriority } from '@/types/ncr';
import BrandHeader from '../../../components/BrandHeader';
import BrandFooter from '../../../components/BrandFooter';

const STATUS_STYLES: Record<NCRStatus, string> = {
  'open': 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  'in-progress': 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  'closed': 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
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

function formatDate(value: Date | undefined): string {
  if (!value) return '—';
  try {
    const d = value instanceof Date ? value : new Date(value as unknown as string);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  } catch { return '—'; }
}

export default function RecycleBinPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const [ncrs, setNcrs] = useState<NCR[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [processingId, setProcessingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) router.push('/login');
      else setUser(u);
      setAuthChecked(true);
    });
    return () => unsub();
  }, [router]);

  const loadArchived = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getArchivedNCRs();
      setNcrs(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load archived NCRs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    loadArchived();
  }, [user, loadArchived]);

  async function handleRestore(id: string) {
    try {
      setProcessingId(id);
      await restoreNCR(id);
      await loadArchived();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to restore NCR');
    } finally {
      setProcessingId(null);
    }
  }

  async function handlePermanentDelete(id: string) {
    try {
      setProcessingId(id);
      await permanentlyDeleteNCR(id);
      setConfirmDeleteId(null);
      await loadArchived();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete NCR');
    } finally {
      setProcessingId(null);
    }
  }

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400">Loading…</div>
      </div>
    );
  }

  const confirmingNcr = ncrs.find((n) => n.id === confirmDeleteId);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <BrandHeader userEmail={user?.email} showActions={false} backHref="/dashboard" />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-slate-100">Recycle Bin</h1>
          <p className="text-sm text-slate-400 mt-1">Archived NCRs can be restored or permanently deleted.</p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">{error}</div>
        )}

        <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-400">Loading…</div>
          ) : ncrs.length === 0 ? (
            <div className="p-12 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-800 mb-3">
                <svg className="w-6 h-6 text-slate-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-slate-400">Recycle Bin is empty</p>
              <p className="text-xs text-slate-500 mt-1">Archived NCRs will appear here</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-900 border-b border-slate-800">
                  <tr className="text-left text-slate-400">
                    <th className="px-4 py-3 font-medium text-xs uppercase tracking-wide">NCR #</th>
                    <th className="px-4 py-3 font-medium text-xs uppercase tracking-wide">Title</th>
                    <th className="px-4 py-3 font-medium text-xs uppercase tracking-wide">Department</th>
                    <th className="px-4 py-3 font-medium text-xs uppercase tracking-wide">Status</th>
                    <th className="px-4 py-3 font-medium text-xs uppercase tracking-wide">Priority</th>
                    <th className="px-4 py-3 font-medium text-xs uppercase tracking-wide">Archived</th>
                    <th className="px-4 py-3 font-medium text-xs uppercase tracking-wide text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {ncrs.map((n) => {
                    const isProcessing = processingId === n.id;
                    return (
                      <tr key={n.id} className="border-b border-slate-800 last:border-0 hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-3 font-mono text-slate-400">{n.ncrNumber}</td>
                        <td className="px-4 py-3 text-slate-300 max-w-xs truncate">{n.title}</td>
                        <td className="px-4 py-3 text-slate-400">{n.department || '—'}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-block px-2 py-1 rounded-md text-xs font-medium border ${STATUS_STYLES[n.status]}`}>
                            {STATUS_LABELS[n.status]}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-block px-2 py-1 rounded-md text-xs font-medium border ${PRIORITY_STYLES[n.priority]}`}>
                            {PRIORITY_LABELS[n.priority]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-400">{formatDate(n.archivedAt)}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button onClick={() => handleRestore(n.id)} disabled={isProcessing} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-300 text-xs font-medium transition-colors disabled:opacity-50">
                              <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                              </svg>
                              Restore
                            </button>
                            <button onClick={() => setConfirmDeleteId(n.id)} disabled={isProcessing} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-medium transition-colors disabled:opacity-50">
                              <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {!loading && ncrs.length > 0 && (
          <p className="text-xs text-slate-500 mt-3">
            {ncrs.length} archived NCR{ncrs.length !== 1 ? 's' : ''}
          </p>
        )}
      </main>

      <BrandFooter />

      {confirmDeleteId && confirmingNcr && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-slate-100 mb-2">
              Permanently delete {confirmingNcr.ncrNumber}?
            </h3>
            <p className="text-sm text-slate-400 mb-5">
              This action cannot be undone. The NCR and all its data will be permanently removed from the database.
            </p>
            <div className="flex items-center gap-3 justify-end">
              <button onClick={() => setConfirmDeleteId(null)} disabled={processingId === confirmDeleteId} className="px-4 py-2 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-slate-800 transition-colors">Cancel</button>
              <button onClick={() => handlePermanentDelete(confirmDeleteId)} disabled={processingId === confirmDeleteId} className="px-4 py-2 rounded-lg bg-rose-500 hover:bg-rose-400 disabled:opacity-50 text-white text-sm font-medium transition-colors">
                {processingId === confirmDeleteId ? 'Deleting…' : 'Permanently delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

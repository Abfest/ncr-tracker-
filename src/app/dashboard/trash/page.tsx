'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getArchivedNCRs, restoreNCR, permanentlyDeleteNCR } from '@/lib/ncr-service';
import { NCR } from '@/types/ncr';
import BrandHeader from '@/components/BrandHeader';
import BrandFooter from '@/components/BrandFooter';

export default function TrashPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [ncrs, setNcrs] = useState<NCR[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [showEmptyConfirm, setShowEmptyConfirm] = useState(false);
  const [emptyingBin, setEmptyingBin] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) router.push('/login');
      else setUser(u);
      setAuthChecked(true);
    });
    return () => unsub();
  }, [router]);

  useEffect(() => {
    if (!user) return;
    load();
  }, [user]);

  async function load() {
    try {
      setLoading(true);
      const data = await getArchivedNCRs();
      setNcrs(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  async function handleRestore(id: string) {
    try {
      setActionId(id);
      await restoreNCR(id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to restore');
    } finally {
      setActionId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Permanently delete this NCR? This cannot be undone.')) return;
    try {
      setActionId(id);
      await permanentlyDeleteNCR(id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete');
    } finally {
      setActionId(null);
    }
  }

  async function handleEmptyBin() {
    try {
      setEmptyingBin(true);
      await Promise.all(ncrs.map(n => permanentlyDeleteNCR(n.id)));
      setNcrs([]);
      setShowEmptyConfirm(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to empty bin');
    } finally {
      setEmptyingBin(false);
    }
  }

  function formatDate(d: Date | undefined) {
    if (!d) return '—';
    return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  }

  if (!authChecked || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0B1320' }}>
        <div className="text-slate-400" style={{ fontFamily: "'Poppins', sans-serif" }}>Loading…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0B1320', fontFamily: "'Poppins', sans-serif" }}>
      <BrandHeader userEmail={user?.email} showActions={false} backHref="/dashboard" maxWidth="max-w-5xl" />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header row */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-100 flex items-center gap-3">
              <svg className="w-6 h-6 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Recycle Bin
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              {ncrs.length === 0 ? 'Recycle bin is empty.' : `${ncrs.length} NCR${ncrs.length !== 1 ? 's' : ''} in bin. Restore or permanently delete.`}
            </p>
          </div>

          {/* Empty Bin button — only shows when bin has items */}
          {ncrs.length > 0 && (
            <button
              onClick={() => setShowEmptyConfirm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{
                background: 'rgba(244,63,94,0.1)',
                border: '1px solid rgba(244,63,94,0.3)',
                color: '#fca5a5',
                fontFamily: "'Poppins', sans-serif",
              }}
            >
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Empty Bin
            </button>
          )}
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">{error}</div>
        )}

        {ncrs.length === 0 ? (
          <div className="rounded-xl p-16 text-center" style={{ background: '#0F1C30', border: '1px solid rgba(38,132,255,0.1)' }}>
            <svg className="w-12 h-12 text-slate-600 mx-auto mb-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p className="text-slate-500 text-sm">Recycle bin is empty</p>
          </div>
        ) : (
          <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(38,132,255,0.15)' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: '#0F1C30', borderBottom: '1px solid rgba(38,132,255,0.15)' }}>
                  {['NCR #', 'Title', 'Department', 'Archived', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ncrs.map((ncr, idx) => (
                  <tr
                    key={ncr.id}
                    style={{ borderBottom: idx < ncrs.length - 1 ? '1px solid rgba(38,132,255,0.08)' : 'none' }}
                  >
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-[#00B2FF]">{ncr.ncrNumber}</td>
                    <td className="px-4 py-3 text-slate-300">{ncr.title}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{ncr.department}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{formatDate(ncr.archivedAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleRestore(ncr.id)}
                          disabled={actionId === ncr.id}
                          className="px-3 py-1.5 rounded-md text-xs font-medium transition-colors disabled:opacity-50"
                          style={{
                            background: 'rgba(52,211,153,0.1)',
                            border: '1px solid rgba(52,211,153,0.3)',
                            color: '#6ee7b7',
                            fontFamily: "'Poppins', sans-serif",
                          }}
                        >
                          {actionId === ncr.id ? '…' : 'Restore'}
                        </button>
                        <button
                          onClick={() => handleDelete(ncr.id)}
                          disabled={actionId === ncr.id}
                          className="px-3 py-1.5 rounded-md text-xs font-medium transition-colors disabled:opacity-50"
                          style={{
                            background: 'rgba(244,63,94,0.1)',
                            border: '1px solid rgba(244,63,94,0.3)',
                            color: '#fca5a5',
                            fontFamily: "'Poppins', sans-serif",
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      <BrandFooter />

      {/* ── Empty Bin Confirmation Modal ── */}
      {showEmptyConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="rounded-xl max-w-md w-full p-6" style={{ background: '#0F1C30', border: '1px solid rgba(244,63,94,0.3)' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(244,63,94,0.15)' }}>
                <svg className="w-5 h-5 text-rose-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-100">Empty Recycle Bin?</h3>
                <p className="text-xs text-slate-400 mt-0.5">This will permanently delete all {ncrs.length} NCR{ncrs.length !== 1 ? 's' : ''} in the bin.</p>
              </div>
            </div>
            <p className="text-sm text-rose-300 mb-5 p-3 rounded-lg" style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)' }}>
              ⚠️ This action cannot be undone. All audit history will be permanently lost.
            </p>
            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={() => setShowEmptyConfirm(false)}
                disabled={emptyingBin}
                className="px-4 py-2 rounded-lg text-sm text-slate-300 hover:text-white transition-colors"
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
                Cancel
              </button>
              <button
                onClick={handleEmptyBin}
                disabled={emptyingBin}
                className="px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                style={{
                  background: '#e11d48',
                  color: '#ffffff',
                  fontFamily: "'Poppins', sans-serif",
                }}
              >
                {emptyingBin ? 'Deleting…' : 'Yes, empty bin'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

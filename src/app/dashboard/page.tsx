'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getAllNCRs } from '@/lib/ncr-service';
import { NCR, NCRStatus, NCRPriority } from '@/types/ncr';
import BrandHeader from '@/components/BrandHeader';
import BrandFooter from '@/components/BrandFooter';
import { PRIORITY_ORDER, STATUS_ORDER } from '@/lib/constants';

// ── Priority styles — bold, high-contrast ──────────────────────────
const PRIORITY_STYLES: Record<NCRPriority, { pill: string; dot: string; label: string }> = {
  critical: {
    pill: 'bg-rose-500/25 text-rose-300 border border-rose-500/60 font-semibold',
    dot: 'bg-rose-500',
    label: 'Critical',
  },
  high: {
    pill: 'bg-amber-500/25 text-amber-300 border border-amber-500/60 font-semibold',
    dot: 'bg-amber-500',
    label: 'High',
  },
  medium: {
    pill: 'bg-sky-500/20 text-sky-300 border border-sky-500/50',
    dot: 'bg-sky-400',
    label: 'Medium',
  },
  low: {
    pill: 'bg-slate-600/30 text-slate-400 border border-slate-600/50',
    dot: 'bg-slate-500',
    label: 'Low',
  },
};

const STATUS_STYLES: Record<NCRStatus, string> = {
  open: 'bg-sky-500/20 text-sky-300 border border-sky-500/40',
  'in-progress': 'bg-amber-500/20 text-amber-300 border border-amber-500/40',
  closed: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40',
};

const STATUS_LABELS: Record<NCRStatus, string> = {
  open: 'Open',
  'in-progress': 'In Progress',
  closed: 'Closed',
};

type SortKey = 'priority' | 'dueDate' | 'ncrNumber' | 'status' | 'department';
type SortDir = 'asc' | 'desc';

function isoDate(d: Date | undefined): string {
  if (!d) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function isOverdue(ncr: NCR): boolean {
  if (ncr.status === 'closed' || !ncr.dueDate) return false;
  return isoDate(new Date()) > isoDate(ncr.dueDate);
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [ncrs, setNcrs] = useState<NCR[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<NCRStatus | 'all'>('all');
  const [sortKey, setSortKey] = useState<SortKey>('priority');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

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
    (async () => {
      try {
        setLoading(true);
        const data = await getAllNCRs();
        setNcrs(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load NCRs');
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  }

  const filtered = useMemo(() => {
    let result = [...ncrs];

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(n => n.status === statusFilter);
    }

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(n =>
        n.ncrNumber.toLowerCase().includes(q) ||
        n.title.toLowerCase().includes(q) ||
        n.department.toLowerCase().includes(q) ||
        n.assignee.toLowerCase().includes(q) ||
        n.description.toLowerCase().includes(q)
      );
    }

    // Sort
    result.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'priority': {
          // Primary: priority (Critical first)
          const pCmp = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
          if (pCmp !== 0) { cmp = pCmp; break; }
          // Secondary: status (Open before Closed)
          cmp = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
          break;
        }
        case 'status': {
          const sCmp = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
          if (sCmp !== 0) { cmp = sCmp; break; }
          cmp = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
          break;
        }
        case 'dueDate': {
          const aDate = a.dueDate ? isoDate(a.dueDate) : '9999';
          const bDate = b.dueDate ? isoDate(b.dueDate) : '9999';
          cmp = aDate.localeCompare(bDate);
          break;
        }
        case 'ncrNumber':
          cmp = a.ncrNumber.localeCompare(b.ncrNumber);
          break;
        case 'department':
          cmp = a.department.localeCompare(b.department);
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [ncrs, search, statusFilter, sortKey, sortDir]);

  // Stats
  const total = ncrs.length;
  const openCount = ncrs.filter(n => n.status === 'open').length;
  const inProgressCount = ncrs.filter(n => n.status === 'in-progress').length;
  const closedCount = ncrs.filter(n => n.status === 'closed').length;
  const overdueCount = ncrs.filter(isOverdue).length;
  const criticalCount = ncrs.filter(n => n.priority === 'critical' && n.status !== 'closed').length;

  if (!authChecked || loading) {
    return (
      <div className="min-h-screen bg-[#0B1320] flex items-center justify-center">
        <div className="text-slate-400" style={{ fontFamily: "'Poppins', sans-serif" }}>Loading…</div>
      </div>
    );
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <span className="text-slate-600 ml-1">↕</span>;
    return <span className="text-sky-400 ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>;
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0B1320', fontFamily: "'Poppins', sans-serif" }}>
      <BrandHeader userEmail={user?.email} showActions />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {error && (
          <div className="mb-6 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">{error}</div>
        )}

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <StatCard label="Total" value={total} color="text-slate-100" />
          <StatCard label="Open" value={openCount} color="text-sky-300" />
          <StatCard label="In Progress" value={inProgressCount} color="text-amber-300" />
          <StatCard label="Closed" value={closedCount} color="text-emerald-300" />
          <StatCard label="Overdue" value={overdueCount} color="text-rose-400" highlight={overdueCount > 0} />
          <StatCard label="Critical" value={criticalCount} color="text-rose-300" highlight={criticalCount > 0} />
        </div>

        {/* ── Search + Filter ── */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search NCRs by number, title, department, assignee…"
              className="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              style={{ background: '#0F1C30', border: '1px solid rgba(38,132,255,0.2)', fontFamily: "'Poppins', sans-serif" }}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as NCRStatus | 'all')}
            className="px-3 py-2.5 rounded-lg text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500"
            style={{ background: '#0F1C30', border: '1px solid rgba(38,132,255,0.2)', fontFamily: "'Poppins', sans-serif" }}
          >
            <option value="all">All statuses</option>
            <option value="open">Open</option>
            <option value="in-progress">In Progress</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        {/* ── NCR Table ── */}
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(38,132,255,0.15)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: '#0F1C30', borderBottom: '1px solid rgba(38,132,255,0.15)' }}>
                {[
                  { key: 'ncrNumber', label: 'NCR #' },
                  { key: null, label: 'Title' },
                  { key: 'department', label: 'Department' },
                  { key: 'status', label: 'Status' },
                  { key: 'priority', label: 'Priority' },
                  { key: 'dueDate', label: 'Due Date' },
                  { key: null, label: 'Assignee' },
                ].map(({ key, label }) => (
                  <th
                    key={label}
                    onClick={() => key && handleSort(key as SortKey)}
                    className={`px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider ${key ? 'cursor-pointer hover:text-slate-200' : ''}`}
                  >
                    {label}{key && <SortIcon col={key as SortKey} />}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                    {search || statusFilter !== 'all' ? 'No NCRs match your search.' : 'No NCRs yet. Create your first one.'}
                  </td>
                </tr>
              ) : (
                filtered.map((ncr, idx) => {
                  const overdue = isOverdue(ncr);
                  const pri = PRIORITY_STYLES[ncr.priority];
                  return (
                    <tr
                      key={ncr.id}
                      onClick={() => router.push(`/dashboard/${ncr.id}`)}
                      className="cursor-pointer transition-colors hover:bg-white/5"
                      style={{
                        borderBottom: idx < filtered.length - 1 ? '1px solid rgba(38,132,255,0.08)' : 'none',
                        background: ncr.priority === 'critical' && ncr.status !== 'closed'
                          ? 'rgba(244, 63, 94, 0.04)'
                          : 'transparent',
                      }}
                    >
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-[#00B2FF] whitespace-nowrap">
                        {ncr.ncrNumber}
                      </td>
                      <td className="px-4 py-3 text-slate-200 max-w-xs">
                        <div className="flex items-center gap-2">
                          {/* Priority color dot */}
                          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${pri.dot}`} title={pri.label} />
                          <span className="truncate">{ncr.title}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-300 text-xs">{ncr.department}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2.5 py-1 rounded-md text-xs ${STATUS_STYLES[ncr.status]}`}>
                          {STATUS_LABELS[ncr.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2.5 py-1 rounded-md text-xs ${pri.pill}`}>
                          {pri.label}
                        </span>
                      </td>
                      <td className={`px-4 py-3 text-xs whitespace-nowrap ${overdue ? 'text-rose-400 font-semibold' : 'text-slate-300'}`}>
                        {ncr.dueDate ? (
                          <span className="flex items-center gap-1">
                            {overdue && (
                              <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                            )}
                            {ncr.dueDate.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-300 text-xs">{ncr.assignee}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <p className="mt-3 text-xs text-slate-500">
          Showing {filtered.length} of {total} NCRs
        </p>
      </main>

      <BrandFooter />
    </div>
  );
}

function StatCard({ label, value, color, highlight }: {
  label: string; value: number; color: string; highlight?: boolean;
}) {
  return (
    <div
      className="rounded-xl p-4"
      style={{
        background: highlight && value > 0 ? 'rgba(244,63,94,0.08)' : '#0F1C30',
        border: highlight && value > 0
          ? '1px solid rgba(244,63,94,0.3)'
          : '1px solid rgba(38,132,255,0.15)',
      }}
    >
      <div className="text-xs text-slate-400 uppercase tracking-wider mb-2 font-medium">{label}</div>
      <div className={`text-3xl font-bold ${color}`}>{value}</div>
    </div>
  );
}

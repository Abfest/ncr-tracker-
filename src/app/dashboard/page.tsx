'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getAllNCRs } from '@/lib/ncr-service';
import { NCR, NCRStatus, NCRPriority } from '@/types/ncr';
import BrandHeader from '../../components/BrandHeader';
import BrandFooter from '../../components/BrandFooter';

type SortKey = 'ncrNumber' | 'title' | 'department' | 'status' | 'priority' | 'dueDate' | 'assignee';
type SortDir = 'asc' | 'desc';
type StatusFilter = 'all' | NCRStatus;

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
    let d: Date;
    if (typeof value === 'object' && value !== null && 'toDate' in value) {
      d = (value as unknown as { toDate: () => Date }).toDate();
    } else if (value instanceof Date) {
      d = value;
    } else {
      d = new Date(value as unknown as string | number);
    }
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return '—';
  }
}

function toTime(value: Date | undefined): number {
  if (!value) return 0;
  try {
    if (typeof value === 'object' && value !== null && 'toDate' in value) {
      return (value as unknown as { toDate: () => Date }).toDate().getTime();
    }
    if (value instanceof Date) return value.getTime();
    const t = new Date(value as unknown as string | number).getTime();
    return isNaN(t) ? 0 : t;
  } catch {
    return 0;
  }
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  const [ncrs, setNcrs] = useState<NCR[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortKey, setSortKey] = useState<SortKey>('dueDate');
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
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const data = await getAllNCRs();
        if (!cancelled) setNcrs(data);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load NCRs');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const stats = useMemo(() => {
    const total = ncrs.length;
    const open = ncrs.filter((n) => n.status === 'open').length;
    const inProgress = ncrs.filter((n) => n.status === 'in-progress').length;
    const closed = ncrs.filter((n) => n.status === 'closed').length;
    const overdue = ncrs.filter((n) => {
      if (n.status === 'closed') return false;
      const t = toTime(n.dueDate);
      return t > 0 && t < Date.now();
    }).length;
    return { total, open, inProgress, closed, overdue };
  }, [ncrs]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = ncrs.filter((n) => {
      if (statusFilter !== 'all' && n.status !== statusFilter) return false;
      if (!q) return true;
      const hay = [n.ncrNumber, n.title, n.description, n.department, n.assignee, n.reportedBy, n.status, n.priority]
        .map((v) => String(v ?? '').toLowerCase())
        .join(' ');
      return hay.includes(q);
    });

    const priorityRank: Record<NCRPriority, number> = { low: 1, medium: 2, high: 3, critical: 4 };
    const statusRank: Record<NCRStatus, number> = { 'open': 1, 'in-progress': 2, 'closed': 3 };

    list = [...list].sort((a, b) => {
      let av: string | number;
      let bv: string | number;
      if (sortKey === 'dueDate') {
        av = toTime(a.dueDate);
        bv = toTime(b.dueDate);
      } else if (sortKey === 'priority') {
        av = priorityRank[a.priority];
        bv = priorityRank[b.priority];
      } else if (sortKey === 'status') {
        av = statusRank[a.status];
        bv = statusRank[b.status];
      } else {
        av = String(a[sortKey] ?? '').toLowerCase();
        bv = String(b[sortKey] ?? '').toLowerCase();
      }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }, [ncrs, search, statusFilter, sortKey, sortDir]);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400">Loading…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <BrandHeader userEmail={user?.email} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <StatCard label="Total" value={stats.total} tone="slate" />
          <StatCard label="Open" value={stats.open} tone="sky" />
          <StatCard label="In Progress" value={stats.inProgress} tone="amber" />
          <StatCard label="Closed" value={stats.closed} tone="emerald" />
          <StatCard label="Overdue" value={stats.overdue} tone="rose" />
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search NCRs by number, title, department, assignee…"
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="px-4 py-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors"
          >
            <option value="all">All statuses</option>
            <option value="open">Open</option>
            <option value="in-progress">In Progress</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-400">Loading NCRs…</div>
          ) : error ? (
            <div className="p-12 text-center text-rose-400">{error}</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-slate-400 mb-4">
                {ncrs.length === 0 ? 'No NCRs yet.' : 'No NCRs match your filters.'}
              </p>
              {ncrs.length === 0 && (
                <Link
                  href="/dashboard/new"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 text-sm font-medium transition-colors"
                >
                  Create your first NCR
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-900 border-b border-slate-800">
                  <tr className="text-left text-slate-400">
                    <SortableHeader label="NCR #" active={sortKey === 'ncrNumber'} dir={sortDir} onClick={() => handleSort('ncrNumber')} />
                    <SortableHeader label="Title" active={sortKey === 'title'} dir={sortDir} onClick={() => handleSort('title')} />
                    <SortableHeader label="Department" active={sortKey === 'department'} dir={sortDir} onClick={() => handleSort('department')} />
                    <SortableHeader label="Status" active={sortKey === 'status'} dir={sortDir} onClick={() => handleSort('status')} />
                    <SortableHeader label="Priority" active={sortKey === 'priority'} dir={sortDir} onClick={() => handleSort('priority')} />
                    <SortableHeader label="Due Date" active={sortKey === 'dueDate'} dir={sortDir} onClick={() => handleSort('dueDate')} />
                    <SortableHeader label="Assignee" active={sortKey === 'assignee'} dir={sortDir} onClick={() => handleSort('assignee')} />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((n) => {
                    const isOverdue = n.status !== 'closed' && toTime(n.dueDate) > 0 && toTime(n.dueDate) < Date.now();
                    return (
                      <tr
                        key={n.id}
                        onClick={() => router.push(`/dashboard/${n.id}`)}
                        className="border-b border-slate-800 last:border-0 hover:bg-slate-800/40 cursor-pointer transition-colors"
                      >
                        <td className="px-4 py-3 font-mono text-sky-300">{n.ncrNumber}</td>
                        <td className="px-4 py-3 text-slate-100 max-w-xs truncate">{n.title}</td>
                        <td className="px-4 py-3 text-slate-300">{n.department || '—'}</td>
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
                        <td className={`px-4 py-3 ${isOverdue ? 'text-rose-400 font-medium' : 'text-slate-300'}`}>
                          {formatDate(n.dueDate)}
                          {isOverdue && <span className="ml-2 text-xs">⚠</span>}
                        </td>
                        <td className="px-4 py-3 text-slate-300">{n.assignee || '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {!loading && filtered.length > 0 && (
          <p className="text-xs text-slate-500 mt-3">
            Showing {filtered.length} of {ncrs.length} NCRs
          </p>
        )}
      </main>

      <BrandFooter />
    </div>
  );
}

function StatCard({ label, value, tone }: { label: string; value: number; tone: 'slate' | 'sky' | 'amber' | 'emerald' | 'rose' }) {
  const tones: Record<typeof tone, string> = {
    slate: 'text-slate-200',
    sky: 'text-sky-300',
    amber: 'text-amber-300',
    emerald: 'text-emerald-300',
    rose: 'text-rose-300',
  };
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-3">
      <div className="text-xs text-slate-400 uppercase tracking-wide">{label}</div>
      <div className={`text-2xl font-semibold mt-1 ${tones[tone]}`}>{value}</div>
    </div>
  );
}

function SortableHeader({ label, active, dir, onClick }: { label: string; active: boolean; dir: SortDir; onClick: () => void }) {
  return (
    <th
      onClick={onClick}
      className="px-4 py-3 font-medium text-xs uppercase tracking-wide cursor-pointer hover:text-sky-300 transition-colors select-none"
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {active && <span className="text-sky-400">{dir === 'asc' ? '▲' : '▼'}</span>}
      </span>
    </th>
  );
}

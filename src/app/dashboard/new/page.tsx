'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { createNCR } from '@/lib/ncr-service';
import { NCRPriority } from '@/types/ncr';
import BrandHeader from '../../../components/BrandHeader';
import BrandFooter from '../../../components/BrandFooter';

export default function NewNCRPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<NCRPriority>('medium');
  const [department, setDepartment] = useState('');
  const [assignee, setAssignee] = useState('');
  const [dueDate, setDueDate] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) router.push('/login');
      else setUser(u);
      setAuthChecked(true);
    });
    return () => unsub();
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!title.trim()) { setError('Title is required'); return; }
    if (!description.trim()) { setError('Description is required'); return; }
    if (!department.trim()) { setError('Department is required'); return; }
    if (!assignee.trim()) { setError('Assignee is required'); return; }

    try {
      setSubmitting(true);
      await createNCR({
        title: title.trim(),
        description: description.trim(),
        priority,
        department: department.trim(),
        assignee: assignee.trim(),
        dueDate: dueDate || undefined,
      });
      router.push('/dashboard');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create NCR');
      setSubmitting(false);
    }
  }

  if (!authChecked || !user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400">Loading…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <BrandHeader userEmail={user.email} showActions={false} backHref="/dashboard" maxWidth="max-w-3xl" />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-slate-100">New non-conformance report</h1>
          <p className="text-sm text-slate-400 mt-1">Log a new NCR for investigation and resolution.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Field label="Title" required>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Brief summary of the non-conformance" className="input" maxLength={200} />
          </Field>

          <Field label="Description" required>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the non-conformance, including what was observed, where, and any immediate containment actions" rows={5} className="input resize-y" />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="Department" required>
              <input type="text" value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="e.g. Production, QA, Warehouse" className="input" />
            </Field>

            <Field label="Priority" required>
              <select value={priority} onChange={(e) => setPriority(e.target.value as NCRPriority)} className="input">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </Field>

            <Field label="Assignee" required>
              <input type="text" value={assignee} onChange={(e) => setAssignee(e.target.value)} placeholder="Name or email of person responsible" className="input" />
            </Field>

            <Field label="Due Date">
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="input" />
            </Field>
          </div>

          {error && (
            <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">{error}</div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button type="submit" disabled={submitting} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-sky-500 hover:bg-sky-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-medium transition-colors shadow-lg shadow-sky-500/20">
              {submitting ? 'Creating…' : 'Create NCR'}
            </button>
            <Link href="/dashboard" className="px-4 py-2.5 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-slate-800 transition-colors">Cancel</Link>
          </div>
        </form>
      </main>

      <BrandFooter />

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

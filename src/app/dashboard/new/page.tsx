'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { useEffect } from 'react';
import { auth } from '@/lib/firebase';
import { createNCR } from '@/lib/ncr-service';
import { NCRPriority } from '@/types/ncr';
import { DEPARTMENTS, ASSIGNEES } from '@/lib/constants';
import BrandHeader from '@/components/BrandHeader';
import BrandFooter from '@/components/BrandFooter';

export default function NewNCRPage() {
  const router = useRouter();
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
      setAuthChecked(true);
    });
    return () => unsub();
  }, [router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !department || !assignee) {
      setError('Please fill in all required fields.');
      return;
    }
    try {
      setSubmitting(true);
      setError(null);
      const id = await createNCR({ title: title.trim(), description: description.trim(), priority, department, assignee, dueDate: dueDate || undefined });
      router.push(`/dashboard/${id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create NCR');
      setSubmitting(false);
    }
  }

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0B1320' }}>
        <div className="text-slate-400" style={{ fontFamily: "'Poppins', sans-serif" }}>Loading…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0B1320', fontFamily: "'Poppins', sans-serif" }}>
      <BrandHeader showActions={false} backHref="/dashboard" maxWidth="max-w-3xl" />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-slate-100">New Non-Conformance Report</h1>
          <p className="text-sm text-slate-400 mt-1">Fill in all required fields to log a new NCR.</p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-xl p-6 space-y-5" style={{ background: '#0F1C30', border: '1px solid rgba(38,132,255,0.15)' }}>

            <Field label="Title" required>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Brief summary of the issue"
                maxLength={200}
                className="sqs-input"
              />
            </Field>

            <Field label="Description" required>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the non-conformance in detail — what was found, where, and when."
                rows={5}
                className="sqs-input resize-y"
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Department dropdown */}
              <Field label="Department" required>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="sqs-input"
                >
                  <option value="">Select department…</option>
                  {DEPARTMENTS.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </Field>

              {/* Priority */}
              <Field label="Priority" required>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as NCRPriority)}
                  className="sqs-input"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </Field>

              {/* Assignee dropdown */}
              <Field label="Assignee" required>
                <select
                  value={assignee}
                  onChange={(e) => setAssignee(e.target.value)}
                  className="sqs-input"
                >
                  <option value="">Select assignee…</option>
                  {ASSIGNEES.map(a => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </Field>

              {/* Due Date */}
              <Field label="Due Date">
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="sqs-input"
                />
              </Field>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold transition-opacity disabled:opacity-50"
              style={{
                background: 'linear-gradient(135deg, #00B2FF 0%, #2684FF 100%)',
                color: '#0B1320',
                boxShadow: '0 0 20px rgba(0,178,255,0.25)',
                fontFamily: "'Poppins', sans-serif",
              }}
            >
              {submitting ? 'Creating…' : 'Create NCR'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              disabled={submitting}
              className="px-4 py-3 rounded-lg text-sm text-slate-300 hover:text-white transition-colors"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              Cancel
            </button>
          </div>
        </form>
      </main>

      <BrandFooter />

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
          transition: border-color 0.15s, box-shadow 0.15s;
          outline: none;
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
    <label className="block">
      <span className="block text-sm font-medium text-slate-300 mb-1.5">
        {label}{required && <span className="text-[#00B2FF] ml-0.5">*</span>}
      </span>
      {children}
    </label>
  );
}

'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import SQSLogo, { SQSWordmark } from '../../components/SQSLogo';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 relative overflow-hidden">
      {/* Animated starfield background */}
      <div className="absolute inset-0 opacity-40">
        <div className="stars" />
      </div>

      {/* Gradient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative min-h-screen grid lg:grid-cols-2 gap-0">
        {/* Hero side */}
        <div className="hidden lg:flex flex-col justify-center px-12 xl:px-20 py-12">
          <div className="max-w-lg">
            <SQSLogo size={64} showWordmark={false} className="mb-8" />

            <h1 className="text-5xl xl:text-6xl font-semibold leading-tight mb-4">
              <span className="text-slate-100">Leading the </span>
              <span className="bg-gradient-to-r from-sky-300 to-sky-500 bg-clip-text text-transparent">
                Future of Quality
              </span>
            </h1>

            <p className="text-lg text-slate-400 mb-8 tracking-wide">
              Leadership · Strategy · Intelligent Systems
            </p>

            <div className="mb-8">
              <SQSWordmark size="lg" />
            </div>

            <div className="border-t border-slate-800 pt-6 space-y-3">
              <FeatureLine text="Real-time NCR tracking & workflow" />
              <FeatureLine text="Root cause analysis & corrective actions" />
              <FeatureLine text="Audit-ready reporting & traceability" />
            </div>
          </div>
        </div>

        {/* Login side */}
        <div className="flex flex-col justify-center px-6 sm:px-12 py-12">
          <div className="w-full max-w-md mx-auto">
            {/* Mobile-only logo */}
            <div className="lg:hidden flex justify-center mb-8">
              <SQSLogo size={48} showWordmark />
            </div>

            <div className="bg-slate-900/60 backdrop-blur border border-slate-800 rounded-2xl p-8 shadow-2xl">
              <div className="mb-6">
                <h2 className="text-2xl font-semibold text-slate-100 mb-1">
                  NCR Tracker
                </h2>
                <p className="text-sm text-slate-400">
                  Sign in to your workspace
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    required
                    className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors"
                  />
                </div>

                {error && (
                  <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2.5 text-sm text-rose-300">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-4 py-3 rounded-lg bg-sky-500 hover:bg-sky-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-medium transition-colors shadow-lg shadow-sky-500/20"
                >
                  {loading ? 'Signing in…' : 'Sign in'}
                </button>
              </form>
            </div>

            <p className="text-center text-xs text-slate-600 mt-6 tracking-[0.2em] uppercase">
              Antonio Franco · Smart Quality
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        .stars {
          background-image:
            radial-gradient(1px 1px at 20% 30%, rgba(125, 211, 252, 0.8), transparent),
            radial-gradient(1px 1px at 60% 70%, rgba(56, 189, 248, 0.6), transparent),
            radial-gradient(1px 1px at 80% 10%, rgba(125, 211, 252, 0.5), transparent),
            radial-gradient(1px 1px at 40% 80%, rgba(56, 189, 248, 0.4), transparent),
            radial-gradient(2px 2px at 90% 50%, rgba(125, 211, 252, 0.7), transparent),
            radial-gradient(1px 1px at 10% 60%, rgba(56, 189, 248, 0.5), transparent),
            radial-gradient(1px 1px at 70% 20%, rgba(125, 211, 252, 0.6), transparent),
            radial-gradient(1px 1px at 30% 40%, rgba(56, 189, 248, 0.4), transparent);
          background-size: 100% 100%;
          height: 100%;
          width: 100%;
        }
      `}</style>
    </div>
  );
}

function FeatureLine({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3 text-sm text-slate-300">
      <svg className="w-4 h-4 text-sky-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
      <span>{text}</span>
    </div>
  );
}

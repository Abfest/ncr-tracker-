'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import SQSLogo from './SQSLogo';

interface BrandHeaderProps {
  userEmail?: string | null;
  tagline?: string;
  showActions?: boolean;
  backHref?: string;
  maxWidth?: 'max-w-3xl' | 'max-w-4xl' | 'max-w-7xl';
}

export default function BrandHeader({
  userEmail,
  tagline = 'NCR TRACKER',
  showActions = true,
  backHref,
  maxWidth = 'max-w-7xl',
}: BrandHeaderProps) {
  const router = useRouter();

  async function handleSignOut() {
    await signOut(auth);
    router.push('/login');
  }

  return (
    <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur">
      <div className={`${maxWidth} mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          {backHref && (
            <Link
              href={backHref}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label="Back"
            >
              <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </Link>
          )}
          <Link href="/dashboard" className="inline-flex items-center">
            <SQSLogo showWordmark tagline={tagline} size={36} />
          </Link>
          {userEmail && (
            <span className="hidden sm:inline-block text-xs text-slate-500 ml-3 pl-3 border-l border-slate-800">
              {userEmail}
            </span>
          )}
        </div>

        {showActions && (
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/trash"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              title="Recycle Bin"
            >
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="hidden sm:inline">Recycle Bin</span>
            </Link>
            <Link
              href="/dashboard/new"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 text-sm font-medium transition-colors shadow-lg shadow-sky-500/20"
            >
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" />
              </svg>
              New NCR
            </Link>
            <button
              onClick={handleSignOut}
              className="px-3 py-2 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

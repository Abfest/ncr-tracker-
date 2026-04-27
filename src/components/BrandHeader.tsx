'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import SQSLogo from '@/components/SQSLogo';

interface BrandHeaderProps {
  userEmail?: string | null;
  showActions?: boolean;
  backHref?: string;
  maxWidth?: string;
}

export default function BrandHeader({
  userEmail,
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
    <header style={{
      background: 'rgba(7, 13, 23, 0.97)',
      borderBottom: '1px solid rgba(38, 132, 255, 0.2)',
      backdropFilter: 'blur(12px)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      width: '100%',
    }}>
      <div style={{
        maxWidth: 1280,
        margin: '0 auto',
        padding: '0 24px',
        height: 64,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
      }}>

        {/* Left: Logo */}
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          {backHref ? (
            <Link href={backHref} style={{
              fontFamily: "'Poppins', sans-serif",
              fontSize: 13,
              color: '#A8B3C7',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              textDecoration: 'none',
            }}>
              <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Back
            </Link>
          ) : (
            <Link href="/dashboard" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
              <SQSLogo variant="secondary" size={36} />
            </Link>
          )}

          {/* NCR Tracker sub-label */}
          {!backHref && (
            <div style={{
              borderLeft: '1px solid rgba(38, 132, 255, 0.3)',
              paddingLeft: 12,
              marginLeft: 4,
            }}>
              <span style={{
                fontFamily: "'Poppins', sans-serif",
                fontSize: 11,
                fontWeight: 600,
                color: '#00B2FF',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
              }}>
                NCR Tracker
              </span>
            </div>
          )}
        </div>

        {/* Right: Actions */}
        {showActions && (
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            {userEmail && (
              <span style={{
                fontFamily: "'Poppins', sans-serif",
                fontSize: 12,
                color: '#A8B3C7',
                marginRight: 4,
              }}>
                {userEmail}
              </span>
            )}

            <Link href="/dashboard/trash" style={{
              fontFamily: "'Poppins', sans-serif",
              fontSize: 12,
              fontWeight: 500,
              color: '#A8B3C7',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '6px 10px',
              borderRadius: 6,
              textDecoration: 'none',
            }}>
              <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Recycle Bin
            </Link>

            <Link href="/dashboard/new" style={{
              fontFamily: "'Poppins', sans-serif",
              fontSize: 13,
              fontWeight: 600,
              color: '#0B1320',
              background: 'linear-gradient(135deg, #00B2FF 0%, #2684FF 100%)',
              padding: '8px 16px',
              borderRadius: 8,
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              boxShadow: '0 0 20px rgba(0, 178, 255, 0.25)',
              whiteSpace: 'nowrap',
            }}>
              <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              New NCR
            </Link>

            <button onClick={handleSignOut} style={{
              fontFamily: "'Poppins', sans-serif",
              fontSize: 12,
              fontWeight: 500,
              color: '#A8B3C7',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '6px 10px',
              borderRadius: 6,
              whiteSpace: 'nowrap',
            }}>
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRouter, usePathname } from 'next/navigation'
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useTheme } from '@/components/ThemeProvider'
import { useState } from 'react'

interface BrandHeaderProps {
  userEmail?: string | null
  showActions?: boolean
  backHref?: string
  maxWidth?: string
}

export default function BrandHeader({
  userEmail,
  showActions = true,
  backHref,
  maxWidth = 'max-w-7xl',
}: BrandHeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { theme, toggleTheme } = useTheme()
  const [menuOpen, setMenuOpen] = useState(false)

  const isDark = theme === 'dark'
  const headerBg = isDark ? 'rgba(11,19,32,0.97)' : 'rgba(255,255,255,0.97)'
  const headerBorder = isDark ? 'rgba(38,132,255,0.15)' : 'rgba(38,132,255,0.2)'
  const textColor = isDark ? '#94a3b8' : '#475569'
  const btnBorder = isDark ? 'rgba(38,132,255,0.15)' : 'rgba(38,132,255,0.25)'
  const menuBg = isDark ? '#0F1C30' : '#FFFFFF'

  const navLinks = [
    { href: '/dashboard/analytics', label: 'Analytics', icon: '📊' },
    { href: '/dashboard/capa', label: 'CAPA', icon: '🔄' },
    { href: '/dashboard/audit', label: 'Audit', icon: '📋' },
    { href: '/dashboard/import', label: 'Import', icon: '📥' },
    { href: '/dashboard/settings', label: 'Settings', icon: '⚙️' },
    { href: '/recycle-bin', label: 'Recycle Bin', icon: '🗑️' },
  ]

  async function handleSignOut() {
    await signOut(auth)
    router.push('/login')
    setMenuOpen(false)
  }

  return (
    <header style={{ borderBottom: `1px solid ${headerBorder}`, background: headerBg, backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 40 }}>
      <div className={`${maxWidth} mx-auto px-4 sm:px-6 lg:px-8`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56 }}>

        {/* Left — Logo + Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {backHref && (
            <Link href={backHref} style={{ color: textColor, display: 'flex', alignItems: 'center', marginRight: 4 }}>
              <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
            </Link>
          )}
          <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <Image
              src="/brand/sqs-secondary-logo.png"
              alt="Smart Quality Systems"
              width={100}
              height={30}
              style={{ objectFit: 'contain', height: 30, width: 'auto' }}
              priority
            />
            <div style={{ width: '1px', height: 24, background: btnBorder }} />
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#00B2FF', fontFamily: "'Poppins', sans-serif", letterSpacing: '0.06em' }}>NCR RESOLVE</div>
              <div style={{ fontSize: 8, color: textColor, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: "'Poppins', sans-serif" }}>Raise it. Track it. Resolve it.</div>
            </div>
          </Link>
        </div>

        {showActions && (
          <>
            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center gap-2">
              {navLinks.map(link => (
                <Link key={link.href} href={link.href} style={{
                  padding: '5px 11px', borderRadius: 7, fontSize: 12, fontWeight: 500,
                  color: pathname === link.href ? '#00B2FF' : textColor,
                  fontFamily: "'Poppins', sans-serif", textDecoration: 'none',
                  border: `1px solid ${pathname === link.href ? 'rgba(0,178,255,0.4)' : btnBorder}`,
                  background: pathname === link.href ? 'rgba(0,178,255,0.08)' : 'transparent',
                }}>
                  {link.icon} {link.label}
                </Link>
              ))}
              <span style={{ fontSize: 11, color: textColor, padding: '0 6px', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userEmail}</span>
              <button onClick={toggleTheme} title="Toggle theme" style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${btnBorder}`, background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>
                {isDark ? '☀️' : '🌙'}
              </button>
              <Link href="/dashboard/new" style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 13px', borderRadius: 8, background: 'linear-gradient(135deg, #00B2FF 0%, #2684FF 100%)', color: '#0B1320', fontSize: 12, fontWeight: 600, fontFamily: "'Poppins', sans-serif", textDecoration: 'none' }}>
                + New NCR
              </Link>
              <button onClick={handleSignOut} style={{ padding: '6px 10px', borderRadius: 8, background: 'transparent', border: 'none', color: textColor, fontSize: 12, fontFamily: "'Poppins', sans-serif", cursor: 'pointer' }}>
                Sign out
              </button>
            </nav>

            {/* Mobile right side */}
            <div className="flex lg:hidden items-center gap-2">
              <button onClick={toggleTheme} style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${btnBorder}`, background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>
                {isDark ? '☀️' : '🌙'}
              </button>
              <Link href="/dashboard/new" style={{ padding: '6px 12px', borderRadius: 8, background: 'linear-gradient(135deg, #00B2FF 0%, #2684FF 100%)', color: '#0B1320', fontSize: 12, fontWeight: 600, fontFamily: "'Poppins', sans-serif", textDecoration: 'none' }}>
                + New
              </Link>
              {/* Hamburger */}
              <button onClick={() => setMenuOpen(!menuOpen)} style={{ width: 36, height: 36, borderRadius: 8, border: `1px solid ${btnBorder}`, background: 'transparent', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                <span style={{ display: 'block', width: 18, height: 2, background: textColor, borderRadius: 1, transition: 'all 0.2s', transform: menuOpen ? 'rotate(45deg) translate(5px, 5px)' : 'none' }} />
                <span style={{ display: 'block', width: 18, height: 2, background: textColor, borderRadius: 1, transition: 'all 0.2s', opacity: menuOpen ? 0 : 1 }} />
                <span style={{ display: 'block', width: 18, height: 2, background: textColor, borderRadius: 1, transition: 'all 0.2s', transform: menuOpen ? 'rotate(-45deg) translate(5px, -5px)' : 'none' }} />
              </button>
            </div>
          </>
        )}
      </div>

      {/* Mobile dropdown menu */}
      {showActions && menuOpen && (
        <div style={{ background: menuBg, borderTop: `1px solid ${headerBorder}`, padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 6 }} className="lg:hidden">
          {navLinks.map(link => (
            <Link key={link.href} href={link.href} onClick={() => setMenuOpen(false)} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 8,
              fontSize: 14, fontWeight: 500, color: pathname === link.href ? '#00B2FF' : textColor,
              fontFamily: "'Poppins', sans-serif", textDecoration: 'none',
              background: pathname === link.href ? 'rgba(0,178,255,0.08)' : 'transparent',
              border: `1px solid ${pathname === link.href ? 'rgba(0,178,255,0.3)' : 'transparent'}`,
            }}>
              <span style={{ fontSize: 16 }}>{link.icon}</span>
              {link.label}
            </Link>
          ))}
          <div style={{ height: 1, background: headerBorder, margin: '4px 0' }} />
          <div style={{ padding: '6px 14px', fontSize: 12, color: textColor }}>{userEmail}</div>
          <button onClick={handleSignOut} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 8, fontSize: 14, fontWeight: 500, color: '#f43f5e', fontFamily: "'Poppins', sans-serif", background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.15)', cursor: 'pointer', textAlign: 'left', width: '100%' }}>
            <span style={{ fontSize: 16 }}>🚪</span>
            Sign out
          </button>
        </div>
      )}
    </header>
  )
}

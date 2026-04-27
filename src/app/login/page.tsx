'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import SQSLogo from '@/components/SQSLogo';

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
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap"
        rel="stylesheet"
      />
      <div style={{
        minHeight: '100vh',
        background: '#0B1320',
        fontFamily: "'Poppins', sans-serif",
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Background glow */}
        <div style={{
          position: 'absolute', top: -200, left: '50%',
          transform: 'translateX(-50%)',
          width: 800, height: 600,
          background: 'radial-gradient(ellipse, rgba(0,178,255,0.12) 0%, transparent 65%)',
          pointerEvents: 'none',
        }} />

        {/* Dot-grid pattern */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(rgba(38,132,255,0.15) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          pointerEvents: 'none', opacity: 0.4,
        }} />

        <div style={{
          minHeight: '100vh',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          position: 'relative',
        }}>
          {/* ── LEFT: Hero ── */}
          <div style={{
            display: 'flex', flexDirection: 'column',
            justifyContent: 'center', padding: '60px 64px',
          }}>
            <div style={{ maxWidth: 480 }}>
              {/* Single logo — hero side only */}
              <div style={{ marginBottom: 48 }}>
                <SQSLogo variant="secondary" size={44} />
              </div>

              <h1 style={{
                fontSize: 52, fontWeight: 600, lineHeight: 1.1,
                color: '#FFFFFF', marginBottom: 16, letterSpacing: '-0.01em',
              }}>
                Leading the{' '}
                <span style={{
                  background: 'linear-gradient(135deg, #00B2FF 0%, #2684FF 100%)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}>
                  Future of Quality
                </span>
              </h1>

              <p style={{
                fontSize: 13, fontWeight: 300, color: '#A8B3C7',
                letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 48,
              }}>
                Leadership • Strategy • Intelligent Systems
              </p>

              <div style={{ borderTop: '1px solid rgba(38,132,255,0.2)', marginBottom: 28 }} />

              {[
                'Real-time NCR tracking & workflow',
                'Root cause analysis & corrective actions',
                'Audit-ready reporting & traceability',
              ].map((item) => (
                <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%',
                    background: 'rgba(0,178,255,0.15)',
                    border: '1px solid rgba(0,178,255,0.4)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <svg width="10" height="10" viewBox="0 0 20 20" fill="#00B2FF">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span style={{ fontSize: 14, color: '#FFFFFF' }}>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── RIGHT: Login form — NO logo here ── */}
          <div style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', padding: '48px 40px',
          }}>
            <div style={{ width: '100%', maxWidth: 420 }}>
              <div style={{
                background: 'rgba(15, 28, 48, 0.8)',
                border: '1px solid rgba(38, 132, 255, 0.2)',
                borderRadius: 16, padding: 36,
                backdropFilter: 'blur(12px)',
                boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
              }}>
                <div style={{ marginBottom: 28 }}>
                  <h2 style={{ fontSize: 22, fontWeight: 600, color: '#FFFFFF', marginBottom: 6 }}>
                    NCR Tracker
                  </h2>
                  <p style={{ fontSize: 13, color: '#A8B3C7', fontWeight: 300 }}>
                    Sign in to your workspace
                  </p>
                </div>

                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#FFFFFF', marginBottom: 8 }}>
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      required
                      style={{
                        width: '100%', padding: '10px 14px', borderRadius: 8,
                        background: '#070D17', border: '1px solid rgba(38,132,255,0.25)',
                        color: '#FFFFFF', fontSize: 14,
                        fontFamily: "'Poppins', sans-serif", outline: 'none', boxSizing: 'border-box',
                      }}
                      onFocus={(e) => { e.target.style.borderColor = '#00B2FF'; e.target.style.boxShadow = '0 0 0 2px rgba(0,178,255,0.2)'; }}
                      onBlur={(e) => { e.target.style.borderColor = 'rgba(38,132,255,0.25)'; e.target.style.boxShadow = 'none'; }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#FFFFFF', marginBottom: 8 }}>
                      Password
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      style={{
                        width: '100%', padding: '10px 14px', borderRadius: 8,
                        background: '#070D17', border: '1px solid rgba(38,132,255,0.25)',
                        color: '#FFFFFF', fontSize: 14,
                        fontFamily: "'Poppins', sans-serif", outline: 'none', boxSizing: 'border-box',
                      }}
                      onFocus={(e) => { e.target.style.borderColor = '#00B2FF'; e.target.style.boxShadow = '0 0 0 2px rgba(0,178,255,0.2)'; }}
                      onBlur={(e) => { e.target.style.borderColor = 'rgba(38,132,255,0.25)'; e.target.style.boxShadow = 'none'; }}
                    />
                  </div>

                  {error && (
                    <div style={{
                      borderRadius: 8, border: '1px solid rgba(248,113,113,0.3)',
                      background: 'rgba(248,113,113,0.1)', padding: '10px 14px',
                      fontSize: 13, color: '#FCA5A5',
                    }}>
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      width: '100%', padding: '12px', borderRadius: 8,
                      background: loading ? '#1A2E4A' : 'linear-gradient(135deg, #00B2FF 0%, #2684FF 100%)',
                      color: loading ? '#A8B3C7' : '#0B1320',
                      fontFamily: "'Poppins', sans-serif", fontSize: 14, fontWeight: 600,
                      border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                      boxShadow: loading ? 'none' : '0 0 24px rgba(0,178,255,0.3)',
                    }}
                  >
                    {loading ? 'Signing in…' : 'Sign in'}
                  </button>
                </form>
              </div>

              <p style={{
                marginTop: 24, fontSize: 11, color: '#475569',
                letterSpacing: '0.2em', textTransform: 'uppercase', textAlign: 'center',
              }}>
                ANTONIO FRANCO · SMART QUALITY SYSTEMS
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

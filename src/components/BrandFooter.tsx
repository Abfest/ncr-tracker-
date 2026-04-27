'use client';

export default function BrandFooter() {
  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600&display=swap"
        rel="stylesheet"
      />
      <footer
        style={{
          borderTop: '1px solid rgba(38, 132, 255, 0.15)',
          background: 'rgba(7, 13, 23, 0.8)',
          padding: '16px 24px',
        }}
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          {/* Left: Powered by */}
          <div className="flex items-center gap-2">
            <span
              style={{
                fontFamily: "'Poppins', sans-serif",
                fontSize: 11,
                color: '#A8B3C7',
                letterSpacing: '0.05em',
              }}
            >
              Powered by
            </span>
            <span
              style={{
                fontFamily: "'Poppins', sans-serif",
                fontSize: 11,
                fontWeight: 600,
                color: '#FFFFFF',
                letterSpacing: '0.08em',
              }}
            >
              SMART
            </span>
            <span
              style={{
                fontFamily: "'Poppins', sans-serif",
                fontSize: 11,
                color: '#2684FF',
                fontWeight: 300,
              }}
            >
              |
            </span>
            <span
              style={{
                fontFamily: "'Poppins', sans-serif",
                fontSize: 11,
                fontWeight: 600,
                color: '#00B2FF',
                letterSpacing: '0.08em',
              }}
            >
              QUALITY SYSTEMS
            </span>
          </div>

          {/* Right: Tagline */}
          <span
            style={{
              fontFamily: "'Poppins', sans-serif",
              fontSize: 10,
              color: '#A8B3C7',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
            }}
          >
            LEADERSHIP • STRATEGY • INTELLIGENT SYSTEMS
          </span>
        </div>
      </footer>
    </>
  );
}

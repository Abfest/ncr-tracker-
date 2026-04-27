'use client';

import Image from 'next/image';

interface SQSLogoProps {
  size?: number;
  className?: string;
  variant?: 'primary' | 'secondary' | 'icon';
  // Legacy props — kept so existing callers don't break
  showWordmark?: boolean;
  tagline?: boolean;
}

/**
 * Smart Quality Systems brand signature.
 * Uses real PNG files from /public/brand/
 *
 * variant='secondary'  → S mark + divider + ANTONIO FRANCO / SMART QUALITY SYSTEMS (header use)
 * variant='primary'    → S mark + full wordmark + tagline (login hero)
 * variant='icon'       → S mark only (compact spaces)
 *
 * Usage:
 *   <SQSLogo variant="secondary" size={40} />   → header
 *   <SQSLogo variant="primary"   size={80} />   → login hero
 *   <SMarkIcon size={36} />                     → icon only
 */
export default function SQSLogo({
  size = 40,
  className = '',
  variant = 'secondary',
}: SQSLogoProps) {
  if (variant === 'primary') {
    // sqs-primary-logo.png is 600x202 → aspect 2.97:1
    const w = Math.round(size * 2.97);
    return (
      <div className={className} style={{ display: 'inline-block', lineHeight: 0 }}>
        <Image
          src="/brand/sqs-primary-logo.png"
          alt="Antonio Franco - Smart Quality Systems"
          width={w}
          height={size}
          priority
          style={{ objectFit: 'contain' }}
        />
      </div>
    );
  }

  if (variant === 'icon') {
    // sqs-icon-s.png is 164x116 → aspect 1.41:1
    const w = Math.round(size * 1.41);
    return (
      <div className={className} style={{ display: 'inline-block', lineHeight: 0 }}>
        <Image
          src="/brand/sqs-icon-s.png"
          alt="Smart Quality Systems"
          width={w}
          height={size}
          priority
          style={{ objectFit: 'contain' }}
        />
      </div>
    );
  }

  // Default: secondary — sqs-secondary-logo.png is 558x120 → aspect 4.65:1
  const w = Math.round(size * 4.65);
  return (
    <div className={className} style={{ display: 'inline-block', lineHeight: 0 }}>
      <Image
        src="/brand/sqs-secondary-logo.png"
        alt="Antonio Franco - Smart Quality Systems"
        width={w}
        height={size}
        priority
        style={{ objectFit: 'contain' }}
      />
    </div>
  );
}

/**
 * Just the S mark — for tight header spaces.
 * Uses sqs-icon-s.png (164x116)
 */
export function SMarkIcon({ size = 40, className = '' }: { size?: number; className?: string }) {
  const w = Math.round(size * 1.41);
  return (
    <Image
      src="/brand/sqs-icon-s.png"
      alt="Smart Quality Systems"
      width={w}
      height={size}
      priority
      className={className}
      style={{ objectFit: 'contain' }}
    />
  );
}

/**
 * Brand icon — S in rounded square. Use for app icon / social media.
 * Uses sqs-brand-icon.png (146x124 → roughly square)
 */
export function SQSBrandIcon({ size = 40, className = '' }: { size?: number; className?: string }) {
  return (
    <Image
      src="/brand/sqs-brand-icon.png"
      alt="Smart Quality Systems"
      width={size}
      height={size}
      priority
      className={className}
      style={{ objectFit: 'contain' }}
    />
  );
}

/**
 * Full hero wordmark for login page.
 */
export function SQSWordmark({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  const heights = { sm: 40, md: 60, lg: 80, xl: 100 };
  return <SQSLogo variant="primary" size={heights[size]} />;
}

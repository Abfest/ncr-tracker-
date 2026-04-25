'use client';

import Image from 'next/image';

interface SQSLogoProps {
  size?: number;
  className?: string;
  /**
   * @deprecated The wordmark is part of the logo image now — toggle has no effect.
   * Kept in the API so existing callers don't break.
   */
  showWordmark?: boolean;
  tagline?: string;
}

/**
 * Smart Quality brand signature.
 * Uses the actual logo image (Antonio Franco / Smart Quality wordmark + S mark).
 *
 * The logo image lives at /public/sqs-logo.png and contains the full lockup,
 * so showWordmark is no longer needed — the wordmark is baked in.
 *
 * Usage:
 *   <SQSLogo size={32} />                           → just the logo, header size
 *   <SQSLogo size={64} tagline="NCR TRACKER" />     → logo + tagline below
 */
export default function SQSLogo({
  size = 40,
  className = '',
  tagline,
}: SQSLogoProps) {
  // The logo image is 340x106, so aspect ratio ~3.21:1
  // We'll size by height and let width scale naturally
  const aspectRatio = 340 / 106;
  const width = Math.round(size * aspectRatio);
  const height = size;

  return (
    <div className={`inline-flex flex-col ${className}`}>
      <Image
        src="/sqs-logo.png"
        alt="Antonio Franco - Smart Quality"
        width={width}
        height={height}
        priority
        className="object-contain"
      />
      {tagline && (
        <span className="text-sky-400 font-light tracking-[0.25em] text-[10px] mt-1.5 ml-1">
          {tagline}
        </span>
      )}
    </div>
  );
}

/**
 * Just the S mark portion (for favicons or compact spaces).
 * Since we're using the image, we slice out just the left portion via CSS.
 */
export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <div
      className="inline-block bg-no-repeat bg-contain bg-left"
      style={{
        width: size,
        height: size,
        backgroundImage: 'url(/sqs-logo.png)',
        backgroundSize: 'auto 100%',
      }}
      aria-label="Smart Quality logo"
    />
  );
}

/**
 * Full Smart Quality wordmark.
 * Same image as SQSLogo but at a larger fixed size for hero/login moments.
 */
export function SQSWordmark({ size = 'md' }: { size?: 'md' | 'lg' | 'xl' }) {
  const heights = {
    md: 48,
    lg: 72,
    xl: 96,
  };
  return <SQSLogo size={heights[size]} />;
}

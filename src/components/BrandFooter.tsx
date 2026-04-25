'use client';

import { LogoMark } from './SQSLogo';

export default function BrandFooter() {
  return (
    <footer className="border-t border-slate-800/50 bg-slate-950/50 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <LogoMark size={18} />
          <span>
            Powered by{' '}
            <span className="text-slate-400 font-medium tracking-wider">
              SMART
            </span>
            <span className="text-sky-500/70 mx-1">|</span>
            <span className="text-sky-400/80 font-medium tracking-wider">
              QUALITY
            </span>
          </span>
        </div>
        <div className="text-[11px] text-slate-600 tracking-[0.2em] uppercase">
          Leading the Future of Quality
        </div>
      </div>
    </footer>
  );
}

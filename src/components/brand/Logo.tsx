import { useState } from 'react';
import { brandNameAr, brandNameEn } from '../../brand/brand';

type LogoProps = { className?: string; compact?: boolean };

export function Logo({ className = '', compact = false }: LogoProps) {
  const [failed, setFailed] = useState(false);
  const label = `${brandNameAr} | ${brandNameEn}`;

  if (failed) {
    return <span className={`brand-placeholder ${compact ? 'brand-placeholder--compact' : ''} ${className}`.trim()} aria-label={label}>
      <span dir="rtl">{brandNameAr}</span>
      {!compact && <span className="brand-placeholder__english">{brandNameEn}</span>}
    </span>;
  }

  return <img className={`brand-logo ${className}`.trim()} src="/brand/logo.svg" alt={label} onError={() => setFailed(true)} />;
}

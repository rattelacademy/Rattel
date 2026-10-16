import type { HTMLAttributes } from 'react';

export type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger' | 'gold';

type BadgeProps = HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone };

export function Badge({ tone = 'neutral', className = '', ...props }: BadgeProps) {
  return <span className={`ui-badge ui-badge--${tone} ${className}`.trim()} {...props} />;
}

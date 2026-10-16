import type { HTMLAttributes } from 'react';

export type AlertUrgency = 'critical' | 'high' | 'routine';

type ActionAlertProps = Omit<HTMLAttributes<HTMLElement>, 'title'> & {
  urgency: AlertUrgency;
  title: string;
  description: string;
  actionLabel: string;
  itemHref: string;
};

export function ActionAlert({ urgency, title, description, actionLabel, itemHref, className = '', ...props }: ActionAlertProps) {
  if (!itemHref.trim() || itemHref === '#') {
    throw new Error('Action alerts require a deep link to the exact item.');
  }

  return (
    <aside className={`ui-action-alert ui-action-alert--${urgency} ${className}`.trim()} aria-label={title} {...props}>
      <div className="ui-action-alert__content">
        <strong>{title}</strong>
        <span>{description}</span>
      </div>
      <a className="ui-action-alert__action" href={itemHref}>{actionLabel}</a>
    </aside>
  );
}

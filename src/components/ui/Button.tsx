import type { ButtonHTMLAttributes } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'gold' | 'danger';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: 'sm' | 'md' | 'lg';
};

export function Button({ variant = 'primary', size = 'md', className = '', ...props }: ButtonProps) {
  return <button className={`ui-button ui-button--${variant} ui-button--${size} ${className}`.trim()} {...props} />;
}

import { useId } from 'react';
import type { InputHTMLAttributes } from 'react';

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
  error?: string;
};

export function TextField({ label, hint, error, id, className = '', ...props }: TextFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const descriptionId = `${inputId}-description`;
  const message = error ?? hint;

  return (
    <div className="ui-field">
      <label className="ui-field__label" htmlFor={inputId}>{label}</label>
      <input
        id={inputId}
        className={`ui-input ${error ? 'ui-input--error' : ''} ${className}`.trim()}
        aria-invalid={Boolean(error)}
        aria-describedby={message ? descriptionId : undefined}
        {...props}
      />
      {message && <span id={descriptionId} className={`ui-field__message ${error ? 'ui-field__message--error' : ''}`}>{message}</span>}
    </div>
  );
}

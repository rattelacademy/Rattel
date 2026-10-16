import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { brandNameAr, brandNameEn } from '../../brand/brand';
import { Logo } from '../brand/Logo';
import { ActionAlert } from './ActionAlert';
import { TextField } from './TextField';

describe('shared component library', () => {
  it('keeps an action button inside its alert and links to the exact item', () => {
    render(<ActionAlert urgency="critical" title="جلسة قريبة" description="ابدأ الجلسة" actionLabel="فتح الجلسة" itemHref="/sessions/lesson-123" />);
    const alert = screen.getByRole('complementary', { name: 'جلسة قريبة' });
    expect(alert).toContainElement(screen.getByRole('link', { name: 'فتح الجلسة' }));
    expect(screen.getByRole('link', { name: 'فتح الجلسة' })).toHaveAttribute('href', '/sessions/lesson-123');
  });

  it('rejects an alert action without an item deep link', () => {
    expect(() => render(<ActionAlert urgency="routine" title="تنبيه" description="وصف" actionLabel="فتح" itemHref="#" />)).toThrow(/deep link/i);
  });

  it('connects field labels and validation messages accessibly', () => {
    render(<TextField label="البريد الإلكتروني" error="صيغة غير صحيحة" />);
    expect(screen.getByLabelText('البريد الإلكتروني')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('صيغة غير صحيحة')).toBeVisible();
  });

  it('shows the canonical text fallback if the logo file cannot load', () => {
    render(<Logo />);
    fireEvent.error(screen.getByRole('img'));
    expect(screen.getByLabelText(`${brandNameAr} | ${brandNameEn}`)).toBeVisible();
  });
});

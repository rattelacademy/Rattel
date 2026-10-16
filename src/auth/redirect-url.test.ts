import { describe, expect, it } from 'vitest';
import { getAuthCallbackUrl } from './redirect-url';

describe('auth callback URL', () => {
  it('uses the current production origin', () => {
    expect(getAuthCallbackUrl('https://rattelacademy.pages.dev'))
      .toBe('https://rattelacademy.pages.dev/auth/callback');
  });

  it('keeps Cloudflare preview URLs on their own deployment origin', () => {
    expect(getAuthCallbackUrl('https://604b9559.rattelacademy.pages.dev'))
      .toBe('https://604b9559.rattelacademy.pages.dev/auth/callback');
  });

  it('rejects non-web origins', () => {
    expect(() => getAuthCallbackUrl('javascript:alert(1)')).toThrow(/HTTP or HTTPS/);
  });
});

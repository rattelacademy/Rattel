import { useState, type FormEvent } from 'react';
import { brandNameAr, brandNameEn } from '../brand/brand';
import { Logo } from '../components/brand';
import { Button, Card, TextField } from '../components/ui';
import { getAuthCallbackUrl } from './redirect-url';
import type { SupabaseClient } from '@supabase/supabase-js';
import './auth.css';

type SignInProps = { client: SupabaseClient | null; configurationError?: string };

export function SignIn({ client, configurationError }: SignInProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(configurationError ?? '');

  async function signInWithPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!client || busy) return;
    setError('');
    setBusy(true);
    const { error: authError } = await client.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (authError) setError('تعذر تسجيل الدخول بهذه البيانات. تحقق منها وحاول مجددًا.');
  }

  async function signInWithGitHub() {
    if (!client || busy) return;
    setError('');
    setBusy(true);
    const { error: authError } = await client.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: getAuthCallbackUrl() },
    });
    setBusy(false);
    if (authError) setError('تعذر بدء الدخول عبر GitHub. حاول مرة أخرى أو استخدم البريد الإلكتروني.');
  }

  return (
    <main className="signin-page" dir="rtl">
      <Card className="signin-card">
        <div className="signin-topline"><span>المساعدة الفنية</span><span>العربية</span></div>
        <div className="signin-brand"><Logo /><p>{brandNameAr} <span>|</span> {brandNameEn}</p><h1>أكاديمية {brandNameAr} للقرآن الكريم</h1><p>منصة تعليمية للحلقات الفردية والمتابعة الأكاديمية</p></div>
        <div className="signin-steps" aria-label="خطوات تسجيل الدخول"><span className="is-current">١. وسيلة الدخول</span><span>٢. رمز التحقق (MFA)</span></div>
        <form className="signin-form" onSubmit={signInWithPassword}>
          <TextField label="البريد الإلكتروني" type="email" autoComplete="username" required value={email} onChange={event => setEmail(event.target.value)} placeholder="name@example.com" />
          <TextField label="كلمة المرور" type="password" autoComplete="current-password" required value={password} onChange={event => setPassword(event.target.value)} placeholder="••••••••" />
          {error && <p className="signin-error" role="alert">{error}</p>}
          <Button type="submit" size="lg" disabled={!client || busy}>{busy ? 'جارٍ التحقق…' : 'الدخول إلى حسابي'}</Button>
        </form>
        <div className="signin-divider"><span>أو</span></div>
        <Button variant="secondary" size="lg" type="button" disabled={!client || busy} onClick={signInWithGitHub}>المتابعة باستخدام GitHub</Button>
        <p className="signin-invite-note">الدخول متاح للحسابات التي أضافتها الأكاديمية فقط.</p>
      </Card>
      <footer className="signin-footer">نظام آمن ومشفر بأعلى معايير حماية البيانات.</footer>
    </main>
  );
}

export function MfaChallenge({ client, factorId, onCancel, onVerified }: { client: SupabaseClient; factorId: string; onCancel: () => void; onVerified: () => void }) {
  const [code, setCode] = useState('');
  const [challengeId, setChallengeId] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function startChallenge() {
    setBusy(true);
    const { data, error: challengeError } = await client.auth.mfa.challenge({ factorId });
    setBusy(false);
    if (challengeError) setError('تعذر إرسال رمز التحقق. حاول مجددًا.');
    else setChallengeId(data.id);
  }

  async function verify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!challengeId || code.length !== 6) return;
    setBusy(true);
    const { error: verifyError } = await client.auth.mfa.verify({ factorId, challengeId, code });
    setBusy(false);
    if (verifyError) setError('رمز التحقق غير صحيح أو انتهت صلاحيته.');
    else onVerified();
  }

  return (
    <main className="signin-page" dir="rtl">
      <Card className="signin-card signin-card--mfa">
        <Logo />
        <p className="eyebrow">التحقق بخطوتين</p>
        <h1>أدخل رمز التحقق</h1>
        <p>أدخل الرمز المكوّن من ستة أرقام من وسيلة التحقق المسجلة لحسابك.</p>
        {error && <p className="signin-error" role="alert">{error}</p>}
        {!challengeId ? <Button type="button" size="lg" disabled={busy} onClick={() => void startChallenge()}>{busy ? 'جارٍ الإرسال…' : 'إرسال رمز التحقق'}</Button> : (
          <form className="signin-form" onSubmit={verify}>
            <TextField label="رمز التحقق" inputMode="numeric" autoComplete="one-time-code" maxLength={6} required value={code} onChange={event => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))} />
            <Button type="submit" size="lg" disabled={busy || code.length !== 6}>{busy ? 'جارٍ التحقق…' : 'تأكيد الرمز'}</Button>
          </form>
        )}
        <button type="button" className="signin-text-button" onClick={onCancel}>تسجيل الخروج</button>
      </Card>
    </main>
  );
}

import { useEffect, useState } from 'react';
import { getSupabaseClient } from '../lib/supabase';

type CallbackState = 'checking' | 'error';

export function AuthCallback() {
  const [state, setState] = useState<CallbackState>('checking');
  const [message, setMessage] = useState('جارٍ التحقق من جلسة الدخول…');

  useEffect(() => {
    let active = true;

    void Promise.resolve().then(() => getSupabaseClient().auth.getSession()).then(({ data, error }) => {
      if (!active) return;
      if (error || !data.session) {
        setMessage('تعذر إكمال تسجيل الدخول. أعد المحاولة من صفحة الدخول.');
        setState('error');
        return;
      }
      window.location.replace('/');
    }).catch(() => {
      if (!active) return;
      setMessage('تعذر الاتصال بخدمة تسجيل الدخول. تحقق من إعدادات الربط وحاول مجددًا.');
      setState('error');
    });

    return () => { active = false; };
  }, []);

  return (
    <main className="auth-callback" aria-live="polite">
      <section className="auth-callback__card">
        <p className="eyebrow">تسجيل الدخول</p>
        <h1>{state === 'checking' ? 'إكمال تسجيل الدخول' : 'لم يكتمل تسجيل الدخول'}</h1>
        <p>{message}</p>
        {state === 'error' && <a className="ui-action-alert__action" href="/">العودة للتطبيق</a>}
      </section>
    </main>
  );
}

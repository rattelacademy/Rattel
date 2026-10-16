import { useEffect, useMemo, useState, type MouseEvent } from 'react';
import type { User, SupabaseClient } from '@supabase/supabase-js';
import { appRoles, type ActorIdentity, type AppRole } from './auth/roles';
import { SignIn, MfaChallenge } from './auth/SignIn';
import { AppScreen } from './screens/AppScreens';
import { appScreens, defaultScreenForRole, screenForPath, type ScreenDefinition } from './screens/screen-definitions';
import { getSupabaseClient } from './lib/supabase';
import { Logo } from './components/brand';
import { Badge, Button, Card } from './components/ui';
import './components/ui/components.css';
import './styles/global.css';
import './app.css';
import './screens/screens.css';

type AppState = 'loading' | 'ready' | 'configuration-error';
const roleLabels: Record<AppRole, string> = { owner: 'مالك الأكاديمية', teacher: 'معلم', parent: 'ولي أمر' };

function isAppRole(value: string): value is AppRole {
  return appRoles.includes(value as AppRole);
}

function AuthLoading({ message }: { message: string }) {
  return <main className="auth-loading" dir="rtl"><Logo /><p>{message}</p></main>;
}

function NoRoleScreen({ onSignOut }: { onSignOut: () => void }) {
  return <main className="access-screen" dir="rtl"><Card className="access-card"><Logo /><Badge tone="warning">الحساب غير مربوط بدور</Badge><h1>لم تُمنح صلاحية دخول بعد</h1><p>تواصل مع مالك الأكاديمية لربط حسابك بدور معتمد. لا يمكن للمستخدم اختيار صلاحياته بنفسه.</p><Button variant="secondary" onClick={onSignOut}>تسجيل الخروج</Button></Card></main>;
}

function RolePicker({ roles, activeRole, onChange }: { roles: readonly AppRole[]; activeRole: AppRole; onChange: (role: AppRole) => void }) {
  if (roles.length < 2) return <Badge tone="gold">{roleLabels[activeRole]}</Badge>;
  return <label className="role-picker"><span>الدور الحالي</span><select value={activeRole} onChange={event => onChange(event.target.value as AppRole)}>{roles.map(role => <option value={role} key={role}>{roleLabels[role]}</option>)}</select></label>;
}

function Workspace({ client, user, actor, roles }: { client: SupabaseClient; user: User; actor: ActorIdentity; roles: readonly AppRole[] }) {
  const [activeRole, setActiveRole] = useState<AppRole>(() => roles.includes('owner') ? 'owner' : roles[0]);
  const [activeScreen, setActiveScreen] = useState<ScreenDefinition | undefined>(() => screenForPath(window.location.pathname));
  const displayName = user.user_metadata?.display_name || user.user_metadata?.full_name || user.email || 'حساب الأكاديمية';
  const accessibleScreens = useMemo(() => appScreens.filter(screen => screen.roles.includes(activeRole)), [activeRole]);

  useEffect(() => {
    const update = () => setActiveScreen(screenForPath(window.location.pathname));
    window.addEventListener('popstate', update);
    if (!screenForPath(window.location.pathname)) {
      const destination = defaultScreenForRole(activeRole).href;
      window.history.replaceState(null, '', destination);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
    return () => window.removeEventListener('popstate', update);
  }, [activeRole]);

  function navigate(href: string) {
    window.history.pushState(null, '', href);
    setActiveScreen(screenForPath(window.location.pathname));
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const fragment = new URL(href, window.location.origin).hash.slice(1);
    if (fragment) window.setTimeout(() => document.getElementById(decodeURIComponent(fragment))?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 0);
  }

  function navigateLink(event: MouseEvent<HTMLElement>) {
    const target = event.target;
    const link = target instanceof Element ? target.closest('a[href^="/app/"]') : null;
    const href = link?.getAttribute('href');
    if (!href?.startsWith('/app/')) return;
    event.preventDefault();
    navigate(href);
  }

  const permittedScreen = activeScreen && accessibleScreens.some(screen => screen.id === activeScreen.id) ? activeScreen : undefined;
  const hasPageAccess = Boolean(permittedScreen);
  const actorForRole = useMemo(() => ({ ...actor, roles: [activeRole] }), [actor, activeRole]);

  return <div className="workspace" dir="rtl" onClick={navigateLink}>
    <header className="workspace-header">
      <button className="workspace-brand" type="button" onClick={() => navigate(defaultScreenForRole(activeRole).href)} aria-label="الذهاب إلى الرئيسية"><Logo compact /><span><strong>{activeScreen?.title ?? 'الرئيسية'}</strong><small>{roleLabels[activeRole]}</small></span></button>
      <div className="workspace-header__actions"><RolePicker roles={roles} activeRole={activeRole} onChange={role => { setActiveRole(role); navigate(defaultScreenForRole(role).href); }} /><a className="header-icon" href="/app/notifications" aria-label="الإشعارات"><span className="material-symbols-outlined" aria-hidden="true">notifications</span></a><button className="header-icon" type="button" aria-label="تسجيل الخروج" onClick={() => void client.auth.signOut()}><span className="material-symbols-outlined" aria-hidden="true">account_circle</span><span className="sr-only">تسجيل الخروج ({displayName})</span></button></div>
    </header>
    <aside className="workspace-sidebar" aria-label="التنقل الرئيسي"><nav>{accessibleScreens.map(screen => <a key={screen.id} href={screen.href} aria-current={permittedScreen?.id === screen.id ? 'page' : undefined} className={permittedScreen?.id === screen.id ? 'is-active' : ''}><span className="material-symbols-outlined" aria-hidden="true">{screen.icon}</span><span>{screen.shortTitle}</span></a>)}</nav><button className="sidebar-signout" type="button" onClick={() => void client.auth.signOut()}><span className="material-symbols-outlined" aria-hidden="true">logout</span>تسجيل الخروج</button></aside>
    <main id="main-content" className="workspace-main">
      {hasPageAccess ? <AppScreen screen={permittedScreen!} actor={actorForRole} client={client} displayName={displayName} /> : <Card className="access-card"><h1>هذه الشاشة غير متاحة لهذا الدور</h1><p>اختر صفحة من قائمة التنقل المسموح بها.</p><Button onClick={() => navigate(defaultScreenForRole(activeRole).href)}>العودة للرئيسية</Button></Card>}
    </main>
    <nav className="workspace-bottom-nav" aria-label="التنقل السريع">{accessibleScreens.slice(0, 4).map(screen => <a key={screen.id} href={screen.href} aria-current={permittedScreen?.id === screen.id ? 'page' : undefined}><span className="material-symbols-outlined" aria-hidden="true">{screen.icon}</span><span>{screen.shortTitle}</span></a>)}</nav>
  </div>;
}

export function App() {
  const [client] = useState<SupabaseClient | null>(() => {
    try { return getSupabaseClient(); } catch { return null; }
  });
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<readonly AppRole[]>([]);
  const [rolesForUser, setRolesForUser] = useState<string | null>(null);
  const [appState, setAppState] = useState<AppState>(client ? 'loading' : 'configuration-error');
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);
  const [mfaUserId, setMfaUserId] = useState<string | null>(null);
  const [authIssue, setAuthIssue] = useState('');
  const [authIssueUserId, setAuthIssueUserId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (!client) return () => { active = false; };
    void client.auth.getSession().then(async () => client.auth.getUser()).then(({ data, error }) => {
      if (!active) return;
      if (error) setUser(null);
      else setUser(data.user);
      setAppState('ready');
    }).catch(() => { if (active) { setUser(null); setAppState('ready'); } });
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
      if (active) setUser(session?.user ?? null);
    });
    return () => { active = false; subscription.unsubscribe(); };
  }, [client]);

  useEffect(() => {
    let active = true;
    async function loadIdentity() {
      if (!client || !user) return;
      try {
        const [{ data: roleRows, error: roleError }, { data: assurance, error: assuranceError }] = await Promise.all([
          client.from('user_roles').select('role').eq('user_id', user.id),
          client.auth.mfa.getAuthenticatorAssuranceLevel(),
        ]);
        if (roleError) throw roleError;
        const safeRoles = (roleRows ?? []).map(row => String(row.role)).filter(isAppRole);
        if (active) { setRoles([...new Set(safeRoles)]); setRolesForUser(user.id); }
        if (assuranceError) throw assuranceError;
        if (assurance.nextLevel === 'aal2' && assurance.currentLevel !== 'aal2') {
          const { data: factors, error: factorError } = await client.auth.mfa.listFactors();
          if (factorError) throw factorError;
          const verified = [...factors.totp, ...factors.phone].find(factor => factor.status === 'verified');
          if (active && verified) { setMfaFactorId(verified.id); setMfaUserId(user.id); }
          else if (active) { setAuthIssue('الحساب يتطلب تحققًا إضافيًا، لكن لا توجد وسيلة تحقق مسجلة. تواصل مع الدعم.'); setAuthIssueUserId(user.id); }
        }
      } catch {
        if (active) { setAuthIssue('تعذر تحميل صلاحيات الحساب بأمان. حاول مرة أخرى لاحقًا.'); setAuthIssueUserId(user.id); }
      }
    }
    void loadIdentity();
    return () => { active = false; };
  }, [client, user]);

  if (appState === 'loading') return <AuthLoading message="جارٍ التحقق من الجلسة…" />;
  if (appState === 'configuration-error') return <SignIn client={null} configurationError="إعدادات الاتصال بخدمة المصادقة غير متاحة في هذه البيئة." />;
  if (!client) return <SignIn client={null} />;
  if (!user) return <SignIn client={client} />;
  if (mfaFactorId && mfaUserId === user.id) return <MfaChallenge client={client} factorId={mfaFactorId} onCancel={() => void client.auth.signOut()} onVerified={() => { setMfaFactorId(null); setMfaUserId(null); }} />;
  if (authIssue && authIssueUserId === user.id) return <main className="access-screen" dir="rtl"><Card className="access-card"><Logo /><h1>تعذر التحقق من الحساب</h1><p role="alert">{authIssue}</p><Button variant="secondary" onClick={() => void client.auth.signOut()}>تسجيل الخروج</Button></Card></main>;
  if (rolesForUser !== user.id) return <AuthLoading message="جارٍ التحقق من صلاحيات الحساب…" />;
  if (!roles.length) return <NoRoleScreen onSignOut={() => void client.auth.signOut()} />;
  return <Workspace client={client} user={user} actor={{ userId: user.id, roles }} roles={roles} />;
}

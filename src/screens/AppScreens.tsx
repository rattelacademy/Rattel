import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { ActorIdentity } from '../auth/roles';
import { getParentInvoices, getTeacherEarnings, type ParentInvoice, type TeacherEarning } from '../lib/financial-api';
import { ActionAlert, Badge, Button, Card, TextField } from '../components/ui';
import { Logo } from '../components/brand';
import {
  createRescheduleRequest,
  decideRescheduleRequest,
  getSessionReport,
  listDirectory,
  listLessonSessions,
  listNotifications,
  listRescheduleRequests,
  listStudents,
  markNotificationRead,
  recordAttendance,
  saveSessionReport,
  saveStudentPlacement,
  setUserRole,
  type LessonSessionRecord,
  type NotificationRecord,
  type ProfileRecord,
  type RescheduleRecord,
  type StudentRecord,
} from '../lib/academic-api';
import type { ScreenDefinition } from './screen-definitions';

type AppScreensProps = { screen: ScreenDefinition; actor: ActorIdentity; client: SupabaseClient; displayName: string };

function PageHeading({ title, subtitle, eyebrow }: { title: string; subtitle?: string; eyebrow?: string }) {
  return <header className="screen-heading">{eyebrow && <p className="screen-eyebrow">{eyebrow}</p>}<h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</header>;
}

type RemoteState<T> = { data: T; loading: boolean; error: boolean; reload: () => void };

function useRemoteData<T>(loader: () => Promise<T>, initial: T): RemoteState<T> {
  const [result, setResult] = useState<{ revision: number; data: T | null; error: boolean } | null>(null);
  const [revision, setRevision] = useState(0);
  const reload = useCallback(() => setRevision(value => value + 1), []);

  useEffect(() => {
    let active = true;
    void loader().then(result => {
      if (active) setResult({ revision, data: result, error: false });
    }).catch(() => {
      if (active) setResult({ revision, data: null, error: true });
    });
    return () => { active = false; };
  }, [loader, revision]);

  const current = result?.revision === revision ? result : null;
  return { data: current?.data ?? initial, loading: !current, error: current?.error ?? false, reload };
}

function DataState({ loading, error, empty, children }: { loading: boolean; error: boolean; empty: boolean; children: ReactNode }) {
  if (loading) return <div className="loading-panel" role="status">جارٍ تحميل البيانات…</div>;
  if (error) return <div className="financial-error" role="alert">تعذر تحميل البيانات. تحقق من الاتصال والصلاحيات ثم أعد المحاولة.</div>;
  if (empty) return <EmptyState title="لا توجد سجلات حتى الآن" detail="ستظهر البيانات هنا بعد إضافتها من الحساب المخوّل." />;
  return <>{children}</>;
}

const dateTimeFormat = new Intl.DateTimeFormat('ar', { dateStyle: 'medium', timeStyle: 'short' });

function formatDateTime(value: string) {
  return dateTimeFormat.format(new Date(value));
}

function studentLabel(studentId: string, students: readonly StudentRecord[]) {
  return students.find(student => student.id === studentId)?.full_name ?? 'طالب';
}

function profileLabel(profileId: string | null, directory: readonly ProfileRecord[]) {
  return directory.find(profile => profile.id === profileId)?.display_name || 'غير محدد';
}

function Metric({ label, value, detail, tone = 'green' }: { label: string; value: string; detail?: string; tone?: 'green' | 'gold' | 'red' }) {
  return <Card className={`metric-card metric-card--${tone}`}><span>{label}</span><strong dir="auto">{value}</strong>{detail && <small>{detail}</small>}</Card>;
}

function Section({ title, action, children, className = '' }: { title: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return <section className={`screen-section ${className}`}><div className="screen-section__heading"><h2>{title}</h2>{action}</div>{children}</section>;
}

function Item({ title, detail, status, href, action, id }: { title: string; detail: string; status?: string; href?: string; action?: string; id?: string }) {
  return <Card id={id} className="item-card"><div className="item-card__body"><strong>{title}</strong><span>{detail}</span></div>{status && <Badge tone="warning">{status}</Badge>}{href && <a className="item-card__action" href={href}>{action ?? 'فتح العنصر'}<span className="material-symbols-outlined" aria-hidden="true">arrow_back</span></a>}</Card>;
}

function EmptyState({ title, detail, actionHref, actionLabel }: { title: string; detail: string; actionHref?: string; actionLabel?: string }) {
  return <div className="empty-state"><span className="material-symbols-outlined" aria-hidden="true">auto_awesome</span><strong>{title}</strong><p>{detail}</p>{actionHref && actionLabel && <a className="empty-state__action" href={actionHref}>{actionLabel}</a>}</div>;
}

function OwnerHome({ client, displayName }: AppScreensProps) {
  const load = useCallback(async () => Promise.all([
    listStudents(client),
    listLessonSessions(client, { userId: '', roles: ['owner'] }),
    listRescheduleRequests(client),
  ]), [client]);
  const state = useRemoteData(load, [[], [], []] as [StudentRecord[], LessonSessionRecord[], RescheduleRecord[]]);
  const [students, sessions, requests] = state.data;
  const today = new Date().toDateString();
  const sessionsToday = sessions.filter(session => new Date(session.starts_at).toDateString() === today);
  const pending = requests.filter(request => request.status === 'pending' || request.status === 'offered');
  return <><PageHeading eyebrow="لوحة الأكاديمية" title={'السلام عليكم، ' + displayName} subtitle="نظرة يومية على متابعة الأكاديمية والجلسات." />
    <Section title="إجراءات مطلوبة عاجلة"><DataState loading={state.loading} error={state.error} empty={!pending.length}><div className="alert-stack">{pending.slice(0, 5).map(request => <ActionAlert key={request.id} urgency="high" title="طلب إعادة جدولة بانتظار الإجراء" description={request.reason} actionLabel="مراجعة الطلب" itemHref={'/app/reschedule/' + request.id} />)}</div></DataState></Section>
    <Section title="مؤشرات الأداء الأكاديمية"><div className="metric-grid"><Metric label="الطلاب النشطون" value={state.loading ? '—' : String(students.filter(student => student.status === 'active').length)} /><Metric label="جلسات اليوم" value={state.loading ? '—' : String(sessionsToday.length)} /><Metric label="طلبات إعادة الجدولة" value={state.loading ? '—' : String(pending.length)} tone={pending.length ? 'gold' : 'green'} /><Metric label="طلاب غير مسكنين" value={state.loading ? '—' : String(students.filter(student => student.status === 'unassigned').length)} tone="gold" /></div></Section>
    <Section title="حصص اليوم الفردية" action={<a className="section-link" href="/app/schedule">عرض الجدول كاملًا</a>}><DataState loading={state.loading} error={state.error} empty={!sessionsToday.length}><div className="item-grid">{sessionsToday.map(session => <Item key={session.id} title={studentLabel(session.student_id, students)} detail={formatDateTime(session.starts_at) + ' · ' + session.subject} status={session.status} href={'/app/schedule#' + session.id} action="فتح الحصة" />)}</div></DataState></Section>
  </>;
}

function ParentHome({ client, displayName }: AppScreensProps) {
  const load = useCallback(async () => Promise.all([
    listStudents(client),
    listLessonSessions(client, { userId: '', roles: ['parent'] }),
  ]), [client]);
  const state = useRemoteData(load, [[], []] as [StudentRecord[], LessonSessionRecord[]]);
  const [students, sessions] = state.data;
  const upcoming = sessions.filter(session => session.status === 'scheduled').slice(0, 5);
  return <><PageHeading eyebrow="حساب ولي الأمر" title={'مرحبًا بك، ' + displayName} subtitle="تابع الأبناء وحصصهم وتقارير الحفظ من مكان واحد." />
    <Section title="الأبناء والحفظ"><DataState loading={state.loading} error={state.error} empty={!students.length}><div className="item-grid">{students.map(student => <Item key={student.id} title={student.full_name} detail="ملف الطالب والحصص المرتبطة" status={student.status === 'active' ? 'نشط' : student.status === 'unassigned' ? 'بانتظار التسكين' : 'غير نشط'} href={'/app/history?student_id=' + student.id} action="سجل الحصص" />)}</div></DataState></Section>
    <Section title="الحصة القادمة للأبناء"><DataState loading={state.loading} error={state.error} empty={!upcoming.length}><div className="item-grid">{upcoming.map(session => <Item key={session.id} title={studentLabel(session.student_id, students)} detail={formatDateTime(session.starts_at)} status={session.subject} href={'/app/schedule#' + session.id} action="تفاصيل الحصة" />)}</div></DataState></Section>
    <div className="privacy-note"><span className="material-symbols-outlined" aria-hidden="true">shield</span><span>الفواتير تعرض إجمالي حساب ولي الأمر فقط.</span></div>
  </>;
}

function TeacherHome({ client, displayName, actor }: AppScreensProps) {
  const load = useCallback(async () => Promise.all([
    listStudents(client),
    listLessonSessions(client, actor),
    listRescheduleRequests(client),
  ]), [client, actor]);
  const state = useRemoteData(load, [[], [], []] as [StudentRecord[], LessonSessionRecord[], RescheduleRecord[]]);
  const [students, sessions, requests] = state.data;
  const today = new Date().toDateString();
  const todaySessions = sessions.filter(session => new Date(session.starts_at).toDateString() === today);
  const pending = requests.filter(request => request.status === 'pending' || request.status === 'offered');
  return <><PageHeading eyebrow="الرئيسية" title={'السلام عليكم، ' + displayName} subtitle="جدول حصصك اليوم ومتابعة تقارير الطلاب." />
    <Section title="إجراءات مطلوبة عاجلة"><DataState loading={state.loading} error={state.error} empty={!pending.length}><div className="alert-stack">{pending.slice(0, 4).map(request => <ActionAlert key={request.id} urgency="high" title="طلب إعادة جدولة جديد" description={request.reason} actionLabel="فتح الطلب" itemHref={'/app/reschedule/' + request.id} />)}</div></DataState></Section>
    <Section title="جدول حصصك اليوم"><DataState loading={state.loading} error={state.error} empty={!todaySessions.length}><div className="item-grid">{todaySessions.map(session => <Item key={session.id} title={studentLabel(session.student_id, students)} detail={formatDateTime(session.starts_at) + ' – ' + formatDateTime(session.ends_at) + ' · ' + session.subject} status={session.attendance_status === 'unrecorded' ? 'بانتظار رصد الحضور' : session.attendance_status} href={'/app/assessment/' + session.id} action="رصد الحضور والتقييم" />)}</div></DataState></Section>
    <Section title="مستحقاتي"><FinancialRows client={client} actor={actor} kind="teacher" /></Section>
  </>;
}

function UsersScreen({ client }: AppScreensProps) {
  const load = useCallback(async () => Promise.all([listStudents(client), listDirectory(client)]), [client]);
  const state = useRemoteData(load, [[], []] as [StudentRecord[], ProfileRecord[]]);
  const [students, directory] = state.data;
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [roleChanges, setRoleChanges] = useState<Record<string, boolean>>({});
  const teachers = directory.filter(profile => profile.roles.includes('teacher'));
  const parents = directory.filter(profile => profile.roles.includes('parent'));
  async function createStudent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const teacherId = String(form.get('teacher_id') || '') || null;
    const parentId = String(form.get('parent_id') || '');
    setSaving(true);
    setMessage('');
    try {
      await saveStudentPlacement(client, {
        full_name: String(form.get('full_name') ?? '').trim(),
        parent_user_ids: parentId ? [parentId] : [],
        teacher_id: teacherId,
        status: teacherId ? 'active' : 'unassigned',
      });
      formElement.reset();
      setMessage('تمت إضافة الطالب.');
      state.reload();
    } catch {
      setMessage('تعذرت إضافة الطالب. تأكد من وجود حساب معلم وولي أمر بالأدوار الصحيحة.');
    } finally {
      setSaving(false);
    }
  }
  async function changeRole(profile: ProfileRecord, role: 'teacher' | 'parent', enabled: boolean) {
    const key = `${profile.id}:${role}`;
    setRoleChanges(current => ({ ...current, [key]: true }));
    setMessage('');
    try {
      await setUserRole(client, profile.id, role, enabled);
      setMessage('تم تحديث صلاحية الحساب.');
      state.reload();
    } catch {
      setMessage('تعذر تحديث الصلاحية. دور المالك لا يمكن تغييره من هذه الشاشة.');
    } finally {
      setRoleChanges(current => ({ ...current, [key]: false }));
    }
  }
  async function savePlacement(event: FormEvent<HTMLFormElement>, student: StudentRecord) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const teacherId = String(form.get('teacher_id') || '') || null;
    const parentId = String(form.get('parent_id') || '');
    setMessage('');
    try {
      await saveStudentPlacement(client, { ...student, teacher_id: teacherId, parent_user_ids: parentId ? [parentId] : [], status: teacherId ? 'active' : 'unassigned' });
      setMessage('تم حفظ التسكين.');
      state.reload();
    } catch {
      setMessage('تعذر حفظ التسكين. تحقق من صلاحيات الحسابات المختارة.');
    }
  }
  return <><PageHeading eyebrow="إدارة المستخدمين" title="قائمة الحسابات والتسكين" subtitle="عرض الحسابات المرتبطة وتسكين الطلاب على المعلمين وأولياء الأمور." />
    <Section title="إضافة طالب"><form className="assignment-form" onSubmit={createStudent}><TextField name="full_name" label="اسم الطالب" placeholder="الاسم الكامل" required /><label className="ui-field"><span className="ui-field__label">المعلم</span><select name="teacher_id" className="ui-input" defaultValue=""><option value="">غير مسند</option>{teachers.map(profile => <option key={profile.id} value={profile.id}>{profile.display_name || 'اسم غير مسجل'}</option>)}</select></label><label className="ui-field"><span className="ui-field__label">ولي الأمر</span><select name="parent_id" className="ui-input" defaultValue=""><option value="">غير محدد</option>{parents.map(profile => <option key={profile.id} value={profile.id}>{profile.display_name || 'اسم غير مسجل'}</option>)}</select></label><Button type="submit" disabled={saving}>{saving ? 'جارٍ الحفظ…' : 'إضافة الطالب'}</Button>{message && <p className="form-success" role="status">{message}</p>}</form></Section>
    <Section title="حسابات الأكاديمية"><DataState loading={state.loading} error={state.error} empty={!directory.length}><div className="item-grid">{directory.map(profile => <Card className="item-card" key={profile.id}><div className="item-card__body"><strong>{profile.display_name || 'اسم غير مسجل'}</strong><span>{profile.roles.length ? profile.roles.join(' · ') : 'لا يوجد دور مفعّل'}</span></div><div className="role-assignment" aria-label={'صلاحيات ' + (profile.display_name || 'الحساب')}>{(['teacher', 'parent'] as const).map(role => { const key = `${profile.id}:${role}`; return <label key={role}><input type="checkbox" checked={profile.roles.includes(role)} disabled={state.loading || roleChanges[key]} onChange={event => void changeRole(profile, role, event.target.checked)} /><span>{role === 'teacher' ? 'معلم' : 'ولي أمر'}</span></label>; })}</div></Card>)}</div></DataState></Section>
    {message && <p className="form-success" role="status">{message}</p>}
    <Section title="الطلاب والتسكين"><DataState loading={state.loading} error={state.error} empty={!students.length}><div className="item-grid">{students.map(student => <Card className="item-card" key={student.id}><div className="item-card__body"><strong>{student.full_name}</strong><span>ولي الأمر: {student.parent_user_ids.map(id => profileLabel(id, directory)).join('، ') || 'غير محدد'}</span><span>المعلم: {profileLabel(student.teacher_id, directory)}</span></div><Badge tone={student.status === 'active' ? 'success' : 'warning'}>{student.status}</Badge><form className="assignment-form" onSubmit={event => void savePlacement(event, student)}><label className="ui-field"><span className="ui-field__label">المعلم</span><select name="teacher_id" className="ui-input" defaultValue={student.teacher_id ?? ''}><option value="">غير مسند</option>{teachers.map(profile => <option key={profile.id} value={profile.id}>{profile.display_name}</option>)}</select></label><label className="ui-field"><span className="ui-field__label">ولي الأمر</span><select name="parent_id" className="ui-input" defaultValue={student.parent_user_ids[0] ?? ''}><option value="">غير محدد</option>{parents.map(profile => <option key={profile.id} value={profile.id}>{profile.display_name}</option>)}</select></label><Button size="sm" type="submit">حفظ التسكين</Button></form></Card>)}</div></DataState></Section>
  </>;
}
function RescheduleRequest({ client, actor }: AppScreensProps) {
  const pathSessionId = window.location.pathname.split('/').filter(Boolean).at(-1) ?? '';
  const initialSessionId = new URLSearchParams(window.location.search).get('session_id') || (pathSessionId === 'request' ? '' : pathSessionId);
  const load = useCallback(async () => Promise.all([listLessonSessions(client, actor), listStudents(client)]), [client, actor]);
  const state = useRemoteData(load, [[], []] as [LessonSessionRecord[], StudentRecord[]]);
  const [sessions, students] = state.data;
  const [sessionId, setSessionId] = useState(initialSessionId);
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const selected = sessions.find(session => session.id === sessionId);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const reason = String(form.get('reason') ?? '');
    const proposed = String(form.get('proposed_time') ?? '');
    if (!sessionId) { setError('اختر الحصة أولاً.'); return; }
    setSubmitting(true);
    setError('');
    try {
      const details = String(form.get('details') ?? '').trim();
      await createRescheduleRequest(client, actor, sessionId, details ? `${reason} — ${details}` : reason, proposed ? [new Date(proposed).toISOString()] : []);
      setSent(true);
      state.reload();
    } catch {
      setError('تعذر حفظ الطلب. تأكد من أن الحصة تخص حسابك وحاول مجددًا.');
    } finally {
      setSubmitting(false);
    }
  }

  return <><PageHeading eyebrow={actor.roles.includes('teacher') ? 'حساب المعلم' : 'حساب ولي الأمر'} title="طلب إعادة جدولة حصة" subtitle="أرسل طلبًا مرتبطًا بحصة محددة ليراجعه الطرف الآخر." />
    <Card className="form-card"><div className="selected-session"><Badge tone={selected ? 'success' : 'warning'}>{selected ? 'حصة محددة' : 'اختر الحصة'}</Badge>{selected && <><strong>{studentLabel(selected.student_id, students)}</strong><span>{formatDateTime(selected.starts_at)} · {selected.subject}</span></>}</div>
      <form className="screen-form" onSubmit={submit}>
        <label className="ui-field"><span className="ui-field__label">الحصة</span><select className="ui-input" required value={sessionId} onChange={event => setSessionId(event.target.value)}><option value="">اختر حصة مرتبطة بحسابك</option>{sessions.filter(session => session.status !== 'cancelled').map(session => <option key={session.id} value={session.id}>{studentLabel(session.student_id, students)} · {formatDateTime(session.starts_at)}</option>)}</select></label>
        <label className="ui-field"><span className="ui-field__label">سبب إعادة الجدولة</span><select className="ui-input" required name="reason" defaultValue=""><option value="" disabled>اختر سببًا</option><option>تعارض مع التزامات أخرى</option><option>ظرف عائلي طارئ</option><option>وعكة صحية للطالب</option><option>سبب آخر</option></select></label>
        <TextField label="ملاحظات إضافية" name="details" placeholder="اكتب تفاصيل موجزة عن الطلب" />
        <label className="ui-field"><span className="ui-field__label">الموعد البديل المقترح</span><input className="ui-input" name="proposed_time" type="datetime-local" /></label>
        {error && <p className="form-error" role="alert">{error}</p>}
        {sent && <p className="form-success" role="status">تم حفظ الطلب بنجاح.</p>}
        <Button type="submit" disabled={submitting || state.loading || !sessions.length}>{submitting ? 'جارٍ الإرسال…' : 'إرسال طلب إعادة الجدولة'}</Button>
      </form>
    </Card>
  </>;
}
function ScheduleScreen({ client, actor }: AppScreensProps) {
  const load = useCallback(async () => Promise.all([listLessonSessions(client, actor), listStudents(client)]), [client, actor]);
  const state = useRemoteData(load, [[], []] as [LessonSessionRecord[], StudentRecord[]]);
  const [sessions, students] = state.data;
  const role = actor.roles.includes('teacher') && !actor.roles.includes('owner') ? 'teacher' : actor.roles.includes('parent') && !actor.roles.includes('owner') ? 'parent' : 'owner';
  const actionable = role === 'teacher';
  return <><PageHeading eyebrow="نظام الأكاديمية" title="جدول الجلسات والمقرأة" subtitle="الجلسات المعروضة حسب صلاحية حسابك في قاعدة البيانات." />
    <div className="segmented-tabs"><Badge tone="success">{role === 'teacher' ? 'جدول المعلم' : role === 'parent' ? 'جدول الأبناء' : 'جدول الأكاديمية'}</Badge></div>
    <Section title="الجلسات"><DataState loading={state.loading} error={state.error} empty={!sessions.length}><div className="item-grid">{sessions.map(session => <Item id={session.id} key={session.id} title={studentLabel(session.student_id, students)} detail={formatDateTime(session.starts_at) + ' – ' + formatDateTime(session.ends_at) + ' · ' + session.subject} status={session.status + ' · ' + (session.attendance_status === 'unrecorded' ? 'الحضور غير مرصود' : session.attendance_status)} href={actionable ? '/app/assessment/' + session.id : '/app/schedule#' + session.id} action={actionable ? 'رصد الحضور والتقييم' : 'تفاصيل الحصة'} />)}</div></DataState></Section>
  </>;
}
function FinancialRows({ client, actor, kind }: { client: SupabaseClient; actor: ActorIdentity; kind: 'teacher' | 'parent' | 'owner' | 'owner-invoices' }) {
  const [rows, setRows] = useState<readonly (TeacherEarning | ParentInvoice)[]>([]);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  useEffect(() => {
    let active = true;
    async function load() {
      try {
        if (kind === 'teacher') {
          const data = await getTeacherEarnings(client, actor, actor.userId);
          if (active) setRows(data);
        } else if (kind === 'parent') {
          const data = await getParentInvoices(client, actor, actor.userId);
          if (active) setRows(data);
        } else if (kind === 'owner') {
          const { data, error } = await client.from('teacher_earnings').select('id, teacher_id, period_start, period_end, amount, currency, status').order('period_start', { ascending: false });
          if (error) throw error;
          if (active) setRows((data ?? []) as TeacherEarning[]);
        } else {
          const { data, error } = await client.from('parent_invoice_summary').select('id, parent_id, amount, currency, status, issued_at').order('issued_at', { ascending: false });
          if (error) throw error;
          if (active) setRows((data ?? []) as ParentInvoice[]);
        }
        if (active) setState('ready');
      } catch {
        if (active) setState('error');
      }
    }
    void load();
    return () => { active = false; };
  }, [client, actor, kind]);

  if (state === 'loading') return <div className="loading-panel" role="status">جارٍ تحميل السجلات المالية…</div>;
  if (state === 'error') return <div className="financial-error" role="alert">تعذر تحميل السجلات المالية. حاول لاحقًا.</div>;
  if (!rows.length) return <EmptyState title="لا توجد سجلات مالية متاحة" detail="ستظهر السجلات بعد إضافتها إلى قاعدة البيانات المعتمدة." />;
  return <div className="financial-list">{rows.map(row => {
    const title = 'period_start' in row ? `${row.period_start} — ${row.period_end}` : new Date(row.issued_at).toLocaleDateString('ar');
    const amount = new Intl.NumberFormat('ar', { style: 'currency', currency: row.currency }).format(row.amount);
    const status = row.status === 'paid' ? 'مدفوع' : row.status === 'approved' ? 'معتمد' : row.status === 'open' ? 'مستحق' : row.status === 'void' ? 'ملغي' : row.status === 'draft' ? 'مسودة' : 'قيد المراجعة';
    return <Card className="financial-row" key={row.id}><div><strong>{title}</strong><span>{status}</span></div><strong dir="ltr">{amount}</strong></Card>;
  })}</div>;
}

function SubscriptionsScreen({ client, actor }: AppScreensProps) {
  return <><PageHeading eyebrow="حساب ولي الأمر" title="الاشتراكات والمدفوعات" subtitle="إدارة الفواتير وإظهار إجمالي المبلغ المستحق دون تفاصيل تقسيم داخلية." />
    <Card className="hero-card"><Logo compact /><div><h2>متابعة الفواتير</h2><p>كل فاتورة تعرض الإجمالي المسجل لحساب ولي الأمر فقط.</p></div></Card>
    <Section title="الفواتير"><FinancialRows client={client} actor={actor} kind="parent" /></Section>
    <div className="privacy-note"><span className="material-symbols-outlined" aria-hidden="true">shield</span><span>لا تعرض هذه الصفحة مستحقات المعلم أو حصة الأكاديمية.</span></div>
  </>;
}

function RescheduleCenter({ client, actor }: AppScreensProps) {
  const load = useCallback(async () => Promise.all([
    listRescheduleRequests(client),
    listLessonSessions(client, actor),
    listStudents(client),
  ]), [client, actor]);
  const state = useRemoteData(load, [[], [], []] as [RescheduleRecord[], LessonSessionRecord[], StudentRecord[]]);
  const [requests, sessions, students] = state.data;
  const selectedId = window.location.pathname.split('/').filter(Boolean).at(-1);
  const visible = selectedId === 'reschedule' ? requests : requests.filter(request => request.id === selectedId);
  const [saving, setSaving] = useState('');
  const [error, setError] = useState('');
  async function decide(id: string, status: Extract<RescheduleRecord['status'], 'accepted' | 'rejected'>) {
    setSaving(id);
    setError('');
    try {
      await decideRescheduleRequest(client, id, status);
      state.reload();
    } catch {
      setError('تعذر حفظ القرار. تحقق من صلاحية الحساب وحاول مجددًا.');
    } finally {
      setSaving('');
    }
  }
  return <><PageHeading eyebrow="إدارة الجلسات والتعويضات" title="مركز إعادة الجدولة" subtitle="مراجعة الطلبات ومقترحات المواعيد البديلة." />
    <div className="metric-grid metric-grid--compact"><Metric label="إجمالي الطلبات" value={state.loading ? '—' : String(requests.length)} /><Metric label="طلبات بانتظار الإجراء" value={state.loading ? '—' : String(requests.filter(item => item.status === 'pending' || item.status === 'offered').length)} tone="gold" /><Metric label="طلبات مقبولة" value={state.loading ? '—' : String(requests.filter(item => item.status === 'accepted').length)} /></div>
    {error && <p className="form-error" role="alert">{error}</p>}
    <Section title="الطلبات"><DataState loading={state.loading} error={state.error} empty={!visible.length}><div className="item-grid">{visible.map(request => {
      const session = sessions.find(item => item.id === request.session_id);
      const canDecide = actor.roles.includes('owner') || (actor.roles.includes('teacher') && session?.teacher_id === actor.userId);
      return <Card id={request.id} className="item-card" key={request.id}>
        <div className="item-card__body"><strong>{session ? studentLabel(session.student_id, students) : 'حصة'}</strong><span>{session ? formatDateTime(session.starts_at) : 'موعد الحصة غير متاح'}</span><span>{request.reason}</span><span>الحالة: {request.status === 'pending' ? 'بانتظار المراجعة' : request.status === 'offered' ? 'موعد بديل مقترح' : request.status === 'accepted' ? 'مقبول' : request.status === 'rejected' ? 'مرفوض' : 'ملغي'}</span>{request.proposed_times.map(time => <span key={time}>موعد مقترح: {formatDateTime(time)}</span>)}</div>
        {canDecide && (request.status === 'pending' || request.status === 'offered') && <div className="item-actions"><Button size="sm" onClick={() => void decide(request.id, 'accepted')} disabled={saving === request.id}>قبول الطلب</Button><Button size="sm" variant="secondary" onClick={() => void decide(request.id, 'rejected')} disabled={saving === request.id}>رفض الطلب</Button></div>}
        <a className="item-card__action" href={'/app/schedule#' + request.session_id}>فتح الحصة المرتبطة</a>
      </Card>;
    })}</div></DataState></Section>
  </>;
}
function OwnerDues({ client, actor }: AppScreensProps) {
  return <><PageHeading eyebrow="إقفال المستحقات" title="مستحقات المعلمين" subtitle="المعلمات والمعلمون يرون سجلاتهم الشخصية فقط؛ هذه الشاشة للمالك." />
    <Card className="finance-policy"><Badge tone="warning">سياسات التسعير قيد التهيئة</Badge><p>المبالغ تُقرأ من سجلات المستحقات ولا تُحسب هنا. لا توجد صيغة تسعير أو تحويل معتمدة في المشروع بعد.</p></Card>
    <Section title="سجلات المستحقات"><FinancialRows client={client} actor={actor} kind="owner" /></Section>
  </>;
}

function NotificationsScreen({ client }: AppScreensProps) {
  const load = useCallback(() => listNotifications(client), [client]);
  const state = useRemoteData(load, [] as NotificationRecord[]);
  const [saving, setSaving] = useState('');
  async function markRead(id: string) {
    setSaving(id);
    try {
      await markNotificationRead(client, id);
      state.reload();
    } finally {
      setSaving('');
    }
  }
  return <><PageHeading eyebrow="مركز الإشعارات" title="إجراءات ومعلومات الحساب" subtitle="افتح كل إشعار على العنصر المرتبط به مباشرة." />
    <Section title="الإشعارات"><DataState loading={state.loading} error={state.error} empty={!state.data.length}><div className="item-grid">{state.data.map(notification => <Card id={'notification-' + notification.id} className="item-card" key={notification.id}><div className="item-card__body"><strong>{notification.title}</strong><span>{notification.message}</span><span>{formatDateTime(notification.created_at)}</span></div><Badge tone={notification.read_at ? 'neutral' : 'warning'}>{notification.read_at ? 'مقروء' : 'جديد'}</Badge><div className="item-actions"><a className="item-card__action" href={notification.target_path ?? '/app/notifications#notification-' + notification.id}>فتح الإشعار<span className="material-symbols-outlined" aria-hidden="true">arrow_back</span></a>{!notification.read_at && <Button size="sm" variant="secondary" onClick={() => void markRead(notification.id)} disabled={saving === notification.id}>تمييز كمقروء</Button>}</div></Card>)}</div></DataState></Section>
  </>;
}
function TeacherRates() {
  return <><PageHeading eyebrow="إدارة التعويضات" title="قاعدة احتساب الأجور" subtitle="تظهر هذه الإعدادات للمالك فقط." />
    <Card className="finance-policy"><Badge tone="warning">قرار D-08 غير محسوم</Badge><p>لن يتم تثبيت تسعير ثابت أو تسعير لكل حصة قبل اعتماد السياسة. هذه الصفحة جاهزة لتخزين الإعداد المعتمد دون افتراض قيمة.</p></Card>
    <Section title="تعريف قواعد المعلمين"><div className="settings-grid"><Metric label="طريقة التسعير" value="غير محددة" tone="gold" /><Metric label="عملة السجل" value="حسب السجل" /><Metric label="تاريخ السريان" value="غير محدد" /></div><EmptyState title="لا توجد قواعد تسعير معتمدة" detail="أضف القاعدة بعد اعتماد قرار التسعير وتاريخ سريانه." /></Section>
  </>;
}

function AssessmentScreen({ client, actor }: AppScreensProps) {
  const pathSessionId = window.location.pathname.split('/').filter(Boolean).at(-1) ?? '';
  const selectedFromRoute = new URLSearchParams(window.location.search).get('session_id') || (pathSessionId === 'assessment' ? '' : pathSessionId);
  const load = useCallback(async () => {
    return Promise.all([listLessonSessions(client, actor), listStudents(client)]);
  }, [client, actor]);
  const state = useRemoteData(load, [[], []] as [LessonSessionRecord[], StudentRecord[]]);
  const [sessions, students] = state.data;
  const [sessionId, setSessionId] = useState(selectedFromRoute);
  const reportLoader = useCallback(() => sessionId ? getSessionReport(client, sessionId) : Promise.resolve(null), [client, sessionId]);
  const reportState = useRemoteData(reportLoader, null);
  const report = reportState.data;
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const session = sessions.find(item => item.id === sessionId);

  async function attendance(value: 'attended' | 'absent') {
    if (!session) return;
    setMessage('');
    try {
      await recordAttendance(client, session.id, value);
      setMessage(value === 'attended' ? 'تم تسجيل الحضور.' : 'تم تسجيل الغياب.');
      state.reload();
    } catch {
      setMessage('تعذر تحديث الحضور. تحقق من صلاحية المعلم.');
    }
  }

  async function saveReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session) return;
    const form = new FormData(event.currentTarget);
    const numberOrNull = (key: string) => String(form.get(key) ?? '') ? Number(form.get(key)) : null;
    setSaving(true);
    setMessage('');
    try {
      await saveSessionReport(client, {
        sessionId: session.id,
        studentId: session.student_id,
        teacherId: session.teacher_id,
        newSurah: String(form.get('new_surah') ?? '') || null,
        ayahStart: numberOrNull('ayah_start'),
        ayahEnd: numberOrNull('ayah_end'),
        memorizationScore: numberOrNull('memorization_score'),
        revisionScore: numberOrNull('revision_score'),
        tajweedNotes: String(form.get('tajweed_notes') ?? ''),
        teacherNotes: String(form.get('teacher_notes') ?? ''),
        homework: String(form.get('homework') ?? ''),
      });
      setMessage('تم حفظ التقرير المرتبط بالحصة.');
      state.reload();
    } catch {
      setMessage('تعذر حفظ التقرير. تحقق من ارتباط الحصة بحسابك ومن صحة نطاق الآيات.');
    } finally {
      setSaving(false);
    }
  }

  return <><PageHeading eyebrow="تقرير الجلسة" title="تقييم الطالب" subtitle="التقييم مرتبط بحصة واحدة وطالب محدد." />
    <DataState loading={state.loading} error={state.error} empty={!sessions.length}><>
      <label className="ui-field"><span className="ui-field__label">الحصة</span><select className="ui-input" value={sessionId} onChange={event => setSessionId(event.target.value)}><option value="">اختر حصة</option>{sessions.map(item => <option key={item.id} value={item.id}>{studentLabel(item.student_id, students)} · {formatDateTime(item.starts_at)}</option>)}</select></label>
      {session && reportState.loading && <div className="loading-panel" role="status">جارٍ تحميل تقرير الحصة…</div>}
      {session && reportState.error && <p className="form-error" role="alert">تعذر تحميل التقرير. أعد المحاولة قبل تسجيل تعديل جديد.</p>}
      {session && !reportState.loading && !reportState.error && <><Card className="student-summary"><Badge tone="success">{session.subject} · {session.attendance_status}</Badge><h2>{studentLabel(session.student_id, students)}</h2><p>{formatDateTime(session.starts_at)}</p><div className="item-actions"><Button size="sm" onClick={() => void attendance('attended')}>رصد الحضور</Button><Button size="sm" variant="secondary" onClick={() => void attendance('absent')}>تسجيل الغياب</Button></div></Card>
        <form className="screen-form" key={report?.id ?? session.id} onSubmit={saveReport}>
          <Section title="الحفظ الجديد"><div className="form-grid"><TextField name="new_surah" label="السورة" placeholder="اسم السورة" defaultValue={report?.new_surah ?? ''} /><TextField name="ayah_start" label="من آية" type="number" min="1" defaultValue={report?.ayah_start ?? ''} /><TextField name="ayah_end" label="إلى آية" type="number" min="1" defaultValue={report?.ayah_end ?? ''} /></div></Section>
          <Section title="التقييم"><div className="form-grid"><label className="ui-field"><span className="ui-field__label">الحفظ (من 1 إلى 5)</span><select className="ui-input" name="memorization_score" defaultValue={report?.memorization_score ?? ''}><option value="">غير مقيم</option>{[1,2,3,4,5].map(value => <option key={value} value={value}>{value}</option>)}</select></label><label className="ui-field"><span className="ui-field__label">المراجعة (من 1 إلى 5)</span><select className="ui-input" name="revision_score" defaultValue={report?.revision_score ?? ''}><option value="">غير مقيم</option>{[1,2,3,4,5].map(value => <option key={value} value={value}>{value}</option>)}</select></label></div></Section>
          <label className="ui-field"><span className="ui-field__label">ملاحظات التجويد</span><textarea className="ui-input" name="tajweed_notes" defaultValue={report?.tajweed_notes ?? ''} /></label>
          <label className="ui-field"><span className="ui-field__label">ملاحظات المعلم</span><textarea className="ui-input" name="teacher_notes" defaultValue={report?.teacher_notes ?? ''} /></label>
          <label className="ui-field"><span className="ui-field__label">الواجب</span><textarea className="ui-input" name="homework" defaultValue={report?.homework ?? ''} /></label>
          {message && <p className="form-success" role="status">{message}</p>}
          <Button type="submit" disabled={saving}>{saving ? 'جارٍ الحفظ…' : 'حفظ التقرير وإرساله لولي الأمر'}</Button>
        </form>
      </>}
    </></DataState>
  </>;
}
function PlansPayments({ client, actor }: AppScreensProps) {
  return <><PageHeading eyebrow="الشؤون المالية" title="إدارة الاشتراكات والمدفوعات" subtitle="ملخص الفواتير يعرض الإجماليات فقط." />
    <Card className="finance-policy"><Badge tone="warning">قرارات مالية غير معتمدة</Badge><p>طرق الدفع والاسترداد والعملة الأساسية وطريقة التسعير لم تُحسم. لن تُنفّذ هنا معاملات أو تسويات.</p></Card>
    <Section title="فواتير أولياء الأمور"><FinancialRows client={client} actor={actor} kind="owner-invoices" /></Section>
    <Section title="خطط الأكاديمية"><EmptyState title="لا توجد خطط منشأة" detail="سيتم ربط الخطط بعد اعتماد شكل التسعير وشروط الاشتراك." /></Section>
  </>;
}

function LessonHistory({ client, actor }: AppScreensProps) {
  const load = useCallback(() => listLessonSessions(client, actor), [client, actor]);
  const state = useRemoteData(load, [] as LessonSessionRecord[]);
  const studentId = new URLSearchParams(window.location.search).get('student_id');
  const sessions = state.data.filter(session => session.status === 'completed' && (!studentId || session.student_id === studentId));
  const studentsLoader = useCallback(() => listStudents(client), [client]);
  const studentState = useRemoteData(studentsLoader, [] as StudentRecord[]);
  return <><PageHeading eyebrow="متابعة الطالب" title="سجل الحصص المنفذة" subtitle="سجل الحصص والتقييمات المسجلة بحسب صلاحية الحساب." /><Section title="الحصص السابقة"><DataState loading={state.loading || studentState.loading} error={state.error || studentState.error} empty={!sessions.length}><div className="item-grid">{sessions.map(session => <Item key={session.id} title={studentLabel(session.student_id, studentState.data)} detail={formatDateTime(session.starts_at) + ' · ' + session.subject} status={session.attendance_status} href={'/app/schedule#' + session.id} action="عرض الحصة" />)}</div></DataState></Section></>;
}

function SettingsScreen() {
  return <><PageHeading eyebrow="مالك الأكاديمية" title="الإعدادات المالية وسجل الرقابة" subtitle="الإعدادات العامة والسياسات التي تتحكم في السجلات المالية." />
    <Section title="قرارات تنتظر الاعتماد"><div className="decision-list"><Item title="D-04 · طريقة الاحتساب النسبي" detail="لم تُحدد بعد؛ لن تُستخدم لحساب مستحقات أو فواتير." status="غير محدد" /><Item title="D-05 · طرق الدفع" detail="تحتاج إلى اعتماد طرق الدفع المسموح بها." status="غير محدد" /><Item title="D-06 · سياسة الاسترداد" detail="لا توجد قواعد استرداد معتمدة." status="غير محدد" /><Item title="D-07 · العملة الأساسية" detail="العملة محفوظة على مستوى السجل؛ لا توجد عملة أساسية معتمدة." status="غير محدد" /><Item title="D-08 · نموذج التسعير" detail="لم يُحسم التسعير الثابت أو التسعير لكل حصة." status="غير محدد" /></div></Section>
    <Section title="تقويم العطلات والإجازات الرسمية"><EmptyState title="لا توجد إجازات مضافة" detail="يتطلب تعديل التقويم تحديد صلاحيات الحفظ والتأثير على الجلسات." /></Section>
  </>;
}

export function AppScreen({ screen, actor, client, displayName }: AppScreensProps) {
  switch (screen.id) {
    case 'owner-home': return <OwnerHome screen={screen} actor={actor} client={client} displayName={displayName} />;
    case 'parent-home': return <ParentHome screen={screen} actor={actor} client={client} displayName={displayName} />;
    case 'teacher-home': return <TeacherHome screen={screen} actor={actor} client={client} displayName={displayName} />;
    case 'users': return <UsersScreen screen={screen} actor={actor} client={client} displayName={displayName} />;
    case 'reschedule-request': return <RescheduleRequest screen={screen} actor={actor} client={client} displayName={displayName} />;
    case 'schedule': return <ScheduleScreen screen={screen} actor={actor} client={client} displayName={displayName} />;
    case 'subscriptions': return <SubscriptionsScreen screen={screen} actor={actor} client={client} displayName={displayName} />;
    case 'reschedule-center': return <RescheduleCenter screen={screen} actor={actor} client={client} displayName={displayName} />;
    case 'teacher-dues': return <OwnerDues screen={screen} actor={actor} client={client} displayName={displayName} />;
    case 'notifications': return <NotificationsScreen screen={screen} actor={actor} client={client} displayName={displayName} />;
    case 'teacher-rates': return <TeacherRates />;
    case 'assessment': return <AssessmentScreen screen={screen} actor={actor} client={client} displayName={displayName} />;
    case 'plans-payments': return <PlansPayments screen={screen} actor={actor} client={client} displayName={displayName} />;
    case 'lesson-history': return <LessonHistory screen={screen} actor={actor} client={client} displayName={displayName} />;
    case 'settings': return <SettingsScreen />;
  }
}

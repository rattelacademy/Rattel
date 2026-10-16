import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { ActorIdentity } from '../auth/roles';
import { getParentInvoices, getTeacherEarnings, type ParentInvoice, type TeacherEarning } from '../lib/financial-api';
import { ActionAlert, Badge, Button, Card, TextField } from '../components/ui';
import { Logo } from '../components/brand';
import type { ScreenDefinition } from './screen-definitions';

type AppScreensProps = { screen: ScreenDefinition; actor: ActorIdentity; client: SupabaseClient; displayName: string };

function PageHeading({ title, subtitle, eyebrow }: { title: string; subtitle?: string; eyebrow?: string }) {
  return <header className="screen-heading">{eyebrow && <p className="screen-eyebrow">{eyebrow}</p>}<h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</header>;
}

function DemoNotice() {
  return <div className="demo-notice"><span className="material-symbols-outlined" aria-hidden="true">info</span><span>بيانات العرض التوضيحي مأخوذة من نماذج Stitch، وليست سجلات حقيقية.</span></div>;
}

function Metric({ label, value, detail, tone = 'green' }: { label: string; value: string; detail?: string; tone?: 'green' | 'gold' | 'red' }) {
  return <Card className={`metric-card metric-card--${tone}`}><span>{label}</span><strong dir="auto">{value}</strong>{detail && <small>{detail}</small>}</Card>;
}

function Section({ title, action, children, className = '' }: { title: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return <section className={`screen-section ${className}`}><div className="screen-section__heading"><h2>{title}</h2>{action}</div>{children}</section>;
}

function Item({ title, detail, status, href, action }: { title: string; detail: string; status?: string; href?: string; action?: string }) {
  return <Card className="item-card"><div className="item-card__body"><strong>{title}</strong><span>{detail}</span></div>{status && <Badge tone="warning">{status}</Badge>}{href && <a className="item-card__action" href={href}>{action ?? 'فتح العنصر'}<span className="material-symbols-outlined" aria-hidden="true">arrow_back</span></a>}</Card>;
}

function EmptyState({ title, detail, actionHref, actionLabel }: { title: string; detail: string; actionHref?: string; actionLabel?: string }) {
  return <div className="empty-state"><span className="material-symbols-outlined" aria-hidden="true">auto_awesome</span><strong>{title}</strong><p>{detail}</p>{actionHref && actionLabel && <a className="empty-state__action" href={actionHref}>{actionLabel}</a>}</div>;
}

function OwnerHome() {
  return <><DemoNotice /><PageHeading eyebrow="لوحة الأكاديمية" title="السلام عليكم، د. إبراهيم" subtitle="نظرة يومية على متابعة الأكاديمية والجلسات." />
    <Section title="إجراءات مطلوبة عاجلة"><div className="alert-stack">
      <ActionAlert urgency="high" title="٣ طلبات إعادة جدولة بانتظار موافقتك" description="راجع الطلبات المرتبطة بالحصص قبل اتخاذ القرار." actionLabel="مراجعة الطلبات" itemHref="/app/reschedule/request/req-2026-101" />
      <ActionAlert urgency="critical" title="طلب متابعة تقييم الطالب" description="تقييم الجلسة مرتبط بملف الطالب." actionLabel="فتح التقييم" itemHref="/app/assessment/student-2026-014" />
      <ActionAlert urgency="routine" title="إغلاق مستحقات المعلمين لهذا الشهر" description="اعرض السجلات قبل إقفال الدورة المالية." actionLabel="مراجعة المستحقات" itemHref="/app/teacher-dues" />
    </div></Section>
    <Section title="مؤشرات الأداء الأكاديمية"><div className="metric-grid"><Metric label="الطلاب النشطون" value="142" detail="١٨ معلماً ومعلمة" /><Metric label="جلسات اليوم" value="36" detail="جلسة فردية" /><Metric label="طلبات إعادة الجدولة" value="4" tone="red" /><Metric label="طلبات التقييم" value="9" tone="gold" /></div></Section>
    <Section title="حصص اليوم الفردية" action={<a className="section-link" href="/app/schedule">عرض الجدول كاملًا</a>}><div className="item-grid"><Item title="عمر خالد الشمري" detail="مع الشيخ عبدالرحمن · سورة مريم" status="قريبًا" href="/app/schedule#session-2041" action="فتح الحصة" /><Item title="سارة العتيبي" detail="مع أ. فاطمة · سورة الكهف" status="مجدولة" href="/app/schedule#session-2042" action="تفاصيل الحصة" /></div></Section>
  </>;
}

function ParentHome() {
  return <><DemoNotice /><PageHeading eyebrow="حساب ولي الأمر" title="مرحبًا بك، أ. عبدالله" subtitle="تابع أبناءك وحصصهم وتقارير الحفظ من مكان واحد." />
    <Section title="يحتاج إجراءك"><div className="alert-stack"><ActionAlert urgency="critical" title="تبدأ الحصة القادمة قريبًا" description="حصة يوسف · تثبيت الحفظ والتجويد · الساعة 09:42 م." actionLabel="فتح الحصة" itemHref="/app/schedule#session-2041" /><ActionAlert urgency="high" title="ينتهي الاشتراك قريبًا" description="راجع الفاتورة المرتبطة بالاشتراك." actionLabel="عرض الفاتورة" itemHref="/app/subscriptions#invoice-next" /><ActionAlert urgency="routine" title="اقترح المعلم موعدًا بديلًا" description="طلب إعادة الجدولة ينتظر ردك." actionLabel="مراجعة الطلب" itemHref="/app/reschedule/request/req-2026-205" /></div></Section>
    <Section title="الأبناء والحفظ"><div className="item-grid"><Item title="يوسف" detail="حفظ جزء عم · المعلّم الشيخ عبدالرحمن" status="نشط" href="/app/history#student-yusuf" action="سجل الحفظ" /><Item title="سارة" detail="تجويد وتلاوة · المعلّمة أ. فاطمة" status="نشط" href="/app/schedule#student-sarah" action="عرض الجدول" /></div></Section>
    <Section title="الحصة القادمة للأبناء"><Item title="سورة مريم (تثبيت الحفظ والتجويد)" detail="اليوم · 09:42 م · مع الشيخ عبدالرحمن" status="حصة فردية" href="/app/schedule#session-2041" action="تفاصيل الحصة" /></Section>
  </>;
}

function TeacherHome() {
  return <><DemoNotice /><PageHeading eyebrow="الرئيسية" title="السلام عليكم، شيخ عبدالرحمن" subtitle="جدول حصصك اليوم ومتابعة تقييمات الطلاب." />
    <Section title="إجراءات مطلوبة عاجلة"><div className="alert-stack"><ActionAlert urgency="critical" title="انتهت الحصة ولم يتم رصد الحضور" description="اربط التقرير بحصة الطالب المحددة." actionLabel="رصد الحضور" itemHref="/app/assessment/student-2026-014" /><ActionAlert urgency="high" title="طلب إعادة جدولة جديد" description="يرجى اقتراح مواعيد بديلة للطلب." actionLabel="فتح الطلب" itemHref="/app/reschedule/request/req-2026-101" /><ActionAlert urgency="routine" title="واجب قرآني بانتظار التقييم" description="افتح الواجب المرتبط بملف الطالب." actionLabel="تقييم الواجب" itemHref="/app/assessment/student-2026-014" /></div></Section>
    <Section title="جدول حصصي اليوم"><div className="item-grid"><Item title="عمر خالد الشمري" detail="04:30 – 05:15 م · حفظ · سورة النبأ" status="جاهزة للبدء" href="/app/schedule#session-2041" action="فتح القاعة" /><Item title="مريم العتيبي" detail="03:30 – 04:15 م · تجويد" status="بانتظار الرصد" href="/app/assessment/student-2026-014" action="رصد الحضور والتقييم" /><Item title="زياد أحمد النصر" detail="06:00 – 06:45 م · تصحيح التلاوة" status="مجدولة لاحقًا" href="/app/schedule#session-2043" action="عرض الحصة" /></div></Section>
  </>;
}

function UsersScreen() {
  return <><DemoNotice /><PageHeading eyebrow="إدارة المستخدمين" title="قائمة الحسابات والتسكين" subtitle="ابحث في الحسابات وتابع الطلاب والمعلمين وأولياء الأمور." />
    <div className="filter-row"><TextField label="البحث" placeholder="ابحث بالاسم أو رقم ولي الأمر أو المعلم" /><div className="chip-row"><Badge tone="success">الطلاب</Badge><Badge tone="neutral">المعلمون</Badge><Badge tone="neutral">أولياء الأمور</Badge></div></div>
    <Section title="حسابات تحتاج متابعة"><div className="alert-stack"><ActionAlert urgency="critical" title="زياد بن فهد — غير مسكن" description="بانتظار تحديد المقرأة والمعلم المناسب." actionLabel="تسكين الطالب" itemHref="/app/users/student-2026-031" /></div></Section>
    <Section title="قائمة الحسابات"><div className="item-grid"><Item title="يحيى الشمري" detail="ولي الأمر: بدر الشمري · سورة النبأ" status="مسكن ونشط" href="/app/users/student-2026-044" action="تعديل التسكين" /><Item title="لمى العبدالله" detail="ولي الأمر: عبدالله المنصور · ٨ حصص شهريًا" status="غير مسكن" href="/app/users/student-2026-051" action="اختيار المعلم والموعد" /><Item title="الشيخ عبدالرزاق" detail="معلم معتمد · ١٢ طالبًا مسكنًا" status="متاح" href="/app/teacher-rates#teacher-21" action="عرض الجدول" /></div></Section>
  </>;
}

function RescheduleRequest() {
  const [sent, setSent] = useState(false);
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setSent(true); }
  return <><DemoNotice /><PageHeading eyebrow="حساب ولي الأمر" title="طلب إعادة جدولة حصة" subtitle="أرسل طلبك مرتبطًا بالحصة المحددة ليتمكن المعلم من مراجعته." />
    <Card className="form-card"><div className="selected-session"><Badge tone="success">حصة محددة</Badge><strong>حصة يوسف · الخميس 24 أكتوبر · 05:15 م</strong><span>مع الشيخ عبدالرحمن</span></div>
      <form className="screen-form" onSubmit={submit}><label className="ui-field"><span className="ui-field__label">سبب إعادة الجدولة</span><select className="ui-input" required defaultValue=""><option value="" disabled>اختر سببًا</option><option>تعارض مع التزامات أخرى</option><option>ظرف عائلي طارئ</option><option>وعكة صحية للطالب</option></select></label><TextField label="ملاحظات إضافية" placeholder="اكتب مواعيد بديلة مناسبة إن أمكن" /><label className="ui-field"><span className="ui-field__label">الموعد البديل المقترح</span><input className="ui-input" type="datetime-local" /></label>
        {sent && <p className="form-success" role="status">تم حفظ الطلب في هذه المعاينة فقط؛ لم يُرسل إلى قاعدة البيانات.</p>}<Button type="submit" disabled>إرسال طلب إعادة الجدولة</Button><p className="field-note">إرسال الطلب الفعلي يتطلب مخطط الطلبات المعتمد في PRD.</p>
      </form>
    </Card>
    <Section title="سجل متابعة الطلب"><Item title="طلب التعديل" detail="بانتظار رد المعلم على المواعيد المقترحة." status="طلب جارٍ" /></Section>
  </>;
}

function ScheduleScreen() {
  return <><DemoNotice /><PageHeading eyebrow="نظام الأكاديمية" title="جدول الجلسات والمقرأة" subtitle="عرض الجلسات المجدولة ومتابعة توفر المعلمين." />
    <div className="segmented-tabs"><Button size="sm">جدول المعلم</Button><Button size="sm" variant="secondary">جدول الطالب</Button></div>
    <Section title="الأسبوع الحالي"><div className="week-strip">{['الأحد 14','الاثنين 15','الثلاثاء 16','الأربعاء 17','الخميس 18'].map((day,i)=><Card className={i===2?'week-day week-day--active':'week-day'} key={day}><span>{day}</span><strong>{i===2?'اليوم':`${14+i}`}</strong></Card>)}</div></Section>
    <Section title="الجلسات المجدولة اليوم"><div className="alert-stack"><ActionAlert urgency="critical" title="تعارض في الموعد — حجز مزدوج" description="تحتاج الجلسة إلى مراجعة قبل بدء وقتها." actionLabel="حل التعارض الآن" itemHref="/app/reschedule/req-2026-101" /></div><div className="item-grid"><Item title="معاذ الهاشمي" detail="04:00 – 04:45 م · سورة النبأ" status="مكتملة" href="/app/assessment/student-2026-014" action="فتح السجل" /><Item title="رمال العتيبي" detail="05:00 – 05:45 م · تجويد" status="حجز مزدوج" href="/app/reschedule/req-2026-101" action="إعادة توزيع الحصة" /><Item title="سعود القحطاني" detail="06:00 – 06:45 م · تحديد المستوى" status="جاهزة للبدء" href="/app/schedule#session-2043" action="دخول القاعة" /></div></Section>
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

function RescheduleCenter() {
  return <><DemoNotice /><PageHeading eyebrow="إدارة الجلسات والتعويضات" title="مركز إعادة الجدولة" subtitle="مراجعة الطلبات ومقترحات المواعيد البديلة." />
    <div className="metric-grid metric-grid--compact"><Metric label="إجمالي الطلبات" value="12" /><Metric label="مقترح جديد" value="3" tone="gold" /><Metric label="طلبات متأخرة" value="1" tone="red" /></div>
    <Section title="طلبات تحتاج قرارًا"><div className="alert-stack"><ActionAlert urgency="critical" title="طلب إعادة جدولة متأخر: الطالب ياسين المنصور" description="تأخر الرد على الطلب؛ راجع الحصة والمواعيد المقترحة." actionLabel="اتخاذ قرار" itemHref="/app/reschedule/req-2026-101" /></div><div className="item-grid"><Item title="ياسر القحطاني" detail="الحصة الأصلية: الاثنين 15 رمضان · 05:00 م" status="بانتظار قرارك" href="/app/reschedule/req-2026-101" action="مراجعة الطلب" /><Item title="د. منصور السليمان" detail="تعارض في الجدول؛ اقترح موعدًا بديلًا." status="تعويض إداري" href="/app/reschedule/req-2026-102" action="جدولة الحصة" /></div></Section>
    <Section title="سجل الطلبات"><EmptyState title="المعروض بيانات توضيحية" detail="لا توجد بعد قاعدة بيانات فعلية لطلبات إعادة الجدولة." actionHref="/app/settings" actionLabel="مراجعة إعدادات المنصة" /></Section>
  </>;
}

function OwnerDues({ client, actor }: AppScreensProps) {
  return <><PageHeading eyebrow="إقفال المستحقات" title="مستحقات المعلمين" subtitle="المعلمات والمعلمون يرون سجلاتهم الشخصية فقط؛ هذه الشاشة للمالك." />
    <Card className="finance-policy"><Badge tone="warning">سياسات التسعير قيد التهيئة</Badge><p>المبالغ تُقرأ من سجلات المستحقات ولا تُحسب هنا. لا توجد صيغة تسعير أو تحويل معتمدة في المشروع بعد.</p></Card>
    <Section title="سجلات المستحقات"><FinancialRows client={client} actor={actor} kind="owner" /></Section>
  </>;
}

function NotificationsScreen() {
  return <><DemoNotice /><PageHeading eyebrow="مركز الإشعارات" title="إجراءات ومعلومات الحساب" subtitle="كل تنبيه يحتاج إجراءً يفتح العنصر المرتبط مباشرة." />
    <Section title="يحتاج إجراء"><div className="alert-stack"><ActionAlert urgency="critical" title="انتهت الحصة ولم يتم رصد الحضور" description="اربط إجراء الحضور بالحصة المحددة." actionLabel="فتح الحصة" itemHref="/app/assessment/student-2026-014" /><ActionAlert urgency="high" title="ينتهي الاشتراك قريبًا" description="راجع الفاتورة من حساب ولي الأمر." actionLabel="عرض الفاتورة" itemHref="/app/subscriptions#invoice-next" /><ActionAlert urgency="routine" title="٣ طلبات إعادة جدولة بانتظار الإجراء" description="افتح الطلب المحدد لتأكيد أو اقتراح موعد." actionLabel="مراجعة الطلب" itemHref="/app/reschedule/req-2026-101" /></div></Section>
    <Section title="معلومات عامة"><div className="information-alert">لا توجد تنبيهات معلوماتية جديدة.</div></Section>
  </>;
}

function TeacherRates() {
  return <><DemoNotice /><PageHeading eyebrow="إدارة التعويضات" title="قاعدة احتساب الأجور" subtitle="تظهر هذه الإعدادات للمالك فقط." />
    <Card className="finance-policy"><Badge tone="warning">قرار D-08 غير محسوم</Badge><p>لن يتم تثبيت تسعير ثابت أو تسعير لكل حصة قبل اعتماد السياسة. هذه الصفحة جاهزة لتخزين الإعداد المعتمد دون افتراض قيمة.</p></Card>
    <Section title="تعريف قواعد المعلمين"><div className="settings-grid"><Metric label="طريقة التسعير" value="غير محددة" tone="gold" /><Metric label="عملة السجل" value="حسب السجل" /><Metric label="تاريخ السريان" value="غير محدد" /></div><EmptyState title="لا توجد قواعد تسعير معتمدة" detail="أضف القاعدة بعد اعتماد قرار التسعير وتاريخ سريانه." /></Section>
  </>;
}

function AssessmentScreen() {
  return <><DemoNotice /><PageHeading eyebrow="تقرير الجلسة" title="تقييم الطالب" subtitle="يرتبط التقييم بحصة واحدة وطالب محدد." />
    <Card className="student-summary"><Badge tone="success">حصة فردية · 45 دقيقة</Badge><h2>ملف الطالب</h2><p>اختر الحصة والطالب من الجدول لعرض التقييم المرتبط بهما.</p></Card>
    <Section title="الحفظ الجديد (المقرر)"><div className="form-grid"><TextField label="السورة" placeholder="اختر السورة" /><TextField label="نطاق الآيات" placeholder="من آية — إلى آية" /></div><div className="choice-row"><Button variant="secondary" disabled>يحتاج مراجعة</Button><Button variant="secondary" disabled>جيد جدًا</Button><Button variant="secondary" disabled>ممتاز</Button></div></Section>
    <Section title="المراجعة والتثبيت"><TextField label="ملاحظات المعلم" placeholder="اكتب الملاحظات المتعلقة بهذه الحصة" /><div className="field-note">لن يتم حفظ تقييم قبل ربطه بحصة فعلية في مخطط قاعدة البيانات.</div></Section>
    <Button size="lg" disabled>حفظ التقرير وإرساله لولي الأمر</Button>
  </>;
}

function PlansPayments({ client, actor }: AppScreensProps) {
  return <><PageHeading eyebrow="الشؤون المالية" title="إدارة الاشتراكات والمدفوعات" subtitle="ملخص الفواتير يعرض الإجماليات فقط." />
    <Card className="finance-policy"><Badge tone="warning">قرارات مالية غير معتمدة</Badge><p>طرق الدفع والاسترداد والعملة الأساسية وطريقة التسعير لم تُحسم. لن تُنفّذ هنا معاملات أو تسويات.</p></Card>
    <Section title="فواتير أولياء الأمور"><FinancialRows client={client} actor={actor} kind="owner-invoices" /></Section>
    <Section title="خطط الأكاديمية"><EmptyState title="لا توجد خطط منشأة" detail="سيتم ربط الخطط بعد اعتماد شكل التسعير وشروط الاشتراك." /></Section>
  </>;
}

function LessonHistory() {
  return <><DemoNotice /><PageHeading eyebrow="متابعة الطالب" title="سجل الحصص المنفذة" subtitle="التقارير مرتبطة بالحصص والتقييمات المسجلة." /><Section title="الحصص السابقة"><EmptyState title="لا توجد حصص مسجلة بعد" detail="ستظهر هنا الحصص المسجلة بعد إنشاء جداول الجلسات وربط تقارير التقييم." actionHref="/app/schedule" actionLabel="عرض الجدول" /></Section></>;
}

function SettingsScreen() {
  return <><PageHeading eyebrow="مالك الأكاديمية" title="الإعدادات المالية وسجل الرقابة" subtitle="الإعدادات العامة والسياسات التي تتحكم في السجلات المالية." />
    <Section title="قرارات تنتظر الاعتماد"><div className="decision-list"><Item title="D-04 · طريقة الاحتساب النسبي" detail="لم تُحدد بعد؛ لن تُستخدم لحساب مستحقات أو فواتير." status="غير محدد" /><Item title="D-05 · طرق الدفع" detail="تحتاج إلى اعتماد طرق الدفع المسموح بها." status="غير محدد" /><Item title="D-06 · سياسة الاسترداد" detail="لا توجد قواعد استرداد معتمدة." status="غير محدد" /><Item title="D-07 · العملة الأساسية" detail="العملة محفوظة على مستوى السجل؛ لا توجد عملة أساسية معتمدة." status="غير محدد" /><Item title="D-08 · نموذج التسعير" detail="لم يُحسم التسعير الثابت أو التسعير لكل حصة." status="غير محدد" /></div></Section>
    <Section title="تقويم العطلات والإجازات الرسمية"><EmptyState title="لا توجد إجازات مضافة" detail="يتطلب تعديل التقويم تحديد صلاحيات الحفظ والتأثير على الجلسات." /></Section>
  </>;
}

export function AppScreen({ screen, actor, client, displayName }: AppScreensProps) {
  switch (screen.id) {
    case 'owner-home': return <OwnerHome />;
    case 'parent-home': return <ParentHome />;
    case 'teacher-home': return <TeacherHome />;
    case 'users': return <UsersScreen />;
    case 'reschedule-request': return <RescheduleRequest />;
    case 'schedule': return <ScheduleScreen />;
    case 'subscriptions': return <SubscriptionsScreen screen={screen} actor={actor} client={client} displayName={displayName} />;
    case 'reschedule-center': return <RescheduleCenter />;
    case 'teacher-dues': return <OwnerDues screen={screen} actor={actor} client={client} displayName={displayName} />;
    case 'notifications': return <NotificationsScreen />;
    case 'teacher-rates': return <TeacherRates />;
    case 'assessment': return <AssessmentScreen />;
    case 'plans-payments': return <PlansPayments screen={screen} actor={actor} client={client} displayName={displayName} />;
    case 'lesson-history': return <LessonHistory />;
    case 'settings': return <SettingsScreen />;
  }
}

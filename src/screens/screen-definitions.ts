import type { AppRole } from '../auth/roles';

export type AppScreenId = 'owner-home' | 'parent-home' | 'users' | 'reschedule-request' | 'schedule' | 'subscriptions' | 'reschedule-center' | 'teacher-dues' | 'teacher-home' | 'notifications' | 'teacher-rates' | 'assessment' | 'plans-payments' | 'lesson-history' | 'settings';

export type ScreenDefinition = Readonly<{ id: AppScreenId; href: string; title: string; shortTitle: string; roles: readonly AppRole[]; icon: string }>;

export const appScreens: readonly ScreenDefinition[] = [
  { id: 'owner-home', href: '/app/owner', title: 'الرئيسية الأكاديمية', shortTitle: 'الرئيسية', roles: ['owner'], icon: 'dashboard' },
  { id: 'parent-home', href: '/app/parent', title: 'الأبناء والحفظ', shortTitle: 'الرئيسية', roles: ['parent'], icon: 'home' },
  { id: 'teacher-home', href: '/app/teacher', title: 'جدول حصصي اليوم', shortTitle: 'الرئيسية', roles: ['teacher'], icon: 'home' },
  { id: 'users', href: '/app/users', title: 'قائمة الحسابات والتسكين', shortTitle: 'المستخدمون', roles: ['owner'], icon: 'group' },
  { id: 'schedule', href: '/app/schedule', title: 'جدول الجلسات والمقرأة', shortTitle: 'الجدول', roles: ['owner', 'teacher', 'parent'], icon: 'calendar_month' },
  { id: 'reschedule-center', href: '/app/reschedule', title: 'مركز إعادة الجدولة', shortTitle: 'التعويض', roles: ['owner'], icon: 'event_repeat' },
  { id: 'reschedule-request', href: '/app/reschedule/request', title: 'طلب إعادة جدولة حصة', shortTitle: 'إعادة الجدولة', roles: ['parent', 'teacher'], icon: 'edit_calendar' },
  { id: 'subscriptions', href: '/app/subscriptions', title: 'الاشتراكات والمدفوعات', shortTitle: 'الاشتراكات', roles: ['parent'], icon: 'account_balance_wallet' },
  { id: 'teacher-dues', href: '/app/teacher-dues', title: 'مستحقات المعلمين', shortTitle: 'المستحقات', roles: ['owner'], icon: 'payments' },
  { id: 'notifications', href: '/app/notifications', title: 'مركز الإشعارات والتنبيهات', shortTitle: 'الإشعارات', roles: ['owner', 'teacher', 'parent'], icon: 'notifications' },
  { id: 'teacher-rates', href: '/app/teacher-rates', title: 'قاعدة احتساب الأجور', shortTitle: 'التسعير', roles: ['owner'], icon: 'gavel' },
  { id: 'assessment', href: '/app/assessment', title: 'تقييم الطالب', shortTitle: 'التقييم', roles: ['teacher'], icon: 'menu_book' },
  { id: 'plans-payments', href: '/app/payments', title: 'إدارة الاشتراكات والمدفوعات', shortTitle: 'المدفوعات', roles: ['owner'], icon: 'request_quote' },
  { id: 'lesson-history', href: '/app/history', title: 'سجل الحصص المنفذة', shortTitle: 'السجل', roles: ['teacher', 'parent'], icon: 'history' },
  { id: 'settings', href: '/app/settings', title: 'الإعدادات المالية وسجل الرقابة', shortTitle: 'الإعدادات', roles: ['owner'], icon: 'tune' },
];

export function screenForPath(path: string): ScreenDefinition | undefined {
  if (path.startsWith('/app/reschedule/request')) return appScreens.find(screen => screen.id === 'reschedule-request');
  if (path.startsWith('/app/reschedule/')) return appScreens.find(screen => screen.id === 'reschedule-center');
  return appScreens.find(screen => screen.href === path);
}

export function defaultScreenForRole(role: AppRole): ScreenDefinition {
  return appScreens.find(screen => screen.roles.includes(role) && ['owner-home', 'parent-home', 'teacher-home'].includes(screen.id))!;
}

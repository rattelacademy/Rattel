import type { SupabaseClient } from '@supabase/supabase-js';
import type { ActorIdentity, AppRole } from '../auth/roles';

export type StudentRecord = Readonly<{
  id: string;
  full_name: string;
  parent_user_ids: string[];
  teacher_id: string | null;
  status: 'active' | 'unassigned' | 'inactive';
}>;

export type ProfileRecord = Readonly<{ id: string; display_name: string; roles: readonly AppRole[] }>;

export type LessonSessionRecord = Readonly<{
  id: string;
  student_id: string;
  teacher_id: string;
  subject: 'hifz' | 'tajweed' | 'qiraat' | 'other';
  starts_at: string;
  ends_at: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  attendance_status: 'unrecorded' | 'attended' | 'absent';
}>;

export type RescheduleRecord = Readonly<{
  id: string;
  session_id: string;
  requested_by: string;
  requester_role: 'parent' | 'teacher';
  reason: string;
  proposed_times: string[];
  status: 'pending' | 'offered' | 'accepted' | 'rejected' | 'cancelled';
  decision_note: string;
  decided_by: string | null;
  created_at: string;
}>;

export type NotificationRecord = Readonly<{
  id: string;
  title: string;
  message: string;
  target_path: string | null;
  read_at: string | null;
  created_at: string;
}>;

export type SessionReportInput = Readonly<{
  sessionId: string;
  studentId: string;
  teacherId: string;
  newSurah: string | null;
  ayahStart: number | null;
  ayahEnd: number | null;
  memorizationScore: number | null;
  revisionScore: number | null;
  tajweedNotes: string;
  teacherNotes: string;
  homework: string;
}>;

export type SessionReportRecord = SessionReportInput & Readonly<{
  id: string;
  new_surah: string | null;
  ayah_start: number | null;
  ayah_end: number | null;
  memorization_score: number | null;
  revision_score: number | null;
  tajweed_notes: string;
  teacher_notes: string;
  homework: string;
}>;

export async function listStudents(client: SupabaseClient): Promise<StudentRecord[]> {
  const { data, error } = await client.from('students')
    .select('id, full_name, parent_user_ids, teacher_id, status')
    .order('full_name');
  if (error) throw error;
  return (data ?? []) as StudentRecord[];
}

export async function listDirectory(client: SupabaseClient): Promise<ProfileRecord[]> {
  const [{ data: profileRows, error: profileError }, { data: roleRows, error: roleError }] = await Promise.all([
    client.from('profiles').select('id, display_name').order('display_name'),
    client.from('user_roles').select('user_id, role'),
  ]);
  if (profileError) throw profileError;
  if (roleError) throw roleError;
  const rolesByUser = new Map<string, AppRole[]>();
  for (const row of roleRows ?? []) {
    const role = String(row.role) as AppRole;
    const roles = rolesByUser.get(row.user_id) ?? [];
    roles.push(role);
    rolesByUser.set(row.user_id, roles);
  }
  return (profileRows ?? []).map(row => ({
    id: row.id,
    display_name: row.display_name,
    roles: rolesByUser.get(row.id) ?? [],
  })) as ProfileRecord[];
}

export async function setUserRole(client: SupabaseClient, userId: string, role: Extract<AppRole, 'teacher' | 'parent'>, enabled: boolean): Promise<void> {
  const current = await client.from('user_roles').select('user_id').eq('user_id', userId).eq('role', role).maybeSingle();
  if (current.error) throw current.error;
  if (enabled && !current.data) {
    const result = await client.from('user_roles').insert({ user_id: userId, role });
    if (result.error) throw result.error;
  }
  if (!enabled && current.data) {
    const result = await client.from('user_roles').delete().eq('user_id', userId).eq('role', role);
    if (result.error) throw result.error;
  }
}

export async function saveStudentPlacement(
  client: SupabaseClient,
  input: Pick<StudentRecord, 'id' | 'full_name' | 'parent_user_ids' | 'teacher_id' | 'status'> | Omit<StudentRecord, 'id'>,
): Promise<void> {
  const { id, ...placement } = input as StudentRecord;
  const query = id
    ? client.from('students').update(placement).eq('id', id)
    : client.from('students').insert(placement);
  const { error } = await query;
  if (error) throw error;
}

export async function listLessonSessions(client: SupabaseClient, actor: ActorIdentity): Promise<LessonSessionRecord[]> {
  let query = client.from('lesson_sessions')
    .select('id, student_id, teacher_id, subject, starts_at, ends_at, status, attendance_status')
    .order('starts_at');
  if (actor.roles.includes('teacher') && !actor.roles.includes('owner')) query = query.eq('teacher_id', actor.userId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as LessonSessionRecord[];
}

export async function recordAttendance(
  client: SupabaseClient,
  sessionId: string,
  attendanceStatus: Extract<LessonSessionRecord['attendance_status'], 'attended' | 'absent'>,
): Promise<void> {
  const { error } = await client.from('lesson_sessions')
    .update({ attendance_status: attendanceStatus })
    .eq('id', sessionId);
  if (error) throw error;
}

export async function listRescheduleRequests(client: SupabaseClient): Promise<RescheduleRecord[]> {
  const { data, error } = await client.from('reschedule_requests')
    .select('id, session_id, requested_by, requester_role, reason, proposed_times, status, decision_note, decided_by, created_at')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as RescheduleRecord[];
}

export async function getSessionReport(client: SupabaseClient, sessionId: string): Promise<SessionReportRecord | null> {
  const { data, error } = await client.from('session_reports').select('*').eq('session_id', sessionId).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    ...data,
    sessionId: data.session_id,
    studentId: data.student_id,
    teacherId: data.teacher_id,
  } as SessionReportRecord;
}

export async function createRescheduleRequest(
  client: SupabaseClient,
  actor: ActorIdentity,
  sessionId: string,
  reason: string,
  proposedTimes: string[],
): Promise<void> {
  const requesterRole = actor.roles.includes('teacher') ? 'teacher' : 'parent';
  const { error } = await client.from('reschedule_requests').insert({
    session_id: sessionId,
    requested_by: actor.userId,
    requester_role: requesterRole,
    reason: reason.trim(),
    proposed_times: proposedTimes,
  });
  if (error) throw error;
}

export async function decideRescheduleRequest(
  client: SupabaseClient,
  requestId: string,
  status: Extract<RescheduleRecord['status'], 'offered' | 'accepted' | 'rejected' | 'cancelled'>,
  decisionNote = '',
  proposedTimes: string[] = [],
): Promise<void> {
  const { error } = await client.from('reschedule_requests')
    .update({ status, decision_note: decisionNote, proposed_times: proposedTimes })
    .eq('id', requestId);
  if (error) throw error;
}

export async function listNotifications(client: SupabaseClient): Promise<NotificationRecord[]> {
  const { data, error } = await client.from('notifications')
    .select('id, title, message, target_path, read_at, created_at')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as NotificationRecord[];
}

export async function markNotificationRead(client: SupabaseClient, id: string): Promise<void> {
  const { error } = await client.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', id);
  if (error) throw error;
}

export async function saveSessionReport(client: SupabaseClient, report: SessionReportInput): Promise<void> {
  const values = {
    session_id: report.sessionId,
    student_id: report.studentId,
    teacher_id: report.teacherId,
    new_surah: report.newSurah,
    ayah_start: report.ayahStart,
    ayah_end: report.ayahEnd,
    memorization_score: report.memorizationScore,
    revision_score: report.revisionScore,
    tajweed_notes: report.tajweedNotes,
    teacher_notes: report.teacherNotes,
    homework: report.homework,
  };
  const { data: existing, error: lookupError } = await client.from('session_reports').select('id').eq('session_id', report.sessionId).maybeSingle();
  if (lookupError) throw lookupError;
  const result = existing
    ? await client.from('session_reports').update(values).eq('id', existing.id)
    : await client.from('session_reports').insert(values);
  if (result.error) throw result.error;
}

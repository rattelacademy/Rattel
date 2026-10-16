import type { ActorIdentity } from '../auth/roles';
import { canReadParentInvoice, canReadTeacherEarnings } from '../auth/financial-access';
import type { SupabaseClient } from '@supabase/supabase-js';

export type TeacherEarning = Readonly<{
  id: string;
  teacher_id: string;
  period_start: string;
  period_end: string;
  amount: number;
  currency: string;
  status: 'pending' | 'approved' | 'paid';
}>;

export type ParentInvoice = Readonly<{
  id: string;
  parent_id: string;
  amount: number;
  currency: string;
  status: 'draft' | 'open' | 'paid' | 'void';
  issued_at: string;
}>;

export async function getTeacherEarnings(
  client: SupabaseClient,
  actor: ActorIdentity,
  teacherId: string,
): Promise<TeacherEarning[]> {
  if (!canReadTeacherEarnings(actor, teacherId)) throw new Error('Forbidden');
  const { data, error } = await client
    .from('teacher_earnings')
    .select('id, teacher_id, period_start, period_end, amount, currency, status')
    .eq('teacher_id', teacherId)
    .order('period_start', { ascending: false });
  if (error) throw error;
  return (data ?? []) as TeacherEarning[];
}

export async function getParentInvoices(
  client: SupabaseClient,
  actor: ActorIdentity,
  parentId: string,
): Promise<ParentInvoice[]> {
  if (!canReadParentInvoice(actor, parentId)) throw new Error('Forbidden');
  const { data, error } = await client
    .from('parent_invoice_summary')
    .select('id, parent_id, amount, currency, status, issued_at')
    .eq('parent_id', parentId)
    .order('issued_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as ParentInvoice[];
}

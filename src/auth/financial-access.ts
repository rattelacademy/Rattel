import type { ActorIdentity } from './roles';

export function canReadTeacherEarnings(actor: ActorIdentity | null, teacherId: string): boolean {
  if (!actor) return false;
  if (actor.roles.includes('owner')) return true;
  return actor.roles.includes('teacher') && actor.userId === teacherId;
}

export function canReadParentInvoice(actor: ActorIdentity | null, parentId: string): boolean {
  if (!actor) return false;
  if (actor.roles.includes('owner')) return true;
  return actor.roles.includes('parent') && actor.userId === parentId;
}

export function canWriteTeacherEarnings(actor: ActorIdentity | null): boolean {
  return Boolean(actor?.roles.includes('owner'));
}

import { describe, expect, it } from 'vitest';
import type { ActorIdentity } from './roles';
import { canReadParentInvoice, canReadTeacherEarnings, canWriteTeacherEarnings } from './financial-access';

const teacher: ActorIdentity = { userId: 'teacher-1', roles: ['teacher'] };
const parent: ActorIdentity = { userId: 'parent-1', roles: ['parent'] };
const owner: ActorIdentity = { userId: 'owner-1', roles: ['owner'] };

describe('financial access guards', () => {
  it('limits teacher earnings to the signed-in teacher and owner', () => {
    expect(canReadTeacherEarnings(teacher, 'teacher-1')).toBe(true);
    expect(canReadTeacherEarnings(teacher, 'teacher-2')).toBe(false);
    expect(canReadTeacherEarnings(parent, 'teacher-1')).toBe(false);
    expect(canReadTeacherEarnings(owner, 'teacher-2')).toBe(true);
    expect(canReadTeacherEarnings(null, 'teacher-1')).toBe(false);
  });

  it('limits parent invoices to the signed-in parent and owner', () => {
    expect(canReadParentInvoice(parent, 'parent-1')).toBe(true);
    expect(canReadParentInvoice(parent, 'parent-2')).toBe(false);
    expect(canReadParentInvoice(teacher, 'parent-1')).toBe(false);
    expect(canReadParentInvoice(owner, 'parent-2')).toBe(true);
    expect(canReadParentInvoice(null, 'parent-1')).toBe(false);
  });

  it('does not grant teacher earning writes in the client policy layer', () => {
    expect(canWriteTeacherEarnings(teacher)).toBe(false);
    expect(canWriteTeacherEarnings(parent)).toBe(false);
    expect(canWriteTeacherEarnings(null)).toBe(false);
  });
});

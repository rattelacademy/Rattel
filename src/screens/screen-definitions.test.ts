import { describe, expect, it } from 'vitest';
import { defaultScreenForRole, screenForPath } from './screen-definitions';

describe('role-aware deep links', () => {
  it('opens a specific assessment from its exact session path', () => {
    expect(screenForPath('/app/assessment/session-123')?.id).toBe('assessment');
  });

  it('distinguishes a reschedule request from the owner request center', () => {
    expect(screenForPath('/app/reschedule/request/session-123')?.id).toBe('reschedule-request');
    expect(screenForPath('/app/reschedule/request?session_id=session-123')?.id).toBe('reschedule-request');
    expect(screenForPath('/app/reschedule/request-123')?.id).toBe('reschedule-center');
  });

  it('routes student history deep links to the history screen', () => {
    expect(screenForPath('/app/history?student_id=student-123')?.id).toBe('lesson-history');
  });

  it('selects the correct landing screen for each role', () => {
    expect(defaultScreenForRole('owner').id).toBe('owner-home');
    expect(defaultScreenForRole('teacher').id).toBe('teacher-home');
    expect(defaultScreenForRole('parent').id).toBe('parent-home');
  });
});

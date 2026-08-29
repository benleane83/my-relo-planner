import { describe, expect, it } from 'vitest';
import {
  addMonths,
  getMonthGrid,
  groupEventsByDate,
  normalizeCalendarEvents,
  parseDateOnly,
} from '@/lib/calendar';
import type { Milestone, Task } from '@/types';

const milestone: Milestone = {
  id: 'milestone-1',
  title: 'Book flights',
  category: 'travel',
  targetDate: '2026-09-18',
  status: 'completed',
  notes: '',
};

const task: Task = {
  id: 'task-1',
  title: 'Compare flights',
  category: 'travel',
  milestone: 'milestone-1',
  status: 'done',
  priority: 'high',
  dueDate: '2026-09-18',
  notes: '',
};

describe('calendar date utilities', () => {
  it('parses date-only values in local time', () => {
    const date = parseDateOnly('2026-09-18');

    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(8);
    expect(date.getDate()).toBe(18);
    expect(date.getHours()).toBe(0);
  });

  it('rejects malformed and impossible date-only values', () => {
    expect(() => parseDateOnly('09/18/2026')).toThrow('Invalid date-only value');
    expect(() => parseDateOnly('2026-02-30')).toThrow('Invalid date-only value');
  });

  it('builds a Monday-first six-week grid across month boundaries', () => {
    const days = getMonthGrid(new Date(2026, 8, 1));

    expect(days).toHaveLength(42);
    expect(days[0].dateKey).toBe('2026-08-31');
    expect(days[0].isCurrentMonth).toBe(false);
    expect(days[41].dateKey).toBe('2026-10-11');
  });

  it('includes leap day in February', () => {
    const days = getMonthGrid(new Date(2028, 1, 1));

    expect(days.some((day) => day.dateKey === '2028-02-29' && day.isCurrentMonth)).toBe(true);
  });

  it('navigates across year boundaries', () => {
    const next = addMonths(new Date(2026, 11, 1), 1);
    const previous = addMonths(new Date(2026, 0, 1), -1);

    expect([next.getFullYear(), next.getMonth()]).toEqual([2027, 0]);
    expect([previous.getFullYear(), previous.getMonth()]).toEqual([2025, 11]);
  });
});

describe('calendar events', () => {
  it('normalizes task and milestone completion state and sorts milestones first', () => {
    const events = normalizeCalendarEvents([milestone], [task]);

    expect(events.map((event) => event.type)).toEqual(['milestone', 'task']);
    expect(events.every((event) => event.isCompleted)).toBe(true);
    expect(events[0].item).toBe(milestone);
    expect(events[1].item).toBe(task);
  });

  it('groups normalized events by date', () => {
    const events = normalizeCalendarEvents([milestone], [task]);
    const grouped = groupEventsByDate(events);

    expect(grouped.get('2026-09-18')).toEqual(events);
    expect(grouped.size).toBe(1);
  });

  it('uses title as a stable tie-breaker for events of the same type', () => {
    const laterTitle = { ...task, id: 'task-2', title: 'Pack bags' };
    const events = normalizeCalendarEvents([], [laterTitle, task]);

    expect(events.map((event) => event.title)).toEqual(['Compare flights', 'Pack bags']);
  });
});

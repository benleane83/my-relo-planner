import type { Milestone, Task } from '@/types';

export interface CalendarDay {
  date: Date;
  dateKey: string;
  dayNumber: number;
  isCurrentMonth: boolean;
}

interface BaseCalendarEvent {
  id: string;
  title: string;
  category: string;
  date: string;
  status: string;
  isCompleted: boolean;
}

export interface MilestoneCalendarEvent extends BaseCalendarEvent {
  type: 'milestone';
  item: Milestone;
}

export interface TaskCalendarEvent extends BaseCalendarEvent {
  type: 'task';
  item: Task;
}

export type CalendarEvent = MilestoneCalendarEvent | TaskCalendarEvent;

const dateOnlyPattern = /^(\d{4})-(\d{2})-(\d{2})$/;

export function parseDateOnly(value: string): Date {
  const match = dateOnlyPattern.exec(value);
  if (!match) {
    throw new Error(`Invalid date-only value: ${value}`);
  }

  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date = new Date(year, month, day);

  if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) {
    throw new Error(`Invalid date-only value: ${value}`);
  }

  return date;
}

export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addMonths(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

export function getMonthGrid(month: Date): CalendarDay[] {
  const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
  const mondayFirstOffset = (monthStart.getDay() + 6) % 7;
  const gridStart = new Date(
    monthStart.getFullYear(),
    monthStart.getMonth(),
    monthStart.getDate() - mondayFirstOffset
  );

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(
      gridStart.getFullYear(),
      gridStart.getMonth(),
      gridStart.getDate() + index
    );

    return {
      date,
      dateKey: toDateKey(date),
      dayNumber: date.getDate(),
      isCurrentMonth: date.getMonth() === monthStart.getMonth()
        && date.getFullYear() === monthStart.getFullYear(),
    };
  });
}

export function normalizeCalendarEvents(
  milestones: Milestone[],
  tasks: Task[]
): CalendarEvent[] {
  const milestoneEvents: MilestoneCalendarEvent[] = milestones.map((milestone) => ({
    id: milestone.id,
    title: milestone.title,
    category: milestone.category,
    date: milestone.targetDate,
    status: milestone.status,
    isCompleted: milestone.status === 'completed',
    type: 'milestone',
    item: milestone,
  }));

  const taskEvents: TaskCalendarEvent[] = tasks.map((task) => ({
    id: task.id,
    title: task.title,
    category: task.category,
    date: task.dueDate,
    status: task.status,
    isCompleted: task.status === 'done',
    type: 'task',
    item: task,
  }));

  return [...milestoneEvents, ...taskEvents].sort((a, b) => {
    const dateDiff = a.date.localeCompare(b.date);
    if (dateDiff !== 0) return dateDiff;

    const typeDiff = a.type.localeCompare(b.type);
    if (typeDiff !== 0) return typeDiff;

    return a.title.localeCompare(b.title);
  });
}

export function groupEventsByDate(events: CalendarEvent[]): Map<string, CalendarEvent[]> {
  const grouped = new Map<string, CalendarEvent[]>();

  for (const event of events) {
    const existing = grouped.get(event.date) ?? [];
    existing.push(event);
    grouped.set(event.date, existing);
  }

  return grouped;
}

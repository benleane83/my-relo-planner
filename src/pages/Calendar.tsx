import { useMemo, useState } from 'react';
import {
  CalendarCheck,
  CheckSquare2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import MilestoneDialog from '@/components/dialogs/MilestoneDialog';
import TaskDialog from '@/components/dialogs/TaskDialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useMilestones, useTasks } from '@/hooks/useApi';
import {
  addMonths,
  getMonthGrid,
  groupEventsByDate,
  normalizeCalendarEvents,
  toDateKey,
  type CalendarEvent,
} from '@/lib/calendar';
import { cn } from '@/lib/utils';
import type { Milestone, Task } from '@/types';

const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function Calendar() {
  const milestonesQuery = useMilestones();
  const tasksQuery = useTasks();
  const [displayMonth, setDisplayMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [editMilestone, setEditMilestone] = useState<Milestone | null>(null);
  const [editTask, setEditTask] = useState<Task | null>(null);

  const days = useMemo(() => getMonthGrid(displayMonth), [displayMonth]);
  const events = useMemo(
    () => normalizeCalendarEvents(milestonesQuery.data ?? [], tasksQuery.data ?? []),
    [milestonesQuery.data, tasksQuery.data]
  );
  const eventsByDate = useMemo(() => groupEventsByDate(events), [events]);
  const taskCategories = useMemo(
    () => Array.from(new Set((tasksQuery.data ?? []).map((task) => task.category))).sort(),
    [tasksQuery.data]
  );
  const hasCurrentMonthEvents = events.some((event) => {
    const [year, month] = event.date.split('-').map(Number);
    return year === displayMonth.getFullYear() && month === displayMonth.getMonth() + 1;
  });
  const todayKey = toDateKey(new Date());
  const isLoading = milestonesQuery.isLoading || tasksQuery.isLoading;
  const isError = milestonesQuery.isError || tasksQuery.isError;

  const openEvent = (event: CalendarEvent) => {
    if (event.type === 'milestone') {
      setEditMilestone(event.item);
    } else {
      setEditTask(event.item);
    }
  };

  const goToToday = () => {
    const now = new Date();
    setDisplayMonth(new Date(now.getFullYear(), now.getMonth(), 1));
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Calendar</h2>
          <p className="text-sm text-muted-foreground">Milestones and tasks by target date</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToToday}>Today</Button>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Previous month"
            onClick={() => setDisplayMonth((month) => addMonths(month, -1))}
          >
            <ChevronLeft />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Next month"
            onClick={() => setDisplayMonth((month) => addMonths(month, 1))}
          >
            <ChevronRight />
          </Button>
        </div>
      </div>

      <h3 className="text-center text-lg font-semibold" aria-live="polite">
        {displayMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
      </h3>

      {isError && (
        <div role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          Calendar data could not be loaded. Refresh the page to try again.
        </div>
      )}

      {!isLoading && !isError && !hasCurrentMonthEvents && (
        <div className="rounded-lg border border-dashed p-3 text-center text-sm text-muted-foreground">
          No milestones or tasks are scheduled for this month.
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border">
        <div className="min-w-[56rem]">
          <div className="grid grid-cols-7 border-b bg-muted/40">
            {weekDays.map((day) => (
              <div key={day} className="px-2 py-2 text-center text-xs font-semibold text-muted-foreground">
                {day}
              </div>
            ))}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-7">
              {Array.from({ length: 42 }, (_, index) => (
                <div key={index} className="min-h-36 border-b border-r p-2">
                  <Skeleton className="mb-3 size-6 rounded-full" />
                  <Skeleton className="mb-2 h-6 w-full" />
                  <Skeleton className="h-6 w-4/5" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-7">
              {days.map((day) => (
                <div
                  key={day.dateKey}
                  className={cn(
                    'min-h-36 border-b border-r p-2',
                    !day.isCurrentMonth && 'bg-muted/25 text-muted-foreground'
                  )}
                >
                  <div
                    className={cn(
                      'mb-2 flex size-7 items-center justify-center rounded-full text-xs font-medium',
                      day.dateKey === todayKey && 'bg-primary text-primary-foreground'
                    )}
                    aria-label={day.date.toLocaleDateString(undefined, {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  >
                    {day.dayNumber}
                  </div>
                  <div className="flex flex-col gap-1">
                    {(eventsByDate.get(day.dateKey) ?? []).map((event) => (
                      <CalendarEventButton
                        key={`${event.type}-${event.id}`}
                        event={event}
                        onClick={() => openEvent(event)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5"><CalendarCheck className="size-3.5 text-amber-600" /> Milestone</span>
        <span className="flex items-center gap-1.5"><CheckSquare2 className="size-3.5 text-primary" /> Task</span>
        <span>Completed items are muted</span>
      </div>

      <MilestoneDialog
        open={editMilestone !== null}
        onOpenChange={(open) => {
          if (!open) setEditMilestone(null);
        }}
        milestone={editMilestone}
      />
      <TaskDialog
        open={editTask !== null}
        onOpenChange={(open) => {
          if (!open) setEditTask(null);
        }}
        task={editTask}
        categories={taskCategories}
      />
    </div>
  );
}

function CalendarEventButton({
  event,
  onClick,
}: {
  event: CalendarEvent;
  onClick: () => void;
}) {
  const Icon = event.type === 'milestone' ? CalendarCheck : CheckSquare2;
  const typeLabel = event.type === 'milestone' ? 'Milestone' : 'Task';

  return (
    <button
      type="button"
      onClick={onClick}
      title={`${typeLabel}: ${event.title} (${event.status})`}
      aria-label={`Edit ${typeLabel.toLowerCase()} ${event.title}, status ${event.status}`}
      className={cn(
        'flex w-full items-start gap-1.5 rounded-md border px-2 py-1.5 text-left text-xs transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        event.type === 'milestone'
          ? 'border-amber-500/30 bg-amber-500/10'
          : 'border-primary/25 bg-primary/10',
        event.isCompleted && 'opacity-50'
      )}
    >
      <Icon
        className={cn(
          'mt-0.5 size-3 shrink-0',
          event.type === 'milestone' ? 'text-amber-600' : 'text-primary'
        )}
      />
      <span className={cn('line-clamp-2', event.isCompleted && 'line-through')}>
        {event.title}
      </span>
    </button>
  );
}

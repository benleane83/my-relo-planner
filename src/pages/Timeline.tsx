import { useMemo, useState } from 'react';
import { useMilestones, useTasks } from '@/hooks/useApi';
import { cn } from '@/lib/utils';
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { PencilIcon, AlertTriangle, Clock, XCircle, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import type { Milestone } from '@/types';
import MilestoneDialog from '@/components/dialogs/MilestoneDialog';

type Conflict = {
  id: string;
  type: 'scheduling' | 'dependency' | 'blocker';
  severity: 'high' | 'medium' | 'low';
  title: string;
  description: string;
};

const DAY_IN_MS = 24 * 60 * 60 * 1000;

const parseDate = (value: string) => {
  const plainDateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (plainDateMatch) {
    const [, year, month, day] = plainDateMatch;
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

const formatDate = (value: string) => {
  const date = parseDate(value);
  return date ? date.toLocaleDateString() : 'Invalid date';
};

const sortByDate = (left: string, right: string) => {
  const leftDate = parseDate(left);
  const rightDate = parseDate(right);

  if (!leftDate && !rightDate) return 0;
  if (!leftDate) return 1;
  if (!rightDate) return -1;

  return leftDate.getTime() - rightDate.getTime();
};

const daysFromToday = (value: string, today: Date) => {
  const date = parseDate(value);
  if (!date) return null;
  return Math.floor((startOfDay(date).getTime() - today.getTime()) / DAY_IN_MS);
};

const formatRelativeDay = (days: number) => {
  if (days < 0) return `overdue by ${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'}`;
  if (days === 0) return 'due today';
  return `due in ${days} day${days === 1 ? '' : 's'}`;
};

const statusColor = (status: string) => {
  switch (status) {
    case 'completed':
      return 'bg-emerald-500';
    case 'in-progress':
      return 'bg-primary';
    default:
      return 'bg-muted-foreground/40';
  }
};

const statusBadgeVariant = (status: string) => {
  switch (status) {
    case 'completed':
      return 'default' as const;
    case 'in-progress':
      return 'secondary' as const;
    default:
      return 'outline' as const;
  }
};

export default function Timeline() {
  const { data: milestones, isLoading: milestonesLoading } = useMilestones();
  const { data: tasks, isLoading: tasksLoading } = useTasks();
  const [editMilestone, setEditMilestone] = useState<Milestone | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [conflictsExpanded, setConflictsExpanded] = useState(true);

  const sorted = useMemo(() => {
    if (!milestones) return [];
    return [...milestones].sort((a, b) => sortByDate(a.targetDate, b.targetDate));
  }, [milestones]);

  const conflicts = useMemo(() => {
    if (!milestones || !tasks) return [];
    const results: Conflict[] = [];
    const today = startOfDay(new Date());
    const milestonesById = new Map(milestones.map((milestone) => [milestone.id, milestone]));

    // 1. Scheduling conflicts — task dueDate after milestone targetDate
    tasks.forEach((task) => {
      const milestone = task.milestone ? milestonesById.get(task.milestone) : undefined;
      const taskDue = parseDate(task.dueDate);
      const milestoneTarget = milestone ? parseDate(milestone.targetDate) : null;

      if (milestone && taskDue && milestoneTarget && taskDue > milestoneTarget) {
        results.push({
          id: `scheduling-${task.id}`,
          type: 'scheduling',
          severity: 'medium',
          title: 'Scheduling conflict',
          description: `Task "${task.title}" is due on ${formatDate(task.dueDate)}, after milestone "${milestone.title}" on ${formatDate(milestone.targetDate)}.`,
        });
      }
    });

    // 2. Dependency gaps — incomplete prerequisites for upcoming tasks
    milestones.forEach((milestone) => {
      const milestoneTasks = tasks.filter((t) => t.milestone === milestone.id);
      const sortedMilestoneTasks = [...milestoneTasks].sort((a, b) => sortByDate(a.dueDate, b.dueDate));

      sortedMilestoneTasks.forEach((task, idx) => {
        if (task.status !== 'todo') {
          return;
        }

        const daysUntilDue = daysFromToday(task.dueDate, today);
        if (daysUntilDue === null || daysUntilDue > 7) {
          return;
        }

        const prerequisites = sortedMilestoneTasks.slice(0, idx);
        const incompletePrerequisites = prerequisites.filter((prerequisite) => prerequisite.status !== 'done');

        if (incompletePrerequisites.length > 0) {
          results.push({
            id: `dependency-${task.id}`,
            type: 'dependency',
            severity: 'low',
            title: 'Dependency gap',
            description: `Task "${task.title}" is ${formatRelativeDay(daysUntilDue)} and still depends on ${incompletePrerequisites.map((prerequisite) => `"${prerequisite.title}"`).join(', ')}.`,
          });
        }
      });
    });

    // 3. Critical blockers — blocked tasks or at-risk milestones
    tasks.forEach((task) => {
      if (task.status === 'blocked') {
        const milestone = task.milestone ? milestonesById.get(task.milestone) : undefined;
        results.push({
          id: `blocked-${task.id}`,
          type: 'blocker',
          severity: 'high',
          title: 'Task blocked',
          description: milestone
            ? `Task "${task.title}" is blocking milestone "${milestone.title}". ${task.notes || 'No details provided.'}`
            : `Task "${task.title}" is currently blocked. ${task.notes || 'No details provided.'}`,
        });
      }
    });

    milestones.forEach((milestone) => {
      const daysUntilTarget = daysFromToday(milestone.targetDate, today);
      if (daysUntilTarget === null || daysUntilTarget > 14 || milestone.status === 'completed') {
        return;
      }

      const milestoneTasks = tasks.filter((t) => t.milestone === milestone.id);
      const allIncomplete = milestoneTasks.length > 0 && milestoneTasks.every((task) => task.status !== 'done');

      if (allIncomplete) {
        results.push({
          id: `milestone-${milestone.id}`,
          type: 'blocker',
          severity: 'high',
          title: daysUntilTarget < 0 ? 'Milestone overdue' : 'Milestone at risk',
          description: `Milestone "${milestone.title}" is ${formatRelativeDay(daysUntilTarget)} and all ${milestoneTasks.length} linked task${milestoneTasks.length === 1 ? ' is' : 's are'} still incomplete.`,
        });
      }
    });

    return results.sort((left, right) => {
      const severityRank = { high: 0, medium: 1, low: 2 };
      return severityRank[left.severity] - severityRank[right.severity];
    });
  }, [milestones, tasks]);

  const isLoading = milestonesLoading || tasksLoading;

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <h2 className="text-2xl font-bold tracking-tight">Timeline</h2>
        <div className="flex flex-col gap-6 pl-8">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-2xl font-bold tracking-tight">Timeline</h2>

      {/* Conflicts Section */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Smart Conflict Detection</CardTitle>
          <CardDescription>
            Spot blockers, scheduling slips, and near-term dependency gaps before they disrupt the move.
          </CardDescription>
          <CardAction className="flex items-center gap-2">
            {conflicts.length > 0 ? (
              <Badge variant="destructive">{conflicts.length} conflict{conflicts.length !== 1 ? 's' : ''}</Badge>
            ) : (
              <Badge className="bg-emerald-500 text-white">No conflicts</Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConflictsExpanded(!conflictsExpanded)}
              aria-label={conflictsExpanded ? 'Collapse conflicts' : 'Expand conflicts'}
            >
              {conflictsExpanded ? <ChevronUp /> : <ChevronDown />}
            </Button>
          </CardAction>
        </CardHeader>
        {conflictsExpanded && (
          <CardContent className="pt-0">
            {conflicts.length === 0 ? (
              <Alert className="border-emerald-500/50 bg-emerald-500/10">
                <CheckCircle2 className="text-emerald-600" />
                <AlertTitle>No conflicts detected</AlertTitle>
                <AlertDescription>
                  All tasks and milestones are properly scheduled with no detected issues.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="flex flex-col gap-3">
                {conflicts.map((conflict) => {
                  const Icon = conflict.type === 'blocker' ? XCircle : conflict.type === 'dependency' ? Clock : AlertTriangle;
                  const variant = conflict.severity === 'high' ? 'destructive' : 'default';
                  const borderColor = conflict.severity === 'high' ? 'border-destructive/50' : conflict.severity === 'medium' ? 'border-amber-500/50' : 'border-yellow-500/50';
                  const bgColor = conflict.severity === 'high' ? 'bg-destructive/10' : conflict.severity === 'medium' ? 'bg-amber-500/10' : 'bg-yellow-500/10';
                  const iconColor = conflict.severity === 'high' ? 'text-destructive' : conflict.severity === 'medium' ? 'text-amber-600' : 'text-yellow-600';

                  return (
                    <Alert key={conflict.id} variant={variant} className={cn(borderColor, bgColor)}>
                      <Icon className={iconColor} />
                      <AlertTitle>{conflict.title}</AlertTitle>
                      <AlertDescription>{conflict.description}</AlertDescription>
                    </Alert>
                  );
                })}
              </div>
            )}
          </CardContent>
        )}
      </Card>

      <Separator />

      <div className="relative pl-8">
        {/* Vertical line */}
        <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-border" />

        <div className="flex flex-col gap-6">
          {sorted.map((milestone) => (
            <div key={milestone.id} className="relative flex gap-4">
              {/* Dot */}
              <div
                className={cn(
                  'absolute -left-5 top-4 size-3 rounded-full ring-2 ring-background',
                  statusColor(milestone.status)
                )}
              />

              <Card className="flex-1">
                <CardHeader className="pb-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle className="text-base">{milestone.title}</CardTitle>
                    <Badge variant={statusBadgeVariant(milestone.status)}>
                      {milestone.status}
                    </Badge>
                    <Badge variant="outline">{milestone.category}</Badge>
                    <Button variant="outline" size="icon-xs" className="ml-auto" onClick={() => { setEditMilestone(milestone); setDialogOpen(true); }}>
                      <PencilIcon />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Target: {formatDate(milestone.targetDate)}
                  </p>
                </CardHeader>
                {milestone.notes && (
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground">{milestone.notes}</p>
                  </CardContent>
                )}
              </Card>
            </div>
          ))}
        </div>
      </div>

      <MilestoneDialog open={dialogOpen} onOpenChange={setDialogOpen} milestone={editMilestone} />
    </div>
  );
}

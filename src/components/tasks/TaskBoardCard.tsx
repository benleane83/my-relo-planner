import { CalendarDaysIcon, PencilIcon, TrashIcon } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { Task } from '@/types';

type TaskBoardCardProps = {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
};

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'ghost' | 'link';

const dueDateFormatter = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
});

function priorityVariant(priority: Task['priority']): BadgeVariant {
  switch (priority) {
    case 'high':
      return 'destructive';
    case 'medium':
      return 'default';
    default:
      return 'secondary';
  }
}

function formatLabel(value: string) {
  return value
    .split(/[-_]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function parseTaskDate(dueDate: string) {
  return new Date(dueDate.includes('T') ? dueDate : `${dueDate}T00:00:00`);
}

function getDueDateBadge(dueDate: string): { label: string; variant: BadgeVariant } {
  const parsedDate = parseTaskDate(dueDate);

  if (Number.isNaN(parsedDate.getTime())) {
    return { label: 'No due date', variant: 'outline' };
  }

  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const dueStart = new Date(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate());
  const dayDifference = Math.round((dueStart.getTime() - todayStart.getTime()) / 86400000);

  if (dayDifference < 0) {
    return { label: `Overdue ${dueDateFormatter.format(parsedDate)}`, variant: 'destructive' };
  }

  if (dayDifference === 0) {
    return { label: `Due ${dueDateFormatter.format(parsedDate)}`, variant: 'default' };
  }

  if (dayDifference <= 7) {
    return { label: `Soon ${dueDateFormatter.format(parsedDate)}`, variant: 'secondary' };
  }

  return { label: `Due ${dueDateFormatter.format(parsedDate)}`, variant: 'outline' };
}

export default function TaskBoardCard({ task, onEdit, onDelete }: TaskBoardCardProps) {
  const dueDateBadge = getDueDateBadge(task.dueDate);

  return (
    <Card className="gap-0 border-dashed bg-background/80 py-0 shadow-none transition-colors hover:bg-card">
      <CardHeader className="gap-3 px-4 py-4">
        <CardTitle
          className={cn(
            'text-sm leading-5',
            task.status === 'done' && 'text-muted-foreground line-through'
          )}
        >
          {task.title}
        </CardTitle>
        <CardAction>
          <Badge variant={priorityVariant(task.priority)}>{formatLabel(task.priority)}</Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 px-4 py-0 pb-4">
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <Badge variant="outline">{formatLabel(task.category)}</Badge>
          <Badge variant={dueDateBadge.variant}>
            <CalendarDaysIcon />
            {dueDateBadge.label}
          </Badge>
        </div>
      </CardContent>
      <CardFooter className="gap-2 border-t px-4 py-3">
        <Button variant="outline" size="xs" onClick={() => onEdit(task)}>
          <PencilIcon data-icon="inline-start" />
          Edit
        </Button>
        <Button variant="ghost" size="xs" className="text-destructive" onClick={() => onDelete(task.id)}>
          <TrashIcon data-icon="inline-start" />
          Delete
        </Button>
      </CardFooter>
    </Card>
  );
}
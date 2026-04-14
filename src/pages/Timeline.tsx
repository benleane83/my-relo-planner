import { useMemo, useState } from 'react';
import { useMilestones } from '@/hooks/useApi';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PencilIcon } from 'lucide-react';
import type { Milestone } from '@/types';
import MilestoneDialog from '@/components/dialogs/MilestoneDialog';

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
  const { data: milestones, isLoading } = useMilestones();
  const [editMilestone, setEditMilestone] = useState<Milestone | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const sorted = useMemo(() => {
    if (!milestones) return [];
    return [...milestones].sort(
      (a, b) => new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime()
    );
  }, [milestones]);

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
                    Target: {new Date(milestone.targetDate).toLocaleDateString()}
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

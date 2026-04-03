import { useMemo, useState } from 'react';
import { useConfig, useMilestones, useTasks, useShopping } from '@/hooks/useApi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { PencilIcon } from 'lucide-react';
import ConfigDialog from '@/components/dialogs/ConfigDialog';

export default function Dashboard() {
  const { data: config, isLoading: configLoading } = useConfig();
  const { data: milestones, isLoading: milestonesLoading } = useMilestones();
  const { data: tasks, isLoading: tasksLoading } = useTasks();
  const { data: shopping, isLoading: shoppingLoading } = useShopping();

  const daysRemaining = useMemo(() => {
    if (!config?.moveDate) return null;
    const now = new Date();
    const move = new Date(config.moveDate);
    return Math.ceil((move.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }, [config?.moveDate]);

  const milestoneProgress = useMemo(() => {
    if (!milestones) return { completed: 0, total: 0, pct: 0 };
    const completed = milestones.filter((m) => m.status === 'completed').length;
    return { completed, total: milestones.length, pct: milestones.length ? (completed / milestones.length) * 100 : 0 };
  }, [milestones]);

  const upcomingTasks = useMemo(() => {
    if (!tasks) return [];
    return [...tasks]
      .filter((t) => t.status !== 'done')
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 5);
  }, [tasks]);

  const budgetSummary = useMemo(() => {
    if (!shopping) return null;
    const totalEstimated = shopping.items.reduce((sum, i) => sum + i.estimatedCost * i.quantity, 0);
    const totalActual = shopping.items.reduce((sum, i) => sum + (i.actualCost || 0) * i.quantity, 0);
    const budgetTotal = shopping.budget.total;
    return { totalEstimated, totalActual, budgetTotal, pct: budgetTotal ? (totalActual / budgetTotal) * 100 : 0 };
  }, [shopping]);

  const milestoneAlerts = useMemo(() => {
    if (!milestones) return [];
    const now = new Date();
    return milestones
      .filter((m) => m.status !== 'completed')
      .map((m) => {
        const days = Math.ceil((new Date(m.targetDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return { ...m, daysUntil: days };
      })
      .filter((m) => m.daysUntil <= 14)
      .sort((a, b) => a.daysUntil - b.daysUntil);
  }, [milestones]);

  const isLoading = configLoading || milestonesLoading || tasksLoading || shoppingLoading;
  const [configDialogOpen, setConfigDialogOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>

      {/* Milestone Alerts */}
      {milestoneAlerts.length > 0 && (
        <div className="flex flex-col gap-3">
          {milestoneAlerts.map((m) => (
            <Alert key={m.id} variant={m.daysUntil <= 7 ? 'destructive' : 'default'}>
              <AlertTitle>
                {m.daysUntil <= 0 ? 'Overdue' : `${m.daysUntil} day${m.daysUntil === 1 ? '' : 's'} away`}
              </AlertTitle>
              <AlertDescription>
                <span className="font-medium">{m.title}</span> — target date{' '}
                {new Date(m.targetDate).toLocaleDateString()}
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Move Summary */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Move Summary</CardTitle>
                <CardDescription>Your relocation at a glance</CardDescription>
              </div>
              {config && (
                <Button variant="outline" size="icon-xs" onClick={() => setConfigDialogOpen(true)}>
                  <PencilIcon />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {config && (
              <>
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">{config.origin.city}, {config.origin.country}</span>
                  <span className="text-muted-foreground">→</span>
                  <span className="font-medium">{config.destination.city}, {config.destination.country}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Move Date</span>
                  <span className="font-medium">{new Date(config.moveDate).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Days Remaining</span>
                  <Badge variant={daysRemaining !== null && daysRemaining <= 30 ? 'destructive' : 'secondary'}>
                    {daysRemaining !== null ? `${daysRemaining} days` : '—'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Family</span>
                  <span>{config.familyMembers.length} member{config.familyMembers.length !== 1 ? 's' : ''}</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Milestone Progress */}
        <Card>
          <CardHeader>
            <CardTitle>Milestone Progress</CardTitle>
            <CardDescription>
              {milestoneProgress.completed} of {milestoneProgress.total} completed
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Progress value={milestoneProgress.pct} />
            <p className="text-sm text-muted-foreground">
              {Math.round(milestoneProgress.pct)}% complete
            </p>
          </CardContent>
        </Card>

        {/* Upcoming Tasks */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Tasks</CardTitle>
            <CardDescription>Next items by due date</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming tasks</p>
            ) : (
              <div className="flex flex-col gap-3">
                {upcomingTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between gap-2">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium">{task.title}</span>
                      <Badge variant="outline" className="w-fit text-xs">
                        {task.category}
                      </Badge>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {new Date(task.dueDate).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Budget Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Budget Summary</CardTitle>
            <CardDescription>
              {config && `${config.originCurrency} spending overview`}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {budgetSummary && (
              <>
                <Progress value={Math.min(budgetSummary.pct, 100)} />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Spent</span>
                  <span className="font-medium">
                    {budgetSummary.totalActual.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Estimated</span>
                  <span>{budgetSummary.totalEstimated.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Budget</span>
                  <span>{budgetSummary.budgetTotal.toLocaleString()}</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {config && (
        <ConfigDialog open={configDialogOpen} onOpenChange={setConfigDialogOpen} config={config} />
      )}
    </div>
  );
}

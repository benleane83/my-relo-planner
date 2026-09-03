import { useEffect, useMemo, useState } from 'react';
import { useTasks, useDeleteTask, useUpdateTask } from '@/hooks/useApi';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { PlusIcon } from 'lucide-react';
import type { Task } from '@/types';
import TaskDialog from '@/components/dialogs/TaskDialog';
import TaskKanbanBoard from '@/components/tasks/TaskKanbanBoard';

export default function Tasks() {
  const { data: tasks, isLoading } = useTasks();
  const deleteMutation = useDeleteTask();
  const updateTaskMutation = useUpdateTask();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [moveError, setMoveError] = useState<string | null>(null);
  const [movingTaskIds, setMovingTaskIds] = useState<Record<string, boolean>>({});
  const [optimisticStatuses, setOptimisticStatuses] = useState<Partial<Record<string, Task['status']>>>({});

  const categories = useMemo(() => {
    if (!tasks) return [];
    return Array.from(new Set(tasks.map((t) => t.category))).sort();
  }, [tasks]);

  const visibleTasks = useMemo(() => {
    if (!tasks) return [];

    return tasks.map((task) => {
      const optimisticStatus = optimisticStatuses[task.id];
      if (!optimisticStatus) return task;
      return { ...task, status: optimisticStatus };
    });
  }, [tasks, optimisticStatuses]);

  useEffect(() => {
    if (!tasks) return;

    const taskIds = new Set(tasks.map((task) => task.id));

    setOptimisticStatuses((prev) => {
      const next = { ...prev };
      let changed = false;

      for (const taskId of Object.keys(next)) {
        if (!taskIds.has(taskId)) {
          delete next[taskId];
          changed = true;
        }
      }

      for (const task of tasks) {
        if (next[task.id] === task.status) {
          delete next[task.id];
          changed = true;
        }
      }

      return changed ? next : prev;
    });
  }, [tasks]);

  const tasksForCategory = (category: string | 'all') => {
    if (category === 'all') return visibleTasks;
    return visibleTasks.filter((task) => task.category === category);
  };

  const handleMoveTask = (task: Task, nextStatus: Task['status']) => {
    const currentStatus = optimisticStatuses[task.id] ?? task.status;
    const previousStatus = task.status;

    if (currentStatus === nextStatus || movingTaskIds[task.id]) {
      return;
    }

    setMoveError(null);
    setOptimisticStatuses((prev) => ({ ...prev, [task.id]: nextStatus }));
    setMovingTaskIds((prev) => ({ ...prev, [task.id]: true }));

    updateTaskMutation.mutate(
      { id: task.id, status: nextStatus },
      {
        onError: (error) => {
          setOptimisticStatuses((prev) => ({ ...prev, [task.id]: previousStatus }));
          setMoveError(error instanceof Error ? error.message : 'Failed to update task status. Please try again.');
        },
        onSettled: () => {
          setMovingTaskIds((prev) => {
            const next = { ...prev };
            delete next[task.id];
            return next;
          });
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <h2 className="text-2xl font-bold tracking-tight">Tasks</h2>
        <Skeleton className="h-10 w-96" />
        <div className="flex gap-3 overflow-x-auto">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-96 w-[280px] shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Tasks</h2>
        <Button size="sm" onClick={() => { setEditTask(null); setDialogOpen(true); }}>
          <PlusIcon /> New Task
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="all">All ({tasks?.length ?? 0})</TabsTrigger>
          {categories.map((cat) => (
            <TabsTrigger key={cat} value={cat}>
              {cat} ({tasks?.filter((t) => t.category === cat).length})
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all" className="mt-4">
          <TaskKanbanBoard
            tasks={tasksForCategory('all')}
            isMovingTask={(id) => !!movingTaskIds[id]}
            moveError={moveError}
            showCategoryBadge={activeTab === 'all'}
            onMove={handleMoveTask}
            onEdit={(task) => { setEditTask(task); setDialogOpen(true); }}
            onDelete={(id) => deleteMutation.mutate(id)}
          />
        </TabsContent>

        {categories.map((cat) => (
          <TabsContent key={cat} value={cat} className="mt-4">
            <TaskKanbanBoard
              tasks={tasksForCategory(cat)}
              isMovingTask={(id) => !!movingTaskIds[id]}
              moveError={moveError}
              showCategoryBadge={activeTab === 'all'}
              onMove={handleMoveTask}
              onEdit={(task) => { setEditTask(task); setDialogOpen(true); }}
              onDelete={(id) => deleteMutation.mutate(id)}
            />
          </TabsContent>
        ))}
      </Tabs>

      <TaskDialog open={dialogOpen} onOpenChange={setDialogOpen} task={editTask} categories={categories} />
    </div>
  );
}

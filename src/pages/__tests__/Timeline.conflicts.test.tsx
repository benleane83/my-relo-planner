import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Timeline from '../Timeline';
import * as useApiModule from '@/hooks/useApi';
import type { Milestone, Task } from '@/types';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  PencilIcon: () => null,
  AlertTriangle: () => null,
  Clock: () => null,
  XCircle: () => null,
  CheckCircle2: () => null,
  ChevronDown: () => null,
  ChevronUp: () => null,
}));

// Mock the MilestoneDialog component to avoid Radix UI Portal issues in tests
vi.mock('@/components/dialogs/MilestoneDialog', () => ({
  default: () => null,
}));

// Mock the useApi hooks
vi.mock('@/hooks/useApi', () => ({
  useMilestones: vi.fn(),
  useTasks: vi.fn(),
  useUpdateMilestone: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
  })),
}));

// Helper to create a QueryClient for each test
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

// Helper to render with React Query provider
function renderWithQuery(ui: React.ReactElement) {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
}

describe('Timeline - Smart Conflicts Detection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Scheduling conflicts', () => {
    it('detects when task dueDate is after milestone targetDate', async () => {
      const milestones: Milestone[] = [
        {
          id: 'visa-and-work',
          title: 'Visa & Work Transfer Confirmed',
          category: 'work-and-visas',
          targetDate: '2026-05-01',
          status: 'in-progress',
          notes: '',
        },
      ];

      const tasks: Task[] = [
        {
          id: 'task-002',
          title: 'Submit ICT visa application for Mark',
          category: 'work-and-visas',
          milestone: 'visa-and-work',
          status: 'in-progress',
          priority: 'high',
          dueDate: '2026-05-15', // AFTER milestone targetDate
          notes: '',
        },
      ];

      vi.mocked(useApiModule.useMilestones).mockReturnValue({
        data: milestones,
        isLoading: false,
      } as any);

      vi.mocked(useApiModule.useTasks).mockReturnValue({
        data: tasks,
        isLoading: false,
      } as any);

      renderWithQuery(<Timeline />);

      await waitFor(() => {
        expect(screen.getByText('Scheduling conflict')).toBeInTheDocument();
      });
    });

    it('detects multiple scheduling conflicts', async () => {
      const today = new Date();
      const in30Days = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];
      const in35Days = new Date(today.getTime() + 35 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];
      const in45Days = new Date(today.getTime() + 45 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];
      const in50Days = new Date(today.getTime() + 50 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];

      const milestones: Milestone[] = [
        {
          id: 'visa-and-work',
          title: 'Visa & Work Transfer',
          category: 'work-and-visas',
          targetDate: in30Days,
          status: 'completed', // Completed to avoid blocker
          notes: '',
        },
        {
          id: 'housing-secured',
          title: 'London Rental Secured',
          category: 'accommodation-and-housing',
          targetDate: in45Days,
          status: 'completed', // Completed to avoid blocker
          notes: '',
        },
      ];

      const tasks: Task[] = [
        {
          id: 'task-002',
          title: 'Submit ICT visa application',
          category: 'work-and-visas',
          milestone: 'visa-and-work',
          status: 'in-progress',
          priority: 'high',
          dueDate: in35Days, // conflict: after milestone
          notes: '',
        },
        {
          id: 'task-005',
          title: 'Research London neighbourhoods',
          category: 'accommodation-and-housing',
          milestone: 'housing-secured',
          status: 'in-progress',
          priority: 'medium',
          dueDate: in50Days, // conflict: after milestone
          notes: '',
        },
      ];

      vi.mocked(useApiModule.useMilestones).mockReturnValue({
        data: milestones,
        isLoading: false,
      } as any);

      vi.mocked(useApiModule.useTasks).mockReturnValue({
        data: tasks,
        isLoading: false,
      } as any);

      renderWithQuery(<Timeline />);

      // Assert two scheduling conflicts are detected
      await waitFor(() => {
        expect(screen.getAllByText('Scheduling conflict')).toHaveLength(2);
      });
    });

    it('does not flag tasks with dueDate before or on milestone targetDate', async () => {
      const today = new Date();
      const in45Days = new Date(today.getTime() + 45 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];
      const in43Days = new Date(today.getTime() + 43 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];

      const milestones: Milestone[] = [
        {
          id: 'visa-and-work',
          title: 'Visa & Work Transfer',
          category: 'work-and-visas',
          targetDate: in45Days, // Far future to avoid 14-day blocker window
          status: 'in-progress',
          notes: '',
        },
      ];

      const tasks: Task[] = [
        {
          id: 'task-002',
          title: 'Submit ICT visa application',
          category: 'work-and-visas',
          milestone: 'visa-and-work',
          status: 'in-progress',
          priority: 'high',
          dueDate: in43Days, // BEFORE milestone
          notes: '',
        },
        {
          id: 'task-003',
          title: 'Another task',
          category: 'work-and-visas',
          milestone: 'visa-and-work',
          status: 'todo',
          priority: 'high',
          dueDate: in45Days, // SAME as milestone
          notes: '',
        },
      ];

      vi.mocked(useApiModule.useMilestones).mockReturnValue({
        data: milestones,
        isLoading: false,
      } as any);

      vi.mocked(useApiModule.useTasks).mockReturnValue({
        data: tasks,
        isLoading: false,
      } as any);

      renderWithQuery(<Timeline />);

      await waitFor(() => {
        expect(screen.getByText(/no conflicts detected/i)).toBeInTheDocument();
      });
    });
  });

  describe('Dependency gaps', () => {
    it('detects when task is due within 7 days but prerequisite tasks are not done', async () => {
      const today = new Date();
      const in5Days = new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];
      const in10Days = new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];

      const milestones: Milestone[] = [
        {
          id: 'visa-and-work',
          title: 'Visa & Work Transfer',
          category: 'work-and-visas',
          targetDate: in10Days,
          status: 'in-progress',
          notes: '',
        },
      ];

      const tasks: Task[] = [
        {
          id: 'task-001',
          title: 'Prerequisite task',
          category: 'work-and-visas',
          milestone: 'visa-and-work',
          status: 'todo', // NOT done
          priority: 'high',
          dueDate: in5Days,
          notes: '',
        },
        {
          id: 'task-002',
          title: 'Dependent task',
          category: 'work-and-visas',
          milestone: 'visa-and-work',
          status: 'todo',
          priority: 'high',
          dueDate: in5Days, // due soon, but prerequisite not done
          notes: '',
        },
      ];

      vi.mocked(useApiModule.useMilestones).mockReturnValue({
        data: milestones,
        isLoading: false,
      } as any);

      vi.mocked(useApiModule.useTasks).mockReturnValue({
        data: tasks,
        isLoading: false,
      } as any);

      renderWithQuery(<Timeline />);

      await waitFor(() => {
        expect(screen.getAllByText(/^Dependency gap$/)).toHaveLength(1);
        expect(
          screen.getByText(/Task "Dependent task" is due in \d+ days? and still depends on "Prerequisite task"\./i)
        ).toBeInTheDocument();
      });
    });

    it('detects when task is overdue and prerequisite tasks are not done', async () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];
      const in10Days = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];

      const milestones: Milestone[] = [
        {
          id: 'visa-and-work',
          title: 'Visa & Work Transfer',
          category: 'work-and-visas',
          targetDate: in10Days,
          status: 'in-progress',
          notes: '',
        },
      ];

      const tasks: Task[] = [
        {
          id: 'task-001',
          title: 'Prerequisite task',
          category: 'work-and-visas',
          milestone: 'visa-and-work',
          status: 'in-progress', // NOT done
          priority: 'high',
          dueDate: yesterday,
          notes: '',
        },
        {
          id: 'task-002',
          title: 'Dependent task',
          category: 'work-and-visas',
          milestone: 'visa-and-work',
          status: 'todo',
          priority: 'high',
          dueDate: yesterday, // overdue and prerequisite not done
          notes: '',
        },
      ];

      vi.mocked(useApiModule.useMilestones).mockReturnValue({
        data: milestones,
        isLoading: false,
      } as any);

      vi.mocked(useApiModule.useTasks).mockReturnValue({
        data: tasks,
        isLoading: false,
      } as any);

      renderWithQuery(<Timeline />);

      await waitFor(() => {
        expect(screen.getAllByText(/^Dependency gap$/)).toHaveLength(1);
        expect(
          screen.getByText(/Task "Dependent task" is overdue by \d+ days? and still depends on "Prerequisite task"\./i)
        ).toBeInTheDocument();
      });
    });

    it('does not flag dependency gaps when prerequisite tasks are done', async () => {
      const in5Days = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];
      const in10Days = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];

      const milestones: Milestone[] = [
        {
          id: 'visa-and-work',
          title: 'Visa & Work Transfer',
          category: 'work-and-visas',
          targetDate: in10Days,
          status: 'in-progress',
          notes: '',
        },
      ];

      const tasks: Task[] = [
        {
          id: 'task-001',
          title: 'Prerequisite task',
          category: 'work-and-visas',
          milestone: 'visa-and-work',
          status: 'done', // DONE
          priority: 'high',
          dueDate: in5Days,
          notes: '',
        },
        {
          id: 'task-002',
          title: 'Dependent task',
          category: 'work-and-visas',
          milestone: 'visa-and-work',
          status: 'todo',
          priority: 'high',
          dueDate: in5Days,
          notes: '',
        },
      ];

      vi.mocked(useApiModule.useMilestones).mockReturnValue({
        data: milestones,
        isLoading: false,
      } as any);

      vi.mocked(useApiModule.useTasks).mockReturnValue({
        data: tasks,
        isLoading: false,
      } as any);

      renderWithQuery(<Timeline />);

      await waitFor(() => {
        expect(screen.getByText(/no conflicts detected/i)).toBeInTheDocument();
      });
    });

    it('does not flag tasks with status blocked for dependency gaps', async () => {
      const in5Days = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];
      const in10Days = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];

      const milestones: Milestone[] = [
        {
          id: 'visa-and-work',
          title: 'Visa & Work Transfer',
          category: 'work-and-visas',
          targetDate: in10Days,
          status: 'in-progress',
          notes: '',
        },
      ];

      const tasks: Task[] = [
        {
          id: 'task-001',
          title: 'Prerequisite task',
          category: 'work-and-visas',
          milestone: 'visa-and-work',
          status: 'todo',
          priority: 'high',
          dueDate: in5Days,
          notes: '',
        },
        {
          id: 'task-002',
          title: 'Blocked task',
          category: 'work-and-visas',
          milestone: 'visa-and-work',
          status: 'blocked', // blocked is handled in critical blockers
          priority: 'high',
          dueDate: in5Days,
          notes: '',
        },
      ];

      vi.mocked(useApiModule.useMilestones).mockReturnValue({
        data: milestones,
        isLoading: false,
      } as any);

      vi.mocked(useApiModule.useTasks).mockReturnValue({
        data: tasks,
        isLoading: false,
      } as any);

      renderWithQuery(<Timeline />);

      await waitFor(() => {
        // Should only flag the blocked task as a critical blocker, not dependency gap
        expect(screen.getByText('Task blocked')).toBeInTheDocument();
      });
    });
  });

  describe('Critical blockers', () => {
    it('detects tasks with status blocked', async () => {
      const in10Days = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];

      const milestones: Milestone[] = [
        {
          id: 'visa-and-work',
          title: 'Visa & Work Transfer',
          category: 'work-and-visas',
          targetDate: in10Days,
          status: 'in-progress',
          notes: '',
        },
      ];

      const tasks: Task[] = [
        {
          id: 'task-002',
          title: 'Submit ICT visa application',
          category: 'work-and-visas',
          milestone: 'visa-and-work',
          status: 'blocked',
          priority: 'high',
          dueDate: in10Days,
          notes: '',
        },
      ];

      vi.mocked(useApiModule.useMilestones).mockReturnValue({
        data: milestones,
        isLoading: false,
      } as any);

      vi.mocked(useApiModule.useTasks).mockReturnValue({
        data: tasks,
        isLoading: false,
      } as any);

      renderWithQuery(<Timeline />);

      await waitFor(() => {
        expect(screen.getByText('Task blocked')).toBeInTheDocument();
      });
    });

    it('detects milestones within 14 days where all linked tasks are incomplete', async () => {
      const in10Days = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];

      const milestones: Milestone[] = [
        {
          id: 'housing-secured',
          title: 'London Rental Secured',
          category: 'accommodation-and-housing',
          targetDate: in10Days, // within 14 days
          status: 'pending',
          notes: '',
        },
      ];

      const tasks: Task[] = [
        {
          id: 'task-005',
          title: 'Research London neighbourhoods',
          category: 'accommodation-and-housing',
          milestone: 'housing-secured',
          status: 'todo', // NOT done
          priority: 'medium',
          dueDate: in10Days,
          notes: '',
        },
        {
          id: 'task-006',
          title: 'Schedule viewings',
          category: 'accommodation-and-housing',
          milestone: 'housing-secured',
          status: 'todo', // NOT done
          priority: 'medium',
          dueDate: in10Days,
          notes: '',
        },
      ];

      vi.mocked(useApiModule.useMilestones).mockReturnValue({
        data: milestones,
        isLoading: false,
      } as any);

      vi.mocked(useApiModule.useTasks).mockReturnValue({
        data: tasks,
        isLoading: false,
      } as any);

      renderWithQuery(<Timeline />);

      await waitFor(() => {
        expect(screen.getByText('Milestone at risk')).toBeInTheDocument();
      });
    });

    it('does not flag milestones within 14 days if at least one task is done', async () => {
      const in10Days = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];

      const milestones: Milestone[] = [
        {
          id: 'housing-secured',
          title: 'London Rental Secured',
          category: 'accommodation-and-housing',
          targetDate: in10Days,
          status: 'in-progress',
          notes: '',
        },
      ];

      const tasks: Task[] = [
        {
          id: 'task-005',
          title: 'Research London neighbourhoods',
          category: 'accommodation-and-housing',
          milestone: 'housing-secured',
          status: 'done', // at least one DONE
          priority: 'medium',
          dueDate: in10Days,
          notes: '',
        },
        {
          id: 'task-006',
          title: 'Schedule viewings',
          category: 'accommodation-and-housing',
          milestone: 'housing-secured',
          status: 'todo',
          priority: 'medium',
          dueDate: in10Days,
          notes: '',
        },
      ];

      vi.mocked(useApiModule.useMilestones).mockReturnValue({
        data: milestones,
        isLoading: false,
      } as any);

      vi.mocked(useApiModule.useTasks).mockReturnValue({
        data: tasks,
        isLoading: false,
      } as any);

      renderWithQuery(<Timeline />);

      await waitFor(() => {
        expect(screen.getByText(/no conflicts detected/i)).toBeInTheDocument();
      });
    });

    it('does not flag milestones beyond 14 days even if all tasks incomplete', async () => {
      const in20Days = new Date(Date.now() + 20 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];

      const milestones: Milestone[] = [
        {
          id: 'housing-secured',
          title: 'London Rental Secured',
          category: 'accommodation-and-housing',
          targetDate: in20Days, // beyond 14 days
          status: 'pending',
          notes: '',
        },
      ];

      const tasks: Task[] = [
        {
          id: 'task-005',
          title: 'Research London neighbourhoods',
          category: 'accommodation-and-housing',
          milestone: 'housing-secured',
          status: 'todo',
          priority: 'medium',
          dueDate: in20Days,
          notes: '',
        },
      ];

      vi.mocked(useApiModule.useMilestones).mockReturnValue({
        data: milestones,
        isLoading: false,
      } as any);

      vi.mocked(useApiModule.useTasks).mockReturnValue({
        data: tasks,
        isLoading: false,
      } as any);

      renderWithQuery(<Timeline />);

      await waitFor(() => {
        expect(screen.getByText(/no conflicts detected/i)).toBeInTheDocument();
      });
    });
  });

  describe('No conflicts state', () => {
    it('shows success message when no conflicts are detected', async () => {
      const in20Days = new Date(Date.now() + 20 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];

      const milestones: Milestone[] = [
        {
          id: 'visa-and-work',
          title: 'Visa & Work Transfer',
          category: 'work-and-visas',
          targetDate: in20Days,
          status: 'in-progress',
          notes: '',
        },
      ];

      const tasks: Task[] = [
        {
          id: 'task-001',
          title: 'Confirm transfer details',
          category: 'work-and-visas',
          milestone: 'visa-and-work',
          status: 'done',
          priority: 'high',
          dueDate: in20Days,
          notes: '',
        },
        {
          id: 'task-002',
          title: 'Submit visa application',
          category: 'work-and-visas',
          milestone: 'visa-and-work',
          status: 'in-progress',
          priority: 'high',
          dueDate: in20Days,
          notes: '',
        },
      ];

      vi.mocked(useApiModule.useMilestones).mockReturnValue({
        data: milestones,
        isLoading: false,
      } as any);

      vi.mocked(useApiModule.useTasks).mockReturnValue({
        data: tasks,
        isLoading: false,
      } as any);

      renderWithQuery(<Timeline />);

      await waitFor(() => {
        expect(screen.getByText(/no conflicts detected/i)).toBeInTheDocument();
      });
    });

    it('shows success message with empty milestones and tasks', async () => {
      vi.mocked(useApiModule.useMilestones).mockReturnValue({
        data: [],
        isLoading: false,
      } as any);

      vi.mocked(useApiModule.useTasks).mockReturnValue({
        data: [],
        isLoading: false,
      } as any);

      renderWithQuery(<Timeline />);

      await waitFor(() => {
        expect(screen.getByText(/no conflicts detected/i)).toBeInTheDocument();
      });
    });
  });

  describe('Mixed conflict scenarios', () => {
    it('detects and displays multiple conflict types simultaneously', async () => {
      const today = new Date();
      const in5Days = new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];
      const in10Days = new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];

      const milestones: Milestone[] = [
        {
          id: 'visa-and-work',
          title: 'Visa & Work Transfer',
          category: 'work-and-visas',
          targetDate: in5Days,
          status: 'in-progress',
          notes: '',
        },
        {
          id: 'housing-secured',
          title: 'London Rental Secured',
          category: 'accommodation-and-housing',
          targetDate: in10Days,
          status: 'pending',
          notes: '',
        },
      ];

      const tasks: Task[] = [
        // Scheduling conflict
        {
          id: 'task-001',
          title: 'Submit visa application',
          category: 'work-and-visas',
          milestone: 'visa-and-work',
          status: 'in-progress',
          priority: 'high',
          dueDate: in10Days, // AFTER milestone targetDate
          notes: '',
        },
        // Critical blocker
        {
          id: 'task-002',
          title: 'Blocked task',
          category: 'work-and-visas',
          milestone: 'visa-and-work',
          status: 'blocked',
          priority: 'high',
          dueDate: in5Days,
          notes: '',
        },
        // Milestone critical blocker (all tasks incomplete, within 14 days)
        {
          id: 'task-003',
          title: 'Find rental',
          category: 'accommodation-and-housing',
          milestone: 'housing-secured',
          status: 'todo',
          priority: 'medium',
          dueDate: in10Days,
          notes: '',
        },
      ];

      vi.mocked(useApiModule.useMilestones).mockReturnValue({
        data: milestones,
        isLoading: false,
      } as any);

      vi.mocked(useApiModule.useTasks).mockReturnValue({
        data: tasks,
        isLoading: false,
      } as any);

      renderWithQuery(<Timeline />);

      // Assert specific conflict types are detected
      await waitFor(() => {
        expect(screen.getByText('Scheduling conflict')).toBeInTheDocument();
        expect(screen.getByText('Task blocked')).toBeInTheDocument();
        expect(screen.getAllByText('Milestone at risk')).toHaveLength(2);
      });
    });
  });

  describe('Edge cases', () => {
    it('handles tasks without milestone assignment', async () => {
      const in10Days = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];

      const milestones: Milestone[] = [
        {
          id: 'visa-and-work',
          title: 'Visa & Work Transfer',
          category: 'work-and-visas',
          targetDate: in10Days,
          status: 'in-progress',
          notes: '',
        },
      ];

      const tasks: Task[] = [
        {
          id: 'task-orphan',
          title: 'Orphan task',
          category: 'general',
          milestone: undefined, // no milestone
          status: 'blocked',
          priority: 'high',
          dueDate: in10Days,
          notes: '',
        },
      ];

      vi.mocked(useApiModule.useMilestones).mockReturnValue({
        data: milestones,
        isLoading: false,
      } as any);

      vi.mocked(useApiModule.useTasks).mockReturnValue({
        data: tasks,
        isLoading: false,
      } as any);

      renderWithQuery(<Timeline />);

      // Should still detect blocked task as critical blocker
      await waitFor(() => {
        expect(screen.getByText('Task blocked')).toBeInTheDocument();
      });
    });

    it('handles milestones with no linked tasks', async () => {
      const in10Days = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];

      const milestones: Milestone[] = [
        {
          id: 'visa-and-work',
          title: 'Visa & Work Transfer',
          category: 'work-and-visas',
          targetDate: in10Days,
          status: 'in-progress',
          notes: '',
        },
      ];

      const tasks: Task[] = []; // no tasks linked

      vi.mocked(useApiModule.useMilestones).mockReturnValue({
        data: milestones,
        isLoading: false,
      } as any);

      vi.mocked(useApiModule.useTasks).mockReturnValue({
        data: tasks,
        isLoading: false,
      } as any);

      renderWithQuery(<Timeline />);

      // Empty milestones are NOT flagged (blocker requires milestoneTasks.length > 0)
      await waitFor(() => {
        expect(screen.getByText(/no conflicts detected/i)).toBeInTheDocument();
      });
      expect(screen.queryByText('Milestone at risk')).not.toBeInTheDocument();
    });

    it('handles invalid date formats gracefully', async () => {
      const milestones: Milestone[] = [
        {
          id: 'visa-and-work',
          title: 'Visa & Work Transfer',
          category: 'work-and-visas',
          targetDate: 'invalid-date',
          status: 'in-progress',
          notes: '',
        },
      ];

      const tasks: Task[] = [
        {
          id: 'task-002',
          title: 'Submit visa application',
          category: 'work-and-visas',
          milestone: 'visa-and-work',
          status: 'in-progress',
          priority: 'high',
          dueDate: 'also-invalid',
          notes: '',
        },
      ];

      vi.mocked(useApiModule.useMilestones).mockReturnValue({
        data: milestones,
        isLoading: false,
      } as any);

      vi.mocked(useApiModule.useTasks).mockReturnValue({
        data: tasks,
        isLoading: false,
      } as any);

      // Should not crash
      renderWithQuery(<Timeline />);

      await waitFor(() => {
        expect(screen.getByText(/timeline/i)).toBeInTheDocument();
      });
    });
  });

  describe('Loading state', () => {
    it('does not show conflicts section while loading', () => {
      vi.mocked(useApiModule.useMilestones).mockReturnValue({
        data: undefined,
        isLoading: true,
      } as any);

      vi.mocked(useApiModule.useTasks).mockReturnValue({
        data: undefined,
        isLoading: true,
      } as any);

      renderWithQuery(<Timeline />);

      // Should show loading skeleton, not conflicts
      expect(screen.queryByText(/conflicts/i)).not.toBeInTheDocument();
    });
  });
});


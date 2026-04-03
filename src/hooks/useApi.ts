import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Config, ResearchTopic, Milestone, Task, ShoppingItem, ShoppingData } from '../types';

const fetchJson = async <T>(url: string): Promise<T> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}`);
  return res.json();
};

const mutateJson = async <T>(url: string, method: string, body?: any): Promise<T> => {
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
};

export function useConfig() {
  return useQuery<Config>({
    queryKey: ['config'],
    queryFn: () => fetchJson('/api/config'),
  });
}

export function useResearchTopics() {
  return useQuery<ResearchTopic[]>({
    queryKey: ['research'],
    queryFn: () => fetchJson('/api/research'),
    refetchInterval: 5000,
  });
}

export function useResearchTopic(slug: string | null) {
  return useQuery<ResearchTopic>({
    queryKey: ['research', slug],
    queryFn: () => fetchJson(`/api/research/${slug}`),
    enabled: !!slug,
  });
}

export function useMilestones() {
  return useQuery<Milestone[]>({
    queryKey: ['milestones'],
    queryFn: () => fetchJson('/api/milestones'),
    refetchInterval: 5000,
  });
}

export function useTasks(category?: string) {
  return useQuery<Task[]>({
    queryKey: ['tasks', category],
    queryFn: () => fetchJson(`/api/tasks${category ? `?category=${category}` : ''}`),
    refetchInterval: 5000,
  });
}

export function useShopping() {
  return useQuery<ShoppingData>({
    queryKey: ['shopping'],
    queryFn: () => fetchJson('/api/shopping'),
    refetchInterval: 5000,
  });
}

// --- Mutations ---

export function useUpdateConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (config: Config) => mutateJson<Config>('/api/config', 'PUT', config),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['config'] }); },
  });
}

export function useUpdateMilestone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Milestone> & { id: string }) =>
      mutateJson<Milestone>(`/api/milestones/${id}`, 'PUT', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['milestones'] }); },
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (task: Omit<Task, 'id'>) => mutateJson<Task>('/api/tasks', 'POST', task),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tasks'] }); },
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Task> & { id: string }) =>
      mutateJson<Task>(`/api/tasks/${id}`, 'PUT', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tasks'] }); },
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => mutateJson<void>(`/api/tasks/${id}`, 'DELETE'),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tasks'] }); },
  });
}

export function useCreateShoppingItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (item: Omit<ShoppingItem, 'id'>) =>
      mutateJson<ShoppingItem>('/api/shopping/items', 'POST', item),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['shopping'] }); },
  });
}

export function useUpdateShoppingItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<ShoppingItem> & { id: string }) =>
      mutateJson<ShoppingItem>(`/api/shopping/items/${id}`, 'PUT', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['shopping'] }); },
  });
}

export function useDeleteShoppingItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => mutateJson<void>(`/api/shopping/items/${id}`, 'DELETE'),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['shopping'] }); },
  });
}

export function useUpdateBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (budget: { total: number; categories: Record<string, number> }) =>
      mutateJson<any>('/api/shopping/budget', 'PUT', budget),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['shopping'] }); },
  });
}

export function useCreateResearchTopic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { slug: string; title: string; tags: string[] }) =>
      mutateJson<ResearchTopic>('/api/research', 'POST', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['research'] }); },
  });
}

export function useUpdateResearchTopic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ slug, ...data }: { slug: string; title: string; status: string; tags: string[]; content: string }) =>
      mutateJson<ResearchTopic>(`/api/research/${slug}`, 'PUT', data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['research'] });
      qc.invalidateQueries({ queryKey: ['research', vars.slug] });
    },
  });
}

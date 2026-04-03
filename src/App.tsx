import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import Dashboard from '@/pages/Dashboard';
import Research from '@/pages/Research';
import Timeline from '@/pages/Timeline';
import Tasks from '@/pages/Tasks';
import Shopping from '@/pages/Shopping';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2000,
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/research" element={<Research />} />
            <Route path="/research/:slug" element={<Research />} />
            <Route path="/timeline" element={<Timeline />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/shopping" element={<Shopping />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

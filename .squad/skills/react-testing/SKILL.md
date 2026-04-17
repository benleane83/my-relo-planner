# React Testing with Vitest and Testing Library

## Overview
Reusable patterns for testing React components in this project using Vitest, Testing Library, and React Query.

## Setup Pattern

### Basic React Query Test Setup
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock API hooks
vi.mock('@/hooks/useApi', () => ({
  useMilestones: vi.fn(),
  useTasks: vi.fn(),
}));

// Helper to create a fresh QueryClient per test
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

// Helper to render with providers
function renderWithQuery(ui: React.ReactElement) {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
}

describe('MyComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly', async () => {
    vi.mocked(useApiModule.useMilestones).mockReturnValue({
      data: mockData,
      isLoading: false,
    } as any);

    renderWithQuery(<MyComponent />);

    await waitFor(() => {
      expect(screen.getByText(/expected text/i)).toBeInTheDocument();
    });
  });
});
```

## Key Principles

### 1. Mock at the API hook level
- Mock `@/hooks/useApi` rather than fetch/axios
- Keeps tests focused on component behavior
- More resilient to implementation changes

### 2. Use flexible text matching
```typescript
// Good: flexible regex
expect(screen.getByText(/conflicts found|scheduling conflict/i)).toBeInTheDocument();

// Avoid: exact text matching
expect(screen.getByText('3 conflicts found')).toBeInTheDocument();
```

### 3. Dynamic dates for relative time tests
```typescript
const in5Days = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
  .toISOString()
  .split('T')[0];
```

### 4. Test behavior, not implementation
```typescript
// Good: tests what the user sees
expect(screen.getByText(/no conflicts detected/i)).toBeInTheDocument();

// Avoid: tests internal state
expect(component.state.conflicts).toHaveLength(0);
```

### 5. Organize tests by feature
For complex components with multiple features:
```
ComponentName.featureName.test.tsx
Timeline.conflicts.test.tsx
Timeline.sorting.test.tsx
```

## Common Patterns

### Testing loading states
```typescript
it('shows loading skeleton while loading', () => {
  vi.mocked(useApi.useData).mockReturnValue({
    data: undefined,
    isLoading: true,
  } as any);

  renderWithQuery(<Component />);
  expect(screen.queryByText(/content/i)).not.toBeInTheDocument();
});
```

### Testing error states
```typescript
it('handles invalid data gracefully', async () => {
  vi.mocked(useApi.useData).mockReturnValue({
    data: invalidData,
    isLoading: false,
  } as any);

  renderWithQuery(<Component />);
  // Should not crash
  expect(screen.getByText(/component/i)).toBeInTheDocument();
});
```

### Testing edge cases
Always test:
- Empty arrays
- Missing optional fields
- Invalid date formats
- Tasks/items without relationships
- Loading states

## Tech Stack
- **Vitest**: Test runner
- **@testing-library/react**: Component testing utilities
- **@testing-library/user-event**: User interaction simulation
- **jsdom**: Browser environment simulation

## Related Files
- `vitest.config.ts`: Test configuration
- `package.json`: Test scripts (`npm run test`, `npm run test:watch`)
- `src/pages/__tests__/`: Component tests location

## Example
See `src/pages/__tests__/Timeline.conflicts.test.tsx` for a comprehensive example covering:
- Multiple test suites organized by feature
- Dynamic date generation
- Mixed scenarios
- Edge case handling
- Loading state testing

## Assertion specificity for alert-heavy UIs
- Prefer exact alert-title assertions (for example, screen.getByText('Dependency gap')) over broad regexes when nearby helper copy or badges reuse similar wording.
- When a fixture can legitimately render the same alert title multiple times, assert with getAllByText(...).toHaveLength(n) instead of getByText(...).
- This is especially important for summary cards that include both a count badge and descriptive copy above the alert list.

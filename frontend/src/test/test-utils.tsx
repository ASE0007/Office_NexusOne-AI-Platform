import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

/**
 * Wraps any component under test with a fresh QueryClientProvider,
 * since most NexusOne pages call useQuery/useMutation and crash
 * without a provider in the tree. Use this instead of plain `render`
 * whenever the component touches react-query.
 */
export function renderWithProviders(ui: ReactElement, options?: RenderOptions) {
  const testQueryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });

  function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={testQueryClient}>{children}</QueryClientProvider>;
  }

  return render(ui, { wrapper: Wrapper, ...options });
}

export * from '@testing-library/react';

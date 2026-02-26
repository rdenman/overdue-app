/**
 * Shared test utilities
 * Provides a custom render that wraps components in all required providers,
 * plus factory helpers for creating mock domain objects.
 */

import { render, type RenderOptions } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { type ReactElement } from 'react';

// ── Test QueryClient ──

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

// ── Minimal Theme Provider (avoids AsyncStorage dependency) ──

const ThemeContext = React.createContext({
  theme: 'light' as 'light' | 'dark',
  toggleTheme: () => {},
});

function TestThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeContext.Provider value={{ theme: 'light', toggleTheme: jest.fn() }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Re-export so tests can import useTheme from here if needed
export { ThemeContext };

// ── All Providers Wrapper ──

interface WrapperProps {
  children: React.ReactNode;
}

function AllProviders({ children }: WrapperProps) {
  const queryClient = createTestQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <TestThemeProvider>{children}</TestThemeProvider>
    </QueryClientProvider>
  );
}

/**
 * Custom render that wraps the component in QueryClient + Theme providers.
 * Use this instead of the bare `render` from RNTL.
 */
function customRender(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  return render(ui, { wrapper: AllProviders, ...options });
}

/**
 * Creates a standalone QueryClient for hook tests via `renderHook`.
 */
export function createTestWrapper() {
  const queryClient = createTestQueryClient();

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <TestThemeProvider>{children}</TestThemeProvider>
      </QueryClientProvider>
    );
  }

  return { Wrapper, queryClient };
}

// Re-export everything from RNTL plus the custom render
export * from '@testing-library/react-native';
export { customRender as render };

import type { ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { RouteLoader, ScrollToTop } from '@/components/shared';
import { AuthProvider } from '@/hooks/useAuth';
import { FavoritesProvider } from '@/hooks/useFavorites';

/** One cache for the whole app; mutations opt into per-call behaviour. */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

/**
 * Every app-wide context, in dependency order: auth first, since route guards
 * and most pages read the session.
 */
const ContextProviders = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <FavoritesProvider>{children}</FavoritesProvider>
    </AuthProvider>
  </QueryClientProvider>
);

/**
 * Chrome that sits above the routed content. It lives inside the router because
 * `ScrollToTop` and `RouteLoader` both read the current location.
 */
export const AppShell = () => (
  <>
    <ScrollToTop />
    <RouteLoader />
    <ToastContainer
      position="top-right"
      autoClose={3000}
      hideProgressBar={false}
      newestOnTop
      closeOnClick
      pauseOnHover
      draggable
      theme="light"
    />
    <Outlet />
  </>
);

export const AppProviders = ({ children }: { children: ReactNode }) => (
  <ContextProviders>{children}</ContextProviders>
);
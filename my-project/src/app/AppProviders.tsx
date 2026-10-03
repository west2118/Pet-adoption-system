import type { ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { RouteLoader, ScrollToTop } from '@/components/shared';
import { AuthProvider } from '@/hooks/useAuth';
import { FavoritesProvider } from '@/hooks/useFavorites';

/**
 * Every app-wide context, in dependency order: auth first, since route guards
 * and most pages read the session.
 */
const ContextProviders = ({ children }: { children: ReactNode }) => (
  <AuthProvider>
    <FavoritesProvider>{children}</FavoritesProvider>
  </AuthProvider>
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
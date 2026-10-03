import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell } from './AppProviders';
import { adminRoutes } from './routes/adminRoutes';
import { publicRoutes } from './routes/publicRoutes';
import { shelterRoutes } from './routes/shelterRoutes';

/**
 * Single source of truth for the app's URL map. Add a route next to the others in
 * `routes/` and it is picked up here — nothing else needs to change.
 */
export const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      publicRoutes,
      shelterRoutes,
      adminRoutes,

      // Legacy dashboard URL
      { path: 'dashboard', element: <Navigate to="/shelter" replace /> },
    ],
  },
]);
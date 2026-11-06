import type { RouteObject } from 'react-router-dom';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { ProtectedRoute } from '@/components/layout/AppLayout';
import {
  AdminOverviewPage,
  AdminPetsPage,
  AdminShelterApplicationsPage,
  AdminSheltersPage,
  AdminUsersPage,
} from '@/pages/admin';

/** Platform admin console: every shelter, user and listing on the platform. */
export const adminRoutes: RouteObject = {
  element: <ProtectedRoute allowedRoles={['platform_admin']} />,
  children: [
    {
      element: <AdminLayout />,
      children: [
        { path: 'admin', element: <AdminOverviewPage /> },
        { path: 'admin/shelters', element: <AdminSheltersPage /> },
        { path: 'admin/pets', element: <AdminPetsPage /> },
        { path: 'admin/users', element: <AdminUsersPage /> },
        { path: 'admin/shelter-applications', element: <AdminShelterApplicationsPage /> },
      ],
    },
  ],
};
import type { RouteObject } from 'react-router-dom';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { ProtectedRoute } from '@/components/layout/AppLayout';
import { PlatformAdminPage } from '@/pages/PlatformAdminPage';
import { PlatformShelterApplicationsPage } from '@/pages/PlatformShelterApplicationsPage';

/** Platform admin console: every shelter, user and listing on the platform. */
export const adminRoutes: RouteObject = {
  element: <ProtectedRoute allowedRoles={['platform_admin']} />,
  children: [
    {
      element: <AdminLayout />,
      children: [
        { path: 'admin', element: <PlatformAdminPage initialSection="overview" /> },
        { path: 'admin/shelters', element: <PlatformAdminPage initialSection="shelters" /> },
        { path: 'admin/pets', element: <PlatformAdminPage initialSection="pets" /> },
        { path: 'admin/users', element: <PlatformAdminPage initialSection="users" /> },
        { path: 'admin/shelter-applications', element: <PlatformShelterApplicationsPage /> },
      ],
    },
  ],
};
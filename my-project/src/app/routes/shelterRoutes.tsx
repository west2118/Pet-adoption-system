import type { RouteObject } from 'react-router-dom';
import { ProtectedRoute } from '@/components/layout/AppLayout';
import { ShelterLayout } from '@/components/layout/ShelterLayout';
import { ShelterApplicationsPage } from '@/pages/shelter/ShelterApplicationsPage';
import { ShelterEWaiversPage } from '@/pages/shelter/ShelterEWaiversPage';
import { ShelterInquiriesPage } from '@/pages/shelter/ShelterInquiriesPage';
import { ShelterListingsPage } from '@/pages/shelter/ShelterListingsPage';
import { ShelterOverviewPage } from '@/pages/shelter/ShelterOverviewPage';
import { ShelterProfilePage } from '@/pages/shelter/ShelterProfilePage';

/** Shelter portal: listings, applications, e-waiver templates, profile. */
export const shelterRoutes: RouteObject = {
  element: <ProtectedRoute allowedRoles={['shelter_staff']} />,
  children: [
    {
      element: <ShelterLayout />,
      children: [
        { path: 'shelter', element: <ShelterOverviewPage /> },
        { path: 'shelter/listings', element: <ShelterListingsPage /> },
        { path: 'shelter/applications', element: <ShelterApplicationsPage /> },
        { path: 'shelter/inquiries', element: <ShelterInquiriesPage /> },
        { path: 'shelter/templates/e-waivers', element: <ShelterEWaiversPage /> },
        { path: 'shelter/profile', element: <ShelterProfilePage /> },
      ],
    },
  ],
};
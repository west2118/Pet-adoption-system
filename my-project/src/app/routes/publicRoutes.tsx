import type { RouteObject } from 'react-router-dom';
import { ProtectedRoute } from '@/components/layout/AppLayout';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { AdopterWaiverPage } from '@/pages/AdopterWaiverPage';
import { AdoptionFormPage } from '@/pages/AdoptionFormPage';
import { ApplicationsPage } from '@/pages/ApplicationsPage';
import { BrowsePetsPage } from '@/pages/BrowsePetsPage';
import { FavoritesPage } from '@/pages/FavoritesPage';
import { HomePage } from '@/pages/HomePage';
import { LoginPage } from '@/pages/LoginPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { PetDetailsPage } from '@/pages/PetDetailsPage';
import { ShelterOnboardingPage } from '@/pages/ShelterOnboardingPage';
import { ShelterPendingPage } from '@/pages/ShelterPendingPage';
import { ShelterPublicProfilePage } from '@/pages/ShelterPublicProfilePage';
import { SheltersPage } from '@/pages/SheltersPage';
import { SignupPage } from '@/pages/SignupPage';

/**
 * Public site: top navbar + footer. Also hosts shelter onboarding, which is
 * reachable with the limited onboarding token before an account is approved.
 */
export const publicRoutes: RouteObject = {
  element: <PublicLayout />,
  children: [
    { index: true, element: <HomePage /> },
    { path: 'pets', element: <BrowsePetsPage /> },
    { path: 'pets/:id', element: <PetDetailsPage /> },
    { path: 'shelters', element: <SheltersPage /> },
    { path: 'shelters/:id', element: <ShelterPublicProfilePage /> },
    { path: 'favorites', element: <FavoritesPage /> },
    { path: 'login', element: <LoginPage /> },
    { path: 'signup', element: <SignupPage /> },
    { path: 'onboarding/shelter', element: <ShelterOnboardingPage /> },
    { path: 'onboarding/shelter/pending', element: <ShelterPendingPage /> },

    // Adopter-protected routes
    {
      element: <ProtectedRoute allowedRoles={['adopter']} />,
      children: [
        { path: 'apply/:petId', element: <AdoptionFormPage /> },
        { path: 'applications', element: <ApplicationsPage /> },
        { path: 'applications/:id/waiver', element: <AdopterWaiverPage /> },
      ],
    },

    { path: '*', element: <NotFoundPage /> },
  ],
};
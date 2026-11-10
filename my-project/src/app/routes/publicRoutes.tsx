import type { RouteObject } from 'react-router-dom';
import { Seo } from '@/components/seo/Seo';
import { GuestOnlyRoute, ProtectedRoute } from '@/components/layout/AppLayout';
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
import { ProfilePage } from '@/pages/ProfilePage';
import { VisitsPage } from '@/pages/VisitsPage';
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
    {
      index: true,
      element: (
        <>
          <Seo title="Adopt a Pet — Verified Shelters & Rescues" path="/" />
          <HomePage />
        </>
      ),
    },
    {
      path: 'pets',
      element: (
        <>
          <Seo
            title="Adoptable Pets — Browse by Breed, Age & Location"
            description="Browse adoptable dogs, cats and other rescues from verified partner shelters. Filter by breed, age, size and location, then apply to adopt online."
            path="/pets"
          />
          <BrowsePetsPage />
        </>
      ),
    },
    { path: 'pets/:id', element: <PetDetailsPage /> },
    {
      path: 'shelters',
      element: (
        <>
          <Seo
            title="Partner Animal Shelters & Rescues"
            description="Meet the verified animal shelters and rescues on PawsConnect — locations, visiting hours, contact details and their adoptable pets."
            path="/shelters"
          />
          <SheltersPage />
        </>
      ),
    },
    { path: 'shelters/:id', element: <ShelterPublicProfilePage /> },
    {
      path: 'favorites',
      element: (
        <>
          <Seo title="Saved Pets" path="/favorites" noindex />
          <FavoritesPage />
        </>
      ),
    },
    // Signed-in visitors are redirected away from the auth screens.
    {
      element: <GuestOnlyRoute />,
      children: [
        {
          path: 'login',
          element: (
            <>
              <Seo title="Log In" path="/login" noindex />
              <LoginPage />
            </>
          ),
        },
        {
          path: 'signup',
          element: (
            <>
              <Seo
                title="Create an Adopter Account"
                description="Create a free PawsConnect account to save favourite pets, apply to adopt online and track every application."
                path="/signup"
              />
              <SignupPage />
            </>
          ),
        },
      ],
    },
    {
      path: 'onboarding/shelter',
      element: (
        <>
          <Seo title="Shelter Onboarding" path="/onboarding/shelter" noindex />
          <ShelterOnboardingPage />
        </>
      ),
    },
    {
      path: 'onboarding/shelter/pending',
      element: (
        <>
          <Seo
            title="Shelter Application Pending"
            path="/onboarding/shelter/pending"
            noindex
          />
          <ShelterPendingPage />
        </>
      ),
    },

    // Adopter-protected routes
    {
      element: <ProtectedRoute allowedRoles={['adopter']} />,
      children: [
        { path: 'apply/:petId', element: <AdoptionFormPage /> },
        { path: 'applications', element: <ApplicationsPage /> },
        { path: 'applications/:id/waiver', element: <AdopterWaiverPage /> },
        { path: 'visits', element: <VisitsPage /> },
      ],
    },

    // Any signed-in account (adopter, staff, or admin) has a profile page.
    {
      element: <ProtectedRoute allowedRoles={['adopter', 'shelter_staff', 'platform_admin']} />,
      children: [{ path: 'profile', element: <ProfilePage /> }],
    },

    {
      path: '*',
      element: (
        <>
          <Seo title="Page Not Found" path="/404" noindex />
          <NotFoundPage />
        </>
      ),
    },
  ],
};
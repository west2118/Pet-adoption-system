import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
// TODO: re-enable route guards later — uncomment when ready
// import { ProtectedRoute } from '@/components/layout/AppLayout';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { ShelterLayout } from '@/components/layout/ShelterLayout';
import { AuthProvider } from '@/hooks/useAuth';
import { FavoritesProvider } from '@/hooks/useFavorites';
import { HomePage } from '@/pages/HomePage';
import { BrowsePetsPage } from '@/pages/BrowsePetsPage';
import { PetDetailsPage } from '@/pages/PetDetailsPage';
import { AdoptionFormPage } from '@/pages/AdoptionFormPage';
import { ApplicationsPage } from '@/pages/ApplicationsPage';
import { FavoritesPage } from '@/pages/FavoritesPage';
import { SheltersPage } from '@/pages/SheltersPage';
import { LoginPage, SignupPage } from '@/pages/AuthPages';
import { ShelterOverviewPage } from '@/pages/shelter/ShelterOverviewPage';
import { ShelterListingsPage } from '@/pages/shelter/ShelterListingsPage';
import { ShelterApplicationsPage } from '@/pages/shelter/ShelterApplicationsPage';
import { ShelterInquiriesPage } from '@/pages/shelter/ShelterInquiriesPage';
import { ShelterProfilePage } from '@/pages/shelter/ShelterProfilePage';
import { PlatformAdminPage } from '@/pages/PlatformAdminPage';
import { NotFoundPage } from '@/pages/NotFoundPage';

const App = (): React.JSX.Element => {
  return (
    <AuthProvider>
      <FavoritesProvider>
        <BrowserRouter>
          <Routes>
            {/* Public side — top navbar + footer */}
            <Route element={<PublicLayout />}>
              <Route index element={<HomePage />} />
              <Route path="pets" element={<BrowsePetsPage />} />
              <Route path="pets/:id" element={<PetDetailsPage />} />
              <Route path="shelters" element={<SheltersPage />} />
              <Route path="favorites" element={<FavoritesPage />} />
              <Route path="login" element={<LoginPage />} />
              <Route path="signup" element={<SignupPage />} />

              {/* TODO: re-enable route guards later — wrap with <ProtectedRoute /> */}
              {/* <Route element={<ProtectedRoute />}> */}
              <Route path="apply/:petId" element={<AdoptionFormPage />} />
              <Route path="applications" element={<ApplicationsPage />} />
              {/* </Route> */}

              <Route path="*" element={<NotFoundPage />} />
            </Route>

            {/* Shelter portal — listings, applications, profile */}
            {/* TODO: re-enable — wrap with <ProtectedRoute allowedRoles={['shelter_staff']} /> */}
            {/* <Route element={<ProtectedRoute allowedRoles={['shelter_staff']} />}> */}
            <Route element={<ShelterLayout />}>
              <Route path="shelter" element={<ShelterOverviewPage />} />
              <Route path="shelter/listings" element={<ShelterListingsPage />} />
              <Route path="shelter/applications" element={<ShelterApplicationsPage />} />
              <Route path="shelter/inquiries" element={<ShelterInquiriesPage />} />
              <Route path="shelter/profile" element={<ShelterProfilePage />} />
            </Route>
            {/* </Route> */}

            {/* Platform admin — all shelters and users */}
            {/* TODO: re-enable — wrap with <ProtectedRoute allowedRoles={['platform_admin']} /> */}
            {/* <Route element={<ProtectedRoute allowedRoles={['platform_admin']} />}> */}
            <Route element={<AdminLayout />}>
              <Route path="admin" element={<PlatformAdminPage initialSection="overview" />} />
              <Route path="admin/shelters" element={<PlatformAdminPage initialSection="shelters" />} />
              <Route path="admin/pets" element={<PlatformAdminPage initialSection="pets" />} />
              <Route path="admin/users" element={<PlatformAdminPage initialSection="users" />} />
            </Route>
            {/* </Route> */}

            {/* Legacy dashboard URL */}
            <Route path="dashboard" element={<Navigate to="/shelter" replace />} />
          </Routes>
        </BrowserRouter>
      </FavoritesProvider>
    </AuthProvider>
  );
};

export default App;

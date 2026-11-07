import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import type { UserRole } from '@/types';
import { Container } from './Container';
import { PublicLayout } from './PublicLayout';

export const AppLayout = PublicLayout;

export const ProtectedRoute = ({
  allowedRoles,
}: {
  allowedRoles?: UserRole[];
}) => {
  const { user, initializing } = useAuth();

  // Wait for the session check so a refresh doesn't bounce a logged-in user.
  if (initializing) return null;

  if (!user) return <Navigate to="/login" replace />;

  // Shelter accounts awaiting approval cannot enter the portal.
  if (user.accountStatus && user.accountStatus !== 'approved') {
    return <Navigate to="/onboarding/shelter/pending" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <Container className="py-16 text-center">
        <h1 className="text-2xl font-bold">Access restricted</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your role ({user.role}) does not have permission to view this page.
          Switch role in the navbar to preview RBAC.
        </p>
      </Container>
    );
  }

  return <Outlet />;
};

const landingRouteFor = (role: UserRole) =>
  role === 'adopter' ? '/pets' : role === 'shelter_staff' ? '/shelter' : '/admin';

/**
 * The inverse of `ProtectedRoute`: an already signed-in visitor has no reason to
 * see the sign-in or sign-up screens, so send them to their role's home page.
 */
export const GuestOnlyRoute = () => {
  const { user, initializing } = useAuth();

  // Wait for the session check so a refresh doesn't briefly show the auth form.
  if (initializing) return null;

  if (user) return <Navigate to={landingRouteFor(user.role)} replace />;

  return <Outlet />;
};

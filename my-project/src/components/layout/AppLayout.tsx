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
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

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

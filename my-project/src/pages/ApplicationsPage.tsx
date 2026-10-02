import { Link } from 'react-router-dom';
import { Container } from '@/components/layout/Container';
import { ApplicationCard } from '@/components/features/ApplicationCard';
import { EmptyState } from '@/components/ui/Feedback';
import { Button } from '@/components/ui/button';
import { useApplications, usePets } from '@/hooks/useData';
import { useAuth } from '@/hooks/useAuth';

export const ApplicationsPage = () => {
  const { user } = useAuth();
  const { applications, loading } = useApplications(user?.id);
  const { pets } = usePets();

  const petById = (id: string) => pets.find((p) => p.id === id);

  return (
    <Container className="py-6">
      <h1 className="text-3xl font-bold tracking-tight">My applications</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Real-time tracking: Submitted → Under Review → Approved → Adopted. You
        will also get notifications on progress.
      </p>

      <div className="mt-6 space-y-3">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading applications…</p>
        ) : applications.length === 0 ? (
          <EmptyState
            title="No applications yet"
            description="Browse pets and submit your first adoption application."
            action={
              <Link to="/pets">
                <Button size="sm">Browse pets</Button>
              </Link>
            }
          />
        ) : (
          applications.map((app) => (
            <ApplicationCard key={app.id} application={app} pet={petById(app.petId)} />
          ))
        )}
      </div>
    </Container>
  );
};

import { Container } from '@/components/layout/Container';
import { ShelterCard } from '@/components/features/ShelterCard';
import { useShelters } from '@/hooks/useData';

export const SheltersPage = () => {
  const { shelters, loading } = useShelters();

  return (
    <Container className="py-6">
      <h1 className="text-3xl font-bold tracking-tight">Shelters & rescues</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Contact info, location, and operating hours for every partner.
      </p>
      <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {loading
          ? <p className="text-sm text-muted-foreground">Loading shelters…</p>
          : shelters.map((s) => <ShelterCard key={s.id} shelter={s} />)}
      </div>
    </Container>
  );
};

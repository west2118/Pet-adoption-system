import { ArrowRight, FileCheck2, HeartHandshake, Search, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Container } from '@/components/layout/Container';
import { PetCard } from '@/components/features/PetCard';
import { ShelterCard } from '@/components/features/ShelterCard';
import { EmptyState, LoadingGrid } from '@/components/ui/Feedback';
import { Button } from '@/components/ui/button';
import { usePets, useShelters } from '@/hooks/useData';
import { publicPets } from '@/data/mockData';

const steps = [
  {
    icon: Search,
    title: '1. Browse & filter',
    text: 'Filter by species, breed, age, size, gender, temperament, and shelter location.',
  },
  {
    icon: FileCheck2,
    title: '2. Apply online',
    text: 'Submit an adoption application and track it in real time: Submitted → Under Review → Approved → Adopted.',
  },
  {
    icon: HeartHandshake,
    title: '3. Welcome home',
    text: 'Chat with the shelter, schedule a visit, and give a rescue a forever home.',
  },
];

export const HomePage = () => {
  const { pets, loading } = usePets();
  const { shelters } = useShelters();

  const visiblePets = publicPets(pets);
  const heroPets = visiblePets.slice(0, 4);
  const featured = visiblePets.filter((p) => p.status === 'Available').slice(0, 6);

  return (
    <div>
      {/* Hero */}
      <section className="border-b bg-gradient-to-b from-orange-50 to-background dark:from-orange-950/30">
        <Container className="grid items-center gap-10 py-14 lg:grid-cols-2 lg:py-20">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1 text-xs font-semibold">
              <ShieldCheck className="size-3.5 text-green-600" />
              Verified shelters & rescues
            </span>
            <h1 className="mt-4 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
              Find your new <span className="text-orange-500">best friend</span>
            </h1>
            <p className="mt-3 max-w-lg text-muted-foreground">
              Browse adoptable pets, submit applications online, save favorites,
              and track every step — from Submitted to Adopted.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Link to="/pets">
                <Button size="lg">
                  Browse pets <ArrowRight className="size-4" />
                </Button>
              </Link>
              <Link to="/shelters">
                <Button variant="outline" size="lg">
                  Meet shelters
                </Button>
              </Link>
            </div>
            <dl className="mt-8 grid max-w-md grid-cols-3 gap-4">
              <div>
                <dt className="text-2xl font-bold">{visiblePets.length || '—'}</dt>
                <dd className="text-xs text-muted-foreground">Pets listed</dd>
              </div>
              <div>
                <dt className="text-2xl font-bold">{shelters.length}</dt>
                <dd className="text-xs text-muted-foreground">Partner shelters</dd>
              </div>
              <div>
                <dt className="text-2xl font-bold">
                  {pets.filter((p) => p.status === 'Adopted').length}
                </dt>
                <dd className="text-xs text-muted-foreground">Happy adoptions</dd>
              </div>
            </dl>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {loading ? (
              <LoadingGrid count={4} />
            ) : (
              heroPets.map((p) => (
                <img
                  key={p.id}
                  src={p.imageUrl}
                  alt={p.name}
                  className="h-44 w-full rounded-xl border object-cover odd:translate-y-4 sm:h-56"
                  loading="lazy"
                />
              ))
            )}
          </div>
        </Container>
      </section>

      {/* How it works */}
      <Container className="py-14">
        <h2 className="text-2xl font-bold tracking-tight">How adoption works</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          A transparent journey for adopters and shelters.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {steps.map((s) => (
            <div key={s.title} className="rounded-xl border bg-card p-5 shadow-sm">
              <span className="flex size-10 items-center justify-center rounded-lg bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-400">
                <s.icon className="size-5" />
              </span>
              <h3 className="mt-3 font-semibold">{s.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{s.text}</p>
            </div>
          ))}
        </div>
      </Container>

      {/* Featured pets */}
      <Container className="pb-4">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Featured pets</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Available now and waiting for a home.
            </p>
          </div>
          <Link to="/pets">
            <Button variant="outline" size="sm">
              View all <ArrowRight className="size-3.5" />
            </Button>
          </Link>
        </div>
        <div className="mt-6">
          {loading ? (
            <LoadingGrid count={6} />
          ) : featured.length === 0 ? (
            <EmptyState
              title="No featured pets right now"
              description="Check back soon — new rescues arrive every week."
            />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((pet) => (
                <PetCard
                  key={pet.id}
                  pet={pet}
                  shelterLocation={
                    shelters.find((s) => s.id === pet.shelterId)?.location
                  }
                />
              ))}
            </div>
          )}
        </div>
      </Container>

      {/* Shelters */}
      <Container className="py-14">
        <h2 className="text-2xl font-bold tracking-tight">Partner shelters</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Verified rescues with transparent listings and hours.
        </p>
        <div className="mt-6 grid gap-5 md:grid-cols-3">
          {shelters.map((s) => (
            <ShelterCard key={s.id} shelter={s} />
          ))}
        </div>
      </Container>
    </div>
  );
};

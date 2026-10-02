import { Baby, Check, Heart, MapPin, Mars, Ruler, Syringe, Venus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Container } from '@/components/layout/Container';
import { PetGallery } from '@/components/features/PetGallery';
import { InquiryForm } from '@/components/features/InquiryForm';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/Feedback';
import { PetStatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/button';
import { useFavorites } from '@/hooks/useFavorites';
import { petService, shelterService } from '@/services/api';
import type { Pet, Shelter } from '@/types';
import { cn } from '@/lib/utils';
import { formatAge, formatDate } from '@/utils/formatters';

export const PetDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const [pet, setPet] = useState<Pet | null>(null);
  const [shelter, setShelter] = useState<Shelter | null>(null);
  const [loading, setLoading] = useState(true);
  const { isFavorite, toggleFavorite } = useFavorites();

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!id) return;
      setLoading(true);
      const found = await petService.getById(id);
      const shelters = await shelterService.list();
      if (!mounted) return;
      setPet(found ?? null);
      setShelter(shelters.find((s) => s.id === found?.shelterId) ?? null);
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <Container className="py-6">
        <div className="grid animate-pulse gap-6 lg:grid-cols-3">
          <div className="h-80 rounded-xl bg-muted lg:col-span-2" />
          <div className="h-80 rounded-xl bg-muted" />
        </div>
      </Container>
    );
  }

  if (!pet) {
    return (
      <Container className="py-12">
        <EmptyState
          title="Pet not found"
          description="This listing may have been removed or adopted."
          action={
            <Link to="/pets">
              <Button size="sm">Back to browse</Button>
            </Link>
          }
        />
      </Container>
    );
  }

  if (pet.visibility === 'private') {
    return (
      <Container className="py-12">
        <EmptyState
          title="This pet is not available"
          description="Private shelter records are not visible to the public."
          action={
            <Link to="/pets">
              <Button size="sm">Back to browse</Button>
            </Link>
          }
        />
      </Container>
    );
  }

  const favorite = isFavorite(pet.id);
  const GenderIcon = pet.gender === 'male' ? Mars : Venus;

  return (
    <Container className="py-6">
      <Link to="/pets" className="text-sm text-muted-foreground hover:text-foreground">
        ← Back to browse
      </Link>

      <div className="mt-4 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <PetGallery images={pet.gallery} name={pet.name} />

          <Card className="mt-5">
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="text-2xl">{pet.name}</CardTitle>
                <PetStatusBadge status={pet.status} />
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {pet.breed} · {formatAge(pet.ageYears)} · Listed {formatDate(pet.dateAdded)}
              </p>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="muted" className="capitalize">{pet.species}</Badge>
                <Badge variant="muted" className="flex items-center gap-1 capitalize">
                  <GenderIcon className="size-3" /> {pet.gender}
                </Badge>
                <Badge variant="muted" className="flex items-center gap-1 capitalize">
                  <Ruler className="size-3" /> {pet.size}
                </Badge>
                <Badge variant="muted" className="flex items-center gap-1 capitalize">
                  <Baby className="size-3" /> {pet.ageGroup}
                </Badge>
                {pet.temperament.map((t) => (
                  <Badge key={t}>{t}</Badge>
                ))}
              </div>

              <div>
                <h3 className="font-semibold">About</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {pet.description}
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border p-3">
                  <h4 className="flex items-center gap-1.5 text-sm font-semibold">
                    <Syringe className="size-4 text-orange-500" /> Medical history
                  </h4>
                  <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                    {pet.medicalHistory.map((m) => (
                      <li key={m} className="flex items-start gap-1.5">
                        <Check className="mt-0.5 size-3.5 shrink-0 text-green-600" /> {m}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Vaccinated: {pet.vaccinated ? 'Yes' : 'No'} · Spayed/Neutered:{' '}
                    {pet.spayedNeutered ? 'Yes' : 'No'}
                  </p>
                </div>
                <div className="rounded-lg border p-3">
                  <h4 className="text-sm font-semibold">Behavioral notes</h4>
                  <p className="mt-2 text-sm text-muted-foreground">{pet.behavioralNotes}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Good with kids: {pet.goodWithKids ? 'Yes' : 'No'} · Good with
                    pets: {pet.goodWithPets ? 'Yes' : 'No'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardContent className="space-y-2 pt-5">
              <div className="flex gap-2">
                <Link to={`/apply/${pet.id}`} className="flex-1">
                  <Button className="w-full" disabled={pet.status === 'Adopted'}>
                    Apply to adopt
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  onClick={() => toggleFavorite(pet.id)}
                  aria-pressed={favorite}
                  aria-label="Toggle favorite"
                  className={cn(favorite && 'border-red-200 text-red-500')}
                >
                  <Heart className={cn('size-4', favorite && 'fill-red-500')} />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {pet.status === 'Available'
                  ? 'This pet is ready for adoption.'
                  : `Current status: ${pet.status}. You can still inquire.`}
              </p>
            </CardContent>
          </Card>

          {shelter && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Shelter</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <p className="font-semibold">{shelter.name}</p>
                <p className="flex items-center gap-1.5 text-muted-foreground">
                  <MapPin className="size-3.5" /> {shelter.address}
                </p>
                <p className="text-muted-foreground">{shelter.phone}</p>
                <p className="text-muted-foreground">{shelter.email}</p>
                <p className="text-muted-foreground">{shelter.operatingHours}</p>
              </CardContent>
            </Card>
          )}

          <InquiryForm petName={pet.name} />
        </div>
      </div>
    </Container>
  );
};

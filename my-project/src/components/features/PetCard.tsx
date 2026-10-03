import { Heart, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import type { Pet } from '@/types';
import { cn } from '@/lib/utils';
import { formatAge } from '@/utils/formatters';
import { Badge } from '@/components/ui/Badge';
import { PetStatusBadge, VisibilityBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/button';
import { useFavorites } from '@/hooks/useFavorites';

interface PetCardProps {
  pet: Pet;
  shelterLocation?: string;
  children?: React.ReactNode;
  showVisibility?: boolean;
  className?: string;
}

export const PetCard = ({
  pet,
  shelterLocation,
  children,
  showVisibility = false,
  className,
}: PetCardProps) => {
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorite = isFavorite(pet.id);

  const handleToggleFavorite = () => {
    toggleFavorite(pet.id);
    if (favorite) {
      toast.info(`${pet.name} removed from favorites.`);
    } else {
      toast.success(`${pet.name} saved to favorites!`);
    }
  };

  return (
    <article
      className={cn(
        'group flex h-full flex-col overflow-hidden rounded-none border bg-card transition-colors hover:border-primary/40',
        className,
      )}
    >
      <div className="relative shrink-0">
        <Link to={`/pets/${pet.id}`}>
          <img
            src={pet.imageUrl}
            alt={pet.name}
            loading="lazy"
            className="aspect-[4/3] w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        </Link>
        <div className="absolute left-3 top-3 flex gap-1.5">
          <PetStatusBadge status={pet.status} />
          {showVisibility ? <VisibilityBadge visibility={pet.visibility} /> : null}
        </div>
        <button
          type="button"
          onClick={handleToggleFavorite}
          aria-label={favorite ? `Remove ${pet.name} from favorites` : `Save ${pet.name} to favorites`}
          aria-pressed={favorite}
          className={cn(
            'absolute right-3 top-3 flex size-9 items-center justify-center rounded-full border bg-background/90 shadow-sm transition-colors hover:bg-background',
            favorite ? 'text-red-500' : 'text-muted-foreground',
          )}
        >
          <Heart className={cn('size-4', favorite && 'fill-red-500')} />
        </button>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <Link to={`/pets/${pet.id}`} className="hover:underline">
              <h3 className="text-lg font-semibold leading-tight">{pet.name}</h3>
            </Link>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {pet.breed} · {formatAge(pet.ageYears)}
            </p>
          </div>
          <Badge variant="muted" className="capitalize">
            {pet.species}
          </Badge>
        </div>

        <div className="mt-3 flex shrink-0 flex-wrap gap-1.5">
          <Badge variant="muted" className="capitalize">{pet.gender}</Badge>
          <Badge variant="muted" className="capitalize">{pet.size}</Badge>
          {pet.temperament.slice(0, 2).map((t) => (
            <Badge key={t} variant="muted">{t}</Badge>
          ))}
        </div>

        {shelterLocation && (
          <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="size-3.5" /> {shelterLocation}
          </p>
        )}

        {children ?? (
          <div className="mt-auto flex gap-2 pt-3">
            <Link to={`/pets/${pet.id}`} className="flex-1">
              <Button variant="outline" size="sm" className="w-full">
                View profile
              </Button>
            </Link>
            <Link to={`/apply/${pet.id}`} className="flex-1">
              <Button
                size="sm"
                className="w-full"
                disabled={pet.status === 'Adopted'}
              >
                Adopt me
              </Button>
            </Link>
          </div>
        )}
      </div>
    </article>
  );
};

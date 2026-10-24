import { Loader2, LocateFixed, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/Form';
import { NEARBY_RADIUS_OPTIONS } from '@/hooks/useNearbyPets';
import { cn } from '@/lib/utils';

interface NearbyFilterProps {
  active: boolean;
  supported: boolean;
  requesting: boolean;
  radiusKm: number;
  onToggle: () => void;
  onRadiusChange: (radiusKm: number) => void;
  className?: string;
}

const radiusOptions = NEARBY_RADIUS_OPTIONS.map((km) => ({
  value: String(km),
  label: `${km} km`,
}));

/**
 * "Near me" control for the public catalogue.
 *
 * The button triggers the browser's location prompt on demand; once active it
 * sorts the grid closest-first and reveals a radius picker.
 */
export const NearbyFilter = ({
  active,
  supported,
  requesting,
  radiusKm,
  onToggle,
  onRadiusChange,
  className,
}: NearbyFilterProps) => {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Button
        type="button"
        variant={active ? 'default' : 'outline'}
        onClick={onToggle}
        disabled={!supported || requesting}
        aria-pressed={active}
        aria-label={active ? 'Turn off nearby pets' : 'Show pets near me'}
        title={
          supported
            ? 'Sort pets by how close they are to you'
            : 'Location detection is not supported in this browser'
        }
        className="h-12 flex-1 gap-2 rounded-full px-5 sm:flex-none"
      >
        {requesting ? (
          <Loader2 className="size-4 animate-spin" />
        ) : active ? (
          <Navigation className="size-4" />
        ) : (
          <LocateFixed className="size-4" />
        )}
        {requesting ? 'Locating…' : 'Near me'}
        {active && (
          <span className="ml-0.5 size-1.5 rounded-full bg-primary-foreground/80" aria-hidden="true" />
        )}
      </Button>

      {active && (
        <Select
          aria-label="Nearby search radius"
          value={String(radiusKm)}
          onChange={(event) => onRadiusChange(Number(event.target.value))}
          options={radiusOptions}
          className="h-12 w-[6.5rem] rounded-full bg-background px-3"
        />
      )}
    </div>
  );
};

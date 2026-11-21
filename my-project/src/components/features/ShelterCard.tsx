import { Building2, Clock, Mail, MapPin, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Shelter } from '@/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export const ShelterCard = ({
  shelter,
  className,
}: {
  shelter: Shelter;
  className?: string;
}) => {
  return (
    <Link
      to={`/shelters/${shelter.id}`}
      className={cn(
        'group flex h-full min-w-0 flex-col overflow-hidden rounded-none border bg-card transition-colors hover:border-primary/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        className,
      )}
    >
      <article className="flex h-full min-w-0 flex-col">
        <div className="shrink-0 overflow-hidden">
          <img
            src={shelter.imageUrl}
            alt={shelter.name}
            loading="lazy"
            className="aspect-[4/3] w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        </div>

        <div className="flex flex-1 flex-col p-5">
          <div className="flex items-start gap-2">
            <Building2 className="mt-0.5 size-5 shrink-0 text-primary" />
            <div className="min-w-0">
              <h3 className="text-lg font-semibold leading-tight transition-colors [overflow-wrap:anywhere] group-hover:text-primary">
                {shelter.name}
              </h3>
              <p className="mt-1 flex items-start gap-1 text-sm text-muted-foreground">
                <MapPin className="mt-0.5 size-3.5 shrink-0" />
                <span className="min-w-0 [overflow-wrap:anywhere]">{shelter.address}</span>
              </p>
            </div>
          </div>

          <p className="mt-3 text-sm text-muted-foreground break-words [overflow-wrap:anywhere]">
            {shelter.description?.length > 150
              ? `${shelter.description.slice(0, 150)}...`
              : shelter.description}
          </p>

          <ul className="mt-4 space-y-1.5 text-sm text-muted-foreground [overflow-wrap:anywhere]">
            <li className="flex items-center gap-2">
              <Phone className="size-4 shrink-0" />
              <span className="min-w-0 [overflow-wrap:anywhere]">{shelter.phone}</span>
            </li>
            <li className="flex items-center gap-2">
              <Mail className="size-4 shrink-0" />
              <span className="min-w-0 [overflow-wrap:anywhere]">{shelter.email}</span>
            </li>
            <li className="flex items-center gap-2">
              <Clock className="size-4 shrink-0" />
              <span className="min-w-0 [overflow-wrap:anywhere]">{shelter.operatingHours}</span>
            </li>
          </ul>

          <div className="mt-auto flex items-center justify-between gap-2 pt-5">
            <span className="text-xs font-medium text-muted-foreground">
              {shelter.totalPets} pets in care
            </span>
            <Button variant="outline" size="sm">
              <span>View shelter</span>
            </Button>
          </div>
        </div>
      </article>
    </Link>
  );
};
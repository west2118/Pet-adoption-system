import { ArrowUpRight, Clock, Mail, MapPin, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Shelter } from '@/types';
import { cn } from '@/lib/utils';

/**
 * Editorial shelter card — a tall image plate with the details set below it in
 * the reference's type-led style. Distinct from the compact `ShelterCard` used
 * in the landing page grid.
 */
export const ShelterPlate = ({
  shelter,
  className,
}: {
  shelter: Shelter;
  className?: string;
}) => {
  return (
    <article className={cn('group flex flex-col', className)}>
      <div className="relative overflow-hidden rounded-lg bg-muted">
        <img
          src={shelter.imageUrl}
          alt={shelter.name}
          loading="lazy"
          className="aspect-[4/5] w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
        <span className="absolute top-4 left-4 rounded-full bg-background/90 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-foreground backdrop-blur-sm">
          {shelter.totalPets} pets
        </span>
      </div>

      <div className="flex flex-1 flex-col pt-6">
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-lg font-medium leading-snug">{shelter.name}</h3>
        </div>

        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{shelter.description}</p>

        <ul className="mt-5 space-y-2 border-t border-border pt-5 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <MapPin className="mt-0.5 size-4 shrink-0" />
            {shelter.address}
          </li>
          <li className="flex items-center gap-2">
            <Phone className="size-4 shrink-0" />
            {shelter.phone}
          </li>
          <li className="flex items-center gap-2">
            <Mail className="size-4 shrink-0" />
            {shelter.email}
          </li>
          <li className="flex items-center gap-2">
            <Clock className="size-4 shrink-0" />
            {shelter.operatingHours}
          </li>
        </ul>

        <div className="mt-auto pt-6">
          <Link
            to={`/shelters/${shelter.id}`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground transition-colors hover:text-primary"
          >
            View shelter
            <ArrowUpRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>
      </div>
    </article>
  );
};

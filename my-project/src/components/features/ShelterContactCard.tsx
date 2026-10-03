import { Clock, Mail, MapPin, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Shelter } from '@/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface ShelterContactCardProps {
  shelter: Shelter;
  className?: string;
}

/**
 * Address / phone / email / visiting hours for a shelter, with real `tel:` and
 * `mailto:` actions. Used by the public shelter profile — the portal has its own
 * editable form in `pages/shelter/ShelterProfilePage.tsx`.
 */
export const ShelterContactCard = ({ shelter, className }: ShelterContactCardProps) => {
  const rows = [
    { icon: MapPin, label: 'Address', value: shelter.address },
    { icon: Phone, label: 'Phone', value: shelter.phone, href: `tel:${shelter.phone.replace(/\s+/g, '')}` },
    { icon: Mail, label: 'Email', value: shelter.email, href: `mailto:${shelter.email}` },
    { icon: Clock, label: 'Visiting hours', value: shelter.operatingHours },
  ];

  return (
    <div className={cn('border-t border-border pt-6', className)}>
      <ul className="space-y-3 text-sm">
        {rows.map((row) => (
          <li key={row.label} className="flex items-start gap-3">
            <row.icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <span className="min-w-0">
              <span className="block font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                {row.label}
              </span>
              {row.href ? (
                <a
                  href={row.href}
                  className="mt-0.5 block truncate transition-colors hover:text-primary"
                >
                  {row.value}
                </a>
              ) : (
                <span className="mt-0.5 block text-foreground">{row.value}</span>
              )}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-7 flex flex-wrap gap-3">
        <Link to={`/pets?location=${encodeURIComponent(shelter.location)}`}>
          <Button variant="outline" size="sm">
            Browse {shelter.location} listings
          </Button>
        </Link>
        <a href={`mailto:${shelter.email}`}>
          <Button size="sm">Email this shelter</Button>
        </a>
      </div>
    </div>
  );
};

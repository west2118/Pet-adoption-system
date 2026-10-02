import { Building2, Clock, Mail, MapPin, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Shelter } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';

export const ShelterCard = ({ shelter }: { shelter: Shelter }) => {
  return (
    <Card className="overflow-hidden">
      <img src={shelter.imageUrl} alt={shelter.name} className="h-44 w-full object-cover" loading="lazy" />
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="size-5 text-orange-500" /> {shelter.name}
        </CardTitle>
        <CardDescription className="flex items-center gap-1">
          <MapPin className="size-3.5" /> {shelter.address}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{shelter.description}</p>
        <ul className="mt-3 space-y-1.5 text-sm">
          <li className="flex items-center gap-2"><Phone className="size-4 text-muted-foreground" /> {shelter.phone}</li>
          <li className="flex items-center gap-2"><Mail className="size-4 text-muted-foreground" /> {shelter.email}</li>
          <li className="flex items-center gap-2"><Clock className="size-4 text-muted-foreground" /> {shelter.operatingHours}</li>
        </ul>
        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">
            {shelter.totalPets} pets in care
          </span>
          <Link to={`/pets?location=${encodeURIComponent(shelter.location)}`}>
            <Button variant="outline" size="sm">View pets</Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

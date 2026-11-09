import { Building2, Pencil } from 'lucide-react';

import { DetailsModal } from '@/components/shared';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import type { AdminShelterDetails } from '@/services/api';

export interface AdminShelterDetailsModalProps {
  details: AdminShelterDetails | null;
  loadingDetails: boolean;
  onClose: () => void;
  onEdit: (details: AdminShelterDetails) => void;
}

export const AdminShelterDetailsModal = ({
  details,
  loadingDetails,
  onClose,
  onEdit,
}: AdminShelterDetailsModalProps) => (
  <DetailsModal
    open={details !== null}
    onClose={onClose}
    title={details?.shelter.name ?? 'Shelter details'}
    description={details?.shelter.location}
    icon={Building2}
    footer={
      <div className="flex w-full gap-2">
        <Button
          size="lg"
          variant="outline"
          className="flex-1"
          onClick={() => {
            if (details) onEdit(details);
          }}
        >
          <Pencil className="size-4" /> Edit
        </Button>
        <Button size="lg" variant="outline" className="flex-1" onClick={onClose}>
          Close
        </Button>
      </div>
    }
  >
    {details && (
      <div className="space-y-4">
        <img
          src={details.shelter.imageUrl}
          alt={details.shelter.name}
          className="h-44 w-full rounded-lg border object-cover"
        />
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="muted">{details.petCount} pets</Badge>
          <Badge variant="success">{details.publicPets} public</Badge>
          <Badge variant="warning">{details.pendingApplications} pending</Badge>
          <Badge variant="info">{details.staff} staff</Badge>
        </div>
        <dl className="grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-lg border p-2.5">
            <dt className="text-xs text-muted-foreground">Email</dt>
            <dd className="break-all font-medium">{details.shelter.email}</dd>
          </div>
          <div className="rounded-lg border p-2.5">
            <dt className="text-xs text-muted-foreground">Phone</dt>
            <dd className="font-medium">{details.shelter.phone}</dd>
          </div>
          <div className="rounded-lg border p-2.5">
            <dt className="text-xs text-muted-foreground">Address</dt>
            <dd className="font-medium">{details.shelter.address}</dd>
          </div>
          <div className="rounded-lg border p-2.5">
            <dt className="text-xs text-muted-foreground">Hours</dt>
            <dd className="font-medium">{details.shelter.operatingHours}</dd>
          </div>
        </dl>
        <div>
          <h3 className="text-sm font-semibold">About</h3>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {details.shelter.description}
          </p>
        </div>
        <div>
          <h3 className="text-sm font-semibold">Assigned staff</h3>
          {loadingDetails ? (
            <p className="mt-1 text-sm text-muted-foreground">Loading staff…</p>
          ) : details.staffList.length === 0 ? (
            <p className="mt-1 text-sm text-muted-foreground">No staff assigned.</p>
          ) : (
            <ul className="mt-1 space-y-1 text-sm text-muted-foreground">
              {details.staffList.map((u) => (
                <li key={u.id}>
                  {u.name} · {u.email}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    )}
  </DetailsModal>
);


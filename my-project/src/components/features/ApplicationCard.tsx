import { Link } from 'react-router-dom';
import type { AdoptionApplication, Pet } from '@/types';
import { formatDate } from '@/utils/formatters';
import { Card, CardContent } from '@/components/ui/Card';
import { ApplicationStatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/button';

interface ApplicationCardProps {
  application: AdoptionApplication;
  pet?: Pet;
  showApplicant?: boolean;
  onStatusChange?: (id: string, status: AdoptionApplication['status']) => void;
}

export const ApplicationCard = ({ application, pet, showApplicant, onStatusChange }: ApplicationCardProps) => {
  return (
    <Card>
      <CardContent className="flex flex-col gap-3 pt-5 sm:flex-row sm:items-center">
        {pet && (
          <img
            src={pet.imageUrl}
            alt={pet.name}
            className="size-16 shrink-0 rounded-lg object-cover"
          />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold">
              {pet ? pet.name : application.petId}
            </span>
            <ApplicationStatusBadge status={application.status} />
          </div>
          <p className="mt-1 truncate text-sm text-muted-foreground">
            {showApplicant
              ? `${application.applicantName} · ${application.email}`
              : application.reason}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Submitted {formatDate(application.submittedAt)} · Updated{' '}
            {formatDate(application.updatedAt)}
          </p>

          {application.history.length > 0 && (
            <ol className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
              {application.history.map((h, i) => (
                <li
                  key={`${h.status}-${h.date}-${i}`}
                  className="rounded-full bg-muted px-2 py-0.5 font-medium"
                >
                  {h.status} · {formatDate(h.date)}
                </li>
              ))}
            </ol>
          )}
        </div>

        <div className="flex shrink-0 gap-2">
          {onStatusChange ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onStatusChange(application.id, 'Approved')}
              >
                Approve
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onStatusChange(application.id, 'Rejected')}
              >
                Reject
              </Button>
            </>
          ) : (
            <Link to={`/pets/${application.petId}`}>
              <Button variant="outline" size="sm">View pet</Button>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

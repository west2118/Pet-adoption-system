import { Eye, FileSignature, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { DetailsModal, RecordCard, SectionHeader, TableCard } from '@/components/shared';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Form';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/utils/formatters';

interface WaiverTemplate {
  id: string;
  name: string;
  category: string;
  status: 'Active' | 'Draft';
  updatedAt: string;
  body: string;
}

const MOCK_WAIVERS: WaiverTemplate[] = [
  {
    id: 'waiver-adoption-liability',
    name: 'Adoption Liability Waiver',
    category: 'Adoption',
    status: 'Active',
    updatedAt: '2026-08-14',
    body: 'The adopter accepts full responsibility for the animal from the date of adoption, releases the shelter from liability for injury or damage caused by the animal, and agrees to provide adequate food, water, shelter, and veterinary care.',
  },
  {
    id: 'waiver-foster-care',
    name: 'Foster Care Agreement',
    category: 'Foster',
    status: 'Active',
    updatedAt: '2026-07-30',
    body: 'The foster caregiver agrees to house the animal temporarily, follow all medical and feeding instructions, return the animal on request, and promptly report illness, injury, or behavioral concerns to shelter staff.',
  },
  {
    id: 'waiver-medical-disclosure',
    name: 'Medical Disclosure Acknowledgment',
    category: 'Medical',
    status: 'Active',
    updatedAt: '2026-07-02',
    body: 'The adopter acknowledges receipt of the animal’s known medical history, understands that undiscovered conditions may exist, and agrees to seek veterinary care for any ongoing or future treatment needs.',
  },
  {
    id: 'waiver-photo-release',
    name: 'Photo & Story Release',
    category: 'Media',
    status: 'Draft',
    updatedAt: '2026-06-18',
    body: 'The adopter grants the shelter permission to use photos and adoption stories for promotional purposes, with the option to revoke consent in writing at any time.',
  },
  {
    id: 'waiver-transport',
    name: 'Transport Waiver',
    category: 'Logistics',
    status: 'Draft',
    updatedAt: '2026-05-27',
    body: 'The volunteer transporter accepts responsibility for the animal during transit, agrees to use secure carriers or restraints, and releases the shelter from liability for incidents occurring en route.',
  },
];

export const ShelterEWaiversPage = () => {
  const [query, setQuery] = useState('');
  const [detailsId, setDetailsId] = useState<string | null>(null);

  const filteredWaivers = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (search === '') return MOCK_WAIVERS;
    return MOCK_WAIVERS.filter((waiver) =>
      `${waiver.name} ${waiver.category}`.toLowerCase().includes(search),
    );
  }, [query]);

  const detailsWaiver = detailsId
    ? (MOCK_WAIVERS.find((w) => w.id === detailsId) ?? null)
    : null;

  const toolbar = (
    <div className="relative">
      <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        aria-label="Search waiver templates"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search name or category"
        className="h-9 w-full pl-8 sm:w-[280px]"
      />
    </div>
  );

  return (
    <div className="w-full px-4 py-6 sm:px-6">
      <SectionHeader
        title="E-Waivers"
        subtitle="Waiver templates adopters review and sign before taking a pet home."
      />

      <div className="mt-6 space-y-4">
        <TableCard
          title="Waiver templates"
          description={`${filteredWaivers.length} of ${MOCK_WAIVERS.length} templates`}
          icon={FileSignature}
          toolbar={toolbar}
          isEmpty={filteredWaivers.length === 0}
          emptyTitle="No waivers found"
          emptyDescription="Try a different search."
          contentClassName="px-0"
        >
          {/* Desktop: data table */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Template</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Last updated</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWaivers.map((waiver) => (
                  <TableRow key={waiver.id}>
                    <TableCell>
                      <p className="font-medium">{waiver.name}</p>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {waiver.category}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatDate(waiver.updatedAt)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={waiver.status === 'Active' ? 'success' : 'muted'}>
                        {waiver.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-muted-foreground"
                          aria-label={`Preview ${waiver.name}`}
                          onClick={() => setDetailsId(waiver.id)}
                        >
                          <Eye className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile: stacked cards */}
          <div className="grid gap-3 p-4 md:hidden">
            {filteredWaivers.map((waiver) => (
              <RecordCard
                key={waiver.id}
                title={waiver.name}
                subtitle={`${waiver.category} · ${formatDate(waiver.updatedAt)}`}
                badges={
                  <Badge variant={waiver.status === 'Active' ? 'success' : 'muted'}>
                    {waiver.status}
                  </Badge>
                }
                actions={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-muted-foreground"
                    aria-label={`Preview ${waiver.name}`}
                    onClick={() => setDetailsId(waiver.id)}
                  >
                    <Eye className="size-4" />
                  </Button>
                }
              >
                <p className="line-clamp-2 text-sm text-muted-foreground">{waiver.body}</p>
              </RecordCard>
            ))}
          </div>
        </TableCard>
      </div>

      <DetailsModal
        open={detailsWaiver !== null}
        onClose={() => setDetailsId(null)}
        title={detailsWaiver?.name ?? 'Waiver'}
        description={detailsWaiver?.category}
        icon={FileSignature}
        footer={
          <Button size="sm" variant="outline" className="w-full" onClick={() => setDetailsId(null)}>
            Close
          </Button>
        }
      >
        {detailsWaiver && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant={detailsWaiver.status === 'Active' ? 'success' : 'muted'}>
                {detailsWaiver.status}
              </Badge>
              <Badge variant="muted">Updated {formatDate(detailsWaiver.updatedAt)}</Badge>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-sm leading-relaxed">{detailsWaiver.body}</p>
            </div>
          </div>
        )}
      </DetailsModal>
    </div>
  );
};

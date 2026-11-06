import { Eye, PawPrint, Search } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import {
  DetailsModal,
  RecordCard,
  RecordCardSkeleton,
  SectionHeader,
  TableCard,
  TablePagination,
  TableSkeletonRows,
} from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/Form';
import { PetStatusBadge, VisibilityBadge } from '@/components/ui/StatusBadge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import { useShelters } from '@/hooks/useData';
import { listAdminPetsPaginated } from '@/services/api';
import type { Pet } from '@/types';
import { formatDate } from '@/utils/formatters';

export const AdminPetsPage = () => {
  const { shelters } = useShelters();

  const [adminPetsList, setAdminPetsList] = useState<Pet[]>([]);
  const [totalAdminPets, setTotalAdminPets] = useState(0);
  const [petPageSize, setPetPageSize] = useState(10);
  const [petPage, setPetPage] = useState(1);
  const [petQuery, setPetQuery] = useState('');
  const [petShelterFilter, setPetShelterFilter] = useState('all');
  const [detailsPet, setDetailsPet] = useState<Pet | null>(null);
  const [loadingAdminPets, setLoadingAdminPets] = useState(true);

  const shelterName = (id: string) => shelters.find((s) => s.id === id)?.name ?? 'Unknown';

  const fetchPets = useCallback(async () => {
    try {
      const res = await listAdminPetsPaginated({
        page: petPage,
        limit: petPageSize,
        search: petQuery.trim(),
        shelterId: petShelterFilter,
      });
      setAdminPetsList(res.items);
      setTotalAdminPets(res.total);
    } catch {
      toast.error('Failed to load pets.');
    } finally {
      setLoadingAdminPets(false);
    }
  }, [petPage, petPageSize, petQuery, petShelterFilter]);

  useEffect(() => {
    fetchPets();
  }, [fetchPets]);

  const petSearchFilter = (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <div className="relative w-full sm:w-[240px]">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={petQuery}
          onChange={(e) => {
            setLoadingAdminPets(true);
            setPetQuery(e.target.value);
            setPetPage(1);
          }}
          placeholder="Search name, breed, or species"
          className="h-9 w-full pl-8 sm:w-[240px]"
        />
      </div>
      <Select
        aria-label="Filter by shelter"
        className="h-9 w-[180px]"
        value={petShelterFilter}
        onChange={(e) => {
          setLoadingAdminPets(true);
          setPetShelterFilter(e.target.value);
          setPetPage(1);
        }}
        options={[
          { value: 'all', label: 'All shelters' },
          ...shelters.map((s) => ({ value: s.id, label: s.name })),
        ]}
      />
    </div>
  );

  const petPagination =
    totalAdminPets > 0 ? (
      <TablePagination
        currentPage={petPage}
        totalItems={totalAdminPets}
        pageSize={petPageSize}
        onPageChange={(next) => {
          setLoadingAdminPets(true);
          setPetPage(next);
        }}
        onPageSizeChange={(newSize) => {
          setLoadingAdminPets(true);
          setPetPageSize(newSize);
          setPetPage(1);
        }}
        label="pets"
      />
    ) : undefined;

  return (
    <div className="w-full px-4 py-6 sm:px-6">
      <SectionHeader
        title="All pets inventory"
        subtitle="Developer and system oversight for animal listings across every partner rescue."
      />

      <div className="mt-6 space-y-4">
        <TableCard
          title="All pets"
          description={`${adminPetsList.length} of ${totalAdminPets} pets across every shelter`}
          icon={PawPrint}
          toolbar={petSearchFilter}
          isEmpty={!loadingAdminPets && adminPetsList.length === 0}
          emptyTitle="No pets found"
          emptyDescription="Try a different search or shelter filter."
          footer={petPagination}
          contentClassName="px-0"
        >
          {/* Desktop Table */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pet</TableHead>
                  <TableHead>Shelter</TableHead>
                  <TableHead>Species</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Visibility</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingAdminPets ? (
                  <TableSkeletonRows columns={7} rows={6} avatar />
                ) : (
                  adminPetsList.map((pet) => (
                    <TableRow key={pet.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <img
                            src={pet.imageUrl}
                            alt={pet.name}
                            className="size-10 shrink-0 rounded-lg object-cover"
                          />
                          <div className="min-w-0">
                            <p className="font-medium">{pet.name}</p>
                            <p className="truncate text-xs text-muted-foreground">{pet.breed}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {shelterName(pet.shelterId)}
                      </TableCell>
                      <TableCell className="capitalize text-muted-foreground">
                        {pet.species}
                      </TableCell>
                      <TableCell className="capitalize text-muted-foreground">
                        {pet.status}
                      </TableCell>
                      <TableCell className="capitalize text-muted-foreground">
                        {pet.visibility}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {formatDate(pet.dateAdded)}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="text-muted-foreground"
                            aria-label={`View ${pet.name} details`}
                            onClick={() => setDetailsPet(pet)}
                          >
                            <Eye className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Cards */}
          <div className="grid gap-3 p-4 md:hidden">
            {loadingAdminPets ? (
              <RecordCardSkeleton count={3} />
            ) : (
              adminPetsList.map((pet) => (
                <RecordCard
                  key={pet.id}
                  imageUrl={pet.imageUrl}
                  imageAlt={pet.name}
                  title={pet.name}
                  subtitle={`${pet.breed} · ${shelterName(pet.shelterId)}`}
                  badges={
                    <>
                      <PetStatusBadge status={pet.status} />
                      <VisibilityBadge visibility={pet.visibility} />
                    </>
                  }
                  actions={
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-muted-foreground"
                      aria-label={`View ${pet.name} details`}
                      onClick={() => setDetailsPet(pet)}
                    >
                      <Eye className="size-4" />
                    </Button>
                  }
                >
                  <p className="text-xs text-muted-foreground">
                    {pet.species} · Added {formatDate(pet.dateAdded)}
                  </p>
                </RecordCard>
              ))
            )}
          </div>
        </TableCard>
      </div>

      <DetailsModal
        open={detailsPet !== null}
        onClose={() => setDetailsPet(null)}
        title={detailsPet?.name ?? 'Pet details'}
        description={
          detailsPet ? `Posted by ${shelterName(detailsPet.shelterId)}` : undefined
        }
        icon={PawPrint}
        footer={
          <Button size="lg" variant="outline" className="w-full" onClick={() => setDetailsPet(null)}>
            Close
          </Button>
        }
      >
        {detailsPet && (
          <div className="space-y-4">
            <img
              src={detailsPet.imageUrl}
              alt={detailsPet.name}
              className="h-48 w-full rounded-lg border object-cover"
            />
            <div className="flex flex-wrap gap-1.5">
              <PetStatusBadge status={detailsPet.status} />
              <VisibilityBadge visibility={detailsPet.visibility} />
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {detailsPet.description}
            </p>
            <dl className="grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-lg border p-2.5">
                <dt className="text-xs text-muted-foreground">Shelter</dt>
                <dd className="font-medium">{shelterName(detailsPet.shelterId)}</dd>
              </div>
              <div className="rounded-lg border p-2.5">
                <dt className="text-xs text-muted-foreground">Species · Breed</dt>
                <dd className="font-medium capitalize">
                  {detailsPet.species} · {detailsPet.breed}
                </dd>
              </div>
              <div className="rounded-lg border p-2.5">
                <dt className="text-xs text-muted-foreground">Age</dt>
                <dd className="font-medium">
                  {detailsPet.ageYears} y/o · {detailsPet.ageGroup}
                </dd>
              </div>
              <div className="rounded-lg border p-2.5">
                <dt className="text-xs text-muted-foreground">Added</dt>
                <dd className="font-medium">{formatDate(detailsPet.dateAdded)}</dd>
              </div>
            </dl>
          </div>
        )}
      </DetailsModal>
    </div>
  );
};


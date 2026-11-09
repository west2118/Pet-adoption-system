import { useQuery } from '@tanstack/react-query';
import { Eye, PawPrint } from 'lucide-react';
import { useState } from 'react';
import { AdminPetDetailsModal, AdminPetMobileCard } from '@/components/admin';
import {
  DebouncedSearchInput,
  RefreshButton,
  RecordCardSkeleton,
  SectionHeader,
  TableCard,
  TablePagination,
  TableSkeletonRows,
} from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/Form';
import { formatDate } from '@/utils/formatters';
import { useShelters } from '@/hooks/useData';
import { useRefresh } from '@/hooks/useRefresh';
import { listAdminPetsPaginated } from '@/services/api';
import type { Pet } from '@/types';

export const ADMIN_PETS_QUERY_KEY = ['adminPets'] as const;

export const AdminPetsPage = () => {
  const { shelters } = useShelters();

  const [petPageSize, setPetPageSize] = useState(10);
  const [petPage, setPetPage] = useState(1);
  const [petQuery, setPetQuery] = useState('');
  const [petShelterFilter, setPetShelterFilter] = useState('all');
  const [detailsPet, setDetailsPet] = useState<Pet | null>(null);

  const shelterName = (id: string) => shelters.find((s) => s.id === id)?.name ?? 'Unknown';

  const {
    data: petsData,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: [
      ...ADMIN_PETS_QUERY_KEY,
      {
        page: petPage,
        limit: petPageSize,
        search: petQuery.trim(),
        shelterId: petShelterFilter,
      },
    ],
    queryFn: () =>
      listAdminPetsPaginated({
        page: petPage,
        limit: petPageSize,
        search: petQuery.trim(),
        shelterId: petShelterFilter,
      }),
  });

  const { isRefreshing, refresh } = useRefresh(refetch);
  const showLoading = isLoading || isFetching || isRefreshing;

  const adminPetsList = petsData?.items ?? [];
  const totalAdminPets = petsData?.total ?? 0;

  return (
    <div className="w-full px-4 py-6 sm:px-6">
      <SectionHeader
        title="All platform pets"
        subtitle="Manage and oversee pets across all partner shelters."
        actions={<RefreshButton onRefresh={refresh} />}
      />

      <div className="mt-6 space-y-4">
        <TableCard
          title="Pet inventory"
          description="Global directory of all listed and private pets."
          icon={PawPrint}
          toolbar={
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <DebouncedSearchInput
                value={petQuery}
                onDebouncedChange={(val) => {
                  setPetQuery(val);
                  setPetPage(1);
                }}
                placeholder="Search name, breed, or species"
                className="w-full sm:w-[260px]"
                wrapperClassName="sm:w-[260px]"
              />
              <Select
                aria-label="Filter by shelter"
                value={petShelterFilter}
                onChange={(e) => {
                  setPetShelterFilter(e.target.value);
                  setPetPage(1);
                }}
                className="w-full sm:w-[200px]"
                options={[
                  { value: 'all', label: 'All shelters' },
                  ...shelters.map((s) => ({ value: s.id, label: s.name })),
                ]}
              />
            </div>
          }
          isEmpty={!showLoading && adminPetsList.length === 0}
          emptyTitle="No pets found"
          emptyDescription={
            petQuery || petShelterFilter !== 'all'
              ? 'Try adjusting your search or filters.'
              : 'No pets have been registered on the platform yet.'
          }
          footer={
            totalAdminPets > 0 ? (
              <TablePagination
                currentPage={petPage}
                totalItems={totalAdminPets}
                pageSize={petPageSize}
                onPageChange={(next) => setPetPage(next)}
                onPageSizeChange={(newSize) => {
                  setPetPageSize(newSize);
                  setPetPage(1);
                }}
                label="pets"
              />
            ) : undefined
          }
          contentClassName="px-0"
        >
          {/* Desktop Table */}
          <div className="hidden md:block">
            <table className="w-full caption-bottom text-sm">
              <thead className="[&_tr]:border-b">
                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                  <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Pet</th>
                  <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Shelter</th>
                  <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Species</th>
                  <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                  <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Visibility</th>
                  <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Added</th>
                  <th className="h-10 px-4 text-center align-middle font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {showLoading ? (
                  <TableSkeletonRows columns={7} rows={6} avatar />
                ) : (
                  adminPetsList.map((pet) => (
                    <tr key={pet.id} className="border-b transition-colors hover:bg-muted/50">
                      <td className="p-4 align-middle">
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
                      </td>
                      <td className="whitespace-nowrap p-4 align-middle text-muted-foreground">
                        {shelterName(pet.shelterId)}
                      </td>
                      <td className="p-4 align-middle capitalize text-muted-foreground">
                        {pet.species}
                      </td>
                      <td className="p-4 align-middle capitalize text-muted-foreground">
                        {pet.status}
                      </td>
                      <td className="p-4 align-middle capitalize text-muted-foreground">
                        {pet.visibility}
                      </td>
                      <td className="whitespace-nowrap p-4 align-middle text-muted-foreground">
                        {formatDate(pet.dateAdded)}
                      </td>
                      <td className="p-4 text-center align-middle">
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
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="grid gap-3 p-4 md:hidden">
            {showLoading ? (
              <RecordCardSkeleton count={3} />
            ) : (
              adminPetsList.map((pet) => (
                <AdminPetMobileCard
                  key={pet.id}
                  pet={pet}
                  shelterName={shelterName(pet.shelterId)}
                  onView={setDetailsPet}
                />
              ))
            )}
          </div>
        </TableCard>
      </div>

      <AdminPetDetailsModal
        pet={detailsPet}
        shelterName={detailsPet ? shelterName(detailsPet.shelterId) : ''}
        onClose={() => setDetailsPet(null)}
      />
    </div>
  );
};

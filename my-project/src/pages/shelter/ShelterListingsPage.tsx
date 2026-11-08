import { useState } from 'react';
import { Eye, PawPrint, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { useQuery } from '@tanstack/react-query';

import {
  DebouncedSearchInput,
  RecordCardSkeleton,
  RefreshButton,
  SectionHeader,
  TableCard,
  TablePagination,
  TableSkeletonRows,
} from '@/components/shared';
import { PetStatusBadge, SpeciesBadge, VisibilityBadge } from '@/components/ui/StatusBadge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import { Select } from '@/components/ui/Form';
import { Button } from '@/components/ui/button';

import {
  PetDeleteModal,
  PetDetailsModal,
  PetFormModal,
  PetListingMobileCard,
} from '@/components/listings';

import { useAuth } from '@/hooks/useAuth';
import { useShelters } from '@/hooks/useData';
import { useRefresh } from '@/hooks/useRefresh';
import { useShelterListingMutations } from '@/hooks/useShelterListingMutations';
import type { PetListingInput } from '@/hooks/useShelterListingMutations';
import { listMyListingsPaginated } from '@/services/api';
import type { Pet, PetStatus, PetVisibility } from '@/types';
import { formatDate } from '@/utils/formatters';

import {
  SPECIES_FILTER_OPTIONS,
  STATUS_FILTER_OPTIONS,
  VISIBILITY_FILTER_OPTIONS,
} from '@/data/petListingPresets';

export const ShelterListingsPage = () => {
  const { user } = useAuth();
  const { shelters } = useShelters();

  const myShelterId = user?.shelterId ?? shelters[0]?.id ?? null;
  const myShelter = shelters.find((s) => s.id === myShelterId) ?? null;
  const isLockedToShelter = Boolean(user?.shelterId);

  // Filters and pagination state
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [query, setQuery] = useState('');
  const [visibilityFilter, setVisibilityFilter] = useState<'all' | PetVisibility>('all');
  const [speciesFilter, setSpeciesFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | PetStatus>('all');

  // Modal states
  const [slideOpen, setSlideOpen] = useState(false);
  const [editingPet, setEditingPet] = useState<Pet | null>(null);
  const [detailsPet, setDetailsPet] = useState<Pet | null>(null);
  const [pendingDeletePet, setPendingDeletePet] = useState<Pet | null>(null);

  // Queries
  const {
    data: listingsData,
    isLoading: loadingListings,
    isFetching: fetchingListings,
    isError: listingsError,
    refetch: refetchListings,
  } = useQuery({
    queryKey: [
      'shelterListings',
      {
        page,
        pageSize,
        query: query.trim(),
        visibilityFilter,
        speciesFilter,
        statusFilter,
      },
    ],
    queryFn: () =>
      listMyListingsPaginated({
        page,
        limit: pageSize,
        search: query.trim(),
        visibility: visibilityFilter,
        species: speciesFilter,
        status: statusFilter,
      }),
  });

  const { isRefreshing, refresh } = useRefresh(refetchListings);
  const showLoading = loadingListings || fetchingListings || isRefreshing;

  const pets = listingsData?.items ?? [];
  const totalPets = listingsData?.total ?? 0;

  // Mutations
  const handleFormSaved = () => {
    setSlideOpen(false);
    setEditingPet(null);
  };

  const {
    createMutation,
    updateMutation,
    deleteMutation,
    isSaving,
  } = useShelterListingMutations({
    onCreated: handleFormSaved,
    onUpdated: handleFormSaved,
    onDeleted: () => setPendingDeletePet(null),
  });

  const handleOpenAdd = () => {
    setEditingPet(null);
    setSlideOpen(true);
  };

  const handleOpenEdit = (pet: Pet) => {
    if (myShelterId && pet.shelterId !== myShelterId) {
      toast.error('This listing belongs to another shelter.');
      return;
    }
    setEditingPet(pet);
    setDetailsPet(null);
    setSlideOpen(true);
  };

  const handleAskRemove = (pet: Pet) => {
    if (myShelterId && pet.shelterId !== myShelterId) {
      toast.error('This listing belongs to another shelter.');
      return;
    }
    setPendingDeletePet(pet);
  };

  const handleFormSubmit = ({
    petId,
    payload,
  }: {
    petId?: string;
    payload: PetListingInput;
  }) => {
    if (petId) {
      updateMutation.mutate({ id: petId, updates: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <div className="w-full px-4 py-6 sm:px-6">
      <SectionHeader
        title="Pet listings"
        subtitle={
          myShelter
            ? `Showing inventory for ${myShelter.name} only.`
            : 'Manage your public listings and private inventory.'
        }
        actions={<RefreshButton onRefresh={refresh} />}
      />

      <div className="mt-6 space-y-4">
        <TableCard
          title="Inventory"
          description="Public and private pets in your shelter's inventory."
          icon={PawPrint}
          action={
            <Button size="lg" onClick={handleOpenAdd}>
              <Plus className="size-4" /> Add pet
            </Button>
          }
          toolbar={
            <div className="flex flex-wrap items-center justify-between gap-2">
              <DebouncedSearchInput
                aria-label="Search listings"
                value={query}
                onDebouncedChange={(val) => {
                  setQuery(val);
                  setPage(1);
                }}
                placeholder="Search name or breed"
                className="sm:w-[240px]"
              />
              <div className="flex flex-wrap items-center gap-2">
                <Select
                  aria-label="Filter by species"
                  className="h-9 w-[150px]"
                  value={speciesFilter}
                  onChange={(e) => {
                    setSpeciesFilter(e.target.value);
                    setPage(1);
                  }}
                  options={SPECIES_FILTER_OPTIONS}
                />
                <Select
                  aria-label="Filter by status"
                  className="h-9 w-[150px]"
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value as 'all' | PetStatus);
                    setPage(1);
                  }}
                  options={STATUS_FILTER_OPTIONS}
                />
                <Select
                  aria-label="Filter by visibility"
                  className="h-9 w-[150px]"
                  value={visibilityFilter}
                  onChange={(e) => {
                    setVisibilityFilter(e.target.value as 'all' | PetVisibility);
                    setPage(1);
                  }}
                  options={VISIBILITY_FILTER_OPTIONS}
                />
              </div>
            </div>
          }
          error={
            listingsError
              ? 'We could not load your inventory. Make sure the backend is running and try again.'
              : null
          }
          errorTitle="Could not load listings"
          onRetry={() => void refetchListings()}
          isEmpty={!showLoading && !listingsError && pets.length === 0}
          emptyTitle="No listings found"
          emptyDescription={
            myShelter
              ? `No pets recorded under ${myShelter.name} yet. Add your first listing.`
              : 'Try a different search or visibility filter, or add a new pet.'
          }
          footer={
            totalPets > 10 ? (
              <TablePagination
                currentPage={page}
                totalItems={totalPets}
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={(newSize) => {
                  setPageSize(newSize);
                  setPage(1);
                }}
                label="listings"
              />
            ) : undefined
          }
          contentClassName="px-0"
        >
          {/* Desktop: data table */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pet</TableHead>
                  <TableHead>Species</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Visibility</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {showLoading ? (
                  <TableSkeletonRows columns={6} rows={6} avatar />
                ) : (
                  pets.map((pet) => (
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
                      <TableCell>
                        <SpeciesBadge species={pet.species} />
                      </TableCell>
                      <TableCell>
                        <PetStatusBadge status={pet.status} />
                      </TableCell>
                      <TableCell>
                        <VisibilityBadge visibility={pet.visibility} />
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
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="text-blue-600 hover:bg-blue-50 hover:text-blue-700 dark:text-blue-400 dark:hover:bg-blue-950/40"
                            aria-label={`Edit ${pet.name}`}
                            onClick={() => handleOpenEdit(pet)}
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/40"
                            aria-label={`Delete ${pet.name}`}
                            onClick={() => handleAskRemove(pet)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile: stacked cards */}
          <div className="grid gap-3 p-4 md:hidden">
            {showLoading ? (
              <RecordCardSkeleton count={3} />
            ) : (
              pets.map((pet) => (
                <PetListingMobileCard
                  key={pet.id}
                  pet={pet}
                  onView={setDetailsPet}
                  onEdit={handleOpenEdit}
                  onDelete={handleAskRemove}
                />
              ))
            )}
          </div>
        </TableCard>
      </div>

      {/* Add / Edit SlideOver Form Modal */}
      <PetFormModal
        isOpen={slideOpen}
        editingPet={editingPet}
        myShelterId={myShelterId}
        isLockedToShelter={isLockedToShelter}
        isSaving={isSaving}
        onClose={handleFormSaved}
        onSubmit={handleFormSubmit}
      />

      {/* View Pet Details Modal */}
      <PetDetailsModal
        pet={detailsPet}
        shelters={shelters}
        onClose={() => setDetailsPet(null)}
        onEdit={(pet) => handleOpenEdit(pet)}
      />

      {/* Delete Confirmation Modal */}
      <PetDeleteModal
        pet={pendingDeletePet}
        isOpen={pendingDeletePet !== null}
        isDeleting={deleteMutation.isPending}
        onClose={() => setPendingDeletePet(null)}
        onConfirm={(petId) =>
          deleteMutation.mutate({ id: petId, name: pendingDeletePet?.name })
        }
      />
    </div>
  );
};

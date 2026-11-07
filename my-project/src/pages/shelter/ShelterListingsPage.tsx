import { useState } from 'react';
import { Eye, PawPrint, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  DebouncedSearchInput,
  RecordCard,
  RecordCardSkeleton,
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

import { PetDeleteModal, PetDetailsModal, PetFormModal } from '@/components/listings';

import { useAuth } from '@/hooks/useAuth';
import { useShelters } from '@/hooks/useData';
import { listMyListingsPaginated, petService } from '@/services/api';
import { ApiError } from '@/lib/apiClient';
import type { Pet, PetStatus, PetVisibility } from '@/types';
import { formatDate } from '@/utils/formatters';

import {
  SPECIES_FILTER_OPTIONS,
  STATUS_FILTER_OPTIONS,
  VISIBILITY_FILTER_OPTIONS,
} from '@/data/petListingPresets';

export const ShelterListingsPage = () => {
  const queryClient = useQueryClient();
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
        myShelterId,
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
        shelterId: myShelterId,
      }),
  });

  const pets = listingsData?.items ?? [];
  const totalPets = listingsData?.total ?? 0;

  // Mutations
  const createMutation = useMutation({
    mutationFn: (newPet: Parameters<typeof petService.create>[0]) => petService.create(newPet),
    onSuccess: (createdPet) => {
      toast.success(`${createdPet.name} created successfully!`);
      setSlideOpen(false);
      setEditingPet(null);
      queryClient.invalidateQueries({ queryKey: ['shelterListings'] });
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : 'Failed to create listing. Please try again.');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Parameters<typeof petService.update>[1] }) =>
      petService.update(id, updates),
    onSuccess: (updatedPet) => {
      toast.success(`${updatedPet.name || 'Pet'} updated successfully!`);
      setSlideOpen(false);
      setEditingPet(null);
      queryClient.invalidateQueries({ queryKey: ['shelterListings'] });
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : 'Failed to update listing. Please try again.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => petService.remove(id),
    onSuccess: (_, deletedId) => {
      const target = pets.find((p) => p.id === deletedId);
      toast.success(target ? `${target.name} removed.` : 'Listing removed.');
      setPendingDeletePet(null);
      queryClient.invalidateQueries({ queryKey: ['shelterListings'] });
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : 'Failed to remove listing. Please try again.');
    },
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
    payload: Parameters<typeof petService.create>[0];
  }) => {
    if (petId) {
      updateMutation.mutate({ id: petId, updates: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const searchFilter = (
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
  );

  const addPetButton = (
    <Button size="lg" onClick={handleOpenAdd}>
      <Plus className="size-4" /> Add pet
    </Button>
  );

  const pagination =
    totalPets > 0 ? (
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
    ) : undefined;

  return (
    <div className="w-full px-4 py-6 sm:px-6">
      <SectionHeader
        title="Pet listings"
        subtitle={
          myShelter
            ? `Showing inventory for ${myShelter.name} only.`
            : 'Manage your public listings and private inventory.'
        }
      />

      <div className="mt-6 space-y-4">
        <TableCard
          title="Inventory"
          description="Public and private pets in your shelter's inventory."
          icon={PawPrint}
          action={addPetButton}
          toolbar={searchFilter}
          isEmpty={!loadingListings && pets.length === 0}
          emptyTitle="No listings found"
          emptyDescription={
            myShelter
              ? `No pets recorded under ${myShelter.name} yet. Add your first listing.`
              : 'Try a different search or visibility filter, or add a new pet.'
          }
          footer={pagination}
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
                {loadingListings ? (
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
            {loadingListings ? (
              <RecordCardSkeleton count={3} />
            ) : (
              pets.map((pet) => (
                <RecordCard
                  key={pet.id}
                  imageUrl={pet.imageUrl}
                  imageAlt={pet.name}
                  title={pet.name}
                  subtitle={pet.breed}
                  badges={
                    <>
                      <SpeciesBadge species={pet.species} />
                      <PetStatusBadge status={pet.status} />
                      <VisibilityBadge visibility={pet.visibility} />
                    </>
                  }
                  actions={
                    <>
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
                    </>
                  }
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
        isSaving={createMutation.isPending || updateMutation.isPending}
        onClose={() => {
          setSlideOpen(false);
          setEditingPet(null);
        }}
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
        onConfirm={(petId) => deleteMutation.mutate(petId)}
      />
    </div>
  );
};

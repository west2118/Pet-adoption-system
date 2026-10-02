import {
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  ListPlus,
  PawPrint,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Container } from '@/components/layout/Container';
import { DetailsModal, RecordCard, SectionHeader, SlideOver, TableCard } from '@/components/shared';
import { PetStatusBadge, VisibilityBadge } from '@/components/ui/StatusBadge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import { Input, Textarea, Select, Label } from '@/components/ui/Form';
import { Button } from '@/components/ui/button';
import { usePets, useShelters } from '@/hooks/useData';
import { petService } from '@/services/api';
import type { AgeGroup, Pet, PetStatus, PetVisibility } from '@/types';
import { formatAge, formatDate } from '@/utils/formatters';

const STATUS_OPTIONS = [
  { value: 'Available', label: 'Available' },
  { value: 'Pending Adoption', label: 'Pending' },
  { value: 'Adopted', label: 'Adopted' },
  { value: 'Fostered', label: 'Fostered' },
];

const VISIBILITY_OPTIONS = [
  { value: 'public', label: 'Public' },
  { value: 'private', label: 'Private' },
];

const VISIBILITY_FILTER_OPTIONS = [
  { value: 'all', label: 'All visibility' },
  { value: 'public', label: 'Public' },
  { value: 'private', label: 'Private' },
];

const PAGE_SIZE = 8;

export const ShelterListingsPage = () => {
  const { pets, setPets } = usePets();
  const { shelters } = useShelters();
  const [slideOpen, setSlideOpen] = useState(false);
  const [editingPet, setEditingPet] = useState<Pet | null>(null);
  const [detailsPet, setDetailsPet] = useState<Pet | null>(null);
  const [query, setQuery] = useState('');
  const [visibilityFilter, setVisibilityFilter] = useState<'all' | PetVisibility>('all');
  const [page, setPage] = useState(1);
  const [form, setForm] = useState({
    name: '',
    species: 'dog',
    breed: '',
    ageYears: '1',
    ageGroup: 'adult' as AgeGroup,
    size: 'medium',
    gender: 'male',
    status: 'Available' as PetStatus,
    visibility: 'public' as PetVisibility,
    description: '',
    temperament: '',
    imageUrl: '',
    medicalHistory: '',
    behavioralNotes: '',
    vaccinated: true,
    spayedNeutered: false,
    goodWithKids: true,
    goodWithPets: true,
  });

  const filteredPets = useMemo(() => {
    const search = query.trim().toLowerCase();
    return pets.filter((pet) => {
      const matchesVisibility =
        visibilityFilter === 'all' || pet.visibility === visibilityFilter;
      const matchesSearch =
        search === '' ||
        pet.name.toLowerCase().includes(search) ||
        pet.breed.toLowerCase().includes(search);
      return matchesVisibility && matchesSearch;
    });
  }, [pets, visibilityFilter, query]);

  const totalPages = Math.max(1, Math.ceil(filteredPets.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const pagedPets = filteredPets.slice(startIndex, startIndex + PAGE_SIZE);

  const remove = async (id: string) => {
    await petService.remove(id);
    setPets((prev) => prev.filter((p) => p.id !== id));
  };

  const resetForm = () =>
    setForm({
      name: '',
      species: 'dog',
      breed: '',
      ageYears: '1',
      ageGroup: 'adult',
      size: 'medium',
      gender: 'male',
      status: 'Available',
      visibility: 'public',
      description: '',
      temperament: '',
      imageUrl: '',
      medicalHistory: '',
      behavioralNotes: '',
      vaccinated: true,
      spayedNeutered: false,
      goodWithKids: true,
      goodWithPets: true,
    });

  const openAdd = () => {
    setEditingPet(null);
    resetForm();
    setSlideOpen(true);
  };

  const openEdit = (pet: Pet) => {
    setEditingPet(pet);
    setDetailsPet(null);
    setForm({
      name: pet.name,
      species: pet.species,
      breed: pet.breed,
      ageYears: String(pet.ageYears),
      ageGroup: pet.ageGroup,
      size: pet.size,
      gender: pet.gender,
      status: pet.status,
      visibility: pet.visibility,
      description: pet.description,
      temperament: pet.temperament.join(', '),
      imageUrl: pet.imageUrl,
      medicalHistory: pet.medicalHistory.join('\n'),
      behavioralNotes: pet.behavioralNotes,
      vaccinated: pet.vaccinated,
      spayedNeutered: pet.spayedNeutered,
      goodWithKids: pet.goodWithKids,
      goodWithPets: pet.goodWithPets,
    });
    setSlideOpen(true);
  };

  const closeSlide = () => {
    setSlideOpen(false);
    setEditingPet(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const temperament = form.temperament
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    const medicalHistory = form.medicalHistory
      .split('\n')
      .map((m) => m.trim())
      .filter(Boolean);
    if (editingPet) {
      const updated = await petService.update(editingPet.id, {
        name: form.name,
        species: form.species as 'dog' | 'cat' | 'rabbit' | 'bird' | 'other',
        breed: form.breed || 'Mixed',
        ageYears: Number(form.ageYears) || 1,
        ageGroup: form.ageGroup,
        size: form.size as 'small' | 'medium' | 'large',
        gender: form.gender as 'male' | 'female',
        status: form.status,
        visibility: form.visibility,
        description: form.description || editingPet.description,
        temperament: temperament.length > 0 ? temperament : editingPet.temperament,
        imageUrl: form.imageUrl || editingPet.imageUrl,
        gallery: form.imageUrl ? [form.imageUrl] : editingPet.gallery,
        medicalHistory: medicalHistory.length > 0 ? medicalHistory : editingPet.medicalHistory,
        behavioralNotes: form.behavioralNotes || editingPet.behavioralNotes,
        vaccinated: form.vaccinated,
        spayedNeutered: form.spayedNeutered,
        goodWithKids: form.goodWithKids,
        goodWithPets: form.goodWithPets,
      });
      if (updated) setPets((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      closeSlide();
      return;
    }
    const created = await petService.create({
      name: form.name,
      species: form.species as 'dog' | 'cat' | 'rabbit' | 'bird' | 'other',
      breed: form.breed || 'Mixed',
      ageYears: Number(form.ageYears) || 1,
      ageGroup: form.ageGroup,
      size: form.size as 'small' | 'medium' | 'large',
      gender: form.gender as 'male' | 'female',
      temperament: temperament.length > 0 ? temperament : ['Friendly'],
      shelterId: 's1',
      visibility: form.visibility,
      description: form.description || 'New rescue looking for a home.',
      medicalHistory: medicalHistory.length > 0 ? medicalHistory : ['Vet-checked'],
      behavioralNotes: form.behavioralNotes || 'Assessment in progress.',
      status: form.status,
      imageUrl:
        form.imageUrl ||
        'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=800&q=80',
      gallery: form.imageUrl
        ? [form.imageUrl]
        : ['https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=800&q=80'],
      vaccinated: form.vaccinated,
      spayedNeutered: form.spayedNeutered,
      goodWithKids: form.goodWithKids,
      goodWithPets: form.goodWithPets,
    });
    setPets((prev) => [created, ...prev]);
    closeSlide();
    resetForm();
  };

  const searchFilter = (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          aria-label="Search listings"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
          placeholder="Search name or breed"
          className="h-9 w-full pl-8 sm:w-[240px]"
        />
      </div>
      <Select
        aria-label="Filter by visibility"
        className="h-9 w-[180px]"
        value={visibilityFilter}
        onChange={(e) => {
          setVisibilityFilter(e.target.value as 'all' | PetVisibility);
          setPage(1);
        }}
        options={VISIBILITY_FILTER_OPTIONS}
      />
    </div>
  );

  const addPetButton = (
    <Button size="lg" onClick={openAdd}>
      <Plus className="size-4" /> Add pet
    </Button>
  );

  const pagination =
    filteredPets.length > 0 ? (
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Showing <span className="font-medium text-foreground">{startIndex + 1}</span>–
          <span className="font-medium text-foreground">
            {Math.min(startIndex + PAGE_SIZE, filteredPets.length)}
          </span>{' '}
          of <span className="font-medium text-foreground">{filteredPets.length}</span> listings
        </p>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="size-4" /> Prev
          </Button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
            <Button
              key={n}
              variant={n === currentPage ? 'default' : 'outline'}
              size="icon-sm"
              aria-label={`Go to page ${n}`}
              aria-current={n === currentPage ? 'page' : undefined}
              onClick={() => setPage(n)}
            >
              {n}
            </Button>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Next <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    ) : undefined;

  return (
    <Container className="py-6">
      <SectionHeader
        title="Pet listings"
        subtitle="Manage your public listings and private inventory."
      />

      <div className="mt-6 space-y-4">
        <TableCard
          title="Inventory"
          description="Public and private pets in your shelter's inventory."
          icon={PawPrint}
          action={addPetButton}
          toolbar={searchFilter}
          isEmpty={filteredPets.length === 0}
          emptyTitle="No listings found"
          emptyDescription="Try a different search or visibility filter, or add a new pet."
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
                {pagedPets.map((pet) => (
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
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-blue-600 hover:bg-blue-50 hover:text-blue-700 dark:text-blue-400 dark:hover:bg-blue-950/40"
                          aria-label={`Edit ${pet.name}`}
                          onClick={() => openEdit(pet)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/40"
                          aria-label={`Delete ${pet.name}`}
                          onClick={() => remove(pet.id)}
                        >
                          <Trash2 className="size-4" />
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
            {pagedPets.map((pet) => (
              <RecordCard
                key={pet.id}
                imageUrl={pet.imageUrl}
                imageAlt={pet.name}
                title={pet.name}
                subtitle={pet.breed}
                badges={
                  <>
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
                      onClick={() => openEdit(pet)}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/40"
                      aria-label={`Delete ${pet.name}`}
                      onClick={() => remove(pet.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </>
                }
              />
            ))}
          </div>
        </TableCard>
      </div>

      <SlideOver
        open={slideOpen}
        onClose={closeSlide}
        size="lg"
        title={editingPet ? `Edit ${editingPet.name}` : 'Add new pet profile'}
        description={
          editingPet
            ? 'Update the pet record below.'
            : 'Photo uploads + medical records (stored via Supabase Storage in production).'
        }
        icon={editingPet ? Pencil : ListPlus}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <Button type="submit" form="pet-form" size="sm" className="sm:flex-1">
              {editingPet ? 'Save changes' : 'Create listing'}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={closeSlide}>
              Cancel
            </Button>
          </div>
        }
      >
        <form id="pet-form" onSubmit={handleSubmit} className="grid gap-3">
          <div>
            <Label>Name</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Species</Label>
              <Select
                value={form.species}
                onChange={(e) => setForm({ ...form, species: e.target.value })}
                options={[
                  { value: 'dog', label: 'Dog' },
                  { value: 'cat', label: 'Cat' },
                  { value: 'rabbit', label: 'Rabbit' },
                  { value: 'bird', label: 'Bird' },
                  { value: 'other', label: 'Other' },
                ]}
              />
            </div>
            <div>
              <Label>Age (years)</Label>
              <Input
                type="number"
                min={0}
                value={form.ageYears}
                onChange={(e) => setForm({ ...form, ageYears: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Breed</Label>
              <Input
                value={form.breed}
                onChange={(e) => setForm({ ...form, breed: e.target.value })}
                placeholder="e.g. Aspin"
              />
            </div>
            <div>
              <Label>Age group</Label>
              <Select
                value={form.ageGroup}
                onChange={(e) => setForm({ ...form, ageGroup: e.target.value as AgeGroup })}
                options={[
                  { value: 'puppy-kitten', label: 'Puppy / Kitten' },
                  { value: 'young', label: 'Young' },
                  { value: 'adult', label: 'Adult' },
                  { value: 'senior', label: 'Senior' },
                ]}
              />
            </div>
          </div>
          <div>
            <Label>Temperament (comma separated)</Label>
            <Input
              value={form.temperament}
              onChange={(e) => setForm({ ...form, temperament: e.target.value })}
              placeholder="e.g. Friendly, Playful, Calm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Size</Label>
              <Select
                value={form.size}
                onChange={(e) => setForm({ ...form, size: e.target.value })}
                options={[
                  { value: 'small', label: 'Small' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'large', label: 'Large' },
                ]}
              />
            </div>
            <div>
              <Label>Gender</Label>
              <Select
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
                options={[
                  { value: 'male', label: 'Male' },
                  { value: 'female', label: 'Female' },
                ]}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Status</Label>
              <Select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as PetStatus })}
                options={STATUS_OPTIONS}
              />
            </div>
            <div>
              <Label>Visibility</Label>
              <Select
                value={form.visibility}
                onChange={(e) => setForm({ ...form, visibility: e.target.value as PetVisibility })}
                options={VISIBILITY_OPTIONS}
              />
            </div>
          </div>
          <div>
            <Label>Photo URL</Label>
            <Input
              value={form.imageUrl}
              onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
              placeholder="https://…"
            />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div>
            <Label>Medical history (one per line)</Label>
            <Textarea
              value={form.medicalHistory}
              onChange={(e) => setForm({ ...form, medicalHistory: e.target.value })}
              placeholder={'Fully vaccinated\nDewormed'}
            />
          </div>
          <div>
            <Label>Behavioral notes</Label>
            <Textarea
              value={form.behavioralNotes}
              onChange={(e) => setForm({ ...form, behavioralNotes: e.target.value })}
              placeholder="e.g. Good with kids, house-trained…"
            />
          </div>
          <fieldset>
            <Label>Care flags</Label>
            <div className="mt-1.5 grid grid-cols-2 gap-2">
              {(
                [
                  ['vaccinated', 'Vaccinated'],
                  ['spayedNeutered', 'Spayed / Neutered'],
                  ['goodWithKids', 'Good with kids'],
                  ['goodWithPets', 'Good with pets'],
                ] as const
              ).map(([key, label]) => (
                <label
                  key={key}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={form[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.checked })}
                    className="size-4 accent-orange-600"
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>
        </form>
      </SlideOver>

      <DetailsModal
        open={detailsPet !== null}
        onClose={() => setDetailsPet(null)}
        title={detailsPet?.name ?? 'Pet details'}
        description={detailsPet ? `${detailsPet.breed} · ${formatAge(detailsPet.ageYears)}` : undefined}
        icon={PawPrint}
        footer={
          detailsPet ? (
            <div className="flex gap-2">
              <Button size="sm" className="flex-1" onClick={() => detailsPet && openEdit(detailsPet)}>
                <Pencil className="size-3.5" /> Edit in slider
              </Button>
              <Button size="sm" variant="outline" onClick={() => setDetailsPet(null)}>
                Close
              </Button>
            </div>
          ) : undefined
        }
      >
        {detailsPet && (
          <div className="space-y-4">
            <img
              src={detailsPet.imageUrl}
              alt={detailsPet.name}
              className="h-56 w-full rounded-lg border object-cover"
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
                <dt className="text-xs text-muted-foreground">Species</dt>
                <dd className="font-medium capitalize">{detailsPet.species}</dd>
              </div>
              <div className="rounded-lg border p-2.5">
                <dt className="text-xs text-muted-foreground">Gender · Size</dt>
                <dd className="font-medium capitalize">
                  {detailsPet.gender} · {detailsPet.size}
                </dd>
              </div>
              <div className="rounded-lg border p-2.5">
                <dt className="text-xs text-muted-foreground">Age group</dt>
                <dd className="font-medium capitalize">{detailsPet.ageGroup.replace('-', ' / ')}</dd>
              </div>
              <div className="rounded-lg border p-2.5">
                <dt className="text-xs text-muted-foreground">Shelter</dt>
                <dd className="font-medium">
                  {shelters.find((s) => s.id === detailsPet.shelterId)?.name ?? '—'}
                </dd>
              </div>
              <div className="rounded-lg border p-2.5">
                <dt className="text-xs text-muted-foreground">Added</dt>
                <dd className="font-medium">{formatDate(detailsPet.dateAdded)}</dd>
              </div>
              <div className="rounded-lg border p-2.5">
                <dt className="text-xs text-muted-foreground">Temperament</dt>
                <dd className="font-medium">{detailsPet.temperament.join(', ')}</dd>
              </div>
            </dl>
            <div>
              <h3 className="text-sm font-semibold">Care flags</h3>
              <div className="mt-1.5 grid grid-cols-2 gap-2 text-sm">
                {(
                  [
                    ['Vaccinated', detailsPet.vaccinated],
                    ['Spayed / Neutered', detailsPet.spayedNeutered],
                    ['Good with kids', detailsPet.goodWithKids],
                    ['Good with pets', detailsPet.goodWithPets],
                  ] as const
                ).map(([label, ok]) => (
                  <p key={label} className="flex items-center gap-1.5 text-muted-foreground">
                    {ok ? (
                      <Check className="size-4 shrink-0 text-green-600" />
                    ) : (
                      <X className="size-4 shrink-0" />
                    )}
                    {label}
                  </p>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold">Medical history</h3>
              <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-muted-foreground">
                {detailsPet.medicalHistory.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold">Behavioral notes</h3>
              <p className="mt-1 text-sm text-muted-foreground">{detailsPet.behavioralNotes}</p>
            </div>
          </div>
        )}
      </DetailsModal>
    </Container>
  );
};

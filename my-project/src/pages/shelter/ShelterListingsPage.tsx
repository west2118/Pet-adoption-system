import {
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  ImagePlus,
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
import { toast } from 'react-toastify';
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
import {
  ValidatedInput,
  focusFirstError,
  isBlank,
} from '@/components/shared';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
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

const CARE_FLAG_OPTIONS = [
  ['vaccinated', 'Vaccinated'],
  ['spayedNeutered', 'Spayed / Neutered'],
  ['microchipped', 'Microchipped'],
  ['dewormed', 'Dewormed'],
  ['goodWithKids', 'Good with kids'],
  ['goodWithPets', 'Good with pets'],
  ['goodWithStrangers', 'Good with strangers'],
  ['houseTrained', 'House-trained'],
  ['leashTrained', 'Leash-trained'],
  ['crateTrained', 'Crate-trained'],
  ['litterTrained', 'Litter-trained'],
  ['apartmentFriendly', 'Apartment-friendly'],
] as const;

// Medical records only (vet procedures / test results).
// Kept distinct from Care flags (status / behaviour) to avoid redundancy.
const MEDICAL_PRESETS = [
  'Rabies vaccine',
  'DHPP / FVRCP vaccine',
  'Bordetella vaccine',
  'Heartworm test – Negative',
  'Flea & tick prevention',
  'Dental check',
  'Vet health check',
  'Blood panel done',
];

export const ShelterListingsPage = () => {
  const { user } = useAuth();
  const { pets, setPets } = usePets();
  const { shelters } = useShelters();
  const [slideOpen, setSlideOpen] = useState(false);
  const [editingPet, setEditingPet] = useState<Pet | null>(null);
  const [detailsPet, setDetailsPet] = useState<Pet | null>(null);
  const [query, setQuery] = useState('');
  const [visibilityFilter, setVisibilityFilter] = useState<'all' | PetVisibility>('all');
  const [page, setPage] = useState(1);
  const [listingErrors, setListingErrors] = useState<{
    name?: string;
    breed?: string;
    shelterId?: string;
  }>({});
  const [form, setForm] = useState({
    name: '',
    species: 'dog',
    breed: '',
    ageYears: '1',
    ageGroup: 'adult' as AgeGroup,
    size: 'medium',
    gender: 'male',
    shelterId: '',
    status: 'Available' as PetStatus,
    visibility: 'public' as PetVisibility,
    description: '',
    temperament: '',
    photoUrls: '',
    medicalHistory: [''] as string[],
    behavioralNotes: '',
    vaccinated: true,
    spayedNeutered: false,
    goodWithKids: true,
    goodWithPets: true,
    microchipped: false,
    dewormed: false,
    houseTrained: false,
    goodWithStrangers: false,
    leashTrained: false,
    crateTrained: false,
    litterTrained: false,
    apartmentFriendly: false,
  });

  // Every shelter staff belongs to exactly one shelter. The table, the
  // create form, and all guards below use this id so a pet recorded by one
  // shelter never appears in another shelter's inventory.
  // Falls back to the first shelter only when the session carries no
  // assignment yet (demo preview without login).
  const myShelterId = user?.shelterId ?? shelters[0]?.id ?? null;
  const myShelter = shelters.find((s) => s.id === myShelterId) ?? null;
  const isLockedToShelter = Boolean(user?.shelterId);

  const filteredPets = useMemo(() => {
    const search = query.trim().toLowerCase();
    return pets.filter((pet) => {
      const matchesShelter = !myShelterId || pet.shelterId === myShelterId;
      const matchesVisibility =
        visibilityFilter === 'all' || pet.visibility === visibilityFilter;
      const matchesSearch =
        search === '' ||
        pet.name.toLowerCase().includes(search) ||
        pet.breed.toLowerCase().includes(search);
      return matchesShelter && matchesVisibility && matchesSearch;
    });
  }, [pets, visibilityFilter, query, myShelterId]);

  const totalPages = Math.max(1, Math.ceil(filteredPets.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const pagedPets = filteredPets.slice(startIndex, startIndex + PAGE_SIZE);

  const remove = async (id: string) => {
    const target = pets.find((p) => p.id === id);
    // Guard: never touch another shelter's listing.
    if (target && myShelterId && target.shelterId !== myShelterId) {
      toast.error('This listing belongs to another shelter.');
      return;
    }
    try {
      await petService.remove(id);
      setPets((prev) => prev.filter((p) => p.id !== id));
      toast.success(target ? `${target.name} removed.` : 'Listing removed.');
    } catch {
      toast.error('Failed to remove listing. Please try again.');
    }
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
      shelterId: '',
      status: 'Available',
      visibility: 'public',
      description: '',
      temperament: '',
      photoUrls: '',
      medicalHistory: [''],
      behavioralNotes: '',
      vaccinated: true,
      spayedNeutered: false,
      goodWithKids: true,
      goodWithPets: true,
      microchipped: false,
      dewormed: false,
      houseTrained: false,
      goodWithStrangers: false,
      leashTrained: false,
      crateTrained: false,
      litterTrained: false,
      apartmentFriendly: false,
    });

  const openAdd = () => {
    setEditingPet(null);
    resetForm();
    // New pets are always recorded under the staff's own shelter.
    if (myShelterId) setForm((prev) => ({ ...prev, shelterId: myShelterId }));
    setListingErrors({});
    setSlideOpen(true);
  };

  const openEdit = (pet: Pet) => {
    // Guard: staff can only edit their own shelter's listings.
    if (myShelterId && pet.shelterId !== myShelterId) {
      toast.error('This listing belongs to another shelter.');
      return;
    }
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
      shelterId: pet.shelterId,
      status: pet.status,
      visibility: pet.visibility,
      description: pet.description,
      temperament: pet.temperament.join(', '),
      photoUrls: (pet.gallery.length > 0 ? pet.gallery : [pet.imageUrl]).join('\n'),
      medicalHistory:
        pet.medicalHistory.length > 0 ? [...pet.medicalHistory] : [''],
      behavioralNotes: pet.behavioralNotes,
      vaccinated: pet.vaccinated,
      spayedNeutered: pet.spayedNeutered,
      goodWithKids: pet.goodWithKids,
      goodWithPets: pet.goodWithPets,
      microchipped: pet.microchipped ?? false,
      dewormed: pet.dewormed ?? false,
      houseTrained: pet.houseTrained ?? false,
      goodWithStrangers: pet.goodWithStrangers ?? false,
      leashTrained: pet.leashTrained ?? false,
      crateTrained: pet.crateTrained ?? false,
      litterTrained: pet.litterTrained ?? false,
      apartmentFriendly: pet.apartmentFriendly ?? false,
    });
    setSlideOpen(true);
  };

  const closeSlide = () => {
    setSlideOpen(false);
    setEditingPet(null);
  };

  // Photos: preview list derived from the textarea (links or uploaded base64).
  const photoList = useMemo(
    () =>
      form.photoUrls
        .split('\n')
        .map((u) => u.trim())
        .filter(Boolean),
    [form.photoUrls],
  );

  // Uploadable photos — files are read as base64 data URLs and appended to
  // the photo list. Storage upload (Supabase) can replace this later.
  const handlePhotoFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const images = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (images.length === 0) return;
    const readers = images.map(
      (file) =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = () => reject(new Error(`Could not read ${file.name}`));
          reader.readAsDataURL(file);
        }),
    );
    Promise.all(readers)
      .then((dataUrls) => {
        setForm((prev) => ({
          ...prev,
          photoUrls: [prev.photoUrls.trim(), ...dataUrls].filter(Boolean).join('\n'),
        }));
      })
      .catch(() => {
        // Keep existing photos if a file fails to read.
      });
  };

  const removePhoto = (index: number) => {
    setForm((prev) => ({
      ...prev,
      photoUrls: prev.photoUrls
        .split('\n')
        .map((u) => u.trim())
        .filter(Boolean)
        .filter((_, i) => i !== index)
        .join('\n'),
    }));
  };

  // Medical history: per-line inputs (not one textarea).
  const updateMedicalRow = (index: number, value: string) => {
    setForm((prev) => ({
      ...prev,
      medicalHistory: prev.medicalHistory.map((m, i) => (i === index ? value : m)),
    }));
  };

  const addMedicalRow = () => {
    setForm((prev) => ({ ...prev, medicalHistory: [...prev.medicalHistory, ''] }));
  };

  const removeMedicalRow = (index: number) => {
    setForm((prev) => ({
      ...prev,
      medicalHistory:
        prev.medicalHistory.length <= 1
          ? ['']
          : prev.medicalHistory.filter((_, i) => i !== index),
    }));
  };

  const addMedicalPreset = (preset: string) => {
    setForm((prev) => {
      const trimmed = prev.medicalHistory.map((m) => m.trim()).filter(Boolean);
      if (trimmed.includes(preset)) return prev;
      // Fill the first empty row if there is one, otherwise append.
      const emptyIndex = prev.medicalHistory.findIndex((m) => m.trim() === '');
      if (emptyIndex >= 0) {
        return {
          ...prev,
          medicalHistory: prev.medicalHistory.map((m, i) =>
            i === emptyIndex ? preset : m,
          ),
        };
      }
      return { ...prev, medicalHistory: [...prev.medicalHistory, preset] };
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const listingErrors: { name?: string; breed?: string; shelterId?: string } = {};
    if (isBlank(form.name)) listingErrors.name = 'Please enter the pet name.';
    if (isBlank(form.breed)) listingErrors.breed = 'Please enter the breed.';
    // Staff locked to a shelter never need the dropdown; everyone else falls
    // back to the first shelter, so only flag a missing shelter when there is
    // no shelter context at all.
    if (!isLockedToShelter && !editingPet && isBlank(form.shelterId) && !myShelterId)
      listingErrors.shelterId = 'Please select a shelter.';
    setListingErrors(listingErrors);
    if (Object.keys(listingErrors).length > 0) {
      toast.warning('Please fix the highlighted fields.');
      focusFirstError();
      return;
    }
    const temperament = form.temperament
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    const medicalHistory = form.medicalHistory
      .map((m) => m.trim())
      .filter(Boolean);
    // Gallery: one photo URL per line; the first photo is the cover adopters see first.
    const photoUrls = form.photoUrls
      .split('\n')
      .map((u) => u.trim())
      .filter(Boolean);
    const FALLBACK_PHOTO =
      'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=800&q=80';
    const gallery = photoUrls.length > 0 ? photoUrls : [FALLBACK_PHOTO];
    const rawAge = Number(form.ageYears);
    const ageYears = Number.isNaN(rawAge) ? 1 : Math.max(0, rawAge);
    // Locked staff always record under their own shelter — the dropdown
    // value is ignored. Unlocked preview keeps the chosen / first shelter.
    const shelterId = isLockedToShelter
      ? (myShelterId ?? form.shelterId ?? editingPet?.shelterId ?? 's1')
      : (form.shelterId || myShelterId || editingPet?.shelterId || 's1');
    if (editingPet) {
      const updated = await petService.update(editingPet.id, {
        name: form.name,
        species: form.species as 'dog' | 'cat' | 'rabbit' | 'bird' | 'other',
        breed: form.breed || 'Mixed',
        ageYears,
        ageGroup: form.ageGroup,
        size: form.size as 'small' | 'medium' | 'large',
        gender: form.gender as 'male' | 'female',
        shelterId,
        status: form.status,
        visibility: form.visibility,
        description: form.description || editingPet.description,
        temperament: temperament.length > 0 ? temperament : editingPet.temperament,
        imageUrl: gallery[0],
        gallery,
        medicalHistory: medicalHistory.length > 0 ? medicalHistory : editingPet.medicalHistory,
        behavioralNotes: form.behavioralNotes || editingPet.behavioralNotes,
        vaccinated: form.vaccinated,
        spayedNeutered: form.spayedNeutered,
        goodWithKids: form.goodWithKids,
        goodWithPets: form.goodWithPets,
        microchipped: form.microchipped,
        dewormed: form.dewormed,
        houseTrained: form.houseTrained,
        goodWithStrangers: form.goodWithStrangers,
        leashTrained: form.leashTrained,
        crateTrained: form.crateTrained,
        litterTrained: form.litterTrained,
        apartmentFriendly: form.apartmentFriendly,
      });
      if (updated) setPets((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      toast.success(`${form.name || 'Pet'} updated successfully!`);
      closeSlide();
      return;
    }
    const created = await petService.create({
      name: form.name,
      species: form.species as 'dog' | 'cat' | 'rabbit' | 'bird' | 'other',
      breed: form.breed || 'Mixed',
      ageYears,
      ageGroup: form.ageGroup,
      size: form.size as 'small' | 'medium' | 'large',
      gender: form.gender as 'male' | 'female',
      temperament: temperament.length > 0 ? temperament : ['Friendly'],
      shelterId,
      visibility: form.visibility,
      description: form.description || 'New rescue looking for a home.',
      medicalHistory: medicalHistory.length > 0 ? medicalHistory : ['Vet health check'],
      behavioralNotes: form.behavioralNotes || 'Assessment in progress.',
      status: form.status,
      imageUrl: gallery[0],
      gallery,
      vaccinated: form.vaccinated,
      spayedNeutered: form.spayedNeutered,
      goodWithKids: form.goodWithKids,
      goodWithPets: form.goodWithPets,
      microchipped: form.microchipped,
      dewormed: form.dewormed,
      houseTrained: form.houseTrained,
      goodWithStrangers: form.goodWithStrangers,
      leashTrained: form.leashTrained,
      crateTrained: form.crateTrained,
      litterTrained: form.litterTrained,
      apartmentFriendly: form.apartmentFriendly,
    });
    setPets((prev) => [created, ...prev]);
    toast.success(`${created.name} listed successfully!`);
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
          isEmpty={filteredPets.length === 0}
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
        <form id="pet-form" onSubmit={handleSubmit} noValidate className="grid gap-3">
          <div>
            <Label htmlFor="pet-name">Name</Label>
            <ValidatedInput
              id="pet-name"
              value={form.name}
              onChange={(e) => {
                setForm({ ...form, name: e.target.value });
                setListingErrors((p) => ({ ...p, name: undefined }));
              }}
              placeholder="e.g. Buddy"
              error={listingErrors.name}
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
              <Label htmlFor="pet-breed">Breed</Label>
              <ValidatedInput
                id="pet-breed"
                value={form.breed}
                onChange={(e) => {
                  setForm({ ...form, breed: e.target.value });
                  setListingErrors((p) => ({ ...p, breed: undefined }));
                }}
                placeholder="e.g. Aspin"
                error={listingErrors.breed}
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
          <div>
            <Label htmlFor="pet-shelter">Shelter</Label>
            {isLockedToShelter ? (
              <p
                id="pet-shelter"
                className="flex h-9 items-center rounded-lg border border-input bg-muted px-3 py-2 text-sm text-muted-foreground"
              >
                {myShelter?.name ?? 'Your shelter'} — new pets are recorded here
              </p>
            ) : (
              <>
                <Select
                  id="pet-shelter"
                  value={form.shelterId}
                  onChange={(e) => {
                    setForm({ ...form, shelterId: e.target.value });
                    setListingErrors((p) => ({ ...p, shelterId: undefined }));
                  }}
                  options={[
                    { value: '', label: 'Select shelter…' },
                    ...shelters.map((s) => ({ value: s.id, label: s.name })),
                  ]}
                  aria-invalid={Boolean(listingErrors.shelterId)}
                  className={listingErrors.shelterId ? 'border-destructive focus-visible:border-destructive focus-visible:ring-destructive/40' : undefined}
                />
                {listingErrors.shelterId && (
                  <p role="alert" className="mt-1 text-[13px] text-destructive">
                    {listingErrors.shelterId}
                  </p>
                )}
              </>
            )}
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
            <Label>Photos (first photo is the cover)</Label>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted">
                <ImagePlus className="size-4" /> Upload photos
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  aria-label="Upload pet photos"
                  onChange={(e) => {
                    handlePhotoFiles(e.target.files);
                    e.target.value = '';
                  }}
                />
              </label>
            </div>
            {photoList.length > 0 && (
              <div className="mt-2 grid grid-cols-4 gap-2">
                {photoList.map((src, i) => (
                  <div
                    key={`${i}-${src.slice(0, 32)}`}
                    className="relative overflow-hidden rounded-lg border"
                  >
                    <img
                      src={src}
                      alt={`Pet photo ${i + 1}`}
                      className="h-20 w-full object-cover"
                    />
                    {i === 0 && (
                      <span className="absolute left-1 top-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                        Cover
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => removePhoto(i)}
                      aria-label={`Remove photo ${i + 1}`}
                      className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-md bg-black/60 text-white transition-colors hover:bg-black/80"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <p className="mt-2 text-xs text-muted-foreground">
              {photoList.length === 0
                ? 'No photos yet — upload images to add them.'
                : `${photoList.length} photo${photoList.length > 1 ? 's' : ''} added.`}
            </p>
          </div>
          <div>
            <Label>Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="e.g. A cheerful dog who loves fetch, swimming, and cuddles…"
              required
            />
          </div>
          <div>
            <Label>Medical history (one per line)</Label>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {MEDICAL_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => addMedicalPreset(preset)}
                  className="rounded-full border px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  + {preset}
                </button>
              ))}
            </div>
            <div className="mt-2 space-y-2">
              {form.medicalHistory.map((row, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    value={row}
                    onChange={(e) => updateMedicalRow(i, e.target.value)}
                    placeholder={`Record ${i + 1} — e.g. Rabies vaccine`}
                    aria-label={`Medical record ${i + 1}`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Remove medical record ${i + 1}`}
                    onClick={() => removeMedicalRow(i)}
                    className="shrink-0 text-muted-foreground hover:text-red-600"
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addMedicalRow}
              className="mt-2"
            >
              <Plus className="size-3.5" /> Add record
            </Button>
          </div>
          <div>
            <Label>Behavioral notes</Label>
            <Textarea
              value={form.behavioralNotes}
              onChange={(e) => setForm({ ...form, behavioralNotes: e.target.value })}
              placeholder="e.g. Good with kids, house-trained…"
              required
            />
          </div>
          <fieldset>
            <Label>Care flags</Label>
            <div className="mt-1.5 grid grid-cols-2 gap-2">
              {CARE_FLAG_OPTIONS.map(([key, label]) => (
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
            <div>
              <img
                src={detailsPet.imageUrl}
                alt={detailsPet.name}
                className="h-56 w-full rounded-lg border object-cover"
              />
              {detailsPet.gallery.length > 1 && (
                <div className="mt-2 grid grid-cols-4 gap-2">
                  {detailsPet.gallery.map((src, i) => (
                    <img
                      key={`${src}-${i}`}
                      src={src}
                      alt={`${detailsPet.name} photo ${i + 1}`}
                      className="h-16 w-full rounded-lg border object-cover"
                    />
                  ))}
                </div>
              )}
            </div>
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
                    ['Microchipped', detailsPet.microchipped ?? false],
                    ['Dewormed', detailsPet.dewormed ?? false],
                    ['House-trained', detailsPet.houseTrained ?? false],
                    ['Good with strangers', detailsPet.goodWithStrangers ?? false],
                    ['Leash-trained', detailsPet.leashTrained ?? false],
                    ['Crate-trained', detailsPet.crateTrained ?? false],
                    ['Litter-trained', detailsPet.litterTrained ?? false],
                    ['Apartment-friendly', detailsPet.apartmentFriendly ?? false],
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
    </div>
  );
};

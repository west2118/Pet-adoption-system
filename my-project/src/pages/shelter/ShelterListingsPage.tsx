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
import type { FormEvent, ReactNode } from 'react';
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

const TEMPERAMENT_PRESETS = [
  'Friendly',
  'Playful',
  'Calm',
  'Affectionate',
  'Energetic',
  'Loyal',
  'Gentle',
  'Curious',
];

const BEHAVIOR_PRESETS = [
  'House-trained',
  'Good with kids',
  'Leash-trained',
  'Litter-trained',
  'Knows sit and stay',
  'Needs experienced owner',
  'Prefers a quiet home',
  'Needs daily exercise',
];

/**
 * Reusable per-line list editor — the same pattern for temperament traits,
 * medical records, and behavioral notes: quick-add preset chips, one input
 * per line with a remove button, and an add button. No plain textareas.
 */
interface ListEditorProps {
  label: ReactNode;
  rows: string[];
  onChange: (rows: string[]) => void;
  presets: string[];
  placeholder: (index: number) => string;
  itemLabel: string;
  addLabel: string;
  error?: string;
}

const ListEditor = ({
  label,
  rows,
  onChange,
  presets,
  placeholder,
  itemLabel,
  addLabel,
  error,
}: ListEditorProps) => {
  const updateRow = (index: number, value: string) =>
    onChange(rows.map((r, i) => (i === index ? value : r)));
  const addRow = () => onChange([...rows, '']);
  const removeRow = (index: number) =>
    onChange(rows.length <= 1 ? [''] : rows.filter((_, i) => i !== index));
  const addPreset = (preset: string) => {
    const trimmed = rows.map((r) => r.trim()).filter(Boolean);
    if (trimmed.includes(preset)) return;
    // Fill the first empty row if there is one, otherwise append.
    const emptyIndex = rows.findIndex((r) => r.trim() === '');
    if (emptyIndex >= 0) {
      onChange(rows.map((r, i) => (i === emptyIndex ? preset : r)));
    } else {
      onChange([...rows, preset]);
    }
  };

  return (
    <div>
      <Label>{label}</Label>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {presets.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => addPreset(preset)}
            className="rounded-full border px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            + {preset}
          </button>
        ))}
      </div>
      <div className="mt-2 space-y-2">
        {rows.map((row, i) => (
          <div key={i} className="flex items-center gap-2">
            <Input
              value={row}
              onChange={(e) => updateRow(i, e.target.value)}
              placeholder={placeholder(i)}
              aria-label={`${itemLabel} ${i + 1}`}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`Remove ${itemLabel.toLowerCase()} ${i + 1}`}
              onClick={() => removeRow(i)}
              className="shrink-0 text-muted-foreground hover:text-red-600"
            >
              <X className="size-4" />
            </Button>
          </div>
        ))}
      </div>
      <Button type="button" variant="outline" size="sm" onClick={addRow} className="mt-2">
        <Plus className="size-3.5" /> {addLabel}
      </Button>
      {error && (
        <p role="alert" className="mt-1 text-[13px] text-destructive">
          {error}
        </p>
      )}
    </div>
  );
};

/** Red asterisk marking a required field, used inside every form label. */
const RequiredMark = () => (
  <span aria-hidden="true" className="text-destructive">
    {' *'}
  </span>
);

// Age is derived from the pet's birthdate — staff pick a calendar date and
// both the age and the age group are calculated automatically.
const AGE_GROUP_INFO: { value: AgeGroup; label: string; hint: string }[] = [
  { value: 'puppy-kitten', label: '🐾 Puppy / Kitten', hint: 'under 1 year' },
  { value: 'young', label: '🐾 Young', hint: '1–3 years' },
  { value: 'adult', label: '🐾 Adult', hint: '3–7 years' },
  { value: 'senior', label: '🐾 Senior', hint: '7+ years' },
];

const ageGroupForYears = (years: number): AgeGroup => {
  if (years < 1) return 'puppy-kitten';
  if (years < 3) return 'young';
  if (years < 7) return 'adult';
  return 'senior';
};

/** Decimal age in years (1 decimal) from a YYYY-MM-DD birthdate, or null. */
const ageYearsFromBirthdate = (iso: string): number | null => {
  if (!iso) return null;
  const birth = new Date(`${iso}T00:00:00`);
  const now = new Date();
  if (Number.isNaN(birth.getTime()) || birth > now) return null;
  const years = (now.getTime() - birth.getTime()) / (365.25 * 24 * 3600 * 1000);
  return Math.max(0, Math.round(years * 10) / 10);
};

/**
 * Exact calendar age from the birthday to the present —
 * full years + remaining months + remaining days (day-aware).
 * Days count inclusively from the birth day (Oct 1 → Oct 9 = 9 days old).
 */
const agePartsFromBirthdate = (
  iso: string,
): { years: number; months: number; days: number } | null => {
  if (!iso) return null;
  const birth = new Date(`${iso}T00:00:00`);
  const now = new Date();
  if (Number.isNaN(birth.getTime()) || birth > now) return null;
  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  let days = now.getDate() - birth.getDate() + 1;
  if (days <= 0) {
    months -= 1;
    // Days in the month before the current one.
    days += new Date(now.getFullYear(), now.getMonth(), 0).getDate();
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  return { years: Math.max(0, years), months: Math.max(0, months), days: Math.max(1, days) };
};

/** e.g. "9 days old" or "2 years, 3 months old" — birthday up to today. */
const formatExactAge = (parts: { years: number; months: number; days: number }): string => {
  const y = parts.years === 1 ? '1 year' : `${parts.years} years`;
  const m = parts.months === 1 ? '1 month' : `${parts.months} months`;
  const d = parts.days === 1 ? '1 day' : `${parts.days} days`;
  if (parts.years === 0 && parts.months === 0) return `${d} old`;
  if (parts.years === 0) return `${m}, ${d} old`;
  return `${y}, ${m} old`;
};

const toIsoDate = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Approximate birthdate prefill when editing a pet that only stores an age. */
const birthdateFromAgeYears = (ageYears: number): string => {
  const now = new Date();
  if (ageYears < 1) {
    const d = new Date(now);
    d.setMonth(d.getMonth() - 6);
    return toIsoDate(d);
  }
  const d = new Date(now);
  d.setFullYear(d.getFullYear() - Math.round(ageYears));
  return toIsoDate(d);
};

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
    birthdate?: string;
    shelterId?: string;
    description?: string;
    temperament?: string;
    photos?: string;
    medicalHistory?: string;
    behavioralNotes?: string;
  }>({});
  const [form, setForm] = useState({
    name: '',
    species: 'dog',
    breed: '',
    birthdate: '',
    size: 'medium',
    gender: 'male',
    shelterId: '',
    status: 'Available' as PetStatus,
    visibility: 'public' as PetVisibility,
    description: '',
    temperament: [''] as string[],
    photoUrls: '',
    medicalHistory: [''] as string[],
    behavioralNotes: [''] as string[],
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
      birthdate: '',
      size: 'medium',
      gender: 'male',
      shelterId: '',
      status: 'Available',
      visibility: 'public',
      description: '',
      temperament: [''],
      photoUrls: '',
      medicalHistory: [''],
      behavioralNotes: [''],
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
      birthdate: birthdateFromAgeYears(pet.ageYears),
      size: pet.size,
      gender: pet.gender,
      shelterId: pet.shelterId,
      status: pet.status,
      visibility: pet.visibility,
      description: pet.description,
      temperament: pet.temperament.length > 0 ? [...pet.temperament] : [''],
      photoUrls: (pet.gallery.length > 0 ? pet.gallery : [pet.imageUrl]).join('\n'),
      medicalHistory:
        pet.medicalHistory.length > 0 ? [...pet.medicalHistory] : [''],
      behavioralNotes: pet.behavioralNotes ? [pet.behavioralNotes] : [''],
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

  // Age + age group are calculated automatically from the birthdate calendar.
  const derivedAgeYears = useMemo(
    () => ageYearsFromBirthdate(form.birthdate),
    [form.birthdate],
  );
  // Exact birthday → present readout (years + months).
  const derivedAgeParts = useMemo(
    () => agePartsFromBirthdate(form.birthdate),
    [form.birthdate],
  );
  const derivedAgeGroup: AgeGroup | null =
    derivedAgeYears == null ? null : ageGroupForYears(derivedAgeYears);
  const derivedAgeInfo = derivedAgeGroup
    ? AGE_GROUP_INFO.find((g) => g.value === derivedAgeGroup)
    : undefined;
  const todayIso = useMemo(() => toIsoDate(new Date()), []);

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

  // Per-line list editors (temperament, medical history, behavioral notes)
  // share the ListEditor component — these clear the section error on edit.
  const setListRows = (
    key: 'temperament' | 'medicalHistory' | 'behavioralNotes',
    rows: string[],
  ) => {
    setForm((prev) => ({ ...prev, [key]: rows }));
    setListingErrors((p) => ({ ...p, [key]: undefined }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    // Every field in the pet profile form is required.
    const listingErrors: {
      name?: string;
      breed?: string;
      birthdate?: string;
      shelterId?: string;
      description?: string;
      temperament?: string;
      photos?: string;
      medicalHistory?: string;
      behavioralNotes?: string;
    } = {};
    if (isBlank(form.name)) listingErrors.name = 'Please enter the pet name.';
    if (isBlank(form.breed)) listingErrors.breed = 'Please enter the breed.';
    if (isBlank(form.birthdate)) {
      listingErrors.birthdate = 'Please select the birthdate.';
    } else if (derivedAgeYears == null) {
      listingErrors.birthdate = 'Please select a valid birthdate (not in the future).';
    } else if (derivedAgeYears > 30) {
      listingErrors.birthdate = 'Please check the birthdate — over 30 years old.';
    }
    if (isBlank(form.description))
      listingErrors.description = 'Please enter a description.';
    else if (form.description.trim().length < 10)
      listingErrors.description = 'Description must be at least 10 characters.';
    if (form.temperament.every((t) => isBlank(t)))
      listingErrors.temperament = 'Please add at least one temperament trait.';
    if (photoList.length === 0)
      listingErrors.photos = 'Please add at least one photo.';
    if (form.medicalHistory.every((m) => isBlank(m)))
      listingErrors.medicalHistory = 'Please add at least one medical record.';
    if (form.behavioralNotes.every((b) => isBlank(b)))
      listingErrors.behavioralNotes = 'Please add at least one behavioral note.';
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
      .map((t) => t.trim())
      .filter(Boolean);
    const medicalHistory = form.medicalHistory
      .map((m) => m.trim())
      .filter(Boolean);
    const behavioralNotes = form.behavioralNotes
      .map((b) => b.trim().replace(/\.+$/, ''))
      .filter(Boolean)
      .join('. ');
    // Gallery: one photo URL per line; the first photo is the cover adopters see first.
    const photoUrls = form.photoUrls
      .split('\n')
      .map((u) => u.trim())
      .filter(Boolean);
    const FALLBACK_PHOTO =
      'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=800&q=80';
    const gallery = photoUrls.length > 0 ? photoUrls : [FALLBACK_PHOTO];
    // Age + group come from the birthdate calendar — validated above.
    const ageYears = derivedAgeYears ?? 0;
    const ageGroup: AgeGroup = derivedAgeGroup ?? 'adult';
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
        ageGroup,
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
        behavioralNotes: behavioralNotes || editingPet.behavioralNotes,
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
      ageGroup,
      size: form.size as 'small' | 'medium' | 'large',
      gender: form.gender as 'male' | 'female',
      temperament: temperament.length > 0 ? temperament : ['Friendly'],
      shelterId,
      visibility: form.visibility,
      description: form.description || 'New rescue looking for a home.',
      medicalHistory: medicalHistory.length > 0 ? medicalHistory : ['Vet health check'],
      behavioralNotes: behavioralNotes || 'Assessment in progress.',
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
          <p className="text-xs text-muted-foreground">
            All fields are required (<span className="font-semibold text-destructive">*</span>).
            Age and age group are calculated automatically from the birthdate.
          </p>
          <div>
            <Label htmlFor="pet-name">
              Name
              <RequiredMark />
            </Label>
            <ValidatedInput
              id="pet-name"
              value={form.name}
              onChange={(e) => {
                setForm({ ...form, name: e.target.value });
                setListingErrors((p) => ({ ...p, name: undefined }));
              }}
              placeholder="e.g. Buddy"
              required
              error={listingErrors.name}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>
                Species
                <RequiredMark />
              </Label>
              <Select
                value={form.species}
                onChange={(e) => setForm({ ...form, species: e.target.value })}
                required
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
              <Label htmlFor="pet-birthdate">
                Birthdate
                <RequiredMark />
              </Label>
              <Input
                id="pet-birthdate"
                type="date"
                max={todayIso}
                value={form.birthdate}
                onChange={(e) => {
                  setForm({ ...form, birthdate: e.target.value });
                  setListingErrors((p) => ({ ...p, birthdate: undefined }));
                }}
                required
                aria-invalid={Boolean(listingErrors.birthdate)}
                className={listingErrors.birthdate ? 'border-destructive focus-visible:border-destructive focus-visible:ring-destructive/40' : undefined}
              />
              {listingErrors.birthdate && (
                <p role="alert" className="mt-1 text-[13px] text-destructive">
                  {listingErrors.birthdate}
                </p>
              )}
              {form.birthdate && derivedAgeYears != null && derivedAgeInfo && derivedAgeParts && (
                <p className="mt-1 text-xs text-muted-foreground" aria-live="polite">
                  Calculated age:{' '}
                  <span className="font-semibold text-foreground">
                    {formatExactAge(derivedAgeParts)}
                  </span>{' '}
                  · {derivedAgeInfo.label}
                </p>
              )}
            </div>
          </div>
          {/* Age + age group are automatic — staff pick the birthdate above. */}
          <div
            aria-live="polite"
            className="rounded-lg border border-input bg-muted/60 px-3 py-2.5 text-sm"
          >
            {derivedAgeYears == null || !derivedAgeInfo || !derivedAgeParts ? (
              <p className="text-muted-foreground">
                Select a birthdate to calculate the age automatically.
              </p>
            ) : (
              <p>
                <span className="font-semibold">{formatExactAge(derivedAgeParts)}</span>
                {' · '}
                <span>
                  {derivedAgeInfo.label} — {derivedAgeInfo.hint}
                </span>
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="pet-breed">
                Breed
                <RequiredMark />
              </Label>
              <ValidatedInput
                id="pet-breed"
                value={form.breed}
                onChange={(e) => {
                  setForm({ ...form, breed: e.target.value });
                  setListingErrors((p) => ({ ...p, breed: undefined }));
                }}
                placeholder="e.g. Aspin"
                required
                error={listingErrors.breed}
              />
            </div>
            <div>
              <Label>
                Size
                <RequiredMark />
              </Label>
              <Select
                value={form.size}
                onChange={(e) => setForm({ ...form, size: e.target.value })}
                required
                options={[
                  { value: 'small', label: 'Small' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'large', label: 'Large' },
                ]}
              />
            </div>
          </div>
          <ListEditor
            label={
              <>
                Temperament
                <RequiredMark />
              </>
            }
            rows={form.temperament}
            onChange={(rows) => setListRows('temperament', rows)}
            presets={TEMPERAMENT_PRESETS}
            placeholder={(i) => `Trait ${i + 1} — e.g. Friendly`}
            itemLabel="Temperament trait"
            addLabel="Add trait"
            error={listingErrors.temperament}
          />
          {/* Shelter is automatic — new pets are always recorded under the
              logged-in staff's own shelter (see handleSubmit), so no shelter
              field is shown here. */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>
                Gender
                <RequiredMark />
              </Label>
              <Select
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
                required
                options={[
                  { value: 'male', label: 'Male' },
                  { value: 'female', label: 'Female' },
                ]}
              />
            </div>
            <div>
              <Label>
                Status
                <RequiredMark />
              </Label>
              <Select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as PetStatus })}
                required
                options={STATUS_OPTIONS}
              />
            </div>
          </div>
          <div>
            <Label>
              Visibility
              <RequiredMark />
            </Label>
            <Select
              value={form.visibility}
              onChange={(e) => setForm({ ...form, visibility: e.target.value as PetVisibility })}
              required
              options={VISIBILITY_OPTIONS}
            />
          </div>
          <div>
            <Label>
              Photos (first photo is the cover)
              <RequiredMark />
            </Label>
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
                    setListingErrors((p) => ({ ...p, photos: undefined }));
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
            {listingErrors.photos && (
              <p role="alert" className="mt-1 text-[13px] text-destructive">
                {listingErrors.photos}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="pet-description">
              Description
              <RequiredMark />
            </Label>
            <Textarea
              id="pet-description"
              value={form.description}
              onChange={(e) => {
                setForm({ ...form, description: e.target.value });
                setListingErrors((p) => ({ ...p, description: undefined }));
              }}
              placeholder="e.g. A cheerful dog who loves fetch, swimming, and cuddles… (min. 10 characters)"
              required
              minLength={10}
              aria-invalid={Boolean(listingErrors.description)}
              className={listingErrors.description ? 'border-destructive focus-visible:border-destructive focus-visible:ring-destructive/40' : undefined}
            />
            {listingErrors.description && (
              <p role="alert" className="mt-1 text-[13px] text-destructive">
                {listingErrors.description}
              </p>
            )}
          </div>
          <ListEditor
            label={
              <>
                Medical history
                <RequiredMark />
              </>
            }
            rows={form.medicalHistory}
            onChange={(rows) => setListRows('medicalHistory', rows)}
            presets={MEDICAL_PRESETS}
            placeholder={(i) => `Record ${i + 1} — e.g. Rabies vaccine`}
            itemLabel="Medical record"
            addLabel="Add record"
            error={listingErrors.medicalHistory}
          />
          <ListEditor
            label={
              <>
                Behavioral notes
                <RequiredMark />
              </>
            }
            rows={form.behavioralNotes}
            onChange={(rows) => setListRows('behavioralNotes', rows)}
            presets={BEHAVIOR_PRESETS}
            placeholder={(i) => `Note ${i + 1} — e.g. House-trained`}
            itemLabel="Behavioral note"
            addLabel="Add note"
            error={listingErrors.behavioralNotes}
          />
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

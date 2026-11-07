import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { ImagePlus, ListPlus, Pencil, X } from 'lucide-react';
import { toast } from 'react-toastify';

import { SlideOver, ValidatedInput, focusFirstError } from '@/components/shared';
import { Input, Label, Select, Textarea } from '@/components/ui/Form';
import { Button } from '@/components/ui/button';
import { ListEditor } from '@/components/features/ListEditor';

import { petListingFormSchema, toFieldErrors } from '@/lib/validators';
import type { FieldErrors } from '@/lib/validators';
import type { AgeGroup, Gender, Pet, PetSize, PetStatus, PetVisibility, Species } from '@/types';

import {
  AGE_GROUP_INFO,
  BEHAVIOR_PRESETS,
  CARE_FLAG_OPTIONS,
  FALLBACK_PET_PHOTO,
  GENDER_OPTIONS,
  MEDICAL_PRESETS,
  SIZE_OPTIONS,
  SPECIES_OPTIONS,
  STATUS_OPTIONS,
  TEMPERAMENT_PRESETS,
  VISIBILITY_OPTIONS,
} from '@/data/petListingPresets';

import {
  ageGroupForYears,
  agePartsFromBirthdate,
  ageYearsFromBirthdate,
  birthdateFromAgeYears,
  formatExactAge,
  toIsoDate,
} from '@/helpers';

const RequiredMark = () => (
  <span aria-hidden="true" className="text-destructive">
    {' *'}
  </span>
);

export interface PetFormState {
  name: string;
  species: Species;
  breed: string;
  birthdate: string;
  size: PetSize;
  gender: Gender;
  shelterId: string;
  status: PetStatus;
  visibility: PetVisibility;
  description: string;
  temperament: string[];
  photoUrls: string;
  medicalHistory: string[];
  behavioralNotes: string[];
  vaccinated: boolean;
  spayedNeutered: boolean;
  goodWithKids: boolean;
  goodWithPets: boolean;
  microchipped: boolean;
  dewormed: boolean;
  houseTrained: boolean;
  goodWithStrangers: boolean;
  leashTrained: boolean;
  crateTrained: boolean;
  litterTrained: boolean;
  apartmentFriendly: boolean;
}

export interface PetFormModalProps {
  isOpen: boolean;
  editingPet: Pet | null;
  myShelterId: string | null;
  isLockedToShelter: boolean;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (data: {
    petId?: string;
    payload: {
      name: string;
      species: Species;
      breed: string;
      birthdate: string;
      ageYears: number;
      ageGroup: AgeGroup;
      size: PetSize;
      gender: Gender;
      shelterId: string;
      status: PetStatus;
      visibility: PetVisibility;
      description: string;
      temperament: string[];
      imageUrl: string;
      gallery: string[];
      medicalHistory: string[];
      behavioralNotes: string;
      vaccinated: boolean;
      spayedNeutered: boolean;
      goodWithKids: boolean;
      goodWithPets: boolean;
      microchipped: boolean;
      dewormed: boolean;
      houseTrained: boolean;
      goodWithStrangers: boolean;
      leashTrained: boolean;
      crateTrained: boolean;
      litterTrained: boolean;
      apartmentFriendly: boolean;
    };
  }) => void;
}

export const PetFormModal = ({
  isOpen,
  editingPet,
  myShelterId,
  isLockedToShelter,
  isSaving,
  onClose,
  onSubmit,
}: PetFormModalProps) => {
  const [listingErrors, setListingErrors] = useState<FieldErrors<string>>({});
  const getInitialForm = (pet: Pet | null, fallbackShelter: string | null): PetFormState => {
    if (pet) {
      return {
        name: pet.name,
        species: pet.species,
        breed: pet.breed,
        birthdate: pet.birthdate || birthdateFromAgeYears(pet.ageYears),
        size: pet.size,
        gender: pet.gender,
        shelterId: pet.shelterId,
        status: pet.status,
        visibility: pet.visibility,
        description: pet.description,
        temperament: pet.temperament.length > 0 ? [...pet.temperament] : [''],
        photoUrls: (pet.gallery.length > 0 ? pet.gallery : [pet.imageUrl]).join('\n'),
        medicalHistory: pet.medicalHistory.length > 0 ? [...pet.medicalHistory] : [''],
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
      };
    }
    return {
      name: '',
      species: 'dog',
      breed: '',
      birthdate: '',
      size: 'medium',
      gender: 'male',
      shelterId: fallbackShelter ?? '',
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
    };
  };

  const [form, setForm] = useState<PetFormState>(() => getInitialForm(editingPet, myShelterId));
  const [prevEditingPetId, setPrevEditingPetId] = useState(editingPet?.id ?? null);
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);

  // Sync state cleanly when open/target changes without triggering cascading renders in useEffect
  if (isOpen !== prevIsOpen || (editingPet?.id ?? null) !== prevEditingPetId) {
    setPrevIsOpen(isOpen);
    setPrevEditingPetId(editingPet?.id ?? null);
    setForm(getInitialForm(editingPet, myShelterId));
    setListingErrors({});
  }

  const photoList = useMemo(
    () =>
      form.photoUrls
        .split('\n')
        .map((u) => u.trim())
        .filter(Boolean),
    [form.photoUrls],
  );

  const derivedAgeYears = useMemo(
    () => ageYearsFromBirthdate(form.birthdate),
    [form.birthdate],
  );
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
      .catch(() => {});
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

  const setListRows = (
    key: 'temperament' | 'medicalHistory' | 'behavioralNotes',
    rows: string[],
  ) => {
    setForm((prev) => ({ ...prev, [key]: rows }));
    setListingErrors((p) => ({ ...p, [key]: undefined }));
  };

  const handleFormSubmit = (e: FormEvent) => {
    e.preventDefault();

    const result = petListingFormSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors = toFieldErrors(result.error.issues);
      setListingErrors(fieldErrors);
      toast.warning('Please fix the highlighted fields.');
      focusFirstError();
      return;
    }

    setListingErrors({});

    const temperament = form.temperament.map((t) => t.trim()).filter(Boolean);
    const medicalHistory = form.medicalHistory.map((m) => m.trim()).filter(Boolean);
    const behavioralNotes = form.behavioralNotes
      .map((b) => b.trim().replace(/\.+$/, ''))
      .filter(Boolean)
      .join('. ');

    const photoUrls = form.photoUrls
      .split('\n')
      .map((u) => u.trim())
      .filter(Boolean);
    const gallery = photoUrls.length > 0 ? photoUrls : [FALLBACK_PET_PHOTO];

    const ageYears = derivedAgeYears ?? 0;
    const ageGroup: AgeGroup = derivedAgeGroup ?? 'adult';

    const shelterId = isLockedToShelter
      ? (myShelterId ?? form.shelterId ?? editingPet?.shelterId ?? 's1')
      : (form.shelterId || myShelterId || editingPet?.shelterId || 's1');

    onSubmit({
      petId: editingPet?.id,
      payload: {
        name: form.name,
        species: form.species as 'dog' | 'cat' | 'rabbit' | 'bird' | 'other',
        breed: form.breed || 'Mixed',
        birthdate: form.birthdate,
        ageYears,
        ageGroup,
        size: form.size,
        gender: form.gender,
        shelterId,
        status: form.status,
        visibility: form.visibility,
        description: form.description || editingPet?.description || '',
        temperament: temperament.length > 0 ? temperament : (editingPet?.temperament ?? []),
        imageUrl: gallery[0],
        gallery,
        medicalHistory: medicalHistory.length > 0 ? medicalHistory : (editingPet?.medicalHistory ?? []),
        behavioralNotes: behavioralNotes || (editingPet?.behavioralNotes ?? ''),
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
      },
    });
  };

  return (
    <SlideOver
      open={isOpen}
      onClose={onClose}
      size="lg"
      title={editingPet ? `Edit ${editingPet.name}` : 'Add new pet profile'}
      description={
        editingPet
          ? 'Update the pet record below.'
          : 'Photo uploads + medical records (stored via Supabase Storage in production).'
      }
      icon={editingPet ? Pencil : ListPlus}
      footer={
        <div className="grid grid-cols-2 gap-3">
          <Button type="button" variant="outline" size="lg" className="w-full" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="pet-form" size="lg" className="w-full" disabled={isSaving}>
            {isSaving ? 'Saving…' : editingPet ? 'Save changes' : 'Create listing'}
          </Button>
        </div>
      }
    >
      <form id="pet-form" onSubmit={handleFormSubmit} noValidate className="grid gap-3">
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
              onChange={(e) => setForm({ ...form, species: e.target.value as Species })}
              required
              options={SPECIES_OPTIONS}
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
              className={
                listingErrors.birthdate
                  ? 'border-destructive focus-visible:border-destructive focus-visible:ring-destructive/40'
                  : undefined
              }
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
              onChange={(e) =>
                setForm({ ...form, size: e.target.value as 'small' | 'medium' | 'large' })
              }
              required
              options={SIZE_OPTIONS}
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

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>
              Gender
              <RequiredMark />
            </Label>
            <Select
              value={form.gender}
              onChange={(e) =>
                setForm({ ...form, gender: e.target.value as 'male' | 'female' })
              }
              required
              options={GENDER_OPTIONS}
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
            className={
              listingErrors.description
                ? 'border-destructive focus-visible:border-destructive focus-visible:ring-destructive/40'
                : undefined
            }
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
  );
};

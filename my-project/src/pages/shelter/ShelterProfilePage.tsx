import { Check, Clock, Loader2, Mail, MapPin, Pencil, Phone, ShieldCheck, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'react-toastify';

import { ShelterProfileForm } from '@/components/shelter';
import { ShelterProfileSkeleton } from '@/components/shelter/ShelterProfileSkeleton';
import { ErrorState, SectionHeader, focusFirstError } from '@/components/shared';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/Feedback';
import { Button } from '@/components/ui/button';
import {
  EMPTY_SHELTER_PROFILE_FORM,
  type ShelterProfileFormValues,
} from '@/data/shelterProfile';
import { useAuth } from '@/hooks/useAuth';
import { useShelters } from '@/hooks/useData';
import { apiErrorMessage } from '@/lib/apiClient';
import {
  IMAGE_SIZE_MESSAGE,
  IMAGE_TYPE_MESSAGE,
  MAX_IMAGE_BYTES,
  isAllowedImageFile,
} from '@/lib/imageFiles';
import { shelterProfileSchema, toFieldErrors } from '@/lib/validators';
import { shelterService, uploadImage } from '@/services/api';
import type { Shelter } from '@/types';

/** Maps the shelter record onto the editable form fields. */
const toProfileForm = (shelter?: Shelter | null): ShelterProfileFormValues =>
  shelter
    ? {
        name: shelter.name,
        location: shelter.location,
        address: shelter.address,
        email: shelter.email,
        phone: shelter.phone,
        operatingHours: shelter.operatingHours,
        description: shelter.description,
        adoptionPolicy: '',
        logoUrl: shelter.imageUrl,
      }
    : EMPTY_SHELTER_PROFILE_FORM;

export const ShelterProfilePage = () => {
  const { user } = useAuth();
  const { shelters, setShelters, loading, error, refresh } = useShelters();

  // Staff always edit their own shelter's profile — never another shelter's.
  const shelter =
    (user?.shelterId ? shelters.find((s) => s.id === user.shelterId) : undefined) ??
    shelters[0] ??
    null;

  // The stored shelter is the source of truth until Edit is clicked; `draft`
  // holds the in-progress (and freshly saved) copy, so no effect has to sync it.
  const [draft, setDraft] = useState<ShelterProfileFormValues | null>(null);
  // View mode by default: fields are display-only until "Edit info" is clicked.
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof ShelterProfileFormValues, string>>
  >({});

  const form = draft ?? toProfileForm(shelter);

  const set = (key: keyof ShelterProfileFormValues, value: string) => {
    setDraft((previous) => ({ ...(previous ?? toProfileForm(shelter)), [key]: value }));
    setFieldErrors((previous) => ({ ...previous, [key]: undefined }));
    setSaved(false);
  };

  const handleEdit = () => {
    setDraft(toProfileForm(shelter));
    setSaved(false);
    setFieldErrors({});
    setEditing(true);
  };

  const handleCancel = () => {
    setDraft(null);
    setFieldErrors({});
    setSaved(false);
    setEditing(false);
  };

  const handleLogoFile = async (file: File) => {
    if (!isAllowedImageFile(file)) {
      toast.error(IMAGE_TYPE_MESSAGE);
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error(IMAGE_SIZE_MESSAGE);
      return;
    }

    setUploadingLogo(true);
    try {
      const url = await uploadImage(file, 'shelters');
      set('logoUrl', url);
      toast.success('Logo uploaded. Save the profile to keep it.');
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not upload the logo. Please try again.'));
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSave = async () => {
    if (!shelter || saving) return;

    const parsed = shelterProfileSchema.safeParse(form);
    if (!parsed.success) {
      setFieldErrors(toFieldErrors<keyof ShelterProfileFormValues>(parsed.error.issues));
      toast.warning('Please fix the highlighted fields.');
      focusFirstError();
      return;
    }
    if (uploadingLogo) {
      toast.info('The logo is still uploading. Please wait a moment.');
      return;
    }

    setFieldErrors({});
    setSaving(true);
    try {
      const updated = await shelterService.update(shelter.id, {
        name: parsed.data.name,
        location: parsed.data.location,
        address: parsed.data.address,
        email: parsed.data.email,
        phone: parsed.data.phone,
        operatingHours: parsed.data.operatingHours,
        description: parsed.data.description,
        // An empty value keeps the current logo rather than clearing it.
        ...(parsed.data.logoUrl.trim() ? { imageUrl: parsed.data.logoUrl.trim() } : {}),
      });
      setShelters((previous) =>
        previous.map((s) => (s.id === updated.id ? updated : s)),
      );
      // Merge onto the empty form so the draft always matches the full form shape.
      setDraft({ ...EMPTY_SHELTER_PROFILE_FORM, ...parsed.data });
      setSaved(true);
      setEditing(false);
      toast.success('Shelter profile saved successfully!');
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not save your profile. Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full px-4 py-6 sm:px-6">
      <SectionHeader
        title="Shelter profile"
        subtitle={
          editing
            ? 'Update your identity, contact details, and public description.'
            : 'Keep your identity, contact details, and public description up to date.'
        }
        actions={
          shelter ? (
            editing ? (
              <div className="flex items-center gap-2">
                <Button type="button" size="sm" variant="outline" onClick={handleCancel} disabled={saving}>
                  <X className="size-4" /> Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleSave}
                  disabled={saving || uploadingLogo}
                  aria-busy={saving}
                >
                  {saving ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Check className="size-4" />
                  )}
                  {saving ? 'Saving…' : 'Save changes'}
                </Button>
              </div>
            ) : (
              <Button type="button" size="sm" variant="outline" onClick={handleEdit}>
                <Pencil className="size-4" /> Edit info
              </Button>
            )
          ) : undefined
        }
      />

      <div className="mt-6">
        {loading && !shelter && <ShelterProfileSkeleton />}

        {!loading && error && !shelter && (
          <ErrorState
            title="Could not load your profile"
            description={error}
            onRetry={refresh}
          />
        )}

        {!loading && !error && !shelter && (
          <EmptyState
            title="No shelter found"
            description="Your shelter profile will appear here."
          />
        )}

        {shelter && (
          <div className="space-y-4">
            {saved && (
              <p className="flex items-center gap-1.5 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm font-medium text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-300">
                <Check className="size-4" /> Profile saved successfully.
              </p>
            )}

            <Card className="overflow-hidden">
              <CardContent className="flex flex-col gap-4 pt-5 sm:flex-row sm:items-center">
                <img
                  src={form.logoUrl || shelter.imageUrl}
                  alt={`${form.name || shelter.name} logo`}
                  className="size-20 shrink-0 rounded-xl border object-cover"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-bold tracking-tight">
                      {form.name || shelter.name}
                    </h2>
                    <Badge variant="success">
                      <ShieldCheck className="size-3" /> Verified shelter
                    </Badge>
                  </div>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="size-3.5 shrink-0" />
                    {form.address || shelter.address}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Mail className="size-3.5" /> {form.email || shelter.email}
                    </span>
                    <span className="flex items-center gap-1">
                      <Phone className="size-3.5" /> {form.phone || shelter.phone}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="size-3.5" />{' '}
                      {form.operatingHours || shelter.operatingHours}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {editing ? (
              /* ------------------------------ Edit mode ------------------------------ */
              <ShelterProfileForm
                form={form}
                errors={fieldErrors}
                onChange={set}
                onLogoFile={handleLogoFile}
                uploadingLogo={uploadingLogo}
                onSubmit={handleSave}
              />
            ) : (
              /* ----------------------------- View mode ----------------------------- */
              <div className="space-y-4">
                {/* Organization */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Organization</CardTitle>
                    <CardDescription>
                      Name and location shown across the platform.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-3 sm:grid-cols-2">
                    {[
                      { label: 'Shelter name', value: form.name, full: false },
                      { label: 'City / location', value: form.location, full: false },
                      { label: 'Street address', value: form.address, full: true },
                    ].map((field) => (
                      <div
                        key={field.label}
                        className={field.full ? 'sm:col-span-2' : undefined}
                      >
                        <p className="mb-1.5 text-sm font-medium">{field.label}</p>
                        <p className="text-sm break-words text-muted-foreground">
                          {field.value.trim() ? field.value : '—'}
                        </p>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Contact & hours */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Contact &amp; hours</CardTitle>
                    <CardDescription>How adopters reach you and when to visit.</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-3 sm:grid-cols-2">
                    {[
                      { label: 'Contact email', value: form.email, full: false },
                      { label: 'Phone', value: form.phone, full: false },
                      { label: 'Operating hours', value: form.operatingHours, full: true },
                    ].map((field) => (
                      <div
                        key={field.label}
                        className={field.full ? 'sm:col-span-2' : undefined}
                      >
                        <p className="mb-1.5 text-sm font-medium">{field.label}</p>
                        <p className="text-sm break-words text-muted-foreground">
                          {field.value.trim() ? field.value : '—'}
                        </p>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Public profile */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Public profile</CardTitle>
                    <CardDescription>
                      Story and rules adopters see on your shelter page.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-3">
                    {[
                      { label: 'About your shelter', value: form.description },
                      { label: 'Adoption policy', value: form.adoptionPolicy },
                    ].map((field) => (
                      <div key={field.label}>
                        <p className="mb-1.5 text-sm font-medium">{field.label}</p>
                        <p className="whitespace-pre-wrap text-sm break-words text-muted-foreground">
                          {field.value.trim() ? field.value : '—'}
                        </p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

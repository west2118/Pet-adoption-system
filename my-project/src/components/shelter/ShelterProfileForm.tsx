import { ImagePlus } from 'lucide-react';
import type { ChangeEvent, FormEvent } from 'react';

import { ValidatedInput, ValidatedTextarea } from '@/components/shared';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Label, Textarea } from '@/components/ui/Form';
import type { ShelterProfileFormValues } from '@/data/shelterProfile';
import { IMAGE_ACCEPT } from '@/lib/imageFiles';

export interface ShelterProfileFormProps {
  form: ShelterProfileFormValues;
  errors: Partial<Record<keyof ShelterProfileFormValues, string>>;
  onChange: (key: keyof ShelterProfileFormValues, value: string) => void;
  onLogoFile: (file: File) => void;
  uploadingLogo: boolean;
  onSubmit: () => void;
}

/** Editable shelter profile: organization, contact details, and public story. */
export const ShelterProfileForm = ({
  form,
  errors,
  onChange,
  onLogoFile,
  uploadingLogo,
  onSubmit,
}: ShelterProfileFormProps) => {
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  const handleLogoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) onLogoFile(file);
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {/* Logo */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Shelter logo</CardTitle>
          <CardDescription>Shown on your shelter page and listing cards.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            {form.logoUrl ? (
              <img
                src={form.logoUrl}
                alt="Shelter logo preview"
                className="size-20 rounded-xl border object-cover"
              />
            ) : (
              <div className="flex size-20 items-center justify-center rounded-xl border border-dashed text-muted-foreground">
                <ImagePlus className="size-6" />
              </div>
            )}
            <div className="space-y-1.5">
              <label
                className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted ${uploadingLogo ? 'cursor-wait opacity-60' : ''}`}
              >
                <ImagePlus className="size-4" />
                {uploadingLogo ? 'Uploading…' : form.logoUrl ? 'Replace logo' : 'Upload logo'}
                <input
                  type="file"
                  accept={IMAGE_ACCEPT}
                  className="sr-only"
                  disabled={uploadingLogo}
                  aria-label="Upload shelter logo"
                  onChange={handleLogoChange}
                />
              </label>
              <p className="text-xs text-muted-foreground">
                JPEG, PNG, WebP or GIF (max 5MB).
              </p>
              {errors.logoUrl && (
                <p role="alert" className="text-[13px] text-destructive">
                  {errors.logoUrl}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Organization */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Organization</CardTitle>
          <CardDescription>Name and location shown across the platform.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="profile-name">Shelter name</Label>
            <ValidatedInput
              id="profile-name"
              value={form.name}
              onChange={(e) => onChange('name', e.target.value)}
              error={errors.name}
            />
          </div>
          <div>
            <Label htmlFor="profile-location">City / location</Label>
            <ValidatedInput
              id="profile-location"
              value={form.location}
              onChange={(e) => onChange('location', e.target.value)}
              error={errors.location}
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="profile-address">Street address</Label>
            <ValidatedInput
              id="profile-address"
              value={form.address}
              onChange={(e) => onChange('address', e.target.value)}
              error={errors.address}
            />
          </div>
        </CardContent>
      </Card>

      {/* Contact & hours */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Contact &amp; hours</CardTitle>
          <CardDescription>How adopters reach you and when to visit.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="profile-email">Contact email</Label>
            <ValidatedInput
              id="profile-email"
              type="email"
              value={form.email}
              onChange={(e) => onChange('email', e.target.value)}
              error={errors.email}
            />
          </div>
          <div>
            <Label htmlFor="profile-phone">Phone</Label>
            <ValidatedInput
              id="profile-phone"
              value={form.phone}
              onChange={(e) => onChange('phone', e.target.value)}
              error={errors.phone}
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="profile-hours">Operating hours</Label>
            <ValidatedInput
              id="profile-hours"
              value={form.operatingHours}
              onChange={(e) => onChange('operatingHours', e.target.value)}
              error={errors.operatingHours}
            />
          </div>
        </CardContent>
      </Card>

      {/* Public profile */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Public profile</CardTitle>
          <CardDescription>Story and rules adopters see on your shelter page.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          <div>
            <Label htmlFor="profile-desc">About your shelter</Label>
            <ValidatedTextarea
              id="profile-desc"
              value={form.description}
              onChange={(e) => onChange('description', e.target.value)}
              error={errors.description}
            />
          </div>
          <div>
            <Label htmlFor="profile-policy">Adoption policy</Label>
            <Textarea
              id="profile-policy"
              value={form.adoptionPolicy}
              onChange={(e) => onChange('adoptionPolicy', e.target.value)}
              placeholder="e.g. Home visit required, adoption fee covers vaccination…"
            />
          </div>
        </CardContent>
      </Card>
    </form>
  );
};

import { Check, X } from 'lucide-react';
import type { FormEvent } from 'react';

import { ValidatedInput, ValidatedTextarea } from '@/components/shared';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Label, Textarea } from '@/components/ui/Form';
import { Button } from '@/components/ui/button';
import type { ShelterProfileFormValues } from '@/data/shelterProfile';

export interface ShelterProfileFormProps {
  form: ShelterProfileFormValues;
  errors: Partial<Record<keyof ShelterProfileFormValues, string>>;
  onChange: (key: keyof ShelterProfileFormValues, value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

/** Editable shelter profile: organization, contact details, and public story. */
export const ShelterProfileForm = ({
  form,
  errors,
  onChange,
  onSubmit,
  onCancel,
}: ShelterProfileFormProps) => {
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {/* Organization */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Organization</CardTitle>
          <CardDescription>Name, location, and logo shown across the platform.</CardDescription>
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
          <div className="sm:col-span-2">
            <Label htmlFor="profile-logo">Logo / photo URL</Label>
            <ValidatedInput
              id="profile-logo"
              value={form.logoUrl}
              onChange={(e) => onChange('logoUrl', e.target.value)}
              placeholder="https://…"
              error={errors.logoUrl}
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
          <div className="flex flex-wrap gap-2">
            <Button type="submit" size="sm">
              <Check className="size-4" /> Save shelter profile
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={onCancel}>
              <X className="size-4" /> Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
};

import type { FormEvent } from 'react';

import { SlideOver, ValidatedInput, ValidatedTextarea } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/Form';
import type { AdminShelterFormValues } from '@/data/adminPresets';
import type { Shelter } from '@/types';

export interface AdminShelterFormSlideOverProps {
  open: boolean;
  editingShelter: Shelter | null;
  form: AdminShelterFormValues;
  formErrors: Partial<Record<keyof AdminShelterFormValues, string>>;
  isSaving: boolean;
  onClose: () => void;
  onChange: (field: keyof AdminShelterFormValues, value: string) => void;
  onSubmit: (e: FormEvent) => void;
}

export const AdminShelterFormSlideOver = ({
  open,
  editingShelter,
  form,
  formErrors,
  isSaving,
  onClose,
  onChange,
  onSubmit,
}: AdminShelterFormSlideOverProps) => (
  <SlideOver
    open={open}
    onClose={onClose}
    title={editingShelter ? `Edit ${editingShelter.name}` : 'Add partner shelter'}
    description={
      editingShelter
        ? 'Update shelter contact details and public info.'
        : 'Register a new rescue organization to the platform.'
    }
  >
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <div>
        <Label htmlFor="shelter-name">Shelter name *</Label>
        <ValidatedInput
          id="shelter-name"
          value={form.name}
          onChange={(e) => onChange('name', e.target.value)}
          error={formErrors.name}
          placeholder="Happy Paws Rescue"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="shelter-location">Location (City) *</Label>
          <ValidatedInput
            id="shelter-location"
            value={form.location}
            onChange={(e) => onChange('location', e.target.value)}
            error={formErrors.location}
            placeholder="San Francisco, CA"
          />
        </div>
        <div>
          <Label htmlFor="shelter-address">Street address *</Label>
          <ValidatedInput
            id="shelter-address"
            value={form.address}
            onChange={(e) => onChange('address', e.target.value)}
            error={formErrors.address}
            placeholder="123 Rescue Way"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="shelter-email">Contact email *</Label>
          <ValidatedInput
            id="shelter-email"
            type="email"
            value={form.email}
            onChange={(e) => onChange('email', e.target.value)}
            error={formErrors.email}
            placeholder="contact@happypaws.org"
          />
        </div>
        <div>
          <Label htmlFor="shelter-phone">Phone number *</Label>
          <ValidatedInput
            id="shelter-phone"
            value={form.phone}
            onChange={(e) => onChange('phone', e.target.value)}
            error={formErrors.phone}
            placeholder="(555) 000-0000"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="shelter-hours">Operating hours *</Label>
        <ValidatedInput
          id="shelter-hours"
          value={form.operatingHours}
          onChange={(e) => onChange('operatingHours', e.target.value)}
          error={formErrors.operatingHours}
          placeholder="Mon–Sat: 9am–5pm"
        />
      </div>

      <div>
        <Label htmlFor="shelter-imageUrl">Cover image URL (optional)</Label>
        <ValidatedInput
          id="shelter-imageUrl"
          value={form.imageUrl}
          onChange={(e) => onChange('imageUrl', e.target.value)}
          placeholder="https://..."
        />
      </div>

      <div>
        <Label htmlFor="shelter-description">Description (optional)</Label>
        <ValidatedTextarea
          id="shelter-description"
          rows={3}
          value={form.description}
          onChange={(e) => onChange('description', e.target.value)}
          placeholder="A non-profit pet rescue dedicated to..."
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" disabled={isSaving} onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? 'Saving…' : editingShelter ? 'Save changes' : 'Add shelter'}
        </Button>
      </div>
    </form>
  </SlideOver>
);


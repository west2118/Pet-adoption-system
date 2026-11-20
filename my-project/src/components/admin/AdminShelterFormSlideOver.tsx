import { ImagePlus } from 'lucide-react';
import type { ChangeEvent, FormEvent } from 'react';

import { SlideOver, ValidatedInput, ValidatedTextarea } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/Form';
import type { AdminShelterFormValues } from '@/data/adminPresets';
import { IMAGE_ACCEPT } from '@/lib/imageFiles';
import type { Shelter } from '@/types';

export interface AdminShelterFormSlideOverProps {
  open: boolean;
  editingShelter: Shelter | null;
  form: AdminShelterFormValues;
  formErrors: Partial<Record<keyof AdminShelterFormValues, string>>;
  isSaving: boolean;
  uploadingImage: boolean;
  onClose: () => void;
  onChange: (field: keyof AdminShelterFormValues, value: string) => void;
  onImageFile: (file: File) => void;
  onSubmit: (e: FormEvent) => void;
}

export const AdminShelterFormSlideOver = ({
  open,
  editingShelter,
  form,
  formErrors,
  isSaving,
  uploadingImage,
  onClose,
  onChange,
  onImageFile,
  onSubmit,
}: AdminShelterFormSlideOverProps) => {
  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) onImageFile(file);
  };

  return (
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
        <Label htmlFor="shelter-image">Cover image (optional)</Label>
        <div className="mt-1.5 flex items-center gap-3">
          {form.imageUrl ? (
            <img
              src={form.imageUrl}
              alt="Shelter cover preview"
              className="size-16 rounded-lg border object-cover"
            />
          ) : (
            <div className="flex size-16 items-center justify-center rounded-lg border border-dashed text-muted-foreground">
              <ImagePlus className="size-5" />
            </div>
          )}
          <div>
            <label
              className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted ${uploadingImage ? 'cursor-wait opacity-60' : ''}`}
            >
              <ImagePlus className="size-4" />
              {uploadingImage ? 'Uploading…' : form.imageUrl ? 'Replace image' : 'Upload image'}
              <input
                id="shelter-image"
                type="file"
                accept={IMAGE_ACCEPT}
                className="sr-only"
                disabled={uploadingImage}
                onChange={handleImageChange}
              />
            </label>
            <p className="mt-1 text-xs text-muted-foreground">
              JPEG, PNG, WebP or GIF (max 5MB).
            </p>
          </div>
        </div>
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
        <Button type="submit" disabled={isSaving || uploadingImage}>
          {isSaving ? 'Saving…' : editingShelter ? 'Save changes' : 'Add shelter'}
        </Button>
      </div>
    </form>
  </SlideOver>
  );
};


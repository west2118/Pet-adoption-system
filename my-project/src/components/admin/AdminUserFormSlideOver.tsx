import type { FormEvent } from 'react';

import { SlideOver, ValidatedSelect } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/Form';
import { ADMIN_USER_ROLE_OPTIONS, type AdminUserFormValues } from '@/data/adminPresets';
import type { Shelter, User, UserRole } from '@/types';

export interface AdminUserFormSlideOverProps {
  open: boolean;
  editingUser: User | null;
  form: AdminUserFormValues;
  formErrors: Partial<Record<keyof AdminUserFormValues, string>>;
  shelters: Shelter[];
  isUpdating: boolean;
  onClose: () => void;
  onChangeRole: (role: UserRole) => void;
  onChangeShelter: (shelterId: string) => void;
  onSubmit: (e: FormEvent) => void;
}

export const AdminUserFormSlideOver = ({
  open,
  editingUser,
  form,
  formErrors,
  shelters,
  isUpdating,
  onClose,
  onChangeRole,
  onChangeShelter,
  onSubmit,
}: AdminUserFormSlideOverProps) => (
  <SlideOver
    open={open}
    onClose={onClose}
    title={`Edit role: ${editingUser?.name}`}
    description="Change user access level and assign them to a partner shelter."
  >
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <div className="rounded-lg border bg-muted/40 p-3 text-sm">
        <p className="font-medium">{editingUser?.name}</p>
        <p className="text-xs text-muted-foreground">{editingUser?.email}</p>
      </div>

      <div>
        <Label htmlFor="user-role">Role</Label>
        <ValidatedSelect
          id="user-role"
          value={form.role}
          onChange={(e) => onChangeRole(e.target.value as UserRole)}
          error={formErrors.role}
          options={ADMIN_USER_ROLE_OPTIONS}
        />
      </div>

      {form.role === 'shelter_staff' && (
        <div>
          <Label htmlFor="user-shelter">Assigned shelter *</Label>
          <ValidatedSelect
            id="user-shelter"
            value={form.shelterId}
            onChange={(e) => onChangeShelter(e.target.value)}
            error={formErrors.shelterId}
            options={[
              { value: '', label: 'Select a shelter…' },
              ...shelters.map((s) => ({
                value: s.id,
                label: `${s.name} (${s.location})`,
              })),
            ]}
          />
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" disabled={isUpdating} onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={isUpdating}>
          {isUpdating ? 'Saving…' : 'Save changes'}
        </Button>
      </div>
    </form>
  </SlideOver>
);


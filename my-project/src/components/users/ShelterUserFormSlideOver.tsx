import { Pencil, Plus } from 'lucide-react';
import type { FormEvent } from 'react';

import {
  PasswordInput,
  SlideOver,
  ValidatedInput,
  ValidatedSelect,
} from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/Form';
import {
  SHELTER_ACCOUNT_TYPE_OPTIONS,
  type ShelterUserFormValues,
} from '@/data/shelterUsers';
import type { User } from '@/types';

export interface ShelterUserFormSlideOverProps {
  open: boolean;
  /** Account being edited; null when adding a new staff member. */
  user: User | null;
  form: ShelterUserFormValues;
  shelterName: string;
  canManage: boolean;
  isSaving: boolean;
  errors: Partial<Record<keyof ShelterUserFormValues, string>>;
  onChange: (key: keyof ShelterUserFormValues, value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}

/** Add / edit form for a staff or admin account tied to the shelter. */
export const ShelterUserFormSlideOver = ({
  open,
  user,
  form,
  shelterName,
  canManage,
  isSaving,
  errors,
  onChange,
  onClose,
  onSubmit,
}: ShelterUserFormSlideOverProps) => {
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <SlideOver
      open={open}
      onClose={onClose}
      size="lg"
      title={user ? `Edit ${user.name}` : 'Add shelter user'}
      description={
        user
          ? 'Update this account. Leaving the password blank keeps the current one.'
          : `This account will only be able to access ${shelterName}.`
      }
      icon={user ? Pencil : Plus}
      footer={
        <div className="grid grid-cols-2 gap-3">
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="shelter-user-form"
            size="lg"
            className="w-full"
            disabled={!canManage || isSaving}
          >
            {isSaving ? 'Saving…' : user ? 'Save changes' : 'Create user'}
          </Button>
        </div>
      }
    >
      <form id="shelter-user-form" onSubmit={handleSubmit} noValidate className="grid gap-3">
        <div>
          <Label htmlFor="shelter-user-name">Full name</Label>
          <ValidatedInput
            id="shelter-user-name"
            value={form.name}
            onChange={(e) => onChange('name', e.target.value)}
            placeholder="e.g. Juan Dela Cruz"
            autoComplete="name"
            error={errors.name}
          />
        </div>
        <div>
          <Label htmlFor="shelter-user-email">Email</Label>
          <ValidatedInput
            id="shelter-user-email"
            type="email"
            value={form.email}
            onChange={(e) => onChange('email', e.target.value)}
            placeholder="name@example.com"
            autoComplete="email"
            error={errors.email}
          />
        </div>
        <div>
          <Label htmlFor="shelter-user-type">Account type</Label>
          <ValidatedSelect
            id="shelter-user-type"
            value={form.accountType}
            onChange={(e) => onChange('accountType', e.target.value)}
            options={SHELTER_ACCOUNT_TYPE_OPTIONS}
            error={errors.accountType}
          />
          <p className="mt-1.5 text-xs text-muted-foreground">
            Admins can manage this page; staff can use the rest of the shelter portal. Each
            shelter allows 1 admin and 2 staff accounts.
          </p>
        </div>
        <div>
          <Label htmlFor="shelter-user-password">
            {user ? 'New password (optional)' : 'Password'}
          </Label>
          <PasswordInput
            id="shelter-user-password"
            value={form.password}
            onChange={(e) => onChange('password', e.target.value)}
            autoComplete="new-password"
            placeholder={
              user ? 'Leave blank to keep current password' : 'At least 8 characters'
            }
            error={errors.password}
          />
        </div>
      </form>
    </SlideOver>
  );
};

import type { ShelterAccountType } from '@/services/api';
import type { User } from '@/types';

export interface ShelterUserFormValues {
  name: string;
  email: string;
  password: string;
  accountType: ShelterAccountType;
}

export const SHELTER_ACCOUNT_TYPE_OPTIONS = [
  { value: 'staff', label: 'Staff' },
  { value: 'admin', label: 'Admin' },
];

export const EMPTY_SHELTER_USER_FORM: ShelterUserFormValues = {
  name: '',
  email: '',
  password: '',
  accountType: 'staff',
};

/** Account type is derived from ownership — there is no separate role field. */
export const accountTypeOf = (user: Pick<User, 'isOwner'>): ShelterAccountType =>
  user.isOwner ? 'admin' : 'staff';

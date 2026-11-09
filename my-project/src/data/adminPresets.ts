import type { UserRole } from '@/types';

export interface AdminShelterFormValues {
  name: string;
  location: string;
  address: string;
  email: string;
  phone: string;
  operatingHours: string;
  description: string;
  imageUrl: string;
}

export const EMPTY_ADMIN_SHELTER_FORM: AdminShelterFormValues = {
  name: '',
  location: '',
  address: '',
  email: '',
  phone: '',
  operatingHours: '',
  description: '',
  imageUrl: '',
};

export interface AdminUserFormValues {
  role: UserRole;
  shelterId: string;
}

export const ADMIN_USER_ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'adopter', label: 'Adopter' },
  { value: 'shelter_staff', label: 'Shelter staff' },
  { value: 'platform_admin', label: 'Platform admin' },
];

/** Maps a user role to its corresponding Badge variant. */
export const roleBadgeVariant = (role: UserRole): 'destructive' | 'info' | 'muted' => {
  if (role === 'platform_admin') return 'destructive';
  if (role === 'shelter_staff') return 'info';
  return 'muted';
};

export const SHELTER_APPLICATION_STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'pending', label: 'Pending review' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];


export type Species = 'dog' | 'cat' | 'rabbit' | 'bird' | 'other';
export type AgeGroup = 'puppy-kitten' | 'young' | 'adult' | 'senior';
export type PetSize = 'small' | 'medium' | 'large';
export type Gender = 'male' | 'female';
export type PetStatus = 'Available' | 'Pending Adoption' | 'Adopted' | 'Fostered';

export type ApplicationStatus =
  | 'Submitted'
  | 'Under Review'
  | 'Approved'
  | 'Rejected'
  | 'Adopted';

export type UserRole = 'adopter' | 'shelter_staff' | 'platform_admin';

export type AccountStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

export type PetVisibility = 'public' | 'private';

export interface Pet {
  id: string;
  name: string;
  species: Species;
  breed: string;
  birthdate: string;
  ageYears: number;
  ageGroup: AgeGroup;
  size: PetSize;
  gender: Gender;
  temperament: string[];
  shelterId: string;
  visibility: PetVisibility;
  description: string;
  medicalHistory: string[];
  behavioralNotes: string;
  status: PetStatus;
  imageUrl: string;
  gallery: string[];
  vaccinated: boolean;
  spayedNeutered: boolean;
  goodWithKids: boolean;
  goodWithPets: boolean;
  microchipped?: boolean;
  dewormed?: boolean;
  houseTrained?: boolean;
  goodWithStrangers?: boolean;
  leashTrained?: boolean;
  crateTrained?: boolean;
  litterTrained?: boolean;
  apartmentFriendly?: boolean;
  dateAdded: string;
}

export interface Shelter {
  id: string;
  name: string;
  location: string;
  address: string;
  phone: string;
  email: string;
  operatingHours: string;
  description: string;
  imageUrl: string;
  totalPets: number;
  /** Public + Available listings count (provided by GET /shelters). */
  activeListings?: number;
}

export interface AdoptionApplication {
  id: string;
  petId: string;
  applicantId: string;
  applicantName: string;
  email: string;
  phone: string;
  address: string;
  housingType: 'house' | 'apartment' | 'condo' | 'other';
  hasOtherPets: boolean;
  experience: string;
  reason: string;
  status: ApplicationStatus;
  submittedAt: string;
  updatedAt: string;
  staffNotes?: string;
  history: { status: ApplicationStatus; date: string; note?: string }[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  shelterId?: string;
  avatarUrl?: string;
  /** Shelter accounts start `pending` until an admin approves them. */
  accountStatus?: AccountStatus;
  /** The registrant who owns (is the super admin of) the shelter. */
  isOwner?: boolean;
}

/** A shelter onboarding submission awaiting platform-admin review. */
export interface ShelterApplication {
  id: string;
  userId: string;
  name: string;
  location: string;
  address: string;
  phone: string;
  email: string;
  operatingHours: string;
  description: string;
  imageUrl: string;
  status: AccountStatus;
  reviewNote?: string;
  submittedAt: string;
  reviewedAt?: string;
  applicantName?: string | null;
  applicantEmail?: string | null;
}

export interface Inquiry {
  id: string;
  petId: string;
  fromName: string;
  fromEmail: string;
  message: string;
  createdAt: string;
}

export type WaiverTemplateStatus = 'Active' | 'Draft';

export interface WaiverTemplate {
  id: string;
  shelterId: string;
  name: string;
  category: string;
  body: string;
  status: WaiverTemplateStatus;
  updatedAt: string;
}

export interface WaiverSnapshot {
  application: {
    id: string;
    applicantName: string;
    email: string;
    phone: string;
    address: string;
    status: string;
  };
  pet: Pet;
  shelter: Shelter;
  templates: { id: string; name: string; category: string; body: string }[];
  issuedAt: string;
}

export interface Waiver {
  id: string;
  applicationId: string;
  shelterId: string;
  snapshot: WaiverSnapshot;
  createdAt: string;
  updatedAt: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
  type: 'application' | 'inquiry' | 'system';
}

export interface PetFilters {
  search: string;
  species: string;
  breed: string;
  ageGroup: string;
  size: string;
  gender: string;
  temperament: string;
  location: string;
  status: string;
  visibility: string;
}

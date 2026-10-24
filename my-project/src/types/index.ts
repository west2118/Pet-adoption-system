export type Species = 'dog' | 'cat' | 'rabbit' | 'bird' | 'other';
export type AgeGroup = 'puppy-kitten' | 'young' | 'adult' | 'senior';
export type PetSize = 'small' | 'medium' | 'large';
export type Gender = 'male' | 'female';
export type PetStatus = 'Available' | 'In Process' | 'Adopted' | 'Fostered';

export type ApplicationStatus =
  | 'Submitted'
  | 'Under Review'
  | 'Approved'
  | 'Rejected'
  | 'Cancelled'
  | 'Adopted'
  // A completed adoption that fell through: the pet came back to the shelter.
  | 'Returned';

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
  /** Straight-line distance to the visitor, present only on nearby queries. */
  distanceKm?: number;
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
  /** Shelter coordinates used for "Near me" distance sorting. */
  latitude?: number | null;
  longitude?: number | null;
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
  /** Current issued waiver state; `None` means handover documents are missing. */
  waiverStatus?: WaiverStatus | 'None';
  waiverVersion?: number;
  waiverSignedAt?: string;
  submittedAt: string;
  updatedAt: string;
  /** Clinic appointment set when the shelter approves the application. */
  pickupAt?: string | null;
  /** Contact address for questions about the pickup. */
  pickupEmail?: string | null;
  staffNotes?: string;
  /** Joined pet summary so the card still renders when the pet is not public. */
  pet?: { id: string; name: string; imageUrl: string; breed?: string };
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
  /** True once the approve/reject notification email was delivered (NULL = not attempted yet). */
  emailSent?: boolean | null;
  emailSentAt?: string | null;
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
  /** Server-tracked resolution (backend only) — emailing an inquiry resolves it. */
  resolved?: boolean;
  /** Set once the shelter has successfully emailed the inquirer. */
  emailedAt?: string;
  /** Subject/body of the reply that was sent (read-only in the details modal). */
  emailSubject?: string;
  emailMessage?: string;
}

export type VisitStatus = 'requested' | 'confirmed' | 'completed' | 'cancelled';

/** One meet-and-greet request for a (pet, adopter) pair. */
export interface VisitThread {
  id: string;
  petId: string;
  adopterId: string;
  status: VisitStatus;
  preferredSlot: string;
  confirmedSlot?: string | null;
  cancelReason?: string | null;
  /** Message the shelter emailed with the confirmed visit date. */
  shelterMessage?: string | null;
  createdAt: string;
  updatedAt: string;
  pet?: { id: string; name: string; imageUrl: string };
  /** Present on shelter views so staff know who to decide on. */
  adopter?: { id: string; name: string; email?: string | null };
}

export type WaiverTemplateStatus = 'Active' | 'Draft';

/** `Issued` is unsigned but usable; `Signed` is immutable. */
export type WaiverStatus = 'Issued' | 'Signed';
export type WaiverVersionStatus = WaiverStatus | 'Superseded';

export interface WaiverTemplate {
  id: string;
  shelterId: string;
  name: string;
  category: string;
  body: string;
  status: WaiverTemplateStatus;
  /** Platform default: visible to the shelter but locked (no edit/deactivate). */
  isDefault: boolean;
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
  templates: {
    id: string;
    name: string;
    category: string;
    body: string;
    /** Locked platform template vs. shelter-authored template. */
    isDefault?: boolean;
    /** Template revision captured when this snapshot was generated. */
    updatedAt?: string;
  }[];
  issuedAt: string;
  /** Snapshot format version (matches the waiver row while current). */
  version?: number;
  generatedAt?: string;
  generatedBy?: { id: string | null; name: string } | null;
  signature?: {
    name: string;
    signedAt: string;
    signedByName?: string;
    method?: 'typed' | 'drawn';
    /** Consent was explicitly confirmed when the signature was recorded. */
    consent?: boolean;
    consentText?: string;
  };
}

export interface Waiver {
  id: string;
  applicationId: string;
  shelterId: string;
  snapshot: WaiverSnapshot;
  status: WaiverStatus;
  version: number;
  generatedAt: string;
  generatedBy: { id: string | null; name: string } | null;
  signedAt: string | null;
  signedBy: string | null;
  signedByName: string | null;
  signatureName: string | null;
  createdAt: string;
  updatedAt: string;
}

/** An archived regeneration of a waiver, immutable even after later edits. */
export interface WaiverVersion {
  id: string;
  version: number;
  status: WaiverVersionStatus;
  snapshot: WaiverSnapshot;
  generatedAt: string;
  generatedBy: { id: string | null; name: string } | null;
  signedAt: string | null;
  signedBy: string | null;
  signedByName: string | null;
  signatureName: string | null;
  archivedAt: string | null;
  isCurrent: boolean;
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

import type { Pet, Shelter, Waiver, WaiverTemplate } from '@/types';

/** The template fields a preview needs — a saved row or the unsaved editor form. */
export type PreviewWaiverTemplate = Pick<
  WaiverTemplate,
  'id' | 'name' | 'category' | 'body' | 'isDefault'
>;

const samplePetFor = (shelterId: string): Pet => ({
  id: 'sample-pet',
  name: 'Sample Pet',
  species: 'dog',
  breed: 'Sample Breed',
  birthdate: '2023-06-01',
  ageYears: 3,
  ageGroup: 'adult',
  size: 'medium',
  gender: 'male',
  temperament: ['Friendly'],
  shelterId,
  visibility: 'public',
  description: 'Sample preview pet.',
  medicalHistory: ['Rabies vaccine', 'Vet health check'],
  behavioralNotes: 'Sample behavioral note.',
  status: 'Available',
  imageUrl: '',
  gallery: [],
  vaccinated: true,
  spayedNeutered: true,
  goodWithKids: true,
  goodWithPets: true,
  microchipped: true,
  dewormed: true,
  houseTrained: false,
  goodWithStrangers: false,
  leashTrained: false,
  crateTrained: false,
  litterTrained: false,
  apartmentFriendly: false,
  dateAdded: new Date().toISOString().slice(0, 10),
});

/**
 * Builds the sample waiver backing the PDF-look preview and the editor's live
 * preview: the shelter's own details plus sample adopter/pet data (first
 * listing when one exists). Clearly a preview — nothing is issued or stored.
 */
export const buildSampleWaiver = (
  template: PreviewWaiverTemplate,
  shelter: Shelter | null,
  pets: Pet[],
): Waiver | null => {
  if (!shelter) return null;

  const samplePet = pets.find((pet) => pet.shelterId === shelter.id) ?? samplePetFor(shelter.id);
  const now = new Date().toISOString();

  return {
    id: 'sample-waiver',
    applicationId: 'sample-application',
    shelterId: shelter.id,
    snapshot: {
      application: {
        id: 'sample-application',
        applicantName: 'Sample Adopter',
        email: 'sample.adopter@example.com',
        phone: '+63 900 000 0000',
        address: '123 Sample Street, Quezon City',
        status: 'Approved',
      },
      pet: samplePet,
      shelter,
      templates: [
        {
          id: template.id,
          name: template.name,
          category: template.category,
          body: template.body,
          isDefault: template.isDefault,
          updatedAt: now,
        },
      ],
      issuedAt: now,
      version: 1,
      generatedAt: now,
      generatedBy: { id: null, name: 'Sample preview' },
    },
    status: 'Issued',
    version: 1,
    generatedAt: now,
    generatedBy: { id: null, name: 'Sample preview' },
    signedAt: null,
    signedBy: null,
    signedByName: null,
    signatureName: null,
    createdAt: now,
    updatedAt: now,
  };
};

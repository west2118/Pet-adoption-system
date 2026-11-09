export interface ShelterProfileFormValues {
  name: string;
  location: string;
  address: string;
  email: string;
  phone: string;
  operatingHours: string;
  description: string;
  adoptionPolicy: string;
  logoUrl: string;
}

export const EMPTY_SHELTER_PROFILE_FORM: ShelterProfileFormValues = {
  name: '',
  location: '',
  address: '',
  email: '',
  phone: '',
  operatingHours: '',
  description: '',
  adoptionPolicy: '',
  logoUrl: '',
};

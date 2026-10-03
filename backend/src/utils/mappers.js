// snake_case DB rows -> camelCase API objects (mirrors frontend types/index.ts)

export const mapPet = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    species: row.species,
    breed: row.breed,
    ageYears: Number(row.age_years),
    ageGroup: row.age_group,
    size: row.size,
    gender: row.gender,
    temperament: row.temperament ?? [],
    shelterId: row.shelter_id,
    visibility: row.visibility,
    description: row.description,
    medicalHistory: row.medical_history ?? [],
    behavioralNotes: row.behavioral_notes ?? '',
    status: row.status,
    imageUrl: row.image_url,
    gallery: row.gallery ?? [],
    vaccinated: row.vaccinated,
    spayedNeutered: row.spayed_neutered,
    goodWithKids: row.good_with_kids,
    goodWithPets: row.good_with_pets,
    dateAdded:
      row.date_added instanceof Date
        ? row.date_added.toISOString().slice(0, 10)
        : row.date_added,
  };
};

export const mapShelter = (row, activeListings = 0, totalPets = 0) => {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    location: row.location,
    address: row.address,
    phone: row.phone,
    email: row.email,
    operatingHours: row.operating_hours,
    description: row.description,
    imageUrl: row.image_url,
    totalPets: Number(totalPets ?? row.total_pets ?? 0),
    activeListings: Number(activeListings ?? row.active_listings ?? 0),
  };
};

export const mapUser = (row) => {
  if (!row) return null;
  const user = {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    accountStatus: row.account_status ?? 'approved',
    isOwner: Boolean(row.is_owner),
  };
  if (row.shelter_id) user.shelterId = row.shelter_id;
  if (row.avatar_url) user.avatarUrl = row.avatar_url;
  return user;
};

export const mapShelterApplication = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    applicantName: row.applicant_name ?? null,
    applicantEmail: row.applicant_email ?? null,
    name: row.name,
    location: row.location,
    address: row.address,
    phone: row.phone,
    email: row.email,
    operatingHours: row.operating_hours,
    description: row.description,
    imageUrl: row.image_url ?? '',
    status: row.status,
    reviewNote: row.review_note ?? undefined,
    submittedAt: row.submitted_at,
    reviewedAt: row.reviewed_at ?? undefined,
  };
};

export const mapApplication = (row, history = []) => {
  if (!row) return null;
  return {
    id: row.id,
    petId: row.pet_id,
    applicantId: row.applicant_id,
    applicantName: row.applicant_name,
    email: row.email,
    phone: row.phone,
    address: row.address,
    housingType: row.housing_type,
    hasOtherPets: row.has_other_pets,
    experience: row.experience,
    reason: row.reason,
    status: row.status,
    submittedAt: row.submitted_at,
    updatedAt: row.updated_at,
    staffNotes: row.staff_notes ?? undefined,
    history: history.map((h) => ({
      status: h.status,
      date: h.created_at,
      ...(h.note ? { note: h.note } : {}),
    })),
  };
};

export const mapInquiry = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    petId: row.pet_id,
    fromName: row.from_name,
    fromEmail: row.from_email,
    message: row.message,
    resolved: row.resolved,
    createdAt: row.created_at,
  };
};

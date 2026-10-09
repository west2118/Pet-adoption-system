import { pool } from '../config/database.js';
import { AppError } from '../utils/AppError.js';
import { mapPet, mapShelter, mapWaiver, mapWaiverTemplate } from '../utils/mappers.js';
import { findPetById } from '../repositories/petRepository.js';
import { findShelterById as findShelterRowById } from '../repositories/shelterRepository.js';
import {
  createTemplate as createTemplateRow,
  findTemplateById,
  findWaiverByApplication,
  findWaiverById,
  listTemplatesByShelter,
  updateTemplate as updateTemplateRow,
  upsertWaiver,
} from '../repositories/waiverRepository.js';

// Default templates seeded per shelter on first use (mirrors the previous
// static catalogue so existing shelters keep familiar content).
const DEFAULT_TEMPLATES = [
  {
    name: 'Adoption Liability Waiver',
    category: 'Adoption',
    body: 'The adopter accepts full responsibility for the animal from the date of adoption, releases the shelter from liability for injury or damage caused by the animal, and agrees to provide adequate food, water, shelter, and veterinary care.',
  },
  {
    name: 'Foster Care Agreement',
    category: 'Foster',
    body: 'The foster caregiver agrees to house the animal temporarily, follow all medical and feeding instructions, return the animal on request, and promptly report illness, injury, or behavioral concerns to shelter staff.',
  },
  {
    name: 'Medical Disclosure Acknowledgment',
    category: 'Medical',
    body: 'The adopter acknowledges receipt of the animal’s known medical history, understands that undiscovered conditions may exist, and agrees to seek veterinary care for any ongoing or future treatment needs.',
  },
  {
    name: 'Photo & Story Release',
    category: 'Media',
    body: 'The adopter grants the shelter permission to use photos and adoption stories for promotional purposes, with the option to revoke consent in writing at any time.',
    status: 'Draft',
  },
  {
    name: 'Transport Waiver',
    category: 'Logistics',
    body: 'The volunteer transporter accepts responsibility for the animal during transit, agrees to use secure carriers or restraints, and releases the shelter from liability for incidents occurring en route.',
    status: 'Draft',
  },
];

export const listWaiverTemplates = async (shelterId, options = {}) => {
  let { rows, total } = await listTemplatesByShelter(shelterId, options);
  if (total === 0 && !options.search && !options.category) {
    for (const t of DEFAULT_TEMPLATES) {
      await createTemplateRow(shelterId, t);
    }
    const res = await listTemplatesByShelter(shelterId, options);
    rows = res.rows;
    total = res.total;
  }
  return { templates: rows.map((r) => mapWaiverTemplate(r)), total };
};

export const createWaiverTemplate = async (shelterId, input) => {
  const row = await createTemplateRow(shelterId, input);
  return mapWaiverTemplate(row);
};

export const updateWaiverTemplate = async (id, patch, shelterId) => {
  const current = await findTemplateById(id);
  if (!current) {
    throw new AppError('Waiver template not found.', 404);
  }
  if (current.shelter_id !== shelterId) {
    throw new AppError('Forbidden. Template belongs to another shelter.', 403);
  }
  const row = await updateTemplateRow(id, patch);
  return mapWaiverTemplate(row);
};

const WAIVER_ELIGIBLE_STATUSES = ['Approved', 'Adopted'];

export const generateWaiver = async (applicationId, shelterId, templateIds) => {
  const { rows } = await pool.query(
    `SELECT a.*, p.shelter_id
     FROM adoption_applications a
     JOIN pets p ON a.pet_id = p.id
     WHERE a.id = $1`,
    [applicationId],
  );
  const record = rows[0];
  if (!record) {
    throw new AppError('Application not found.', 404);
  }
  if (record.shelter_id !== shelterId) {
    throw new AppError('Forbidden. Application belongs to another shelter.', 403);
  }
  if (!WAIVER_ELIGIBLE_STATUSES.includes(record.status)) {
    throw new AppError(
      `E-waivers can only be generated for ${WAIVER_ELIGIBLE_STATUSES.join(' or ')} applications.`,
      400,
    );
  }

  const templates = [];
  for (const templateId of templateIds) {
    const template = await findTemplateById(templateId);
    if (!template) {
      throw new AppError('One or more waiver templates were not found.', 404);
    }
    if (template.shelter_id !== shelterId) {
      throw new AppError('Forbidden. Template belongs to another shelter.', 403);
    }
    templates.push(mapWaiverTemplate(template));
  }

  const petRow = await findPetById(record.pet_id);
  const shelterRow = await findShelterRowById(shelterId);
  const snapshot = {
    application: {
      id: record.id,
      applicantName: record.applicant_name,
      email: record.email,
      phone: record.phone,
      address: record.address,
      status: record.status,
    },
    pet: mapPet(petRow),
    shelter: mapShelter(shelterRow, shelterRow?.active_listings ?? 0, shelterRow?.total_pets ?? 0),
    templates: templates.map((t) => ({ id: t.id, name: t.name, category: t.category, body: t.body })),
    issuedAt: new Date().toISOString(),
  };

  const row = await upsertWaiver(applicationId, shelterId, JSON.stringify(snapshot));
  return mapWaiver(row);
};

export const getWaiver = async (waiverId, shelterId) => {
  const row = await findWaiverById(waiverId);
  if (!row) {
    throw new AppError('Waiver not found.', 404);
  }
  if (row.shelter_id !== shelterId) {
    throw new AppError('Forbidden. Waiver belongs to another shelter.', 403);
  }
  return mapWaiver(row);
};

export const getWaiverForApplication = async (applicationId, shelterId) => {
  const row = await findWaiverByApplication(applicationId);
  if (!row) {
    throw new AppError('No waiver has been generated for this application yet.', 404);
  }
  if (row.shelter_id !== shelterId) {
    throw new AppError('Forbidden. Waiver belongs to another shelter.', 403);
  }
  return mapWaiver(row);
};

export const getAdopterWaiver = async (applicationId, applicantId) => {
  const { rows } = await pool.query(
    'SELECT applicant_id FROM adoption_applications WHERE id = $1',
    [applicationId],
  );
  if (rows.length === 0) {
    throw new AppError('Application not found.', 404);
  }
  if (rows[0].applicant_id !== applicantId) {
    throw new AppError('Forbidden. Application belongs to another adopter.', 403);
  }
  const row = await findWaiverByApplication(applicationId);
  if (!row) {
    throw new AppError('No waiver has been generated for this application yet.', 404);
  }
  return mapWaiver(row);
};

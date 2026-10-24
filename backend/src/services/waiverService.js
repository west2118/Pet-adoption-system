import { pool } from '../config/database.js';
import { AppError } from '../utils/AppError.js';
import {
  mapPet,
  mapShelter,
  mapWaiver,
  mapWaiverTemplate,
  mapWaiverVersion,
} from '../utils/mappers.js';
import { findPetById } from '../repositories/petRepository.js';
import { findShelterById as findShelterRowById } from '../repositories/shelterRepository.js';
import { findUserById } from '../repositories/userRepository.js';
import {
  archiveWaiverVersion,
  createTemplate as createTemplateRow,
  deleteTemplate as deleteTemplateRow,
  findTemplateById,
  findWaiverByApplication,
  findWaiverByApplicationForUpdate,
  findWaiverById,
  insertGeneratedWaiver,
  listTemplatesByShelter,
  listWaiverVersionRows,
  signWaiverRecord,
  updateGeneratedWaiver,
  updateTemplate as updateTemplateRow,
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

const seedDefault = async (shelterId, template) => {
  await createTemplateRow(shelterId, { ...template, isDefault: true });
};

export const listWaiverTemplates = async (shelterId, options = {}) => {
  let { rows, total } = await listTemplatesByShelter(shelterId, options);
  if (total === 0 && !options.search && !options.category) {
    for (const t of DEFAULT_TEMPLATES) {
      await seedDefault(shelterId, t);
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
  if (current.is_default) {
    throw new AppError('Default templates cannot be edited or deactivated.', 403);
  }
  const row = await updateTemplateRow(id, patch);
  return mapWaiverTemplate(row);
};

/**
 * Shelter-created templates can be removed. Platform defaults are shared
 * reference documents and stay locked (no edit, no delete); already-issued
 * waivers keep their own snapshot, so deleting a template never alters them.
 */
export const deleteWaiverTemplate = async (id, shelterId) => {
  const current = await findTemplateById(id);
  if (!current) {
    throw new AppError('Waiver template not found.', 404);
  }
  if (current.shelter_id !== shelterId) {
    throw new AppError('Forbidden. Template belongs to another shelter.', 403);
  }
  if (current.is_default) {
    throw new AppError('Default templates cannot be deleted.', 403);
  }
  await deleteTemplateRow(id);
  return { id };
};

const WAIVER_ELIGIBLE_STATUSES = ['Approved', 'Adopted'];
const SIGN_ELIGIBLE_STATUSES = ['Approved', 'Adopted'];
const LIABILITY_CATEGORY = 'adoption';
const SIGNATURE_CONSENT_TEXT =
  'I have read, understood, and voluntarily agree to every provision in this waiver. ' +
  'I understand that typing my name is my electronic signature.';
const isLiabilityTemplate = (template) =>
  String(template.category ?? '').trim().toLowerCase() === LIABILITY_CATEGORY;

const parseSnapshot = (value) => {
  if (!value) return null;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }
  return value;
};

export const generateWaiver = async (applicationId, shelterId, templateIds, generatedBy) => {
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

  const uniqueTemplateIds = [...new Set(templateIds)];
  const templates = [];
  for (const templateId of uniqueTemplateIds) {
    const template = await findTemplateById(templateId);
    if (!template) {
      throw new AppError('One or more waiver templates were not found.', 404);
    }
    if (template.shelter_id !== shelterId) {
      throw new AppError('Forbidden. Template belongs to another shelter.', 403);
    }
    // Drafts are no longer a separate workflow — every template the shelter
    // created can be bundled into a waiver.
    templates.push(mapWaiverTemplate(template));
  }

  if (!templates.some(isLiabilityTemplate)) {
    throw new AppError(
      'A liability waiver (Adoption category) is required before an e-waiver can be issued.',
      400,
    );
  }

  const staff = await findUserById(generatedBy);
  const generatedByName = staff?.name ?? staff?.email ?? 'Shelter staff';
  const generatedAt = new Date().toISOString();
  const petRow = await findPetById(record.pet_id);
  const shelterRow = await findShelterRowById(shelterId);
  const baseSnapshot = {
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
    templates: templates.map((t) => ({
      id: t.id,
      name: t.name,
      category: t.category,
      body: t.body,
      isDefault: t.isDefault,
      updatedAt: t.updatedAt,
    })),
    issuedAt: generatedAt,
    generatedAt,
    generatedBy: { id: generatedBy, name: generatedByName },
  };

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Serialise concurrent regenerations for the same application so only one
    // version is archived per replacement.
    await client.query('SELECT id FROM adoption_applications WHERE id = $1 FOR UPDATE', [
      applicationId,
    ]);
    const current = await findWaiverByApplicationForUpdate(client, applicationId);
    if (current?.status === 'Signed') {
      throw new AppError(
        'This e-waiver has already been signed and is locked. It cannot be regenerated.',
        409,
      );
    }

    const version = current ? Number(current.version) + 1 : 1;
    const snapshot = JSON.stringify({ ...baseSnapshot, version });

    if (current) {
      await archiveWaiverVersion(client, current);
    }

    const row = current
      ? await updateGeneratedWaiver(client, {
          applicationId,
          snapshot,
          version,
          generatedAt,
          generatedBy,
          generatedByName,
        })
      : await insertGeneratedWaiver(client, {
          applicationId,
          shelterId,
          snapshot,
          version,
          generatedAt,
          generatedBy,
          generatedByName,
        });

    await client.query('COMMIT');
    return mapWaiver(row);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

export const signWaiver = async (applicationId, applicantId, { signatureName, consent }) => {
  if (!consent) {
    throw new AppError('You must confirm that you agree before signing.', 400);
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Lock the application row first, matching generateWaiver. This closes the
    // race where a regeneration could replace the snapshot between the status
    // check and the signature write.
    const { rows } = await client.query(
      `SELECT a.applicant_id, a.status, u.name, u.email
         FROM adoption_applications a
         JOIN users u ON u.id = a.applicant_id
        WHERE a.id = $1
        FOR UPDATE OF a`,
      [applicationId],
    );
    const record = rows[0];
    if (!record) {
      throw new AppError('Application not found.', 404);
    }
    if (record.applicant_id !== applicantId) {
      throw new AppError('Forbidden. Application belongs to another adopter.', 403);
    }
    if (!SIGN_ELIGIBLE_STATUSES.includes(record.status)) {
      throw new AppError('This application is no longer eligible for waiver signing.', 409);
    }

    const current = await findWaiverByApplicationForUpdate(client, applicationId);
    if (!current) {
      throw new AppError('No waiver has been generated for this application yet.', 404);
    }
    if (current.status === 'Signed') {
      throw new AppError('This e-waiver has already been signed.', 409);
    }

    const signedAt = new Date().toISOString();
    const snapshot = parseSnapshot(current.snapshot) ?? {};
    snapshot.signature = {
      name: signatureName.trim(),
      signedAt,
      signedByName: record.name ?? record.email,
      method: 'typed',
      consent: true,
      consentText: SIGNATURE_CONSENT_TEXT,
    };

    const row = await signWaiverRecord(
      current.id,
      {
        snapshot: JSON.stringify(snapshot),
        signedBy: applicantId,
        signedByName: record.name ?? record.email,
        signatureName: signatureName.trim(),
      },
      client,
    );
    if (!row) {
      throw new AppError('This e-waiver has already been signed.', 409);
    }

    await client.query('COMMIT');
    return mapWaiver(row);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

export const listWaiverVersions = async (applicationId, shelterId) => {
  const current = await findWaiverByApplication(applicationId);
  if (!current) {
    throw new AppError('No waiver has been generated for this application yet.', 404);
  }
  if (current.shelter_id !== shelterId) {
    throw new AppError('Forbidden. Waiver belongs to another shelter.', 403);
  }

  const archived = await listWaiverVersionRows(current.id);
  return [
    mapWaiverVersion(current, true),
    ...archived.map((row) => mapWaiverVersion(row, false)),
  ];
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

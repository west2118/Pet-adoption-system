import { getSystemStats, listAllPets, listAllUsers, setUserRole } from '../services/adminService.js';
import { sendSuccess, buildMeta } from '../utils/respond.js';
import { parsePagination } from '../validators/commonValidator.js';

export const getStats = async (_req, res) => {
  const stats = await getSystemStats();
  return sendSuccess(res, { stats });
};

export const getUsers = async (req, res) => {
  const { page, limit, offset } = parsePagination(req.query);
  const { users, total } = await listAllUsers({ limit, offset });
  return sendSuccess(res, { users }, undefined, buildMeta(page, limit, total));
};

export const changeRole = async (req, res) => {
  const user = await setUserRole(
    req.params.id,
    req.body.role,
    req.body.shelterId ?? null,
  );
  return sendSuccess(res, { user }, 'User role updated successfully.');
};

export const getAllPets = async (req, res) => {
  const { page, limit, offset } = parsePagination(req.query);
  const { pets, total } = await listAllPets({ limit, offset });
  return sendSuccess(res, { pets }, undefined, buildMeta(page, limit, total));
};

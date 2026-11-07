import {
  addShelterUser,
  editShelterUser,
  listShelterUsers,
  removeShelterUser,
} from '../services/shelterUserService.js';
import { buildMeta, sendSuccess } from '../utils/respond.js';
import { parsePagination } from '../validators/commonValidator.js';

export const getShelterUsers = async (req, res) => {
  const { page, limit, offset } = parsePagination(req.query);
  const search = req.query.search || undefined;
  const { users, total } = await listShelterUsers(req.user.shelterId, {
    limit,
    offset,
    search,
  });
  return sendSuccess(res, { users }, undefined, buildMeta(page, limit, total));
};

export const createShelterUser = async (req, res) => {
  const user = await addShelterUser(req.user.shelterId, req.body);
  return sendSuccess(res, { user }, 'User created successfully.', undefined, 201);
};

export const updateShelterUser = async (req, res) => {
  const user = await editShelterUser(
    req.user.shelterId,
    req.params.id,
    req.body,
    req.user.id,
  );
  return sendSuccess(res, { user }, 'User updated successfully.');
};

export const deleteShelterUser = async (req, res) => {
  await removeShelterUser(req.user.shelterId, req.params.id, req.user.id);
  return sendSuccess(res, null, 'User removed successfully.');
};

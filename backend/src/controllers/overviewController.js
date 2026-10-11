import { getShelterOverview } from '../services/overviewService.js';
import { sendSuccess } from '../utils/respond.js';

export const getOverview = async (req, res) => {
  const overview = await getShelterOverview(req.user.shelterId);
  return sendSuccess(res, { overview });
};

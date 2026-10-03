import { getMe, login, signup } from '../services/authService.js';
import { sendSuccess } from '../utils/respond.js';

export const signupUser = async (req, res) => {
  const { user, token } = await signup(req.body);
  return sendSuccess(res, { user, token }, 'Account created successfully.', undefined, 201);
};

export const loginUser = async (req, res) => {
  const result = await login(req.body);
  return sendSuccess(res, result, 'Logged in successfully.');
};

export const getCurrentUser = async (req, res) => {
  const user = await getMe(req.user.id);
  return sendSuccess(res, { user });
};

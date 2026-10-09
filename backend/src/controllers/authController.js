import { getMe, login, signup, updateProfile } from '../services/authService.js';
import { sendSuccess } from '../utils/respond.js';

export const signupUser = async (req, res) => {
  const result = await signup(req.body);
  const message = result.requiresOnboarding
    ? 'Account created. Complete your shelter details to continue.'
    : 'Account created successfully.';
  return sendSuccess(res, result, message, undefined, 201);
};

export const loginUser = async (req, res) => {
  const result = await login(req.body);
  return sendSuccess(res, result, 'Logged in successfully.');
};

export const getCurrentUser = async (req, res) => {
  const user = await getMe(req.user.id);
  return sendSuccess(res, { user });
};

export const updateCurrentUser = async (req, res) => {
  const user = await updateProfile(req.user.id, req.body);
  return sendSuccess(res, { user }, 'Profile updated successfully.');
};

import { getMe, login, logoutSession, refreshSession as rotateUserSession, signup, updateProfile } from '../services/authService.js';
import {
  clearAuthCookies,
  getCookie,
  REFRESH_COOKIE,
  setAuthCookies,
} from '../services/sessionService.js';
import { sendSuccess } from '../utils/respond.js';

export const signupUser = async (req, res) => {
  const result = await signup(req.body);
  const { refreshToken, ...body } = result;
  if (refreshToken) {
    setAuthCookies(res, { accessToken: result.token, refreshToken });
  }
  const message = result.requiresOnboarding
    ? 'Account created. Complete your shelter details to continue.'
    : 'Account created successfully.';
  return sendSuccess(res, body, message, undefined, 201);
};

export const loginUser = async (req, res) => {
  const result = await login(req.body);
  setAuthCookies(res, { accessToken: result.token, refreshToken: result.refreshToken });
  return sendSuccess(res, { user: result.user, token: result.token }, 'Logged in successfully.');
};

export const getCurrentUser = async (req, res) => {
  const user = await getMe(req.user.id);
  return sendSuccess(res, { user });
};

export const updateCurrentUser = async (req, res) => {
  const user = await updateProfile(req.user.id, req.body);
  return sendSuccess(res, { user }, 'Profile updated successfully.');
};

export const refreshSession = async (req, res) => {
  const result = await rotateUserSession(getCookie(req, REFRESH_COOKIE));
  setAuthCookies(res, { accessToken: result.accessToken, refreshToken: result.refreshToken });
  return sendSuccess(res, { user: result.user }, 'Session refreshed.');
};

export const logoutUser = async (req, res) => {
  const result = await logoutSession(getCookie(req, REFRESH_COOKIE));
  clearAuthCookies(res);
  return sendSuccess(res, result, 'Logged out successfully.');
};

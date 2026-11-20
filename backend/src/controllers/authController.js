import {
  getMe,
  login,
  logoutSession,
  refreshSession as rotateUserSession,
  requestPasswordReset,
  resetPassword,
  resendLoginOtp,
  resendSignupOtp,
  signup,
  updateProfile,
  verifyLoginOtp,
  verifyPasswordResetCode,
  verifySignupOtp,
} from '../services/authService.js';
import {
  clearAuthCookies,
  clearOnboardingCookie,
  getCookie,
  REFRESH_COOKIE,
  setAuthCookies,
  setOnboardingCookie,
} from '../services/sessionService.js';
import { extractClientIp } from '../utils/locationDetector.js';
import { sendSuccess } from '../utils/respond.js';

export const signupUser = async (req, res) => {
  const result = await signup(req.body);
  return sendSuccess(
    res,
    result,
    'A 6-digit verification code has been sent to your email to verify your account.',
    undefined,
    200,
  );
};

export const verifySignupOtpHandler = async (req, res) => {
  const result = await verifySignupOtp(req.body);
  const { refreshToken, token, onboardingToken, ...body } = result;
  if (refreshToken) {
    setAuthCookies(res, { accessToken: token, refreshToken });
  } else if (onboardingToken) {
    setOnboardingCookie(res, onboardingToken);
  }
  const message = result.requiresOnboarding
    ? 'Account created. Complete your shelter details to continue.'
    : 'Account verified and created successfully.';
  return sendSuccess(res, body, message, undefined, 201);
};

export const resendSignupOtpHandler = async (req, res) => {
  const result = await resendSignupOtp(req.body);
  return sendSuccess(res, result, result.message);
};

export const loginUser = async (req, res) => {
  const ip = extractClientIp(req);
  const result = await login(req.body, {
    ip,
    clientLocation: req.body.clientLocation || req.headers['x-client-location'],
  });

  if (result.mfaRequired) {
    return sendSuccess(
      res,
      {
        mfaRequired: true,
        challengeId: result.challengeId,
        email: result.email,
        location: result.location,
      },
      'Suspicious login detected. A 6-digit verification code was sent to your email.',
    );
  }

  setAuthCookies(res, { accessToken: result.token, refreshToken: result.refreshToken });
  clearOnboardingCookie(res);
  return sendSuccess(res, { user: result.user }, 'Logged in successfully.');
};

export const verifyOtpHandler = async (req, res) => {
  const result = await verifyLoginOtp(req.body);
  setAuthCookies(res, { accessToken: result.token, refreshToken: result.refreshToken });
  clearOnboardingCookie(res);
  return sendSuccess(res, { user: result.user }, 'Verification successful. Welcome back!');
};

export const resendOtpHandler = async (req, res) => {
  const result = await resendLoginOtp(req.body);
  return sendSuccess(res, result, result.message);
};


export const requestPasswordResetHandler = async (req, res) => {
  const result = await requestPasswordReset(req.body);
  return sendSuccess(
    res,
    result,
    'If an account exists for that email, a 6-digit reset code has been sent.',
  );
};

export const verifyResetCodeHandler = async (req, res) => {
  const result = await verifyPasswordResetCode(req.body);
  return sendSuccess(res, result, 'Reset code verified. Choose a new password.');
};

export const resetPasswordHandler = async (req, res) => {
  const result = await resetPassword(req.body);
  // Any leftover session cookies belong to the old password.
  clearAuthCookies(res);
  return sendSuccess(res, result, 'Your password has been reset. You can now sign in.');
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

import { Request, Response, NextFunction } from 'express';
import {
  registerUser,
  loginUser,
  refreshUserToken,
  logoutUser,
  logoutAllDevices,
  logoutDevice,
  getSessions,
  loginWithGoogle,
  getMe,
} from '../services/auth/authService';
import { logSecurityEvent } from '../services/security/securityAuditService';
import { verifyEmailByToken, resendEmailVerification } from '../services/auth/emailVerificationService';
import { requestPasswordReset, resetPassword } from '../services/auth/passwordResetService';

export const registerController = async (req: Request, res: Response, next: NextFunction) => {
  const { email, password, name } = req.body;
  const userAgent = req.headers['user-agent'];

  try {
    const result = await registerUser({
      email,
      password,
      name,
      deviceInfo: userAgent,
      userAgent,
      ipAddress: req.ip,
    });

    await logSecurityEvent({
      userId: result.user.id,
      eventType: 'register_success',
      ipAddress: req.ip,
      userAgent,
      metadata: { email },
    });

    return res.json(result);
  } catch (err: any) {
    await logSecurityEvent({
      eventType: 'register_failed',
      ipAddress: req.ip,
      userAgent,
      metadata: {
        email,
        reason: err.code || err.message,
      },
    });

    if (err.code === 'EMAIL_ALREADY_EXISTS') {
      return res.status(400).json({ error: 'Email already exists' });
    }

    if (err.code === 'VALIDATION_ERROR') {
      return res.status(400).json({ error: err.message });
    }

    next(err);
  }
};

export const loginController = async (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;
  const userAgent = req.headers['user-agent'];

  try {
    const result = await loginUser({
      email,
      password,
      deviceInfo: userAgent,
      userAgent,
      ipAddress: req.ip,
    });

    await logSecurityEvent({
      userId: result.user.id,
      eventType: 'login_success',
      ipAddress: req.ip,
      userAgent,
      metadata: { email },
    });

    return res.json(result);
  } catch (err: any) {
    await logSecurityEvent({
      eventType: 'login_failed',
      ipAddress: req.ip,
      userAgent,
      metadata: {
        email,
        reason: err.code || err.message,
      },
    });

    if (err.code === 'VALIDATION_ERROR') {
      return res.status(400).json({ error: err.message });
    }

    if (err.code === 'USER_NOT_FOUND') {
      return res.status(400).json({ error: 'User not found' });
    }

    if (err.code === 'INVALID_PASSWORD') {
      return res.status(400).json({ error: 'Invalid password' });
    }

    next(err);
  }
};

export const googleLoginController = async (req: Request, res: Response, next: NextFunction) => {
  const { idToken } = req.body;
  const userAgent = req.headers['user-agent'];

  try {
    const result = await loginWithGoogle({
      idToken,
      deviceInfo: userAgent,
      userAgent,
      ipAddress: req.ip,
    });

    await logSecurityEvent({
      userId: result.user.id,
      eventType: 'google_login_success',
      ipAddress: req.ip,
      userAgent,
      metadata: {
        email: result.user.email,
      },
    });

    return res.json(result);
  } catch (err: any) {
    await logSecurityEvent({
      eventType: 'google_login_failed',
      ipAddress: req.ip,
      userAgent,
      metadata: {
        reason: err.code || err.message,
      },
    });

    if (err.code === 'GOOGLE_TOKEN_REQUIRED') {
      return res.status(400).json({ error: 'Google token required' });
    }

    if (err.code === 'GOOGLE_AUTH_FAILED') {
      return res.status(401).json({ error: 'Google auth failed' });
    }

    next(err);
  }
};

export const refreshController = async (req: Request, res: Response, next: NextFunction) => {
  const userAgent = req.headers['user-agent'];

  try {
    const { refreshToken } = req.body;

    const result = await refreshUserToken(refreshToken);

    await logSecurityEvent({
      eventType: 'refresh_success',
      ipAddress: req.ip,
      userAgent,
    });

    return res.json(result);
  } catch (err: any) {
    await logSecurityEvent({
      eventType: 'refresh_failed',
      ipAddress: req.ip,
      userAgent,
      metadata: {
        reason: err.code || err.message,
      },
    });

    if (err.code === 'REFRESH_TOKEN_REQUIRED') {
      return res.status(400).json({ error: 'Refresh token required' });
    }

    if (err.code === 'INVALID_REFRESH_TOKEN') {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    next(err);
  }
};

export const logoutController = async (req: Request, res: Response, next: NextFunction) => {
  const userAgent = req.headers['user-agent'];

  try {
    const { refreshToken } = req.body;

    await logoutUser(refreshToken);

    await logSecurityEvent({
      eventType: 'logout',
      ipAddress: req.ip,
      userAgent,
    });

    return res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

export const getSessionsController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const sessions = await getSessions(req.user.id);

    return res.json({ sessions });
  } catch (err) {
    next(err);
  }
};

export const logoutAllDevicesController = async (req: Request, res: Response, next: NextFunction) => {
  const userAgent = req.headers['user-agent'];

  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await logoutAllDevices(req.user.id);

    await logSecurityEvent({
      userId: req.user.id,
      eventType: 'logout_all',
      ipAddress: req.ip,
      userAgent,
    });

    return res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

export const logoutDeviceController = async (req: Request, res: Response, next: NextFunction) => {
  const userAgent = req.headers['user-agent'];

  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { sessionId } = req.params;

    await logoutDevice(req.user.id, sessionId);

    await logSecurityEvent({
      userId: req.user.id,
      eventType: 'logout_device',
      ipAddress: req.ip,
      userAgent,
      metadata: { sessionId },
    });

    return res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

export const verifyEmailController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = String(req.query.token || req.body.token || '');

    const result = await verifyEmailByToken(res, token);

    await logSecurityEvent({
      eventType: 'email_verified',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.json(result);
  } catch (err: any) {
    if (err.message === 'EMAIL_VERIFICATION_TOKEN_REQUIRED') {
      return res.status(400).json({ error: 'Verification token required' });
    }

    if (err.message === 'EMAIL_VERIFICATION_TOKEN_INVALID') {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    next(err);
  }
};

export const resendEmailVerificationController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const result = await resendEmailVerification(req.user.id);

    await logSecurityEvent({
      userId: req.user.id,
      eventType: 'email_verification_sent',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.json(result);
  } catch (err: any) {
    await logSecurityEvent({
      userId: req.user?.id || null,
      eventType: 'email_verification_failed',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      metadata: {
        reason: err.message,
      },
    });

    next(err);
  }
};

export const requestPasswordResetController = async (req: Request, res: Response, next: NextFunction) => {
  const { email } = req.body;
  const userAgent = req.headers['user-agent'];

  try {
    const result = await requestPasswordReset(email);

    await logSecurityEvent({
      eventType: 'password_reset_requested',
      ipAddress: req.ip,
      userAgent,
      metadata: { email },
    });

    return res.json({
      success: result.success,
      message: 'If this email exists, reset instructions were sent.',
    });
  } catch (err: any) {
    await logSecurityEvent({
      eventType: 'password_reset_request_failed',
      ipAddress: req.ip,
      userAgent,
      metadata: {
        email,
        reason: err.message,
      },
    });

    next(err);
  }
};

export const resetPasswordController = async (req: Request, res: Response, next: NextFunction) => {
  const userAgent = req.headers['user-agent'];

  try {
    const token = String(req.body.token || req.query.token || '');
    const { newPassword } = req.body;

    const result = await resetPassword({
      token,
      newPassword,
    });

    await logSecurityEvent({
      eventType: 'password_reset_success',
      ipAddress: req.ip,
      userAgent,
    });

    return res.json(result);
  } catch (err: any) {
    await logSecurityEvent({
      eventType: 'password_reset_failed',
      ipAddress: req.ip,
      userAgent,
      metadata: {
        reason: err.message,
      },
    });

    if (err.message === 'PASSWORD_RESET_TOKEN_REQUIRED') {
      return res.status(400).json({ error: 'Reset token required' });
    }

    if (err.message === 'PASSWORD_RESET_TOKEN_INVALID') {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    if (err.message === 'PASSWORD_TOO_SHORT') {
      return res.status(400).json({ error: 'Password is too short' });
    }

    next(err);
  }
};

export const getMeController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await getMe(req.user.id);

    return res.json({ user });
  } catch (err) {
    next(err);
  }
};

import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { authRateLimit, loginRateLimit, refreshRateLimit } from '../middleware/authRateLimit';
import {
  registerController,
  loginController,
  googleLoginController,
  refreshController,
  logoutController,
  getSessionsController,
  logoutAllDevicesController,
  logoutDeviceController,
  verifyEmailController,
  resendEmailVerificationController,
  requestPasswordResetController,
  resetPasswordController,
  getMeController,
} from '../controllers/authController';

const router = Router();

router.post('/register', authRateLimit, registerController);
router.post('/login', loginRateLimit, loginController);
router.post('/google', authRateLimit, googleLoginController);
router.post('/refresh', refreshRateLimit, refreshController);
router.post('/logout', logoutController);

router.get('/sessions', authenticate, getSessionsController);
router.post('/logout-all', authenticate, logoutAllDevicesController);
router.post('/logout-device/:sessionId', authenticate, logoutDeviceController);

router.get('/verify-email', verifyEmailController);
router.post('/verify-email', verifyEmailController);

router.post('/send-verification-email', authenticate, resendEmailVerificationController);

router.post('/forgot-password', authRateLimit, requestPasswordResetController);
router.post('/reset-password', authRateLimit, resetPasswordController);
router.get('/me', authenticate, getMeController);
export default router;

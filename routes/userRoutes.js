const express = require('express');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
const bookingRoutes = require('./bookingRoutes');

const router = express.Router();

// 2F Authentication
// router.post('/2fa/verify', authController.verifyTwoFactorAuthenticationQRCode);

router.use('/:id/bookings', bookingRoutes);

router.post('/signup', authController.signup);
router.post('/login', authController.verify, authController.login);
router.get('/logout', authController.protect, authController.logout);
router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);
router.get('/confirmEmail/:token', authController.confirmEmail);
router.post(
  '/resendEmail',
  authController.restrictToNoEmailConfirmed,
  authController.resendConfirmationEmail
);

// Protect all routes after this middleware
router.use(authController.protect);

// 2F Authentication
router.post(
  '/2fa/generate',
  authController.passwordIsNeeded,
  authController.generateTwoFactorAuthenticationQRCode
);

router.post(
  '/2fa/disable',
  authController.passwordIsNeeded,
  authController.DisableTwoFactorAuthenticationQRCode
);

router.patch('/updateMyPassword', authController.updatePassword);
router.get('/me', userController.getMe, userController.getUser);
router.patch(
  '/updateMe',
  userController.uploadUserPhoto,
  userController.resizeUserPhoto,
  userController.updateMe
);
router.delete('/deleteMe', userController.deleteMe);

router.use(authController.restrictTo('admin'));

router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;

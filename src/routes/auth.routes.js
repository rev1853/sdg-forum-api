const express = require('express');
const loginController = require('../controllers/auth/loginController');
const registerController = require('../controllers/auth/registerController');
const googleAuthController = require('../controllers/auth/googleAuthController');
const requestPasswordResetController = require('../controllers/auth/requestPasswordResetController');
const resetPasswordController = require('../controllers/auth/resetPasswordController');

const router = express.Router();

/**
 * @openapi
 * /auth/register:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Register a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - username
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               username:
 *                 type: string
 *               name:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 */
router.post('/register', registerController);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Log in with email or username
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - identifier
 *               - password
 *             properties:
 *               identifier:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: User authenticated successfully
 */
router.post('/login', loginController);

/**
 * @openapi
 * /auth/google:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Authenticate with Google ID token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - idToken
 *             properties:
 *               idToken:
 *                 type: string
 *                 description: Google ID token obtained from the frontend
 *     responses:
 *       200:
 *         description: Authenticated via Google
 */
router.post('/google', googleAuthController);

/**
 * @openapi
 * /auth/reset-password/request:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Verify email and issue reset token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Reset token generated
 */
router.post('/reset-password/request', requestPasswordResetController);

/**
 * @openapi
 * /auth/reset-password/confirm:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Reset password using token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - password
 *             properties:
 *               token:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset successfully
 */
router.post('/reset-password/confirm', resetPasswordController);

module.exports = router;

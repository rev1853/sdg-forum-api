const express = require('express');
const authenticate = require('../middleware/authenticate');
const upload = require('../middleware/uploadMedia');
const getUserController = require('../controllers/users/getUserController');
const updateUserController = require('../controllers/users/updateUserController');
const listUserThreadsController = require('../controllers/users/listUserThreadsController');
const listUserRepostsController = require('../controllers/users/listUserRepostsController');

const router = express.Router();

/**
 * @openapi
 * /users/{userId}:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get user details
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User detail
 */
router.get('/:userId', getUserController);

/**
 * @openapi
 * /users/{userId}:
 *   patch:
 *     tags:
 *       - Users
 *     summary: Update user profile
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               username:
 *                 type: string
 *               name:
 *                 type: string
 *               removeProfilePicture:
 *                 type: boolean
 *               profilePicture:
 *                 type: string
 *                 format: binary
 *                 description: New profile picture image
 *     responses:
 *       200:
 *         description: Updated user profile
 */
router.patch('/:userId', authenticate, upload.single('profilePicture'), updateUserController);

/**
 * @openapi
 * /users/{userId}/threads:
 *   get:
 *     tags:
 *       - Users
 *     summary: List threads created by a user
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: User threads list
 */
router.get('/:userId/threads', listUserThreadsController);

/**
 * @openapi
 * /users/{userId}/reposts:
 *   get:
 *     tags:
 *       - Users
 *     summary: List threads reposted by a user
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: User reposts list
 */
router.get('/:userId/reposts', listUserRepostsController);

module.exports = router;

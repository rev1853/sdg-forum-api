const express = require('express');
const listUserThreadsController = require('../controllers/users/listUserThreadsController');
const listUserRepostsController = require('../controllers/users/listUserRepostsController');

const router = express.Router();

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

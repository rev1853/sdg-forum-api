const express = require('express');
const authenticate = require('../middleware/authenticate');
const upload = require('../middleware/uploadMedia');
const createThreadController = require('../controllers/threads/createThreadController');
const listThreadsController = require('../controllers/threads/listThreadsController');
const getThreadController = require('../controllers/threads/getThreadController');
const updateThreadStatusController = require('../controllers/threads/updateThreadStatusController');

const router = express.Router();

/**
 * @openapi
 * /forums/{slug}/threads:
 *   post:
 *     tags:
 *       - Threads
 *     summary: Create a thread in a forum
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: slug
 *         schema:
 *           type: string
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - body
 *             properties:
 *               body:
 *                 type: string
 *               media:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Thread created
 */
router.post('/forums/:slug/threads', authenticate, upload.single('media'), createThreadController);

/**
 * @openapi
 * /forums/{slug}/threads:
 *   get:
 *     tags:
 *       - Threads
 *     summary: List threads for a forum
 *     parameters:
 *       - in: path
 *         name: slug
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
 *         description: Threads list
 */
router.get('/forums/:slug/threads', listThreadsController);

/**
 * @openapi
 * /threads/{threadId}:
 *   get:
 *     tags:
 *       - Threads
 *     summary: Get thread details
 *     parameters:
 *       - in: path
 *         name: threadId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thread detail
 */
router.get('/threads/:threadId', getThreadController);

/**
 * @openapi
 * /threads/{threadId}/status:
 *   patch:
 *     tags:
 *       - Moderation
 *     summary: Update thread status
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: threadId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, REMOVED]
 *     responses:
 *       200:
 *         description: Status updated
 */
router.patch('/threads/:threadId/status', authenticate, updateThreadStatusController);

module.exports = router;


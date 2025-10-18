const express = require('express');
const authenticate = require('../middleware/authenticate');
const upload = require('../middleware/uploadMedia');
const createThreadController = require('../controllers/threads/createThreadController');
const replyThreadController = require('../controllers/threads/replyThreadController');
const listThreadsController = require('../controllers/threads/listThreadsController');
const getThreadController = require('../controllers/threads/getThreadController');
const listThreadRepliesController = require('../controllers/threads/listThreadRepliesController');
const likeThreadController = require('../controllers/threads/likeThreadController');
const unlikeThreadController = require('../controllers/threads/unlikeThreadController');
const repostThreadController = require('../controllers/threads/repostThreadController');
const unrepostThreadController = require('../controllers/threads/unrepostThreadController');
const reportThreadController = require('../controllers/threads/reportThreadController');

const router = express.Router();

/**
 * @openapi
 * /threads:
 *   post:
 *     tags:
 *       - Threads
 *     summary: Create a new top-level thread
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - body
 *               - categoryIds
 *             properties:
 *               title:
 *                 type: string
 *               body:
 *                 type: string
 *               categoryIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Thread created
 */
router.post('/', authenticate, upload.single('image'), createThreadController);

/**
 * @openapi
 * /threads/{threadId}/replies:
 *   post:
 *     tags:
 *       - Threads
 *     summary: Reply to a thread
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: threadId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - body
 *             properties:
 *               title:
 *                 type: string
 *               body:
 *                 type: string
 *               categoryIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Reply created
 */
router.post('/:threadId/replies', authenticate, upload.single('image'), replyThreadController);

/**
 * @openapi
 * /threads:
 *   get:
 *     tags:
 *       - Threads
 *     summary: List threads
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *       - in: query
 *         name: tags
 *         schema:
 *           type: string
 *         description: Comma separated list of tags
 *       - in: query
 *         name: categories
 *         schema:
 *           type: string
 *         description: Comma separated list of category IDs
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search threads by title
 *     responses:
 *       200:
 *         description: Threads list
 */
router.get('/', listThreadsController);

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
router.get('/:threadId', getThreadController);

/**
 * @openapi
 * /threads/{threadId}/replies:
 *   get:
 *     tags:
 *       - Threads
 *     summary: List replies for a thread
 *     parameters:
 *       - in: path
 *         name: threadId
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
 *         description: Replies list
 */
router.get('/:threadId/replies', listThreadRepliesController);

/**
 * @openapi
 * /threads/{threadId}/like:
 *   post:
 *     tags:
 *       - Interactions
 *     summary: Like a thread
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: threadId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Thread liked
 */
router.post('/:threadId/like', authenticate, likeThreadController);

/**
 * @openapi
 * /threads/{threadId}/like:
 *   delete:
 *     tags:
 *       - Interactions
 *     summary: Remove like from a thread
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: threadId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Like removed
 */
router.delete('/:threadId/like', authenticate, unlikeThreadController);

/**
 * @openapi
 * /threads/{threadId}/repost:
 *   post:
 *     tags:
 *       - Interactions
 *     summary: Repost a thread
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: threadId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Thread reposted
 */
router.post('/:threadId/repost', authenticate, repostThreadController);

/**
 * @openapi
 * /threads/{threadId}/repost:
 *   delete:
 *     tags:
 *       - Interactions
 *     summary: Remove repost from a thread
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: threadId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Repost removed
 */
router.delete('/:threadId/repost', authenticate, unrepostThreadController);

/**
 * @openapi
 * /threads/{threadId}/report:
 *   post:
 *     tags:
 *       - Moderation
 *     summary: Report a thread
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: threadId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reasonCode
 *             properties:
 *               reasonCode:
 *                 type: string
 *               message:
 *                 type: string
 *     responses:
 *       201:
 *         description: Report submitted
 */
router.post('/:threadId/report', authenticate, reportThreadController);

module.exports = router;

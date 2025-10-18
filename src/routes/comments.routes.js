const express = require('express');
const authenticate = require('../middleware/authenticate');
const createCommentController = require('../controllers/comments/createCommentController');
const updateCommentStatusController = require('../controllers/comments/updateCommentStatusController');

const router = express.Router();

/**
 * @openapi
 * /threads/{threadId}/comments:
 *   post:
 *     tags:
 *       - Comments
 *     summary: Create a comment on a thread
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
 *               - body
 *             properties:
 *               body:
 *                 type: string
 *     responses:
 *       201:
 *         description: Comment created
 */
router.post('/threads/:threadId/comments', authenticate, createCommentController);

/**
 * @openapi
 * /comments/{commentId}/status:
 *   patch:
 *     tags:
 *       - Moderation
 *     summary: Update comment status
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
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
 *         description: Comment status updated
 */
router.patch('/comments/:commentId/status', authenticate, updateCommentStatusController);

module.exports = router;


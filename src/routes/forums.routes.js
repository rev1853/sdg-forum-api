const express = require('express');
const authenticate = require('../middleware/authenticate');
const createForumController = require('../controllers/forums/createForumController');
const deleteForumController = require('../controllers/forums/deleteForumController');
const followForumController = require('../controllers/forums/followForumController');
const unfollowForumController = require('../controllers/forums/unfollowForumController');
const updateModeratorController = require('../controllers/forums/updateModeratorController');

const router = express.Router();

/**
 * @openapi
 * /forums:
 *   post:
 *     tags:
 *       - Forums
 *     summary: Create a new forum
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               categoryIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Forum created
 */
router.post('/', authenticate, createForumController);

/**
 * @openapi
 * /forums/{slug}:
 *   delete:
 *     tags:
 *       - Forums
 *     summary: Soft delete a forum
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Forum removed
 */
router.delete('/:slug', authenticate, deleteForumController);

/**
 * @openapi
 * /forums/{slug}/follow:
 *   post:
 *     tags:
 *       - Forums
 *     summary: Follow a forum
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Followed
 */
router.post('/:slug/follow', authenticate, followForumController);

/**
 * @openapi
 * /forums/{slug}/follow:
 *   delete:
 *     tags:
 *       - Forums
 *     summary: Unfollow a forum
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Unfollowed
 */
router.delete('/:slug/follow', authenticate, unfollowForumController);

/**
 * @openapi
 * /forums/{slug}/moderators/{userId}:
 *   patch:
 *     tags:
 *       - Forums
 *     summary: Promote or demote a follower to moderator
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: userId
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
 *               - isModerator
 *             properties:
 *               isModerator:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Moderator status updated
 */
router.patch('/:slug/moderators/:userId', authenticate, updateModeratorController);

module.exports = router;


const express = require('express');
const authenticate = require('../middleware/authenticate');
const createGroupController = require('../controllers/chat/createGroupController');
const listGroupsController = require('../controllers/chat/listGroupsController');
const getGroupController = require('../controllers/chat/getGroupController');
const joinGroupController = require('../controllers/chat/joinGroupController');
const leaveGroupController = require('../controllers/chat/leaveGroupController');
const listMessagesController = require('../controllers/chat/listMessagesController');

const router = express.Router();

/**
 * @openapi
 * /chat/groups:
 *   get:
 *     tags:
 *       - Chat
 *     summary: List available chat groups
 *     parameters:
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
 *         description: Paginated list of chat groups
 */
router.get('/groups', listGroupsController);

/**
 * @openapi
 * /chat/groups:
 *   post:
 *     tags:
 *       - Chat
 *     summary: Create a new chat group
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - categoryIds
 *             properties:
 *               name:
 *                 type: string
 *               categoryIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: 1-3 category IDs
 *     responses:
 *       201:
 *         description: Chat group created
 */
router.post('/groups', authenticate, createGroupController);

/**
 * @openapi
 * /chat/groups/{groupId}:
 *   get:
 *     tags:
 *       - Chat
 *     summary: Get chat group details
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Chat group detail
 */
router.get('/groups/:groupId', getGroupController);

/**
 * @openapi
 * /chat/groups/{groupId}/join:
 *   post:
 *     tags:
 *       - Chat
 *     summary: Join a chat group
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Joined successfully
 */
router.post('/groups/:groupId/join', authenticate, joinGroupController);

/**
 * @openapi
 * /chat/groups/{groupId}/join:
 *   delete:
 *     tags:
 *       - Chat
 *     summary: Leave a chat group
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Left successfully
 */
router.delete('/groups/:groupId/join', authenticate, leaveGroupController);

/**
 * @openapi
 * /chat/groups/{groupId}/messages:
 *   get:
 *     tags:
 *       - Chat
 *     summary: List messages in a chat group
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: after
 *         schema:
 *           type: string
 *         description: Fetch messages with ID greater than this value
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Messages list
 */
router.get('/groups/:groupId/messages', authenticate, listMessagesController);

module.exports = router;

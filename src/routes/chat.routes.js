const express = require('express');
const authenticate = require('../middleware/authenticate');
const listGroupsController = require('../controllers/chat/listGroupsController');
const getGroupController = require('../controllers/chat/getGroupController');
const listMessagesController = require('../controllers/chat/listMessagesController');

const router = express.Router();

/**
 * @openapi
 * /chat/groups:
 *   get:
 *     tags:
 *       - Chat
 *     summary: List available SDG chat groups (predefined)
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ChatGroup'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/groups', listGroupsController);

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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 group:
 *                   $ref: '#/components/schemas/ChatGroup'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/groups/:groupId', getGroupController);

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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 messages:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ChatMessage'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/groups/:groupId/messages', authenticate, listMessagesController);

module.exports = router;

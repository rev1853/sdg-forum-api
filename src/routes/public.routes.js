const express = require('express');
const listForumsController = require('../controllers/forums/listForumsController');
const getForumController = require('../controllers/forums/getForumController');

const router = express.Router();

/**
 * @openapi
 * /forums:
 *   get:
 *     tags:
 *       - Forums
 *     summary: List forums
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
 *         description: Forums list
 */
router.get('/forums', listForumsController);

/**
 * @openapi
 * /forums/{slug}:
 *   get:
 *     tags:
 *       - Forums
 *     summary: Retrieve forum detail
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Forum detail
 */
router.get('/forums/:slug', getForumController);

module.exports = router;


const express = require('express');
const listCategoriesController = require('../controllers/categories/listCategoriesController');

const router = express.Router();

/**
 * @openapi
 * /categories:
 *   get:
 *     tags:
 *       - Categories
 *     summary: List available SDG categories
 *     responses:
 *       200:
 *         description: Categories list
 */
router.get('/categories', listCategoriesController);

module.exports = router;

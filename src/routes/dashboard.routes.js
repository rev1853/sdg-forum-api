const express = require('express');
const getWeeklyStatsController = require('../controllers/dashboard/getWeeklyStatsController');
const getTopThreadsController = require('../controllers/dashboard/getTopThreadsController');

const router = express.Router();

/**
 * @openapi
 * /dashboard/stats/threads-weekly:
 *   get:
 *     tags:
 *       - Dashboard
 *     summary: Get thread metrics for the past 7 days
 *     responses:
 *       200:
 *         description: Weekly thread statistics
 */
router.get('/stats/threads-weekly', getWeeklyStatsController);

/**
 * @openapi
 * /dashboard/top-threads:
 *   get:
 *     tags:
 *       - Dashboard
 *     summary: Top 10 threads with the highest interaction in the past 7 days
 *     responses:
 *       200:
 *         description: Ranked list of threads
 */
router.get('/top-threads', getTopThreadsController);

module.exports = router;

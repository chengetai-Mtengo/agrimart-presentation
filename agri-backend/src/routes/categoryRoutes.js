const express = require('express');
const categoryController = require('../controllers/categoryController');

const router = express.Router();

/**
 * @openapi
 * /api/categories:
 *   get:
 *     summary: List marketplace categories
 *     tags: [Categories]
 *     security: []
 *     responses:
 *       200:
 *         description: Categories ordered by name.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Category'
 */
router.get('/', categoryController.listCategories);

module.exports = router;

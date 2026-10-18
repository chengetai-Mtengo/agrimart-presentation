const express = require('express');
const savedController = require('../controllers/savedController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

/**
 * @openapi
 * /api/saved:
 *   get:
 *     summary: List the authenticated user's saved products
 *     description: Excludes any saved listing that has since become `hidden`.
 *     tags: [Saved Products]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Saved products, most recently saved first.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Product' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/', authenticate, savedController.listSavedProducts);

/**
 * @openapi
 * /api/saved/{productId}:
 *   post:
 *     summary: Toggle a product's saved status
 *     description: Saves it if not already saved; un-saves it if it was.
 *     tags: [Saved Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: New saved state.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SavedToggleResponse' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.post('/:productId', authenticate, savedController.toggleSavedProduct);

/**
 * @openapi
 * /api/saved/{productId}:
 *   delete:
 *     summary: Remove a product from saved
 *     description: Succeeds even if it wasn't saved to begin with.
 *     tags: [Saved Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Removed.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessResponse' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.delete('/:productId', authenticate, savedController.removeSavedProduct);

module.exports = router;

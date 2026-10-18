const express = require('express');
const productController = require('../controllers/productController');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const { uploadProductImage } = require('../middleware/upload');
const {
  createProductSchema,
  updateProductSchema,
  productQuerySchema,
} = require('../validations/productValidation');

const router = express.Router();

/**
 * @openapi
 * /api/products:
 *   get:
 *     summary: List marketplace products
 *     description: Excludes `hidden` listings. Ordered newest first.
 *     tags: [Products]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema: { $ref: '#/components/schemas/CategoryId' }
 *         description: Filter by category id.
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Case-insensitive match against name, location, or description.
 *         example: tomato
 *       - in: query
 *         name: supplier
 *         schema: { type: string, format: uuid }
 *         description: Filter to one supplier's listings (their user id).
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 100, default: 50 }
 *     responses:
 *       200:
 *         description: Matching products.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Product' }
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       503:
 *         $ref: '#/components/responses/ServiceUnavailable'
 */
router.get('/', validate(productQuerySchema, 'query'), productController.listProducts);

/**
 * @openapi
 * /api/products/compare:
 *   get:
 *     summary: Compare one product's price against similar listings
 *     description: >
 *       Returns the reference product plus up to 20 other listings in the
 *       same category (cheapest first, excluding hidden listings).
 *     tags: [Products]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: productId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Comparison result.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/CompareResponse' }
 *       400:
 *         description: Missing `productId`.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/compare', productController.compareProduct);

/**
 * @openapi
 * /api/products/predictions:
 *   get:
 *     summary: Get price trend predictions for a product
 *     deprecated: true
 *     description: >
 *       Requires the caller's `price_predictions_enabled` notification
 *       setting to be true (see PUT /api/notifications). The model is
 *       currently a placeholder (`model: "dummy"`), not real forecasting.
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: productId
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: days
 *         schema: { type: integer, minimum: 1, default: 7 }
 *     responses:
 *       200:
 *         description: Predicted prices.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/PredictionsResponse' }
 *       400:
 *         description: Missing `productId`, or `days` is not a positive integer.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Price predictions are disabled for this account.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.get('/predictions', authenticate, productController.predictPrices);

/**
 * @openapi
 * /api/products/{id}:
 *   get:
 *     summary: Get a single product
 *     tags: [Products]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: The requested product.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Product' }
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id', productController.getProductById);

/**
 * @openapi
 * /api/products:
 *   post:
 *     summary: Create a product listing
 *     description: >
 *       Only farmers should list products (not enforced by role at this
 *       route, but intended usage). Include `latitude`/`longitude` to pin
 *       this listing's location on a map.
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema: { $ref: '#/components/schemas/CreateProductInput' }
 *     responses:
 *       201:
 *         description: Created product.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Product' }
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/', authenticate, uploadProductImage, validate(createProductSchema), productController.createProduct);

/**
 * @openapi
 * /api/products/{id}:
 *   put:
 *     summary: Update a product listing you own
 *     description: >
 *       Only the listing's owner (`supplierId` matching the token) can
 *       update it. Send only the fields that changed.
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema: { $ref: '#/components/schemas/UpdateProductInput' }
 *     responses:
 *       200:
 *         description: Updated product.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Product' }
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: Not found, or it belongs to a different account.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.put('/:id', authenticate, uploadProductImage, validate(updateProductSchema), productController.updateProduct);

/**
 * @openapi
 * /api/products/{id}:
 *   delete:
 *     summary: Delete a product listing you own
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Deleted.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessResponse' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: Not found, or it belongs to a different account.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.delete('/:id', authenticate, productController.deleteProduct);

/**
 * @openapi
 * /api/products/{id}/mark-sold-out:
 *   post:
 *     summary: Mark a product you own as sold out
 *     description: Sets `availability` to `sold_out` and `quantity` to 0.
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Updated product.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Product' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: Not found, or it belongs to a different account.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.post('/:id/mark-sold-out', authenticate, productController.markSoldOut);

module.exports = router;

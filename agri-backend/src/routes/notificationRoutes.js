const express = require('express');
const notificationController = require('../controllers/notificationController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

/**
 * @openapi
 * /api/notifications:
 *   get:
 *     summary: Get the authenticated user's notification settings
 *     description: >
 *       Creates a default settings row on first call if one doesn't exist
 *       yet. Response fields are raw snake_case column names.
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current settings.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/NotificationSettings' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/', authenticate, notificationController.getNotifications);

/**
 * @openapi
 * /api/notifications:
 *   put:
 *     summary: Update the authenticated user's notification settings
 *     description: >
 *       Partial update — only the fields you send are changed. Set
 *       `price_predictions_enabled` to `true` to unlock
 *       GET /api/products/predictions for this account.
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/UpdateNotificationsInput' }
 *     responses:
 *       200:
 *         description: Updated settings.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/NotificationSettings' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.put('/', authenticate, notificationController.updateNotifications);

module.exports = router;

const notificationService = require('../services/notificationService');
const { asyncHandler } = require('../utils/asyncHandler');

const getNotifications = asyncHandler(async (req, res) => {
  const settings = await notificationService.getNotificationSettings(req.userId);
  res.json(settings);
});

const updateNotifications = asyncHandler(async (req, res) => {
  const settings = await notificationService.updateNotificationSettings(req.userId, req.body);
  res.json(settings);
});

module.exports = { getNotifications, updateNotifications };
const productService = require('./productService');
const notificationService = require('./notificationService');
const { ForbiddenError } = require('../utils/errors');

async function getPricePredictions(userId, productId, days = 7) {
  const settings = await notificationService.getNotificationSettings(userId);
  if (!settings.price_predictions_enabled) {
    throw new ForbiddenError('Price predictions are disabled for this user');
  }
  
  try {
    return await productService.getPricePredictions(productId, days);
  } catch (error) {
    return {
      productId,
      predictions: [],
      error: error.message
    };
  }
}

module.exports = { getPricePredictions };
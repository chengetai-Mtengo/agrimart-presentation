const savedService = require('../services/savedService');
const { asyncHandler } = require('../utils/asyncHandler');

const listSavedProducts = asyncHandler(async (req, res) => {
  const products = await savedService.listSavedProducts(req.userId);
  res.json(products);
});

const toggleSavedProduct = asyncHandler(async (req, res) => {
  const result = await savedService.toggleSavedProduct(req.userId, req.params.productId);
  res.json(result);
});

const removeSavedProduct = asyncHandler(async (req, res) => {
  const result = await savedService.removeSavedProduct(req.userId, req.params.productId);
  res.json(result);
});

module.exports = {
  listSavedProducts,
  toggleSavedProduct,
  removeSavedProduct,
};

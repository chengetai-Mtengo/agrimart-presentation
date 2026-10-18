const productService = require('../services/productService');
const predictionService = require('../services/predictionService');
const { uploadFile, deleteFile, parsePublicUrl } = require('../utils/storage');
const { asyncHandler } = require('../utils/asyncHandler');
const { ValidationError } = require('../utils/errors');

const listProducts = asyncHandler(async (req, res) => {
  const products = await productService.listProducts(req.query);
  res.json(products);
});

const getProductById = asyncHandler(async (req, res) => {
  const product = await productService.getProductById(req.params.id);
  res.json(product);
});

const createProduct = asyncHandler(async (req, res) => {
  if (req.file) {
    const bucket = 'product-images';
    const folder = 'products';
    const publicUrl = await uploadFile(
      bucket,
      folder,
      req.file.buffer,
      req.file.mimetype,
      req.file.originalname
    );
    req.body.imageUrl = publicUrl;
  }

  const product = await productService.createProduct(req.userId, req.body);
  res.status(201).json(product);
});

const updateProduct = asyncHandler(async (req, res) => {
  const existing = await productService.getOwnedProduct(req.params.id, req.userId);
  if (req.file) {
    const bucket = 'product-images';
    const folder = 'products';
    const publicUrl = await uploadFile(
      bucket,
      folder,
      req.file.buffer,
      req.file.mimetype,
      req.file.originalname
    );
    req.body.imageUrl = publicUrl;
  }

  const product = await productService.updateProduct(req.params.id, req.userId, req.body);
  if (req.file && existing.imageUrl && existing.imageUrl !== product.imageUrl) {
    const parsed = parsePublicUrl(existing.imageUrl);
    if (parsed) await deleteFile(parsed.bucket, parsed.path);
  }
  res.json(product);
});

const deleteProduct = asyncHandler(async (req, res) => {
  const existing = await productService.getOwnedProduct(req.params.id, req.userId);
  const result = await productService.deleteProduct(req.params.id, req.userId);
  const parsed = parsePublicUrl(existing.imageUrl);
  if (parsed) await deleteFile(parsed.bucket, parsed.path);
  res.json(result);
});

const markSoldOut = asyncHandler(async (req, res) => {
  const product = await productService.markSoldOut(req.params.id, req.userId);
  res.json(product);
});

const compareProduct = asyncHandler(async (req, res) => {
  const { productId } = req.query;
  if (!productId) {
    throw new ValidationError('productId query parameter is required');
  }
  const result = await productService.compareProducts(productId);
  res.json(result);
});

const predictPrices = asyncHandler(async (req, res) => {
  const { productId, days } = req.query;
  if (!productId) {
    throw new ValidationError('productId query parameter is required');
  }
  const daysNum = days ? parseInt(days, 10) : 7;
  if (isNaN(daysNum) || daysNum < 1) {
    throw new ValidationError('days must be a positive integer');
  }
  const result = await predictionService.getPricePredictions(req.userId, productId, daysNum);
  res.json(result);
});

module.exports = {
  listProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  markSoldOut,
  compareProduct,
  predictPrices,
};

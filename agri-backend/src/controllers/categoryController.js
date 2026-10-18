const categoryService = require('../services/categoryService');
const { asyncHandler } = require('../utils/asyncHandler');

const listCategories = asyncHandler(async (req, res) => {
  const categories = await categoryService.listCategories();
  res.json(categories);
});

module.exports = { listCategories };

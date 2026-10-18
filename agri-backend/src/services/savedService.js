const { randomUUID } = require('crypto');
const { pool } = require('../config/database');
const { toProduct } = require('../utils/mappers');
const { NotFoundError } = require('../utils/errors');

async function listSavedProducts(userId) {
  const result = await pool.query(
    `SELECT p.*
     FROM products p
     JOIN saved_products s ON p.id = s.product_id
     WHERE s.user_id = $1 AND p.availability != 'hidden'
     ORDER BY s.saved_at DESC`,
    [userId]
  );
  return result.rows.map(toProduct);
}

async function toggleSavedProduct(userId, productId) {
  const product = await pool.query('SELECT id FROM products WHERE id = $1', [productId]);
  if (product.rows.length === 0) {
    throw new NotFoundError('Product not found');
  }

  const existing = await pool.query('SELECT id FROM saved_products WHERE user_id = $1 AND product_id = $2', [userId, productId]);
  if (existing.rows.length > 0) {
    await pool.query('DELETE FROM saved_products WHERE user_id = $1 AND product_id = $2', [userId, productId]);
    return { saved: false };
  }

  await pool.query('INSERT INTO saved_products (id, user_id, product_id) VALUES ($1, $2, $3)', [randomUUID(), userId, productId]);
  return { saved: true };
}

async function removeSavedProduct(userId, productId) {
  await pool.query('DELETE FROM saved_products WHERE user_id = $1 AND product_id = $2', [userId, productId]);
  return { success: true };
}

module.exports = {
  listSavedProducts,
  toggleSavedProduct,
  removeSavedProduct,
};

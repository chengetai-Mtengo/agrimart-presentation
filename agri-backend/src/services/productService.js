const { randomUUID } = require('crypto');
const { pool } = require('../config/database');
const { toProduct } = require('../utils/mappers');
const { NotFoundError, ValidationError } = require('../utils/errors');

const UPDATE_COLUMNS = {
  name: 'name',
  categoryId: 'category_id',
  price: 'price',
  unit: 'unit',
  quantity: 'quantity',
  description: 'description',
  imageUrl: 'image_url',
  location: 'location',
  province: 'province',
  latitude: 'latitude',
  longitude: 'longitude',
  availability: 'availability',
};

async function listProducts(filters) {
  let sql = "SELECT * FROM products WHERE availability != 'hidden'";
  const params = [];
  let index = 1;

  if (filters.category) {
    sql += ` AND category_id = $${index}`;
    params.push(String(filters.category));
    index += 1;
  }

  if (filters.search) {
    const search = `%${filters.search}%`;
    sql += ` AND (name ILIKE $${index} OR location ILIKE $${index + 1} OR description ILIKE $${index + 2})`;
    params.push(search, search, search);
    index += 3;
  }

  if (filters.supplier) {
    sql += ` AND supplier_id = $${index}`;
    params.push(filters.supplier);
    index += 1;
  }

  sql += ` ORDER BY created_at DESC LIMIT $${index}`;
  params.push(filters.limit || 50);

  const result = await pool.query(sql, params);
  return result.rows.map(toProduct);
}

async function getProductById(id) {
  const result = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
  if (result.rows.length === 0) {
    throw new NotFoundError('Product not found');
  }
  return toProduct(result.rows[0]);
}

async function getOwnedProduct(id, userId) {
  const result = await pool.query('SELECT * FROM products WHERE id = $1 AND supplier_id = $2', [id, userId]);
  if (result.rows.length === 0) {
    throw new NotFoundError('Product not found or not yours');
  }
  return toProduct(result.rows[0]);
}

async function createProduct(userId, input) {
  const id = randomUUID();
  const result = await pool.query(
    `INSERT INTO products
       (id, name, category_id, price, unit, quantity, description, image_url, supplier_id, location, province, latitude, longitude, availability)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
     RETURNING *`,
    [
      id,
      input.name,
      String(input.categoryId),
      input.price,
      input.unit,
      input.quantity,
      input.description || '',
      input.imageUrl || '',
      userId,
      input.location || '',
      input.province || '',
      input.latitude ?? null,
      input.longitude ?? null,
      input.availability || 'available',
    ]
  );
  return toProduct(result.rows[0]);
}

async function updateProduct(id, userId, input) {
  const entries = Object.entries(input).filter(([, value]) => value !== undefined);
  if (entries.length === 0) {
    throw new ValidationError('No fields to update');
  }

  const assignments = [];
  const values = [];
  for (const [key, value] of entries) {
    const column = UPDATE_COLUMNS[key];
    if (!column) {
      continue;
    }
    values.push(key === 'categoryId' ? String(value) : value);
    assignments.push(`${column} = $${values.length}`);
  }

  values.push(id, userId);
  const result = await pool.query(
    `UPDATE products
     SET ${assignments.join(', ')}
     WHERE id = $${values.length - 1} AND supplier_id = $${values.length}
     RETURNING *`,
    values
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Product not found or not yours');
  }
  return toProduct(result.rows[0]);
}

async function deleteProduct(id, userId) {
  const result = await pool.query('DELETE FROM products WHERE id = $1 AND supplier_id = $2', [id, userId]);
  if (result.rowCount === 0) {
    throw new NotFoundError('Product not found or not yours');
  }
  return { success: true };
}

async function markSoldOut(id, userId) {
  const result = await pool.query(
    "UPDATE products SET availability = 'sold_out', quantity = 0 WHERE id = $1 AND supplier_id = $2 RETURNING *",
    [id, userId]
  );
  if (result.rows.length === 0) {
    throw new NotFoundError('Product not found or not yours');
  }
  return toProduct(result.rows[0]);
}

async function compareProducts(productId) {
  const product = await getProductById(productId);

  // NOTE: previously this only filtered by category_id, which meant e.g.
  // viewing "White Maize" could show "Cabbage" as a "comparable" price
  // just because both happen to be in the same category. A price
  // comparison is only meaningful for the *same product in the same unit*
  // (comparing a per-kg price against a per-50kg-bag price is meaningless
  // even for the identical crop) — so this now also requires a matching
  // name (case-insensitive) and an identical unit.
  const result = await pool.query(
    `SELECT id, name, price, unit, supplier_id as "supplierId", location, image_url as "imageUrl"
     FROM products 
     WHERE category_id = $1
       AND id != $2
       AND availability != 'hidden'
       AND LOWER(name) = LOWER($3)
       AND unit = $4
     ORDER BY price ASC
     LIMIT 20`,
    [product.categoryId, productId, product.name, product.unit]
  );
  
  return {
    reference: product,
    comparable: result.rows.map(row => ({
      id: row.id,
      name: row.name,
      price: parseFloat(row.price),
      unit: row.unit,
      supplierId: row.supplierId,
      location: row.location,
      imageUrl: row.imageUrl,
    })),
  };
}

async function getPricePredictions(productId, days = 7) {
  const product = await getProductById(productId);
  
  const currentPrice = product.price;
  const predictions = [];
  for (let i = 1; i <= days; i++) {
    const variation = (Math.random() * 0.2) - 0.1;
    const predicted = Math.round((currentPrice * (1 + variation)) * 100) / 100;
    const date = new Date();
    date.setDate(date.getDate() + i);
    predictions.push({
      date: date.toISOString().split('T')[0],
      predictedPrice: predicted,
      confidence: Math.round((0.7 + Math.random() * 0.3) * 100),
    });
  }
  
  return {
    productId: product.id,
    productName: product.name,
    currentPrice: product.price,
    predictions,
    model: 'dummy',
    generatedAt: new Date().toISOString(),
  };
}

module.exports = {
  listProducts,
  getProductById,
  getOwnedProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  markSoldOut,
  compareProducts,
  getPricePredictions,
};

const { pool } = require('../config/database');

async function listCategories() {
  const result = await pool.query(
    `SELECT id, name, icon, description, color
     FROM categories
     ORDER BY name ASC`
  );
  return result.rows;
}

module.exports = { listCategories };

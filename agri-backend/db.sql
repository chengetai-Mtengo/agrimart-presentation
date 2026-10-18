CREATE DATABASE IF NOT EXISTS agri_market;
USE agri_market;

CREATE TABLE IF NOT EXISTS categories (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  icon VARCHAR(10),
  description TEXT,
  color VARCHAR(20)
);

INSERT INTO categories (id, name, icon, description, color) VALUES
('grains', 'Grains', '🌾', 'Maize, rice, wheat, sorghum, millet', '#F59E0B'),
('vegetables', 'Vegetables', '🥬', 'Tomatoes, onions, cabbage, rape, peppers', '#16A34A'),
('fruits', 'Fruits', '🍊', 'Bananas, oranges, mangoes, avocados', '#F97316'),
('legumes', 'Legumes', '🫘', 'Beans, groundnuts, soybeans, cowpeas', '#92400E'),
('tubers', 'Tubers', '🥔', 'Cassava, sweet potatoes, potatoes, yams', '#A16207'),
('dairy', 'Dairy', '🥛', 'Milk, cheese, yoghurt, butter', '#0EA5E9'),
('livestock', 'Livestock', '🐄', 'Cattle, goats, sheep, pigs', '#7C3AED'),
('poultry', 'Poultry', '🐔', 'Chickens, ducks, eggs, chicks', '#DC2626'),
('fish', 'Fish', '🐟', 'Fresh fish, dried fish, fingerlings', '#0284C7'),
('farm-inputs', 'Farm Inputs', '🚜', 'Seed, fertiliser, feed, tools', '#475569')
ON DUPLICATE KEY UPDATE name = VALUES(name), icon = VALUES(icon), description = VALUES(description), color = VALUES(color);

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  role ENUM('farmer','consumer') DEFAULT 'consumer',
  location VARCHAR(100),
  province VARCHAR(50),
  joined_date DATE NOT NULL,
  avatar_color VARCHAR(20)
);

CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  category_id VARCHAR(50),
  price DECIMAL(10,2) NOT NULL,
  unit VARCHAR(30) NOT NULL,
  quantity INT NOT NULL,
  description TEXT,
  image_url VARCHAR(255),
  supplier_id VARCHAR(36) NOT NULL,
  location VARCHAR(100),
  province VARCHAR(50),
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  availability ENUM('available','limited','sold_out','hidden') DEFAULT 'available',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id),
  FOREIGN KEY (supplier_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS saved_products (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  product_id VARCHAR(36) NOT NULL,
  saved_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_save (user_id, product_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

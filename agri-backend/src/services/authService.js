const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { randomUUID } = require('crypto');
const { pool } = require('../config/database');
const { config } = require('../config/config');
const { toUser } = require('../utils/mappers');
const { AuthenticationError, ConflictError, NotFoundError, ValidationError } = require('../utils/errors');

const AVATAR_COLORS = ['#16A34A', '#2563EB', '#7C3AED', '#DC2626', '#EA580C', '#0891B2', '#DB2777'];

function createToken(user) {
  return jwt.sign({ userId: user.id, role: user.role }, config.jwtSecret, { expiresIn: '7d' });
}

async function registerUser(input) {
  const username = input.username.trim();
  const usernameCheck = await pool.query('SELECT id FROM profiles WHERE LOWER(username) = LOWER($1)', [username]);
  if (usernameCheck.rows.length > 0) {
    throw new ConflictError('Username already taken');
  }

  if (input.email) {
    const emailCheck = await pool.query('SELECT id FROM profiles WHERE LOWER(email) = LOWER($1)', [input.email.trim()]);
    if (emailCheck.rows.length > 0) {
      throw new ConflictError('Email already registered');
    }
  }

  const hash = await bcrypt.hash(input.password, 10);
  const id = randomUUID();
  const avatarColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];

  await pool.query(
    `INSERT INTO profiles
       (id, username, name, email, password_hash, phone, role, location, province, latitude, longitude, avatar_color, joined_date)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, CURRENT_DATE)
     RETURNING id, username, name, email, phone, role, location, province, latitude, longitude, joined_date, avatar_color`,
    [
      id,
      username,
      input.name,
      input.email ? input.email.trim() : null,
      hash,
      input.phone,
      input.role,
      input.location || '',
      input.province || '',
      input.latitude ?? null,
      input.longitude ?? null,
      avatarColor,
    ]
  );

  return { message: 'Registration successful. Please log in.' };
}

async function loginUser({ username, password }) {
  if (!username || !password) {
    throw new ValidationError('Username and password required');
  }

  const identifier = username.trim();
  let result = await pool.query(
    'SELECT * FROM profiles WHERE LOWER(username) = LOWER($1) LIMIT 2',
    [identifier]
  );
  if (result.rows.length === 0) {
    result = await pool.query(
      'SELECT * FROM profiles WHERE LOWER(email) = LOWER($1) LIMIT 2',
      [identifier]
    );
  }
  // More than one legacy account may share an email with different casing.
  // Do not choose an account ambiguously; those users must use their username.
  if (result.rows.length !== 1) {
    throw new AuthenticationError('Invalid credentials');
  }

  const profile = result.rows[0];
  const passwordMatches = await bcrypt.compare(password, profile.password_hash);
  if (!passwordMatches) {
    throw new AuthenticationError('Invalid credentials');
  }

  const user = toUser(profile);
  return { token: createToken(user), user };
}

async function getMe(userId) {
  const result = await pool.query('SELECT * FROM profiles WHERE id = $1', [userId]);
  if (result.rows.length === 0) {
    throw new NotFoundError('User not found');
  }
  return toUser(result.rows[0]);
}

module.exports = {
  registerUser,
  loginUser,
  getMe,
};

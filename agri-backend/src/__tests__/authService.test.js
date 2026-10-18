jest.mock('../config/database', () => ({ pool: { query: jest.fn() } }));
jest.mock('bcryptjs', () => ({ compare: jest.fn(), hash: jest.fn() }));

const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');
const { loginUser } = require('../services/authService');

const profile = {
  id: '1f497394-11a6-410d-998b-008d9871c111',
  username: 'Farmer',
  name: 'Farm User',
  email: 'farmer@example.com',
  phone: '0971234567',
  role: 'farmer',
  password_hash: 'stored-hash',
  joined_date: '2026-01-01',
};

beforeEach(() => {
  pool.query.mockReset();
  bcrypt.compare.mockReset();
});

test('login matches usernames case-insensitively', async () => {
  pool.query.mockResolvedValueOnce({ rows: [profile] });
  bcrypt.compare.mockResolvedValueOnce(true);

  const result = await loginUser({ username: '  farmer ', password: 'correct' });

  expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('LOWER(username)'), ['farmer']);
  expect(result.user.username).toBe('Farmer');
  expect(result.token).toEqual(expect.any(String));
});

test('login falls back to a unique email for legacy accounts', async () => {
  pool.query
    .mockResolvedValueOnce({ rows: [] })
    .mockResolvedValueOnce({ rows: [{ ...profile, username: null }] });
  bcrypt.compare.mockResolvedValueOnce(true);

  const result = await loginUser({ username: 'FARMER@EXAMPLE.COM', password: 'correct' });

  expect(pool.query).toHaveBeenNthCalledWith(2, expect.stringContaining('LOWER(email)'), ['FARMER@EXAMPLE.COM']);
  expect(result.user.email).toBe('farmer@example.com');
});

test('login rejects ambiguous legacy email matches', async () => {
  pool.query
    .mockResolvedValueOnce({ rows: [] })
    .mockResolvedValueOnce({ rows: [profile, { ...profile, id: 'second' }] });

  await expect(loginUser({ username: 'farmer@example.com', password: 'correct' }))
    .rejects.toEqual(expect.objectContaining({ statusCode: 401, message: 'Invalid credentials' }));
  expect(bcrypt.compare).not.toHaveBeenCalled();
});

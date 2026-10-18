const request = require('supertest');
const app = require('../app');

describe('Auth API Validation', () => {
  it('should return validation error for invalid username format', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'ab',
        name: 'Test User',
        phone: '0712345678',
        password: 'password123',
        confirmPassword: 'password123',
        role: 'consumer',
      });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('should return validation error for short name', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'testuser',
        name: 'A',
        phone: '0712345678',
        password: 'password123',
        confirmPassword: 'password123',
        role: 'consumer',
      });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('should return validation error for invalid role', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'testuser',
        name: 'Test User',
        phone: '0712345678',
        password: 'password123',
        confirmPassword: 'password123',
        role: 'invalid-role',
      });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('should return validation error for password mismatch', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'testuser',
        name: 'Test User',
        phone: '0712345678',
        password: 'password123',
        confirmPassword: 'different',
        role: 'consumer',
      });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('should return validation error for missing required fields on login', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        username: '',
        password: '',
      });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });
});
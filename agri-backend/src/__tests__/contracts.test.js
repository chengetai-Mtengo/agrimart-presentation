const express = require('express');
const request = require('supertest');
const { registerSchema } = require('../validations/authValidation');
const { updateProfileSchema, updateLocationSchema } = require('../validations/userValidation');
const { toUser } = require('../utils/mappers');
const { uploadProductImage } = require('../middleware/upload');
const { errorHandler } = require('../middleware/errorHandler');
const { parsePublicUrl } = require('../utils/storage');

describe('mobile integration contracts', () => {
  test('registration validates coordinates as a pair', () => {
    const base = {
      username: 'farmer123',
      name: 'Test Farmer',
      phone: '0971234567',
      password: 'password123',
      confirmPassword: 'password123',
      role: 'farmer',
    };
    expect(registerSchema.validate({ ...base, latitude: -15.4 }).error).toBeTruthy();
    expect(registerSchema.validate({ ...base, latitude: -15.4, longitude: 28.3 }).error).toBeUndefined();
  });

  test('profile and location schemas accept mobile fields', () => {
    expect(updateProfileSchema.validate({ email: 'new@example.com', phone: '0971234567' }).error).toBeUndefined();
    expect(updateLocationSchema.validate({ location: 'Chongwe', province: 'Lusaka', latitude: -15.3, longitude: 28.7 }).error).toBeUndefined();
    expect(updateLocationSchema.validate({ longitude: 28.7 }).error).toBeTruthy();
  });

  test('user mapper exposes profile coordinates', () => {
    const user = toUser({
      id: 'user-1', username: 'farmer123', name: 'Test Farmer', role: 'farmer',
      latitude: '-15.4001', longitude: '28.3002', joined_date: '2026-01-01',
    });
    expect(user.latitude).toBe(-15.4001);
    expect(user.longitude).toBe(28.3002);
  });

  test('invalid product images produce a client error', async () => {
    const app = express();
    app.post('/upload', uploadProductImage, (req, res) => res.json({ ok: true }));
    app.use(errorHandler);
    const response = await request(app)
      .post('/upload')
      .attach('image', Buffer.from('not an image'), { filename: 'bad.txt', contentType: 'text/plain' });
    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/Only image files/);
  });

  test('upload URLs resolve to safe storage deletion targets', () => {
    expect(parsePublicUrl('https://example.test/storage/v1/object/public/product-images/products/a.jpg'))
      .toEqual({ bucket: 'product-images', path: 'products/a.jpg' });
    expect(parsePublicUrl('http://localhost:5000/uploads/products/a.jpg'))
      .toEqual({ bucket: 'local', path: 'products/a.jpg' });
    expect(parsePublicUrl('https://example.test/not-an-upload/a.jpg')).toBeNull();
  });
});

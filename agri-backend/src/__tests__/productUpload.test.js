const request = require('supertest');
const path = require('path');
const fs = require('fs');
const app = require('../app');

// This test requires the backend to be able to start without Supabase storage.
// It writes a local upload file into uploads/products and verifies the API response.

describe('Product upload', () => {
  it('should create a product with an uploaded image', async () => {
    const username = `testuser${Date.now()}`;
    const password = 'Password123!';
    const tempfile = path.join(__dirname, 'fixtures', 'test-image.jpg');

    const fixtureDir = path.join(__dirname, 'fixtures');
    if (!fs.existsSync(fixtureDir)) {
      fs.mkdirSync(fixtureDir, { recursive: true });
    }
    if (!fs.existsSync(tempfile)) {
      fs.writeFileSync(tempfile, Buffer.from([0xff, 0xd8, 0xff, 0xd9]));
    }

    await request(app)
      .post('/api/auth/register')
      .send({
        username,
        name: 'Test User',
        phone: '0712345678',
        password,
        confirmPassword: password,
        role: 'farmer',
      })
      .expect(201);

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ username, password })
      .expect(200);

    const token = loginRes.body.token;
    expect(token).toBeTruthy();

    const productRes = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .field('name', 'Upload Test Product')
      .field('categoryId', 'grains')
      .field('price', '12.50')
      .field('unit', 'kg')
      .field('quantity', '10')
      .field('description', 'Test upload product creation')
      .field('location', 'Testville')
      .field('province', 'Lusaka')
      .field('availability', 'available')
      .attach('image', tempfile)
      .expect(201);

    expect(productRes.body).toHaveProperty('id');
    expect(productRes.body).toHaveProperty('imageUrl');
    expect(productRes.body.imageUrl).toMatch(/\/uploads\/products\/|https?:\/\//);
  });
});

const fs = require('fs');
const path = require('path');
const request = require('supertest');
const app = require('../app');

// The frontend runs on a different origin from the API, so uploaded images
// must be renderable cross-origin and served from the same absolute directory
// storage.js writes to (independent of the process working directory).
describe('uploads static serving', () => {
  const uploadsDir = path.join(__dirname, '..', '..', 'uploads', 'products');

  test('uploaded files are served with a cross-origin resource policy browsers can render', async () => {
    fs.mkdirSync(uploadsDir, { recursive: true });
    const name = `uploads-test-${Date.now()}.txt`;
    const filePath = path.join(uploadsDir, name);
    fs.writeFileSync(filePath, 'upload-ok');

    try {
      const res = await request(app).get(`/uploads/products/${name}`);
      expect(res.status).toBe(200);
      expect(res.text).toBe('upload-ok');
      expect(res.headers['cross-origin-resource-policy']).toBe('cross-origin');
    } finally {
      fs.unlinkSync(filePath);
    }
  });

  test('missing uploads still carry the relaxed resource policy', async () => {
    const res = await request(app).get('/uploads/products/definitely-missing.jpg');
    expect(res.headers['cross-origin-resource-policy']).toBe('cross-origin');
  });
});

const request = require('supertest');
const app = require('../app');

describe('Health endpoint', () => {
  it('returns a structured health response', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('ok');
    expect(response.body).toHaveProperty('database');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body).toHaveProperty('uptime');
    expect(response.body).toHaveProperty('memory');
    expect(response.body).toHaveProperty('memory.heapUsed');
  });
});
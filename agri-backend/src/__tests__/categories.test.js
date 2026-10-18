const mockQuery = jest.fn();

jest.mock('../config/database', () => ({
  pool: { query: mockQuery },
  isDatabaseReady: () => true,
}));

const request = require('supertest');
const app = require('../app');

describe('Categories endpoint', () => {
  beforeEach(() => mockQuery.mockReset());

  it('returns database-backed marketplace categories', async () => {
    const categories = [
      { id: 'farm-inputs', name: 'Farm Inputs', icon: '🚜', description: 'Seed and tools', color: '#475569' },
      { id: 'grains', name: 'Grains', icon: '🌾', description: 'Maize and rice', color: '#F59E0B' },
    ];
    mockQuery.mockResolvedValueOnce({ rows: categories });

    const response = await request(app).get('/api/categories');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(categories);
    expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('FROM categories'));
  });
});

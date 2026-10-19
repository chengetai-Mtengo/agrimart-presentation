const fs = require('fs');
const path = require('path');

// storage.js captures the Supabase client at require time, so re-require it
// against a fresh module registry to control which storage backend is active.
function loadStorage(supabaseMock) {
  jest.resetModules();
  jest.doMock('../config/supabase', () => supabaseMock);
  const storage = require('../utils/storage');
  const { config } = require('../config/config');
  return { storage, config };
}

const imageBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xd9]);

describe('storage.uploadFile', () => {
  test('production without Supabase storage fails loudly instead of pretending to succeed', async () => {
    const { storage, config } = loadStorage(null);
    config.isProduction = true;

    await expect(
      storage.uploadFile('product-images', 'products', imageBuffer, 'image/jpeg', 'a.jpg')
    ).rejects.toThrow(/SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY/);
  });

  test('development falls back to local disk with a usable absolute URL', async () => {
    const { storage, config } = loadStorage(null);
    config.isProduction = false;

    const url = await storage.uploadFile(
      'product-images',
      'products',
      imageBuffer,
      'image/jpeg',
      'a.jpg'
    );

    expect(url).toMatch(/^https?:\/\/.+\/uploads\/products\/.+\.jpg$/);

    const relative = url.split('/uploads/')[1];
    const written = path.join(__dirname, '..', '..', 'uploads', relative);
    expect(fs.existsSync(written)).toBe(true);
    fs.unlinkSync(written);
  });

  test('a private Supabase bucket is reported instead of returning a dead public URL', async () => {
    const supabaseMock = {
      storage: {
        getBucket: jest.fn().mockResolvedValue({ data: { public: false }, error: null }),
        from: jest.fn(),
      },
    };
    const { storage } = loadStorage(supabaseMock);

    await expect(
      storage.uploadFile('product-images', 'products', imageBuffer, 'image/jpeg', 'a.jpg')
    ).rejects.toThrow(/private/);
    expect(supabaseMock.storage.from).not.toHaveBeenCalled();
  });

  test('a public bucket uploads and returns the Supabase public URL', async () => {
    const publicUrl =
      'https://example.supabase.co/storage/v1/object/public/product-images/products/x.jpg';
    const fromMock = {
      upload: jest.fn().mockResolvedValue({ data: { path: 'products/x.jpg' }, error: null }),
      getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl } }),
    };
    const supabaseMock = {
      storage: {
        getBucket: jest.fn().mockResolvedValue({ data: { public: true }, error: null }),
        from: jest.fn().mockReturnValue(fromMock),
      },
    };
    const { storage } = loadStorage(supabaseMock);

    const url = await storage.uploadFile(
      'product-images',
      'products',
      imageBuffer,
      'image/jpeg',
      'a.jpg'
    );

    expect(url).toBe(publicUrl);
    expect(supabaseMock.storage.getBucket).toHaveBeenCalledWith('product-images');
    expect(fromMock.upload).toHaveBeenCalled();
  });

  test('an unreadable bucket listing lets the upload surface its own error', async () => {
    const supabaseMock = {
      storage: {
        getBucket: jest.fn().mockResolvedValue({ data: null, error: { message: 'Bucket not found' } }),
        from: jest.fn().mockReturnValue({
          upload: jest.fn().mockResolvedValue({ data: null, error: { message: 'Bucket not found' } }),
          getPublicUrl: jest.fn(),
        }),
      },
    };
    const { storage } = loadStorage(supabaseMock);

    await expect(
      storage.uploadFile('product-images', 'products', imageBuffer, 'image/jpeg', 'a.jpg')
    ).rejects.toThrow(/Bucket not found/);
  });
});

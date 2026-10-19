const fs = require('fs');
const path = require('path');
const supabase = require('../config/supabase');
const { config } = require('../config/config');
const { AppError } = require('./errors');

// Buckets already confirmed to be public. A non-public bucket is deliberately
// NOT cached, so fixing the bucket in the Supabase dashboard takes effect on
// the next upload without a redeploy.
const publicBuckets = new Set();

function ensureDirectoryExists(directory) {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }
}

// getPublicUrl() returns a URL even for private buckets — the upload then
// "succeeds" while every image request 403s. Verify visibility up front so a
// private bucket surfaces as one clear error instead of dead images.
async function assertBucketIsPublic(bucketName) {
  if (publicBuckets.has(bucketName)) return;

  const { data, error } = await supabase.storage.getBucket(bucketName);
  if (error || !data) {
    // Bucket may not exist — the upload below surfaces that error with the
    // exact bucket name, so don't double-report here.
    return;
  }

  if (data.public === false) {
    throw new AppError(
      `Supabase Storage bucket "${bucketName}" is private, so uploaded images will not load. ` +
        `Make it public in the Supabase dashboard: Storage -> "${bucketName}" -> Settings -> Public bucket.`,
      500
    );
  }

  publicBuckets.add(bucketName);
}

async function uploadFile(bucketName, folder, fileBuffer, mimeType, fileName = '') {
  const fileExt = path.extname(fileName) || '.jpg';
  const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${fileExt}`;
  const filePath = `${folder}/${uniqueName}`;

  if (supabase) {
    await assertBucketIsPublic(bucketName);

    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, fileBuffer, {
        contentType: mimeType,
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Supabase upload error:', error);
      // AppError (not Error) so the message survives the error handler instead
      // of being masked as a generic "Internal server error" in production.
      throw new AppError(
        `Failed to upload image to Supabase Storage: ${error.message || 'Unknown error'}`,
        500
      );
    }

    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
  }

  // Production has no durable local disk (Render's filesystem is ephemeral):
  // writing there would return a "successful" upload whose file disappears on
  // the next redeploy/restart. Fail loudly instead of pretending it worked.
  if (config.isProduction) {
    throw new AppError(
      'Image storage is not configured: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are not set. ' +
        'Production cannot persist uploads to disk, so set both environment variables to enable Supabase Storage.',
      500
    );
  }

  const uploadRoot = path.join(__dirname, '..', '..', 'uploads', folder);
  ensureDirectoryExists(uploadRoot);
  const localFilePath = path.join(uploadRoot, uniqueName);
  fs.writeFileSync(localFilePath, fileBuffer);

  const publicUrl = `${config.apiUrl.replace(/\/$/, '')}/uploads/${folder}/${uniqueName}`;
  return publicUrl;
}

async function deleteFile(bucketName, filePath) {
  if (bucketName === 'local') {
    const uploadRoot = path.resolve(__dirname, '..', '..', 'uploads');
    const localPath = path.resolve(uploadRoot, filePath);
    if (!localPath.startsWith(`${uploadRoot}${path.sep}`)) return;
    try {
      await fs.promises.unlink(localPath);
    } catch (error) {
      if (error.code !== 'ENOENT') console.error('Local upload delete error:', error);
    }
    return;
  }
  if (!supabase) return;
  const { error } = await supabase.storage
    .from(bucketName)
    .remove([filePath]);

  if (error) {
    console.error('Supabase delete error:', error);
  }
}

function parsePublicUrl(url) {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    const pathParts = parsed.pathname.split('/');
    const bucketIndex = pathParts.indexOf('public') + 1;
    if (bucketIndex !== 0) {
      const bucket = pathParts[bucketIndex];
      const path = pathParts.slice(bucketIndex + 1).join('/');
      return { bucket, path };
    }
    const uploadsIndex = pathParts.indexOf('uploads');
    if (uploadsIndex !== -1 && pathParts.length > uploadsIndex + 2) {
      return { bucket: 'local', path: pathParts.slice(uploadsIndex + 1).join('/') };
    }
    return null;
  } catch {
    return null;
  }
}

module.exports = { uploadFile, deleteFile, parsePublicUrl };

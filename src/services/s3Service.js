/**
 * S3 Service
 * ----------
 * Handles all AWS S3 operations for product image management.
 * - Upload product images to S3 bucket
 * - Delete product images from S3
 * - Generate pre-signed URLs for secure, time-limited image access
 *
 * In production, images are stored in S3 and served via pre-signed URLs.
 * In development (when S3 is not configured), falls back to local placeholder behavior.
 */

const { PutObjectCommand, DeleteObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { s3Client, S3_BUCKET } = require('../config/aws');
const logger = require('../config/logger');
const path = require('path');

/**
 * Upload a product image to S3.
 * @param {Object} file - Multer file object (with buffer, mimetype, originalname)
 * @param {number|string} productId - Product ID for organizing images
 * @returns {Object} - { url, key } of the uploaded image
 */
async function uploadProductImage(file, productId) {
  // Generate a unique S3 key with product ID and timestamp
  const ext = path.extname(file.originalname).toLowerCase();
  const key = `products/${productId}/${Date.now()}${ext}`;

  const command = new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
  });

  try {
    await s3Client.send(command);

    // Build the public URL for the uploaded image
    const url = `https://${S3_BUCKET}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;

    logger.info(`Image uploaded to S3: ${key}`);
    return { url, key };
  } catch (error) {
    logger.error(`S3 upload error: ${error.name} - ${error.message}`);
    throw new Error(`Failed to upload image to S3: ${error.message}`);
  }
}

/**
 * Delete a product image from S3.
 * @param {string} s3Key - The S3 object key to delete
 */
async function deleteProductImage(s3Key) {
  if (!s3Key) return;

  const command = new DeleteObjectCommand({
    Bucket: S3_BUCKET,
    Key: s3Key,
  });

  try {
    await s3Client.send(command);
    logger.info(`Image deleted from S3: ${s3Key}`);
  } catch (error) {
    logger.error('S3 delete error:', error.message);
    // Don't throw — image deletion failure shouldn't block product deletion
  }
}

/**
 * Generate a pre-signed URL for secure, time-limited access to an S3 object.
 * @param {string} s3Key - The S3 object key
 * @param {number} expiresIn - URL expiration time in seconds (default: 1 hour)
 * @returns {string} - Pre-signed URL
 */
async function getPresignedUrl(s3Key, expiresIn = 3600) {
  if (!s3Key) return null;

  const command = new GetObjectCommand({
    Bucket: S3_BUCKET,
    Key: s3Key,
  });

  try {
    const url = await getSignedUrl(s3Client, command, { expiresIn });
    return url;
  } catch (error) {
    logger.error('S3 pre-signed URL error:', error.message);
    return null;
  }
}

module.exports = {
  uploadProductImage,
  deleteProductImage,
  getPresignedUrl,
};

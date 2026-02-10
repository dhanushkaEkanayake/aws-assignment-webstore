/**
 * AWS S3 Client Configuration
 * ----------------------------
 * Creates and exports an S3 client instance configured from environment variables.
 * Used by the S3 service for product image uploads and management.
 *
 * In production on AWS EC2/ECS, you can use IAM roles instead of access keys
 * by leaving AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY unset.
 */

const { S3Client } = require('@aws-sdk/client-s3');

// Build S3 client configuration
const s3Config = {
  region: process.env.AWS_REGION || 'us-east-1',
};

// Only set credentials explicitly if provided (IAM roles handle this on EC2/ECS)
if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
  s3Config.credentials = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  };
}

const s3Client = new S3Client(s3Config);

module.exports = {
  s3Client,
  S3_BUCKET: process.env.AWS_S3_BUCKET || 'hsenid-cloudmart-images',
};

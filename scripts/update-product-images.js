/**
 * Update Product Images to S3 URLs
 * ----------------------------------
 * Updates all product image_url fields to point to S3-hosted images.
 * Run this AFTER uploading static assets to S3.
 *
 * Usage: node scripts/update-product-images.js
 */

require('dotenv').config();

const { sequelize, Product } = require('../src/models');

const S3_BUCKET = process.env.AWS_S3_BUCKET || 'aws-assignment-rsp';
const S3_REGION = process.env.AWS_REGION || 'us-east-2';
const BASE_URL = `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/static/images/products`;

// Map product names to S3 image filenames
const imageMap = {
  'Wireless Bluetooth Headphones': 'wireless-headphones.svg',
  'Smart Watch Pro': 'smart-watch.svg',
  'USB-C Hub Adapter': 'usb-hub.svg',
  'Classic Denim Jacket': 'denim-jacket.svg',
  'Running Shoes Ultra': 'running-shoes.svg',
  'Cotton Polo Shirt': 'polo-shirt.svg',
  'Cloud Computing Handbook': 'cloud-book.svg',
  'Docker & Kubernetes Guide': 'docker-book.svg',
  'Indoor Plant Set': 'indoor-plants.svg',
  'LED Desk Lamp': 'desk-lamp.svg',
};

async function updateImages() {
  try {
    await sequelize.authenticate();
    console.log('Database connected.');

    for (const [productName, filename] of Object.entries(imageMap)) {
      const imageUrl = `${BASE_URL}/${filename}`;
      const [count] = await Product.update(
        { image_url: imageUrl },
        { where: { name: productName } }
      );
      if (count > 0) {
        console.log(`  Updated: ${productName} → ${filename}`);
      } else {
        console.log(`  Skipped: ${productName} (not found)`);
      }
    }

    console.log('\nAll product images updated to S3 URLs.');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

updateImages();

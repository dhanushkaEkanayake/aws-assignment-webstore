/**
 * Database Seeding Script
 * ------------------------
 * Creates a default admin user and 10 sample products for testing.
 * Safe to run multiple times — skips creation if data already exists.
 *
 * Default Admin:
 *   Email: admin@hsenid.lk
 *   Password: Admin@123
 *   Role: admin
 *
 * Usage: npm run seed
 */

require('dotenv').config();

const { sequelize, User, Product } = require('../src/models');
const bcrypt = require('bcryptjs');
const logger = require('../src/config/logger');

// Sample products across 4 categories
const sampleProducts = [
  {
    name: 'Wireless Bluetooth Headphones',
    description: 'Premium noise-cancelling wireless headphones with 30-hour battery life. Features advanced Bluetooth 5.0 technology for seamless connectivity.',
    price: 79.99,
    category: 'Electronics',
    image_url: '',
  },
  {
    name: 'Smart Watch Pro',
    description: 'Feature-rich smartwatch with heart rate monitoring, GPS tracking, and water resistance. Compatible with iOS and Android.',
    price: 199.99,
    category: 'Electronics',
    image_url: '',
  },
  {
    name: 'USB-C Hub Adapter',
    description: '7-in-1 USB-C hub with HDMI, USB 3.0, SD card reader, and 100W power delivery. Essential for modern laptops.',
    price: 34.99,
    category: 'Electronics',
    image_url: '',
  },
  {
    name: 'Classic Denim Jacket',
    description: 'Timeless denim jacket made from premium cotton. Features button closure, chest pockets, and comfortable fit for all seasons.',
    price: 59.99,
    category: 'Clothing',
    image_url: '',
  },
  {
    name: 'Running Shoes Ultra',
    description: 'Lightweight running shoes with responsive cushioning and breathable mesh upper. Designed for road running and daily training.',
    price: 129.99,
    category: 'Clothing',
    image_url: '',
  },
  {
    name: 'Cotton Polo Shirt',
    description: 'Classic fit polo shirt made from 100% organic cotton. Available in multiple colors. Perfect for casual and semi-formal occasions.',
    price: 29.99,
    category: 'Clothing',
    image_url: '',
  },
  {
    name: 'Cloud Computing Handbook',
    description: 'Comprehensive guide to AWS, Azure, and GCP cloud services. Covers architecture, deployment, and best practices for DevOps engineers.',
    price: 44.99,
    category: 'Books',
    image_url: '',
  },
  {
    name: 'Docker & Kubernetes Guide',
    description: 'Hands-on guide to containerization and orchestration. Learn Docker, Kubernetes, and CI/CD pipelines from scratch.',
    price: 39.99,
    category: 'Books',
    image_url: '',
  },
  {
    name: 'Indoor Plant Set',
    description: 'Set of 3 low-maintenance indoor plants in decorative ceramic pots. Includes care instructions. Perfect for home or office.',
    price: 49.99,
    category: 'Home & Garden',
    image_url: '',
  },
  {
    name: 'LED Desk Lamp',
    description: 'Adjustable LED desk lamp with 5 brightness levels and 3 color temperatures. USB charging port included. Eye-care technology.',
    price: 24.99,
    category: 'Home & Garden',
    image_url: '',
  },
];

async function seed() {
  try {
    // Connect to database
    await sequelize.authenticate();
    logger.info('Database connected for seeding.');

    // Sync tables
    await sequelize.sync();

    // Create admin user if not exists
    const existingAdmin = await User.findOne({ where: { email: 'admin@hsenid.lk' } });
    if (!existingAdmin) {
      await User.create({
        email: 'admin@hsenid.lk',
        password: 'Admin@123',
        role: 'admin',
      });
      console.log('✅ Admin user created (admin@hsenid.lk / Admin@123)');
    } else {
      console.log('ℹ️  Admin user already exists, skipping.');
    }

    // Create sample customer user if not exists
    const existingCustomer = await User.findOne({ where: { email: 'customer@example.com' } });
    if (!existingCustomer) {
      await User.create({
        email: 'customer@example.com',
        password: 'Customer@123',
        role: 'customer',
      });
      console.log('✅ Customer user created (customer@example.com / Customer@123)');
    } else {
      console.log('ℹ️  Customer user already exists, skipping.');
    }

    // Create sample products if none exist
    const productCount = await Product.count();
    if (productCount === 0) {
      await Product.bulkCreate(sampleProducts);
      console.log(`✅ ${sampleProducts.length} sample products created`);
    } else {
      console.log(`ℹ️  ${productCount} products already exist, skipping.`);
    }

    console.log('\n🎉 Database seeding complete!\n');
    console.log('You can now start the application:');
    console.log('  npm start     (production)');
    console.log('  npm run dev   (development with hot-reload)\n');
    process.exit(0);
  } catch (error) {
    logger.error('Seeding failed:', error);
    console.error('\n❌ Seeding failed:', error.message);
    process.exit(1);
  }
}

seed();

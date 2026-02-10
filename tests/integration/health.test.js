/**
 * Health Check Integration Tests
 * --------------------------------
 * Tests the /health endpoint for ALB health checking.
 */

// Mock Sequelize and AWS before requiring app
jest.mock('../../src/config/database', () => {
  const SequelizeMock = {
    authenticate: jest.fn().mockResolvedValue(true),
    sync: jest.fn().mockResolvedValue(true),
    define: jest.fn().mockReturnValue({
      belongsTo: jest.fn(),
      hasMany: jest.fn(),
      findAll: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue(null),
      findByPk: jest.fn().mockResolvedValue(null),
      create: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
      destroy: jest.fn(),
      prototype: {},
    }),
    close: jest.fn(),
  };
  return {
    sequelize: SequelizeMock,
    testConnection: jest.fn().mockResolvedValue(true),
  };
});

jest.mock('@aws-sdk/client-s3', () => {
  const mockSend = jest.fn().mockResolvedValue({});
  return {
    S3Client: jest.fn(() => ({ send: mockSend })),
    PutObjectCommand: jest.fn(),
    DeleteObjectCommand: jest.fn(),
    GetObjectCommand: jest.fn(),
    ListBucketsCommand: jest.fn(),
  };
});

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn(),
}));

const request = require('supertest');

// Set up environment
process.env.NODE_ENV = 'test';
process.env.SESSION_SECRET = 'test-secret';

let app;

beforeAll(() => {
  jest.isolateModules(() => {
    app = require('../../src/app');
  });
});

describe('Health Check Endpoint', () => {
  it('GET /health should return 200 with health status', async () => {
    const res = await request(app).get('/health');

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('status');
    expect(res.body).toHaveProperty('timestamp');
    expect(res.body).toHaveProperty('database');
    expect(res.body).toHaveProperty('s3');
    expect(res.body).toHaveProperty('uptime');
  });

  it('should include all required fields in health response', async () => {
    const res = await request(app).get('/health');

    expect(typeof res.body.timestamp).toBe('number');
    expect(typeof res.body.uptime).toBe('number');
    expect(['healthy', 'degraded']).toContain(res.body.status);
  });
});

describe('Basic Routes', () => {
  it('GET / should redirect to /products', async () => {
    const res = await request(app).get('/');

    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toBe('/products');
  });

  it('GET /login should return 200', async () => {
    const res = await request(app).get('/login');

    expect(res.statusCode).toBe(200);
  });

  it('GET /register should return 200', async () => {
    const res = await request(app).get('/register');

    expect(res.statusCode).toBe(200);
  });

  it('GET /nonexistent should return 404', async () => {
    const res = await request(app).get('/this-page-does-not-exist');

    expect(res.statusCode).toBe(404);
  });

  it('GET /cart should redirect to /login when not authenticated', async () => {
    const res = await request(app).get('/cart');

    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toBe('/login');
  });

  it('GET /admin/products should redirect when not authenticated', async () => {
    const res = await request(app).get('/admin/products');

    expect(res.statusCode).toBe(302);
  });
});

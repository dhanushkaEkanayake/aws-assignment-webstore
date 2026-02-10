/**
 * S3 Service Unit Tests
 * ----------------------
 * Tests the S3 service functions with mocked AWS SDK calls.
 */

// Mock AWS SDK before requiring the service
jest.mock('@aws-sdk/client-s3', () => {
  const mockSend = jest.fn();
  return {
    S3Client: jest.fn(() => ({ send: mockSend })),
    PutObjectCommand: jest.fn(),
    DeleteObjectCommand: jest.fn(),
    GetObjectCommand: jest.fn(),
    ListBucketsCommand: jest.fn(),
    __mockSend: mockSend,
  };
});

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn(),
}));

// Set env vars before requiring modules
process.env.AWS_REGION = 'us-east-1';
process.env.AWS_S3_BUCKET = 'test-bucket';

const { __mockSend } = require('@aws-sdk/client-s3');
const { getSignedUrl: mockGetSignedUrl } = require('@aws-sdk/s3-request-presigner');

// Need to re-require after mocks are set up
let s3Service;
beforeAll(() => {
  jest.isolateModules(() => {
    s3Service = require('../../src/services/s3Service');
  });
});

describe('S3 Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('uploadProductImage', () => {
    it('should upload a file to S3 and return url and key', async () => {
      __mockSend.mockResolvedValue({});

      const mockFile = {
        buffer: Buffer.from('fake image data'),
        mimetype: 'image/jpeg',
        originalname: 'test-image.jpg',
      };

      const result = await s3Service.uploadProductImage(mockFile, 123);

      expect(result).toHaveProperty('url');
      expect(result).toHaveProperty('key');
      expect(result.key).toContain('products/123/');
      expect(result.key).toEndWith('.jpg');
      expect(result.url).toContain('test-bucket');
    });

    it('should throw an error when S3 upload fails', async () => {
      __mockSend.mockRejectedValue(new Error('S3 error'));

      const mockFile = {
        buffer: Buffer.from('data'),
        mimetype: 'image/png',
        originalname: 'test.png',
      };

      await expect(s3Service.uploadProductImage(mockFile, 1))
        .rejects
        .toThrow('Failed to upload image to S3');
    });
  });

  describe('deleteProductImage', () => {
    it('should delete an image from S3', async () => {
      __mockSend.mockResolvedValue({});

      await s3Service.deleteProductImage('products/1/image.jpg');

      expect(__mockSend).toHaveBeenCalled();
    });

    it('should do nothing when s3Key is null', async () => {
      await s3Service.deleteProductImage(null);
      expect(__mockSend).not.toHaveBeenCalled();
    });

    it('should not throw when S3 delete fails', async () => {
      __mockSend.mockRejectedValue(new Error('S3 error'));

      await expect(s3Service.deleteProductImage('some-key'))
        .resolves
        .toBeUndefined();
    });
  });

  describe('getPresignedUrl', () => {
    it('should generate a pre-signed URL', async () => {
      mockGetSignedUrl.mockResolvedValue('https://signed-url.example.com');

      const url = await s3Service.getPresignedUrl('products/1/image.jpg');

      expect(url).toBe('https://signed-url.example.com');
    });

    it('should return null when s3Key is null', async () => {
      const url = await s3Service.getPresignedUrl(null);
      expect(url).toBeNull();
    });

    it('should return null when pre-signed URL generation fails', async () => {
      mockGetSignedUrl.mockRejectedValue(new Error('error'));

      const url = await s3Service.getPresignedUrl('some-key');
      expect(url).toBeNull();
    });
  });
});

// Custom matcher
expect.extend({
  toEndWith(received, suffix) {
    const pass = received.endsWith(suffix);
    return {
      message: () => `expected "${received}" to end with "${suffix}"`,
      pass,
    };
  },
});

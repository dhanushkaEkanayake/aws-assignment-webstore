/**
 * Error Handler Middleware Unit Tests
 */

const errorHandler = require('../../src/middleware/errorHandler');

describe('Error Handler Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      originalUrl: '/test',
      method: 'GET',
      flash: jest.fn(),
    };
    res = {
      status: jest.fn().mockReturnThis(),
      render: jest.fn(),
      redirect: jest.fn(),
    };
    next = jest.fn();
    // Set to test environment to see error details
    process.env.NODE_ENV = 'test';
  });

  it('should handle Multer file size errors', () => {
    const err = { code: 'LIMIT_FILE_SIZE', message: 'File too large' };

    errorHandler(err, req, res, next);

    expect(req.flash).toHaveBeenCalledWith('error', expect.stringContaining('5MB'));
    expect(res.redirect).toHaveBeenCalledWith('back');
  });

  it('should handle file type errors', () => {
    const err = { message: 'Only image files (JPEG, PNG, GIF, WebP) are allowed' };

    errorHandler(err, req, res, next);

    expect(req.flash).toHaveBeenCalledWith('error', err.message);
    expect(res.redirect).toHaveBeenCalledWith('back');
  });

  it('should handle CSRF token errors', () => {
    const err = { code: 'EBADCSRFTOKEN', message: 'Invalid CSRF token' };

    errorHandler(err, req, res, next);

    expect(req.flash).toHaveBeenCalledWith('error', expect.stringContaining('form submission'));
    expect(res.redirect).toHaveBeenCalledWith('back');
  });

  it('should handle Sequelize validation errors', () => {
    const err = {
      name: 'SequelizeValidationError',
      errors: [
        { message: 'Email is required' },
        { message: 'Password too short' },
      ],
    };

    errorHandler(err, req, res, next);

    expect(req.flash).toHaveBeenCalledWith('error', 'Email is required, Password too short');
    expect(res.redirect).toHaveBeenCalledWith('back');
  });

  it('should handle generic errors with 500 status', () => {
    const err = new Error('Something broke');

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.render).toHaveBeenCalledWith('error', expect.objectContaining({
      title: 'Error',
    }));
  });

  it('should use custom status code when provided', () => {
    const err = new Error('Not found');
    err.statusCode = 404;

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
  });
});

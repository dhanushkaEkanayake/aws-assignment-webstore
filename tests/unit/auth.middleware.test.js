/**
 * Authentication Middleware Unit Tests
 * --------------------------------------
 * Tests the isAuthenticated and isAdmin middleware functions.
 */

const { isAuthenticated, isAdmin } = require('../../src/middleware/auth');

describe('Auth Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      isAuthenticated: jest.fn(),
      user: null,
      flash: jest.fn(),
    };
    res = {
      redirect: jest.fn(),
    };
    next = jest.fn();
  });

  describe('isAuthenticated', () => {
    it('should call next() when user is authenticated', () => {
      req.isAuthenticated.mockReturnValue(true);

      isAuthenticated(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.redirect).not.toHaveBeenCalled();
    });

    it('should redirect to /login when user is not authenticated', () => {
      req.isAuthenticated.mockReturnValue(false);

      isAuthenticated(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(req.flash).toHaveBeenCalledWith('error', expect.any(String));
      expect(res.redirect).toHaveBeenCalledWith('/login');
    });
  });

  describe('isAdmin', () => {
    it('should call next() when user is authenticated admin', () => {
      req.isAuthenticated.mockReturnValue(true);
      req.user = { role: 'admin', email: 'admin@test.com' };

      isAdmin(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.redirect).not.toHaveBeenCalled();
    });

    it('should redirect when user is not admin', () => {
      req.isAuthenticated.mockReturnValue(true);
      req.user = { role: 'customer', email: 'user@test.com' };

      isAdmin(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(req.flash).toHaveBeenCalledWith('error', expect.any(String));
      expect(res.redirect).toHaveBeenCalledWith('/');
    });

    it('should redirect when user is not authenticated', () => {
      req.isAuthenticated.mockReturnValue(false);
      req.user = null;

      isAdmin(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.redirect).toHaveBeenCalledWith('/');
    });
  });
});

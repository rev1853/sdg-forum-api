const request = require('supertest');

jest.mock('../services/authService', () => ({
  registerUser: jest.fn(),
  loginUser: jest.fn()
}));

jest.mock('../services/jwtService', () => ({
  signToken: jest.fn(() => 'test-token')
}));

jest.mock('../services/passwordResetService', () => ({
  requestPasswordReset: jest.fn(),
  resetPassword: jest.fn()
}));

const app = require('../app');
const authService = require('../services/authService');
const jwtService = require('../services/jwtService');
const passwordResetService = require('../services/passwordResetService');

describe('Auth routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
  });

  it('registers a user', async () => {
    authService.registerUser.mockResolvedValue({
      id: 'user-1',
      email: 'demo@example.com',
      username: 'demo',
      name: 'Demo User'
    });

    const response = await request(app).post('/auth/register').send({
      email: 'demo@example.com',
      username: 'demo',
      password: 'secret',
      name: 'Demo User'
    });

    expect(response.status).toBe(201);
    expect(authService.registerUser).toHaveBeenCalledWith({
      email: 'demo@example.com',
      username: 'demo',
      password: 'secret',
      name: 'Demo User'
    });
    expect(jwtService.signToken).toHaveBeenCalledWith({
      sub: 'user-1',
      username: 'demo'
    });
    expect(response.body).toEqual({
      user: {
        id: 'user-1',
        email: 'demo@example.com',
        username: 'demo',
        name: 'Demo User'
      },
      token: 'test-token'
    });
  });

  it('logs in a user', async () => {
    authService.loginUser.mockResolvedValue({
      id: 'user-1',
      email: 'demo@example.com',
      username: 'demo',
      name: 'Demo User'
    });

    const response = await request(app).post('/auth/login').send({
      identifier: 'demo@example.com',
      password: 'secret'
    });

    expect(response.status).toBe(200);
    expect(authService.loginUser).toHaveBeenCalledWith({
      identifier: 'demo@example.com',
      password: 'secret'
    });
    expect(jwtService.signToken).toHaveBeenCalledWith({
      sub: 'user-1',
      username: 'demo'
    });
    expect(response.body).toEqual({
      user: {
        id: 'user-1',
        email: 'demo@example.com',
        username: 'demo',
        name: 'Demo User'
      },
      token: 'test-token'
    });
  });

  it('issues a password reset token', async () => {
    passwordResetService.requestPasswordReset.mockResolvedValue({
      token: 'reset-token',
      expires_at: '2024-01-01T00:00:00.000Z',
      user: {
        id: 'user-1',
        email: 'demo@example.com',
        username: 'demo',
        name: 'Demo User'
      }
    });

    const response = await request(app).post('/auth/reset-password/request').send({
      email: 'demo@example.com'
    });

    expect(response.status).toBe(200);
    expect(passwordResetService.requestPasswordReset).toHaveBeenCalledWith('demo@example.com');
    expect(response.body).toEqual({
      message: expect.any(String),
      resetToken: 'reset-token',
      expires_at: '2024-01-01T00:00:00.000Z',
      user: {
        id: 'user-1',
        email: 'demo@example.com',
        username: 'demo',
        name: 'Demo User'
      }
    });
  });

  it('resets a password with token', async () => {
    const response = await request(app).post('/auth/reset-password/confirm').send({
      token: 'reset-token',
      password: 'new-password'
    });

    expect(response.status).toBe(200);
    expect(passwordResetService.resetPassword).toHaveBeenCalledWith({
      token: 'reset-token',
      password: 'new-password'
    });
    expect(response.body).toEqual({
      message: 'Password has been reset successfully'
    });
  });
});

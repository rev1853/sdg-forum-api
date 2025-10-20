const request = require('supertest');

jest.mock('google-auth-library', () => {
  class OAuth2Client {
    constructor() {}
    async verifyIdToken({ idToken }) {
      if (idToken === 'valid-token') {
        return {
          getPayload: () => ({
            sub: 'google-123',
            email: 'testuser@example.com',
            name: 'Test User',
            picture: 'https://example.com/avatar.png'
          })
        };
      }
      throw new Error('Invalid token');
    }
  }

  return { OAuth2Client };
});

jest.mock('../services/authService', () => ({
  registerUser: jest.fn(),
  loginUser: jest.fn()
}));

jest.mock('../services/auth/googleAuthService', () => ({
  authenticateWithGoogle: jest.fn(async (idToken) => {
    if (idToken === 'valid-token') {
      return {
        user: {
          id: 'user-1',
          email: 'testuser@example.com',
          username: 'testuser',
          name: 'Test User',
          profile_picture: null
        },
        token: 'jwt-token'
      };
    }
    const ApiError = require('../utils/ApiError');
    throw new ApiError(401, 'Invalid Google token');
  })
}));

const { authenticateWithGoogle } = require('../services/auth/googleAuthService');
const app = require('../app');

describe('Google OAuth auth route', () => {
  beforeEach(() => {
    process.env.GOOGLE_CLIENT_ID = 'dummy-client-id';
    jest.clearAllMocks();
  });

  it('rejects when idToken missing', async () => {
    const response = await request(app).post('/auth/google').send({});
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'idToken is required' });
  });

  it('rejects when token invalid', async () => {
    const response = await request(app).post('/auth/google').send({ idToken: 'bad' });
    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'Invalid Google token' });
  });

  it('returns auth payload when token valid', async () => {
    const response = await request(app).post('/auth/google').send({ idToken: 'valid-token' });

    expect(authenticateWithGoogle).toHaveBeenCalledWith('valid-token');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      user: expect.objectContaining({
        id: 'user-1',
        email: 'testuser@example.com'
      }),
      token: 'jwt-token'
    });
  });
});

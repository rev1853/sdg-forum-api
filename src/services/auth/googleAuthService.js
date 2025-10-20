const { OAuth2Client } = require('google-auth-library');
const prisma = require('../../prisma');
const ApiError = require('../../utils/ApiError');
const { signToken } = require('../jwtService');

const clientId = process.env.GOOGLE_CLIENT_ID;

if (!clientId) {
  console.warn('GOOGLE_CLIENT_ID is not set. Google OAuth will not work correctly.');
}

const oauthClient = new OAuth2Client(clientId);

const verifyGoogleIdToken = async (idToken) => {
  try {
    const ticket = await oauthClient.verifyIdToken({
      idToken,
      audience: clientId
    });
    return ticket.getPayload();
  } catch (error) {
    console.error('Failed to verify Google ID token', error);
    throw new ApiError(401, 'Invalid Google token');
  }
};

const generateUsername = async (email, googleId) => {
  const baseUsername = email.split('@')[0].toLowerCase();
  const sanitizedBase = baseUsername.replace(/[^a-z0-9_]/g, '');
  let candidate = sanitizedBase || `user_${googleId.slice(0, 8)}`;
  let suffix = 1;

  while (true) {
    const existing = await prisma.user.findUnique({ where: { username: candidate } });
    if (!existing) {
      return candidate;
    }
    suffix += 1;
    candidate = `${sanitizedBase || 'user'}_${suffix}`;
  }
};

const authenticateWithGoogle = async (idToken) => {
  if (!idToken) {
    throw new ApiError(400, 'idToken is required');
  }

  const payload = await verifyGoogleIdToken(idToken);

  if (!payload || !payload.email) {
    throw new ApiError(400, 'Google token did not contain the required information');
  }

  const googleId = payload.sub;
  const email = payload.email.toLowerCase();
  const name = payload.name || null;
  const picture = payload.picture || null;

  let user = await prisma.user.findUnique({ where: { email } });

  if (user) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        google_id: googleId,
        google_email: email,
        google_picture: picture,
        name: name || user.name
      }
    });
  } else {
    const username = await generateUsername(email, googleId);
    user = await prisma.user.create({
      data: {
        email,
        username,
        name,
        password_hash: '',
        google_id: googleId,
        google_email: email,
        google_picture: picture
      }
    });
  }

  const token = signToken({ sub: user.id, username: user.username });

  return {
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      name: user.name,
      profile_picture: user.profile_picture ?? user.google_picture
    },
    token
  };
};

module.exports = {
  authenticateWithGoogle,
  verifyGoogleIdToken
};

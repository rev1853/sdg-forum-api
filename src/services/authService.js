const bcrypt = require('bcryptjs');
const prisma = require('../prisma');
const ApiError = require('../utils/ApiError');

const normalizeEmail = (value) => value.trim().toLowerCase();
const normalizeUsername = (value) => value.trim();

const registerUser = async ({ email, username, password, name }) => {
  if (!email || !username || !password) {
    throw new ApiError(400, 'Email, username, and password are required');
  }

  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        { email: normalizeEmail(email) },
        { username: normalizeUsername(username) }
      ]
    }
  });

  if (existingUser) {
    throw new ApiError(409, 'Email or username already in use');
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email: normalizeEmail(email),
      username: normalizeUsername(username),
      name: name ? name.trim() : null,
      password_hash: passwordHash
    }
  });

  return {
    id: user.id,
    email: user.email,
    username: user.username,
    name: user.name
  };
};

const loginUser = async ({ identifier, password }) => {
  if (!identifier || !password) {
    throw new ApiError(400, 'Identifier and password are required');
  }

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: normalizeEmail(identifier) },
        { username: normalizeUsername(identifier) }
      ]
    }
  });

  if (!user) {
    throw new ApiError(401, 'Invalid credentials');
  }

  const passwordMatch = await bcrypt.compare(password, user.password_hash);

  if (!passwordMatch) {
    throw new ApiError(401, 'Invalid credentials');
  }

  return {
    id: user.id,
    email: user.email,
    username: user.username,
    name: user.name
  };
};

module.exports = {
  registerUser,
  loginUser
};

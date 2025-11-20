FROM node:18-bullseye

WORKDIR /app

# Install dependencies (including dev packages for Prisma CLI)
COPY package.json package-lock.json ./
RUN npm ci

# Generate Prisma client
COPY prisma ./prisma
RUN npx prisma generate

# Copy application source
COPY src ./src
COPY jest.config.js ./jest.config.js
COPY dummies ./dummies

# Remove development-only dependencies for a slimmer final image
RUN npm prune --omit=dev

ENV NODE_ENV=production

CMD ["node", "src/server.js"]
